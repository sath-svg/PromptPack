import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { corsHeaders } from "./httpDesktop";

export function registerExtensionRoutes(http: ReturnType<typeof httpRouter>) {
  // Handle CORS preflight
  http.route({
    path: "/api/savedPacks",
    method: "OPTIONS",
    handler: httpAction(async (_, request) => {
      const origin = request.headers.get("Origin");
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }),
  });

  // Save pack metadata to Convex (called after R2 upload)
  http.route({
    path: "/api/savedPacks",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
      const origin = request.headers.get("Origin");
      const headers = corsHeaders(origin);

      try {
        const body = await request.json();
        const { clerkId, source, r2Key, promptCount, fileSize } = body as {
          clerkId: string;
          source: "chatgpt" | "claude" | "gemini" | "perplexity" | "grok" | "deepseek" | "kimi";
          r2Key: string;
          promptCount: number;
          fileSize: number;
        };

        if (!clerkId || !source || !r2Key || promptCount === undefined || fileSize === undefined) {
          return new Response(
            JSON.stringify({ error: "Missing required fields" }),
            {
              status: 400,
              headers: { ...headers, "Content-Type": "application/json" },
            }
          );
        }

        const result = await ctx.runMutation(api.savedPacks.upsertByClerkId, {
          clerkId,
          source,
          r2Key,
          promptCount,
          fileSize,
        });

        return new Response(
          JSON.stringify({ success: true, ...result }),
          {
            status: 200,
            headers: { ...headers, "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("Save error:", error);
        return new Response(
          JSON.stringify({
            error: error instanceof Error ? error.message : "Failed to save",
          }),
          {
            status: 500,
            headers: { ...headers, "Content-Type": "application/json" },
          }
        );
      }
    }),
  });

  // Extension auth: exchange code for token
  // CORS preflight
  http.route({
    path: "/api/extension/exchange-code",
    method: "OPTIONS",
    handler: httpAction(async (_, request) => {
      const origin = request.headers.get("Origin");
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }),
  });

  // Extension auth: exchange one-time code for user data + session
  http.route({
    path: "/api/extension/exchange-code",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
      const origin = request.headers.get("Origin");
      const headers = corsHeaders(origin);

      try {
        const body = await request.json();
        const { code } = body as { code: string };

        if (!code) {
          return new Response(
            JSON.stringify({ error: "Missing code" }),
            {
              status: 400,
              headers: { ...headers, "Content-Type": "application/json" },
            }
          );
        }

        // Decode the code (in production, verify from Redis/KV store)
        let authData;
        try {
          const decoded = atob(code);
          authData = JSON.parse(decoded);
        } catch {
          return new Response(
            JSON.stringify({ error: "Invalid code" }),
            {
              status: 400,
              headers: { ...headers, "Content-Type": "application/json" },
            }
          );
        }

        // Verify code hasn't expired (5 minutes)
        const codeAge = Date.now() - authData.timestamp;
        if (codeAge > 5 * 60 * 1000) {
          return new Response(
            JSON.stringify({ error: "Code expired" }),
            {
              status: 400,
              headers: { ...headers, "Content-Type": "application/json" },
            }
          );
        }

        // Get user from Convex
        let user = await ctx.runQuery(api.users.getByClerkId, {
          clerkId: authData.userId,
        });

        if (!user) {
          if (!authData.email) {
            return new Response(
              JSON.stringify({ error: "User not found and email missing" }),
              {
                status: 400,
                headers: { ...headers, "Content-Type": "application/json" },
              }
            );
          }

          // Create a user on the fly in dev when webhook hasn't populated Convex yet
          await ctx.runMutation(api.users.upsert, {
            clerkId: authData.userId,
            email: authData.email,
            name: authData.name,
            imageUrl: authData.imageUrl,
            plan: "free",
          });

          user = await ctx.runQuery(api.users.getByClerkId, {
            clerkId: authData.userId,
          });

          if (!user) {
            return new Response(
              JSON.stringify({ error: "Failed to create user" }),
              {
                status: 500,
                headers: { ...headers, "Content-Type": "application/json" },
              }
            );
          }
        }

        // Create a refresh token for the extension
        const ip = request.headers.get("CF-Connecting-IP")
          || request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim()
          || undefined;
        const userAgent = request.headers.get("User-Agent") || undefined;

        const refreshTokenResult = await ctx.runMutation(api.refreshTokens.create, {
          clerkId: user.clerkId,
          ip,
          userAgent,
        });

        // Return user data + tokens for extension to store
        return new Response(
          JSON.stringify({
            success: true,
            user: {
              clerkId: user.clerkId,
              email: user.email,
              name: user.name,
              plan: user.plan,
            },
            token: authData.token, // Clerk session token (short-lived)
            refreshToken: refreshTokenResult.refreshToken, // Long-lived refresh token
            refreshTokenExpiresAt: refreshTokenResult.expiresAt,
          }),
          {
            status: 200,
            headers: { ...headers, "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("Code exchange error:", error);
        return new Response(
          JSON.stringify({
            error: error instanceof Error ? error.message : "Exchange failed",
          }),
          {
            status: 500,
            headers: { ...headers, "Content-Type": "application/json" },
          }
        );
      }
    }),
  });

  // Extension auth: refresh token
  // CORS preflight
  http.route({
    path: "/api/extension/refresh-token",
    method: "OPTIONS",
    handler: httpAction(async (_, request) => {
      const origin = request.headers.get("Origin");
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }),
  });

  // Extension auth: exchange refresh token for new access token
  http.route({
    path: "/api/extension/refresh-token",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
      const origin = request.headers.get("Origin");
      const headers = corsHeaders(origin);

      try {
        const body = await request.json();
        const { refreshToken } = body as { refreshToken: string };

        if (!refreshToken) {
          return new Response(
            JSON.stringify({ error: "Missing refreshToken" }),
            {
              status: 400,
              headers: { ...headers, "Content-Type": "application/json" },
            }
          );
        }

        // Get client info for security tracking
        const ip = request.headers.get("CF-Connecting-IP")
          || request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim()
          || undefined;
        const userAgent = request.headers.get("User-Agent") || undefined;

        // Rotate the token (validates old token, creates new one)
        const result = await ctx.runMutation(api.refreshTokens.rotateToken, {
          refreshToken,
          ip,
          userAgent,
        });

        // Check for errors from the rotation
        if ("error" in result) {
          const statusCode = result.error === "TOKEN_REUSE" ? 403 : 401;
          return new Response(
            JSON.stringify({ error: result.error, message: result.message }),
            {
              status: statusCode,
              headers: { ...headers, "Content-Type": "application/json" },
            }
          );
        }

        // Get user info to return with the new tokens
        const user = await ctx.runQuery(api.users.getByClerkId, {
          clerkId: result.clerkId,
        });

        if (!user) {
          return new Response(
            JSON.stringify({ error: "User not found" }),
            {
              status: 404,
              headers: { ...headers, "Content-Type": "application/json" },
            }
          );
        }

        // Return new tokens
        // Note: The caller should get a fresh Clerk JWT from Clerk's API
        // We return the user info and new refresh token
        return new Response(
          JSON.stringify({
            success: true,
            user: {
              clerkId: user.clerkId,
              email: user.email,
              name: user.name,
              plan: user.plan,
            },
            refreshToken: result.refreshToken,
            refreshTokenExpiresAt: result.expiresAt,
          }),
          {
            status: 200,
            headers: { ...headers, "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("Token refresh error:", error);
        return new Response(
          JSON.stringify({
            error: error instanceof Error ? error.message : "Refresh failed",
          }),
          {
            status: 500,
            headers: { ...headers, "Content-Type": "application/json" },
          }
        );
      }
    }),
  });

  // Extension: revoke refresh token (logout)
  // CORS preflight
  http.route({
    path: "/api/extension/revoke-token",
    method: "OPTIONS",
    handler: httpAction(async (_, request) => {
      const origin = request.headers.get("Origin");
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }),
  });

  // Extension: revoke refresh token
  http.route({
    path: "/api/extension/revoke-token",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
      const origin = request.headers.get("Origin");
      const headers = corsHeaders(origin);

      try {
        const body = await request.json();
        const { refreshToken } = body as { refreshToken: string };

        if (!refreshToken) {
          return new Response(
            JSON.stringify({ error: "Missing refreshToken" }),
            {
              status: 400,
              headers: { ...headers, "Content-Type": "application/json" },
            }
          );
        }

        await ctx.runMutation(api.refreshTokens.revoke, { refreshToken });

        return new Response(
          JSON.stringify({ success: true }),
          {
            status: 200,
            headers: { ...headers, "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("Token revoke error:", error);
        return new Response(
          JSON.stringify({
            error: error instanceof Error ? error.message : "Revoke failed",
          }),
          {
            status: 500,
            headers: { ...headers, "Content-Type": "application/json" },
          }
        );
      }
    }),
  });

  // Extension: validate refresh token (for API auth without rotation)
  // CORS preflight
  http.route({
    path: "/api/extension/validate-token",
    method: "OPTIONS",
    handler: httpAction(async (_, request) => {
      const origin = request.headers.get("Origin");
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }),
  });

  // Extension: validate refresh token
  http.route({
    path: "/api/extension/validate-token",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
      const origin = request.headers.get("Origin");
      const headers = corsHeaders(origin);

      try {
        const body = await request.json();
        const { refreshToken } = body as { refreshToken: string };

        if (!refreshToken) {
          return new Response(
            JSON.stringify({ valid: false, error: "Missing refreshToken" }),
            {
              status: 400,
              headers: { ...headers, "Content-Type": "application/json" },
            }
          );
        }

        // Validate the token
        const result = await ctx.runQuery(api.refreshTokens.validate, { refreshToken });

        if (!result.valid) {
          return new Response(
            JSON.stringify({ valid: false, reason: result.reason }),
            {
              status: 401,
              headers: { ...headers, "Content-Type": "application/json" },
            }
          );
        }

        // Get user info
        const user = await ctx.runQuery(api.users.getByClerkId, {
          clerkId: result.clerkId!,
        });

        return new Response(
          JSON.stringify({
            valid: true,
            clerkId: result.clerkId,
            user: user ? {
              clerkId: user.clerkId,
              email: user.email,
              plan: user.plan,
            } : null,
          }),
          {
            status: 200,
            headers: { ...headers, "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("Token validate error:", error);
        return new Response(
          JSON.stringify({
            valid: false,
            error: error instanceof Error ? error.message : "Validation failed",
          }),
          {
            status: 500,
            headers: { ...headers, "Content-Type": "application/json" },
          }
        );
      }
    }),
  });

  // Extension: save prompts to dashboard
  // CORS preflight
  http.route({
    path: "/api/extension/save-prompts",
    method: "OPTIONS",
    handler: httpAction(async (_, request) => {
      const origin = request.headers.get("Origin");
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }),
  });

  // Extension: save prompts to dashboard (called after R2 upload)
  http.route({
    path: "/api/extension/save-prompts",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
      const origin = request.headers.get("Origin");
      const headers = corsHeaders(origin);

      try {
        const body = await request.json();
        const { clerkId, source, r2Key, promptCount, fileSize, headers: promptHeaders } = body as {
          clerkId: string;
          source: "chatgpt" | "claude" | "gemini" | "perplexity" | "grok" | "deepseek" | "kimi";
          r2Key: string;
          promptCount: number;
          fileSize: number;
          headers?: Record<string, string>; // Map of promptId -> header
        };

        if (!clerkId || !source || !r2Key || promptCount === undefined || fileSize === undefined) {
          return new Response(
            JSON.stringify({ error: "Missing required fields" }),
            {
              status: 400,
              headers: { ...headers, "Content-Type": "application/json" },
            }
          );
        }

        // Get user to check their plan limits
        const user = await ctx.runQuery(api.users.getByClerkId, { clerkId });
        if (!user) {
          return new Response(
            JSON.stringify({ error: "User not found" }),
            {
              status: 404,
              headers: { ...headers, "Content-Type": "application/json" },
            }
          );
        }

        // Calculate current total prompts across all saved packs
        const existingPacks = await ctx.runQuery(api.savedPacks.listByUser, { userId: user._id });

        // Calculate what the new total would be
        // When saving to a source, we replace that source's count, so exclude it from current total
        const currentTotalExcludingSource = existingPacks
          .filter(p => p.source !== source)
          .reduce((sum, p) => sum + p.promptCount, 0);
        const newTotal = currentTotalExcludingSource + promptCount;

        // Check limit based on plan (studio: 200, pro: 40, free: 10)
        const limit = user.plan === "studio" ? 200 : (user.plan === "pro" ? 40 : 10);
        if (newTotal > limit) {
          return new Response(
            JSON.stringify({
              error: `Would exceed ${limit} prompt limit (current: ${currentTotalExcludingSource}, adding: ${promptCount})`,
              allowed: false,
              limit,
              currentTotal: currentTotalExcludingSource,
            }),
            {
              status: 400,
              headers: { ...headers, "Content-Type": "application/json" },
            }
          );
        }

        // Save the pack metadata (including headers if provided)
        const result = await ctx.runMutation(api.savedPacks.upsertByClerkId, {
          clerkId,
          source,
          r2Key,
          promptCount,
          fileSize,
          headers: promptHeaders,
        });

        return new Response(
          JSON.stringify({ success: true, ...result }),
          {
            status: 200,
            headers: { ...headers, "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("Save prompts error:", error);
        return new Response(
          JSON.stringify({
            error: error instanceof Error ? error.message : "Failed to save",
          }),
          {
            status: 500,
            headers: { ...headers, "Content-Type": "application/json" },
          }
        );
      }
    }),
  });

  // Extension: check prompt limit before saving
  // CORS preflight
  http.route({
    path: "/api/extension/check-prompt-limit",
    method: "OPTIONS",
    handler: httpAction(async (_, request) => {
      const origin = request.headers.get("Origin");
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }),
  });

  // Extension: check if adding prompts would exceed limit
  http.route({
    path: "/api/extension/check-prompt-limit",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
      const origin = request.headers.get("Origin");
      const headers = corsHeaders(origin);

      try {
        const body = await request.json();
        const { clerkId, source, addingCount } = body as {
          clerkId: string;
          source: "chatgpt" | "claude" | "gemini" | "perplexity" | "grok" | "deepseek" | "kimi";
          addingCount: number;
        };

        if (!clerkId || !source || addingCount === undefined) {
          return new Response(
            JSON.stringify({ error: "Missing required fields" }),
            {
              status: 400,
              headers: { ...headers, "Content-Type": "application/json" },
            }
          );
        }

        // Get user to check their plan
        const user = await ctx.runQuery(api.users.getByClerkId, { clerkId });
        if (!user) {
          // If user not found, assume free tier limit
          return new Response(
            JSON.stringify({ allowed: true, limit: 10, currentTotal: 0 }),
            {
              status: 200,
              headers: { ...headers, "Content-Type": "application/json" },
            }
          );
        }

        // Calculate current total prompts across all saved packs
        const existingPacks = await ctx.runQuery(api.savedPacks.listByUser, { userId: user._id });

        // Calculate what the new total would be
        // When saving to a source, we replace that source's count, so exclude it from current total
        const currentTotalExcludingSource = existingPacks
          .filter(p => p.source !== source)
          .reduce((sum, p) => sum + p.promptCount, 0);
        const newTotal = currentTotalExcludingSource + addingCount;

        // Check limit based on plan (studio: 200, pro: 40, free: 10)
        const limit = user.plan === "studio" ? 200 : (user.plan === "pro" ? 40 : 10);
        const allowed = newTotal <= limit;

        return new Response(
          JSON.stringify({
            allowed,
            limit,
            currentTotal: currentTotalExcludingSource,
          }),
          {
            status: 200,
            headers: { ...headers, "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("Check limit error:", error);
        // On error, allow (fail open)
        return new Response(
          JSON.stringify({ allowed: true, limit: 40, currentTotal: 0 }),
          {
            status: 200,
            headers: { ...headers, "Content-Type": "application/json" },
          }
        );
      }
    }),
  });

  // Extension billing: get user's billing status
  // CORS preflight
  http.route({
    path: "/api/extension/billing-status",
    method: "OPTIONS",
    handler: httpAction(async (_, request) => {
      const origin = request.headers.get("Origin");
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }),
  });

  // Extension billing: get user's current plan/billing status
  http.route({
    path: "/api/extension/billing-status",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
      const origin = request.headers.get("Origin");
      const headers = corsHeaders(origin);

      try {
        const body = await request.json();
        const { clerkId } = body as { clerkId: string };

        if (!clerkId) {
          return new Response(
            JSON.stringify({ error: "Missing clerkId" }),
            {
              status: 400,
              headers: { ...headers, "Content-Type": "application/json" },
            }
          );
        }

        // Get user from Convex
        const user = await ctx.runQuery(api.users.getByClerkId, {
          clerkId,
        });

        if (!user) {
          return new Response(
            JSON.stringify({ error: "User not found" }),
            {
              status: 404,
              headers: { ...headers, "Content-Type": "application/json" },
            }
          );
        }

        // Return billing status
        return new Response(
          JSON.stringify({
            tier: user.plan,
            hasPro: user.plan === "pro" || user.plan === "studio",
            isStudio: user.plan === "studio",
          }),
          {
            status: 200,
            headers: { ...headers, "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("Billing status error:", error);
        return new Response(
          JSON.stringify({
            error: error instanceof Error ? error.message : "Failed to get billing status",
          }),
          {
            status: 500,
            headers: { ...headers, "Content-Type": "application/json" },
          }
        );
      }
    }),
  });
}
