import { betterAuth } from "better-auth";
import { dash } from "@better-auth/infra";
import bcrypt from "bcrypt";
import { Pool } from "pg";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { buildWelcomeEmailHtml } from "./welcome-email";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

const convex = process.env.NEXT_PUBLIC_CONVEX_URL
  ? new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL)
  : null;

// Welcome email via Resend — keeps the rich HTML template (clips, brand,
// CTAs) intact. Loops handles inactivity drips only; signup welcome stays
// here.
async function sendWelcomeEmail(email: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Skillset <support@skillset.so>",
        to: email,
        subject: "Welcome to Skillset!",
        html: buildWelcomeEmailHtml(),
        reply_to: "support@skillset.so",
      }),
    });
    if (!res.ok) {
      console.error("[auth] welcome email failed:", await res.text());
    }
  } catch (err) {
    console.error("[auth] welcome email error:", err);
  }
}

async function touchLastActive(userId: string) {
  if (!convex) return;
  try {
    await convex.mutation(api.users.touchLastActive, { userId });
  } catch (err) {
    console.error("[auth] touchLastActive failed", err);
  }
}

// Fire a PostHog event from the BetterAuth Node hooks. Direct HTTP call to
// PostHog Capture API (no SDK dep). distinctId must equal the client-side
// `posthog.identify(...)` id (BetterAuth user id) or PostHog creates a
// duplicate person profile. Errors swallowed — auth flow must never block.
async function firePostHog(
  distinctId: string,
  event: string,
  properties: Record<string, string | number | boolean | null | undefined>,
) {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!apiKey) return;
  try {
    await fetch("https://us.i.posthog.com/capture/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        event,
        distinct_id: distinctId,
        properties: { ...properties, $lib: "betterauth", surface: "server" },
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.error(`[auth] posthog ${event} failed`, err);
  }
}

async function syncToConvex(user: { id: string; email: string; name?: string | null; image?: string | null }) {
  if (!convex) return;
  try {
    // IMPORTANT: never pass `plan` here. Plan state is owned by Stripe
    // webhooks (customer.subscription.* + invoice.paid). Passing
    // `plan: "free"` from a session-create hook wipes Pro/Studio users
    // every time BetterAuth sessions invalidate — e.g. after
    // `convex deploy` rebuilds Next.js. The `users.upsert` mutation
    // skips the `plan` patch when undefined, so existing tiers persist
    // until the next Stripe webhook event corrects them anyway.
    await convex.mutation(api.users.upsert, {
      userId: user.id,
      email: user.email,
      name: user.name ?? undefined,
      imageUrl: user.image ?? undefined,
      betterAuthId: user.id,
    });
  } catch (err) {
    console.error("[auth] Convex user sync failed", err);
  }
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "https://skillset.so",
  trustedOrigins: ["https://skillset.so"],
  database: pool,
  account: {
    // Store OAuth state in encrypted cookie instead of the `verification` table.
    // The Postgres adapter migration hasn't been run, so DB-strategy lookups
    // return null on callback and BetterAuth bounces users to
    // /?error=please_restart_the_process.
    storeStateStrategy: "cookie",
    accountLinking: {
      enabled: true,
      // Existing Clerk-migrated users have emailVerified=false (Clerk's flag
      // didn't carry over), so BetterAuth's default
      // requireLocalEmailVerified=true blocks linking a new Google account to
      // their existing row and aborts sign-in with "account not linked".
      // Trusting Google (which always returns email_verified=true for its own
      // accounts) plus disabling the local check lets the migrated row absorb
      // a fresh google `account` link on first social sign-in.
      trustedProviders: ["google", "facebook"],
      allowDifferentEmails: false,
      requireLocalEmailVerified: false,
    },
  },
  plugins: [
    dash(),
  ],
  emailAndPassword: {
    enabled: true,
    password: {
      // Clerk uses bcrypt — need compat for migrated password hashes
      hash: async (password) => {
        return await bcrypt.hash(password, 10);
      },
      verify: async ({ hash, password }) => {
        return await bcrypt.compare(password, hash);
      },
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    },
  },
  session: {
    // Long-lived sessions — the whole reason for this migration
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // Refresh session every 24 hours
  },
  databaseHooks: {
    user: {
      create: {
        // Mirror every new BetterAuth user into the Convex `users` table.
        // Clerk used to do this via webhook; after the migration there is no
        // such webhook, so new signups would land in Postgres only and the
        // app (which reads plan/limits/packs from Convex) wouldn't see them.
        after: async (user) => {
          await syncToConvex(user);
          if (user.email) sendWelcomeEmail(user.email).catch(() => {});
          // PostHog signup event — server-side so ad-blockers can't drop it.
          firePostHog(user.id, "signed_up", {
            email: user.email,
            name: user.name ?? null,
          }).catch(() => {});
        },
      },
    },
    session: {
      create: {
        // Belt-and-suspenders: on every fresh login, upsert into Convex too.
        // Catches migrated Clerk rows that exist in Postgres but never made it
        // into Convex during the cutover. `upsert` is idempotent — repeat
        // calls just patch name/email/imageUrl, never duplicate.
        after: async (session) => {
          try {
            const result = await pool.query<{
              id: string;
              email: string;
              name: string | null;
              image: string | null;
            }>(`SELECT id, email, name, image FROM "user" WHERE id = $1`, [session.userId]);
            const user = result.rows[0];
            if (user) await syncToConvex(user);
            // Bump lastActive on every login — feeds the inactivity drips.
            touchLastActive(session.userId).catch(() => {});
            // PostHog signin event.
            firePostHog(session.userId, "signed_in", {}).catch(() => {});
          } catch (err) {
            console.error("[auth] session-hook user lookup failed", err);
          }
        },
      },
    },
  },
});
