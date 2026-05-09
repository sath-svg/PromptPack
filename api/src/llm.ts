import {
  getManagedModel,
  isManagedModel,
  MANAGED_MODELS,
  estimateCreditsForCall,
} from "./managed-models";
import {
  reserveCredits,
  settleCredits,
  releaseCredits,
  reserveErrorResponse,
  creditsHeaders,
} from "./credits";

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
  /**
   * OpenRouter unified reasoning knob. Forwarded as-is. Field name was
   * chosen by OpenRouter to be vendor-neutral; under the hood OpenRouter
   * translates it to `reasoning_effort` (OpenAI o-series, Gemini 2.5,
   * Grok-3/4) or `thinking.budget_tokens` (Anthropic). Non-reasoning
   * models silently ignore.
   */
  reasoning?: { effort?: "low" | "medium" | "high"; max_tokens?: number; exclude?: boolean };
  /**
   * OpenAI-compatible JSON-mode hint. Forwarded so the orchestrator's
   * planner can request strict JSON output. Models that don't support it
   * silently ignore.
   */
  response_format?: { type?: "json_object" | "text" } | { type: "json_schema"; json_schema?: unknown };
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

// Credit reserve/settle/release helpers moved to ./credits.ts (shared with
// /api/enhance, /api/evaluate, /chat, /v1/chat/completions).

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

  // Token-based reservation. Uses the model's actual OpenRouter pricing
  // (`usdPer1MInput` + `usdPer1MOutput`) plus the requested `max_tokens`
  // cap to compute a tight credit hold. Reasoning effort scales the
  // output term (1× / 1.3× / 2× / 4× for null / low / medium / high)
  // to cover thinking-token spend. Settle uses the real `usage.cost`
  // returned by OpenRouter, so any over-estimate refunds automatically.
  const inputTokens = estimateTokens(body.messages);
  const reasoningEffort = body.reasoning?.effort;
  const estimatedCredits = estimateCreditsForCall({
    model,
    inputTokens,
    maxOutputTokens: body.max_tokens ?? 8192,
    effort: reasoningEffort ?? null,
  });

  const reserve = await reserveCredits(env, clerkId, estimatedCredits, modelId);
  console.log("[llm-chat] reserve:", JSON.stringify({
    clerkId,
    estimatedCredits,
    modelId,
    tier: model.tier,
    inputTokens,
    convexUrl: env.CONVEX_URL,
    ok: reserve.ok,
    status: reserve.ok ? null : reserve.status,
    body: reserve.ok ? null : reserve.body,
    holdId: reserve.ok ? reserve.data.holdId : null,
  }));
  if (!reserve.ok) return reserveErrorResponse(reserve);

  const { holdId } = reserve.data;

  let openRouterRes: Response;
  try {
    openRouterRes = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://skillset.so",
        "X-Title": "Skillset",
      },
      body: JSON.stringify({
        model: modelId,
        messages: body.messages,
        // OpenRouter reserves max_tokens × output_price up-front against the
        // key's monthly limit. Without an explicit cap, models default to
        // their full context (e.g. Haiku 4.5 = 64K output) which can exceed
        // the per-call reservation budget. Clamp to 4K unless caller asked
        // for something specific.
        max_tokens: body.max_tokens ?? 8192,
        temperature: body.temperature,
        top_p: body.top_p,
        // Forward reasoning knob untouched — OpenRouter handles per-provider
        // translation (reasoning_effort / thinking.budget_tokens / etc).
        // Worker does NOT validate model-supports-reasoning; the desktop
        // client only attaches the field for known-reasoning managed models.
        reasoning: body.reasoning,
        // Forward JSON-mode hint (used by the orchestrator's planner).
        response_format: body.response_format,
        // Ask OpenRouter to include actual cost so we can settle accurately
        usage: { include: true },
      }),
    });
  } catch (err) {
    await releaseCredits(env, holdId, "openrouter_fetch_failed");
    return jsonResponse({ error: "openrouter_unreachable" }, 502);
  }

  let openRouterBody: OpenRouterResponse;
  try {
    openRouterBody = (await openRouterRes.json()) as OpenRouterResponse;
  } catch {
    await releaseCredits(env, holdId, "openrouter_invalid_response");
    return jsonResponse({ error: "openrouter_invalid_response" }, 502);
  }

  if (!openRouterRes.ok || openRouterBody.error) {
    await releaseCredits(env, holdId, `openrouter_error_${openRouterRes.status}`);
    console.error("[llm-chat] OpenRouter error", openRouterRes.status, JSON.stringify(openRouterBody.error));
    // Always return 502 for upstream failures so client doesn't confuse
    // OpenRouter's 402/401 with user's own credit/auth state.
    return jsonResponse(
      { error: "openrouter_error", upstreamStatus: openRouterRes.status, details: openRouterBody.error },
      502,
    );
  }

  const usage = openRouterBody.usage ?? {};
  const actualCost = usage.cost ?? 0;
  const actualInputTokens = usage.prompt_tokens ?? inputTokens;
  const actualOutputTokens = usage.completion_tokens ?? 0;

  const settled = await settleCredits(
    env,
    holdId,
    actualCost,
    actualInputTokens,
    actualOutputTokens,
  );

  return new Response(JSON.stringify(openRouterBody), {
    status: 200,
    headers: creditsHeaders(settled, { "Content-Type": "application/json" }),
  });
}
