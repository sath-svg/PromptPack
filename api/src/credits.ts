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

export type ReserveTier = "cheap" | "mid" | "frontier";

export async function reserveCredits(
  env: CreditEnv,
  userId: string,
  estimatedCredits: number,
  modelId: string,
  tier?: ReserveTier,
  fromOrchestrator?: boolean,
): Promise<ReserveOutcome> {
  const res = await fetch(`${env.CONVEX_URL}/api/internal/credits/reserve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-skillset-internal": env.SKILLSET_INTERNAL_KEY,
    },
    body: JSON.stringify({ userId, estimatedCredits, modelId, tier, fromOrchestrator }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    // Convex's `credits.ts` mutation surfaces gating errors as HTTP 500 with
    // the message embedded in the body. Reclassify to friendlier status codes
    // so the desktop client can show the right UI prompt.
    const messageBlob = JSON.stringify(body);
    if (res.status === 500) {
      if (/INSUFFICIENT_CREDITS/i.test(messageBlob)) {
        return { ok: false, status: 402, body };
      }
      if (/FRONTIER_NOT_ALLOWED/i.test(messageBlob)) {
        return { ok: false, status: 403, body };
      }
      if (/SKILLFLOW_REQUIRES_PAID/i.test(messageBlob)) {
        return { ok: false, status: 403, body };
      }
      if (/DAILY_FREE_LIMIT_REACHED/i.test(messageBlob)) {
        return { ok: false, status: 429, body };
      }
      if (/FREE_PLAN_RETIRED/i.test(messageBlob)) {
        return { ok: false, status: 403, body };
      }
    }
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
  if (outcome.status === 403) {
    const blob = JSON.stringify(outcome.body ?? {});
    if (/FREE_PLAN_RETIRED/i.test(blob)) {
      return new Response(
        JSON.stringify({
          error: "free_plan_retired",
          code: "FREE_PLAN_RETIRED",
          message:
            "Your free plan has ended. Start a 3-day free trial to keep using AI in Skillset: https://skillset.so/start-trial",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }
    if (/SKILLFLOW_REQUIRES_PAID/i.test(blob)) {
      return new Response(
        JSON.stringify({
          error: "skillflow_requires_paid",
          code: "SKILLFLOW_REQUIRES_PAID",
          message: "SkillFlow (multi-step AI workflows) requires a Pro or Studio subscription.",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }
    return new Response(
      JSON.stringify({
        error: "frontier_not_allowed",
        code: "FRONTIER_NOT_ALLOWED",
        message: "Premium Models require a Pro or Studio subscription. Upgrade to use Opus, GPT-5 Pro, or o3-Pro.",
      }),
      { status: 403, headers: { "Content-Type": "application/json" } },
    );
  }
  if (outcome.status === 429) {
    return new Response(
      JSON.stringify({
        error: "daily_free_limit_reached",
        code: "DAILY_FREE_LIMIT_REACHED",
        message: "Daily free-trial credit limit reached. Resets at midnight UTC, or upgrade for full monthly allowance.",
      }),
      { status: 429, headers: { "Content-Type": "application/json" } },
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
//
// `tokenUsage` is the OpenRouter usage block; the worker forwards
// prompt/completion/reasoning counts so the desktop UI can show real
// token spend per call without a second API hop.
export function creditsHeaders(
  settled: SettleResponse | null,
  base?: HeadersInit,
  tokenUsage?: {
    promptTokens?: number;
    completionTokens?: number;
    reasoningTokens?: number;
    totalTokens?: number;
  },
): Headers {
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
  if (tokenUsage) {
    if (typeof tokenUsage.promptTokens === "number") {
      h.set("X-Tokens-Input", String(tokenUsage.promptTokens));
    }
    if (typeof tokenUsage.completionTokens === "number") {
      h.set("X-Tokens-Output", String(tokenUsage.completionTokens));
    }
    if (typeof tokenUsage.reasoningTokens === "number") {
      h.set("X-Tokens-Reasoning", String(tokenUsage.reasoningTokens));
    }
    if (typeof tokenUsage.totalTokens === "number") {
      h.set("X-Tokens-Total", String(tokenUsage.totalTokens));
    }
  }
  return h;
}
