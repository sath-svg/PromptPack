/**
 * Agent-style tool loop for an orchestrator subtask.
 *
 * Mirrors `runAnthropicAgent` / `runOpenAIAgent` in `chatStore.ts` but:
 *   - Builds context from the planner-supplied subtask prompt instead
 *     of the chat history.
 *   - Returns the final accumulated text + token usage instead of
 *     pushing UI blocks.
 *   - Keeps `dispatchTool` as the single source of truth for tool
 *     side-effects (file edits stage through `useAgentStore`).
 *
 * Used by `chatStore.runOrchestratorMessage` when the user has BYOK
 * keys + a workspace AND a subtask declared `needs_tools`. SkillFlow
 * thus inherits the same coding-agent loop the chat surface already
 * uses, applied per subtask.
 */

import { tauriFetch } from '../tauriFetch';
import { applyReasoning, capEffortForAgentLoop } from '../reasoningParams';
import { AGENT_TOOLS, AGENT_SYSTEM_PROMPT, dispatchTool } from '../agentTools';
import { syncCreditsFromHeaders } from '../creditSync';
import { friendlyApiError } from '../apiErrors';
import type { ModelPreset } from '../classifier';
import type { EffortLevel } from '../classifier';
import type { SubtaskRunResult } from './executor';
import {
  resolveToolIntent,
  extractDepOutputsFromPrompt,
  type ToolIntent,
} from './toolIntent';
import { useRunStore } from '../../stores/runStore';

// Hard cap on tool-loop rounds per subtask. 8 used to be the value but
// observability traces showed a Tesla / Rivian / Lucid run where a
// single subtask burned 18,000 input tokens on round 8 alone (history
// accumulates linearly so round N ≈ N × base prompt). Lowered to 5;
// any model that can't finish in 5 tool calls is almost certainly
// looping (web_fetch returning empty repeatedly, etc).
const MAX_TOOL_ROUNDS = 5;

// If the loop sees this many consecutive tool results that look empty
// or errored, give up — usually means the model is stuck in a fetch
// loop (web_fetch URL paywalled / 404'd, model retries another URL,
// repeat). Returning what we have is far cheaper than another GPT-5
// Pro round at 15K+ input tokens.
const MAX_CONSECUTIVE_EMPTY_TOOLS = 2;

/**
 * Anti-hallucination addendum appended to AGENT_SYSTEM_PROMPT for any
 * subtask running mid-chain in a Skill Flow pack (detected via
 * DEPENDENCY OUTPUTS section in the prompt). Forces the model to verify
 * prior-step artifacts via real tool calls before claiming success on
 * top of them.
 *
 * Without this, cheap-tier models (Haiku at low/medium effort) have
 * been observed hallucinating that prior step's claimed file edit
 * actually happened, then "extending" the fake edit — producing a
 * convincing success summary while no file was ever written.
 */
const SKILL_FLOW_PACK_ADDENDUM = `# Skill Flow Pack — verify before you act

You are running step N of a multi-step Skill Flow pack. A previous step's text output is shown above under "# DEPENDENCY OUTPUTS". That output may *describe* a file/artifact (e.g. "Created hello.pdf containing 'Hello'"), but text in a prior step's narration is NOT proof the artifact actually exists.

Mandatory verification protocol — before doing any of YOUR work:

1. Scan DEPENDENCY OUTPUTS for any claimed artifact (file path, generated content, written data).
2. For each claimed artifact, call \`list_dir\` (to confirm presence) OR \`read_file\` (to confirm contents) — a REAL tool call, not a guess.
3. If a claimed artifact is missing: STOP. Respond with exactly: "Step N-1 claimed to produce \`<path>\` but the file does not exist in the workspace. Halting Skill Flow." Do not attempt your own task.
4. If verification succeeds, proceed with your assigned step using the verified artifact as input.

Hard rules:
- NEVER paraphrase or extend a prior step's output as if you had read it from disk. If you didn't call \`read_file\` in THIS response, you have not read it.
- NEVER claim you "successfully edited" / "wrote" / "saved" a file unless the corresponding tool call (\`write_file\`, \`edit_file\`, \`pdf_generate\`) returned successfully in THIS response.
- A tool error or empty result is a HALT condition, not a "try again with a guess" condition.

Your one-line summary at the end must reflect what you actually did via tool calls — not the optimistic narration the prior step provided.`;

