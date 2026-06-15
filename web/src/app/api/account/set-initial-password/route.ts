import { NextResponse } from "next/server";
import { Pool } from "pg";
import bcrypt from "bcrypt";
import { auth } from "@/lib/auth-server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

// Reuse a single pool across invocations (module scope survives between
// requests in the Next.js server runtime).
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Set the real password for a temp-password trial account. The throwaway
// password was random and discarded, so BetterAuth's changePassword (which
// needs the current password) can't be used. Instead we write the bcrypt hash
// directly into the BetterAuth `account` row — same hashing scheme as
// lib/auth.ts (bcrypt, 10 rounds) — then clear the temp flag.
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as { password?: string };
    const password = typeof body.password === "string" ? body.password : "";
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `UPDATE "account"
         SET "password" = $1, "updatedAt" = now()
       WHERE "userId" = $2 AND "providerId" = 'credential'`,
      [hash, userId],
    );

    if (result.rowCount === 0) {
      // No email/password credential on this account (e.g. social-only). Tell
      // the client so it can steer them to link a social provider instead.
      return NextResponse.json(
        { error: "No password login on this account. Continue with Google or Facebook instead." },
        { status: 409 },
      );
    }

    await convex.mutation(api.users.setPasswordTemporary, {
      internalKey: process.env.SKILLSET_INTERNAL_KEY!,
      userId,
      value: false,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[set-initial-password]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to set password" },
      { status: 500 },
    );
  }
}
