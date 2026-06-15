import { v } from "convex/values";
import {
  action,
  mutation,
  query,
  internalMutation,
  internalQuery,
  internalAction,
  DatabaseReader,
} from "./_generated/server";
import { internal } from "./_generated/api";
import Stripe from "stripe";

// Disposable / throwaway email domains — blocked on signup to reduce
// multi-account abuse of the free 100cr signup grant. This is a starter
// list of the most common ones; production should pull the full
// disposable-email-domains list (~5000 entries) and refresh weekly.
const DISPOSABLE_EMAIL_DOMAINS = new Set<string>([
  "mailinator.com",
  "tempmail.com",
  "tempmail.net",
  "tempmail.org",
  "10minutemail.com",
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "yopmail.com",
  "throwawaymail.com",
  "trashmail.com",
  "trashmail.net",
  "getairmail.com",
  "maildrop.cc",
  "fakeinbox.com",
  "dispostable.com",
  "mintemail.com",
  "spamgourmet.com",
  "sharklasers.com",
  "grr.la",
  "tempr.email",
  "discard.email",
  "emlhub.com",
  "mohmal.com",
  "tmpmail.org",
  "burnermail.io",
  "moakt.com",
  "mailnesia.com",
  "spam4.me",
  "byom.de",
]);

function isDisposableEmail(email: string): boolean {
  const at = email.lastIndexOf("@");
  if (at < 0) return false;
  const domain = email.slice(at + 1).toLowerCase().trim();
  return DISPOSABLE_EMAIL_DOMAINS.has(domain);
}

// Shared user lookup: tries betterAuthId index first, then clerkId index.
// All queries/mutations that accept a "userId" arg should use this so
// BetterAuth users are found regardless of which ID the caller provides.
export async function findUserByAnyId(db: DatabaseReader, id: string) {
  const byBetterAuth = await db
    .query("users")
    .withIndex("by_better_auth_id", (q) => q.eq("betterAuthId", id))
    .first();
  if (byBetterAuth) return byBetterAuth;
  return await db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", id))
    .first();
}

// Count users on the Pro plan (used for early bird pricing limit)
// Only counts Pro users who subscribed after the early bird start date
const EARLY_BIRD_START_DATE = new Date("2026-02-01T00:00:00Z").getTime();

export const countProUsers = query({
  handler: async (ctx) => {
    let count = 0;
    for await (const _ of ctx.db
      .query("users")
      .withIndex("by_plan", (q) =>
        q.eq("plan", "pro").gte("_creationTime", EARLY_BIRD_START_DATE)
      )) {
      count += 1;
    }
    return count;
  },
});

export const getByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await findUserByAnyId(ctx.db, userId);
  },
});

export const getGracePeriodInfo = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const user = await findUserByAnyId(ctx.db, userId);

    if (!user || !user.packDeletionAt) {
      return null;
    }

    const now = Date.now();
    const daysRemaining = Math.max(0, Math.ceil((user.packDeletionAt - now) / (24 * 60 * 60 * 1000)));

    return {
      packDeletionAt: user.packDeletionAt,
      daysRemaining,
      isExpired: user.packDeletionAt <= now,
    };
  },
});

// Create or update user
export const upsert = mutation({
  args: {
    userId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    plan: v.optional(v.union(v.literal("free"), v.literal("pro"), v.literal("studio"))),
    stripeCustomerId: v.optional(v.string()),
    betterAuthId: v.optional(v.string()),
  },
  handler: async (ctx, { userId, email, name, imageUrl, plan, stripeCustomerId, betterAuthId }) => {
    // Try betterAuthId first (post-migration users)
    let existing = betterAuthId
      ? await ctx.db
          .query("users")
          .withIndex("by_better_auth_id", (q) => q.eq("betterAuthId", betterAuthId))
          .first()
      : null;

    // Fallback: try userId lookup
    if (!existing) {
      existing = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", userId))
        .first();
    }

    // Fallback: try email lookup (links existing user on first BetterAuth login).
    // Indexed lookup — try as-given, then lowercase variant for mixed-case
    // Clerk-migrated rows.
    if (!existing && email) {
      existing = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", email))
        .first();
      if (!existing) {
        const lower = email.toLowerCase();
        if (lower !== email) {
          existing = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", lower))
            .first();
        }
      }
    }

    if (existing) {
      await ctx.db.patch(existing._id, {
        email,
        name,
        imageUrl,
        ...(plan && { plan }),
        ...(stripeCustomerId && { stripeCustomerId }),
        ...(betterAuthId && { betterAuthId }),
      });
      return existing._id;
    }

    // Block disposable-email signups for new users only; existing accounts
    // (already in DB) are grandfathered above via the existing-record path.
    if (isDisposableEmail(email)) {
      throw new Error("DISPOSABLE_EMAIL_NOT_ALLOWED");
    }

    return await ctx.db.insert("users", {
      clerkId: userId,
      email,
      name,
      imageUrl,
      plan: plan ?? "free",
      stripeCustomerId,
      betterAuthId,
      createdAt: Date.now(),
    });
  },
});

