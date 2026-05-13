import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

/**
 * v2 (tier-based) prompt evaluations.
 *
 * Replaces the legacy 7-brand scoring (ChatGPT/Claude/Gemini/...). The
 * v1 → v2 cutover is a hard wipe: run `evaluations:wipeAll` (or truncate
 * via the dashboard) BEFORE deploying this schema change, otherwise the
 * Convex validator will reject pre-existing rows on read.
 */

const tierKey = v.union(v.literal("cheap"), v.literal("mid"), v.literal("frontier"));
const effort = v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.null());
const provider = v.union(
  v.literal("anthropic"),
  v.literal("openai"),
  v.literal("gemini"),
  v.literal("grok"),
  v.literal("deepseek"),
  v.literal("perplexity"),
  v.literal("kimi"),
);

const tiersObject = v.object({
  cheap: v.object({
    tier: v.literal("cheap"),
    score: v.number(),
    selectedModelId: v.string(),
    selectedModelLabel: v.string(),
  }),
  mid: v.object({
    tier: v.literal("mid"),
    score: v.number(),
    selectedModelId: v.string(),
    selectedModelLabel: v.string(),
  }),
  frontier: v.object({
    tier: v.literal("frontier"),
    score: v.number(),
    selectedModelId: v.string(),
    selectedModelLabel: v.string(),
  }),
});

const bestTierModelRow = v.object({
  modelId: v.string(),
  label: v.string(),
  score: v.number(),
});

const byokRow = v.object({
  provider,
  modelId: v.string(),
  modelLabel: v.string(),
  tier: tierKey,
  score: v.number(),
});

/** Get evaluation by prompt hash (global cache lookup). */
export const getByHash = query({
  args: { promptHash: v.string() },
  handler: async (ctx, { promptHash }) => {
    return await ctx.db
      .query("promptEvaluations")
      .withIndex("by_hash", (q) => q.eq("promptHash", promptHash))
      .first();
  },
});

/** Get evaluation for a specific user and prompt hash. */
export const getByUserHash = query({
  args: {
    userId: v.string(),
    promptHash: v.string(),
  },
  handler: async (ctx, { userId, promptHash }) => {
    return await ctx.db
      .query("promptEvaluations")
      .withIndex("by_user_hash", (q) =>
        q.eq("userId", userId).eq("promptHash", promptHash)
      )
      .first();
  },
});

/** Get multiple evaluations for a user by prompt hashes. Batch loader. */
export const listByUserHashes = query({
  args: {
    userId: v.string(),
    promptHashes: v.array(v.string()),
  },
  handler: async (ctx, { userId, promptHashes }) => {
    const evaluations = await Promise.all(
      promptHashes.map((hash) =>
        ctx.db
          .query("promptEvaluations")
          .withIndex("by_user_hash", (q) =>
            q.eq("userId", userId).eq("promptHash", hash)
          )
          .first()
      )
    );
    const result: Record<string, typeof evaluations[0]> = {};
    for (let i = 0; i < promptHashes.length; i++) {
      if (evaluations[i]) {
        result[promptHashes[i]] = evaluations[i];
      }
    }
    return result;
  },
});

/** Save or update a v2 evaluation. Called by the API worker after Groq returns. */
export const upsert = mutation({
  args: {
    userId: v.string(),
    promptHash: v.string(),
    schemaVersion: v.literal(2),
    tiers: tiersObject,
    recommendedTier: tierKey,
    recommendedModelId: v.string(),
    recommendedModelLabel: v.string(),
    recommendedEffort: effort,
    bestTierModels: v.array(bestTierModelRow),
    byok: v.optional(v.array(byokRow)),
    rationale: v.optional(v.string()),
    evaluatedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("promptEvaluations")
      .withIndex("by_user_hash", (q) =>
        q.eq("userId", args.userId).eq("promptHash", args.promptHash)
      )
      .first();

    const data = {
      userId: args.userId,
      promptHash: args.promptHash,
      schemaVersion: 2 as const,
      tiers: args.tiers,
      recommendedTier: args.recommendedTier,
      recommendedModelId: args.recommendedModelId,
      recommendedModelLabel: args.recommendedModelLabel,
      recommendedEffort: args.recommendedEffort,
      bestTierModels: args.bestTierModels,
      byok: args.byok,
      rationale: args.rationale,
      evaluatedAt: args.evaluatedAt ?? Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    }

    return await ctx.db.insert("promptEvaluations", data);
  },
});

/** Delete an evaluation (e.g., when prompt is deleted). */
export const remove = mutation({
  args: {
    userId: v.string(),
    promptHash: v.string(),
  },
  handler: async (ctx, { userId, promptHash }) => {
    const existing = await ctx.db
      .query("promptEvaluations")
      .withIndex("by_user_hash", (q) =>
        q.eq("userId", userId).eq("promptHash", promptHash)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return true;
    }
    return false;
  },
});

/**
 * One-shot wipe of every row in `promptEvaluations`. Run this before
 * deploying the v2 schema so the validator does not reject leftover v1
 * rows on read. Idempotent; safe to re-run.
 *
 * Invoke with: `npx convex run evaluations:wipeAll`
 */
export const wipeAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    let count = 0;
    const all = await ctx.db.query("promptEvaluations").collect();
    for (const row of all) {
      await ctx.db.delete(row._id);
      count++;
    }
    return { deleted: count };
  },
});
