/**
 * Fix: update remaining Convex users by email (fallback for users without matching clerkId)
 */

import { Pool } from "pg";

const CONVEX_URL = "https://determined-lark-313.convex.cloud";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

// These 11 emails failed the clerkId-based migration
const failedEmails = [
  "adammueller777@gmail.com",
  "slumanrafi777666@gmail.com",
  "kumarkarl@gmail.com",
  "chaitu556@gmail.com",
  "terak49274@ramynd.com",
  "madelinedoyle15@gmail.com",
  "pvtcarnage@gmail.com",
  "slejdpl@gmail.com",
  "stevenpettit@gmail.com",
  "pcjuanlu@gmail.com",
  "micaela.sto@gmail.com",
];

async function main() {
  // Get BetterAuth IDs for these emails
  const { rows: baUsers } = await pool.query(
    'SELECT id, email FROM "user" WHERE LOWER(email) = ANY($1)',
    [failedEmails.map((e) => e.toLowerCase())]
  );

  console.log(`Found ${baUsers.length} BetterAuth users for ${failedEmails.length} emails\n`);

  let updated = 0;
  let failed = 0;

  for (const ba of baUsers) {
    try {
      const response = await fetch(`${CONVEX_URL}/api/mutation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "users:migrateBetterAuthByEmail",
          args: { email: ba.email, betterAuthId: ba.id },
        }),
      });

      const result = (await response.json()) as any;
      if (result.status === "success") {
        console.log(`  ✅ ${ba.email} → ${ba.id}`);
        updated++;
      } else {
        console.log(`  ❌ ${ba.email}: ${result.errorMessage || JSON.stringify(result)}`);
        failed++;
      }
    } catch (err) {
      console.log(`  ❌ ${ba.email}: ${err}`);
      failed++;
    }
  }

  console.log(`\n📊 Results: ✅ ${updated} | ❌ ${failed}`);
  await pool.end();
}

main().catch(console.error);
