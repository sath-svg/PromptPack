import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Flag the current account as having a throwaway password. Called right after
// the email-only trial gate creates the account, so the post-checkout page
// knows to prompt for a real password.
export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await convex.mutation(api.users.setPasswordTemporary, {
      internalKey: process.env.SKILLSET_INTERNAL_KEY!,
      userId,
      value: true,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[mark-temp-password]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 },
    );
  }
}
