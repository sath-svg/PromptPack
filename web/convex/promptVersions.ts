import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// List all versions for a specific prompt in a pack, newest first
export const listByPrompt = query({
  args: {
    packId: v.id("userPacks"),
    promptCreatedAt: v.number(),
  },
  handler: async (ctx, { packId, promptCreatedAt }) => {
    const versions = await ctx.db
      .query("promptVersions")
      .withIndex("by_pack_prompt", (q) =>
        q.eq("packId", packId).eq("promptCreatedAt", promptCreatedAt)
      )
      .collect();
    return versions.sort((a, b) => b.versionNumber - a.versionNumber);
  },
});

// List all prompt versions for a pack (for overview)
export const listByPack = query({
  args: { packId: v.id("userPacks") },
  handler: async (ctx, { packId }) => {
    return await ctx.db
      .query("promptVersions")
      .withIndex("by_pack", (q) => q.eq("packId", packId))
      .collect();
  },
});

// Count versions for a specific prompt (for limit checking)
export const countByPrompt = query({
  args: {
    packId: v.id("userPacks"),
    promptCreatedAt: v.number(),
  },
  handler: async (ctx, { packId, promptCreatedAt }) => {
    const versions = await ctx.db
      .query("promptVersions")
      .withIndex("by_pack_prompt", (q) =>
        q.eq("packId", packId).eq("promptCreatedAt", promptCreatedAt)
      )
      .collect();
    return versions.length;
  },
});

// Create a new prompt version
export const create = mutation({
  args: {
    packId: v.id("userPacks"),
    authorId: v.id("users"),
    promptCreatedAt: v.number(),
    versionNumber: v.number(),
    text: v.string(),
    header: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("promptVersions", {
      ...args,
      savedAt: Date.now(),
    });
  },
});

// Delete a single prompt version
export const remove = mutation({
  args: { id: v.id("promptVersions") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});

// Delete all prompt versions for a pack (cascade on pack delete)
export const removeAllForPack = mutation({
  args: { packId: v.id("userPacks") },
  handler: async (ctx, { packId }) => {
    const versions = await ctx.db
      .query("promptVersions")
      .withIndex("by_pack", (q) => q.eq("packId", packId))
      .collect();
    for (const version of versions) {
      await ctx.db.delete(version._id);
    }
  },
});

// Delete all versions for a specific prompt
export const removeAllForPrompt = mutation({
  args: {
    packId: v.id("userPacks"),
    promptCreatedAt: v.number(),
  },
  handler: async (ctx, { packId, promptCreatedAt }) => {
    const versions = await ctx.db
      .query("promptVersions")
      .withIndex("by_pack_prompt", (q) =>
        q.eq("packId", packId).eq("promptCreatedAt", promptCreatedAt)
      )
      .collect();
    for (const version of versions) {
      await ctx.db.delete(version._id);
    }
  },
});
