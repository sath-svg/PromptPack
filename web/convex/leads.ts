import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Capture a marketing lead from the homepage email gate. Dedupes by normalized
 * email so repeat submissions don't pile up. Public (no auth) — called before
 * sign-up, so a visitor who bails before finishing the funnel is still
 * reachable.
 */
export const capture = mutation({
  args: { email: v.string(), source: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, { email, source }) => {
    const norm = email.trim().toLowerCase();
    if (!norm || !norm.includes("@")) return null;

    const existing = await ctx.db
      .query("leads")
      .withIndex("by_email", (q) => q.eq("email", norm))
      .first();
    if (existing) return null;

    await ctx.db.insert("leads", {
      email: norm,
      source: source ?? "homepage_gate",
      createdAt: Date.now(),
    });
    return null;
  },
});
