/**
 * Migrate Clerk users to BetterAuth
 *
 * 1. Reads exported CSV from Clerk dashboard
 * 2. Fetches external accounts (Google/Facebook) via Clerk API
 * 3. Creates users + accounts in BetterAuth
 * 4. Updates Convex users table with betterAuthId mapping
 *
 * Usage: npx ts-node scripts/migrate-clerk-to-betterauth.ts
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { betterAuth } from "better-auth";
import { dash } from "@better-auth/infra";
import bcrypt from "bcrypt";
import { Pool } from "pg";

// Inline auth config (same as lib/auth.ts) to avoid ESM resolution issues
const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL!,
  }),
  plugins: [dash()],
  emailAndPassword: {
    enabled: true,
    password: {
      hash: async (password: string) => bcrypt.hash(password, 10),
      verify: async ({ hash, password }: { hash: string; password: string }) =>
        bcrypt.compare(password, hash),
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
});

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY!;
const CONVEX_URL = "https://determined-lark-313.convex.cloud";

// ---- CSV Parsing ----

interface ClerkCsvUser {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  primary_email_address: string;
  primary_phone_number: string;
  verified_email_addresses: string;
  unverified_email_addresses: string;
  password_digest: string;
  password_hasher: string;
  created_at: string;
}

interface ClerkApiUser {
  id: string;
  first_name: string;
  last_name: string;
  image_url: string;
  password_enabled: boolean;
  two_factor_enabled: boolean;
  created_at: number;
  updated_at: number;
  external_accounts: {
    id: string;
    provider: string;
    provider_user_id: string;
    approved_scopes: string;
    email_address: string;
    first_name: string;
    last_name: string;
    image_url: string;
    created_at: number;
    updated_at: number;
  }[];
}

function parseCSV(csv: string): ClerkCsvUser[] {
  const lines = csv.split("\n").filter((line) => line.trim());
  const headers = lines[0]?.split(",").map((h) => h.trim()) || [];

  return lines.slice(1).map((line) => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    return headers.reduce((obj, header, index) => {
      obj[header] = values[index] || "";
      return obj;
    }, {} as Record<string, string>) as unknown as ClerkCsvUser;
  });
}

function safeDateConversion(input?: string | number): Date {
  if (!input) return new Date();
  const date = new Date(input);
  if (isNaN(date.getTime())) return new Date();
  return date;
}

// ---- Clerk API ----

async function fetchClerkUsers(totalUsers: number): Promise<ClerkApiUser[]> {
  const allUsers: ClerkApiUser[] = [];

  for (let offset = 0; offset < totalUsers; offset += 500) {
    console.log(`  Fetching Clerk users ${offset}-${offset + 500}...`);
    const response = await fetch(
      `https://api.clerk.com/v1/users?offset=${offset}&limit=500`,
      {
        headers: { Authorization: `Bearer ${CLERK_SECRET_KEY}` },
      }
    );

    if (!response.ok) {
      throw new Error(`Clerk API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as ClerkApiUser[];
    allUsers.push(...data);
  }

  return allUsers;
}

// ---- Convex ----

async function updateConvexUser(clerkId: string, betterAuthId: string): Promise<boolean> {
  try {
    const response = await fetch(`${CONVEX_URL}/api/mutation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "users:migrateClerkToBetterAuth",
        args: { clerkId, betterAuthId },
      }),
    });

    if (!response.ok) {
      console.error(`    Convex update failed for ${clerkId}: ${response.statusText}`);
      return false;
    }

    return true;
  } catch (err) {
    console.error(`    Convex error for ${clerkId}:`, err);
    return false;
  }
}

// ---- Migration ----

async function migrate() {
  // 1. Load CSV
  const csvPath = join(process.cwd(), "..", "Product demo", "ins_37TSelBFVEJZOIu3AY9sw1aLvpw.csv");
  const csvContent = readFileSync(csvPath, "utf8");
  const csvUsers = parseCSV(csvContent);

  console.log(`\n🔄 Migrating ${csvUsers.length} users from Clerk → BetterAuth\n`);

  // 2. Fetch external accounts from Clerk API
  console.log("📡 Fetching external accounts from Clerk API...");
  const clerkApiUsers = await fetchClerkUsers(csvUsers.length);
  console.log(`  Found ${clerkApiUsers.length} users via API\n`);

  // 3. Get BetterAuth context
  const ctx = await auth.$context;

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const csvUser of csvUsers) {
    const { id: clerkId, first_name, last_name, primary_email_address: email, password_digest, created_at } = csvUser;
    const name = [first_name, last_name].filter(Boolean).join(" ").trim();
    const isVerified = !!csvUser.verified_email_addresses;
    const clerkApiUser = clerkApiUsers.find((u) => u.id === clerkId);

    if (!email) {
      console.log(`  ⏭️  ${clerkId}: no email, skipping`);
      skipped++;
      continue;
    }

    try {
      // Create user in BetterAuth
      const createdUser = await ctx.adapter
        .create<{ id: string }>({
          model: "user",
          data: {
            email,
            emailVerified: isVerified,
            name: name || email.split("@")[0],
            image: clerkApiUser?.image_url || undefined,
            createdAt: safeDateConversion(created_at),
            updatedAt: new Date(),
          },
        })
        .catch(async () => {
          // Already exists — find by email
          return await ctx.adapter.findOne<{ id: string }>({
            model: "user",
            where: [{ field: "email", value: email }],
          });
        });

      if (!createdUser?.id) {
        console.log(`  ❌ ${email}: failed to create/find`);
        failed++;
        continue;
      }

      const betterAuthId = createdUser.id;

      // Create credential account (email/password users)
      if (password_digest) {
        await ctx.adapter
          .create({
            model: "account",
            data: {
              providerId: "credential",
              accountId: betterAuthId,
              userId: betterAuthId,
              password: password_digest, // Already bcrypt from Clerk
              createdAt: safeDateConversion(created_at),
              updatedAt: new Date(),
            },
          })
          .catch(() => {});
      }

      // Create external accounts (Google, Facebook OAuth)
      if (clerkApiUser?.external_accounts) {
        for (const ext of clerkApiUser.external_accounts) {
          // Map Clerk provider names → BetterAuth provider IDs
          const providerMap: Record<string, string> = {
            oauth_google: "google",
            oauth_facebook: "facebook",
            google: "google",
            facebook: "facebook",
          };

          const providerId = providerMap[ext.provider];
          if (!providerId) {
            console.log(`    ⚠️  Unknown provider ${ext.provider} for ${email}, skipping`);
            continue;
          }

          await ctx.adapter
            .create({
              model: "account",
              data: {
                providerId,
                accountId: ext.provider_user_id,
                userId: betterAuthId,
                scope: ext.approved_scopes || "",
                createdAt: safeDateConversion(ext.created_at),
                updatedAt: safeDateConversion(ext.updated_at),
              },
            })
            .catch(() => {
              // Account already exists
            });
        }
      }

      // Update Convex: link clerkId → betterAuthId
      const convexOk = await updateConvexUser(clerkId, betterAuthId);

      const authType = password_digest
        ? "email+pw"
        : clerkApiUser?.external_accounts?.length
          ? clerkApiUser.external_accounts.map((e) => e.provider.replace("oauth_", "")).join("+")
          : "oauth";

      const convexStatus = convexOk ? "" : " [Convex ⚠️]";
      console.log(`  ✅ ${email} (${authType}) → ${betterAuthId}${convexStatus}`);
      migrated++;
    } catch (err) {
      console.error(`  ❌ ${email}:`, err);
      failed++;
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`  ✅ Migrated: ${migrated}`);
  console.log(`  ⏭️  Skipped:  ${skipped}`);
  console.log(`  ❌ Failed:   ${failed}`);
  console.log(`  📊 Total:    ${csvUsers.length}`);

  if (failed > 0) {
    console.log(`\n⚠️  ${failed} failed. Script is idempotent — safe to re-run.`);
  }
}

migrate()
  .then(() => {
    console.log("\n🎉 Migration complete!\n");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💀 Migration crashed:", error);
    process.exit(1);
  });
