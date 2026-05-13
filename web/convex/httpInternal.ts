import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const INTERNAL_HEADER = "x-skillset-internal";

function unauthorized(): Response {
  return new Response(JSON.stringify({ error: "unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

function badRequest(message: string): Response {
  return new Response(JSON.stringify({ error: "bad_request", message }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
}

function ok(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function verifySecret(request: Request): boolean {
  const expected = process.env.SKILLSET_INTERNAL_KEY;
  if (!expected) return false;
  const provided = request.headers.get(INTERNAL_HEADER);
  return Boolean(provided) && provided === expected;
}

/**
 * Server-to-server credit endpoints invoked by the Cloudflare Workers proxy
 * (api/src/llm.ts) when handling managed-mode LLM calls. Guarded by a shared
 * secret in the `x-skillset-internal` header so the credit mutations are
 * not callable by browser clients.
 */
export function registerInternalRoutes(http: ReturnType<typeof httpRouter>) {
  http.route({
    path: "/api/internal/credits/reserve",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
      if (!verifySecret(request)) return unauthorized();

      let body: { userId?: string; clerkId?: string; estimatedCredits?: number; modelId?: string };
      try {
        body = (await request.json()) as typeof body;
      } catch {
        return badRequest("invalid_json");
      }

      const userId = body.userId ?? body.clerkId;
      const { estimatedCredits, modelId } = body;
      if (!userId || typeof estimatedCredits !== "number" || !modelId) {
        return badRequest("missing_fields");
      }

      try {
        const result = await ctx.runMutation(internal.credits.reserveCredits, {
          userId,
          estimatedCredits,
          modelId,
        });
        return ok(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : "unknown";
        if (message === "INSUFFICIENT_CREDITS") {
          return new Response(
            JSON.stringify({ error: "insufficient_credits" }),
            { status: 402, headers: { "Content-Type": "application/json" } },
          );
        }
        if (message === "USER_NOT_FOUND") {
          return new Response(
            JSON.stringify({ error: "user_not_found" }),
            { status: 404, headers: { "Content-Type": "application/json" } },
          );
        }
        return new Response(
          JSON.stringify({ error: "internal_error", message }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }
    }),
  });

  http.route({
    path: "/api/internal/credits/settle",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
      if (!verifySecret(request)) return unauthorized();

      let body: {
        holdId?: string;
        actualOpenRouterCostUsd?: number;
        inputTokens?: number;
        outputTokens?: number;
      };
      try {
        body = (await request.json()) as typeof body;
      } catch {
        return badRequest("invalid_json");
      }

      const { holdId, actualOpenRouterCostUsd, inputTokens, outputTokens } = body;
      if (
        !holdId ||
        typeof actualOpenRouterCostUsd !== "number" ||
        typeof inputTokens !== "number" ||
        typeof outputTokens !== "number"
      ) {
        return badRequest("missing_fields");
      }

      const result = await ctx.runMutation(internal.credits.settleCredits, {
        holdId,
        actualOpenRouterCostUsd,
        inputTokens,
        outputTokens,
      });
      return ok(result);
    }),
  });

  http.route({
    path: "/api/internal/credits/release",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
      if (!verifySecret(request)) return unauthorized();

      let body: { holdId?: string; reason?: string };
      try {
        body = (await request.json()) as typeof body;
      } catch {
        return badRequest("invalid_json");
      }

      if (!body.holdId) return badRequest("missing_fields");

      await ctx.runMutation(internal.credits.releaseHold, {
        holdId: body.holdId,
        reason: body.reason,
      });
      return ok({ released: true });
    }),
  });

  http.route({
    path: "/api/internal/credits/balance",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
      if (!verifySecret(request)) return unauthorized();

      let body: { userId?: string; clerkId?: string };
      try {
        body = (await request.json()) as typeof body;
      } catch {
        return badRequest("invalid_json");
      }
      const userId = body.userId ?? body.clerkId;
      if (!userId) return badRequest("missing_fields");

      const balance = await ctx.runQuery(internal.credits.getBalanceInternal, {
        userId,
      });
      return ok(balance ?? { error: "user_not_found" });
    }),
  });
}
