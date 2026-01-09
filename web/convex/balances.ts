import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================================================
// QUERIES
// ============================================================================

// Get user's current balance
export const getBalance = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const balance = await ctx.db
      .query("userBalances")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!balance) {
      // Return default balance if not exists
      return {
        balanceInCents: 0,
        totalEarnedInCents: 0,
        totalSpentInCents: 0,
      };
    }

    return balance;
  },
});

// Get user's transaction history
export const getTransactions = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 50 }) => {
    const transactions = await ctx.db
      .query("balanceTransactions")
      .withIndex("by_user_created", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);

    return transactions;
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

// Initialize or get user balance
async function ensureBalance(ctx: any, userId: any) {
  const existing = await ctx.db
    .query("userBalances")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .first();

  if (existing) {
    return existing;
  }

  // Create new balance
  const id = await ctx.db.insert("userBalances", {
    userId,
    balanceInCents: 0,
    totalEarnedInCents: 0,
    totalSpentInCents: 0,
    updatedAt: Date.now(),
  });

  return await ctx.db.get(id);
}

// Top up user balance (for testing/admin)
export const topup = mutation({
  args: {
    userId: v.id("users"),
    amountInCents: v.number(),
  },
  handler: async (ctx, { userId, amountInCents }) => {
    if (amountInCents <= 0) {
      throw new Error("Top up amount must be positive");
    }

    const balance = await ensureBalance(ctx, userId);
    const newBalance = balance.balanceInCents + amountInCents;

    // Update balance
    await ctx.db.patch(balance._id, {
      balanceInCents: newBalance,
      updatedAt: Date.now(),
    });

    // Record transaction
    await ctx.db.insert("balanceTransactions", {
      userId,
      type: "topup",
      amountInCents,
      balanceAfter: newBalance,
      description: `Balance top up: $${(amountInCents / 100).toFixed(2)}`,
      createdAt: Date.now(),
    });

    return newBalance;
  },
});

// Record a sale (creator earned money)
export const recordSale = mutation({
  args: {
    creatorId: v.id("users"),
    amountInCents: v.number(),
    listingId: v.id("marketplaceListings"),
    purchaseId: v.id("purchasedPacks"),
  },
  handler: async (ctx, { creatorId, amountInCents, listingId, purchaseId }) => {
    const balance = await ensureBalance(ctx, creatorId);
    const newBalance = balance.balanceInCents + amountInCents;

    // Update balance
    await ctx.db.patch(balance._id, {
      balanceInCents: newBalance,
      totalEarnedInCents: balance.totalEarnedInCents + amountInCents,
      updatedAt: Date.now(),
    });

    // Record transaction
    await ctx.db.insert("balanceTransactions", {
      userId: creatorId,
      type: "sale",
      amountInCents,
      balanceAfter: newBalance,
      description: `Sale: $${(amountInCents / 100).toFixed(2)}`,
      relatedListingId: listingId,
      relatedPurchaseId: purchaseId,
      createdAt: Date.now(),
    });

    return newBalance;
  },
});

// Record a purchase (buyer spent money)
export const recordPurchase = mutation({
  args: {
    buyerId: v.id("users"),
    amountInCents: v.number(),
    listingId: v.id("marketplaceListings"),
    purchaseId: v.id("purchasedPacks"),
  },
  handler: async (ctx, { buyerId, amountInCents, listingId, purchaseId }) => {
    const balance = await ensureBalance(ctx, buyerId);

    // Check if user has enough balance
    if (balance.balanceInCents < amountInCents) {
      throw new Error("Insufficient balance");
    }

    const newBalance = balance.balanceInCents - amountInCents;

    // Update balance
    await ctx.db.patch(balance._id, {
      balanceInCents: newBalance,
      totalSpentInCents: balance.totalSpentInCents + amountInCents,
      updatedAt: Date.now(),
    });

    // Record transaction
    await ctx.db.insert("balanceTransactions", {
      userId: buyerId,
      type: "purchase",
      amountInCents: -amountInCents, // Negative for debit
      balanceAfter: newBalance,
      description: `Purchase: $${(amountInCents / 100).toFixed(2)}`,
      relatedListingId: listingId,
      relatedPurchaseId: purchaseId,
      createdAt: Date.now(),
    });

    return newBalance;
  },
});

// Process a refund
export const processRefund = mutation({
  args: {
    purchaseId: v.id("purchasedPacks"),
  },
  handler: async (ctx, { purchaseId }) => {
    const purchase = await ctx.db.get(purchaseId);
    if (!purchase) {
      throw new Error("Purchase not found");
    }

    if (purchase.status === "refunded") {
      throw new Error("Already refunded");
    }

    if (purchase.status === "free") {
      throw new Error("Cannot refund a free pack");
    }

    if (!purchase.amountPaid || !purchase.creatorEarnings || !purchase.listingId) {
      throw new Error("Invalid purchase data");
    }

    // Check refund window
    if (purchase.refundableUntil && Date.now() > purchase.refundableUntil) {
      throw new Error("Refund window has expired (7 days)");
    }

    // Get pack to find creator
    const pack = await ctx.db.get(purchase.packId);
    if (!pack) {
      throw new Error("Pack not found");
    }

    const creatorId = pack.authorId;

    // Refund buyer
    const buyerBalance = await ensureBalance(ctx, purchase.userId);
    const newBuyerBalance = buyerBalance.balanceInCents + purchase.amountPaid;

    await ctx.db.patch(buyerBalance._id, {
      balanceInCents: newBuyerBalance,
      totalSpentInCents: Math.max(0, buyerBalance.totalSpentInCents - purchase.amountPaid),
      updatedAt: Date.now(),
    });

    // Deduct from creator
    const creatorBalance = await ensureBalance(ctx, creatorId);
    const newCreatorBalance = creatorBalance.balanceInCents - purchase.creatorEarnings;

    await ctx.db.patch(creatorBalance._id, {
      balanceInCents: newCreatorBalance,
      totalEarnedInCents: Math.max(0, creatorBalance.totalEarnedInCents - purchase.creatorEarnings),
      updatedAt: Date.now(),
    });

    // Record transactions
    await ctx.db.insert("balanceTransactions", {
      userId: purchase.userId,
      type: "refund",
      amountInCents: purchase.amountPaid,
      balanceAfter: newBuyerBalance,
      description: `Refund: $${(purchase.amountPaid / 100).toFixed(2)}`,
      relatedListingId: purchase.listingId,
      relatedPurchaseId: purchaseId,
      createdAt: Date.now(),
    });

    await ctx.db.insert("balanceTransactions", {
      userId: creatorId,
      type: "refund",
      amountInCents: -purchase.creatorEarnings,
      balanceAfter: newCreatorBalance,
      description: `Refund deduction: $${(purchase.creatorEarnings / 100).toFixed(2)}`,
      relatedListingId: purchase.listingId,
      relatedPurchaseId: purchaseId,
      createdAt: Date.now(),
    });

    // Mark purchase as refunded
    await ctx.db.patch(purchaseId, {
      status: "refunded",
      refundedAt: Date.now(),
    });

    // Decrement sales count on listing
    const listing = await ctx.db.get(purchase.listingId);
    if (listing && listing.salesCount > 0) {
      await ctx.db.patch(purchase.listingId, {
        salesCount: listing.salesCount - 1,
      });
    }

    return { buyerBalance: newBuyerBalance, creatorBalance: newCreatorBalance };
  },
});
