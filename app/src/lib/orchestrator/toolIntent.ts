/**
 * Tool Intent Resolver — a single Llama 3.1 8B (Groq via Skillset server
 * proxy) JSON call per orchestrator subtask. Replaces the long-standing
 * regex-based `detectWriteFileIntent` guess with the model's read of
 * what the subtask actually needs.
 *
 * Output (`ToolIntent`):
 *   - `tools`: minimum tool subset the step requires, drawn from the
 *     supplied catalog. The agent loop filters `AGENT_TOOLS` to this
 *     list so the model can't accidentally fire `web_fetch` on a step
 *     that should only touch local files (and vice versa).
 *   - `mustWritePaths`: paths that MUST exist on disk by end of step.
 *     The agent loop tracks `wroteFiles` and engages the post-loop
 *     forced-write guard for any path still missing.
 *   - `mustReadPaths`: existing files (typically prior pack steps'
 *     outputs) the model should read before producing output. Surfaced
 *     in a "# Required reads" directive so the model verifies first.
 *
 * Failure modes degrade gracefully — Groq free-tier cap, network down,
 * invalid JSON, validation mismatch all return `source: 'fallback'`
 * with the legacy regex-derived shape. The agent loop's behavior on
 * `fallback` is identical to before this module existed.
 */

import { tauriFetch } from '../tauriFetch';
import { detectWriteFileIntent } from '../agentTools';

const SERVER_OPENAI_COMPAT_URL = 'https://api.skillset.so/v1/chat/completions';
const RESOLVER_MODEL_ID = 'llama-3.1-8b-instant';
const RESOLVER_TIMEOUT_MS = 5_000;
const RESOLVER_MAX_TOKENS = 512;

export interface ToolIntent {
  /** Subset of catalog tool names that the model should be allowed to call. */
  tools: string[];
  /** Workspace-relative paths the step is required to create / overwrite. */
  mustWritePaths: string[];
  /** Workspace-relative paths the step must read before producing output. */
  mustReadPaths: string[];
  /**
   * Cost-aware round budget. Clamped to [1, 5]. Resolver returns a
   * lower number when the step is "pure analysis using prior outputs"
   * (no real-world data lookup) vs the full 5 when web research is
   * needed. Each round resends the prompt + accumulated history, so a
   * 3-round cap on a simple step cuts ~40% input tokens.
   */
  maxRounds: number;
  /**
   * Resolver's tier recommendation. `fast` = cheap-tier model is
   * adequate (lookup / summarization / formatting). `balanced` =
   * default mid-tier needed (reasoning / synthesis). The agent loop
   * honors this as a soft hint — chatStore can downcap the routed
   * preset to the user's cheap-tier managed pick when `fast`.
   */
  suggestedTier: 'fast' | 'balanced';
  /** 'llama' = resolved via Llama 8B call; 'fallback' = network/JSON/cap failure. */
  source: 'llama' | 'fallback';
  /** When source='fallback', short reason for telemetry. Empty on llama. */
  fallbackReason?: string;
}

export interface ToolIntentArgs {
  /** Built subtask prompt (post `buildSubtaskPrompt`). */
  prompt: string;
  /** Dep id → output text; helps the resolver name paths from prior outputs. */
  depOutputs: Record<string, string>;
  /**
   * Workspace-relative paths produced by *declared dependencies* of this
   * subtask. Sourced from `TaskState.artifacts` (populated by
   * `dispatchTool` on every successful `write_file` / `pdf_generate`).
   * Resolver MUST pick `must_read_paths` from this list when the prompt
   * references a prior step's output by phrase ("the fundamentals file
   * from step 1") — without it, the resolver hallucinates a bare word
   * like "fundamentals" and the agent fires `read_file('fundamentals')`
   * → "parent dir not found".
   */
  priorArtifactPaths: string[];
  /** Tool catalog (name + one-line description) shown to the resolver. */
  toolCatalog: Array<{ name: string; description: string }>;
  /** Token resolver — fresh JWT per call (Set Runs blow past 60s Clerk lifetime). */
  getJwt: () => Promise<string>;
  signal?: AbortSignal;
}

