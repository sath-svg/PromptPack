import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get evaluation by prompt hash (global cache lookup)
 * Can be used to serve cached evaluations for identical prompts
 */
export const getByHash = query({
  args: { promptHash: v.string() },
  handler: async (ctx, { promptHash }) => {
    return await ctx.db
      .query("promptEvaluations")
      .withIndex("by_hash", (q) => q.eq("promptHash", promptHash))
      .first();
  },
});

/**
 * Get evaluation for a specific user and prompt hash
 */
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

/**
 * Get multiple evaluations for a user by prompt hashes
 * Used for batch loading evaluations when displaying prompt list
 */
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
    // Return as a map of hash -> evaluation for easy lookup
    const result: Record<string, typeof evaluations[0]> = {};
    for (let i = 0; i < promptHashes.length; i++) {
      if (evaluations[i]) {
        result[promptHashes[i]] = evaluations[i];
      }
    }
    return result;
  },
});

/**
 * Save or update an evaluation
 * Called by the API after Groq returns scores
 */
export const upsert = mutation({
  args: {
    userId: v.string(),
    promptHash: v.string(),
    overallScore: v.number(),
    scores: v.object({
      chatgpt: v.number(),
      claude: v.number(),
      gemini: v.number(),
      perplexity: v.number(),
      grok: v.number(),
      deepseek: v.number(),
      kimi: v.number(),
    }),
    version: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if evaluation already exists for this user+hash
    const existing = await ctx.db
      .query("promptEvaluations")
      .withIndex("by_user_hash", (q) =>
        q.eq("userId", args.userId).eq("promptHash", args.promptHash)
      )
      .first();

    const data = {
      userId: args.userId,
      promptHash: args.promptHash,
      overallScore: args.overallScore,
      scores: args.scores,
      evaluatedAt: Date.now(),
      version: args.version ?? "1.0",
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    }

    return await ctx.db.insert("promptEvaluations", data);
  },
});

/**
 * Delete an evaluation (e.g., when prompt is deleted)
 */
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
