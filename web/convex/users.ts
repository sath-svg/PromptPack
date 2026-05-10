import { v } from "convex/values";
import { mutation, query, internalMutation, DatabaseReader } from "./_generated/server";

// Shared user lookup: tries clerkId index first, then betterAuthId index.
// All queries/mutations that accept a "clerkId" arg should use this so
// BetterAuth users are found regardless of which ID the caller provides.
export async function findUserByAnyId(db: DatabaseReader, id: string) {
  const byClerk = await db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", id))
    .first();
  if (byClerk) return byClerk;
  return await db
    .query("users")
    .withIndex("by_better_auth_id", (q) => q.eq("betterAuthId", id))
    .first();
}

// Count users on the Pro plan (used for early bird pricing limit)
// Only counts Pro users who subscribed after the early bird start date
const EARLY_BIRD_START_DATE = new Date("2026-02-01T00:00:00Z").getTime();

export const countProUsers = query({
  handler: async (ctx) => {
    const proUsers = await ctx.db
      .query("users")
      .filter((q) =>
        q.and(
          q.eq(q.field("plan"), "pro"),
          q.gte(q.field("_creationTime"), EARLY_BIRD_START_DATE)
        )
      )
      .collect();
    return proUsers.length;
  },
});

export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    return await findUserByAnyId(ctx.db, clerkId);
  },
});

export const getGracePeriodInfo = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await findUserByAnyId(ctx.db, clerkId);

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

// Create or update user from Clerk webhook
export const upsert = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    plan: v.optional(v.union(v.literal("free"), v.literal("pro"), v.literal("studio"))),
    stripeCustomerId: v.optional(v.string()),
    betterAuthId: v.optional(v.string()),
  },
  handler: async (ctx, { clerkId, email, name, imageUrl, plan, stripeCustomerId, betterAuthId }) => {
    // Try betterAuthId first (post-migration users)
    let existing = betterAuthId
      ? await ctx.db
          .query("users")
          .withIndex("by_better_auth_id", (q) => q.eq("betterAuthId", betterAuthId))
          .first()
      : null;

    // Fallback: try clerkId lookup
    if (!existing) {
      existing = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
        .first();
    }

    // Fallback: try email lookup (links existing user on first BetterAuth login)
    if (!existing && email) {
      const allUsers = await ctx.db.query("users").collect();
      existing = allUsers.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase()
      ) ?? null;
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

    return await ctx.db.insert("users", {
      clerkId,
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
    clerkId: v.string(),
    stripeCustomerId: v.string(),
  },
  handler: async (ctx, { clerkId, stripeCustomerId }) => {
    const user = await findUserByAnyId(ctx.db, clerkId);

    if (!user) {
      return null;
    }

    await ctx.db.patch(user._id, { stripeCustomerId });
    return user._id;
  },
});

// Internal mutation: set Stripe customer ID by Clerk ID (no-op if missing)
export const setStripeCustomerIdByClerkId = internalMutation({
  args: {
    clerkId: v.string(),
    stripeCustomerId: v.string(),
  },
  handler: async (ctx, { clerkId, stripeCustomerId }) => {
    const user = await findUserByAnyId(ctx.db, clerkId);

    if (!user) {
      return;
    }

    await ctx.db.patch(user._id, { stripeCustomerId });
  },
});

// Update user plan
export const updatePlan = mutation({
  args: {
    clerkId: v.string(),
    plan: v.union(v.literal("free"), v.literal("pro"), v.literal("studio")),
  },
  handler: async (ctx, { clerkId, plan }) => {
    const user = await findUserByAnyId(ctx.db, clerkId);

    if (!user) {
      throw new Error(`User not found with clerkId: ${clerkId}`);
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
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    plan: v.union(v.literal("free"), v.literal("pro"), v.literal("studio")),
    stripeCustomerId: v.optional(v.string()),
  },
  handler: async (ctx, { clerkId, email, name, imageUrl, plan, stripeCustomerId }) => {
    const existing = await findUserByAnyId(ctx.db, clerkId);

    if (existing) {
      await ctx.db.patch(existing._id, {
        email,
        name,
        imageUrl,
        plan,
        ...(stripeCustomerId && { stripeCustomerId }),
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      clerkId,
      email,
      name,
      imageUrl,
      plan,
      stripeCustomerId,
      createdAt: Date.now(),
    });
  },
});

// Internal mutation for webhook: delete user by Clerk ID
export const deleteByClerkId = internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await findUserByAnyId(ctx.db, clerkId);

    if (user) {
      await ctx.db.delete(user._id);
    }
  },
});

