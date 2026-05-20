import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, components, internal } from "./_generated/api";
import { registerRoutes } from "@convex-dev/stripe";
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

/**
 * Resolve the user behind a Stripe webhook event with two paths:
 *   1. Try metadata.userId / clerkId / clerkUserId (current sign-up flow sets this)
 *   2. Fall back to looking up by stripeCustomerId on the user row itself
 *      (handles legacy Clerk-era subscribers whose metadata.userId points at
 *       an old Convex _id that no longer exists post BetterAuth migration)
 *
 * Returns the user's Convex _id as a string, or undefined if neither path hits.
 */
const resolveUserIdWithFallback = async (
  ctx: { runQuery: (ref: any, args: any) => Promise<unknown> },
  metadata: Stripe.Metadata | undefined,
  stripeCustomerId: string | undefined,
): Promise<string | undefined> => {
  const fromMetadata = resolveUserId(metadata);
  if (fromMetadata) return fromMetadata;
  if (!stripeCustomerId) return undefined;
  // ctx.runQuery returns the query's declared return type, but TS can't always
  // infer it through the generic ActionCtx — assert against the known shape.
  const fromCustomer = (await ctx.runQuery(
    internal.users.getUserIdByStripeCustomerId,
    { stripeCustomerId },
  )) as string | null;
  return fromCustomer ?? undefined;
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
      const stripeCustomerId = typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id;
      const userId = await resolveUserIdWithFallback(
        ctx,
        subscription.metadata,
        stripeCustomerId,
      );
      if (!userId) return;

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
      const stripeCustomerId = typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id;
      const userId = await resolveUserIdWithFallback(
        ctx,
        subscription.metadata,
        stripeCustomerId,
      );
      if (!userId) return;

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
      const stripeCustomerId = typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id;
      const userId = await resolveUserIdWithFallback(
        ctx,
        subscription.metadata,
        stripeCustomerId,
      );
      if (!userId) return;

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

      // Resolve userId from invoice or subscription metadata, with a final
      // fallback to stripeCustomerId so legacy subscribers (whose metadata
      // points at a stale Clerk-era _id) still get their renewal credits.
      const subscriptionMetadata =
        typeof invoice.subscription_details?.metadata === "object"
          ? (invoice.subscription_details?.metadata as Stripe.Metadata)
          : undefined;
      const stripeCustomerId =
        typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id;
      const userId =
        resolveUserId(invoice.metadata as Stripe.Metadata | undefined) ??
        resolveUserId(subscriptionMetadata) ??
        (await resolveUserIdWithFallback(ctx, undefined, stripeCustomerId));
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

      // PostHog server-side event — survives ad-blockers / lost client
      // redirects. Errors swallowed by captureServer; webhook continues.
      const billingInterval =
        invoice.lines?.data?.[0]?.price?.recurring?.interval ?? "month";
      await ctx.runAction(internal.posthog.captureServer, {
        distinctId: userId,
        event: "checkout_completed",
        properties: {
          plan,
          interval: billingInterval === "year" ? "annual" : "monthly",
          amount_cents: invoice.amount_paid ?? 0,
          stripe_session_id: invoice.id ?? `${event.id}_no_invoice_id`,
          billing_reason: invoice.billing_reason ?? "",
        },
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

      // PostHog server-side event for confirmed topup.
      const packKey: "small" | "medium" | "large" | "xl" | "unknown" =
        credits === 200
          ? "small"
          : credits === 500
            ? "medium"
            : credits === 1500
              ? "large"
              : credits === 5000
                ? "xl"
                : "unknown";
      await ctx.runAction(internal.posthog.captureServer, {
        distinctId: userId,
        event: "topup_completed",
        properties: {
          pack: packKey,
          credits,
          amount_cents: session.amount_total ?? 0,
          stripe_session_id: session.id,
        },
      });
    },
  },
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
