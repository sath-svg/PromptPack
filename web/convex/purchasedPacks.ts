import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all packs purchased by a user
export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const purchasedPacks = await ctx.db
      .query("purchasedPacks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Fetch the full pack details
    const packs = await Promise.all(
      purchasedPacks.map(async (pp) => {
        const pack = await ctx.db.get(pp.packId);
        return pack
          ? {
              ...pack,
              purchasedAt: pp.purchasedAt,
              purchaseId: pp._id,
              listingId: pp.listingId,
              amountPaid: pp.amountPaid,
              status: pp.status,
            }
          : null;
      })
    );

    return packs.filter((p) => p !== null);
  },
});

// Get marketplace purchases by user (with listing details)
export const listMarketplacePurchases = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const purchases = await ctx.db
      .query("purchasedPacks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Filter to only marketplace purchases (has listingId)
    const marketplacePurchases = purchases.filter((p) => p.listingId);

    // Fetch listing and pack details
    const results = await Promise.all(
      marketplacePurchases.map(async (purchase) => {
        const listing = purchase.listingId
          ? await ctx.db.get(purchase.listingId)
          : null;
        const pack = await ctx.db.get(purchase.packId);

        return {
          purchase,
          listing,
          pack,
        };
      })
    );

    return results.filter((r) => r.listing && r.pack);
  },
});

// Check if user owns a pack
export const hasPurchased = query({
  args: {
    userId: v.id("users"),
    packId: v.id("userPacks"),
  },
  handler: async (ctx, { userId, packId }) => {
    const existing = await ctx.db
      .query("purchasedPacks")
      .withIndex("by_user_pack", (q) =>
        q.eq("userId", userId).eq("packId", packId)
      )
      .first();
    return existing !== null;
  },
});

// Purchase a pack (add to user's purchased packs) - legacy method for non-marketplace
export const purchase = mutation({
  args: {
    userId: v.id("users"),
    packId: v.id("userPacks"),
  },
  handler: async (ctx, { userId, packId }) => {
    // Check if already purchased
    const existing = await ctx.db
      .query("purchasedPacks")
      .withIndex("by_user_pack", (q) =>
        q.eq("userId", userId).eq("packId", packId)
      )
      .first();

    if (existing) {
      return existing._id;
    }

    // Add to purchased packs
    const id = await ctx.db.insert("purchasedPacks", {
      userId,
      packId,
      purchasedAt: Date.now(),
    });

    // Increment download count on the pack
    const pack = await ctx.db.get(packId);
    if (pack) {
      await ctx.db.patch(packId, { downloads: pack.downloads + 1 });
    }

    return id;
  },
});

// ============================================================================
// MARKETPLACE PURCHASE FUNCTIONS
// ============================================================================

