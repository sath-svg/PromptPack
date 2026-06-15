import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Called after a temp-password account links a social provider (Google /
// Facebook). They can now sign in without the throwaway password, so clear the
// flag.
export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await convex.mutation(api.users.setPasswordTemporary, {
      internalKey: process.env.SKILLSET_INTERNAL_KEY!,
      userId,
      value: false,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[finalize-social]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 },
    );
  }
}
