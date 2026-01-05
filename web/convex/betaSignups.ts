import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Add a beta tester signup
 */
export const create = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, { email }) => {
    // Check if email already exists
    const existing = await ctx.db
      .query("betaSignups")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existing) {
      return { success: true, alreadyExists: true };
    }

    // Create new beta signup
    await ctx.db.insert("betaSignups", {
      email,
      signedUpAt: Date.now(),
    });

    return { success: true, alreadyExists: false };
  },
});

/**
 * Get all beta signups (admin only)
 */
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("betaSignups").collect();
  },
});
