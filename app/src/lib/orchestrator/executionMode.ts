/**
 * Pack execution-mode classifier.
 *
 * Decides how a Set Run should execute given the filled prompts:
 *
 *   - `single`: collapse ALL prompts into ONE LLM call (no chain, no
 *     intermediate file artifacts). Cheapest path — one round-trip,
 *     no compounded tool-history. Only safe when the pack is pure
 *     text generation (no per-step file writes, no inter-step file
 *     reads).
 *
 *   - `chain`: existing behavior. One subtask per prompt, sequential,
 *     each step inherits prior outputs via TaskState + can read files
 *     prior steps wrote. Best for packs that build file artifacts
 *     step-by-step (Stock Analyzer pattern).
 *
 *   - `dag`: subtasks with empty `depends_on` run in parallel. Best
 *     for independent research tasks ("compare Tesla, Rivian, Lucid"
 *     → 3 independent lookups + 1 synthesis step).
 *
 * Calls free Llama 8B via the Skillset server proxy. Returns
 * `{ mode: 'chain', reason: 'fallback' }` on any failure — never blocks
 * a pack run.
 */

import { tauriFetch } from '../tauriFetch';

const SERVER_OPENAI_COMPAT_URL = 'https://api.skillset.so/v1/chat/completions';
const MODEL_ID = 'llama-3.1-8b-instant';
const TIMEOUT_MS = 5_000;

export type ExecutionMode = 'single' | 'chain' | 'dag';

export interface ExecutionDecision {
  mode: ExecutionMode;
  reason: string;
  source: 'llama' | 'fallback';
  /**
   * For DAG mode: indices of prompts that depend on the previous step
   * (so we can preserve order for the steps that need it). All other
   * indices have empty `depends_on` and run in parallel. Empty array
   * for `single` / fully-parallel.
   */
  serialIndices: number[];
}

export interface ExecutionModeArgs {
  packTitle: string;
  /** Already-filled prompt objects from `startPackRun`. */
  prompts: Array<{ text: string; header?: string }>;
  getJwt: () => Promise<string>;
  signal?: AbortSignal;
}

const SYSTEM_PROMPT = [
  'You decide HOW a multi-step Skillset pack should run. The user pays per LLM call.',
  'Each pack prompt has been written by the pack author and the variables are already',
  'filled. Your job: pick the cheapest mode that still produces correct output.',
  '',
  'Three modes:',
  '  - "single": Concatenate ALL prompts into ONE big prompt, ONE LLM call.',
  '              No intermediate file artifacts. No chain. Cheapest.',
  '              Pick this ONLY when:',
  '                * No prompt asks to "save" / "write" / "output" a file.',
  '                * No prompt says "use the X from step N".',
  '                * Each prompt could stand alone or share context trivially.',
  '              Example: "Summarize each of these three articles. Then rank them."',
  '',
  '  - "chain":  One LLM call per prompt, sequential. Step N reads files',
  '              produced by step N-1. Default for any pack that builds',
  '              file artifacts step-by-step.',
  '              Pick this when ANY prompt asks to save a file OR references',
  '              a prior step\'s output.',
  '              Example: Stock Analyzer (step 1 writes fundamentals.md,',
  '              step 2 reads it, step 3 reads both).',
  '',
  '  - "dag":    Subtasks with NO inter-step dependency run in parallel.',
  '              Pick this when prompts are independent of each other and',
  '              don\'t need ordering.',
  '              Example: "Research Tesla. Research Rivian. Research Lucid.',
  '              Then compare all three."',
  '              First 3 in parallel, last 1 depends on them.',
  '',
  'Reply STRICT JSON only:',
  '{',
  '  "mode":           "single" | "chain" | "dag",',
  '  "reason":         "short one-line explanation",',
  '  "serial_indices": number[]    // for "dag" only: prompt indices (0-based) that',
  '                                // must run AFTER all earlier prompts complete. Empty',
  '                                // array for "single" / "chain" / fully parallel.',
  '}',
  '',
  'DEFAULT BIAS: when uncertain, pick "chain". It is the most robust mode and',
  'most pack authors assume sequential file artifacts. Picking "single" wrongly',
  'breaks pack runs that build files. Picking "dag" wrongly causes parallel',
  'requests that step on each other\'s artifacts.',
].join('\n');