// Hard char cap on the cumulative tool-history that gets resent every
// round. Each call to OpenRouter sends `apiMessages` verbatim — when
// a subtask balloons past this, we stop adding to it and exit with
// whatever text we've got. ~60 KB ≈ 15 K tokens, well below frontier
// model context but well past the cost-effective per-call window.
const MAX_HISTORY_CHARS = 60_000;

/**
 * Wrap `tauriFetch` with a small retry on transient failures so a single
 * flaky network call doesn't kill a 5-step Set Run. Guards:
 *
 *   - Only retries when `canRetry` is true. Callers pass false once
 *     `textOut` has accumulated any text — the existing partial-text
 *     fallback at the response-handling sites takes over from there,
 *     so retrying would double-fire on the user's screen.
 *   - Retries network errors, 5xx, and 429. **Does NOT retry 402** —
 *     credit exhaustion is terminal and feeds the resume flow.
 *   - **Does NOT retry other 4xx** — permanent.
 *   - Respects AbortSignal between attempts; throws AbortError if set.
 *
 * Backoff: 500 ms, 1500 ms. Max 3 total attempts.
 */
async function fetchWithRetry(
  url: string,
  init: Parameters<typeof tauriFetch>[1],
  canRetry: boolean,
  signal?: AbortSignal,
): Promise<Response> {
  let lastErr: unknown = null;
  const attempts = canRetry ? 3 : 1;
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (signal?.aborted) {
      throw new DOMException('aborted', 'AbortError');
    }
    try {
      const res = await tauriFetch(url, init);
      if (res.ok) return res;
      // Terminal statuses — return so the caller can surface them.
      if (
        res.status === 402 ||
        (res.status >= 400 && res.status < 500 && res.status !== 429)
      ) {
        return res;
      }
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err;
      lastErr = err;
    }
    if (attempt < attempts - 1) {
      const delay = 500 + attempt * 1000;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr ?? new Error('fetch failed after retries');
}

function looksEmptyOrError(s: string): boolean {
  const trimmed = s.trim();
  if (!trimmed) return true;
  if (trimmed.length < 16 && /^\(?(empty|no\s+(matches|results)|null|n\/?a)\)?$/i.test(trimmed)) {
    return true;
  }
  return /^(?:ERROR:|HTTP\s+\d{3}\s|\[error\])/i.test(trimmed);
}

function historyChars(messages: { content?: string | null }[]): number {
  let total = 0;
  for (const m of messages) {
    if (typeof m.content === 'string') total += m.content.length;
  }
  return total;
}

interface AgentSubtaskInput {
  preset: ModelPreset;
  apiKey: string;
  workspace: string;
  prompt: string;
  effort?: EffortLevel | null;
  signal?: AbortSignal;
  /**
   * Override the base URL used by the OpenAI-compat path. Set when
   * routing through the managed proxy (`/api/llm/chat/completions`)
   * for no-BYOK users so premium managed models can run agent loops
   * with tools instead of falling to the free server Llama 8B.
   */
  urlOverride?: string;
  /**
   * Cheap-tier managed model id (e.g. user's `selections.cheap`). When
   * the resolver returns `suggestedTier: 'fast'` AND the routed preset
   * is balanced+, the agent loop swaps modelId to this id — saves
   * ~5-10× per round on lookup/summarization steps that don't need a
   * frontier model. Optional; absent = no downcap available.
   */
  cheapModelId?: string;
  /**
   * Fresh-JWT thunk used by the tool-intent resolver (Llama 8B
   * pre-call). Re-resolved per subtask so a long pack run doesn't
   * blow past the 60s Clerk-token lifetime. Optional only so existing
   * callers compile during the rollout; the orchestrator always wires
   * one in via `chatStore.runSubtask`.
   */
  getJwt?: () => Promise<string>;
  /**
   * Raw text of the workspace's `skillset.md` (when present). Injected
   * into the agent's **system prompt** as a "# Project Skill (MUST
   * FOLLOW)" block so cheap-tier models register it as a directive
   * rather than as the background recap they currently get under
   * "# CONTEXT SO FAR". Appended as a suffix to keep the static
   * AGENT_SYSTEM_PROMPT prefix cache-warm for Anthropic prompt caching.
   */
  projectInstructions?: string;
  /**
   * Identifier of the orchestrator subtask this loop is running for.
   * Plumbed through `dispatchTool` so every staged `PendingEdit` is
   * tagged with `sourceSubtaskId`. The executor's per-dep barrier
   * uses that tag to wait only on edits produced by *declared
   * dependencies*, preserving DAG fan-out for independent subtasks.
   */
  subtaskId?: string;
}

/**
 * Build the layered system prompt for the agent loop. Order matters:
 *   1. AGENT_SYSTEM_PROMPT — fully static, prefix-cacheable.
 *   2. SKILL_FLOW_PACK_ADDENDUM — only present mid-chain; mostly static.
 *   3. Project Skill (skillset.md) — per-run variable; placed last so
 *      it does NOT invalidate Anthropic's prefix-based prompt cache.
 *
 * Even though the skillBlock is last, models obey directives anywhere
 * in the system prompt — and "MUST FOLLOW" framing in a system context
 * outweighs the rolling-summary framing it had before.
 */
function buildSystemPrompt(
  basePrompt: string,
  isPackChainStep: boolean,
  projectInstructions: string | undefined,
  intent: ToolIntent | null,
): string {
  const skillBlock = projectInstructions?.trim()
    ? `# Project Skill (MUST FOLLOW)

The user defined project-specific rules in \`skillset.md\` at the workspace root. These rules override the generic guidance above and you MUST honor them in every response. Their contents are supplied below in full — do not try to re-read the file from disk.

${projectInstructions.trim()}`
    : '';
  // Resolver-derived contract: required reads + required writes. Placed
  // last (per the cache-prefix rationale above) but framed as MUST so
  // the model can't bow out with text-only when the contract demands a
  // file artifact.
  const writes = intent?.mustWritePaths ?? [];
  const reads = intent?.mustReadPaths ?? [];
  const contractParts: string[] = [];
  if (writes.length > 0) {
    contractParts.push(
      '# Required artifacts\n\n' +
        'By the end of this step you MUST write the following file(s) via `write_file` (for text) or `pdf_generate` (for `.pdf`):\n' +
        writes.map((p) => `- \`${p}\``).join('\n') +
        '\n\nThese are the contract. Do NOT stop until every path above is committed via a tool call.',
    );
  }
  if (reads.length > 0) {
    contractParts.push(
      '# Required reads\n\n' +
        'Before producing your output, call `read_file` on EACH of the following paths and ground every claim you make in their contents:\n' +
        reads.map((p) => `- \`${p}\``).join('\n'),
    );
  }
  const contract = contractParts.join('\n\n');
  return [
    basePrompt,
    isPackChainStep ? SKILL_FLOW_PACK_ADDENDUM : '',
    skillBlock,
    contract,
  ]
    .filter((s) => s.length > 0)
    .join('\n\n');
}

/**
 * Resolve tool intent once at the top of the subtask. Returns the
 * structured contract used to filter `AGENT_TOOLS`, prime the system
 * prompt with required artifacts, and drive the forced-write guard.
 * Always returns a usable shape — on resolver failure the fallback
 * carries the legacy regex-derived intent so the loop never blocks.
 */
async function resolveSubtaskIntent(input: AgentSubtaskInput): Promise<ToolIntent> {
  if (!input.getJwt) {
    // Caller didn't wire a JWT thunk — happens for legacy paths not yet
    // updated. Use the regex fallback shape directly without a network
    // round-trip.
    return {
      tools: AGENT_TOOLS.map((t) => t.name),
      mustWritePaths: [],
      mustReadPaths: [],
      maxRounds: 5,
      suggestedTier: 'balanced',
      source: 'fallback',
      fallbackReason: 'no_jwt_thunk',
    };
  }
  // Pull the workspace-relative paths produced by every prior subtask
  // out of TaskState.artifacts. dispatchTool populates this on every
  // successful write_file / pdf_generate. Without this list, the
  // resolver invents bare names like "fundamentals" for prompts that
  // say "use the fundamentals file from step 1" and the agent loop
  // fires read_file("fundamentals") → "parent dir not found".
  let priorArtifactPaths: string[] = [];
  try {
    const ts = useRunStore.getState().taskState;
    if (ts) priorArtifactPaths = ts.artifacts.map((a) => a.path);
  } catch {
    /* best-effort — empty list = resolver has no prior-files context */
  }
  const intent = await resolveToolIntent({
    prompt: input.prompt,
    depOutputs: extractDepOutputsFromPrompt(input.prompt),
    priorArtifactPaths,
    toolCatalog: AGENT_TOOLS.map((t) => ({
      name: t.name,
      description: t.description,
    })),
    getJwt: input.getJwt,
    signal: input.signal,
  });
  // Publish to runStore so the Run Trace panel can render the contract.
  if (input.subtaskId) {
    try {
      useRunStore.getState().setSubtaskIntent(input.subtaskId, intent);
    } catch {
      /* store update is best-effort */
    }
  }
  return intent;
}

/**
 * Filter the static AGENT_TOOLS catalog to the resolver-declared subset.
 * Falls back to the full catalog when the resolver returned nothing
 * usable (defensive — should never happen post-validate but cheap).
 */
function filterToolCatalog(intent: ToolIntent): typeof AGENT_TOOLS {
  if (intent.tools.length === 0) return AGENT_TOOLS;
  const allowed = new Set(intent.tools);
  const filtered = AGENT_TOOLS.filter((t) => allowed.has(t.name));
  return filtered.length > 0 ? filtered : AGENT_TOOLS;
}

export async function runAgentSubtask(input: AgentSubtaskInput): Promise<SubtaskRunResult> {
  // Frontier × high-effort × N-round tool loop = catastrophic credit
  // burn. Cap to medium for the loop; planner/router still saw the
  // original signal and may have routed away from frontier already.
  const capped: AgentSubtaskInput = {
    ...input,
    effort: capEffortForAgentLoop(input.preset, input.effort ?? null),
  };
  const intent = await resolveSubtaskIntent(capped);
  // Cost-aware tier downcap. Resolver said the step is a simple
  // lookup/summarization — swap from balanced (Sonnet/GPT-5/Gemini Pro)
  // to the cheap tier (Haiku/Flash/Mini). Same provider + URL so all
  // other plumbing stays valid; we only change which model the proxy
  // forwards to. Skip the swap when cheapModelId is missing or already
  // matches (idempotent).
  const finalInput =
    intent.suggestedTier === 'fast' &&
    capped.cheapModelId &&
    capped.cheapModelId !== capped.preset.modelId
      ? {
          ...capped,
          preset: { ...capped.preset, modelId: capped.cheapModelId, tier: 'fast' as const },
          // Cheap-tier models don't get reasoning effort budgets — skip.
          effort: null,
        }
      : capped;
  if (finalInput.preset.provider === 'anthropic') {
    return runAnthropicSubtask(finalInput, intent);
  }
  return runOpenAICompatSubtask(finalInput, intent);
}

// ─── Anthropic native tool loop ────────────────────────────────────────────

interface AnthropicContentBlock {
  type: 'text' | 'tool_use';
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
}

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string | AnthropicContentBlock[] | Array<{
    type: 'tool_result';
    tool_use_id: string;
    content: string;
    is_error?: boolean;
  }>;
}

