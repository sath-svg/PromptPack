/**
 * Planner LLM call — decomposes a user goal into a subtask tree.
 *
 * Phase 3 ships a single planner shape: managed-mode-only, calls
 * `callManagedProxy` with `response_format: { type: 'json_object' }` and
 * runs one repair retry on parse failure.
 *
 * The planner does NOT pick models or efforts itself. It emits hints
 * (`complexity_hint`, `reasoning_hint`) which the router combines with the
 * LR classifier to make the actual routing decision.
 */

import { tauriFetch } from '../tauriFetch';
import type { PlannerHints, PlannerOutput, PlannerSubtask } from './types';

const MANAGED_API_URL = 'https://api.pmtpk.com/api/llm/chat';
const SERVER_OPENAI_COMPAT_URL = 'https://api.pmtpk.com/v1/chat/completions';
const SERVER_PLANNER_MODEL = 'llama-3.1-8b-instant';
const DEFAULT_PLANNER_MODEL_ID = 'anthropic/claude-haiku-4-5';

/**
 * Where the planner LLM call goes.
 *
 *  - `server`  → inbuilt Skillset Groq proxy (Llama 3.1 8B). Free for the
 *                user; subject to a daily request cap. JSON reliability
 *                is ~85–90% with `response_format=json_object`, so the
 *                repair retry path matters.
 *  - `managed` → credit-metered OpenRouter via /api/llm/chat. Picks the
 *                user's `cheap` selection. Used as a fallback when the
 *                server tier is unreachable or the user explicitly opts
 *                in via `skill.plannerModelId`.
 */
export type PlannerSource = 'server' | 'managed';

const PLANNER_SYSTEM_PROMPT = `You are a workflow planner for a multi-model AI orchestrator.

Decompose the user's goal into the minimum number of subtasks needed (≤ MAX_SUBTASKS, see user message).
Each subtask must be small enough that a single LLM call can complete it. Merge trivial subtasks.
Prefer fewer steps over more.

For each subtask emit:
- "id": short snake_case id (t1, t2, ...)
- "title": ≤ 8-word phrase
- "instruction": full prompt the executor will send to the model. Must be self-contained — assume the model has only the rolling summary + listed dependency outputs available.
- "complexity_hint": one of "easy" | "moderate" | "complex"
- "reasoning_hint": one of "none" | "light" | "deep" (the router combines this with its own classifier; do not over-claim)
- "needs_tools": array of tool names the executor must enable. Allowed: ALLOWED_TOOLS (see user message). Empty if the subtask is pure text reasoning.
- "depends_on": array of earlier subtask ids whose output this subtask needs. Empty for independent subtasks.
- "produces": one of "text" | "file" | "json" | "none"

Pick a "merge" strategy:
- "concat" — paste subtask outputs in order (default for fan-out lists)
- "synthesize" — call a final synth model to weave them
- "first" — only the last leaf matters

OUTPUT JSON ONLY. No prose, no markdown fences. Match this exact schema:
{
  "goal": string,
  "subtasks": [{"id","title","instruction","complexity_hint","reasoning_hint","needs_tools","depends_on","produces"}],
  "merge": "concat" | "synthesize" | "first"
}`;

const ALLOWED_TOOLS_DEFAULT = [
  'read_file',
  'write_file',
  'edit_file',
  'list_dir',
  'glob',
  'grep',
  'bash',
  'lsp_diagnostics',
  // Phase 8 additions — listed up-front so planners learn the surface even
  // if the executor doesn't yet implement them. Subtasks needing these get
  // routed but tool calls will fail until the Rust handlers ship.
  'web_fetch',
  'http',
  'attachment_read',
];

export interface PlannerDeps {
  jwt: string;
  /** Override the source. Defaults to `'server'` (free Llama). */
  source?: PlannerSource;
  /** Override the managed model id. Only consulted when source = 'managed'. */
  modelId?: string;
  hints?: PlannerHints;
  /**
   * Workspace path the executor can read/edit. When set, the planner
   * system prompt is extended with the path + a reminder that file
   * tools (`read_file`, `glob`, `grep`, `bash`, etc.) are live, so
   * subtasks should declare those tools in `needs_tools` instead of
   * asking the user to paste content.
   */
  workspace?: string | null;
  signal?: AbortSignal;
}

export interface PlannerResult {
  output: PlannerOutput;
  /** Where the plan actually came from after any fallback. */
  source: PlannerSource;
  /** Concrete model id used (e.g. `llama-3.1-8b-instant` or `anthropic/claude-haiku-4-5`). */
  modelId: string;
}

