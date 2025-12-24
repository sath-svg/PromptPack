import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Webhook } from "svix";

const http = httpRouter();

// Clerk webhook handler for user and subscription events
http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Get the webhook secret from environment
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("Missing CLERK_WEBHOOK_SECRET");
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
        payer?: {
          user_id?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
        };
        plan?: {
          slug?: string;
          name?: string;
        };
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

    console.log("Received webhook event:", event.type);
    console.log("Event data:", JSON.stringify(event.data, null, 2));
    console.log("Payer user_id:", event.data.payer?.user_id);
    console.log("Status:", event.data.status);

    // Handle different event types
    switch (event.type) {
      case "user.created":
      case "user.updated": {
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
      case "subscription.updated": {
        // These may have a different data structure - try both formats
        const userId = event.data.payer?.user_id;
        const status = event.data.status;
        if (!userId) {
          console.log("subscription event: no payer.user_id found");
          break;
        }

        const plan = status === "active" ? "pro" : "free";
        console.log(`[subscription.*] Updating user ${userId} to plan: ${plan} (status: ${status})`);
        await ctx.runMutation(internal.users.updatePlanByClerkId, {
          clerkId: userId,
          plan: plan as "free" | "pro",
        });
        break;
      }

      // Clerk Billing subscriptionItem events (subscriptionItem.* format)
      case "subscriptionItem.created":
      case "subscriptionItem.updated": {
        const userId = event.data.payer?.user_id;
        const status = event.data.status;
        if (!userId) {
          console.log("subscriptionItem event: no payer.user_id found");
          break;
        }

        // Active subscription means Pro plan
        const plan = status === "active" ? "pro" : "free";
        console.log(`[subscriptionItem.*] Updating user ${userId} to plan: ${plan} (status: ${status})`);
        await ctx.runMutation(internal.users.updatePlanByClerkId, {
          clerkId: userId,
          plan: plan as "free" | "pro",
        });
        break;
      }

      case "subscriptionItem.canceled":
      case "subscriptionItem.deleted": {
        const userId = event.data.payer?.user_id;
        if (!userId) {
          console.log("subscriptionItem cancel/delete: no payer.user_id found");
          break;
        }

        // Downgrade to free plan
        console.log(`[subscriptionItem.*] Downgrading user ${userId} to free plan`);
        await ctx.runMutation(internal.users.updatePlanByClerkId, {
          clerkId: userId,
          plan: "free",
        });
        break;
      }

      default:
        console.log("Unhandled webhook event type:", event.type);
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

export default http;
