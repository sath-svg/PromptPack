/**
 * Force-fix: overwrite ALL Convex users' betterAuthId with correct values from BetterAuth PostgreSQL
 * Uses clerkId lookup first, falls back to email lookup for unmatched users
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Pool } from "pg";

const CONVEX_URL = "https://determined-lark-313.convex.cloud";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

function parseCSV(csv: string): Record<string, string>[] {
  const lines = csv.split("\n").filter((line) => line.trim());
  const headers = lines[0]?.split(",").map((h) => h.trim()) || [];

  return lines.slice(1).map((line) => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') inQuotes = !inQuotes;
      else if (char === "," && !inQuotes) { values.push(current.trim()); current = ""; }
      else current += char;
    }
    values.push(current.trim());
    return headers.reduce((obj, header, index) => {
      obj[header] = values[index] || "";
      return obj;
    }, {} as Record<string, string>);
  });
}

async function callConvex(path: string, args: Record<string, string>): Promise<any> {
  const response = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args }),
  });
  return response.json();
}

async function main() {
  // 1. Get BetterAuth users (email → betterAuthId)
  const { rows: baUsers } = await pool.query('SELECT id, email FROM "user"');
  console.log(`Found ${baUsers.length} BetterAuth users\n`);

  const emailToBaId = new Map<string, string>();
  for (const u of baUsers) {
    emailToBaId.set(u.email.toLowerCase(), u.id);
  }

  // 2. Read CSV for clerkId → email mapping
  const csvPath = join(process.cwd(), "..", "Product demo", "ins_37TSelBFVEJZOIu3AY9sw1aLvpw.csv");
  const csvContent = readFileSync(csvPath, "utf8");
  const csvUsers = parseCSV(csvContent);

  let updated = 0;
  let failed = 0;
  let skipped = 0;
  let emailFallback = 0;

  for (const csvUser of csvUsers) {
    const email = csvUser.primary_email_address;
    const clerkId = csvUser.id;
    if (!email || !clerkId) { skipped++; continue; }

    const betterAuthId = emailToBaId.get(email.toLowerCase());
    if (!betterAuthId) {
      console.log(`  ⏭️  ${email}: no BetterAuth user`);
      skipped++;
      continue;
    }

    // Try clerkId-based force update first
    try {
      const result = await callConvex("users:forceSetBetterAuthId", { clerkId, betterAuthId }) as any;
      if (result.status === "success" && result.value?.success) {
        const old = result.value.oldBetterAuthId;
        const changed = old !== betterAuthId ? ` (was: ${old})` : "";
        console.log(`  ✅ ${email}: ${clerkId} → ${betterAuthId}${changed}`);
        updated++;
        continue;
      }
    } catch {}

    // Fallback: try email-based update
    try {
      const result = await callConvex("users:forceSetBetterAuthIdByEmail", { email, betterAuthId }) as any;
      if (result.status === "success" && result.value?.success) {
        console.log(`  ✅ ${email}: (by email) → ${betterAuthId}`);
        updated++;
        emailFallback++;
        continue;
      } else {
        console.log(`  ❌ ${email}: ${result.errorMessage || JSON.stringify(result)}`);
        failed++;
      }
    } catch (err) {
      console.log(`  ❌ ${email}: ${err}`);
      failed++;
    }
  }

  console.log(`\n📊 Results: ✅ ${updated} (${emailFallback} by email) | ❌ ${failed} | ⏭️ ${skipped}`);
  await pool.end();
}

main().catch(console.error);
