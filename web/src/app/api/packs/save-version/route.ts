import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL!;

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { clerkId, packId, message, prompts } = body;

    if (!clerkId || !packId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Proxy to Convex HTTP endpoint
    const res = await fetch(`${CONVEX_URL}/api/desktop/save-version`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clerkId, packId, message, prompts }),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.ok ? 200 : 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save version" },
      { status: 500 }
    );
  }
}
