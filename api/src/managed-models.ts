// Curated allowlist of OpenRouter models exposed to managed-mode users.
// Single source of truth for both the Workers proxy (api/src/llm.ts) and the
// desktop app (app/src/lib/managed-models.ts) — keep the two files in sync.
//
// Adding a model: verify creditsPerCall covers OpenRouter cost at >=75% margin
// for a typical 2K-input/1K-output call, then update both files in lockstep.
//
// 1 credit = $0.005 OpenRouter cost budget.

export type ManagedTier = "cheap" | "mid" | "frontier";

export interface ManagedModel {
  id: string; // OpenRouter model identifier (e.g. "anthropic/claude-sonnet-4-6")
  label: string; // User-facing label
  tier: ManagedTier;
  creditsPerCall: number; // Flat estimate for typical 2K in / 1K out
  recommended?: boolean; // First "Recommended" pick within its tier
}

export const MANAGED_MODELS: ReadonlyArray<ManagedModel> = [
  // ── Cheap (1 credit) ──────────────────────────────────────────
  { id: "anthropic/claude-haiku-4-5", label: "Claude Haiku 4.5", tier: "cheap", creditsPerCall: 1, recommended: true },
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", tier: "cheap", creditsPerCall: 1 },
  { id: "openai/gpt-5-mini", label: "GPT-5 Mini", tier: "cheap", creditsPerCall: 1 },
  { id: "deepseek/deepseek-chat", label: "DeepSeek V3", tier: "cheap", creditsPerCall: 1 },
  { id: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B", tier: "cheap", creditsPerCall: 1 },

  // ── Mid (5 credits) ───────────────────────────────────────────
  { id: "anthropic/claude-sonnet-4-6", label: "Claude Sonnet 4.6", tier: "mid", creditsPerCall: 5, recommended: true },
  { id: "openai/gpt-5", label: "GPT-5", tier: "mid", creditsPerCall: 5 },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", tier: "mid", creditsPerCall: 5 },
  { id: "x-ai/grok-3", label: "Grok 3", tier: "mid", creditsPerCall: 5 },
  { id: "deepseek/deepseek-reasoner", label: "DeepSeek R1", tier: "mid", creditsPerCall: 5 },

  // ── Frontier (25 credits) ─────────────────────────────────────
  { id: "anthropic/claude-opus-4-6", label: "Claude Opus 4.6", tier: "frontier", creditsPerCall: 25, recommended: true },
  { id: "openai/gpt-5-pro", label: "GPT-5 Pro", tier: "frontier", creditsPerCall: 25 },
  { id: "openai/o3-pro", label: "o3 Pro", tier: "frontier", creditsPerCall: 25 },
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
