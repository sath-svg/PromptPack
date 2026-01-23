import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, components, internal } from "./_generated/api";
import { registerRoutes } from "@convex-dev/stripe";
import { Webhook } from "svix";
import type Stripe from "stripe";

const http = httpRouter();

const resolveClerkId = (metadata?: Stripe.Metadata): string | undefined => {
  if (!metadata) return undefined;
  const userId = metadata.userId ?? metadata.clerkId ?? metadata.clerkUserId;
  return userId || undefined;
};

const resolvePlanFromStatus = (status: Stripe.Subscription.Status): "free" | "pro" => {
  if (status === "active" || status === "trialing" || status === "past_due") {
    return "pro";
  }
  return "free";
};

const resolveCancelledAt = (subscription: Stripe.Subscription): number | undefined => {
  if (subscription.canceled_at) return subscription.canceled_at * 1000;
  if (subscription.ended_at) return subscription.ended_at * 1000;
  if (subscription.cancel_at_period_end && subscription.current_period_end) {
    return subscription.current_period_end * 1000;
  }
  return undefined;
};

registerRoutes(http, components.stripe, {
  webhookPath: "/stripe/webhook",
  events: {
    "customer.created": async (ctx, event: Stripe.CustomerCreatedEvent) => {
      const customer = event.data.object;
      const clerkId = resolveClerkId(customer.metadata);
      if (!clerkId) return;

      await ctx.runMutation(internal.users.setStripeCustomerIdByClerkId, {
        clerkId,
        stripeCustomerId: customer.id,
      });
    },
    "customer.updated": async (ctx, event: Stripe.CustomerUpdatedEvent) => {
      const customer = event.data.object;
      const clerkId = resolveClerkId(customer.metadata);
      if (!clerkId) return;

      await ctx.runMutation(internal.users.setStripeCustomerIdByClerkId, {
        clerkId,
        stripeCustomerId: customer.id,
      });
    },
    "customer.subscription.created": async (
      ctx,
      event: Stripe.CustomerSubscriptionCreatedEvent
    ) => {
      const subscription = event.data.object;
      const clerkId = resolveClerkId(subscription.metadata);
      if (!clerkId) return;

      const stripeCustomerId = typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id;

      await ctx.runMutation(internal.users.updatePlanFromStripeEvent, {
        clerkId,
        plan: resolvePlanFromStatus(subscription.status),
        stripeCustomerId,
        stripeSubscriptionId: subscription.id,
        subscriptionCancelledAt: resolveCancelledAt(subscription),
      });
    },
    "customer.subscription.updated": async (
      ctx,
      event: Stripe.CustomerSubscriptionUpdatedEvent
    ) => {
      const subscription = event.data.object;
      const clerkId = resolveClerkId(subscription.metadata);
      if (!clerkId) return;

      const stripeCustomerId = typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id;

      await ctx.runMutation(internal.users.updatePlanFromStripeEvent, {
        clerkId,
        plan: resolvePlanFromStatus(subscription.status),
        stripeCustomerId,
        stripeSubscriptionId: subscription.id,
        subscriptionCancelledAt: resolveCancelledAt(subscription),
      });
    },
    "customer.subscription.deleted": async (
      ctx,
      event: Stripe.CustomerSubscriptionDeletedEvent
    ) => {
      const subscription = event.data.object;
      const clerkId = resolveClerkId(subscription.metadata);
      if (!clerkId) return;

      const stripeCustomerId = typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id;

      await ctx.runMutation(internal.users.updatePlanFromStripeEvent, {
        clerkId,
        plan: "free",
        stripeCustomerId,
        stripeSubscriptionId: subscription.id,
        subscriptionCancelledAt: resolveCancelledAt(subscription),
      });
    },
  },
});