// Store Stripe customer ID for a user
export const setStripeCustomerId = mutation({
  args: {
    userId: v.string(),
    stripeCustomerId: v.string(),
  },
  handler: async (ctx, { userId, stripeCustomerId }) => {
    const user = await findUserByAnyId(ctx.db, userId);

    if (!user) {
      return null;
    }

    await ctx.db.patch(user._id, { stripeCustomerId });
    return user._id;
  },
});

// Internal mutation: set Stripe customer ID by userId (no-op if missing)
export const setStripeCustomerIdByUserId = internalMutation({
  args: {
    userId: v.string(),
    stripeCustomerId: v.string(),
  },
  handler: async (ctx, { userId, stripeCustomerId }) => {
    const user = await findUserByAnyId(ctx.db, userId);

    if (!user) {
      return;
    }

    await ctx.db.patch(user._id, { stripeCustomerId });
  },
});

// Update user plan
export const updatePlan = mutation({
  args: {
    userId: v.string(),
    plan: v.union(v.literal("free"), v.literal("pro"), v.literal("studio")),
  },
  handler: async (ctx, { userId, plan }) => {
    const user = await findUserByAnyId(ctx.db, userId);

    if (!user) {
      throw new Error(`User not found with userId: ${userId}`);
    }

    await ctx.db.patch(user._id, { plan });
    return user._id;
  },
});

// List all users (for debugging)
export const listAll = query({
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

// Internal mutation for webhook: upsert user
export const upsertFromWebhook = internalMutation({
  args: {
    userId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    plan: v.union(v.literal("free"), v.literal("pro"), v.literal("studio")),
    stripeCustomerId: v.optional(v.string()),
    emailVerified: v.optional(v.boolean()),
  },
  handler: async (ctx, { userId, email, name, imageUrl, plan, stripeCustomerId, emailVerified }) => {
    const existing = await findUserByAnyId(ctx.db, userId);

    if (existing) {
      await ctx.db.patch(existing._id, {
        email,
        name,
        imageUrl,
        plan,
        ...(stripeCustomerId && { stripeCustomerId }),
        ...(emailVerified !== undefined && { emailVerified }),
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      clerkId: userId,
      email,
      name,
      imageUrl,
      plan,
      stripeCustomerId,
      emailVerified,
      createdAt: Date.now(),
    });
  },
});

// Internal mutation for webhook: delete user by userId
export const deleteByUserId = internalMutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const user = await findUserByAnyId(ctx.db, userId);

    if (user) {
      await ctx.db.delete(user._id);
    }
  },
});

// Internal mutation for webhook: update plan by userId
export const updatePlanByUserId = internalMutation({
  args: {
    userId: v.string(),
    plan: v.union(v.literal("free"), v.literal("pro"), v.literal("studio")),
    subscriptionCancelledAt: v.optional(v.number()), // Timestamp when subscription was cancelled
  },
  handler: async (ctx, { userId, plan, subscriptionCancelledAt }) => {
    const user = await findUserByAnyId(ctx.db, userId);

    if (!user) return;

    const oldPlan = user.plan;

    // Handle downgrade to free (from pro or studio)
    if ((oldPlan === "pro" || oldPlan === "studio") && plan === "free") {

      // Set grace period: 1 day (24 hours) from cancellation or now
      const gracePeriodMs = 24 * 60 * 60 * 1000; // 1 day in milliseconds
      const cancelTime = subscriptionCancelledAt || Date.now();
      const packDeletionAt = cancelTime + gracePeriodMs;

      await ctx.db.patch(user._id, {
        plan,
        packDeletionAt,
      });

    }
    // Handle downgrade from studio to pro (no grace period, just reduce limits)
    else if (oldPlan === "studio" && plan === "pro") {
      await ctx.db.patch(user._id, { plan });
    }
    // Handle upgrade to pro or studio (clear any grace period)
    else if (plan === "pro" || plan === "studio") {

      await ctx.db.patch(user._id, {
        plan,
        packDeletionAt: undefined, // Clear any existing grace period
      });
    }
    // Same plan, just update
    else {
      await ctx.db.patch(user._id, { plan });
    }
  },
});

