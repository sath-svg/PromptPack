import { action } from "./_generated/server";
import { components } from "./_generated/api";
import { StripeSubscriptions } from "@convex-dev/stripe";
import { v } from "convex/values";

const stripeClient = new StripeSubscriptions(components.stripe, {});

export const createSubscriptionCheckout = action({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    priceId: v.string(),
    successUrl: v.string(),
    cancelUrl: v.string(),
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

// Create checkout session for one-time pack purchase
export const createPackPurchaseCheckout = action({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    listingId: v.string(),
    packId: v.string(),
    authorId: v.string(),
    priceInCents: v.number(),
    title: v.string(),
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
  returns: v.object({
    sessionId: v.string(),
    url: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    // Use the raw Stripe SDK since we need line_items with price_data
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_API_KEY!, {
      apiVersion: "2025-12-15.clover",
    });

    const customer = await stripeClient.getOrCreateCustomer(ctx, {
      userId: args.clerkId,
      email: args.email,
      name: args.name,
    });

    const session = await stripe.checkout.sessions.create({
      customer: customer.customerId,
      mode: "payment",
      success_url: args.successUrl,
      cancel_url: args.cancelUrl,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: args.priceInCents,
            product_data: {
              name: args.title,
              description: "PromptPack marketplace purchase",
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: "pack_purchase",
        listingId: args.listingId,
        packId: args.packId,
        buyerUserId: args.clerkId,
        authorId: args.authorId,
        priceInCents: String(args.priceInCents),
      },
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  },
});
