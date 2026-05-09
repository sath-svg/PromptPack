/**
 * Per-subtask router. Combines planner hints with the LR classifier output
 * to pick a `(ModelPreset, EffortLevel | null)` pair for each subtask.
 *
 * Phase 3 ships managed-mode routing only — picks from the curated
 * `MANAGED_MODELS` allowlist and returns the corresponding preset shape
 * via the bridge in `managedToPreset`.
 */

import { classifyPrompt, MODEL_PRESETS, type EffortLevel, type ModelPreset, type ModelTier } from '../classifier';
import { clampEffort } from '../reasoningParams';
import {
  pickFromSelections,
  type ManagedModel,
  type ManagedTier,
} from '../managed-models';
import type { PlannerSubtask } from './types';

export interface RouterDecision {
  preset: ModelPreset;
  managed: ManagedModel;
  effort: EffortLevel | null;
}

export interface RouterDeps {
  /** User's per-tier model selection (settings.selectedManagedModels). */
  selections: Record<ManagedTier, string>;
}

const TIER_ORDER: ModelTier[] = ['fast', 'balanced', 'powerful'];
const EFFORT_ORDER: EffortLevel[] = ['low', 'medium', 'high'];

const COMPLEXITY_TO_TIER: Record<'easy' | 'moderate' | 'complex', ModelTier> = {
  easy: 'fast',
  moderate: 'balanced',
  complex: 'powerful',
};

const REASONING_HINT_TO_EFFORT: Record<'none' | 'light' | 'deep', EffortLevel | null> = {
  none: null,
  light: 'low',
  deep: 'high',
};

function tierMax(a: ModelTier, b: ModelTier): ModelTier {
  return TIER_ORDER.indexOf(a) >= TIER_ORDER.indexOf(b) ? a : b;
}

function effortMax(a: EffortLevel | null, b: EffortLevel | null): EffortLevel | null {
  if (!a) return b;
  if (!b) return a;
  return EFFORT_ORDER.indexOf(a) >= EFFORT_ORDER.indexOf(b) ? a : b;
}

/**
 * Combine LR classifier output with planner hints. The planner's signals
 * are advisory — the router takes the **maximum** of (planner_hint,
 * lr_output) on each axis so a confident planner can escalate, but never
 * silently downgrade, the classifier's call.
 */
export function decide(subtask: PlannerSubtask, deps: RouterDeps): RouterDecision {
  const lr = classifyPrompt(subtask.instruction);

  const baseTier = tierMax(lr.tier, COMPLEXITY_TO_TIER[subtask.complexity_hint]);
  const effortFromHint = subtask.reasoning_hint
    ? REASONING_HINT_TO_EFFORT[subtask.reasoning_hint]
    : null;
  // fast tier never gets reasoning regardless of LR output or planner hint.
  let effort: EffortLevel | null = null;
  if (baseTier !== 'fast') {
    effort = effortMax(lr.effort ?? null, effortFromHint);
  }

  const managed = pickFromSelections(baseTier, deps.selections);

  // Apply per-model effort clamp (e.g. Grok-3 has no 'medium').
  const clamped = effort ? clampEffortForManaged(managed, effort) : null;

  // Map the managed model id → ModelPreset shape so downstream call helpers
  // (callPlainPreset / callOpenAICompatible) can dispatch on provider +
  // modelId. Managed mode routes through the proxy regardless, but the
  // preset object is what `applyReasoning` looks at.
  const preset = managedToPreset(managed, baseTier);

  return { preset, managed, effort: clamped };
}

/** Translate the curated managed model into a `ModelPreset`-shaped object. */
function managedToPreset(m: ManagedModel, tier: ModelTier): ModelPreset {
  // Try to find a real preset entry first so we inherit the right
  // `supportsReasoning`/`alwaysReasons`/`reasoningEfforts` flags. The OpenRouter
  // catalog uses `provider/model` ids that don't exactly match the BYOK
  // entries, so fall back to a synthesized preset.
  const direct = MODEL_PRESETS.find(
    (p) => p.modelId === m.id || p.modelId === m.id.split('/').slice(-1)[0],
  );
  if (direct) return direct;
  return {
    provider: 'openrouter',
    modelId: m.id,
    label: m.label,
    tier,
    costPer1M: 0, // unused; managed cost is computed via usdPer1MInput/Output
    supportsReasoning: m.supportsReasoning,
    reasoningEfforts: m.reasoningEfforts,
    alwaysReasons: m.alwaysReasons,
  };
}

function clampEffortForManaged(m: ManagedModel, effort: EffortLevel): EffortLevel {
  if (m.alwaysReasons) {
    // Effort knob ignored upstream, but we keep the label so the Run Trace
    // chip still renders. Pick whatever was requested.
    return effort;
  }
  if (!m.supportsReasoning) {
    // Non-reasoning models — caller should treat as null. We return the
    // requested effort here and let the executor's `reasoningParams`
    // gating drop the field.
    return effort;
  }
  // Use the same clamp helper the BYOK path uses — keeps logic in one
  // place.
  return clampEffort(
    {
      provider: 'openrouter',
      modelId: m.id,
      label: m.label,
      tier: 'balanced',
      costPer1M: 0,
      supportsReasoning: m.supportsReasoning,
      reasoningEfforts: m.reasoningEfforts,
    },
    effort,
  );
}
