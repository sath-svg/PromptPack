/**
 * Phase 3 — LLM-tiebreaker for low-confidence LR route predictions.
 *
 * When `predictRouteWithConfidence` returns a top-class probability
 * below `FALLBACK_THRESHOLD`, the dispatcher calls the inbuilt server
 * Llama 3.1 8B with a strict-format prompt to break the tie. Free
 * (server proxy), ~150-300ms p50, only fires on ambiguous prompts (~5%
 * of typical traffic).
 *
 * The result is cached by prompt hash for the session so re-prompts
 * don't re-pay the latency.
 */

import { tauriFetch } from './tauriFetch';
import type { RouteClass } from './classifier';

const SERVER_OPENAI_COMPAT_URL = 'https://api.pmtpk.com/v1/chat/completions';
const FALLBACK_MODEL = 'llama-3.1-8b-instant';

/** Top-class probability below this triggers the LLM fallback. */
export const FALLBACK_THRESHOLD = 0.6;

const SYSTEM_PROMPT = `You are a single-purpose classifier. Given a user's prompt, output one of exactly three labels and nothing else:

- chat     : chitchat, factual lookup, single-paragraph question, simple summary, translation, rewrite. Single LLM call serves it.
- agent    : the user wants to read, edit, or run files / shell / code. Requires file or shell tools.
- workflow : multi-step pipeline that benefits from decomposition into subtasks routed to different models (research+write, draft+refine, plan+execute, compare-multiple-things-in-detail).

Output exactly one of: chat | agent | workflow

No prose, no quotes, no punctuation. Lowercase only.`;

/**
 * Cache so a re-prompt doesn't re-call the LLM. Keyed on prompt content
 * (lower-cased + trimmed). Bounded so a long session doesn't leak.
 */
const cache = new Map<string, RouteClass>();
const CACHE_LIMIT = 200;

function cacheKey(prompt: string): string {
  return prompt.trim().toLowerCase();
}

function rememberCache(key: string, value: RouteClass): void {
  if (cache.size >= CACHE_LIMIT) {
    // Drop the oldest entry. Map preserves insertion order.
    const first = cache.keys().next().value;
    if (first !== undefined) cache.delete(first);
  }
  cache.set(key, value);
}

interface FallbackDeps {
  jwt: string;
  signal?: AbortSignal;
}

/**
 * Returns the LLM's verdict, or `null` if the call fails (caller falls
 * back to the LR's original prediction). Never throws — telemetry must
 * never block a chat message.
 */
export async function llmRouteFallback(
  prompt: string,
  deps: FallbackDeps,
): Promise<RouteClass | null> {
  const key = cacheKey(prompt);
  const cached = cache.get(key);
  if (cached) return cached;

  try {
    const res = await tauriFetch(SERVER_OPENAI_COMPAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${deps.jwt}`,
      },
      body: JSON.stringify({
        model: FALLBACK_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        // Stay short. The model only needs to emit one word.
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
