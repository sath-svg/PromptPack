import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

export const runtime = "edge";

// Lazy initialization to avoid build-time errors
function getConvexClient() {
  return new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
}

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({
        plan: "free",
        isPro: false,
      });
    }

    const convexClient = getConvexClient();

    // Fetch user from Convex to get their billing plan
    const user = await convexClient.query(api.users.getByClerkId, {
      clerkId: userId,
    });

    if (!user) {
      return NextResponse.json({
        plan: "free",
        isPro: false,
      });
    }

    return NextResponse.json({
      plan: user.plan,
      isPro: user.plan === "pro",
    });
  } catch (error) {
    console.error("Billing status check error:", error);
    return NextResponse.json({
      plan: "free",
      isPro: false,
    });
  }
}
