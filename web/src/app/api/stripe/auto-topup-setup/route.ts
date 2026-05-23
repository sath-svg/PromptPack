import { NextResponse } from "next/server";
import { auth, currentUser } from "@/lib/auth-server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

const convexClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * Creates a Stripe Checkout session in `mode: "setup"` so the user can
 * attach a card off-session. On success they're redirected back to
 * /account?autotopup=card-saved; the webhook (checkout.session.completed)
 * stores the PaymentMethod id on their user row.
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;
    if (!email) {
      return NextResponse.json({ error: "Missing user email" }, { status: 400 });
    }

    const origin =
      request.headers.get("origin") ??
      process.env.NEXT_PUBLIC_APP_URL ??
      "http://localhost:3000";

    const session = await convexClient.action(api.autoTopup.createSetupCheckout, {
      userId,
      email,
      name: user?.fullName ?? undefined,
      successUrl: `${origin}/account?autotopup=card-saved`,
      cancelUrl: `${origin}/account?autotopup=cancelled`,
    });

    if (!session?.url) {
      return NextResponse.json(
        { error: "Setup session URL missing" },
        { status: 500 },
      );
    }
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("auto-topup setup error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to start card setup",
      },
      { status: 500 },
    );
  }
}
