import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all packs purchased by a user
export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const purchasedPacks = await ctx.db
      .query("purchasedPacks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Fetch the full pack details
    const packs = await Promise.all(
      purchasedPacks.map(async (pp) => {
        const pack = await ctx.db.get(pp.packId);
        return pack
          ? {
              ...pack,
              purchasedAt: pp.purchasedAt,
            }
          : null;
      })
    );

    return packs.filter((p) => p !== null);
  },
});

// Check if user owns a pack
export const hasPurchased = query({
  args: {
    userId: v.id("users"),
    packId: v.id("userPacks"),
  },
  handler: async (ctx, { userId, packId }) => {
    const existing = await ctx.db
      .query("purchasedPacks")
      .withIndex("by_user_pack", (q) =>
        q.eq("userId", userId).eq("packId", packId)
      )
      .first();
    return existing !== null;
  },
});

// Purchase a pack (add to user's purchased packs)
export const purchase = mutation({
  args: {
    userId: v.id("users"),
    packId: v.id("userPacks"),
  },
  handler: async (ctx, { userId, packId }) => {
    // Check if already purchased
    const existing = await ctx.db
      .query("purchasedPacks")
      .withIndex("by_user_pack", (q) =>
        q.eq("userId", userId).eq("packId", packId)
      )
      .first();

    if (existing) {
      return existing._id;
    }

    // Add to purchased packs
    const id = await ctx.db.insert("purchasedPacks", {
      userId,
      packId,
      purchasedAt: Date.now(),
    });

    // Increment download count on the pack
    const pack = await ctx.db.get(packId);
    if (pack) {
      await ctx.db.patch(packId, { downloads: pack.downloads + 1 });
    }

    return id;
  },
});
