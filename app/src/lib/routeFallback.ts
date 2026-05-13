/**
 * Context-aware LLM tiebreaker for LR route predictions.
 *
 * The on-device LR head outputs a soft probability over
 * `chat | agent | workflow`. When that top-class probability falls
 * under `FALLBACK_THRESHOLD`, the dispatcher calls the inbuilt server
 * Llama 3.1 8B (free) with a strict-format prompt + the last few
 * conversation turns so the model can use context the LR head's
 * bag-of-words classifier can't see (e.g. "do that for AAPL too" only
 * makes sense if the previous turn was about TSLA).
 *
 * Free (server proxy), ~150-300ms p50, fires on ambiguous prompts.
 * Result is cached per (prompt, recent-history) hash for the session.
 */

import { tauriFetch } from './tauriFetch';
import type { RouteClass } from './classifier';

const SERVER_OPENAI_COMPAT_URL = 'https://api.pmtpk.com/v1/chat/completions';
const FALLBACK_MODEL = 'llama-3.1-8b-instant';

/**
 * Top-class probability below this triggers the LLM fallback. Raised
 * from 0.6 → 0.75 so borderline-confident predictions (especially
 * `workflow`, which carries the highest cost penalty if mis-routed)
 * get a second-opinion pass with conversation context. Cost: one free
 * Llama 3.1 8B call (~150-300ms) per ambiguous prompt; cached after.
 */
export const FALLBACK_THRESHOLD = 0.75;

const SYSTEM_PROMPT = `You are a single-purpose router classifier for an AI assistant.

Given the recent conversation context AND the user's latest message, output exactly ONE of three labels:

- chat     : chitchat, factual lookup, single-paragraph question, simple summary, translation, rewrite, code explanation. ONE LLM call serves it. Use this label when the user just wants an answer in chat.
- agent    : the user wants to read, edit, or run files / shell / code. Requires file or shell tools (write_file, read_file, bash, edit_file). Use this when they say "save it to X", "put in workspace", "create a file", "run this", or refer to local files.
- workflow : a MULTI-STEP pipeline with independent subtasks that benefit from being routed to DIFFERENT models in parallel. Use this ONLY when the prompt has clear fan-out (research A AND B AND C, then synthesize) or chain (do X, then do Y, then do Z) structure that ONE big LLM call would handle worse than orchestration. NOT for simple "compare 2 things" prompts that fit in one answer.

Use conversation context to resolve references like "do that for X too" or "now save it" — they may shift the route from the user's literal text alone.

Cost rule: prefer the cheapest viable label. \`chat\` is cheapest, \`agent\` is mid, \`workflow\` is most expensive. When unsure between two, pick the cheaper one.

Output exactly one of: chat | agent | workflow

No prose, no quotes, no punctuation. Lowercase only.`;

/**
 * Cache keyed on (prompt, recent-history). Bounded so a long session
 * doesn't leak.
 */
const cache = new Map<string, RouteClass>();
const CACHE_LIMIT = 200;

function cacheKey(prompt: string, history: HistoryTurn[]): string {
  // Last two turns + current prompt is enough to discriminate without
  // ballooning cache fragmentation. Lowercase + trim so re-prompts hit.
  const recent = history.slice(-2).map((h) => `${h.role}:${h.content.slice(0, 200)}`).join('|');
  return `${recent}||${prompt.trim().toLowerCase()}`;
}

function rememberCache(key: string, value: RouteClass): void {
  if (cache.size >= CACHE_LIMIT) {
    const first = cache.keys().next().value;
    if (first !== undefined) cache.delete(first);
  }
  cache.set(key, value);
}

export interface HistoryTurn {
  role: 'user' | 'assistant';
  content: string;
}

interface FallbackDeps {
  jwt: string;
  /** Last few conversation turns. Caller passes only the trailing few; this
   *  helper truncates to its own budget. Empty array = no context (first
   *  message in a fresh session). */
  history?: HistoryTurn[];
  signal?: AbortSignal;
}

/**
 * Returns the LLM's verdict, or `null` if the call fails (caller falls
 * back to the LR's original prediction). Never throws — routing must
 * never block a chat message.
 */
export async function llmRouteFallback(
  prompt: string,
  deps: FallbackDeps,
): Promise<RouteClass | null> {
  const history = (deps.history ?? []).slice(-4); // last 4 turns max
  const key = cacheKey(prompt, history);
  const cached = cache.get(key);
  if (cached) return cached;

  try {
    const messages: { role: string; content: string }[] = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];
    if (history.length > 0) {
      // Render history as a single user-block transcript so the
      // classifier sees it as context, not as turn-order signal that
      // might confuse Llama's instruction-tuned format.
      const transcript = history
        .map((h) => `${h.role.toUpperCase()}: ${h.content.slice(0, 600)}`)
        .join('\n');
      messages.push({
        role: 'user',
        content: `Recent conversation (oldest first):\n${transcript}\n\nLatest user message:\n${prompt}`,
      });
    } else {
      messages.push({ role: 'user', content: prompt });
    }

    const res = await tauriFetch(SERVER_OPENAI_COMPAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${deps.jwt}`,
      },
      body: JSON.stringify({
        model: FALLBACK_MODEL,
        messages,
        max_tokens: 8,
        temperature: 0,
      }),
      signal: deps.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content ?? '';
    const route = parseRoute(raw);
    if (route) rememberCache(key, route);
    return route;
  } catch {
    return null;
  }
}

function parseRoute(raw: string): RouteClass | null {
  const t = raw.trim().toLowerCase().replace(/[^a-z]/g, '');
  if (t.includes('workflow')) return 'workflow';
  if (t.includes('agent')) return 'agent';
  if (t.includes('chat')) return 'chat';
  return null;
}
