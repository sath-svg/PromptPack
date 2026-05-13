/**
 * Pack-tagged free-text extractor.
 *
 * When a user has a pack tag selected and types something into the chat
 * input ("do this for NVDA and 6 months"), they expect the pack to run
 * with their text auto-blended: variables filled from the text where
 * possible, the rest treated as extra per-run instructions on top of
 * the pack's hard-coded prompts (and any `skillset.md` already loaded).
 *
 * This module asks the free Llama 3.1 8B server endpoint to do that
 * blending in a single JSON-mode round trip. Output:
 *   { values: { var → value }, extras: "free-text adjustments" }
 *
 * Cost: ~$0 (server free tier, daily-capped). Latency: ~300ms typical.
 *
 * Failure modes are deliberately soft: any error returns
 * `{ values: {}, extras: <full input> }` so the caller can fall back to
 * the existing var-form popup with the user's text preserved as extras.
 */

import { tauriFetch } from './tauriFetch';

const SERVER_OPENAI_COMPAT_URL = 'https://api.skillset.so/v1/chat/completions';
const EXTRACTOR_MODEL = 'llama-3.1-8b-instant';

export interface PackExtractionResult {
  /** Pack variable values pulled from the user's text. Missing vars are absent. */
  values: Record<string, string>;
  /** Anything in the user's text not consumed by `values` — passes to the
   *  orchestrator as `extraContext` so every subtask sees it. */
  extras: string;
}

export async function extractPackContext(args: {
  jwt: string;
  /** Variable names declared by the pack (`{stock}`, `{duration}`, …). */
  vars: string[];
  /** Raw user text typed into the chat with the pack tag selected. */
  prompt: string;
  signal?: AbortSignal;
}): Promise<PackExtractionResult> {
  const trimmed = args.prompt.trim();
  if (!trimmed) return { values: {}, extras: '' };

  // No vars to fill → entire input is extras. Skip the LLM hop.
  if (args.vars.length === 0) {
    return { values: {}, extras: trimmed };
  }

  const system = [
    'You parse user instructions to fill in pack template variables.',
    `Variables: ${args.vars.map((v) => `{${v}}`).join(', ')}`,
    'Return strict JSON only:',
    '  { "values": { "<var>": "<value>", ... }, "extras": "<remaining instructions>" }',
    'Rules:',
    '- Only include a key in "values" if you are confident the user named that variable.',
    '- Omit the key entirely when uncertain — DO NOT invent.',
    '- "extras" is whatever instructions did not map to a variable. Empty string if none.',
    '- Do not paraphrase. Do not add commentary.',
  ].join('\n');

  try {
    const res = await tauriFetch(SERVER_OPENAI_COMPAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${args.jwt}`,
      },
      body: JSON.stringify({
        model: EXTRACTOR_MODEL,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: trimmed },
        ],
      }),
      signal: args.signal,
    });
    if (!res.ok) {
      return { values: {}, extras: trimmed };
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim() ?? '';
    if (!content) return { values: {}, extras: trimmed };
    const parsed = JSON.parse(content) as Partial<PackExtractionResult>;
    const values: Record<string, string> = {};
    if (parsed.values && typeof parsed.values === 'object') {
      for (const v of args.vars) {
        const candidate = (parsed.values as Record<string, unknown>)[v];
        if (typeof candidate === 'string' && candidate.trim()) {
          values[v] = candidate.trim();
        }
      }
    }
    const extras =
      typeof parsed.extras === 'string' ? parsed.extras.trim() : '';
    return { values, extras };
  } catch {
    // Network / parse error → return user text as extras so the caller
    // surfaces the var form with the typed text preserved.
    return { values: {}, extras: trimmed };
  }
}
