import { getManagedModel, isManagedModel, MANAGED_MODELS } from "./managed-models";

interface LlmEnv {
  CONVEX_URL: string;
  OPENROUTER_API_KEY: string;
  SKILLSET_INTERNAL_KEY: string;
  CLERK_ISSUER: string;
  CLERK_JWKS_URL: string;
  CLERK_AUDIENCE: string;
}

interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | Array<{ type: string; text?: string }>;
}

interface ChatRequestBody {
  model?: string;
  messages?: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
}

interface OpenRouterUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  cost?: number; // OpenRouter's actual cost in USD when usage.include=true
}

interface OpenRouterResponse {
  id?: string;
  choices?: Array<{ message?: { content?: string }; finish_reason?: string }>;
  usage?: OpenRouterUsage;
  error?: { message?: string; code?: string | number };
}

interface ReserveResponse {
  holdId: string;
  monthlyAfter: number;
  topupAfter: number;
}

interface SettleResponse {
  monthlyAfter: number;
  topupAfter: number;
  actualCredits: number;
  shortfall: number;
}

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/** ~4 chars per token is the standard rule of thumb across major tokenizers. */
function estimateTokens(messages: ChatMessage[]): number {
  let chars = 0;
  for (const msg of messages) {
    if (typeof msg.content === "string") {
      chars += msg.content.length;
    } else {
      for (const part of msg.content) {
        if (part.text) chars += part.text.length;
      }
    }
    chars += 4; // role overhead
  }
  return Math.ceil(chars / 4);
}

function jsonResponse(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function verifyJwt(
  request: Request,
  env: LlmEnv,
  verifyFn: (token: string) => Promise<{ sub?: string } | null>,
): Promise<string | null> {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const payload = await verifyFn(auth.slice(7));
  return payload?.sub ?? null;
}

async function reserveOnConvex(
  env: LlmEnv,
  clerkId: string,
  estimatedCredits: number,
  modelId: string,
): Promise<{ ok: true; data: ReserveResponse } | { ok: false; status: number; body: unknown }> {
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

async function settleOnConvex(
  env: LlmEnv,
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

async function releaseOnConvex(env: LlmEnv, holdId: string, reason: string): Promise<void> {
  await fetch(`${env.CONVEX_URL}/api/internal/credits/release`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-skillset-internal": env.SKILLSET_INTERNAL_KEY,
    },
    body: JSON.stringify({ holdId, reason }),
  }).catch(() => undefined);
}

/**
 * Managed-mode LLM proxy: routes chat requests through OpenRouter and meters
 * usage against the user's credit balance (held on Convex). Reserve-then-settle
 * ensures we never oversell, and a release is issued if anything fails after
 * the hold is taken.
 */
export async function handleLlmChat(
  request: Request,
  env: LlmEnv,
  verifyJwtFn: (token: string) => Promise<{ sub?: string } | null>,
): Promise<Response> {
  if (request.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }
  if (!env.OPENROUTER_API_KEY) {
    return jsonResponse({ error: "openrouter_not_configured" }, 500);
  }
  if (!env.SKILLSET_INTERNAL_KEY) {
    return jsonResponse({ error: "internal_key_not_configured" }, 500);
  }

  const clerkId = await verifyJwt(request, env, verifyJwtFn);
  if (!clerkId) return jsonResponse({ error: "unauthorized" }, 401);

  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  const modelId = body.model;
  if (!modelId || !isManagedModel(modelId)) {
    return jsonResponse(
      { error: "model_not_allowed", allowedModels: MANAGED_MODELS.map((m) => m.id) },
      400,
    );
  }
  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return jsonResponse({ error: "missing_messages" }, 400);
  }
  if (body.stream) {
    // Streaming requires a different reserve/settle flow (no usage.cost until
    // the final SSE chunk). v1 ships non-streaming only; defer streaming.
    return jsonResponse({ error: "streaming_not_supported" }, 400);
  }

  const model = getManagedModel(modelId)!;

  // Estimate credits: take the larger of (a) flat per-call estimate from the
  // allowlist and (b) a rough token-based estimate scaled by tier. Settles
  // exactly against OpenRouter's reported cost.
  const inputTokens = estimateTokens(body.messages);
  const tierMultiplier = model.tier === "frontier" ? 25 : model.tier === "mid" ? 5 : 1;
  const tokenBasedEstimate = Math.ceil((inputTokens / 1000) * tierMultiplier);
  const estimatedCredits = Math.max(model.creditsPerCall, tokenBasedEstimate);

  const reserve = await reserveOnConvex(env, clerkId, estimatedCredits, modelId);
  if (!reserve.ok) {
    if (reserve.status === 402) {
      return jsonResponse({ error: "insufficient_credits", code: "INSUFFICIENT_CREDITS" }, 402);
    }
    if (reserve.status === 404) {
      return jsonResponse({ error: "user_not_found" }, 404);
    }
    return jsonResponse({ error: "credit_reserve_failed", details: reserve.body }, 500);
  }

  const { holdId } = reserve.data;

  let openRouterRes: Response;
  try {
    openRouterRes = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://pmtpk.com",
        "X-Title": "PromptPack",
      },
      body: JSON.stringify({
        model: modelId,
        messages: body.messages,
        max_tokens: body.max_tokens,
        temperature: body.temperature,
        top_p: body.top_p,
        // Ask OpenRouter to include actual cost so we can settle accurately
        usage: { include: true },
      }),
    });
  } catch (err) {
    await releaseOnConvex(env, holdId, "openrouter_fetch_failed");
    return jsonResponse({ error: "openrouter_unreachable" }, 502);
  }

  let openRouterBody: OpenRouterResponse;
  try {
    openRouterBody = (await openRouterRes.json()) as OpenRouterResponse;
  } catch {
    await releaseOnConvex(env, holdId, "openrouter_invalid_response");
    return jsonResponse({ error: "openrouter_invalid_response" }, 502);
  }

  if (!openRouterRes.ok || openRouterBody.error) {
    await releaseOnConvex(env, holdId, `openrouter_error_${openRouterRes.status}`);
    return jsonResponse(
      { error: "openrouter_error", status: openRouterRes.status, details: openRouterBody.error },
      openRouterRes.status >= 400 && openRouterRes.status < 600 ? openRouterRes.status : 502,
    );
  }

  const usage = openRouterBody.usage ?? {};
  const actualCost = usage.cost ?? 0;
  const actualInputTokens = usage.prompt_tokens ?? inputTokens;
  const actualOutputTokens = usage.completion_tokens ?? 0;

  const settled = await settleOnConvex(
    env,
    holdId,
    actualCost,
    actualInputTokens,
    actualOutputTokens,
  );

  const responseHeaders = new Headers({ "Content-Type": "application/json" });
  if (settled) {
    responseHeaders.set(
      "X-Credits-Remaining",
      String(settled.monthlyAfter + settled.topupAfter),
    );
    responseHeaders.set("X-Credits-Monthly", String(settled.monthlyAfter));
    responseHeaders.set("X-Credits-Topup", String(settled.topupAfter));
    responseHeaders.set("X-Credits-Charged", String(settled.actualCredits));
    if (settled.shortfall > 0) {
      responseHeaders.set("X-Credits-Shortfall", String(settled.shortfall));
    }
  }

  return new Response(JSON.stringify(openRouterBody), {
    status: 200,
    headers: responseHeaders,
  });
}
