import { NextResponse } from "next/server";
import { auth, currentUser } from "@/lib/auth-server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

type CheckoutInterval = "month" | "annual";
type CheckoutPlan = "pro" | "studio";

// Pro plan prices
const PRO_MONTHLY_PRICE_ID = process.env.STRIPE_PRO_MONTHLY_PRICE_ID;
const PRO_ANNUAL_PRICE_ID = process.env.STRIPE_PRO_ANNUAL_PRICE_ID;

// Studio plan prices
const STUDIO_MONTHLY_PRICE_ID = process.env.STRIPE_STUDIO_MONTHLY_PRICE_ID;
const STUDIO_ANNUAL_PRICE_ID = process.env.STRIPE_STUDIO_ANNUAL_PRICE_ID;

// Early-bird coupons retired post-Skillset migration. Constants kept (commented)
// for historical reference / quick re-enable. Existing legacy subscribers keep
// their Stripe-side coupon — code change here only affects NEW checkouts.
// const EARLY_BIRD_MONTHLY_COUPON_ID = process.env.STRIPE_EARLY_BIRD_MONTHLY_COUPON_ID;
// const EARLY_BIRD_ANNUAL_COUPON_ID = process.env.STRIPE_EARLY_BIRD_ANNUAL_COUPON_ID;
// const EARLY_BIRD_LIMIT = 9;
const convexClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function resolvePriceId(plan: CheckoutPlan, interval: CheckoutInterval): string | undefined {
  if (plan === "studio") {
    return interval === "annual" ? STUDIO_ANNUAL_PRICE_ID : STUDIO_MONTHLY_PRICE_ID;
  }
  return interval === "annual" ? PRO_ANNUAL_PRICE_ID : PRO_MONTHLY_PRICE_ID;
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      interval?: CheckoutInterval;
      plan?: CheckoutPlan;
      trial?: boolean;
      successPath?: string;
    };
    const interval: CheckoutInterval = body.interval === "annual" ? "annual" : "month";
    const plan: CheckoutPlan = body.plan === "studio" ? "studio" : "pro";
    const priceId = resolvePriceId(plan, interval);

    // Only allow same-origin relative success paths (no open redirect).
    const successPath =
      typeof body.successPath === "string" && body.successPath.startsWith("/")
        ? body.successPath
        : "/dashboard?checkout=success";

    if (!priceId) {
      return NextResponse.json({ error: "Missing Stripe price configuration" }, { status: 500 });
    }

    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;

    if (!email) {
      return NextResponse.json({ error: "Missing user email" }, { status: 400 });
    }

    const origin = request.headers.get("origin")
      ?? process.env.NEXT_PUBLIC_APP_URL
      ?? "http://localhost:3000";

    // Early-bird coupon flow retired — new checkouts go through at flat
    // priceId only. To re-enable: restore the EARLY_BIRD_* constants above
    // plus the gating block here, then re-add `couponId` to the action call.

    const session = await convexClient.action(api.stripe.createSubscriptionCheckout, {
      userId,
      email,
      name: user?.fullName ?? undefined,
      priceId,
      successUrl: `${origin}${successPath}`,
      cancelUrl: `${origin}/pricing?checkout=cancel`,
      trialDays: body.trial ? 3 : undefined,
    });

    if (!session?.url) {
      return NextResponse.json({ error: "Checkout URL missing" }, { status: 500 });
    }

    // Fire the Loops `checkoutStarted` event so the abandoned-checkout workflow
    // can target users who started but never completed — without depending on
    // the client landing back on the cancel page. Fire-and-forget.
    void convexClient
      .action(api.loops.notifyCheckoutStarted, { userId, email })
      .catch(() => {});

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start checkout" },
      { status: 500 }
    );
  }
}
