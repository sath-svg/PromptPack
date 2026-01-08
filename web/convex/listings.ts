import { v } from "convex/values";
import { query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

const DEFAULT_LICENSE = "personal";
const DEFAULT_TAGLINE = "Community pack";

const toListing = (pack: Doc<"userPacks">) => {
  const description = (pack.description ?? "").trim();
  const taglineSource = description.length > 0
    ? description
    : pack.category
      ? `Category: ${pack.category}`
      : DEFAULT_TAGLINE;
  const tagline = taglineSource.length > 140
    ? `${taglineSource.slice(0, 137)}...`
    : taglineSource;

  return {
    _id: pack._id,
    title: pack.title,
    tagline,
    tags: pack.category ? [pack.category] : [],
    pricingModel: pack.price > 0 ? "paid" : "free",
    priceInCents: pack.price,
    downloads: pack.downloads,
    license: DEFAULT_LICENSE,
  };
};

const applyPricingFilter = (
  listings: ReturnType<typeof toListing>[],
  pricingModel?: "free" | "paid"
) => {
  if (!pricingModel) return listings;
  return listings.filter((listing) => listing.pricingModel === pricingModel);
};

export const list = query({
  args: {
    status: v.optional(v.literal("published")),
    pricingModel: v.optional(v.union(v.literal("free"), v.literal("paid"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { status, pricingModel, limit }) => {
    if (status && status !== "published") {
      return [];
    }

    const packs = await ctx.db
      .query("userPacks")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .collect();

    let listings = applyPricingFilter(packs.map(toListing), pricingModel);

    if (limit !== undefined) {
      listings = listings.slice(0, limit);
    }

    return listings;
  },
});

export const search = query({
  args: {
    query: v.string(),
    pricingModel: v.optional(v.union(v.literal("free"), v.literal("paid"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { query, pricingModel, limit }) => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];

    const packs = await ctx.db
      .query("userPacks")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .collect();

    let listings = packs
      .map(toListing)
      .filter((listing) => {
        const haystack = `${listing.title} ${listing.tagline} ${listing.tags.join(" ")}`.toLowerCase();
        return haystack.includes(needle);
      });

    listings = applyPricingFilter(listings, pricingModel);

    if (limit !== undefined) {
      listings = listings.slice(0, limit);
    }

    return listings;
  },
});
