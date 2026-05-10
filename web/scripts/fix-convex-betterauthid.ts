/**
 * Fix: update all Convex users with their betterAuthId
 * Reads from BetterAuth PostgreSQL + Clerk CSV, patches Convex
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Pool } from "pg";

const CONVEX_URL = "https://determined-lark-313.convex.cloud";
const CONVEX_DEPLOY_KEY = process.env.CONVEX_DEPLOY_KEY!;

// Read BetterAuth users from PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

// Read CSV to get clerkId → email mapping
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

async function main() {
  // 1. Get all BetterAuth users (email → betterAuthId)
  const { rows: baUsers } = await pool.query('SELECT id, email FROM "user"');
  console.log(`Found ${baUsers.length} BetterAuth users\n`);

  const emailToBaId = new Map<string, string>();
  for (const u of baUsers) {
    emailToBaId.set(u.email.toLowerCase(), u.id);
  }

  // 2. Get CSV for clerkId mapping
  const csvPath = join(process.cwd(), "..", "Product demo", "ins_37TSelBFVEJZOIu3AY9sw1aLvpw.csv");
  const csvContent = readFileSync(csvPath, "utf8");
  const csvUsers = parseCSV(csvContent);

  let updated = 0;
  let failed = 0;
  let skipped = 0;

  for (const csvUser of csvUsers) {
    const email = csvUser.primary_email_address;
    const clerkId = csvUser.id;
    if (!email || !clerkId) { skipped++; continue; }

    const betterAuthId = emailToBaId.get(email.toLowerCase());
    if (!betterAuthId) {
      console.log(`  ⏭️  ${email}: no BetterAuth user found`);
      skipped++;
      continue;
    }

    try {
      const response = await fetch(`${CONVEX_URL}/api/mutation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "users:migrateClerkToBetterAuth",
          args: { clerkId, betterAuthId },
        }),
      });

      const result = await response.json() as any;
      if (result.status === "success") {
        console.log(`  ✅ ${email}: ${clerkId} → ${betterAuthId}`);
        updated++;
      } else {
        console.log(`  ❌ ${email}: ${result.errorMessage || JSON.stringify(result)}`);
        failed++;
      }
    } catch (err) {
      console.log(`  ❌ ${email}: ${err}`);
      failed++;
    }
  }

  console.log(`\n📊 Results: ✅ ${updated} | ❌ ${failed} | ⏭️ ${skipped}`);
  await pool.end();
}

main().catch(console.error);
