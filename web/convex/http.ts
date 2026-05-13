import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, components, internal } from "./_generated/api";
import { registerRoutes } from "@convex-dev/stripe";
import { Webhook } from "svix";
import type Stripe from "stripe";
import { registerDesktopRoutes } from "./httpDesktop";
import { registerExtensionRoutes } from "./httpExtension";
import { registerInternalRoutes } from "./httpInternal";

const http = httpRouter();

const resolveUserId = (metadata?: Stripe.Metadata): string | undefined => {
  if (!metadata) return undefined;
  const userId = metadata.userId ?? metadata.clerkId ?? metadata.clerkUserId;
  return userId || undefined;
};

// Studio price IDs from environment
const STUDIO_MONTHLY_PRICE_ID = process.env.STRIPE_STUDIO_MONTHLY_PRICE_ID;
const STUDIO_ANNUAL_PRICE_ID = process.env.STRIPE_STUDIO_ANNUAL_PRICE_ID;
const PRO_MONTHLY_PRICE_ID = process.env.STRIPE_PRO_MONTHLY_PRICE_ID;
const PRO_ANNUAL_PRICE_ID = process.env.STRIPE_PRO_ANNUAL_PRICE_ID;
// Legacy Pro Price ID = the old $9/mo tier. Subscribers on this Price stay
// active under the grandfather flow at a reduced 300cr/mo allowance.
const PRO_LEGACY_PRICE_ID = process.env.STRIPE_PRO_LEGACY_PRICE_ID;

const isStudioPriceId = (priceId: string): boolean => {
  return priceId === STUDIO_MONTHLY_PRICE_ID || priceId === STUDIO_ANNUAL_PRICE_ID;
};

const isProPriceId = (priceId: string): boolean => {
  return (
    priceId === PRO_MONTHLY_PRICE_ID ||
    priceId === PRO_ANNUAL_PRICE_ID ||
    priceId === PRO_LEGACY_PRICE_ID
  );
};

const isProLegacyPriceId = (priceId: string): boolean => {
  return Boolean(PRO_LEGACY_PRICE_ID) && priceId === PRO_LEGACY_PRICE_ID;
};

const resolvePlanFromSubscription = (
  status: Stripe.Subscription.Status,
  subscription: Stripe.Subscription
): "free" | "pro" | "studio" => {
  if (status !== "active" && status !== "trialing" && status !== "past_due") {
    return "free";
  }

  // Check subscription items for studio price
  const items = subscription.items?.data || [];
  for (const item of items) {
    const priceId = item.price.id;
    if (isStudioPriceId(priceId)) {
      return "studio";
    }
  }
  return "pro";
};

// Returns "legacy_pro" if any subscription item is on the legacy $9 Price.
// Returns "pro" if on a standard Pro Price. Returns undefined for studio/free.
const resolveProVariantFromSubscription = (
  subscription: Stripe.Subscription
): "pro" | "legacy_pro" | undefined => {
  const items = subscription.items?.data || [];
  let onLegacy = false;
  let onCurrent = false;
  for (const item of items) {
    const priceId = item.price.id;
    if (isProLegacyPriceId(priceId)) onLegacy = true;
    else if (priceId === PRO_MONTHLY_PRICE_ID || priceId === PRO_ANNUAL_PRICE_ID) onCurrent = true;
  }
  if (onLegacy && !onCurrent) return "legacy_pro";
  if (onCurrent) return "pro";
  return undefined;
};