// Check if user has purchased a specific listing
export const hasPurchasedListing = query({
  args: {
    userId: v.id("users"),
    listingId: v.id("marketplaceListings"),
  },
  handler: async (ctx, { userId, listingId }) => {
    const existing = await ctx.db
      .query("purchasedPacks")
      .withIndex("by_listing", (q) => q.eq("listingId", listingId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();
    return existing !== null;
  },
});

// Get creator earnings (total pending earnings for payouts)
export const getCreatorEarnings = query({
  args: { creatorId: v.id("users") },
  handler: async (ctx, { creatorId }) => {
    // Get all packs by this creator
    const packs = await ctx.db
      .query("userPacks")
      .withIndex("by_author", (q) => q.eq("authorId", creatorId))
      .collect();

    const packIds = new Set(packs.map((p) => p._id));

    // Get all completed purchases of creator's packs
    const allPurchases = await ctx.db.query("purchasedPacks").collect();

    const creatorPurchases = allPurchases.filter(
      (p) =>
        packIds.has(p.packId) &&
        p.status === "completed" &&
        p.creatorEarnings !== undefined
    );

    // Sum up earnings
    const totalEarnings = creatorPurchases.reduce(
      (sum, p) => sum + (p.creatorEarnings || 0),
      0
    );

    const totalSales = creatorPurchases.length;

    return {
      totalEarnings, // In cents
      totalSales,
      purchases: creatorPurchases,
    };
  },
});

// Record a marketplace purchase (called from webhook)
export const recordMarketplacePurchase = mutation({
  args: {
    userId: v.id("users"),
    packId: v.id("userPacks"),
    listingId: v.id("marketplaceListings"),
    amountPaid: v.number(),
    platformFee: v.number(),
    creatorEarnings: v.number(),
    stripePaymentIntentId: v.string(),
  },
  handler: async (ctx, args) => {
    // CRITICAL: Check for existing purchase (idempotency)
    const existing = await ctx.db
      .query("purchasedPacks")
      .withIndex("by_user_pack", (q) =>
        q.eq("userId", args.userId).eq("packId", args.packId)
      )
      .filter((q) => q.eq(q.field("listingId"), args.listingId))
      .first();

    if (existing) {
      // Already recorded, skip (webhook replay)
      return existing._id;
    }

    const now = Date.now();
    const refundableUntil = now + 7 * 24 * 60 * 60 * 1000; // 7 days

    // Record purchase
    const id = await ctx.db.insert("purchasedPacks", {
      userId: args.userId,
      packId: args.packId,
      listingId: args.listingId,
      amountPaid: args.amountPaid,
      platformFee: args.platformFee,
      creatorEarnings: args.creatorEarnings,
      stripePaymentIntentId: args.stripePaymentIntentId,
      status: "completed",
      refundableUntil,
      purchasedAt: now,
    });

    // Increment listing sales count and downloads
    const listing = await ctx.db.get(args.listingId);
    if (listing) {
      await ctx.db.patch(args.listingId, {
        salesCount: listing.salesCount + 1,
        downloads: listing.downloads + 1,
      });
    }

    // Increment pack downloads
    const pack = await ctx.db.get(args.packId);
    if (pack) {
      await ctx.db.patch(args.packId, { downloads: pack.downloads + 1 });
    }

    return id;
  },
});

// Record a free pack acquisition
export const recordFreePurchase = mutation({
  args: {
    userId: v.id("users"),
    packId: v.id("userPacks"),
    listingId: v.id("marketplaceListings"),
  },
  handler: async (ctx, args) => {
    // Check if already acquired
    const existing = await ctx.db
      .query("purchasedPacks")
      .withIndex("by_user_pack", (q) =>
        q.eq("userId", args.userId).eq("packId", args.packId)
      )
      .first();

    if (existing) {
      return existing._id;
    }

    // Record free acquisition
    const id = await ctx.db.insert("purchasedPacks", {
      userId: args.userId,
      packId: args.packId,
      listingId: args.listingId,
      amountPaid: 0,
      platformFee: 0,
      creatorEarnings: 0,
      status: "free",
      purchasedAt: Date.now(),
    });

    // Increment listing downloads
    const listing = await ctx.db.get(args.listingId);
    if (listing) {
      await ctx.db.patch(args.listingId, {
        downloads: listing.downloads + 1,
      });
    }

    // Increment pack downloads
    const pack = await ctx.db.get(args.packId);
    if (pack) {
      await ctx.db.patch(args.packId, { downloads: pack.downloads + 1 });
    }

    return id;
  },
});

// Mark a purchase as refunded
export const markRefunded = mutation({
  args: { purchaseId: v.id("purchasedPacks") },
  handler: async (ctx, { purchaseId }) => {
    const purchase = await ctx.db.get(purchaseId);
    if (!purchase) {
      throw new Error("Purchase not found");
    }

    if (purchase.status === "refunded") {
      return purchaseId;
    }

    if (purchase.status === "free") {
      throw new Error("Cannot refund a free pack");
    }

    // Check refund window
    if (purchase.refundableUntil && Date.now() > purchase.refundableUntil) {
      throw new Error("Refund window has expired");
    }

    await ctx.db.patch(purchaseId, {
      status: "refunded",
      refundedAt: Date.now(),
    });

    // Decrement sales count on listing (but keep downloads)
    if (purchase.listingId) {
      const listing = await ctx.db.get(purchase.listingId);
      if (listing && listing.salesCount > 0) {
        await ctx.db.patch(purchase.listingId, {
          salesCount: listing.salesCount - 1,
        });
      }
    }

    return purchaseId;
  },
});
