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
}

export const MANAGED_MODELS: ReadonlyArray<ManagedModel> = [
  // ── Cheap ─────────────────────────────────────────────────────
  { id: "anthropic/claude-haiku-4-5",        label: "Claude Haiku 4.5", tier: "cheap", usdPer1MInput: 0.80, usdPer1MOutput: 4.00,  recommended: true },
  { id: "google/gemini-2.5-flash",           label: "Gemini 2.5 Flash", tier: "cheap", usdPer1MInput: 0.30, usdPer1MOutput: 2.50 },
  { id: "openai/gpt-5-mini",                 label: "GPT-5 Mini",       tier: "cheap", usdPer1MInput: 0.50, usdPer1MOutput: 4.00 },
  { id: "deepseek/deepseek-chat",            label: "DeepSeek V3",      tier: "cheap", usdPer1MInput: 0.27, usdPer1MOutput: 1.10 },
  { id: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B",    tier: "cheap", usdPer1MInput: 0.40, usdPer1MOutput: 0.40 },

  // ── Mid ────────────────────────────────────────────────────────
  { id: "anthropic/claude-sonnet-4-6",       label: "Claude Sonnet 4.6", tier: "mid", usdPer1MInput: 3.00,  usdPer1MOutput: 15.00, recommended: true },
  { id: "openai/gpt-5",                      label: "GPT-5",             tier: "mid", usdPer1MInput: 5.00,  usdPer1MOutput: 15.00 },
  { id: "google/gemini-2.5-pro",             label: "Gemini 2.5 Pro",    tier: "mid", usdPer1MInput: 1.25,  usdPer1MOutput: 5.00 },
  { id: "x-ai/grok-3",                       label: "Grok 3",            tier: "mid", usdPer1MInput: 3.00,  usdPer1MOutput: 15.00 },
  { id: "deepseek/deepseek-reasoner",        label: "DeepSeek R1",       tier: "mid", usdPer1MInput: 0.55,  usdPer1MOutput: 2.19 },

  // ── Frontier ───────────────────────────────────────────────────
  // GPT-5-Pro is the new default — cheaper than Opus, comparable
  // capability on most tasks. Opus stays available, marked `expensive`
  // so the UI flags the cost before the user commits.
  { id: "openai/gpt-5-pro",                  label: "GPT-5 Pro",         tier: "frontier", usdPer1MInput: 10.00, usdPer1MOutput: 40.00, recommended: true },
  { id: "openai/o3-pro",                     label: "o3 Pro",            tier: "frontier", usdPer1MInput: 15.00, usdPer1MOutput: 60.00, expensive: true },
  { id: "anthropic/claude-opus-4-6",         label: "Claude Opus 4.6",   tier: "frontier", usdPer1MInput: 15.00, usdPer1MOutput: 75.00, expensive: true },
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

  return Math.max(1, Math.ceil(usd / CREDIT_USD_VALUE));
}
