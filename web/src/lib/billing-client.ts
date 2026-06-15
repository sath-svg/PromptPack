import { trackEvent, trackLinkedInConversionAndFlush } from "@/lib/analytics";
import { track } from "@/lib/posthog-events";

type CheckoutInterval = "month" | "annual";
type CheckoutPlan = "pro" | "studio";

async function parseError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    return data?.error || "Billing request failed";
  } catch {
    return "Billing request failed";
  }
}

export interface StartCheckoutOptions {
  interval: CheckoutInterval;
  plan?: CheckoutPlan;
  /** Open the subscription with a free trial (card collected, charged after). */
  trial?: boolean;
  /** App path Stripe redirects to on success (e.g. "/overview"). */
  successPath?: string;
}

export async function startStripeCheckout(opts: StartCheckoutOptions): Promise<void> {
  const { interval, plan = "pro", trial = false, successPath } = opts;
  trackEvent("checkout-started", { plan, interval });
  track("checkout_started", {
    plan,
    interval: interval === "month" ? "monthly" : "annual",
  });
  await trackLinkedInConversionAndFlush(24381836);

  const response = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ interval, plan, trial, successPath }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const data = (await response.json()) as { url?: string };
  if (!data?.url) {
    throw new Error("Checkout URL missing");
  }

  window.location.assign(data.url);
}

export async function openStripeCustomerPortal(): Promise<void> {
  const response = await fetch("/api/stripe/portal", { method: "POST" });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const data = (await response.json()) as { url?: string };
  if (!data?.url) {
    throw new Error("Portal URL missing");
  }

  window.location.assign(data.url);
}
