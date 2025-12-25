import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all public packs for marketplace
export const listPublic = query({
  args: {
    category: v.optional(v.string()),
  },
  handler: async (ctx, { category }) => {
    if (category) {
      return await ctx.db
        .query("packs")
        .withIndex("by_category", (q) =>
          q.eq("category", category).eq("isPublic", true)
        )
        .collect();
    }
    return await ctx.db
      .query("packs")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .collect();
  },
});

// Get pack by ID
export const get = query({
  args: { id: v.id("packs") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

// Get packs created by a user
export const listByAuthor = query({
  args: { authorId: v.id("users") },
  handler: async (ctx, { authorId }) => {
    return await ctx.db
      .query("packs")
      .withIndex("by_author", (q) => q.eq("authorId", authorId))
      .collect();
  },
});

// Create a new pack (file must be uploaded to R2 first)
export const create = mutation({
  args: {
    authorId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    r2Key: v.string(), // R2 object key (e.g., "packs/user123/pack456.pmtpk")
    promptCount: v.number(),
    fileSize: v.number(), // Size in bytes
    version: v.string(),
    price: v.number(),
    isPublic: v.boolean(),
    isEncrypted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("packs", {
      ...args,
      downloads: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Update a pack
export const update = mutation({
  args: {
    id: v.id("packs"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    r2Key: v.optional(v.string()), // If updating the file in R2
    promptCount: v.optional(v.number()),
    fileSize: v.optional(v.number()),
    version: v.optional(v.string()),
    price: v.optional(v.number()),
    isPublic: v.optional(v.boolean()),
    isEncrypted: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, ...updates }) => {
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(id, {
      ...filtered,
      updatedAt: Date.now(),
    });
    return id;
  },
});

// Increment download count
export const incrementDownloads = mutation({
  args: { id: v.id("packs") },
  handler: async (ctx, { id }) => {
    const pack = await ctx.db.get(id);
    if (!pack) throw new Error("Pack not found");
    await ctx.db.patch(id, { downloads: pack.downloads + 1 });
  },
});

// Delete a pack
export const remove = mutation({
  args: { id: v.id("packs") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