// Internal mutation: update plan from Stripe webhook events
export const updatePlanFromStripeEvent = internalMutation({
  args: {
    userId: v.string(),
    plan: v.union(v.literal("free"), v.literal("pro"), v.literal("studio")),
    // Pro plan variant — "legacy_pro" for grandfathered $9 subscribers,
    // undefined/"pro" for the standard $15 tier. Studio has no variants yet.
    planVariant: v.optional(v.union(v.literal("pro"), v.literal("legacy_pro"))),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    subscriptionCancelledAt: v.optional(v.number()),
  },
  handler: async (ctx, {
    userId,
    plan,
    planVariant,
    stripeCustomerId,
    stripeSubscriptionId,
    subscriptionCancelledAt,
  }) => {
    const user = await findUserByAnyId(ctx.db, userId);

    if (!user) return;

    const oldPlan = user.plan;
    // Downgrade to free clears planVariant; pro/studio sets it from arg
    // (undefined preserves prior state on routine subscription updates).
    const variantPatch =
      plan === "free"
        ? { planVariant: undefined }
        : planVariant !== undefined
          ? { planVariant }
          : {};
    const nextPatch = {
      plan,
      ...variantPatch,
      ...(stripeCustomerId && { stripeCustomerId }),
      ...(stripeSubscriptionId && { stripeSubscriptionId }),
    };

    // Handle downgrade to free (from pro or studio)
    if ((oldPlan === "pro" || oldPlan === "studio") && plan === "free") {

      const gracePeriodMs = 24 * 60 * 60 * 1000;
      const cancelTime = subscriptionCancelledAt || Date.now();
      const packDeletionAt = cancelTime + gracePeriodMs;

      await ctx.db.patch(user._id, {
        ...nextPatch,
        packDeletionAt,
      });
      return;
    }

    // Handle downgrade from studio to pro (no grace period)
    if (oldPlan === "studio" && plan === "pro") {
      await ctx.db.patch(user._id, nextPatch);
      return;
    }

    // Handle upgrade to pro or studio (clear any grace period)
    if (plan === "pro" || plan === "studio") {

      await ctx.db.patch(user._id, {
        ...nextPatch,
        packDeletionAt: undefined,
      });
      return;
    }

    await ctx.db.patch(user._id, nextPatch);
  },
});

// Internal mutation: Clean up packs for users whose grace period has expired
export const cleanExpiredPacks = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();

    // Find all users with expired grace periods
    const allUsers = await ctx.db.query("users").collect();
    const expiredUsers = allUsers.filter(
      (u) => u.packDeletionAt && u.packDeletionAt <= now
    );


    for (const user of expiredUsers) {

      // Delete all user-created prompt packs
      const userPacksList = await ctx.db
        .query("userPacks")
        .withIndex("by_author", (q) => q.eq("authorId", user._id))
        .collect();

      for (const pack of userPacksList) {
        await ctx.db.delete(pack._id);
      }

      // Clear the packDeletionAt timestamp
      await ctx.db.patch(user._id, {
        packDeletionAt: undefined,
      });

    }

    return { processedUsers: expiredUsers.length };
  },
});

// Test mutation: Manually trigger cleanup (for testing purposes)
export const testCleanupExpiredPacks = mutation({
  handler: async (ctx) => {
    const now = Date.now();

    // Find all users with expired grace periods
    const allUsers = await ctx.db.query("users").collect();
    const expiredUsers = allUsers.filter(
      (u) => u.packDeletionAt && u.packDeletionAt <= now
    );


    for (const user of expiredUsers) {

      // Delete all user-created prompt packs
      const userPacksList = await ctx.db
        .query("userPacks")
        .withIndex("by_author", (q) => q.eq("authorId", user._id))
        .collect();

      for (const pack of userPacksList) {
        await ctx.db.delete(pack._id);
      }

      // Clear the packDeletionAt timestamp
      await ctx.db.patch(user._id, {
        packDeletionAt: undefined,
      });

    }

    return { processedUsers: expiredUsers.length };
  },
});

// Test mutation: Set grace period for current user (for testing warning display)
export const testSetGracePeriod = mutation({
  args: {
    userId: v.string(),
    hoursUntilExpiry: v.number(), // How many hours until packs are deleted (can be < 1)
  },
  handler: async (ctx, { userId, hoursUntilExpiry }) => {
    const user = await findUserByAnyId(ctx.db, userId);

    if (!user) {
      throw new Error(`User not found with userId: ${userId}`);
    }

    const now = Date.now();
    const packDeletionAt = now + (hoursUntilExpiry * 60 * 60 * 1000);

    await ctx.db.patch(user._id, {
      plan: "free",
      packDeletionAt,
    });


    return {
      packDeletionAt,
      expiresAt: new Date(packDeletionAt).toISOString(),
      hoursUntilExpiry,
    };
  },
});

/**
 * Diagnostic: Check if webhook secret is configured
 * Returns masked version of the secret (first/last 4 chars only)
 */
export const checkWebhookSecret = query({
  handler: async () => {
    const secret = process.env.CLERK_WEBHOOK_SECRET;

    if (!secret) {
      return {
        configured: false,
        message: "CLERK_WEBHOOK_SECRET is not set in Convex environment",
        fix: "Run: npx convex env set CLERK_WEBHOOK_SECRET whsec_xxx",
      };
    }

    // Mask the secret (show first 8 and last 4 chars only)
    const masked = secret.length > 12
      ? `${secret.substring(0, 8)}...${secret.substring(secret.length - 4)}`
      : "***";

    return {
      configured: true,
      masked,
      length: secret.length,
      startsWithWhsec: secret.startsWith("whsec_"),
      message: "Webhook secret is configured",
    };
  },
});

