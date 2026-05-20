"use node";

import { internalAction } from "./_generated/server";
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
