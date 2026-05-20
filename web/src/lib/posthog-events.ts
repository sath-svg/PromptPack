/**
 * Typed PostHog event taxonomy for the web app.
 * Keep event names + property shapes consistent across call sites.
 * See: ~/.claude/plans/i-want-to-set-peaceful-mountain.md Phase A.
 */

import { capture as posthogCapture } from "./posthog";

// Web event property types ---------------------------------------------------

type SignInSource = "google" | "facebook" | "email";
type PlanTier = "pro" | "studio";
type BillingInterval = "monthly" | "annual";
type TopupPack = "small" | "medium" | "large" | "xl";

export type WebEventMap = {
  // Auth (server-side fires too; client identifies after BetterAuth callback)
  signed_up: { source: SignInSource; email?: string };
  signed_in: { source: SignInSource };
  // Billing
  pricing_viewed: Record<string, never>;
  checkout_started: { plan: PlanTier; interval: BillingInterval };
  checkout_completed: {
    plan: PlanTier;
    interval: BillingInterval;
    amount_cents: number;
    stripe_session_id: string;
    is_first_purchase?: boolean;
  };
  topup_clicked: { pack: TopupPack; credits: number; price_cents: number };
  topup_completed: {
    pack: TopupPack;
    credits: number;
    amount_cents: number;
    stripe_session_id: string;
  };
  feedback_viewed: Record<string, never>;
};

export type WebEventName = keyof WebEventMap;

/**
 * Fire a typed PostHog event. No-op when PostHog isn't initialized (e.g. on
 * public marketing routes outside PRODUCT_PREFIXES). Safe to call from
 * anywhere; never throws.
 */
export function track<E extends WebEventName>(
  event: E,
  properties: WebEventMap[E],
): void {
  posthogCapture(event, properties as Record<string, string | number | boolean | null | undefined>);
}