/**
 * Admin utility: Manually sync user plan
 * Use this when webhooks fail or for manual plan updates
 *
 * Usage from Convex Dashboard:
 * 1. Go to Functions → users → syncPlan
 * 2. Pass arguments: { "userId": "user_xxx", "plan": "pro" }
 */
// Get remaining free evaluation trials for a user
export const getEvalTrials = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const user = await findUserByAnyId(ctx.db, userId);
    if (!user) return { used: 0, remaining: 3 };
    const used = user.evalTrialsUsed ?? 0;
    return { used, remaining: Math.max(0, 3 - used) };
  },
});

// Increment evaluation trial counter (for free users)
export const incrementEvalTrial = mutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const user = await findUserByAnyId(ctx.db, userId);
    if (!user) throw new Error("User not found");
    const used = (user.evalTrialsUsed ?? 0) + 1;
    await ctx.db.patch(user._id, { evalTrialsUsed: used });
    return { used, remaining: Math.max(0, 3 - used) };
  },
});

// Mark onboarding tutorial as completed
export const completeOnboarding = mutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const user = await findUserByAnyId(ctx.db, userId);
    if (!user) throw new Error("User not found");
    await ctx.db.patch(user._id, { onboardingCompleted: true });
  },
});

export const syncPlan = mutation({
  args: {
    userId: v.string(),
    plan: v.union(v.literal("free"), v.literal("pro"), v.literal("studio")),
  },
  handler: async (ctx, { userId, plan }) => {
    const user = await findUserByAnyId(ctx.db, userId);

    if (!user) {
      throw new Error(`User with userId ${userId} not found in database`);
    }

    const oldPlan = user.plan;

    // Handle downgrade to free (from pro or studio)
    if ((oldPlan === "pro" || oldPlan === "studio") && plan === "free") {

      // Set grace period: 1 day (24 hours) from now
      const gracePeriodMs = 24 * 60 * 60 * 1000;
      const packDeletionAt = Date.now() + gracePeriodMs;

      await ctx.db.patch(user._id, {
        plan,
        packDeletionAt,
      });

      return {
        success: true,
        message: `User downgraded from ${oldPlan} to ${plan}. Grace period started: 24 hours.`,
        packDeletionAt,
        oldPlan,
        newPlan: plan,
      };
    }
    // Handle downgrade from studio to pro (no grace period)
    else if (oldPlan === "studio" && plan === "pro") {
      await ctx.db.patch(user._id, { plan });
      return {
        success: true,
        message: `User downgraded from ${oldPlan} to ${plan}. No grace period (packs retained).`,
        oldPlan,
        newPlan: plan,
      };
    }
    // Handle upgrade to pro or studio (clear any grace period)
    else if (plan === "pro" || plan === "studio") {

      await ctx.db.patch(user._id, {
        plan,
        packDeletionAt: undefined,
      });

      return {
        success: true,
        message: `User upgraded from ${oldPlan} to ${plan}. Grace period cleared.`,
        oldPlan,
        newPlan: plan,
      };
    }
    // Same plan, just update (no actual change)
    else {
      await ctx.db.patch(user._id, { plan });
      return {
        success: true,
        message: `Plan set to ${plan} (no change from ${oldPlan})`,
        oldPlan,
        newPlan: plan,
      };
    }
  },
});

// Migration: Move user from Clerk to BetterAuth
export const migrateClerkToBetterAuth = mutation({
  args: {
    userId: v.string(),
    betterAuthId: v.string(),
  },
  handler: async (ctx, { userId, betterAuthId }) => {
    const user = await findUserByAnyId(ctx.db, userId);

    if (!user) {
      throw new Error(`User not found with userId: ${userId}`);
    }

    // Check if BetterAuth ID already exists (user already migrated)
    if (user.betterAuthId) {
      return {
        success: false,
        error: `User already migrated to BetterAuth (id: ${user.betterAuthId})`,
      };
    }

    // Perform migration
    await ctx.db.patch(user._id, {
      betterAuthId,
      migratedAt: Date.now(),
    });

    return {
      success: true,
      message: `User migrated from Clerk to BetterAuth`,
      convexId: user._id,
      userId,
      betterAuthId,
      migratedAt: Date.now(),
    };
  },
});

// Migration: Set betterAuthId by email (fallback for users without matching clerkId)
export const migrateBetterAuthByEmail = mutation({
  args: {
    email: v.string(),
    betterAuthId: v.string(),
  },
  handler: async (ctx, { email, betterAuthId }) => {
    const users = await ctx.db.query("users").collect();
    const user = users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      throw new Error(`User not found with email: ${email}`);
    }

    if (user.betterAuthId) {
      return { success: false, error: `Already migrated (${user.betterAuthId})` };
    }

    await ctx.db.patch(user._id, {
      betterAuthId,
      migratedAt: Date.now(),
    });

    return { success: true, userId: user._id, email, betterAuthId };
  },
});

