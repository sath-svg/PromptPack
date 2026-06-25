import { action } from "./_generated/server";
import { components } from "./_generated/api";
import { StripeSubscriptions } from "@convex-dev/stripe";
import { v } from "convex/values";
import Stripe from "stripe";

const stripeClient = new StripeSubscriptions(components.stripe, {});

/**
 * Stamp the BetterAuth user ID onto the Stripe Customer's metadata. The
 * `@convex-dev/stripe` wrapper may not propagate metadata at create time, so
 * we always patch it here. This is what lets the webhook handler resolve a
 * user from any future `customer.*`, `subscription.*`, or `invoice.*` event
 * — even if the subscription was created via the Customer Portal (which can
 * skip our checkout flow entirely and produce events with empty subscription
 * metadata).
 *
 * Idempotent: re-running with the same userId is a no-op against Stripe.
 * Safe to call on every checkout / portal entry.
 */
async function stampCustomerMetadata(
  customerId: string,
  userId: string,
): Promise<void> {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  try {
    await stripe.customers.update(customerId, {
      metadata: { userId },
    });
  } catch (err) {
    console.error(
      `[stripe] failed to stamp metadata.userId on customer ${customerId}:`,
      err instanceof Error ? err.message : String(err),
    );
    // Don't throw — checkout should still succeed even if metadata stamp fails.
  }
}

export const createSubscriptionCheckout = action({
  args: {
    userId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    priceId: v.string(),
    successUrl: v.string(),
    cancelUrl: v.string(),
    couponId: v.optional(v.string()),
    // When set, opens the subscription with a free trial. The card is collected
    // up front and only charged after the trial ends. Used by the /start-trial
    // funnel (3-day Pro trial).
    trialDays: v.optional(v.number()),
  },
  returns: v.object({
    sessionId: v.string(),
    url: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const customer = await stripeClient.getOrCreateCustomer(ctx, {
      userId: args.userId,
      email: args.email,
      name: args.name,
    });

    // Always stamp BetterAuth userId on the Stripe Customer so future webhook
    // events can resolve back to the user even via fallback lookups.
    await stampCustomerMetadata(customer.customerId, args.userId);

    // The @convex-dev/stripe wrapper doesn't expose the discounts or
    // trial_period_days parameters, so when either a coupon or a trial is
    // requested we drop down to the raw Stripe SDK.
    if (args.couponId || args.trialDays) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      const session = await stripe.checkout.sessions.create({
        customer: customer.customerId,
        mode: "subscription",
        line_items: [{ price: args.priceId, quantity: 1 }],
        success_url: args.successUrl,
        cancel_url: args.cancelUrl,
        ...(args.couponId ? { discounts: [{ coupon: args.couponId }] } : {}),
        metadata: { userId: args.userId },
        // Expire fast (30 min, Stripe's minimum) so a tab-close abandon fires
        // `checkout.session.expired` quickly instead of waiting ~24h. The
        // webhook handler turns that into the `checkoutCancelled` Loops event.
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
        subscription_data: {
          metadata: { userId: args.userId },
          ...(args.trialDays ? { trial_period_days: args.trialDays } : {}),
        },
      });
      return { sessionId: session.id, url: session.url };
    }

    return await stripeClient.createCheckoutSession(ctx, {
      priceId: args.priceId,
      customerId: customer.customerId,
      mode: "subscription",
      successUrl: args.successUrl,
      cancelUrl: args.cancelUrl,
      metadata: { userId: args.userId },
      subscriptionMetadata: { userId: args.userId },
    });
  },
});

export const createTopupCheckout = action({
  args: {
    userId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    priceId: v.string(),
    credits: v.number(),
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
  returns: v.object({
    sessionId: v.string(),
    url: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const customer = await stripeClient.getOrCreateCustomer(ctx, {
      userId: args.userId,
      email: args.email,
      name: args.name,
    });

    await stampCustomerMetadata(customer.customerId, args.userId);

    // Use raw Stripe SDK so we can attach credits in metadata for the
    // checkout.session.completed webhook handler in http.ts.
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const session = await stripe.checkout.sessions.create({
      customer: customer.customerId,
      mode: "payment",
      line_items: [{ price: args.priceId, quantity: 1 }],
      success_url: args.successUrl,
      cancel_url: args.cancelUrl,
      metadata: {
        userId: args.userId,
        credits: String(args.credits),
        type: "topup",
      },
    });
    return { sessionId: session.id, url: session.url };
  },
});

export const createCustomerPortalSession = action({
  args: {
    userId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    returnUrl: v.string(),
  },
  returns: v.object({
    url: v.string(),
  }),
  handler: async (ctx, args) => {
    const customer = await stripeClient.getOrCreateCustomer(ctx, {
      userId: args.userId,
      email: args.email,
      name: args.name,
    });

    await stampCustomerMetadata(customer.customerId, args.userId);

    return await stripeClient.createCustomerPortalSession(ctx, {
      customerId: customer.customerId,
      returnUrl: args.returnUrl,
    });
  },
});
