import { auth } from "@/lib/auth-server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
  "https://skillset.so",
  "https://www.skillset.so",
  "https://pmtpk.com",
  "https://www.pmtpk.com",
  "tauri://localhost",
  "https://tauri.localhost",
];

function corsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin || "")
      ? origin || ALLOWED_ORIGINS[0]
      : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false }, { status: 401, headers });
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return NextResponse.json(
      { ok: false, reason: "convex-not-configured" },
      { status: 500, headers },
    );
  }

  try {
    const convex = new ConvexHttpClient(convexUrl);
    await convex.mutation(api.users.touchLastActive, { userId });
    return new NextResponse(null, { status: 204, headers });
  } catch (err) {
    console.error("[touch-active] failed", err);
    return NextResponse.json({ ok: false }, { status: 500, headers });
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(request.headers.get("origin")),
  });
}
