import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all saved packs for a user (metadata only, file is in R2)
export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("savedPacks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

// Get saved pack by user and source
export const getByUserAndSource = query({
  args: {
    userId: v.id("users"),
    source: v.union(v.literal("chatgpt"), v.literal("claude"), v.literal("gemini"), v.literal("perplexity"), v.literal("grok"), v.literal("deepseek"), v.literal("kimi")),
  },
  handler: async (ctx, { userId, source }) => {
    return await ctx.db
      .query("savedPacks")
      .withIndex("by_user_source", (q) => q.eq("userId", userId).eq("source", source))
      .first();
  },
});

// Save or update pack metadata after R2 upload (upsert)
export const upsert = mutation({
  args: {
    userId: v.id("users"),
    source: v.union(v.literal("chatgpt"), v.literal("claude"), v.literal("gemini"), v.literal("perplexity"), v.literal("grok"), v.literal("deepseek"), v.literal("kimi")),
    r2Key: v.string(),
    promptCount: v.number(),
    fileSize: v.number(),
  },
  handler: async (ctx, { userId, source, r2Key, promptCount, fileSize }) => {
    // Check if a saved pack already exists for this user + source
    const existing = await ctx.db
      .query("savedPacks")
      .withIndex("by_user_source", (q) => q.eq("userId", userId).eq("source", source))
      .first();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        r2Key,
        promptCount,
        fileSize,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    // Create new
    return await ctx.db.insert("savedPacks", {
      userId,
      source,
      r2Key,
      promptCount,
      fileSize,
      headers: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Delete saved pack
export const remove = mutation({
  args: { id: v.id("savedPacks") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});

// Delete saved pack by user and source
export const removeByUserAndSource = mutation({
  args: {
    userId: v.id("users"),
    source: v.union(v.literal("chatgpt"), v.literal("claude"), v.literal("gemini"), v.literal("perplexity"), v.literal("grok"), v.literal("deepseek"), v.literal("kimi")),
  },
  handler: async (ctx, { userId, source }) => {
    const existing = await ctx.db
      .query("savedPacks")
      .withIndex("by_user_source", (q) => q.eq("userId", userId).eq("source", source))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { deleted: true, r2Key: existing.r2Key };
    }
    return { deleted: false, r2Key: null };
  },
});

// Save pack metadata using clerkId (called after R2 upload from extension)
export const upsertByClerkId = mutation({
  args: {
    clerkId: v.string(),
    source: v.union(v.literal("chatgpt"), v.literal("claude"), v.literal("gemini"), v.literal("perplexity"), v.literal("grok"), v.literal("deepseek"), v.literal("kimi")),
    r2Key: v.string(),
    promptCount: v.number(),
    fileSize: v.number(),
    headers: v.optional(v.record(v.string(), v.string())), // Map of promptId -> header
  },
  handler: async (ctx, { clerkId, source, r2Key, promptCount, fileSize, headers }) => {
    // Find user by clerkId
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if a saved pack already exists for this user + source
    const existing = await ctx.db
      .query("savedPacks")
      .withIndex("by_user_source", (q) => q.eq("userId", user._id).eq("source", source))
      .first();

    if (existing) {
      // Update existing - merge headers with existing ones
      const mergedHeaders = { ...(existing.headers ?? {}), ...(headers ?? {}) };
      await ctx.db.patch(existing._id, {
        r2Key,
        promptCount,
        fileSize,
        headers: mergedHeaders,
        updatedAt: Date.now(),
      });
      return { id: existing._id, updated: true };
    }

    // Create new
    const id = await ctx.db.insert("savedPacks", {
      userId: user._id,
      source,
      r2Key,
      promptCount,
      fileSize,
      headers: headers ?? {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return { id, updated: false };
  },
});

// Set or clear a prompt header override for a saved pack
export const setHeader = mutation({
  args: {
    id: v.id("savedPacks"),
    promptKey: v.string(),
    header: v.optional(v.string()),
  },
  handler: async (ctx, { id, promptKey, header }) => {
    const pack = await ctx.db.get(id);
    if (!pack) throw new Error("Pack not found");

    const headers = { ...(pack.headers ?? {}) };
    const nextHeader = header?.trim();

    if (nextHeader) {
      headers[promptKey] = nextHeader;
    } else {
      delete headers[promptKey];
    }

    await ctx.db.patch(id, {
      headers,
      updatedAt: Date.now(),
    });
  },
});

// Update saved pack metadata (after R2 file update)
export const update = mutation({
  args: {
    id: v.id("savedPacks"),
    promptCount: v.optional(v.number()),
    fileSize: v.optional(v.number()),
  },
  handler: async (ctx, { id, promptCount, fileSize }) => {
    const pack = await ctx.db.get(id);
    if (!pack) throw new Error("Pack not found");

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (promptCount !== undefined) updates.promptCount = promptCount;
    if (fileSize !== undefined) updates.fileSize = fileSize;

    await ctx.db.patch(id, updates);
  },
});

// Get saved pack by ID
export const get = query({
  args: { id: v.id("savedPacks") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});
