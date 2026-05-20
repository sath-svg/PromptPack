"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";

const ENDPOINT = "https://us.i.posthog.com/capture/";

/**
 * Fire a PostHog event from Convex (server-side). Used for events that must
 * survive ad-blockers / lost redirects — primarily Stripe webhook outcomes.
 *
 * `distinctId` must match the client-side `posthog.identify(...)` ID
 * (BetterAuth user id) or PostHog will create a duplicate person profile.
 *
 * Errors are logged but never thrown — webhook path must not break on a
 * PostHog outage.
 */
export const captureServer = internalAction({
  args: {
    distinctId: v.string(),
    event: v.string(),
    properties: v.optional(
      v.record(
        v.string(),
        v.union(v.string(), v.number(), v.boolean(), v.null()),
      ),
    ),
  },
  handler: async (_, { distinctId, event, properties }) => {
    const apiKey = process.env.POSTHOG_API_KEY;
    if (!apiKey) {
      console.warn(
        `[posthog] POSTHOG_API_KEY not set — skipping ${event} for ${distinctId}`,
      );
      return { success: false, skipped: true };
    }

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          event,
          distinct_id: distinctId,
          properties: {
            ...(properties ?? {}),
            // Tag every server-side event so dashboards can split web/desktop/server.
            $lib: "convex",
            surface: "server",
          },
          timestamp: new Date().toISOString(),
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        console.error(
          `[posthog] ${event} for ${distinctId} failed: ${res.status} ${text}`,
        );
        return { success: false, status: res.status };
      }
      return { success: true };
    } catch (err) {
      console.error(`[posthog] ${event} for ${distinctId} threw:`, err);
      return { success: false, error: String(err) };
    }
  },
});
