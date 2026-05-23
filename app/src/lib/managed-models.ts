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
  /**
   * Tool calling works but is unreliable on multi-turn agent loops
   * (drops mid-chain, hallucinates tool results, ignores tool_choice).
   * Fine for single-shot Q&A, risky for Skill Flow packs that chain
   * tool calls across subtasks. UI shows "tool calls: limited" amber.
   */
  toolsLimited?: boolean;
}

export const MANAGED_MODELS: ReadonlyArray<ManagedModel> = [
  // ── Cheap ─────────────────────────────────────────────────────
  // Llama 4 Scout is the new default — cheapest credible agent model
  // on OpenRouter ($0.08 / $0.30 per 1M) with 10M context. Anthropic
  // Haiku 4.5 + GPT-5 Mini stay available for users who prefer
  // frontier-lab cheap models with reasoning effort knobs.
  { id: 'meta-llama/llama-4-scout',          label: 'Llama 4 Scout',    tier: 'cheap', usdPer1MInput: 0.08, usdPer1MOutput: 0.30,  recommended: true, toolsLimited: true },
  { id: 'anthropic/claude-haiku-4-5',        label: 'Claude Haiku 4.5', tier: 'cheap', usdPer1MInput: 0.80, usdPer1MOutput: 4.00,  supportsReasoning: true, reasoningEfforts: ['low','medium','high'] },
  { id: 'google/gemini-2.5-flash',           label: 'Gemini 2.5 Flash', tier: 'cheap', usdPer1MInput: 0.30, usdPer1MOutput: 2.50,  supportsReasoning: true, reasoningEfforts: ['low','medium','high'] },
  { id: 'openai/gpt-5-mini',                 label: 'GPT-5 Mini',       tier: 'cheap', usdPer1MInput: 0.50, usdPer1MOutput: 4.00,  supportsReasoning: true, reasoningEfforts: ['low','medium','high'] },
  { id: 'deepseek/deepseek-v3.2',            label: 'DeepSeek V3.2',    tier: 'cheap', usdPer1MInput: 0.25, usdPer1MOutput: 0.38 },
  { id: 'deepseek/deepseek-chat',            label: 'DeepSeek V3',      tier: 'cheap', usdPer1MInput: 0.27, usdPer1MOutput: 1.10 },
  { id: 'minimax/minimax-m2',                label: 'MiniMax M2',       tier: 'cheap', usdPer1MInput: 0.26, usdPer1MOutput: 1.00 },
  { id: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B',    tier: 'cheap', usdPer1MInput: 0.40, usdPer1MOutput: 0.40, toolsLimited: true },

  // ── Mid ───────────────────────────────────────────────────────
  // GLM-4.6 is the new default — solid all-rounder priced ~8× below
  // Sonnet 4.6. Sonnet / GPT-5 / Gemini 2.5 Pro stay available for
  // users who want frontier-lab quality with reasoning effort knobs.
  { id: 'z-ai/glm-4.6',                      label: 'GLM 4.6',           tier: 'mid', usdPer1MInput: 0.43, usdPer1MOutput: 1.74, recommended: true },
  { id: 'anthropic/claude-sonnet-4-6',       label: 'Claude Sonnet 4.6', tier: 'mid', usdPer1MInput: 3.00, usdPer1MOutput: 15.00, supportsReasoning: true, reasoningEfforts: ['low','medium','high'] },
  { id: 'openai/gpt-5',                      label: 'GPT-5',             tier: 'mid', usdPer1MInput: 5.00, usdPer1MOutput: 15.00, supportsReasoning: true, reasoningEfforts: ['low','medium','high'] },
  { id: 'google/gemini-2.5-pro',             label: 'Gemini 2.5 Pro',    tier: 'mid', usdPer1MInput: 1.25, usdPer1MOutput: 5.00,  supportsReasoning: true, reasoningEfforts: ['low','medium','high'] },
  { id: 'deepseek/deepseek-chat-v3.1',       label: 'DeepSeek V3.1',     tier: 'mid', usdPer1MInput: 0.21, usdPer1MOutput: 0.79 },
  { id: 'deepseek/deepseek-reasoner',        label: 'DeepSeek R1',       tier: 'mid', usdPer1MInput: 0.55, usdPer1MOutput: 2.19,  alwaysReasons: true },
  { id: 'x-ai/grok-3',                       label: 'Grok 3',            tier: 'mid', usdPer1MInput: 3.00, usdPer1MOutput: 15.00, supportsReasoning: true, reasoningEfforts: ['low','high'] },

  // ── Frontier ──────────────────────────────────────────────────
  // DeepSeek V4 Pro is the new default — 1.6T MoE, 1M context, native
  // tool/function calling, matches Opus 4.6 on SWE-bench (~80.6 vs
  // 80.8) and beats it on Terminal-Bench 2.0 (67.9 vs 65.4) and
  // multi-step agent execution. Priced ~46× below GPT-5 Pro output.
  // GPT-5 Pro + Kimi K2.6 stay as alternates; Opus / o3 Pro stay
  // available with `expensive: true` so the dropdown flags cost.
  { id: 'deepseek/deepseek-v4-pro',          label: 'DeepSeek V4 Pro',                       tier: 'frontier', usdPer1MInput: 0.44, usdPer1MOutput: 0.87, recommended: true },
  { id: 'moonshotai/kimi-k2.6',              label: 'Kimi K2.6',                             tier: 'frontier', usdPer1MInput: 0.73, usdPer1MOutput: 3.49 },
  { id: 'openai/gpt-5-pro',                  label: 'GPT-5 Pro',                             tier: 'frontier', usdPer1MInput: 10.00, usdPer1MOutput: 40.00, supportsReasoning: true, reasoningEfforts: ['low','medium','high'] },
  { id: 'openai/o3-pro',                     label: "o3 Pro · ChatGPT's most powerful",       tier: 'frontier', usdPer1MInput: 15.00, usdPer1MOutput: 60.00, alwaysReasons: true, expensive: true },
  { id: 'anthropic/claude-opus-4.7',         label: 'Claude Opus 4.7',                       tier: 'frontier', usdPer1MInput: 5.00,  usdPer1MOutput: 25.00, supportsReasoning: true, reasoningEfforts: ['low','medium','high'], expensive: true },
  { id: 'anthropic/claude-opus-4-6',         label: 'Claude Opus 4.6',                       tier: 'frontier', usdPer1MInput: 15.00, usdPer1MOutput: 75.00, supportsReasoning: true, reasoningEfforts: ['low','medium','high'], expensive: true },
];

/** Per-credit cost basis (internal). */
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
 * Pretty per-1K-token cost in **credits** (not USD). Rounds to one decimal so the UI
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
  cheap: 'Fast',
  mid: 'Balanced',
  frontier: 'Powerful',
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

// ── BYOK provider → canonical (tier → model) map ──────────────────────
// Used by the prompt evaluator to surface a row for each BYOK provider
// the user has configured. Picks the provider's canonical model in the
// requested tier; providers without a model in a given tier return null.
//
// Mirrored in api/src/managed-models.ts — keep both lists in sync.
export type EvalByokProvider =
  | 'anthropic'
  | 'openai'
  | 'gemini'
  | 'grok'
  | 'deepseek'
  | 'perplexity'
  | 'kimi'
  | 'mistral'
  | 'cohere'
  | 'together'
  | 'fireworks'
  | 'cerebras'
  | 'bedrock';

export const BYOK_PROVIDER_TIER_MAP: Record<
  EvalByokProvider,
  Partial<Record<ManagedTier, { modelId: string; label: string }>>
> = {
  anthropic: {
    cheap: { modelId: 'claude-haiku-4-5', label: 'Claude Haiku' },
    mid: { modelId: 'claude-sonnet-4-6', label: 'Claude Sonnet' },
    frontier: { modelId: 'claude-opus-4-6', label: 'Claude Opus' },
  },
  openai: {
    cheap: { modelId: 'gpt-5-mini', label: 'GPT-5 Mini' },
    mid: { modelId: 'gpt-5', label: 'GPT-5' },
    frontier: { modelId: 'gpt-5-pro', label: 'GPT-5 Pro' },
  },
  gemini: {
    cheap: { modelId: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    mid: { modelId: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  },
  grok: {
    mid: { modelId: 'grok-3', label: 'Grok 3' },
  },
  deepseek: {
    cheap: { modelId: 'deepseek-chat', label: 'DeepSeek V3' },
    mid: { modelId: 'deepseek-reasoner', label: 'DeepSeek R1' },
    frontier: { modelId: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro' },
  },
  perplexity: {
    cheap: { modelId: 'sonar', label: 'Sonar' },
    mid: { modelId: 'sonar-pro', label: 'Sonar Pro' },
    frontier: { modelId: 'sonar-reasoning-pro', label: 'Sonar Reasoning' },
  },
  kimi: {
    cheap: { modelId: 'moonshot-v1-8k', label: 'Kimi 8K' },
    mid: { modelId: 'moonshot-v1-32k', label: 'Kimi 32K' },
    frontier: { modelId: 'moonshot-v1-128k', label: 'Kimi 128K' },
  },
  mistral: {
    cheap: { modelId: 'mistral-small-latest', label: 'Mistral Small' },
    mid: { modelId: 'mistral-large-latest', label: 'Mistral Large' },
  },
  cohere: {
    cheap: { modelId: 'command-r7b-12-2024', label: 'Command R7B' },
    mid: { modelId: 'command-r-plus-08-2024', label: 'Command R+' },
  },
  together: {
    mid: { modelId: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', label: 'Llama 3.3 70B Turbo' },
  },
  fireworks: {
    mid: { modelId: 'accounts/fireworks/models/llama-v3p3-70b-instruct', label: 'Llama 3.3 70B' },
  },
  cerebras: {
    cheap: { modelId: 'llama3.1-8b', label: 'Llama 3.1 8B' },
    mid: { modelId: 'llama-3.3-70b', label: 'Llama 3.3 70B' },
  },
  bedrock: {
    cheap: { modelId: 'anthropic.claude-haiku-4-5-20251001-v1:0', label: 'Claude Haiku (Bedrock)' },
    mid: { modelId: 'anthropic.claude-sonnet-4-6-20251001-v1:0', label: 'Claude Sonnet (Bedrock)' },
    frontier: { modelId: 'anthropic.claude-opus-4-6-20251001-v1:0', label: 'Claude Opus (Bedrock)' },
  },
};

export function byokModelForTier(
  provider: EvalByokProvider,
  tier: ManagedTier,
): { modelId: string; label: string } | null {
  return BYOK_PROVIDER_TIER_MAP[provider]?.[tier] ?? null;
}

/** Pretty per-provider label used in the BYOK section of the eval modal. */
export const BYOK_PROVIDER_LABELS: Record<EvalByokProvider, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  gemini: 'Google',
  grok: 'xAI',
  deepseek: 'DeepSeek',
  perplexity: 'Perplexity',
  kimi: 'Moonshot',
  mistral: 'Mistral',
  cohere: 'Cohere',
  together: 'Together',
  fireworks: 'Fireworks',
  cerebras: 'Cerebras',
  bedrock: 'AWS Bedrock',
};