function buildUserMessage(args: ExecutionModeArgs): string {
  const promptList = args.prompts
    .map((p, i) => {
      const header = p.header?.trim() || `Prompt ${i + 1}`;
      return `## Prompt ${i + 1} — ${header}\n\n${p.text.trim().slice(0, 600)}`;
    })
    .join('\n\n');
  return [`# Pack: ${args.packTitle}`, '', '# Prompts', promptList].join('\n');
}

const HEURISTIC_FILE_KEYWORDS = [
  /\b(?:save|write|output|export|produce)\b[^.\n]{0,40}\.[a-z0-9]{1,8}\b/i,
  /\b(?:save|write|output)\s+(?:as|to|into)\s+[`"']?[\w./\\-]+\.[a-z0-9]{1,8}/i,
  /\b(?:save|write)\b[^.\n]{0,80}\b(?:to|in|into)\s+(?:the\s+)?workspace\b/i,
];

const HEURISTIC_DEP_KEYWORDS = [
  /\b(?:from|using|in|read)\b[^.\n]{0,40}\bstep\s*\d/i,
  /\bprior\s+(?:step|file|output)\b/i,
  /\bfrom\s+step\s+\d+\b/i,
  /\b(?:prev|previous)\s+(?:step|output)\b/i,
];

/** Local heuristic fallback when Llama is unavailable. Always returns 'chain' if any */
/** prompt smells like file-writing or step references, else 'single'. */
function heuristicMode(args: ExecutionModeArgs): ExecutionDecision {
  const flat = args.prompts.map((p) => p.text).join(' ');
  const hasFileWrite = HEURISTIC_FILE_KEYWORDS.some((rx) => rx.test(flat));
  const hasDepRef = HEURISTIC_DEP_KEYWORDS.some((rx) => rx.test(flat));
  if (hasFileWrite || hasDepRef) {
    return {
      mode: 'chain',
      reason: hasFileWrite
        ? 'heuristic: prompt mentions writing a file'
        : 'heuristic: prompt references a prior step',
      source: 'fallback',
      serialIndices: [],
    };
  }
  // Single-prompt packs run as 'single' trivially.
  if (args.prompts.length <= 1) {
    return {
      mode: 'single',
      reason: 'heuristic: only one prompt',
      source: 'fallback',
      serialIndices: [],
    };
  }
  return {
    mode: 'single',
    reason: 'heuristic: no file writes / step refs detected',
    source: 'fallback',
    serialIndices: [],
  };
}

function validate(parsed: unknown): ExecutionDecision | null {
  if (!parsed || typeof parsed !== 'object') return null;
  const p = parsed as Record<string, unknown>;
  const mode = p.mode;
  if (mode !== 'single' && mode !== 'chain' && mode !== 'dag') return null;
  const reason = typeof p.reason === 'string' ? p.reason.slice(0, 200) : '';
  const serialIndices = Array.isArray(p.serial_indices)
    ? p.serial_indices.filter((n): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0)
    : [];
  return {
    mode,
    reason,
    source: 'llama',
    serialIndices,
  };
}

export async function classifyExecutionMode(
  args: ExecutionModeArgs,
): Promise<ExecutionDecision> {
  // Trivial pack — no LLM call needed.
  if (args.prompts.length <= 1) {
    return {
      mode: 'single',
      reason: 'only one prompt',
      source: 'fallback',
      serialIndices: [],
    };
  }
  let jwt: string;
  try {
    jwt = await args.getJwt();
  } catch {
    return heuristicMode(args);
  }
  if (!jwt) return heuristicMode(args);
  const localCtrl = new AbortController();
  const timer = setTimeout(() => localCtrl.abort(), TIMEOUT_MS);
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
        model: MODEL_ID,
        max_tokens: 256,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserMessage(args) },
        ],
      }),
      signal: localCtrl.signal,
    });
    if (!res.ok) {
      console.warn(`[executionMode] llama unavailable: http_${res.status}`);
      return heuristicMode(args);
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content ?? '';
    if (!raw.trim()) return heuristicMode(args);
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.warn('[executionMode] invalid JSON, using heuristic');
      return heuristicMode(args);
    }
    const validated = validate(parsed);
    if (!validated) {
      console.warn('[executionMode] schema mismatch, using heuristic');
      return heuristicMode(args);
    }
    return validated;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return heuristicMode(args);
    }
    console.warn(
      '[executionMode] network error, using heuristic:',
      err instanceof Error ? err.message : err,
    );
    return heuristicMode(args);
  } finally {
    clearTimeout(timer);
    args.signal?.removeEventListener('abort', onParentAbort);
  }
}