// Force-update betterAuthId (overwrites even if already set)
export const forceSetBetterAuthId = mutation({
  args: {
    userId: v.string(),
    betterAuthId: v.string(),
  },
  handler: async (ctx, { userId, betterAuthId }) => {
    const user = await findUserByAnyId(ctx.db, userId);

    if (!user) {
      throw new Error(`User not found with userId: ${userId}`);
    }

    await ctx.db.patch(user._id, {
      betterAuthId,
      migratedAt: Date.now(),
    });

    return { success: true, userId: user._id, oldBetterAuthId: user.betterAuthId, newBetterAuthId: betterAuthId };
  },
});

// Force-update betterAuthId by email (for users without matching clerkId)
export const forceSetBetterAuthIdByEmail = mutation({
  args: {
    email: v.string(),
    betterAuthId: v.string(),
  },
  handler: async (ctx, { email, betterAuthId }) => {
    const users = await ctx.db.query("users").collect();
    const user = users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      throw new Error(`User not found with email: ${email}`);
    }

    await ctx.db.patch(user._id, {
      betterAuthId,
      migratedAt: Date.now(),
    });

    return { success: true, userId: user._id, email, betterAuthId };
  },
});

// Cleanup: remove duplicate user records created during migration
// Duplicates have clerkId = betterAuthId (not user_* format) and no betterAuthId field
export const cleanupMigrationDuplicates = mutation({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();
    const duplicates = allUsers.filter(
      (u) => u.clerkId && !u.clerkId.startsWith("user_") && !u.betterAuthId
    );

    let deleted = 0;
    for (const dup of duplicates) {
      // Only delete if a real record with betterAuthId exists for same email
      const real = allUsers.find(
        (u) =>
          u._id !== dup._id &&
          u.email === dup.email &&
          (u.betterAuthId || u.clerkId?.startsWith("user_"))
      );
      if (real) {
        await ctx.db.delete(dup._id);
        deleted++;
      }
    }

    return { duplicatesFound: duplicates.length, deleted };
  },
});

// Get user by BetterAuth ID (for post-migration)
export const getByBetterAuthId = query({
  args: { betterAuthId: v.string() },
  handler: async (ctx, { betterAuthId }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_better_auth_id", (q) => q.eq("betterAuthId", betterAuthId))
      .first();
  },
});

/* ────────────────────────────────────────────────────────────────────────── *
 * Backfill — assign planVariant to existing Pro subscribers
 *
 * Run once after deploy via the Convex dashboard:
 *   npx convex run users:backfillPlanVariant '{"dryRun": true}'
 * Then re-run with dryRun=false to apply.
 * ────────────────────────────────────────────────────────────────────────── */

// List candidate users: plan="pro" with no planVariant set yet, that have a
// stripeSubscriptionId we can look up. Skips already-classified users.
export const listProUsersNeedingVariant = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("users"),
      clerkId: v.string(),
      email: v.string(),
      stripeSubscriptionId: v.optional(v.string()),
    }),
  ),
  handler: async (ctx) => {
    const all = await ctx.db.query("users").collect();
    return all
      .filter((u) => u.plan === "pro" && u.planVariant === undefined && u.stripeSubscriptionId)
      .map((u) => ({
        _id: u._id,
        clerkId: u.clerkId,
        email: u.email,
        stripeSubscriptionId: u.stripeSubscriptionId,
      }));
  },
});

// Patch a single user's planVariant. Called by the backfill action below.
export const patchPlanVariant = internalMutation({
  args: {
    userId: v.id("users"),
    planVariant: v.union(v.literal("pro"), v.literal("legacy_pro")),
  },
  returns: v.null(),
  handler: async (ctx, { userId, planVariant }) => {
    await ctx.db.patch(userId, { planVariant });
    return null;
  },
});

// One-shot backfill. Walks all Pro users without planVariant, fetches each
// subscription from Stripe to read the active Price ID, and patches the
// user record. dryRun=true logs intended patches without applying.
//
// Explicit handler return type breaks the self-referential type cycle that
// Convex's internalAction inference triggers when a handler calls a query
// declared in the same file.
type BackfillResult = {
  scanned: number;
  patched: number;
  legacy: number;
  current: number;
  skipped: number;
  errors: number;
};

type BackfillCandidate = {
  _id: import("./_generated/dataModel").Id<"users">;
  clerkId: string;
  email: string;
  stripeSubscriptionId?: string;
};

