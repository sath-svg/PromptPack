import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// List all versions for a pack, newest first
export const listByPack = query({
  args: { packId: v.id("userPacks") },
  handler: async (ctx, { packId }) => {
    const versions = await ctx.db
      .query("packVersions")
      .withIndex("by_pack", (q) => q.eq("packId", packId))
      .collect();
    return versions.sort((a, b) => b.versionNumber - a.versionNumber);
  },
});

// Count versions for a pack (for limit checking)
export const countByPack = query({
  args: { packId: v.id("userPacks") },
  handler: async (ctx, { packId }) => {
    const versions = await ctx.db
      .query("packVersions")
      .withIndex("by_pack", (q) => q.eq("packId", packId))
      .collect();
    return versions.length;
  },
});

// Get a specific version by pack + version number
export const getByPackAndVersion = query({
  args: {
    packId: v.id("userPacks"),
    versionNumber: v.number(),
  },
  handler: async (ctx, { packId, versionNumber }) => {
    return await ctx.db
      .query("packVersions")
      .withIndex("by_pack_version", (q) =>
        q.eq("packId", packId).eq("versionNumber", versionNumber)
      )
      .first();
  },
});

// Create a new version snapshot
export const create = mutation({
  args: {
    packId: v.id("userPacks"),
    authorId: v.id("users"),
    versionNumber: v.number(),
    r2Key: v.string(),
    fileSize: v.number(),
    promptCount: v.number(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("packVersions", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

// Delete a single version
export const remove = mutation({
  args: { id: v.id("packVersions") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});

// Delete all versions for a pack (cascade on pack delete)
export const removeAllForPack = mutation({
  args: { packId: v.id("userPacks") },
  handler: async (ctx, { packId }) => {
    const versions = await ctx.db
      .query("packVersions")
      .withIndex("by_pack", (q) => q.eq("packId", packId))
      .collect();
    for (const version of versions) {
      await ctx.db.delete(version._id);
    }
  },
});
