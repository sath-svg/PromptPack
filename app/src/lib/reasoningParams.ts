/**
 * Per-provider reasoning-effort parameter translation.
 *
 * The classifier (`classifierModel.ts`) emits a universal effort label
 * (`low | medium | high`). Each LLM provider exposes a different request-body
 * field for that knob:
 *
 *   - Anthropic (direct):     thinking: { type: 'enabled', budget_tokens: <int> }
 *   - OpenAI (direct):        reasoning_effort: 'low' | 'medium' | 'high'
 *                             (o-series, GPT-5; gpt-4o ignores it)
 *   - Gemini (OpenAI-compat): reasoning_effort: 'low' | 'medium' | 'high'
 *                             (gemini-2.5; gemini-2.0-flash has no reasoning)
 *   - xAI Grok:               reasoning_effort: 'low' | 'high'
 *                             (grok-3 doesn't accept 'medium' — clamped to 'high')
 *   - DeepSeek:               none — `deepseek-reasoner` always reasons
 *   - OpenRouter (unified):   reasoning: { effort: 'low' | 'medium' | 'high' }
 *   - Perplexity / Kimi /
 *     Groq / Ollama / server: no-op (current presets don't reason)
 *
 * `applyReasoning(preset, effort, body)` returns a *new* body object with the
 * provider-correct field merged in. Callers pass the result to fetch.
 *
 * Anthropic also requires `max_tokens > budget_tokens`, so the helper
 * inflates `max_tokens` when needed.
 */

import type { EffortLevel, ModelPreset } from './classifier';
import { getManagedModel } from './managed-models';

/**
 * Anthropic budget-token map. The numbers chosen match the practical
 * sweet-spots Anthropic publishes for extended thinking:
 *   low    — quick chain of thought, ~5 sec
 *   medium — multi-step reasoning, ~15 sec
 *   high   — deep proofs / refactors, ~45 sec
 */
const ANTHROPIC_BUDGET: Record<EffortLevel, number> = {
  low: 1024,
  medium: 4096,
  high: 16384,
};

/** Headroom above `budget_tokens` so the model has room for the actual answer. */
const ANTHROPIC_ANSWER_HEADROOM = 2048;

/**
 * Clamp effort to the subset the model actually accepts.
 * Grok-3 is the documented case (low/high only). Others currently accept all
 * three; declared via `preset.reasoningEfforts`.
 */
export function clampEffort(
  preset: ModelPreset,
  effort: EffortLevel,
): EffortLevel {
  const allowed = preset.reasoningEfforts;
  if (!allowed || allowed.includes(effort)) return effort;
  // Prefer the next-higher effort over the next-lower so accuracy isn't
  // silently downgraded — clamp 'medium' → 'high' on Grok-3.
  if (effort === 'medium' && allowed.includes('high')) return 'high';
  if (effort === 'medium' && allowed.includes('low')) return 'low';
  // Final fallback: pick the highest available.
  return allowed[allowed.length - 1];
}

/**
 * Returns true when the preset will *actually* honor a reasoning request.
 * `alwaysReasons` models reason regardless, but the orchestrator should
 * still treat them as reasoning-capable for tier escalation.
 */
export function isReasoningCapable(preset: ModelPreset): boolean {
  return Boolean(preset.supportsReasoning) || Boolean(preset.alwaysReasons);
}

/**
 * Merge the provider-correct reasoning fields into the request body.
 * `effort` of `null` (fast-tier prompts, or non-reasoning presets) returns
 * the body unchanged.
 */
export function applyReasoning(
  preset: ModelPreset,
  effort: EffortLevel | null,
  body: Record<string, unknown>,
): Record<string, unknown> {
  if (!effort) return body;
  if (!isReasoningCapable(preset)) return body;
  // Always-reasoning models (DeepSeek R1, Perplexity sonar-reasoning-pro)
  // don't accept an effort knob — pass body through. The model already
  // thinks unconditionally.
  if (preset.alwaysReasons) return body;

  const e = clampEffort(preset, effort);
  const m = preset.modelId;

  switch (preset.provider) {
    case 'anthropic': {
      const budget = ANTHROPIC_BUDGET[e];
      const currentMax = (body.max_tokens as number | undefined) ?? 4096;
      return {
        ...body,
        thinking: { type: 'enabled', budget_tokens: budget },
        max_tokens: Math.max(currentMax, budget + ANTHROPIC_ANSWER_HEADROOM),
      };
    }

    case 'openai': {
      // Only the o-series and gpt-5 honor `reasoning_effort`. Older models
      // (gpt-4o, gpt-4o-mini) reject the field.
      if (/^(o[1-9]|gpt-5)/i.test(m)) {
        return { ...body, reasoning_effort: e };
      }
      return body;
    }

    case 'gemini': {
      // Gemini 2.5 thinking models exposed via the OpenAI-compat endpoint.
      // 2.0-flash has no thinking surface; skip.
      if (/2\.5/.test(m)) {
        return { ...body, reasoning_effort: e };
      }
      return body;
    }

    case 'grok': {
      // Grok-3 / Grok-4 use OpenAI-compat with `reasoning_effort`.
      if (/^grok-[34]/.test(m)) {
        return { ...body, reasoning_effort: e };
      }
      return body;
    }

    case 'openrouter': {
      // OpenRouter's unified shape: it normalizes to provider-native
      // internally. Works for all reasoning-capable models in the catalog.
      return { ...body, reasoning: { effort: e } };
    }

    case 'deepseek':
    case 'perplexity':
    case 'kimi':
    case 'groq':
    case 'ollama':
    case 'server':
      return body;
  }
}

/**
 * For the managed-mode proxy (which forwards to OpenRouter under the hood):
 * the desktop app speaks OpenAI-compat to the worker, and the worker
 * forwards the unified OpenRouter shape upstream.
 *
 * Only emit `reasoning: { effort }` when the picked managed model actually
 * supports it — sending the field on a non-reasoning model (Llama 3.3,
 * DeepSeek V3) makes some upstreams 400. `alwaysReasons` models (DeepSeek
 * R1, o3-pro) ignore the effort knob, so we drop the field there too to
 * keep the payload minimal.
 */
export function managedProxyReasoning(
  managedModelId: string,
  effort: EffortLevel | null,
): { reasoning?: { effort: EffortLevel } } {
  if (!effort) return {};
  const m = getManagedModel(managedModelId);
  if (!m || !m.supportsReasoning || m.alwaysReasons) return {};
  // Clamp to the managed model's accepted set (Grok-3 has no 'medium').
  const allowed = m.reasoningEfforts;
  let e: EffortLevel = effort;
  if (allowed && !allowed.includes(e)) {
    if (e === 'medium' && allowed.includes('high')) e = 'high';
    else if (e === 'medium' && allowed.includes('low')) e = 'low';
    else e = allowed[allowed.length - 1];
  }
  return { reasoning: { effort: e } };
}