export const backfillPlanVariant = internalAction({
  args: {
    dryRun: v.optional(v.boolean()),
  },
  returns: v.object({
    scanned: v.number(),
    patched: v.number(),
    legacy: v.number(),
    current: v.number(),
    skipped: v.number(),
    errors: v.number(),
  }),
  handler: async (ctx, { dryRun = true }): Promise<BackfillResult> => {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const legacyPriceId = process.env.STRIPE_PRO_LEGACY_PRICE_ID;
    const monthlyPriceId = process.env.STRIPE_PRO_MONTHLY_PRICE_ID;
    const annualPriceId = process.env.STRIPE_PRO_ANNUAL_PRICE_ID;

    if (!stripeKey || !legacyPriceId) {
      throw new Error(
        "Missing env vars: STRIPE_SECRET_KEY and STRIPE_PRO_LEGACY_PRICE_ID required for backfill.",
      );
    }

    const stripe = new Stripe(stripeKey);
    const candidates: BackfillCandidate[] = await ctx.runQuery(
      internal.users.listProUsersNeedingVariant,
      {},
    );

    let patched = 0;
    let legacy = 0;
    let current = 0;
    let skipped = 0;
    let errors = 0;

    for (const candidate of candidates) {
      if (!candidate.stripeSubscriptionId) {
        skipped += 1;
        continue;
      }
      try {
        const sub = await stripe.subscriptions.retrieve(candidate.stripeSubscriptionId);
        const items = sub.items?.data ?? [];
        let onLegacy = false;
        let onCurrent = false;
        for (const item of items) {
          const priceId = item.price?.id;
          if (priceId === legacyPriceId) onLegacy = true;
          else if (priceId === monthlyPriceId || priceId === annualPriceId) onCurrent = true;
        }

        let variant: "pro" | "legacy_pro" | null = null;
        if (onLegacy && !onCurrent) variant = "legacy_pro";
        else if (onCurrent) variant = "pro";

        if (variant === null) {
          console.log(
            `[backfill] SKIP ${candidate.email} — subscription on unrecognised Price IDs`,
          );
          skipped += 1;
          continue;
        }

        if (variant === "legacy_pro") legacy += 1;
        else current += 1;

        if (dryRun) {
          console.log(`[backfill] DRY-RUN would patch ${candidate.email} → ${variant}`);
        } else {
          await ctx.runMutation(internal.users.patchPlanVariant, {
            userId: candidate._id,
            planVariant: variant,
          });
          patched += 1;
        }
      } catch (err) {
        errors += 1;
        console.error(
          `[backfill] ERROR ${candidate.email} (sub=${candidate.stripeSubscriptionId}):`,
          err instanceof Error ? err.message : String(err),
        );
      }
    }

    console.log(
      `[backfill] done — scanned=${candidates.length} legacy=${legacy} current=${current} ` +
        `patched=${patched} skipped=${skipped} errors=${errors} dryRun=${dryRun}`,
    );

    return {
      scanned: candidates.length,
      patched,
      legacy,
      current,
      skipped,
      errors,
    };
  },
});

/**
 * Public-action wrapper around `listLegacyProEmails` — gated by the shared
 * SKILLSET_INTERNAL_KEY so an external Node script (web/scripts/send-pro-price-change-email.ts)
 * can fetch the recipient list via ConvexHttpClient without exposing emails publicly.
 */
type LegacyProRecipient = { email: string; name?: string };

export const listLegacyProEmailsForBlast = action({
  args: { internalKey: v.string() },
  returns: v.array(
    v.object({
      email: v.string(),
      name: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, { internalKey }): Promise<LegacyProRecipient[]> => {
    const expected = process.env.SKILLSET_INTERNAL_KEY;
    if (!expected) throw new Error("SKILLSET_INTERNAL_KEY not configured");
    if (internalKey !== expected) throw new Error("Unauthorized");
    const result: LegacyProRecipient[] = await ctx.runQuery(
      internal.users.listLegacyProEmails,
      {},
    );
    return result;
  },
});

/**
 * List the emails of all current legacy_pro subscribers. Consumed by the
 * one-time price-change email blast (web/scripts/send-pro-price-change-email.ts).
 * Returns email + name (best-effort) so the email script can personalise.
 */
export const listLegacyProEmails = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      email: v.string(),
      name: v.optional(v.string()),
    }),
  ),
  handler: async (ctx) => {
    const legacy = await ctx.db
      .query("users")
      .filter((q) =>
        q.and(
          q.eq(q.field("plan"), "pro"),
          q.eq(q.field("planVariant"), "legacy_pro"),
        ),
      )
      .collect();
    return legacy
      .filter((u) => u.email && u.email.includes("@"))
      .map((u) => ({ email: u.email, name: u.name }));
  },
});

/**
 * List the emails of users created on/after `sinceMs` (epoch ms). Consumed by
 * the 1.3.0 upgrade email blast (web/scripts/send-1.3.0-upgrade-email.ts) to
 * reach users who signed up since the previous announcement. Returns
 * email + name (best-effort).
 */