async function runAnthropicSubtask(
  input: AgentSubtaskInput,
  intent: ToolIntent,
): Promise<SubtaskRunResult> {
  const messages: AnthropicMessage[] = [
    { role: 'user', content: input.prompt },
  ];
  let textOut = '';
  let reasoningTokens: number | undefined;
  let consecutiveEmptyRounds = 0;
  // Track every path successfully written by this subtask so the
  // post-loop guard knows which contract paths still need committing.
  // Replaces the prior single `wroteFile: boolean` — pack steps can
  // declare multiple required artifacts via the resolver.
  const wroteFiles = new Set<string>();
  const mustWritePaths = intent.mustWritePaths;
  const hasWriteIntent = mustWritePaths.length > 0;

  // Skill Flow Pack run? Detect via DEPENDENCY OUTPUTS section (memory.ts
  // only emits this when subtask has `depends_on` entries — i.e. mid-chain
  // pack steps). When detected, append the verify-before-claim addendum to
  // force the model to actually read prior-step artifacts before acting,
  // instead of hallucinating success on top of fabricated upstream output.
  // skillset.md (when present) is layered in last as a "MUST FOLLOW"
  // directive — see buildSystemPrompt for ordering rationale.
  const isPackChainStep = /^# DEPENDENCY OUTPUTS$/m.test(input.prompt);
  const systemPrompt = buildSystemPrompt(
    AGENT_SYSTEM_PROMPT,
    isPackChainStep,
    input.projectInstructions,
    intent,
  );
  // Tool catalog filtered to the resolver's declared subset. Falls
  // through to the full catalog on degenerate input — see helper.
  const activeTools = filterToolCatalog(intent);
  // Resolver-derived round budget — clamped to [1, MAX_TOOL_ROUNDS].
  // Cost-aware: lower budget = fewer compounded-history rounds = fewer
  // input tokens billed.
  const roundBudget = Math.max(1, Math.min(MAX_TOOL_ROUNDS, intent.maxRounds));

  for (let round = 0; round < roundBudget; round++) {
    if (input.signal?.aborted) {
      throw new DOMException('aborted', 'AbortError');
    }
    const baseBody: Record<string, unknown> = {
      model: input.preset.modelId,
      max_tokens: 4096,
      system: systemPrompt,
      tools: activeTools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.input_schema,
      })),
      messages,
    };
    // Force write_file as the **last-round** action when the resolver
    // declared a write contract. Unconditional — never force on round
    // 0. Forcing too early starves the model of read_file / web_fetch
    // rounds it needs to gather real data; a forced round-0 write
    // produces a file containing whatever the model knew from training,
    // skipping the lookups the prompt asked for. The post-loop guard
    // (further below) catches the case where the model ends the loop
    // without writing — that's the recovery path, not pre-emptive
    // forcing.
    const stillOweWrite = hasWriteIntent && mustWritePaths.some((p) => !wroteFiles.has(p));
    if (stillOweWrite && round === roundBudget - 1) {
      baseBody.tool_choice = { type: 'tool', name: 'write_file' };
    }
    const body = applyReasoning(input.preset, input.effort ?? null, baseBody);
    // Retry transient failures only on round 0 with empty textOut —
    // once any text has accumulated, the partial-text fallback below
    // is what should surface, not another retry loop.
    const canRetry = round === 0 && textOut.length === 0;
    const res = await fetchWithRetry(
      'https://api.anthropic.com/v1/messages',
      {
        method: 'POST',
        headers: {
          'x-api-key': input.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: input.signal,
      },
      canRetry,
      input.signal,
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      // Mid-loop errors after we already accumulated text → return what
      // we've got. Common cause: malformed tool-call args from the
      // model; the partial answer is still useful.
      if (textOut.trim().length > 0) {
        return { text: textOut, reasoningTokens };
      }
      throw new Error(`Anthropic agent error ${res.status}: ${JSON.stringify(err)}`);
    }
    const data = (await res.json()) as {
      content?: AnthropicContentBlock[];
      stop_reason?: string;
      usage?: { cache_read_input_tokens?: number; output_tokens?: number };
    };
    const content = data.content ?? [];
    const apiContent: AnthropicContentBlock[] = [];
    for (const block of content) {
      if (block.type === 'text' && block.text) {
        textOut += (textOut ? '\n' : '') + block.text;
        apiContent.push({ type: 'text', text: block.text });
      } else if (block.type === 'tool_use' && block.id && block.name) {
        apiContent.push({
          type: 'tool_use',
          id: block.id,
          name: block.name,
          input: block.input ?? {},
        });
      }
    }
    if (data.usage?.output_tokens) {
      reasoningTokens = (reasoningTokens ?? 0) + data.usage.output_tokens;
    }
    if (data.stop_reason !== 'tool_use' || apiContent.every((c) => c.type !== 'tool_use')) {
      break;
    }
    messages.push({ role: 'assistant', content: apiContent });
    const toolResults: Array<{
      type: 'tool_result';
      tool_use_id: string;
      content: string;
      is_error?: boolean;
    }> = [];
    let allEmptyThisRound = true;
    for (const block of apiContent) {
      if (block.type !== 'tool_use' || !block.id || !block.name) continue;
      try {
        const r = await dispatchTool(
          { workspace: input.workspace, subtaskId: input.subtaskId },
          block.name,
          block.input ?? {},
        );
        if (block.name === 'write_file' || block.name === 'pdf_generate') {
          const writtenPath = typeof block.input?.path === 'string' ? block.input.path : '';
          if (writtenPath) wroteFiles.add(writtenPath);
        }
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: r.output,
        });
        if (!looksEmptyOrError(r.output)) allEmptyThisRound = false;
      } catch (e) {
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: e instanceof Error ? e.message : String(e),
          is_error: true,
        });
      }
    }
    messages.push({ role: 'user', content: toolResults });
    if (allEmptyThisRound) {
      consecutiveEmptyRounds += 1;
      if (consecutiveEmptyRounds >= MAX_CONSECUTIVE_EMPTY_TOOLS) break;
    } else {
      consecutiveEmptyRounds = 0;
    }
    // Anthropic message bodies are nested arrays — fall back to a
    // rough JSON-stringify length to keep the budget check honest.
    if (JSON.stringify(messages).length > MAX_HISTORY_CHARS) break;
  }

  // Post-loop guardrail: resolver declared a write contract but the
  // model finished without committing every required path. Run one
  // forced round per missing path. Stronger than the prior single-
  // path guard because the user message now NAMES the missing path
  // explicitly instead of paraphrasing "the prompt declared a save
  // target". Closes the silent "Skill Flow done, no file on disk"
  // failure mode for multi-write packs.
  for (const missingPath of mustWritePaths) {
    if (wroteFiles.has(missingPath)) continue;
    if (input.signal?.aborted) break;
    messages.push({
      role: 'user',
      content:
        `You have not yet written \`${missingPath}\`. Commit the analysis you produced above to that exact path NOW via a single \`write_file\` call (or \`pdf_generate\` if the extension is .pdf). Do not respond with text.`,
    });
    const guardBody: Record<string, unknown> = {
      model: input.preset.modelId,
      max_tokens: 4096,
      system: systemPrompt,
      tools: activeTools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.input_schema,
      })),
      messages,
      tool_choice: { type: 'tool', name: 'write_file' },
    };
    const guardFinal = applyReasoning(input.preset, input.effort ?? null, guardBody);
    try {
      const guardRes = await fetchWithRetry(
        'https://api.anthropic.com/v1/messages',
        {
          method: 'POST',
          headers: {
            'x-api-key': input.apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify(guardFinal),
          signal: input.signal,
        },
        false,
        input.signal,
      );
      if (guardRes.ok) {
        const data = (await guardRes.json()) as {
          content?: AnthropicContentBlock[];
        };
        for (const block of data.content ?? []) {
          if (
            block.type === 'tool_use' &&
            block.id &&
            (block.name === 'write_file' || block.name === 'pdf_generate')
          ) {
            // Force-substitute the path when the model returns an
            // empty / missing path under forced tool_choice. We know
            // the exact target — `missingPath` from the resolver's
            // contract. Without this, the model emitting
            // `{ content: '...' }` (forgetting `path`) lands as
            // "ERROR: write_file received an invalid path" with no
            // recovery.
            const blockInput: Record<string, unknown> = { ...(block.input ?? {}) };
            const rawPath =
              typeof blockInput.path === 'string' ? blockInput.path.trim() : '';
            if (!rawPath) {
              blockInput.path = missingPath;
            }
            try {
              await dispatchTool(
                { workspace: input.workspace, subtaskId: input.subtaskId },
                block.name,
                blockInput,
              );
              const writtenPath =
                typeof blockInput.path === 'string' ? blockInput.path : '';
              if (writtenPath) wroteFiles.add(writtenPath);
            } catch {
              /* guardrail best-effort */
            }
          }
        }
      }
    } catch {
      /* guardrail best-effort */
    }
  }

  return { text: textOut, reasoningTokens };
}

