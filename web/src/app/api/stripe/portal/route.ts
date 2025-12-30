import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

const convexClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;

    const origin = request.headers.get("origin")
      ?? process.env.NEXT_PUBLIC_APP_URL
      ?? "http://localhost:3000";
    const returnUrl = process.env.STRIPE_PORTAL_RETURN_URL ?? `${origin}/dashboard`;

    const session = await convexClient.action(api.stripe.createCustomerPortalSession, {
      clerkId: userId,
      email,
      name: user?.fullName ?? user?.firstName ?? undefined,
      returnUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe portal error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to open billing portal" },
      { status: 500 }
    );
  }
}