export const listRecentUserEmails = internalQuery({
  args: { sinceMs: v.number() },
  returns: v.array(
    v.object({
      email: v.string(),
      name: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, { sinceMs }) => {
    const recent = await ctx.db
      .query("users")
      .filter((q) => q.gte(q.field("createdAt"), sinceMs))
      .collect();
    return recent
      .filter((u) => u.email && u.email.includes("@"))
      .map((u) => ({ email: u.email, name: u.name }));
  },
});

/**
 * Public-action wrapper around `listRecentUserEmails` — gated by the shared
 * SKILLSET_INTERNAL_KEY so the Node send script can fetch the recipient list
 * via ConvexHttpClient without exposing emails publicly.
 */
type RecentRecipient = { email: string; name?: string };

export const listRecentUserEmailsForBlast = action({
  args: { internalKey: v.string(), sinceMs: v.number() },
  returns: v.array(
    v.object({
      email: v.string(),
      name: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, { internalKey, sinceMs }): Promise<RecentRecipient[]> => {
    const expected = process.env.SKILLSET_INTERNAL_KEY;
    if (!expected) throw new Error("SKILLSET_INTERNAL_KEY not configured");
    if (internalKey !== expected) throw new Error("Unauthorized");
    const result: RecentRecipient[] = await ctx.runQuery(
      internal.users.listRecentUserEmails,
      { sinceMs },
    );
    return result;
  },
});

/**
 * List the emails of all current free-plan users. Consumed by the free-plan
 * closure email blast (web/scripts/send-free-plan-closure-email.ts). Returns
 * email + name (best-effort) so the script can personalise.
 */
export const listFreeUserEmails = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      email: v.string(),
      name: v.optional(v.string()),
    }),
  ),
  handler: async (ctx) => {
    const free = await ctx.db
      .query("users")
      .withIndex("by_plan", (q) => q.eq("plan", "free"))
      .collect();
    return free
      .filter((u) => u.email && u.email.includes("@"))
      .map((u) => ({ email: u.email, name: u.name }));
  },
});

/**
 * Public-action wrapper around `listFreeUserEmails` — gated by the shared
 * SKILLSET_INTERNAL_KEY so the Node send script can fetch the recipient list
 * via ConvexHttpClient without exposing emails publicly.
 */
type FreeRecipient = { email: string; name?: string };

export const listFreeUserEmailsForBlast = action({
  args: { internalKey: v.string() },
  returns: v.array(
    v.object({
      email: v.string(),
      name: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, { internalKey }): Promise<FreeRecipient[]> => {
    const expected = process.env.SKILLSET_INTERNAL_KEY;
    if (!expected) throw new Error("SKILLSET_INTERNAL_KEY not configured");
    if (internalKey !== expected) throw new Error("Unauthorized");
    const result: FreeRecipient[] = await ctx.runQuery(
      internal.users.listFreeUserEmails,
      {},
    );
    return result;
  },
});

/**
 * Emergency rollback for `backfillPlanVariant`. Clears `planVariant` on every
 * Pro user (sets it back to undefined). Use only if a backfill run mis-classified
 * users — webhook handler will re-set planVariant correctly on next subscription
 * event, and the next backfill run can be retried with corrected env vars.
 *
 * Usage:
 *   npx convex run users:revertBackfillPlanVariant
 *
 * Does NOT touch Studio users (they have no variant). Logs how many were cleared.
 */
export const revertBackfillPlanVariant = internalMutation({
  args: {},
  returns: v.object({ cleared: v.number() }),
  handler: async (ctx) => {
    const proUsers = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("plan"), "pro"))
      .collect();

    let cleared = 0;
    for (const user of proUsers) {
      if (user.planVariant !== undefined) {
        await ctx.db.patch(user._id, { planVariant: undefined });
        cleared += 1;
      }
    }

    console.log(`[revert-backfill] cleared planVariant on ${cleared} Pro users`);
    return { cleared };
  },
});

/**
 * Reverse lookup: find a user by their Stripe customer ID. Used by the Stripe
 * webhook handler as a fallback when subscription/invoice metadata.userId is
 * missing or stale (e.g. legacy Clerk-era subscribers whose Convex _id changed
 * during the BetterAuth migration). Returns the user's Convex _id (cast to
 * string for the webhook layer) so the handler can route events correctly even
 * when metadata is broken.
 */
export const getUserIdByStripeCustomerId = internalQuery({
  args: { stripeCustomerId: v.string() },
  returns: v.union(v.null(), v.string()),
  handler: async (ctx, { stripeCustomerId }) => {
    if (!stripeCustomerId) return null;
    const all = await ctx.db.query("users").collect();
    const match = all.find((u) => u.stripeCustomerId === stripeCustomerId);
    return match ? (match._id as unknown as string) : null;
  },
});

/**
 * Diagnostic: dump everything we know about a user by email so we can see
 * why backfillPlanVariant skipped them. Run from CLI:
 *   npx convex run users:debugUserByEmail '{"email":"wilmar.martina@globalwireai.com"}'
 *
 * Safe to leave in place — no PII leaves Convex unless someone explicitly runs
 * this against the deployment with the email they want to inspect.
 */
