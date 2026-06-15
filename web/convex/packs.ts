import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { findUserByAnyId } from "./users";
import { assertNotRetiredFree } from "./credits";

// Get all public user packs for marketplace
export const listPublic = query({
  args: {
    category: v.optional(v.string()),
  },
  handler: async (ctx, { category }) => {
    if (category) {
      return await ctx.db
        .query("userPacks")
        .withIndex("by_category", (q) =>
          q.eq("category", category).eq("isPublic", true)
        )
        .collect();
    }
    return await ctx.db
      .query("userPacks")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .collect();
  },
});

// Get user pack by ID
export const get = query({
  args: { id: v.id("userPacks") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

// Get packs created by a user
export const listByAuthor = query({
  args: { authorId: v.id("users") },
  handler: async (ctx, { authorId }) => {
    return await ctx.db
      .query("userPacks")
      .withIndex("by_author", (q) => q.eq("authorId", authorId))
      .collect();
  },
});

// Get packs created by a user (by userId for desktop/extension)
export const listByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    // First find the user by userId
    const user = await findUserByAnyId(ctx.db, userId);

    if (!user) {
      return [];
    }

    // Then get all their packs
    return await ctx.db
      .query("userPacks")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .collect();
  },
});

// Create a new user pack (file must be uploaded to R2 first)
export const create = mutation({
  args: {
    authorId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    r2Key: v.string(), // R2 object key (e.g., "users/user123/userpacks/pack456.pmtpk")
    promptCount: v.number(),
    fileSize: v.number(), // Size in bytes
    version: v.string(),
    price: v.number(),
    isPublic: v.boolean(),
    isEncrypted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    assertNotRetiredFree(await ctx.db.get(args.authorId));
    return await ctx.db.insert("userPacks", {
      ...args,
      downloads: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Update a user pack
export const update = mutation({
  args: {
    id: v.id("userPacks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    icon: v.optional(v.string()), // Emoji icon for the pack
    r2Key: v.optional(v.string()), // If updating the file in R2
    promptCount: v.optional(v.number()),
    fileSize: v.optional(v.number()),
    version: v.optional(v.string()),
    price: v.optional(v.number()),
    isPublic: v.optional(v.boolean()),
    isEncrypted: v.optional(v.boolean()),
    headers: v.optional(v.record(v.string(), v.string())),
  },
  handler: async (ctx, { id, ...updates }) => {
    const pack = await ctx.db.get(id);
    if (pack) assertNotRetiredFree(await ctx.db.get(pack.authorId));
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

// Update pack icon only
export const updateIcon = mutation({
  args: {
    id: v.id("userPacks"),
    icon: v.union(v.string(), v.null()),
  },
  handler: async (ctx, { id, icon }) => {
    await ctx.db.patch(id, {
      icon: icon || undefined,
      updatedAt: Date.now(),
    });
    return id;
  },
});

// Update pack kind (flow | folder | preset) only.
// Used by the desktop app's kind-picker pill row in UserPacks detail.
export const updateKind = mutation({
  args: {
    id: v.id("userPacks"),
    kind: v.union(v.literal("flow"), v.literal("folder"), v.literal("preset")),
  },
  handler: async (ctx, { id, kind }) => {
    await ctx.db.patch(id, {
      kind,
      updatedAt: Date.now(),
    });
    return id;
  },
});

// Set or clear a prompt header override for a pack
export const setHeader = mutation({
  args: {
    id: v.id("userPacks"),
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

// Increment download count
export const incrementDownloads = mutation({
  args: { id: v.id("userPacks") },
  handler: async (ctx, { id }) => {
    const pack = await ctx.db.get(id);
    if (!pack) throw new Error("Pack not found");
    await ctx.db.patch(id, { downloads: pack.downloads + 1 });
  },
});

// Delete a user pack
export const remove = mutation({
  args: { id: v.id("userPacks") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});

// Toggle PromptControl (version control) on a pack
// When disabling, all prompt versions for this pack are permanently deleted
export const toggleVersionControl = mutation({
  args: {
    id: v.id("userPacks"),
    enabled: v.boolean(),
  },
  handler: async (ctx, { id, enabled }) => {
    await ctx.db.patch(id, {
      versionControlEnabled: enabled,
      updatedAt: Date.now(),
    });

    // When disabling, remove all prompt versions for this pack
    if (!enabled) {
      const versions = await ctx.db
        .query("promptVersions")
        .withIndex("by_pack", (q) => q.eq("packId", id))
        .collect();
      for (const version of versions) {
        await ctx.db.delete(version._id);
      }
    }

    return id;
  },
});

// Alias for desktop HTTP API
export const deletePack = mutation({
  args: { id: v.id("userPacks") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
