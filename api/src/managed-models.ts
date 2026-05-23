// Curated allowlist of OpenRouter models exposed to managed-mode users.
// Single source of truth for both the Workers proxy (api/src/llm.ts) and the
// desktop app (app/src/lib/managed-models.ts) — keep the two files in sync.
//
// Pricing model:
//   1 credit = $0.005 OpenRouter cost budget (75% gross margin floor against
//   $0.02 retail per credit).
//
// Reservation:
//   Worker estimates the credit hold from the prompt's input-token count
//   plus the configured `max_tokens` cap, multiplied by the model's
//   per-million prices and a reasoning multiplier. Settle uses the actual
//   `usage.cost` returned by OpenRouter, so over-estimates are refunded
//   automatically.

export type ManagedTier = "cheap" | "mid" | "frontier";

export interface ManagedModel {
  /** OpenRouter model identifier (e.g. "anthropic/claude-sonnet-4-6"). */
  id: string;
  /** User-facing label. */
  label: string;
  tier: ManagedTier;
  /**
   * OpenRouter list price per 1M input tokens (USD). Used to size the
   * per-call credit reserve. Source: openrouter.ai/models. Update when
   * upstream pricing changes.
   */
  usdPer1MInput: number;
  /** OpenRouter list price per 1M output tokens (USD). */
  usdPer1MOutput: number;
  /** First "Recommended" pick within its tier. */
  recommended?: boolean;
  /**
   * Model is materially more expensive per-call than its tier peers and
   * the desktop UI should warn the user before they pick it. Reserved
   * for the highest-cost frontier models (Opus, GPT-5-Pro, o3-Pro).
   */
  expensive?: boolean;
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
  { id: "meta-llama/llama-4-scout",          label: "Llama 4 Scout",    tier: "cheap", usdPer1MInput: 0.08, usdPer1MOutput: 0.30, recommended: true, toolsLimited: true },
  { id: "anthropic/claude-haiku-4-5",        label: "Claude Haiku 4.5", tier: "cheap", usdPer1MInput: 0.80, usdPer1MOutput: 4.00 },
  { id: "google/gemini-2.5-flash",           label: "Gemini 2.5 Flash", tier: "cheap", usdPer1MInput: 0.30, usdPer1MOutput: 2.50 },
  { id: "openai/gpt-5-mini",                 label: "GPT-5 Mini",       tier: "cheap", usdPer1MInput: 0.50, usdPer1MOutput: 4.00 },
  { id: "deepseek/deepseek-v3.2",            label: "DeepSeek V3.2",    tier: "cheap", usdPer1MInput: 0.25, usdPer1MOutput: 0.38 },
  { id: "deepseek/deepseek-chat",            label: "DeepSeek V3",      tier: "cheap", usdPer1MInput: 0.27, usdPer1MOutput: 1.10 },
  { id: "minimax/minimax-m2",                label: "MiniMax M2",       tier: "cheap", usdPer1MInput: 0.26, usdPer1MOutput: 1.00 },
  { id: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B",    tier: "cheap", usdPer1MInput: 0.40, usdPer1MOutput: 0.40, toolsLimited: true },

  // ── Mid ────────────────────────────────────────────────────────
  // GLM-4.6 is the new default — solid all-rounder priced ~8× below
  // Sonnet 4.6. Sonnet / GPT-5 / Gemini 2.5 Pro stay available for
  // users who want frontier-lab quality with reasoning effort knobs.
  { id: "z-ai/glm-4.6",                      label: "GLM 4.6",           tier: "mid", usdPer1MInput: 0.43, usdPer1MOutput: 1.74, recommended: true },
  { id: "anthropic/claude-sonnet-4-6",       label: "Claude Sonnet 4.6", tier: "mid", usdPer1MInput: 3.00,  usdPer1MOutput: 15.00 },
  { id: "openai/gpt-5",                      label: "GPT-5",             tier: "mid", usdPer1MInput: 5.00,  usdPer1MOutput: 15.00 },
  { id: "google/gemini-2.5-pro",             label: "Gemini 2.5 Pro",    tier: "mid", usdPer1MInput: 1.25,  usdPer1MOutput: 5.00 },
  { id: "deepseek/deepseek-chat-v3.1",       label: "DeepSeek V3.1",     tier: "mid", usdPer1MInput: 0.21, usdPer1MOutput: 0.79 },
  { id: "deepseek/deepseek-reasoner",        label: "DeepSeek R1",       tier: "mid", usdPer1MInput: 0.55, usdPer1MOutput: 2.19 },
  { id: "x-ai/grok-3",                       label: "Grok 3",            tier: "mid", usdPer1MInput: 3.00, usdPer1MOutput: 15.00 },

  // ── Frontier ───────────────────────────────────────────────────
  // DeepSeek V4 Pro is the new default — 1.6T MoE, 1M context, native
  // tool/function calling, matches Opus 4.6 on SWE-bench (~80.6 vs
  // 80.8) and beats it on Terminal-Bench 2.0 (67.9 vs 65.4) and
  // multi-step agent execution. Priced ~46× below GPT-5 Pro output.
  // GPT-5 Pro + Kimi K2.6 stay as alternates; Opus / o3 Pro stay
  // available with `expensive: true` so the dropdown flags cost.
  { id: "deepseek/deepseek-v4-pro",          label: "DeepSeek V4 Pro",                       tier: "frontier", usdPer1MInput: 0.44, usdPer1MOutput: 0.87, recommended: true },
  { id: "moonshotai/kimi-k2.6",              label: "Kimi K2.6",                             tier: "frontier", usdPer1MInput: 0.73, usdPer1MOutput: 3.49 },
  { id: "openai/gpt-5-pro",                  label: "GPT-5 Pro",                             tier: "frontier", usdPer1MInput: 10.00, usdPer1MOutput: 40.00 },
  { id: "openai/o3-pro",                     label: "o3 Pro · ChatGPT's most powerful",       tier: "frontier", usdPer1MInput: 15.00, usdPer1MOutput: 60.00, expensive: true },
  { id: "anthropic/claude-opus-4.7",         label: "Claude Opus 4.7",                       tier: "frontier", usdPer1MInput: 5.00,  usdPer1MOutput: 25.00, expensive: true },
  { id: "anthropic/claude-opus-4-6",         label: "Claude Opus 4.6",                       tier: "frontier", usdPer1MInput: 15.00, usdPer1MOutput: 75.00, expensive: true },
];

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

/** Map the existing classifier tier (fast/balanced/powerful) to a managed model. */
export function autoPickFromAllowlist(
  classifierTier: "fast" | "balanced" | "powerful",
): ManagedModel {
  const tier: ManagedTier =
    classifierTier === "fast" ? "cheap" : classifierTier === "balanced" ? "mid" : "frontier";
  return recommendedForTier(tier);
}

// ── BYOK provider → canonical (tier → model) map ──────────────────────
// Used by /api/evaluate to surface a row for each BYOK provider the user
// has configured. Picks the provider's canonical model in the requested
// tier. Providers without a model in a given tier return null.
export type ByokProvider =
  | "anthropic"
  | "openai"
  | "gemini"
  | "grok"
  | "deepseek"
  | "perplexity"
  | "kimi"
  | "mistral"
  | "cohere"
  | "together"
  | "fireworks"
  | "cerebras"
  | "bedrock";

export const BYOK_PROVIDER_TIER_MAP: Record<
  ByokProvider,
  Partial<Record<ManagedTier, { modelId: string; label: string }>>
> = {
  anthropic: {
    cheap: { modelId: "claude-haiku-4-5", label: "Claude Haiku" },
    mid: { modelId: "claude-sonnet-4-6", label: "Claude Sonnet" },
    frontier: { modelId: "claude-opus-4-6", label: "Claude Opus" },
  },
  openai: {
    cheap: { modelId: "gpt-5-mini", label: "GPT-5 Mini" },
    mid: { modelId: "gpt-5", label: "GPT-5" },
    frontier: { modelId: "gpt-5-pro", label: "GPT-5 Pro" },
  },
  gemini: {
    cheap: { modelId: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    mid: { modelId: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  },
  grok: {
    mid: { modelId: "grok-3", label: "Grok 3" },
  },
  deepseek: {
    cheap: { modelId: "deepseek-chat", label: "DeepSeek V3" },
    mid: { modelId: "deepseek-reasoner", label: "DeepSeek R1" },
    frontier: { modelId: "deepseek-v4-pro", label: "DeepSeek V4 Pro" },
  },
  perplexity: {
    cheap: { modelId: "sonar", label: "Sonar" },
    mid: { modelId: "sonar-pro", label: "Sonar Pro" },
    frontier: { modelId: "sonar-reasoning-pro", label: "Sonar Reasoning" },
  },
  kimi: {
    cheap: { modelId: "moonshot-v1-8k", label: "Kimi 8K" },
    mid: { modelId: "moonshot-v1-32k", label: "Kimi 32K" },
    frontier: { modelId: "moonshot-v1-128k", label: "Kimi 128K" },
  },
  mistral: {
    cheap: { modelId: "mistral-small-latest", label: "Mistral Small" },
    mid: { modelId: "mistral-large-latest", label: "Mistral Large" },
  },
  cohere: {
    cheap: { modelId: "command-r7b-12-2024", label: "Command R7B" },
    mid: { modelId: "command-r-plus-08-2024", label: "Command R+" },
  },
  together: {
    mid: { modelId: "meta-llama/Llama-3.3-70B-Instruct-Turbo", label: "Llama 3.3 70B Turbo" },
  },
  fireworks: {
    mid: { modelId: "accounts/fireworks/models/llama-v3p3-70b-instruct", label: "Llama 3.3 70B" },
  },
  cerebras: {
    cheap: { modelId: "llama3.1-8b", label: "Llama 3.1 8B" },
    mid: { modelId: "llama-3.3-70b", label: "Llama 3.3 70B" },
  },
  bedrock: {
    cheap: { modelId: "anthropic.claude-haiku-4-5-20251001-v1:0", label: "Claude Haiku (Bedrock)" },
    mid: { modelId: "anthropic.claude-sonnet-4-6-20251001-v1:0", label: "Claude Sonnet (Bedrock)" },
    frontier: { modelId: "anthropic.claude-opus-4-6-20251001-v1:0", label: "Claude Opus (Bedrock)" },
  },
};

export function byokModelForTier(
  provider: ByokProvider,
  tier: ManagedTier,
): { modelId: string; label: string } | null {
  return BYOK_PROVIDER_TIER_MAP[provider]?.[tier] ?? null;
}

/**
 * Per-credit cost basis. 1 credit = $0.005 of upstream OpenRouter spend.
 * Multiply credits by this to get the dollar amount the worker is reserving.
 */
export const CREDIT_USD_VALUE = 0.005;

/**
 * Reasoning-effort multiplier on output token reservation. Reasoning
 * models emit thinking tokens that count as output for billing; high
 * effort can 4-6x output volume on the same prompt.
 */
export function reasoningOutputMultiplier(
  effort: "low" | "medium" | "high" | null | undefined,
): number {
  switch (effort) {
    case "high":
      return 4;
    case "medium":
      return 2;
    case "low":
      return 1.3;
    default:
      return 1;
  }
}

/**
 * Estimate the credit reserve for a single managed-model call. Token
 * counts come from `estimateTokens` over the request body in `llm.ts`.
 */
// Safety multiplier on the raw estimate per tier. Frontier models bill at
// 8-15x cheap rates and tend to overshoot output caps with extended
// reasoning, so we hold extra credits up-front. Settle refunds the diff
// from OpenRouter's authoritative `usage.cost`, so users only see the
// buffer if their balance is borderline.
const TIER_RESERVE_BUFFER: Record<ManagedTier, number> = {
  cheap: 1.0,
  mid: 1.1,
  frontier: 1.25,
};

export function estimateCreditsForCall(args: {
  model: ManagedModel;
  inputTokens: number;
  /** Caller's `max_tokens` cap; falls back to 8192 (worker default). */
  maxOutputTokens?: number;
  effort?: "low" | "medium" | "high" | null;
}): number {
  const outputCap = args.maxOutputTokens ?? 8192;
  const reasoningMult = reasoningOutputMultiplier(args.effort);

  const usd =
    (args.inputTokens / 1_000_000) * args.model.usdPer1MInput +
    (outputCap / 1_000_000) * args.model.usdPer1MOutput * reasoningMult;

  const buffered = usd * TIER_RESERVE_BUFFER[args.model.tier];
  return Math.max(1, Math.ceil(buffered / CREDIT_USD_VALUE));
}
