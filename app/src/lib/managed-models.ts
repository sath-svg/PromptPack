// Curated allowlist of OpenRouter models exposed to managed-mode users.
// MUST stay in sync with api/src/managed-models.ts — the worker proxy
// validates incoming model IDs against the same list.

import type { ModelTier } from './classifier';

export type ManagedTier = 'cheap' | 'mid' | 'frontier';

export interface ManagedModel {
  id: string;
  label: string;
  tier: ManagedTier;
  creditsPerCall: number;
  recommended?: boolean;
}

export const MANAGED_MODELS: ReadonlyArray<ManagedModel> = [
  { id: 'anthropic/claude-haiku-4-5', label: 'Claude Haiku 4.5', tier: 'cheap', creditsPerCall: 1, recommended: true },
  { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash', tier: 'cheap', creditsPerCall: 1 },
  { id: 'openai/gpt-5-mini', label: 'GPT-5 Mini', tier: 'cheap', creditsPerCall: 1 },
  { id: 'deepseek/deepseek-chat', label: 'DeepSeek V3', tier: 'cheap', creditsPerCall: 1 },
  { id: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B', tier: 'cheap', creditsPerCall: 1 },

  { id: 'anthropic/claude-sonnet-4-6', label: 'Claude Sonnet 4.6', tier: 'mid', creditsPerCall: 5, recommended: true },
  { id: 'openai/gpt-5', label: 'GPT-5', tier: 'mid', creditsPerCall: 5 },
  { id: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro', tier: 'mid', creditsPerCall: 5 },
  { id: 'x-ai/grok-3', label: 'Grok 3', tier: 'mid', creditsPerCall: 5 },
  { id: 'deepseek/deepseek-reasoner', label: 'DeepSeek R1', tier: 'mid', creditsPerCall: 5 },

  { id: 'anthropic/claude-opus-4-6', label: 'Claude Opus 4.6', tier: 'frontier', creditsPerCall: 25, recommended: true },
  { id: 'openai/gpt-5-pro', label: 'GPT-5 Pro', tier: 'frontier', creditsPerCall: 25 },
  { id: 'openai/o3-pro', label: 'o3 Pro', tier: 'frontier', creditsPerCall: 25 },
];

export const MANAGED_TIER_LABELS: Record<ManagedTier, string> = {
  cheap: 'Cheap',
  mid: 'Mid',
  frontier: 'Frontier',
};

export const MANAGED_TIER_COLORS: Record<ManagedTier, string> = {
  cheap: 'text-green-500 bg-green-500/10',
  mid: 'text-blue-500 bg-blue-500/10',
  frontier: 'text-purple-500 bg-purple-500/10',
};

const BY_ID = new Map(MANAGED_MODELS.map((m) => [m.id, m] as const));

export function getManagedModel(id: string): ManagedModel | undefined {
  return BY_ID.get(id);
}

export function isManagedModel(id: string): boolean {
  return BY_ID.has(id);
}

export function modelsByTier(tier: ManagedTier): ManagedModel[] {
  return MANAGED_MODELS.filter((m) => m.tier === tier);
}

export function recommendedForTier(tier: ManagedTier): ManagedModel {
  return MANAGED_MODELS.find((m) => m.tier === tier && m.recommended) ?? modelsByTier(tier)[0];
}

export function classifierTierToManagedTier(classifierTier: ModelTier): ManagedTier {
  return classifierTier === 'fast' ? 'cheap' : classifierTier === 'balanced' ? 'mid' : 'frontier';
}

/** Map the existing classifier tier (fast/balanced/powerful) to a managed model. */
export function autoPickFromAllowlist(classifierTier: ModelTier): ManagedModel {
  return recommendedForTier(classifierTierToManagedTier(classifierTier));
}

/** Pick from the user's per-tier selection map, falling back to recommended. */
export function pickFromSelections(
  classifierTier: ModelTier,
  selections: Record<ManagedTier, string>,
): ManagedModel {
  const tier = classifierTierToManagedTier(classifierTier);
  const id = selections[tier];
  return (id && getManagedModel(id)) ?? recommendedForTier(tier);
}

export const DEFAULT_MANAGED_SELECTIONS: Record<ManagedTier, string> = {
  cheap: recommendedForTier('cheap').id,
  mid: recommendedForTier('mid').id,
  frontier: recommendedForTier('frontier').id,
};
