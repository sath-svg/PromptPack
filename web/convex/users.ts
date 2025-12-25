import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

// Get current user by Clerk ID
export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();
  },
});

// Create or update user from Clerk webhook
export const upsert = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    plan: v.optional(v.union(v.literal("free"), v.literal("pro"))),
  },
  handler: async (ctx, { clerkId, email, name, imageUrl, plan }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email,
        name,
        imageUrl,
        ...(plan && { plan }),
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      clerkId,
      email,
      name,
      imageUrl,
      plan: plan ?? "free",
      createdAt: Date.now(),
    });
  },
});

// Update user plan
export const updatePlan = mutation({
  args: {
    clerkId: v.string(),
    plan: v.union(v.literal("free"), v.literal("pro")),
  },
  handler: async (ctx, { clerkId, plan }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

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
    plan: v.union(v.literal("free"), v.literal("pro")),
  },
  handler: async (ctx, { clerkId, email, name, imageUrl, plan }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email,
        name,
        imageUrl,
        plan,
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      clerkId,
      email,
      name,
      imageUrl,
      plan,
      createdAt: Date.now(),
    });
  },
});

// Internal mutation for webhook: delete user by Clerk ID
export const deleteByClerkId = internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    if (user) {
      await ctx.db.delete(user._id);
    }
  },
});

// Internal mutation for webhook: update plan by Clerk ID
export const updatePlanByClerkId = internalMutation({
  args: {
    clerkId: v.string(),
    plan: v.union(v.literal("free"), v.literal("pro")),
  },
  handler: async (ctx, { clerkId, plan }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) return;

    const oldPlan = user.plan;
    await ctx.db.patch(user._id, { plan });

    // Enforce limits when downgrading from pro to free
    if (oldPlan === "pro" && plan === "free") {
      console.log(`User ${clerkId} downgraded to free - enforcing limits`);

      // 1. Delete ALL user-created prompt packs (free tier = 0 packs allowed)
      const userPacks = await ctx.db
        .query("packs")
        .withIndex("by_author", (q) => q.eq("authorId", user._id))
        .collect();

      for (const pack of userPacks) {
        await ctx.db.delete(pack._id);
        console.log(`Deleted pack: ${pack.title}`);
      }

      // 2. Check saved prompts count and delete if over free limit (10)
      const savedPacks = await ctx.db
        .query("savedPacks")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();

      const totalPrompts = savedPacks.reduce((sum, pack) => sum + pack.promptCount, 0);

      if (totalPrompts > 10) {
        // Delete ALL saved packs if exceeding free tier limit
        for (const pack of savedPacks) {
          await ctx.db.delete(pack._id);
          console.log(`Deleted savedPack: ${pack.source} (${pack.promptCount} prompts)`);
        }
        console.log(`Deleted all saved prompts (${totalPrompts} total, exceeds free limit of 10)`);
      }
    }
  },
});
