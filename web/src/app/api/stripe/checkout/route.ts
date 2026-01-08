import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

type CheckoutInterval = "month" | "annual";
type CheckoutPlan = "pro" | "studio";

// Pro plan price IDs
const PRO_MONTHLY_PRICE_ID = process.env.STRIPE_PRO_MONTHLY_PRICE_ID;
const PRO_ANNUAL_PRICE_ID = process.env.STRIPE_PRO_ANNUAL_PRICE_ID;

// Studio plan price IDs
const STUDIO_MONTHLY_PRICE_ID = process.env.STRIPE_STUDIO_MONTHLY_PRICE_ID;
const STUDIO_ANNUAL_PRICE_ID = process.env.STRIPE_STUDIO_ANNUAL_PRICE_ID;

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
    };
    const interval: CheckoutInterval = body.interval === "annual" ? "annual" : "month";
    const plan: CheckoutPlan = body.plan === "studio" ? "studio" : "pro";
    const priceId = resolvePriceId(plan, interval);

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

    const session = await convexClient.action(api.stripe.createSubscriptionCheckout, {
      clerkId: userId,
      email,
      name: user?.fullName ?? user?.firstName ?? undefined,
      priceId,
      successUrl: `${origin}/dashboard?checkout=success`,
      cancelUrl: `${origin}/pricing?checkout=cancel`,
    });

    if (!session?.url) {
      return NextResponse.json({ error: "Checkout URL missing" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start checkout" },
      { status: 500 }
    );
  }
}