const SYSTEM_PROMPT = [
  'You are a tool-intent + cost classifier inside the Skillset desktop app.',
  'Every step you classify runs through a managed LLM that charges per',
  'token. Each tool round resends the entire prompt + accumulated tool',
  'history, so over-budgeting rounds is the #1 cause of credit burn.',
  'Your job: pick the MINIMUM viable tool subset, write/read contracts,',
  'round budget, and tier hint for the step.',
  '',
  'Given a subtask prompt + available tools, decide:',
  '  1) The minimum tool subset the step needs to call.',
  '  2) Which file paths the step MUST write before finishing.',
  '  3) Which existing files the step MUST read first.',
  '  4) How many tool rounds are enough (1-5).',
  '  5) Whether cheap-tier is adequate ("fast") or mid-tier needed ("balanced").',
  '',
  'Reply with strict JSON only — no prose, no markdown fences:',
  '{',
  '  "tools":            string[],         // tool names from the catalog',
  '  "must_write_paths": string[],         // workspace-relative paths to write',
  '  "must_read_paths":  string[],         // workspace-relative paths to read first',
  '  "max_rounds":       1 | 2 | 3 | 4 | 5, // rounds the loop should run',
  '  "suggested_tier":   "fast" | "balanced" // cost vs. quality',
  '}',
  '',
  'HARD RULES — violating these breaks the run:',
  '- Only return tool names that exist in the catalog.',
  '- For must_read_paths: pick paths ONLY from the "# Existing files',
  '  from prior steps" list (passed in the user message). Never invent',
  '  a path. If the prompt says "the fundamentals file from step 1"',
  '  and that list contains `msci_fundamentals.md`, use the FULL path',
  '  `msci_fundamentals.md` — not the bare word "fundamentals".',
  '- For must_write_paths: pick EXACTLY the literal filename as it',
  '  appears between backticks (`like.this`) or quotes in the subtask',
  '  prompt. Strip wrapping quotes/backticks; do NOT prepend directories',
  '  the user did not type.',
  '- NEVER prepend a subtask id like `t1/`, `t2/`, `step1/` to a path.',
  '  The "## t1" headings in the prior-step outputs are subtask ids',
  '  shown for context only — they are NOT directories. Files live at',
  '  the workspace root unless the prompt explicitly names a folder.',
  '- NEVER add or change a file extension. If the prompt says `.md`,',
  '  the path ends in `.md`. Do not also list a `.pdf` version.',
  '- For each "Save as X.ext" / "Write to X.ext" / "Output X.ext"',
  '  literal mention, include that exact path in must_write_paths.',
  '  Include the matching writer tool (write_file for text, pdf_generate',
  '  for .pdf, edit_file for partial edits) in tools.',
  '- For each "read X.ext" / "using X.ext" / "from `X.ext`" literal',
  '  mention, include the EXACT path in must_read_paths and include',
  '  read_file in tools. The full filename (with extension) is required',
  '  — never a bare word.',
  '- If the step is pure analysis with no file artifacts, return empty',
  '  must_write_paths and must_read_paths. Still pick the tools you think',
  '  the model will need (e.g. web_fetch for research).',
  '',
  'COST BUDGETING:',
  '- max_rounds = 1: zero-tool steps (pure text formatting from inputs).',
  '- max_rounds = 2: single write_file with no reads, OR single read_file',
  '  with no write.',
  '- max_rounds = 3: read 1-2 files + one write. Most pack chain steps.',
  '- max_rounds = 4: same as 3 but with 1-2 web_fetch calls.',
  '- max_rounds = 5: deep research with multiple web_fetch + bash + write.',
  '  Default to LOWER values when in doubt — undershooting just makes',
  '  the loop end early; overshooting BURNS user credits.',
  '',
  '- suggested_tier = "fast": fundamentals lookup, summarization,',
  '  formatting, simple file reads. Cheap models (Haiku / Gemini Flash /',
  '  GPT-5 Mini) handle these reliably at ~10× lower cost.',
  '- suggested_tier = "balanced": multi-source synthesis, structured',
  '  reasoning, decision-making with rationale, anything calling > 3 web',
  '  fetches. Default to "balanced" when synthesis quality matters.',
].join('\n');