// Legacy function for backwards compatibility
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
      const userId = resolveUserId(customer.metadata);
      if (!userId) return;

      await ctx.runMutation(internal.users.setStripeCustomerIdByUserId, {
        userId,
        stripeCustomerId: customer.id,
      });
    },
    "customer.updated": async (ctx, event: Stripe.CustomerUpdatedEvent) => {
      const customer = event.data.object;
      const userId = resolveUserId(customer.metadata);
      if (!userId) return;

      await ctx.runMutation(internal.users.setStripeCustomerIdByUserId, {
        userId,
        stripeCustomerId: customer.id,
      });
    },
    "customer.subscription.created": async (
      ctx,
      event: Stripe.CustomerSubscriptionCreatedEvent
    ) => {
      const subscription = event.data.object;
      const userId = resolveUserId(subscription.metadata);
      if (!userId) return;

      const stripeCustomerId = typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id;

      await ctx.runMutation(internal.users.updatePlanFromStripeEvent, {
        userId,
        plan: resolvePlanFromSubscription(subscription.status, subscription),
        planVariant: resolveProVariantFromSubscription(subscription),
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
      const userId = resolveUserId(subscription.metadata);
      if (!userId) return;

      const stripeCustomerId = typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id;

      await ctx.runMutation(internal.users.updatePlanFromStripeEvent, {
        userId,
        plan: resolvePlanFromSubscription(subscription.status, subscription),
        planVariant: resolveProVariantFromSubscription(subscription),
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
      const userId = resolveUserId(subscription.metadata);
      if (!userId) return;

      const stripeCustomerId = typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id;

      await ctx.runMutation(internal.users.updatePlanFromStripeEvent, {
        userId,
        plan: "free",
        stripeCustomerId,
        stripeSubscriptionId: subscription.id,
        subscriptionCancelledAt: resolveCancelledAt(subscription),
      });
    },
    "invoice.paid": async (ctx, event: Stripe.InvoicePaidEvent) => {
      const invoice = event.data.object;
      // Only grant on real subscription billing cycles
      if (
        invoice.billing_reason !== "subscription_cycle" &&
        invoice.billing_reason !== "subscription_create"
      ) {
        return;
      }

      // Resolve userId from invoice or subscription metadata
      const subscriptionMetadata =
        typeof invoice.subscription_details?.metadata === "object"
          ? (invoice.subscription_details?.metadata as Stripe.Metadata)
          : undefined;
      const userId =
        resolveUserId(invoice.metadata as Stripe.Metadata | undefined) ??
        resolveUserId(subscriptionMetadata);
      if (!userId) return;

      // Resolve plan from line item price IDs (studio takes precedence)
      let plan: "pro" | "studio" = "pro";
      let planVariant: "pro" | "legacy_pro" | undefined = undefined;
      for (const line of invoice.lines?.data ?? []) {
        const priceId = line.price?.id ?? "";
        if (isStudioPriceId(priceId)) {
          plan = "studio";
          planVariant = undefined; // studio has no variants
          break;
        }
        if (isProLegacyPriceId(priceId)) {
          plan = "pro";
          planVariant = "legacy_pro";
        } else if (isProPriceId(priceId)) {
          plan = "pro";
          if (planVariant !== "legacy_pro") planVariant = "pro";
        }
      }

      await ctx.runMutation(internal.credits.grantMonthlyFromInvoice, {
        userId,
        invoiceId: invoice.id ?? `${event.id}_no_invoice_id`,
        plan,
        planVariant,
      });
    },
    "checkout.session.completed": async (
      ctx,
      event: Stripe.CheckoutSessionCompletedEvent
    ) => {
      const session = event.data.object;
      // Only one-time payments are top-ups; subscription mode is handled by
      // customer.subscription.* + invoice.paid above.
      if (session.mode !== "payment") return;

      const userId = resolveUserId(session.metadata as Stripe.Metadata | undefined);
      if (!userId) return;

      const credits = parseInt(session.metadata?.credits ?? "0", 10);
      if (!Number.isFinite(credits) || credits <= 0) return;

      await ctx.runMutation(internal.credits.grantTopup, {
        userId,
        credits,
        stripeEventId: event.id,
        sessionId: session.id,
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
        email_addresses?: Array<{
          email_address: string;
          verification?: { status?: string };
        }>;
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
          userId: id,
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
        const emailVerified = (email_addresses ?? []).some(
          (e) => e.verification?.status === "verified",
        );

        await ctx.runMutation(internal.users.upsertFromWebhook, {
          userId: id,
          email,
          name,
          imageUrl: image_url,
          plan: plan as "free" | "pro",
          emailVerified,
        });

        // Grant the one-time 50 free credits if this is the first time we've
        // seen the user verified. The mutation is idempotent so re-firing is safe.
        if (emailVerified) {
          await ctx.runMutation(internal.credits.grantFreeSignupCreditsIfEligible, {
            userId: id,
          });
        }
        break;
      }

      case "user.deleted": {
        const { id } = event.data;
        if (id) {
          await ctx.runMutation(internal.users.deleteByUserId, { userId: id });
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

        await ctx.runMutation(internal.users.updatePlanByUserId, {
          userId,
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
        await ctx.runMutation(internal.users.updatePlanByUserId, {
          userId,
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
        await ctx.runMutation(internal.users.updatePlanByUserId, {
          userId,
          plan: "free",
        });
        break;
      }

      default:
    }

    return new Response(null, { status: 200 });
  }),
});

// Register desktop + extension routes from separate files.
// NOTE: `httpExtension.ts` is misnamed — it now serves the desktop app's
// auth-exchange / billing-status / credit-balance / savedPacks endpoints.
// Browser extension itself is retired; these routes stay live for desktop.
// TODO: rename file + path prefix (/api/extension/* → /api/desktop/*) in a
// later pass, keeping the old paths as aliases for backward compat.
registerDesktopRoutes(http);
registerExtensionRoutes(http);
registerInternalRoutes(http);

export default http;