// Internal mutation for webhook: update plan by Clerk ID
export const updatePlanByClerkId = internalMutation({
  args: {
    clerkId: v.string(),
    plan: v.union(v.literal("free"), v.literal("pro"), v.literal("studio")),
    subscriptionCancelledAt: v.optional(v.number()), // Timestamp when subscription was cancelled
  },
  handler: async (ctx, { clerkId, plan, subscriptionCancelledAt }) => {
    const user = await findUserByAnyId(ctx.db, clerkId);

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
    clerkId: v.string(),
    plan: v.union(v.literal("free"), v.literal("pro"), v.literal("studio")),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    subscriptionCancelledAt: v.optional(v.number()),
  },
  handler: async (ctx, {
    clerkId,
    plan,
    stripeCustomerId,
    stripeSubscriptionId,
    subscriptionCancelledAt,
  }) => {
    const user = await findUserByAnyId(ctx.db, clerkId);

    if (!user) return;

    const oldPlan = user.plan;
    const nextPatch = {
      plan,
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
    clerkId: v.string(),
    hoursUntilExpiry: v.number(), // How many hours until packs are deleted (can be < 1)
  },
  handler: async (ctx, { clerkId, hoursUntilExpiry }) => {
    const user = await findUserByAnyId(ctx.db, clerkId);

    if (!user) {
      throw new Error(`User not found with clerkId: ${clerkId}`);
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
 * Admin utility: Manually sync user plan from Clerk
 * Use this when webhooks fail or for manual plan updates
 *
 * Usage from Convex Dashboard:
 * 1. Go to Functions → users → syncPlanFromClerk
 * 2. Pass arguments: { "clerkId": "user_xxx", "plan": "pro" }
 * 3. Or from your Clerk user ID: { "clerkId": "user_2abc123", "plan": "free" }
 */
// Get remaining free evaluation trials for a user
export const getEvalTrials = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await findUserByAnyId(ctx.db, clerkId);
    if (!user) return { used: 0, remaining: 3 };
    const used = user.evalTrialsUsed ?? 0;
    return { used, remaining: Math.max(0, 3 - used) };
  },
});

// Increment evaluation trial counter (for free users)
export const incrementEvalTrial = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await findUserByAnyId(ctx.db, clerkId);
    if (!user) throw new Error("User not found");
    const used = (user.evalTrialsUsed ?? 0) + 1;
    await ctx.db.patch(user._id, { evalTrialsUsed: used });
    return { used, remaining: Math.max(0, 3 - used) };
  },
});

// Mark onboarding tutorial as completed
export const completeOnboarding = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await findUserByAnyId(ctx.db, clerkId);
    if (!user) throw new Error("User not found");
    await ctx.db.patch(user._id, { onboardingCompleted: true });
  },
});

export const syncPlanFromClerk = mutation({
  args: {
    clerkId: v.string(),
    plan: v.union(v.literal("free"), v.literal("pro"), v.literal("studio")),
  },
  handler: async (ctx, { clerkId, plan }) => {
    const user = await findUserByAnyId(ctx.db, clerkId);

    if (!user) {
      throw new Error(`User with clerkId ${clerkId} not found in database`);
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
    clerkId: v.string(),
    betterAuthId: v.string(),
  },
  handler: async (ctx, { clerkId, betterAuthId }) => {
    const user = await findUserByAnyId(ctx.db, clerkId);

    if (!user) {
      throw new Error(`User not found with clerkId: ${clerkId}`);
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
      userId: user._id,
      clerkId,
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
    clerkId: v.string(),
    betterAuthId: v.string(),
  },
  handler: async (ctx, { clerkId, betterAuthId }) => {
    const user = await findUserByAnyId(ctx.db, clerkId);

    if (!user) {
      throw new Error(`User not found with clerkId: ${clerkId}`);
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