export const debugUserByEmail = internalQuery({
  args: { email: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("users"),
      email: v.string(),
      name: v.optional(v.string()),
      clerkId: v.string(),
      plan: v.optional(v.string()),
      planVariant: v.optional(v.string()),
      stripeCustomerId: v.optional(v.string()),
      stripeSubscriptionId: v.optional(v.string()),
      monthlyCredits: v.optional(v.number()),
      _creationTime: v.number(),
    }),
  ),
  handler: async (ctx, { email }) => {
    const target = email.trim().toLowerCase();
    const all = await ctx.db.query("users").collect();
    const u = all.find((row) => (row.email ?? "").toLowerCase() === target);
    if (!u) return null;
    return {
      _id: u._id,
      email: u.email,
      name: u.name,
      clerkId: u.clerkId,
      plan: u.plan,
      planVariant: u.planVariant,
      stripeCustomerId: u.stripeCustomerId,
      stripeSubscriptionId: u.stripeSubscriptionId,
      monthlyCredits: u.monthlyCredits,
      _creationTime: u._creationTime,
    };
  },
});

// ---------------------------------------------------------------------------
// Lifecycle / activity tracking — feeds the Loops.so inactivity drips.
// ---------------------------------------------------------------------------

const ACTIVE_DEBOUNCE_MS = 60 * 60 * 1000; // 1 hour

// Internal variant — called from BetterAuth session-create hook via Convex
// HTTP client. Patches lastActive with a 1h debounce so hot-write churn stays
// bounded even if the caller forgets to throttle client-side.
export const touchLastActiveInternal = internalMutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const user = await findUserByAnyId(ctx.db, userId);
    if (!user) return { touched: false };
    const now = Date.now();
    if (user.lastActive && now - user.lastActive < ACTIVE_DEBOUNCE_MS) {
      return { touched: false };
    }
    await ctx.db.patch(user._id, { lastActive: now });
    return { touched: true };
  },
});

// Public mutation — called from the web `/api/users/touch-active` route and
// from the Tauri app via the same endpoint. Same debounce.
export const touchLastActive = mutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const user = await findUserByAnyId(ctx.db, userId);
    if (!user) return { touched: false };
    const now = Date.now();
    if (user.lastActive && now - user.lastActive < ACTIVE_DEBOUNCE_MS) {
      return { touched: false };
    }
    await ctx.db.patch(user._id, { lastActive: now });
    return { touched: true };
  },
});

// Inactivity windows in ms. A user lands in window N when their lastActive is
// older than DAYS[N] but younger than DAYS[N+1]. We only fire when the
// corresponding `inactiveXdSentAt` is null, so each user receives each nudge
// at most once.
const DAY_MS = 24 * 60 * 60 * 1000;
const INACTIVITY_BUCKETS = [
  { days: 3, eventName: "inactive3d", flag: "inactive3dSentAt" as const },
  { days: 7, eventName: "inactive7d", flag: "inactive7dSentAt" as const },
  { days: 14, eventName: "inactive14d", flag: "inactive14dSentAt" as const },
];

/**
 * Daily scan: for each inactivity bucket, find users whose lastActive crossed
 * that threshold and haven't been sent the corresponding event. Fire a Loops
 * event, then patch the dedup flag.
 *
 * Skips users with `lastActive == null` (legacy rows that never pinged) so
 * the first run doesn't carpet-bomb everyone with 14d nudges.
 */
export const scanInactiveAndFireLoops = internalAction({
  args: {},
  handler: async (ctx): Promise<{
    scanned: number;
    fired: Record<string, number>;
  }> => {
    const users = await ctx.runQuery(
      internal.users.listUsersForInactivityScan,
      {},
    );

    const now = Date.now();
    const fired: Record<string, number> = {
      inactive3d: 0,
      inactive7d: 0,
      inactive14d: 0,
    };

    for (const user of users) {
      if (!user.lastActive) continue; // skip legacy rows
      const idleMs = now - user.lastActive;

      for (const bucket of INACTIVITY_BUCKETS) {
        if (idleMs < bucket.days * DAY_MS) continue;
        if (user[bucket.flag]) continue; // already sent

        await ctx.runAction(internal.loops.sendEvent, {
          email: user.email,
          eventName: bucket.eventName,
          userId: user._id,
          properties: {
            plan: user.plan,
            daysInactive: Math.floor(idleMs / DAY_MS),
          },
        });
        await ctx.runMutation(internal.users.markInactiveEventSent, {
          userId: user._id,
          flag: bucket.flag,
        });
        fired[bucket.eventName] += 1;
      }
    }

    console.log(
      `[inactivity-nudge] scanned=${users.length} fired=${JSON.stringify(fired)}`,
    );
    return { scanned: users.length, fired };
  },
});

export const listUsersForInactivityScan = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const markInactiveEventSent = internalMutation({
  args: {
    userId: v.id("users"),
    flag: v.union(
      v.literal("inactive3dSentAt"),
      v.literal("inactive7dSentAt"),
      v.literal("inactive14dSentAt"),
    ),
  },
  handler: async (ctx, { userId, flag }) => {
    await ctx.db.patch(userId, { [flag]: Date.now() });
  },
});
