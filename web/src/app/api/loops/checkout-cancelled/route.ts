import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Fired by the checkout cancel page (/pricing?checkout=cancel). Sends the
// `checkoutCancelled` Loops event for the signed-in user so the Loops workflow
// (abandoned-checkout email) can trigger. Best-effort.
export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await convex.action(api.loops.notifyCheckoutCancelled, { userId });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[loops/checkout-cancelled]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 },
    );
  }
}
