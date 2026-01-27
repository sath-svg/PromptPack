import { action } from "./_generated/server";
import { components } from "./_generated/api";
import { StripeSubscriptions } from "@convex-dev/stripe";
import { v } from "convex/values";
import Stripe from "stripe";

const stripeClient = new StripeSubscriptions(components.stripe, {});

export const createSubscriptionCheckout = action({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    priceId: v.string(),
    successUrl: v.string(),
    cancelUrl: v.string(),
    couponId: v.optional(v.string()),
  },
  returns: v.object({
    sessionId: v.string(),
    url: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const customer = await stripeClient.getOrCreateCustomer(ctx, {
      userId: args.clerkId,
      email: args.email,
      name: args.name,
    });

    // When a coupon is provided, use the raw Stripe SDK since the
    // @convex-dev/stripe wrapper doesn't support the discounts parameter.
    if (args.couponId) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      const session = await stripe.checkout.sessions.create({
        customer: customer.customerId,
        mode: "subscription",
        line_items: [{ price: args.priceId, quantity: 1 }],
        success_url: args.successUrl,
        cancel_url: args.cancelUrl,
        discounts: [{ coupon: args.couponId }],
        metadata: { userId: args.clerkId },
        subscription_data: {
          metadata: { userId: args.clerkId },
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
      metadata: { userId: args.clerkId },
      subscriptionMetadata: { userId: args.clerkId },
    });
  },
});

export const createCustomerPortalSession = action({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    returnUrl: v.string(),
  },
  returns: v.object({
    url: v.string(),
  }),
  handler: async (ctx, args) => {
    const customer = await stripeClient.getOrCreateCustomer(ctx, {
      userId: args.clerkId,
      email: args.email,
      name: args.name,
    });

    return await stripeClient.createCustomerPortalSession(ctx, {
      customerId: customer.customerId,
      returnUrl: args.returnUrl,
    });
  },
});
