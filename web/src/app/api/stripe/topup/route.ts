import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

type TopupPack = "small" | "medium" | "large" | "xl";

interface PackConfig {
  credits: number;
  envVar: string;
}

const PACK_CONFIG: Record<TopupPack, PackConfig> = {
  small: { credits: 200, envVar: "STRIPE_TOPUP_200_PRICE_ID" },
  medium: { credits: 500, envVar: "STRIPE_TOPUP_500_PRICE_ID" },
  large: { credits: 1500, envVar: "STRIPE_TOPUP_1500_PRICE_ID" },
  xl: { credits: 5000, envVar: "STRIPE_TOPUP_5000_PRICE_ID" },
};

const convexClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function isPackKey(value: unknown): value is TopupPack {
  return value === "small" || value === "medium" || value === "large" || value === "xl";
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as { pack?: unknown };
    if (!isPackKey(body.pack)) {
      return NextResponse.json({ error: "Invalid pack" }, { status: 400 });
    }

    const config = PACK_CONFIG[body.pack];
    const priceId = process.env[config.envVar];
    if (!priceId) {
      return NextResponse.json(
        { error: `Missing Stripe price for pack: ${body.pack}` },
        { status: 500 },
      );
    }

    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;
    if (!email) {
      return NextResponse.json({ error: "Missing user email" }, { status: 400 });
    }

    const origin =
      request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const session = await convexClient.action(api.stripe.createTopupCheckout, {
      clerkId: userId,
      email,
      name: user?.fullName ?? user?.firstName ?? undefined,
      priceId,
      credits: config.credits,
      successUrl: `${origin}/dashboard?topup=success`,
      cancelUrl: `${origin}/dashboard?topup=cancel`,
    });

    if (!session?.url) {
      return NextResponse.json({ error: "Checkout URL missing" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe top-up error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start checkout" },
      { status: 500 },
    );
  }
}