// ─── OpenAI-compat tool loop (OpenAI / Gemini-compat / Grok / OpenRouter / Groq) ─

interface OpenAIToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: OpenAIToolCall[];
  tool_call_id?: string;
}

async function runOpenAICompatSubtask(
  input: AgentSubtaskInput,
  intent: ToolIntent,
): Promise<SubtaskRunResult> {
  const baseUrl = input.urlOverride ?? providerBaseUrl(input.preset.provider);
  // Same layered system prompt as the Anthropic path — AGENT_SYSTEM_PROMPT
  // (cache-warm), then SKILL_FLOW_PACK_ADDENDUM for mid-chain pack steps,
  // then the workspace skillset.md as a "MUST FOLLOW" directive, then
  // the resolver's contract (required artifacts + required reads). The
  // Anthropic path detected the pack-chain via the DEPENDENCY OUTPUTS
  // section in the user prompt; we mirror that here so cheap-tier
  // managed models (Haiku 4.5 / Gemini Flash / GPT-5 Mini) get the same
  // anti-hallucination scaffold the Anthropic native loop already had.
  const isPackChainStep = /^# DEPENDENCY OUTPUTS$/m.test(input.prompt);
  const systemPrompt = buildSystemPrompt(
    AGENT_SYSTEM_PROMPT,
    isPackChainStep,
    input.projectInstructions,
    intent,
  );
  const apiMessages: OpenAIMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: input.prompt },
  ];
  const extraHeaders: Record<string, string> = {};
  if (input.preset.provider === 'openrouter') {
    extraHeaders['http-referer'] = 'https://skillset.so';
    extraHeaders['x-title'] = 'Skillset';
  }
  let textOut = '';
  let reasoningTokens: number | undefined;
  let consecutiveEmptyRounds = 0;
  // Track every path successfully written by this subtask so the
  // post-loop guard knows which contract paths still need committing.
  const wroteFiles = new Set<string>();
  const mustWritePaths = intent.mustWritePaths;
  const hasWriteIntent = mustWritePaths.length > 0;
  const activeTools = filterToolCatalog(intent);
  // Resolver-derived round budget — clamped to [1, MAX_TOOL_ROUNDS].
  const roundBudget = Math.max(1, Math.min(MAX_TOOL_ROUNDS, intent.maxRounds));

  for (let round = 0; round < roundBudget; round++) {
    if (input.signal?.aborted) {
      throw new DOMException('aborted', 'AbortError');
    }
    const baseBody: Record<string, unknown> = {
      model: input.preset.modelId,
      max_tokens: 4096,
      messages: apiMessages,
      tools: activeTools.map((t) => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.input_schema,
        },
      })),
    };
    // Force write_file as the **last-round** action when the resolver
    // declared a write contract. Unconditional — never force on round
    // 0. See Anthropic-path comment for the rationale.
    const stillOweWrite = hasWriteIntent && mustWritePaths.some((p) => !wroteFiles.has(p));
    if (stillOweWrite && round === roundBudget - 1) {
      baseBody.tool_choice = { type: 'function', function: { name: 'write_file' } };
    }
    const body = applyReasoning(input.preset, input.effort ?? null, baseBody);
    // Same retry gating as the Anthropic path — see comment there.
    const canRetry = round === 0 && textOut.length === 0;
    const res = await fetchWithRetry(
      `${baseUrl}/chat/completions`,
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${input.apiKey}`,
          'content-type': 'application/json',
          ...extraHeaders,
        },
        body: JSON.stringify(body),
        signal: input.signal,
      },
      canRetry,
      input.signal,
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      // Mid-loop errors after we already accumulated text → return what
      // we've got. Common cause: malformed tool-call args from the
      // model; the partial answer is still useful.
      if (textOut.trim().length > 0) {
        return { text: textOut, reasoningTokens };
      }
      console.error('[skillflow-agent-subtask]', res.status, err);
      throw new Error(friendlyApiError(res.status, err as { code?: string; message?: string }, 'agent'));
    }
    // No-op on direct provider URLs; emits credit balance update on
    // managed-proxy responses.
    syncCreditsFromHeaders(res);
    const data = (await res.json()) as {
      choices?: Array<{ message?: OpenAIMessage }>;
      usage?: {
        completion_tokens_details?: { reasoning_tokens?: number };
      };
    };
    const reply = data.choices?.[0]?.message ?? { role: 'assistant', content: '' };
    if (reply.content) {
      textOut += (textOut ? '\n' : '') + reply.content;
    }
    if (data.usage?.completion_tokens_details?.reasoning_tokens) {
      reasoningTokens =
        (reasoningTokens ?? 0) + data.usage.completion_tokens_details.reasoning_tokens;
    }
    if (!reply.tool_calls?.length) break;

    apiMessages.push({
      role: 'assistant',
      // Empty string instead of null — see chatStore.ts comment about
      // OpenRouter's Anthropic adapter iterating `msg.content`.
      content: reply.content ?? '',
      tool_calls: reply.tool_calls,
    });
    let allEmptyThisRound = true;
    for (const tc of reply.tool_calls) {
      let parsed: Record<string, unknown> = {};
      try {
        parsed = JSON.parse(tc.function.arguments || '{}');
      } catch {
        parsed = {};
      }
      try {
        const r = await dispatchTool(
          { workspace: input.workspace, subtaskId: input.subtaskId },
          tc.function.name,
          parsed,
        );
        if (tc.function.name === 'write_file' || tc.function.name === 'pdf_generate') {
          const writtenPath = typeof parsed.path === 'string' ? parsed.path : '';
          if (writtenPath) wroteFiles.add(writtenPath);
        }
        apiMessages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: r.output,
        });
        if (!looksEmptyOrError(r.output)) allEmptyThisRound = false;
      } catch (e) {
        apiMessages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: `ERROR: ${e instanceof Error ? e.message : String(e)}`,
        });
      }
    }
    if (allEmptyThisRound) {
      consecutiveEmptyRounds += 1;
      if (consecutiveEmptyRounds >= MAX_CONSECUTIVE_EMPTY_TOOLS) {
        // Model is looping on dead tool calls — break before the
        // next round burns another big input on the same context.
        break;
      }
    } else {
      consecutiveEmptyRounds = 0;
    }
    if (historyChars(apiMessages) > MAX_HISTORY_CHARS) {
      // Cumulative history blew the budget; stop sending more tool
      // rounds and let the next/final assistant turn synthesize from
      // what's already in `textOut` plus what the model knows.
      break;
    }
  }

  // Post-loop guardrail — mirrors the Anthropic path. One forced
  // round per unwritten contract path, with the user message naming
  // the missing path explicitly. Closes the silent "Skill Flow
  // says done, no file on disk" failure mode for multi-write packs.
  for (const missingPath of mustWritePaths) {
    if (wroteFiles.has(missingPath)) continue;
    if (input.signal?.aborted) break;
    apiMessages.push({
      role: 'user',
      content:
        `You have not yet written \`${missingPath}\`. Commit the analysis you produced above to that exact path NOW via a single \`write_file\` call (or \`pdf_generate\` if the extension is .pdf). Do not respond with text.`,
    });
    const guardBody: Record<string, unknown> = {
      model: input.preset.modelId,
      max_tokens: 4096,
      messages: apiMessages,
      tools: activeTools.map((t) => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.input_schema,
        },
      })),
      tool_choice: { type: 'function', function: { name: 'write_file' } },
    };
    const guardFinal = applyReasoning(input.preset, input.effort ?? null, guardBody);
    try {
      const guardRes = await fetchWithRetry(
        `${baseUrl}/chat/completions`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${input.apiKey}`,
            'content-type': 'application/json',
            ...extraHeaders,
          },
          body: JSON.stringify(guardFinal),
          signal: input.signal,
        },
        false,
        input.signal,
      );
      if (guardRes.ok) {
        const data = (await guardRes.json()) as {
          choices?: Array<{ message?: OpenAIMessage }>;
        };
        const reply = data.choices?.[0]?.message;
        for (const tc of reply?.tool_calls ?? []) {
          if (tc.function.name !== 'write_file' && tc.function.name !== 'pdf_generate') {
            continue;
          }
          let parsed: Record<string, unknown> = {};
          try {
            parsed = JSON.parse(tc.function.arguments || '{}');
          } catch {
            parsed = {};
          }
          // Substitute the resolver's exact path when the forced
          // tool call comes back with an empty or missing `path`.
          // Mirror of the Anthropic guard logic above — see that
          // comment for the rationale.
          const rawPath =
            typeof parsed.path === 'string' ? parsed.path.trim() : '';
          if (!rawPath) {
            parsed.path = missingPath;
          }
          try {
            await dispatchTool(
              { workspace: input.workspace, subtaskId: input.subtaskId },
              tc.function.name,
              parsed,
            );
            const writtenPath = typeof parsed.path === 'string' ? parsed.path : '';
            if (writtenPath) wroteFiles.add(writtenPath);
          } catch {
            /* guardrail best-effort */
          }
        }
      }
    } catch {
      /* guardrail best-effort */
    }
  }

  return { text: textOut, reasoningTokens };
}

function providerBaseUrl(provider: ModelPreset['provider']): string {
  switch (provider) {
    case 'openai': return 'https://api.openai.com/v1';
    case 'gemini': return 'https://generativelanguage.googleapis.com/v1beta/openai';
    case 'grok': return 'https://api.x.ai/v1';
    case 'deepseek': return 'https://api.deepseek.com/v1';
    case 'groq': return 'https://api.groq.com/openai/v1';
    case 'kimi': return 'https://api.moonshot.cn/v1';
    case 'openrouter': return 'https://openrouter.ai/api/v1';
    case 'ollama': return 'http://localhost:11434/v1';
    case 'perplexity': return 'https://api.perplexity.ai';
    case 'server': return 'https://api.skillset.so/v1';
    case 'mistral': return 'https://api.mistral.ai/v1';
    case 'cohere': return 'https://api.cohere.com/compatibility/v1';
    case 'together': return 'https://api.together.xyz/v1';
    case 'fireworks': return 'https://api.fireworks.ai/inference/v1';
    case 'cerebras': return 'https://api.cerebras.ai/v1';
    case 'anthropic': return 'https://api.anthropic.com'; // unused — Anthropic path forks earlier
    case 'bedrock': return 'https://bedrock-runtime.us-east-1.amazonaws.com'; // unused — Bedrock path forks earlier (SigV4 + region-specific URL)
  }
}