// Clerk webhook handler for user and subscription events
http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Get the webhook secret from environment
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("=== CLERK WEBHOOK ERROR ===");
      console.error("CLERK_WEBHOOK_SECRET is not set in Convex environment variables");
      console.error("To fix: Run 'npx convex env set CLERK_WEBHOOK_SECRET whsec_xxx'");
      console.error("Get the secret from: Clerk Dashboard → Webhooks → Signing Secret");
      return new Response("Webhook secret not configured", { status: 500 });
    }


    // Verify the webhook signature
    const svix_id = request.headers.get("svix-id");
    const svix_timestamp = request.headers.get("svix-timestamp");
    const svix_signature = request.headers.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new Response("Missing svix headers", { status: 400 });
    }

    const body = await request.text();

    // Define flexible event type to handle various Clerk webhook payloads
    type ClerkWebhookEvent = {
      type: string;
      data: {
        // User event fields
        id?: string;
        email_addresses?: Array<{ email_address: string }>;
        first_name?: string;
        last_name?: string;
        image_url?: string;
        public_metadata?: { plan?: string };
        // Subscription/SubscriptionItem event fields
        status?: string;
        user_id?: string;
        payer?: {
          user_id?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
        };
        customer?: {
          user_id?: string;
          id?: string;
        };
        subscriber?: {
          user_id?: string;
        };
        subscription?: {
          user_id?: string;
          status?: string;
        };
        plan?: {
          slug?: string;
          name?: string;
        };
        // Subscription items array (for subscription.* events)
        items?: Array<{
          status?: string;
          plan?: {
            slug?: string;
            name?: string;
          };
        }>;
      };
    };

    let event: ClerkWebhookEvent;

    try {
      const wh = new Webhook(webhookSecret);
      event = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as ClerkWebhookEvent;
    } catch (err) {
      console.error("Webhook verification failed:", err);
      return new Response("Invalid signature", { status: 400 });
    }

    const resolveUserId = (data: ClerkWebhookEvent["data"]): string | undefined => {
      return (
        data.payer?.user_id ??
        data.user_id ??
        data.subscription?.user_id ??
        data.subscriber?.user_id ??
        data.customer?.user_id ??
        data.customer?.id
      );
    };

    const resolvePlan = (status?: string, planSlug?: string): "free" | "pro" => {
      // Explicitly check for canceled/ended statuses first
      if (status === "canceled" || status === "ended" || status === "expired" || status === "incomplete_expired") {
        return "free";
      }
      if (planSlug === "pro" && (status === "active" || status === "trialing")) {
        return "pro";
      }
      if (status === "active" || status === "trialing") {
        return "pro";
      }
      return "free";
    };

    const resolvedUserId = resolveUserId(event.data);
    const status = event.data.status ?? event.data.subscription?.status;


    // Handle different event types
    switch (event.type) {
      case "user.created": {
        const { id, email_addresses, first_name, last_name, image_url, public_metadata } = event.data;
        if (!id) break;

        const email = email_addresses?.[0]?.email_address || "";
        const name = [first_name, last_name].filter(Boolean).join(" ") || undefined;
        const plan = public_metadata?.plan === "pro" ? "pro" : "free";

        await ctx.runMutation(internal.users.upsertFromWebhook, {
          clerkId: id,
          email,
          name,
          imageUrl: image_url,
          plan: plan as "free" | "pro",
        });

        // Send welcome email to new user
        if (email) {
          await ctx.runAction(internal.email.sendWelcomeEmail, { email });
        }
        break;
      }

      case "user.updated": {
        const { id, email_addresses, first_name, last_name, image_url, public_metadata } = event.data;
        if (!id) break;

        const email = email_addresses?.[0]?.email_address || "";
        const name = [first_name, last_name].filter(Boolean).join(" ") || undefined;
        // Prioritize public_metadata.plan for admin control
        const plan = public_metadata?.plan === "pro" ? "pro" : "free";

        await ctx.runMutation(internal.users.upsertFromWebhook, {
          clerkId: id,
          email,
          name,
          imageUrl: image_url,
          plan: plan as "free" | "pro",
        });
        break;
      }

      case "user.deleted": {
        const { id } = event.data;
        if (id) {
          await ctx.runMutation(internal.users.deleteByClerkId, { clerkId: id });
        }
        break;
      }

      // Clerk Billing subscription events (subscription.* format)
      case "subscription.created":
      case "subscription.updated":
      case "subscription.canceled":
      case "subscription.deleted": {
        // These may have a different data structure - try multiple formats
        const userId = resolveUserId(event.data);
        const subscriptionStatus = event.data.status ?? event.data.subscription?.status;

        if (!userId) {
          break;
        }


        // Check subscription items for active/upcoming pro plans
        const items = event.data.items;
        let hasActivePro = false;

        if (items && Array.isArray(items)) {

          for (const item of items) {
            const itemStatus = item.status;
            const planSlug = item.plan?.slug;


            // Check if this is an active or upcoming Pro subscription
            if ((itemStatus === "active" || itemStatus === "upcoming") &&
                (planSlug === "pro" || item.plan?.name === "Pro")) {
              hasActivePro = true;
              break;
            }
          }
        }

        const plan = hasActivePro ? "pro" : "free";

        await ctx.runMutation(internal.users.updatePlanByClerkId, {
          clerkId: userId,
          plan: plan as "free" | "pro",
        });
        break;
      }

      // Clerk Billing subscriptionItem events (subscriptionItem.* format)
      case "subscriptionItem.created":
      case "subscriptionItem.updated": {
        const userId = resolveUserId(event.data);
        const status = event.data.status ?? event.data.subscription?.status;
        const planSlug = event.data.plan?.slug;
        if (!userId) {
          break;
        }

        // Active subscription means Pro plan
        const plan = resolvePlan(status, planSlug);
        await ctx.runMutation(internal.users.updatePlanByClerkId, {
          clerkId: userId,
          plan: plan as "free" | "pro",
        });
        break;
      }

      case "subscriptionItem.canceled":
      case "subscriptionItem.deleted": {
        const userId = resolveUserId(event.data);
        if (!userId) {
          break;
        }

        // Downgrade to free plan
        await ctx.runMutation(internal.users.updatePlanByClerkId, {
          clerkId: userId,
          plan: "free",
        });
        break;
      }

      default:
    }

    return new Response(null, { status: 200 });
  }),
});

// CORS headers for extension requests
function corsHeaders(origin: string | null): HeadersInit {
  // Allow chrome-extension:// origins and localhost for dev
  if (origin?.startsWith("chrome-extension://") || origin?.includes("localhost")) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    };
  }
  return {};
}


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
        source: "chatgpt" | "claude" | "gemini";
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
        source: "chatgpt" | "claude" | "gemini";
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

      // Check limit based on plan
      const limit = user.plan === "pro" ? 40 : 10;
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
        source: "chatgpt" | "claude" | "gemini";
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

      // Check limit based on plan
      const limit = user.plan === "pro" ? 40 : 10;
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
          hasPro: user.plan === "pro",
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

export default http;
