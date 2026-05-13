import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { findUserByAnyId } from "./users";

// Get skillset by ID
export const get = query({
  args: { id: v.id("userSkillsets") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

// Get skillsets created by a user
export const listByAuthor = query({
  args: { authorId: v.id("users") },
  handler: async (ctx, { authorId }) => {
    return await ctx.db
      .query("userSkillsets")
      .withIndex("by_author", (q) => q.eq("authorId", authorId))
      .collect();
  },
});

// Get skillsets created by a user (by userId for desktop/extension)
export const listByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const user = await findUserByAnyId(ctx.db, userId);
    if (!user) return [];

    return await ctx.db
      .query("userSkillsets")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .collect();
  },
});

// Get public skillsets for marketplace
export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("userSkillsets")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .collect();
  },
});

// Create a new skillset
export const create = mutation({
  args: {
    authorId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    referenceImages: v.optional(
      v.array(
        v.object({
          id: v.string(),
          url: v.string(),
          uploadedAt: v.number(),
        })
      )
    ),
    price: v.number(),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("userSkillsets", {
      ...args,
      isVerified: false,
      downloads: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Update skillset with style analysis results (v2 — rich structured schema)
export const updateStyleAnalysis = mutation({
  args: {
    id: v.id("userSkillsets"),
    styleCharacteristics: v.object({
      lineWork: v.object({
        thickness: v.string(),
        edges: v.string(),
        consistency: v.string(),
      }),
      colorPalette: v.object({
        hexCodes: v.array(v.string()),
        count: v.number(),
        temperature: v.string(),
        dominant: v.string(),
        accents: v.array(v.string()),
      }),
      shading: v.object({
        technique: v.string(),
        lightDirection: v.string(),
        intensity: v.string(),
      }),
      texture: v.object({
        medium: v.string(),
        scale: v.string(),
        density: v.string(),
      }),
      composition: v.object({
        framing: v.string(),
        perspective: v.string(),
      }),
      signatureElements: v.array(v.string()),
      fullStyleDescription: v.string(),
      extractedAt: v.number(),
    }),
    prompts: v.array(v.object({
      id: v.string(),
      label: v.string(),
      purpose: v.string(),
      icon: v.string(),
      template: v.string(),
      negativePrompt: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const { id, styleCharacteristics, prompts } = args;
    await ctx.db.patch(id, {
      styleCharacteristics,
      prompts,
      updatedAt: Date.now(),
    });
    return await ctx.db.get(id);
  },
});

// Update skillset with preview generation
export const addPreviewGeneration = mutation({
  args: {
    id: v.id("userSkillsets"),
    generation: v.object({
      id: v.string(),
      imageUrls: v.array(v.string()),
      generatedAt: v.number(),
      prompt: v.optional(v.string()),
      satisfied: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    const skillset = await ctx.db.get(args.id);
    if (!skillset) throw new Error("Skillset not found");

    const generations = skillset.previewGenerations || [];
    generations.push(args.generation);

    await ctx.db.patch(args.id, {
      previewGenerations: generations,
      updatedAt: Date.now(),
    });
    return await ctx.db.get(args.id);
  },
});

// Mark skillset as verified
export const markVerified = mutation({
  args: {
    id: v.id("userSkillsets"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      isVerified: true,
      updatedAt: Date.now(),
    });
    return await ctx.db.get(args.id);
  },
});

// Update skillset metadata (title, description, etc.)
export const update = mutation({
  args: {
    id: v.id("userSkillsets"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    r2Key: v.optional(v.string()),
    price: v.optional(v.number()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updateData } = args;
    await ctx.db.patch(id, {
      ...updateData,
      updatedAt: Date.now(),
    });
    return await ctx.db.get(id);
  },
});

// Delete a skillset
export const remove = mutation({
  args: { id: v.id("userSkillsets") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});

// Increment download count
export const incrementDownload = mutation({
  args: { id: v.id("userSkillsets") },
  handler: async (ctx, { id }) => {
    const skillset = await ctx.db.get(id);
    if (!skillset) throw new Error("Skillset not found");

    await ctx.db.patch(id, {
      downloads: (skillset.downloads || 0) + 1,
      updatedAt: Date.now(),
    });
  },
});