export class PlannerError extends Error {
  public readonly stage: 'transport' | 'parse' | 'schema';
  constructor(stage: 'transport' | 'parse' | 'schema', message: string) {
    super(message);
    this.stage = stage;
    this.name = 'PlannerError';
  }
}

export async function plan(goal: string, deps: PlannerDeps): Promise<PlannerResult> {
  const source: PlannerSource = deps.source ?? 'server';
  const managedModelId = deps.modelId ?? DEFAULT_PLANNER_MODEL_ID;
  const maxSubtasks = deps.hints?.maxSubtasks ?? 8;
  const allowedTools = deps.hints?.allowedTools ?? ALLOWED_TOOLS_DEFAULT;

  const userMsg = [
    `MAX_SUBTASKS = ${maxSubtasks}`,
    `ALLOWED_TOOLS = ${JSON.stringify(allowedTools)}`,
    deps.workspace
      ? `WORKSPACE = ${deps.workspace}\n` +
        `Files inside this directory ARE accessible via the file tools at ` +
        `runtime. When a subtask needs to read or modify a file, declare ` +
        `the right tool in "needs_tools" (e.g. ["read_file"], ["edit_file"], ` +
        `["bash"]) — do NOT ask the user to paste file content.`
      : null,
    deps.hints?.seedSteps?.length
      ? `SEED_STEPS (hints from a saved skill — fold in or override as you see fit):\n${deps.hints.seedSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
      : null,
    '',
    `USER GOAL:\n${goal}`,
  ]
    .filter(Boolean)
    .join('\n');

  const messages = [
    { role: 'system', content: PLANNER_SYSTEM_PROMPT },
    { role: 'user', content: userMsg },
  ];

  // Try the requested source first; fall back to the other source on a
  // transport-class failure so a single 401 / rate-limit doesn't kill the
  // whole run. Schema/parse failures stay within the chosen source (the
  // repair retry handles those).
  const tryOrder: PlannerSource[] =
    source === 'server' ? ['server', 'managed'] : ['managed', 'server'];

  let lastErr: PlannerError | null = null;
  for (const candidate of tryOrder) {
    const concrete =
      candidate === 'server' ? SERVER_PLANNER_MODEL : managedModelId;
    try {
      const raw = await callPlannerLLM(
        candidate,
        deps.jwt,
        concrete,
        messages,
        deps.signal,
      );
      const parsed = parseAndValidate(raw, allowedTools);
      if (parsed.kind === 'ok') {
        return { output: parsed.output, source: candidate, modelId: concrete };
      }

      // One repair retry on the same source — feed the validation error
      // back so the model can correct its own output.
      const repairMessages = [
        ...messages,
        { role: 'assistant', content: raw },
        {
          role: 'user',
          content: `Your previous response failed validation: ${parsed.reason}\n\nReturn JSON only matching the exact schema. No markdown fences.`,
        },
      ];
      const retry = await callPlannerLLM(
        candidate,
        deps.jwt,
        concrete,
        repairMessages,
        deps.signal,
      );
      const final = parseAndValidate(retry, allowedTools);
      if (final.kind === 'ok') {
        return { output: final.output, source: candidate, modelId: concrete };
      }
      lastErr = new PlannerError(final.stage, final.reason);
      // Schema fail on the cheap server tier → try managed cheap as a
      // fallback. Schema fail on managed → give up (managed is the
      // last resort).
      if (candidate === 'managed') break;
    } catch (e) {
      if (e instanceof PlannerError) {
        lastErr = e;
        // Transport-level failures fall through to the next source. Any
        // PlannerError reaching here is from `callPlannerLLM` so always
        // transport-class.
        continue;
      }
      throw e;
    }
  }
  throw lastErr ?? new PlannerError('schema', 'planner failed without a recorded reason');
}

async function callPlannerLLM(
  source: PlannerSource,
  jwt: string,
  modelId: string,
  messages: { role: string; content: string }[],
  signal?: AbortSignal,
): Promise<string> {
  const url = source === 'server' ? SERVER_OPENAI_COMPAT_URL : MANAGED_API_URL;
  const res = await tauriFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      // OpenAI-compatible JSON-mode hint. Groq honors it on the server
      // path; OpenRouter forwards it on the managed path.
      response_format: { type: 'json_object' },
    }),
    signal,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 401) {
      throw new PlannerError(
        'transport',
        'session expired — sign in again to use the workflow runner',
      );
    }
    if (res.status === 402) {
      throw new PlannerError(
        'transport',
        'insufficient credits — top up to run this workflow',
      );
    }
    if (res.status === 429) {
      throw new PlannerError(
        'transport',
        `rate-limited on ${source} planner — retrying via fallback if available`,
      );
    }
    throw new PlannerError(
      'transport',
      `Planner LLM error ${res.status} (${source}): ${JSON.stringify(err)}`,
    );
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content ?? '';
}

type ParseResult =
  | { kind: 'ok'; output: PlannerOutput }
  | { kind: 'err'; stage: 'parse' | 'schema'; reason: string };

function parseAndValidate(raw: string, allowedTools: string[]): ParseResult {
  const stripped = stripFences(raw).trim();
  let json: unknown;
  try {
    json = JSON.parse(stripped);
  } catch (e) {
    return { kind: 'err', stage: 'parse', reason: (e as Error).message };
  }
  if (!isObject(json)) {
    return { kind: 'err', stage: 'schema', reason: 'top-level not an object' };
  }
  const goal = json.goal;
  const merge = json.merge;
  const subtasks = json.subtasks;

  if (typeof goal !== 'string') {
    return { kind: 'err', stage: 'schema', reason: 'goal missing or not string' };
  }
  if (merge !== 'concat' && merge !== 'synthesize' && merge !== 'first') {
    return { kind: 'err', stage: 'schema', reason: `merge invalid: ${String(merge)}` };
  }
  if (!Array.isArray(subtasks) || subtasks.length === 0) {
    return { kind: 'err', stage: 'schema', reason: 'subtasks empty' };
  }

  const validated: PlannerSubtask[] = [];
  const allowed = new Set(allowedTools);
  for (let i = 0; i < subtasks.length; i++) {
    const s = subtasks[i];
    if (!isObject(s)) {
      return { kind: 'err', stage: 'schema', reason: `subtask[${i}] not an object` };
    }
    if (typeof s.id !== 'string' || typeof s.title !== 'string' || typeof s.instruction !== 'string') {
      return { kind: 'err', stage: 'schema', reason: `subtask[${i}] missing core fields` };
    }
    if (!['easy', 'moderate', 'complex'].includes(String(s.complexity_hint))) {
      return {
        kind: 'err',
        stage: 'schema',
        reason: `subtask[${i}] complexity_hint invalid`,
      };
    }
    const reasoning = s.reasoning_hint ?? 'none';
    if (!['none', 'light', 'deep'].includes(String(reasoning))) {
      return {
        kind: 'err',
        stage: 'schema',
        reason: `subtask[${i}] reasoning_hint invalid`,
      };
    }
    const tools = Array.isArray(s.needs_tools) ? s.needs_tools.map(String) : [];
    for (const t of tools) {
      if (!allowed.has(t)) {
        return {
          kind: 'err',
          stage: 'schema',
          reason: `subtask[${i}] uses disallowed tool: ${t}`,
        };
      }
    }
    const deps = Array.isArray(s.depends_on) ? s.depends_on.map(String) : [];
    if (!['text', 'file', 'json', 'none'].includes(String(s.produces))) {
      return {
        kind: 'err',
        stage: 'schema',
        reason: `subtask[${i}] produces invalid`,
      };
    }
    validated.push({
      id: s.id,
      title: s.title,
      instruction: s.instruction,
      complexity_hint: s.complexity_hint as PlannerSubtask['complexity_hint'],
      reasoning_hint: reasoning as PlannerSubtask['reasoning_hint'],
      needs_tools: tools,
      depends_on: deps,
      produces: s.produces as PlannerSubtask['produces'],
    });
  }

  // Verify depends_on edges all reference earlier ids — keeps the DAG
  // executable in topological order without cycle detection.
  const seen = new Set<string>();
  for (const s of validated) {
    for (const d of s.depends_on) {
      if (!seen.has(d)) {
        return {
          kind: 'err',
          stage: 'schema',
          reason: `${s.id} depends on unknown or future subtask ${d}`,
        };
      }
    }
    seen.add(s.id);
  }

  return {
    kind: 'ok',
    output: { goal, subtasks: validated, merge },
  };
}

function stripFences(s: string): string {
  // Tolerate ```json ... ``` or ``` ... ``` wrapping.
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/m;
  const m = s.trim().match(fence);
  return m ? m[1] : s;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
