import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================================================
// QUERIES
// ============================================================================

// Browse marketplace listings with optional filters
export const list = query({
  args: {
    status: v.optional(
      v.union(v.literal("draft"), v.literal("published"), v.literal("suspended"))
    ),
    pricingModel: v.optional(v.union(v.literal("free"), v.literal("paid"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { status, pricingModel, limit }) => {
    let results;

    // Filter by status (default to published for marketplace browse)
    if (status) {
      results = await ctx.db
        .query("marketplaceListings")
        .withIndex("by_status", (q) => q.eq("status", status))
        .collect();
    } else {
      results = await ctx.db.query("marketplaceListings").collect();
    }

    // Filter by pricing model if specified
    if (pricingModel) {
      results = results.filter((l) => l.pricingModel === pricingModel);
    }

    // Sort by downloads (trending)
    results.sort((a, b) => b.downloads - a.downloads);

    // Apply limit
    if (limit) {
      results = results.slice(0, limit);
    }

    return results;
  },
});

// Search marketplace listings
export const search = query({
  args: {
    query: v.string(),
    pricingModel: v.optional(v.union(v.literal("free"), v.literal("paid"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { query: searchQuery, pricingModel, limit }) => {
    let q = ctx.db
      .query("marketplaceListings")
      .withSearchIndex("search_listings", (idx) => {
        let search = idx.search("searchText", searchQuery);
        search = search.eq("status", "published");
        if (pricingModel) {
          search = search.eq("pricingModel", pricingModel);
        }
        return search;
      });

    let results = await q.collect();

    if (limit) {
      results = results.slice(0, limit);
    }

    return results;
  },
});

// Get a single listing by ID
export const get = query({
  args: { id: v.id("marketplaceListings") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

// Get listing by pack ID
export const getByPack = query({
  args: { packId: v.id("userPacks") },
  handler: async (ctx, { packId }) => {
    return await ctx.db
      .query("marketplaceListings")
      .withIndex("by_pack", (q) => q.eq("packId", packId))
      .first();
  },
});

// Get all listings by an author (for creator dashboard)
export const getByAuthor = query({
  args: { authorId: v.id("users") },
  handler: async (ctx, { authorId }) => {
    return await ctx.db
      .query("marketplaceListings")
      .withIndex("by_author", (q) => q.eq("authorId", authorId))
      .collect();
  },
});

// Get trending listings (by downloads)
export const getTrending = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 10 }) => {
    const listings = await ctx.db
      .query("marketplaceListings")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();

    // Sort by downloads descending
    listings.sort((a, b) => b.downloads - a.downloads);

    return listings.slice(0, limit);
  },
});

// Get listing with author info
export const getWithAuthor = query({
  args: { id: v.id("marketplaceListings") },
  handler: async (ctx, { id }) => {
    const listing = await ctx.db.get(id);
    if (!listing) return null;

    const author = await ctx.db.get(listing.authorId);
    const pack = await ctx.db.get(listing.packId);

    return {
      ...listing,
      author: author
        ? {
            id: author._id,
            name: author.name,
            imageUrl: author.imageUrl,
          }
        : null,
      pack: pack
        ? {
            id: pack._id,
            promptCount: pack.promptCount,
            fileSize: pack.fileSize,
            version: pack.version,
          }
        : null,
    };
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

// Helper to generate searchText
function generateSearchText(
  title: string,
  tagline: string,
  tags: string[]
): string {
  return `${title} ${tagline} ${tags.join(" ")}`;
}

// Create a new listing (draft)
export const create = mutation({
  args: {
    packId: v.id("userPacks"),
    authorId: v.id("users"),
    title: v.string(),
    tagline: v.string(),
    description: v.string(),
    tags: v.array(v.string()),
    pricingModel: v.union(v.literal("free"), v.literal("paid")),
    priceInCents: v.number(),
    license: v.union(
      v.literal("personal"),
      v.literal("commercial"),
      v.literal("team")
    ),
    coverImageUrl: v.optional(v.string()),
    bulletPoints: v.optional(v.array(v.string())),
    exampleInput: v.optional(v.string()),
    exampleOutput: v.optional(v.string()),
    supportedModels: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Verify user is Studio tier
    const user = await ctx.db.get(args.authorId);
    if (!user || user.plan !== "studio") {
      throw new Error("Only Studio tier users can create marketplace listings");
    }

    // Verify pack exists and belongs to author
    const pack = await ctx.db.get(args.packId);
    if (!pack) {
      throw new Error("Pack not found");
    }
    if (pack.authorId !== args.authorId) {
      throw new Error("Pack does not belong to this user");
    }

    // Check if listing already exists for this pack
    const existingListing = await ctx.db
      .query("marketplaceListings")
      .withIndex("by_pack", (q) => q.eq("packId", args.packId))
      .first();
    if (existingListing) {
      throw new Error("A listing already exists for this pack");
    }

    // Validate tags (max 5)
    if (args.tags.length > 5) {
      throw new Error("Maximum 5 tags allowed");
    }

    // Validate bullet points (max 3)
    if (args.bulletPoints && args.bulletPoints.length > 3) {
      throw new Error("Maximum 3 bullet points allowed");
    }

    // Validate price for paid listings
    if (args.pricingModel === "paid" && args.priceInCents <= 0) {
      throw new Error("Paid listings must have a price greater than 0");
    }

    // Free listings must have price 0
    if (args.pricingModel === "free" && args.priceInCents !== 0) {
      throw new Error("Free listings must have price set to 0");
    }

    const now = Date.now();
    return await ctx.db.insert("marketplaceListings", {
      ...args,
      searchText: generateSearchText(args.title, args.tagline, args.tags),
      downloads: 0,
      salesCount: 0,
      reportCount: 0,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update a listing
export const update = mutation({
  args: {
    id: v.id("marketplaceListings"),
    title: v.optional(v.string()),
    tagline: v.optional(v.string()),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    pricingModel: v.optional(v.union(v.literal("free"), v.literal("paid"))),
    priceInCents: v.optional(v.number()),
    license: v.optional(
      v.union(v.literal("personal"), v.literal("commercial"), v.literal("team"))
    ),
    coverImageUrl: v.optional(v.string()),
    bulletPoints: v.optional(v.array(v.string())),
    exampleInput: v.optional(v.string()),
    exampleOutput: v.optional(v.string()),
    supportedModels: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { id, ...updates }) => {
    const listing = await ctx.db.get(id);
    if (!listing) {
      throw new Error("Listing not found");
    }

    // Can't update suspended listings
    if (listing.status === "suspended") {
      throw new Error("Cannot update a suspended listing");
    }

    // Validate tags if updating
    if (updates.tags && updates.tags.length > 5) {
      throw new Error("Maximum 5 tags allowed");
    }

    // Validate bullet points if updating
    if (updates.bulletPoints && updates.bulletPoints.length > 3) {
      throw new Error("Maximum 3 bullet points allowed");
    }

    // Build update object, only including defined fields
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );

    // Regenerate searchText if title, tagline, or tags changed
    const newTitle = updates.title ?? listing.title;
    const newTagline = updates.tagline ?? listing.tagline;
    const newTags = updates.tags ?? listing.tags;

    await ctx.db.patch(id, {
      ...filtered,
      searchText: generateSearchText(newTitle, newTagline, newTags),
      updatedAt: Date.now(),
    });

    return id;
  },
});

// Publish a listing (set status to published)
export const publish = mutation({
  args: { id: v.id("marketplaceListings") },
  handler: async (ctx, { id }) => {
    const listing = await ctx.db.get(id);
    if (!listing) {
      throw new Error("Listing not found");
    }

    // Can't publish suspended listings
    if (listing.status === "suspended") {
      throw new Error(
        "Cannot publish a suspended listing. Contact support for assistance."
      );
    }

    // Already published
    if (listing.status === "published") {
      return id;
    }

    await ctx.db.patch(id, {
      status: "published",
      publishedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return id;
  },
});

// Unpublish a listing (back to draft)
export const unpublish = mutation({
  args: { id: v.id("marketplaceListings") },
  handler: async (ctx, { id }) => {
    const listing = await ctx.db.get(id);
    if (!listing) {
      throw new Error("Listing not found");
    }

    // Can't unpublish suspended listings
    if (listing.status === "suspended") {
      throw new Error("Cannot unpublish a suspended listing");
    }

    await ctx.db.patch(id, {
      status: "draft",
      updatedAt: Date.now(),
    });

    return id;
  },
});

// Archive a listing (hide from creator's active listings)
export const archive = mutation({
  args: { id: v.id("marketplaceListings") },
  handler: async (ctx, { id }) => {
    const listing = await ctx.db.get(id);
    if (!listing) {
      throw new Error("Listing not found");
    }

    // Can archive from any status except suspended
    if (listing.status === "suspended") {
      throw new Error("Cannot archive a suspended listing. Contact support.");
    }

    await ctx.db.patch(id, {
      status: "archived",
      updatedAt: Date.now(),
    });

    return id;
  },
});

// Admin only: Unsuspend a listing
export const unsuspend = mutation({
  args: {
    id: v.id("marketplaceListings"),
    adminUserId: v.id("users"),
  },
  handler: async (ctx, { id, adminUserId }) => {
    // TODO: Add proper admin check when admin system is implemented
    // For now, this is a placeholder that should be called via internal action
    const admin = await ctx.db.get(adminUserId);
    if (!admin) {
      throw new Error("Admin user not found");
    }

    const listing = await ctx.db.get(id);
    if (!listing) {
      throw new Error("Listing not found");
    }

    if (listing.status !== "suspended") {
      throw new Error("Listing is not suspended");
    }

    await ctx.db.patch(id, {
      status: "draft",
      suspendedReason: undefined,
      suspendedAt: undefined,
      reportCount: 0, // Reset report count on unsuspend
      updatedAt: Date.now(),
    });

    return id;
  },
});

// Delete a listing (only if no sales)
export const remove = mutation({
  args: { id: v.id("marketplaceListings") },
  handler: async (ctx, { id }) => {
    const listing = await ctx.db.get(id);
    if (!listing) {
      throw new Error("Listing not found");
    }

    // Can't delete if there are sales
    if (listing.salesCount > 0) {
      throw new Error(
        "Cannot delete a listing with sales. Unpublish it instead."
      );
    }

    await ctx.db.delete(id);
  },
});

// Increment download count (called when user downloads a free pack)
export const incrementDownloads = mutation({
  args: { id: v.id("marketplaceListings") },
  handler: async (ctx, { id }) => {
    const listing = await ctx.db.get(id);
    if (!listing) {
      throw new Error("Listing not found");
    }

    await ctx.db.patch(id, {
      downloads: listing.downloads + 1,
    });

    // Also increment on the underlying pack
    const pack = await ctx.db.get(listing.packId);
    if (pack) {
      await ctx.db.patch(listing.packId, {
        downloads: pack.downloads + 1,
      });
    }
  },
});

// Internal: Suspend a listing (called by reports system)
export const suspend = mutation({
  args: {
    id: v.id("marketplaceListings"),
    reason: v.string(),
  },
  handler: async (ctx, { id, reason }) => {
    const listing = await ctx.db.get(id);
    if (!listing) {
      throw new Error("Listing not found");
    }

    await ctx.db.patch(id, {
      status: "suspended",
      suspendedReason: reason,
      suspendedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return id;
  },
});

// Internal: Increment report count
export const incrementReportCount = mutation({
  args: { id: v.id("marketplaceListings") },
  handler: async (ctx, { id }) => {
    const listing = await ctx.db.get(id);
    if (!listing) {
      throw new Error("Listing not found");
    }

    await ctx.db.patch(id, {
      reportCount: listing.reportCount + 1,
    });

    return listing.reportCount + 1;
  },
});