function buildUserMessage(args: ToolIntentArgs): string {
  const catalogLines = args.toolCatalog
    .map((t) => `- ${t.name}: ${t.description}`)
    .join('\n');
  const depSummary =
    Object.keys(args.depOutputs).length > 0
      ? Object.entries(args.depOutputs)
          .map(([id, out]) => `## ${id} output (truncated)\n${out.slice(0, 400)}`)
          .join('\n\n')
      : '(no prior step outputs)';
  const artifactList =
    args.priorArtifactPaths.length > 0
      ? args.priorArtifactPaths.map((p) => `- ${p}`).join('\n')
      : '(none — this is the first step OR no prior step wrote files)';
  return [
    '# Tool catalog',
    catalogLines,
    '',
    '# Existing files from prior steps',
    '(must_read_paths MUST come from this list)',
    artifactList,
    '',
    '# Prior step outputs (text)',
    depSummary,
    '',
    '# Subtask prompt',
    args.prompt,
  ].join('\n');
}

/** Best-effort regex-based fallback so the agent loop never blocks on resolver failure. */
function regexFallback(args: ToolIntentArgs, reason: string): ToolIntent {
  const intent = detectWriteFileIntent(args.prompt);
  const mustWritePaths =
    intent && intent !== '__implicit__' ? [intent] : [];
  return {
    tools: args.toolCatalog.map((t) => t.name),
    mustWritePaths,
    mustReadPaths: [],
    // Fallback can't reason about cost — use the prior hard-coded
    // ceiling so behavior matches pre-resolver. Tier hint defaults to
    // 'balanced' so we never accidentally downcap a complex step.
    maxRounds: 5,
    suggestedTier: 'balanced',
    source: 'fallback',
    fallbackReason: reason,
  };
}

/**
 * Strip resolver hallucinations off a raw path string:
 *   - Leading `tN/` or `stepN/` prefix (subtask-id confused as folder).
 *   - Surrounding backticks / quotes the resolver forgot to drop.
 *   - Leading `./` or `/` (workspace-relative only).
 * Returns the normalised path, or empty string when nothing survives.
 */
