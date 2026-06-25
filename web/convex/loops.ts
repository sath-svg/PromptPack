"use node";

import { action, internalAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { v } from "convex/values";

const ENDPOINT = "https://app.loops.so/api/v1/events/send";

/**
 * Fire a Loops.so event for the given email. Loops then runs whatever
 * sequence/campaign is wired to that event name in their dashboard.
 *
 * Errors are logged but never thrown — email is fire-and-forget and must
 * never block a signup, session-create, or cron pass.
 */
export const sendEvent = internalAction({
  args: {
    email: v.string(),
    eventName: v.string(),
    properties: v.optional(v.record(v.string(), v.union(v.string(), v.number(), v.boolean()))),
    userId: v.optional(v.string()),
  },
  handler: async (_, { email, eventName, properties, userId }) => {
    const apiKey = process.env.LOOPS_API_KEY;
    if (!apiKey) {
      console.warn(
        `[loops] LOOPS_API_KEY not set — skipping ${eventName} for ${email}`,
      );
      return { success: false, skipped: true };
    }

    const body: Record<string, unknown> = {
      email,
      eventName,
    };
    if (userId) body.userId = userId;
    if (properties) body.eventProperties = properties;

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        console.error(
          `[loops] ${eventName} for ${email} failed: ${res.status} ${text}`,
        );
        return { success: false, status: res.status };
      }
      return { success: true };
    } catch (err) {
      console.error(`[loops] ${eventName} for ${email} threw:`, err);
      return { success: false, error: String(err) };
    }
  },
});

/**
 * Public wrapper: fire the `checkoutStarted` Loops event when a user launches
 * the Stripe trial checkout. Paired with `checkoutCancelled` so the Loops
 * abandoned-checkout workflow can target users who *started* but never
 * completed — instead of relying on the user landing back on the cancel page.
 * Called server-side from the checkout route. Fire-and-forget; never throws.
 */
export const notifyCheckoutStarted = action({
  args: { userId: v.string(), email: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, { userId, email }) => {
    let to = email;
    if (!to) {
      const user = await ctx.runQuery(api.users.getByUserId, { userId });
      to = user?.email ?? undefined;
    }
    if (!to) return null;
    await ctx.runAction(internal.loops.sendEvent, {
      email: to,
      eventName: "checkoutStarted",
      userId,
    });
    return null;
  },
});

/**
 * Public wrapper: fire the `checkoutCancelled` Loops event for a user who
 * abandoned the Stripe checkout. Called from the cancel page via a Next route
 * (which supplies the authenticated userId). Resolves the email server-side so
 * the client never passes it. Fire-and-forget; never throws.
 */
export const notifyCheckoutCancelled = action({
  args: { userId: v.string() },
  returns: v.null(),
  handler: async (ctx, { userId }) => {
    const user = await ctx.runQuery(api.users.getByUserId, { userId });
    if (!user?.email) return null;
    await ctx.runAction(internal.loops.sendEvent, {
      email: user.email,
      eventName: "checkoutCancelled",
      userId,
    });
    return null;
  },
});
