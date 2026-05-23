/**
 * One-shot backfill: write `betterAuthId` onto every Convex `users` row
 * that's missing it, matched by email against the BetterAuth Postgres
 * `user` table.
 *
 * Why: Clerk-era rows have `clerkId` set but no `betterAuthId`. On every
 * fresh BetterAuth login, `web/lib/auth.ts:syncToConvex` hits
 * `users.upsert`, which lands on the email fallback and writes the
 * betterAuthId then. But users who haven't logged in since the
 * migration window still don't have it — and that means any code that
 * looks up by betterAuthId (e.g. checkout flows, account page) silently
 * misses them.
 *
 * This script flips them all at once.
 *
 * Usage (from web/):
 *   npx tsx scripts/backfill-better-auth-ids.ts            # dry run by default
 *   npx tsx scripts/backfill-better-auth-ids.ts --apply    # actually patch
 *   npx tsx scripts/backfill-better-auth-ids.ts --apply --email foo@bar.com
 *
 * Idempotent: `migrateBetterAuthByEmail` skips rows that already have a
 * betterAuthId. Re-run safe.
 *
 * Requires env vars (read from .env or shell):
 *   DATABASE_URL              — BetterAuth Postgres connection string
 *   NEXT_PUBLIC_CONVEX_URL    — Convex deployment URL
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Pool } from "pg";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

function loadEnvVar(key: string): string | undefined {
  if (process.env[key]) return process.env[key];
  for (const filename of [".env.local", ".env"]) {
    try {
      const envPath = join(process.cwd(), filename);
      const contents = readFileSync(envPath, "utf8");
      const line = contents
        .split(/\r?\n/)
        .find((row) => row.startsWith(`${key}=`));
      if (!line) continue;
      const value = line
        .slice(key.length + 1)
        .trim()
        .replace(/^["']|["']$/g, "");
      if (value) return value;
    } catch {
      // ignore
    }
  }
  return undefined;
}

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

async function loadFromCsv(path: string): Promise<{ id: string; email: string }[]> {
  const text = readFileSync(path, "utf8");
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  // Skip header if present (`id,email` or starts with non-id-looking value)
  const out: { id: string; email: string }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const idx = line.indexOf(",");
    if (idx < 0) continue;
    const id = line.slice(0, idx).trim();
    const email = line.slice(idx + 1).trim();
    if (!id || !email) continue;
    if (i === 0 && id.toLowerCase() === "id") continue; // header
    if (!email.includes("@")) continue;
    out.push({ id, email });
  }
  return out;
}

async function main() {
  const apply = hasFlag("--apply");
  const singleEmail = arg("--email");
  const csvPath = arg("--csv");

  const convexUrl =
    loadEnvVar("NEXT_PUBLIC_CONVEX_URL") ?? loadEnvVar("CONVEX_URL");
  if (!convexUrl) throw new Error("NEXT_PUBLIC_CONVEX_URL missing");
  const convex = new ConvexHttpClient(convexUrl);

  let rows: { id: string; email: string }[];
  let pool: Pool | null = null;

  if (csvPath) {
    // CSV mode — no Postgres connection needed
    const resolved = csvPath.startsWith("/") || /^[A-Z]:/i.test(csvPath)
      ? csvPath
      : join(process.cwd(), csvPath);
    rows = await loadFromCsv(resolved);
    console.log(
      `[backfill] mode=${apply ? "APPLY" : "DRY-RUN"} source=csv path=${resolved} url=${convexUrl}`,
    );
  } else {
    // Postgres mode — query BetterAuth `user` table directly
    const dbUrl = loadEnvVar("DATABASE_URL");
    if (!dbUrl) throw new Error("DATABASE_URL missing (or pass --csv <path>)");
    pool = new Pool({ connectionString: dbUrl });

    console.log(`[backfill] mode=${apply ? "APPLY" : "DRY-RUN"} source=pg url=${convexUrl}`);
    if (singleEmail) console.log(`[backfill] single email: ${singleEmail}`);

    const sql = singleEmail
      ? `SELECT id, email FROM "user" WHERE LOWER(email) = LOWER($1)`
      : `SELECT id, email FROM "user" WHERE email IS NOT NULL`;
    const params = singleEmail ? [singleEmail] : [];
    const result = await pool.query<{ id: string; email: string }>(sql, params);
    rows = result.rows;
  }

  console.log(`[backfill] BetterAuth users to process: ${rows.length}`);

  let patched = 0;
  let alreadySet = 0;
  let notFoundInConvex = 0;
  let errors = 0;

  for (const row of rows) {
    if (!row.email || !row.id) {
      continue;
    }
    try {
      if (!apply) {
        console.log(`[dry-run] ${row.email} → ${row.id}`);
        continue;
      }
      const result = await convex.mutation(api.users.migrateBetterAuthByEmail, {
        email: row.email,
        betterAuthId: row.id,
      });
      if (result.success) {
        patched += 1;
        console.log(`[patched]  ${row.email} → ${row.id}`);
      } else {
        alreadySet += 1;
        // Quiet — re-runs are expected to be mostly no-ops
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("User not found")) {
        notFoundInConvex += 1;
        // BetterAuth user has no Convex mirror (e.g. signed up after a
        // migration cutoff). Either run users.upsert manually or ignore.
      } else {
        errors += 1;
        console.error(`[error]    ${row.email}: ${msg}`);
      }
    }
  }

  if (pool) await pool.end();

  console.log("---");
  console.log(`[backfill] scanned:           ${rows.length}`);
  console.log(`[backfill] patched:           ${patched}`);
  console.log(`[backfill] already-set skip:  ${alreadySet}`);
  console.log(`[backfill] no-convex-row:     ${notFoundInConvex}`);
  console.log(`[backfill] errors:            ${errors}`);
  if (!apply) {
    console.log("---");
    console.log("[backfill] dry-run only. Re-run with --apply to write.");
  }
}

main().catch((err) => {
  console.error("[backfill] fatal:", err);
  process.exit(1);
});