function normalizePath(raw: string): string {
  let p = raw.trim();
  if (!p) return '';
  // Strip backticks / quotes the resolver may have echoed.
  p = p.replace(/^[`"']+|[`"']+$/g, '');
  // Strip leading `tN/`, `stepN/`, `subtaskN/` — these come from the
  // `## t1` / `## t2` headings in the dependency outputs section.
  // They are NOT directories.
  p = p.replace(/^(?:t|step|subtask)\d+[\\/]/i, '');
  // Strip leading slash and `./` so the path is workspace-relative.
  p = p.replace(/^\.?[\\/]+/, '');
  return p;
}

/** Path looks like a real filename — has an extension, not just a bare word. */
function looksLikeFilename(p: string): boolean {
  return /\.[A-Za-z0-9]{1,8}$/.test(p);
}

function validate(
  parsed: unknown,
  catalog: Set<string>,
  priorArtifacts: string[],
  prompt: string,
): ToolIntent | null {
  if (!parsed || typeof parsed !== 'object') return null;
  const p = parsed as Record<string, unknown>;
  const toolsRaw = Array.isArray(p.tools) ? p.tools : null;
  const writesRaw = Array.isArray(p.must_write_paths) ? p.must_write_paths : null;
  const readsRaw = Array.isArray(p.must_read_paths) ? p.must_read_paths : null;
  if (!toolsRaw || !writesRaw || !readsRaw) return null;
  const tools = toolsRaw.filter(
    (t): t is string => typeof t === 'string' && catalog.has(t),
  );
  const normalizePaths = (arr: unknown[]): string[] => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const item of arr) {
      if (typeof item !== 'string') continue;
      const norm = normalizePath(item);
      if (!norm || seen.has(norm)) continue;
      seen.add(norm);
      out.push(norm);
    }
    return out;
  };
  const mustWritePaths = normalizePaths(writesRaw).filter(looksLikeFilename);
  // Constrain must_read_paths to (a) the prior-artifacts list, or (b)
  // paths the prompt literally names with an extension. Anything else
  // is a resolver hallucination ("fundamentals" without extension /
  // ticker prefix etc.) and would fire read_file with a bad path.
  const artifactSet = new Set(priorArtifacts);
  const promptMentions = new Set<string>();
  for (const m of prompt.matchAll(/[`"']([\w./\\-]+\.[\w]{1,8})[`"']/g)) {
    promptMentions.add(m[1]);
  }
  // Also accept bare-in-text mentions like `nvda_fundamentals.md` without
  // surrounding quotes.
  for (const m of prompt.matchAll(/\b([\w-]+\.[A-Za-z0-9]{1,8})\b/g)) {
    promptMentions.add(m[1]);
  }
  const mustReadPaths = normalizePaths(readsRaw).filter(
    (path) =>
      looksLikeFilename(path) &&
      (artifactSet.has(path) || promptMentions.has(path)),
  );
  // Cost knobs — clamp to safe ranges. Resolver's pick is the floor,
  // never lower than 1 round (loop must run at least once) and never
  // higher than the global MAX_TOOL_ROUNDS (5).
  const rawMaxRounds = typeof p.max_rounds === 'number' ? p.max_rounds : NaN;
  const maxRounds = Number.isFinite(rawMaxRounds)
    ? Math.max(1, Math.min(5, Math.floor(rawMaxRounds)))
    : 3;
  const suggestedTier: 'fast' | 'balanced' =
    p.suggested_tier === 'fast' ? 'fast' : 'balanced';
  // Empty tool array after filtering = the model emitted only invalid
  // names. Treat as failure so the loop falls back to full catalog.
  if (tools.length === 0) return null;
  return {
    tools,
    mustWritePaths,
    mustReadPaths,
    maxRounds,
    suggestedTier,
    source: 'llama',
  };
}

export async function resolveToolIntent(args: ToolIntentArgs): Promise<ToolIntent> {
  const catalogNames = new Set(args.toolCatalog.map((t) => t.name));

  let jwt: string;
  try {
    jwt = await args.getJwt();
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return regexFallback(args, `getJwt: ${reason}`);
  }
  if (!jwt) return regexFallback(args, 'getJwt: empty');

  // Compose a soft timeout on top of the parent signal so a 5s ceiling
  // applies even when the orchestrator's outer signal is permissive.
  const localCtrl = new AbortController();
  const timer = setTimeout(() => localCtrl.abort(), RESOLVER_TIMEOUT_MS);
  const onParentAbort = () => localCtrl.abort();
  args.signal?.addEventListener('abort', onParentAbort, { once: true });

  try {
    const res = await tauriFetch(SERVER_OPENAI_COMPAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        model: RESOLVER_MODEL_ID,
        max_tokens: RESOLVER_MAX_TOKENS,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserMessage(args) },
        ],
      }),
      signal: localCtrl.signal,
    });
    if (!res.ok) {
      // 402 / 429 / 5xx all return fallback. The agent loop continues
      // with the legacy regex-derived intent — same behavior as before
      // this module existed, just observably so.
      const reason = `http_${res.status}`;
      console.warn(`[toolIntent] resolver fallback: ${reason}`);
      return regexFallback(args, reason);
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content ?? '';
    if (!raw.trim()) return regexFallback(args, 'empty_response');
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.warn('[toolIntent] resolver fallback: invalid_json');
      return regexFallback(args, 'invalid_json');
    }
    const validated = validate(
      parsed,
      catalogNames,
      args.priorArtifactPaths,
      args.prompt,
    );
    if (!validated) {
      console.warn('[toolIntent] resolver fallback: schema_mismatch');
      return regexFallback(args, 'schema_mismatch');
    }
    return validated;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      const reason = localCtrl.signal.aborted && !args.signal?.aborted
        ? 'timeout'
        : 'aborted';
      // Don't warn on user cancel — that's expected.
      if (reason === 'timeout') console.warn('[toolIntent] resolver fallback: timeout');
      return regexFallback(args, reason);
    }
    const reason = err instanceof Error ? err.message : String(err);
    console.warn(`[toolIntent] resolver fallback: ${reason}`);
    return regexFallback(args, `network: ${reason}`);
  } finally {
    clearTimeout(timer);
    args.signal?.removeEventListener('abort', onParentAbort);
  }
}

/** Parse the `# DEPENDENCY OUTPUTS` section from a built subtask prompt. */
export function extractDepOutputsFromPrompt(prompt: string): Record<string, string> {
  const out: Record<string, string> = {};
  const m = prompt.match(/^# DEPENDENCY OUTPUTS\n([\s\S]*?)(?=\n# |$)/m);
  if (!m) return out;
  const body = m[1];
  // `## <id>\n<text>` blocks, separated by blank lines.
  const blockRe = /^## (\w+)\n([\s\S]*?)(?=\n## |\s*$)/gm;
  let block: RegExpExecArray | null;
  while ((block = blockRe.exec(body)) !== null) {
    out[block[1]] = block[2].trim();
  }
  return out;
}
