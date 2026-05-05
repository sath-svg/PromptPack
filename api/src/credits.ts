// Shared credit reserve/settle/release helpers used by every metered endpoint
// (/api/llm/chat, /api/enhance, /api/evaluate, /chat, /v1/chat/completions).
// Worker hits Convex over HTTP using SKILLSET_INTERNAL_KEY.

export const CREDIT_USD_VALUE = 0.005; // 1 credit = $0.005 OpenRouter budget.

export interface CreditEnv {
  CONVEX_URL: string;
  SKILLSET_INTERNAL_KEY: string;
}

export interface ReserveResponse {
  holdId: string;
  monthlyAfter: number;
  topupAfter: number;
}

export interface SettleResponse {
  monthlyAfter: number;
  topupAfter: number;
  actualCredits: number;
  shortfall: number;
}

export type ReserveOutcome =
  | { ok: true; data: ReserveResponse }
  | { ok: false; status: number; body: unknown };

export async function reserveCredits(
  env: CreditEnv,
  clerkId: string,
  estimatedCredits: number,
  modelId: string,
): Promise<ReserveOutcome> {
  const res = await fetch(`${env.CONVEX_URL}/api/internal/credits/reserve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-skillset-internal": env.SKILLSET_INTERNAL_KEY,
    },
    body: JSON.stringify({ clerkId, estimatedCredits, modelId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { ok: false, status: res.status, body };
  }
  return { ok: true, data: (await res.json()) as ReserveResponse };
}

export async function settleCredits(
  env: CreditEnv,
  holdId: string,
  actualOpenRouterCostUsd: number,
  inputTokens: number,
  outputTokens: number,
): Promise<SettleResponse | null> {
  const res = await fetch(`${env.CONVEX_URL}/api/internal/credits/settle`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-skillset-internal": env.SKILLSET_INTERNAL_KEY,
    },
    body: JSON.stringify({ holdId, actualOpenRouterCostUsd, inputTokens, outputTokens }),
  });
  if (!res.ok) return null;
  return (await res.json()) as SettleResponse;
}

export async function releaseCredits(
  env: CreditEnv,
  holdId: string,
  reason: string,
): Promise<void> {
  await fetch(`${env.CONVEX_URL}/api/internal/credits/release`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-skillset-internal": env.SKILLSET_INTERNAL_KEY,
    },
    body: JSON.stringify({ holdId, reason }),
  }).catch(() => undefined);
}

// Settle a non-LLM endpoint at a flat credit cost. Worker pays Groq via
// subscription, so there's no per-call OpenRouter cost — pass a synthetic
// USD value so usdToCredits() resolves to exactly `fixedCredits`.
export async function settleFlat(
  env: CreditEnv,
  holdId: string,
  fixedCredits: number,
): Promise<SettleResponse | null> {
  return settleCredits(env, holdId, fixedCredits * CREDIT_USD_VALUE, 0, 0);
}

// Convert reserve failure into a Response with the right status code.
export function reserveErrorResponse(outcome: { status: number; body: unknown }): Response {
  if (outcome.status === 402) {
    return new Response(
      JSON.stringify({ error: "insufficient_credits", code: "INSUFFICIENT_CREDITS" }),
      { status: 402, headers: { "Content-Type": "application/json" } },
    );
  }
  if (outcome.status === 404) {
    return new Response(JSON.stringify({ error: "user_not_found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
  return new Response(
    JSON.stringify({ error: "credit_reserve_failed", details: outcome.body }),
    { status: 500, headers: { "Content-Type": "application/json" } },
  );
}

// Build response headers reporting balance + amount charged.
export function creditsHeaders(settled: SettleResponse | null, base?: HeadersInit): Headers {
  const h = new Headers(base);
  if (settled) {
    h.set("X-Credits-Remaining", String(settled.monthlyAfter + settled.topupAfter));
    h.set("X-Credits-Monthly", String(settled.monthlyAfter));
    h.set("X-Credits-Topup", String(settled.topupAfter));
    h.set("X-Credits-Charged", String(settled.actualCredits));
    if (settled.shortfall > 0) {
      h.set("X-Credits-Shortfall", String(settled.shortfall));
    }
  }
  return h;
}
