// Curated allowlist of OpenRouter models exposed to managed-mode users.
// MUST stay in sync with api/src/managed-models.ts — the worker proxy
// validates incoming model IDs against the same list.

import type { ModelTier } from './classifier';

export type ManagedTier = 'cheap' | 'mid' | 'frontier';

export interface ManagedModel {
  id: string;
  label: string;
  tier: ManagedTier;
  /** OpenRouter list price per 1M input tokens (USD). Source of truth
   *  for credit reservation — see `estimateCreditsForCall`. Replaces
   *  the old flat `creditsPerCall`. */
  usdPer1MInput: number;
  /** OpenRouter list price per 1M output tokens (USD). */
  usdPer1MOutput: number;
  recommended?: boolean;
  /** Materially more expensive per-call than tier peers. UI warns. */
  expensive?: boolean;
  /** Model honors `reasoning: { effort }`. Llama / DeepSeek-V3 / Gemini-Flash ignore it. */
  supportsReasoning?: boolean;
  /** Always reasoning regardless of effort knob (DeepSeek R1, o3-pro). */
  alwaysReasons?: boolean;
  /** Subset of efforts accepted (Grok-3 omits 'medium'). */
  reasoningEfforts?: Array<'low' | 'medium' | 'high'>;
}

export const MANAGED_MODELS: ReadonlyArray<ManagedModel> = [
  // ── Cheap ─────────────────────────────────────────────────────
  { id: 'anthropic/claude-haiku-4-5',        label: 'Claude Haiku 4.5', tier: 'cheap', usdPer1MInput: 0.80, usdPer1MOutput: 4.00,  recommended: true, supportsReasoning: true, reasoningEfforts: ['low','medium','high'] },
  { id: 'google/gemini-2.5-flash',           label: 'Gemini 2.5 Flash', tier: 'cheap', usdPer1MInput: 0.30, usdPer1MOutput: 2.50,  supportsReasoning: true, reasoningEfforts: ['low','medium','high'] },
  { id: 'openai/gpt-5-mini',                 label: 'GPT-5 Mini',       tier: 'cheap', usdPer1MInput: 0.50, usdPer1MOutput: 4.00,  supportsReasoning: true, reasoningEfforts: ['low','medium','high'] },
  { id: 'deepseek/deepseek-chat',            label: 'DeepSeek V3',      tier: 'cheap', usdPer1MInput: 0.27, usdPer1MOutput: 1.10 },
  { id: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B',    tier: 'cheap', usdPer1MInput: 0.40, usdPer1MOutput: 0.40 },

  // ── Mid ───────────────────────────────────────────────────────
  { id: 'anthropic/claude-sonnet-4-6',       label: 'Claude Sonnet 4.6', tier: 'mid', usdPer1MInput: 3.00, usdPer1MOutput: 15.00, recommended: true, supportsReasoning: true, reasoningEfforts: ['low','medium','high'] },
  { id: 'openai/gpt-5',                      label: 'GPT-5',             tier: 'mid', usdPer1MInput: 5.00, usdPer1MOutput: 15.00, supportsReasoning: true, reasoningEfforts: ['low','medium','high'] },
  { id: 'google/gemini-2.5-pro',             label: 'Gemini 2.5 Pro',    tier: 'mid', usdPer1MInput: 1.25, usdPer1MOutput: 5.00,  supportsReasoning: true, reasoningEfforts: ['low','medium','high'] },
  { id: 'x-ai/grok-3',                       label: 'Grok 3',            tier: 'mid', usdPer1MInput: 3.00, usdPer1MOutput: 15.00, supportsReasoning: true, reasoningEfforts: ['low','high'] },
  { id: 'deepseek/deepseek-reasoner',        label: 'DeepSeek R1',       tier: 'mid', usdPer1MInput: 0.55, usdPer1MOutput: 2.19,  alwaysReasons: true },

  // ── Frontier ──────────────────────────────────────────────────
  // GPT-5 Pro is the new default — cheaper than Opus, comparable on
  // most tasks. Opus + o3-Pro stay available with `expensive: true`.
  { id: 'openai/gpt-5-pro',                  label: 'GPT-5 Pro',         tier: 'frontier', usdPer1MInput: 10.00, usdPer1MOutput: 40.00, recommended: true, supportsReasoning: true, reasoningEfforts: ['low','medium','high'] },
  { id: 'openai/o3-pro',                     label: 'o3 Pro',            tier: 'frontier', usdPer1MInput: 15.00, usdPer1MOutput: 60.00, alwaysReasons: true, expensive: true },
  { id: 'anthropic/claude-opus-4-6',         label: 'Claude Opus 4.6',   tier: 'frontier', usdPer1MInput: 15.00, usdPer1MOutput: 75.00, supportsReasoning: true, reasoningEfforts: ['low','medium','high'], expensive: true },
];

/** Per-credit cost basis. 1 credit = $0.005 of upstream OpenRouter spend. */
export const CREDIT_USD_VALUE = 0.005;

/** Reasoning-effort multiplier on output token reservation. */
export function reasoningOutputMultiplier(
  effort: 'low' | 'medium' | 'high' | null | undefined,
): number {
  switch (effort) {
    case 'high':   return 4;
    case 'medium': return 2;
    case 'low':    return 1.3;
    default:       return 1;
  }
}

/**
 * Estimate the per-call credit reserve from the model's real OpenRouter
 * pricing plus the prompt's input tokens and the caller's `max_tokens`
 * cap. Mirrors `api/src/managed-models.ts:estimateCreditsForCall` so the
 * desktop UI can render an inline cost preview before the user sends.
 */
export function estimateCreditsForCall(args: {
  model: ManagedModel;
  inputTokens: number;
  maxOutputTokens?: number;
  effort?: 'low' | 'medium' | 'high' | null;
}): number {
  const outputCap = args.maxOutputTokens ?? 8192;
  const reasoningMult = reasoningOutputMultiplier(args.effort);
  const usd =
    (args.inputTokens / 1_000_000) * args.model.usdPer1MInput +
    (args.maxOutputTokens === 0 ? 0 : (outputCap / 1_000_000) * args.model.usdPer1MOutput * reasoningMult);
  return Math.max(1, Math.ceil(usd / CREDIT_USD_VALUE));
}

/**
 * Pretty per-1K-token cost in **credits** (not USD). One credit = $0.005,
 * so $5/M input → 1 credit/K input. Rounds to one decimal so the UI
 * stays readable on both cheap and frontier rows.
 *
 * Example: GPT-5 ($5 in / $15 out per M) → "1 cr/K in · 3 cr/K out".
 */
export function formatCreditRate(model: ManagedModel): string {
  // (USD per 1M tokens) ÷ (USD per credit) ÷ 1000 = credits per 1K tokens
  const inRate = model.usdPer1MInput / CREDIT_USD_VALUE / 1000;
  const outRate = model.usdPer1MOutput / CREDIT_USD_VALUE / 1000;
  const fmt = (n: number) => (n >= 10 ? n.toFixed(0) : n.toFixed(1));
  return `${fmt(inRate)} cr/K in · ${fmt(outRate)} cr/K out`;
}

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
  return (id ? getManagedModel(id) : undefined) ?? recommendedForTier(tier);
}

export const DEFAULT_MANAGED_SELECTIONS: Record<ManagedTier, string> = {
  cheap: recommendedForTier('cheap').id,
  mid: recommendedForTier('mid').id,
  frontier: recommendedForTier('frontier').id,
};
