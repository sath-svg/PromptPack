import { v } from "convex/values";
import {
  action,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { api, internal } from "./_generated/api";
import { findUserByAnyId } from "./users";
import type { Doc, Id } from "./_generated/dataModel";
// Listings are priced in topup credits (1 credit ≈ $0.02). Buyers pay
// with their existing topupCredits balance — no Stripe round-trip. Seller
// receives 70% of the purchase price as credits on their account.
const MARKETPLACE_SELLER_PCT_BPS = 7000;       // 70%
const MIN_PRICE = 0;                            // 0 = free
const MIN_PAID_PRICE = 50;                      // ~$1.00 (50 credits @ 2¢ each)
const MAX_PRICE = 50000;                        // ~$1000
const MAX_ACTIVE_LISTINGS: Record<"free" | "pro" | "studio", number> = {
  free: 0,
  pro: 5,
  studio: 50,
};

const kindValidator = v.union(
  v.literal("flow"),
  v.literal("folder"),
  v.literal("preset"),
);

const flowPreviewValidator = v.object({
  stepCount: v.number(),
  stepLabels: v.array(v.string()),
});
const folderPreviewValidator = v.object({
  promptHeaders: v.array(v.string()),
});
const presetPreviewValidator = v.object({
  styleSummary: v.string(),
  sampleImages: v.array(v.string()),
  palette: v.array(v.string()),
});

type SortKey = "newest" | "downloads" | "price_asc" | "price_desc";

/**
 * List listings with filter + sort. First-cut: pulls index page, then filters
 * by tag/text in-memory. Cursor is a numeric offset over the filtered set.
 */
export const listListings = query({
  args: {
    kind: v.optional(kindValidator),
    tag: v.optional(v.string()),
    query: v.optional(v.string()),
    sort: v.optional(
      v.union(
        v.literal("newest"),
        v.literal("downloads"),
        v.literal("price_asc"),
        v.literal("price_desc"),
      ),
    ),
    cursor: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 24, 1), 60);
    const sort: SortKey = args.sort ?? "newest";
    const cursor = args.cursor ?? 0;

    let rows: Doc<"marketplaceListings">[];
    if (args.kind) {
      rows = await ctx.db
        .query("marketplaceListings")
        .withIndex("by_kind_public", (q) =>
          q.eq("kind", args.kind!).eq("isPublic", true),
        )
        .collect();
    } else {
      rows = await ctx.db
        .query("marketplaceListings")
        .withIndex("by_public_recent", (q) => q.eq("isPublic", true))
        .collect();
    }

    const needle = (args.query ?? "").trim().toLowerCase();
    if (needle) {
      rows = rows.filter(
        (r) =>
          r.title.toLowerCase().includes(needle) ||
          r.description.toLowerCase().includes(needle) ||
          r.tags.some((t) => t.toLowerCase().includes(needle)),
      );
    }
    if (args.tag) {
      const tagNeedle = args.tag.toLowerCase();
      rows = rows.filter((r) =>
        r.tags.some((t) => t.toLowerCase() === tagNeedle),
      );
    }

    rows.sort((a, b) => {
      switch (sort) {
        case "downloads":
          return b.downloads - a.downloads;
        case "price_asc":
          return a.price - b.price;
        case "price_desc":
          return b.price - a.price;
        case "newest":
        default:
          return b.createdAt - a.createdAt;
      }
    });

    const page = rows.slice(cursor, cursor + limit);
    const nextCursor = cursor + page.length < rows.length ? cursor + page.length : null;
    return {
      listings: page.map(serializeListing),
      nextCursor,
      total: rows.length,
    };
  },
});

export const getListing = query({
  args: {
    listingId: v.id("marketplaceListings"),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, { listingId, userId }) => {
    const listing = await ctx.db.get(listingId);
    if (!listing) return null;
    let purchased = false;
    let isOwner = false;
    if (userId) {
      const user = await findUserByAnyId(ctx.db, userId);
      if (user) {
        isOwner = user._id === listing.sellerId;
        if (!isOwner) {
          const purchase = await ctx.db
            .query("marketplacePurchases")
            .withIndex("by_buyer_listing", (q) =>
              q.eq("buyerId", user._id).eq("listingId", listingId),
            )
            .first();
          purchased = !!purchase;
        }
      }
    }
    return { ...serializeListing(listing), purchased, isOwner };
  },
});

export const listBySeller = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const user = await findUserByAnyId(ctx.db, userId);
    if (!user) return [];
    const rows = await ctx.db
      .query("marketplaceListings")
      .withIndex("by_seller", (q) => q.eq("sellerId", user._id))
      .collect();
    // Hide official Skillset Team listings from personal "My listings" —
    // they share the admin sellerId but are not authored personally.
    return rows.filter((r) => !r.isOfficial).map(serializeListing);
  },
});

/**
 * Recent sales feed for a seller — used by the desktop "My listings" tab
 * notification centre. Returns the last N marketplacePurchases where this
 * user is the seller, joined with a minimal listing snapshot.
 */
export const listRecentSales = query({
  args: { userId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { userId, limit }) => {
    const user = await findUserByAnyId(ctx.db, userId);
    if (!user) return [];
    const take = Math.min(Math.max(limit ?? 25, 1), 100);
    const rows = await ctx.db
      .query("marketplacePurchases")
      .withIndex("by_seller", (q) => q.eq("sellerId", user._id))
      .order("desc")
      .take(take);
    const result = [] as Array<{
      purchaseId: string;
      purchasedAt: number;
      pricePaid: number;
      creditsGranted: number;
      listingId: string;
      listingTitle: string | null;
      listingIcon: string | null;
      payoutStatus: string;
    }>;
    for (const r of rows) {
      const listing = await ctx.db.get(r.listingId);
      result.push({
        purchaseId: r._id as unknown as string,
        purchasedAt: r.purchasedAt,
        pricePaid: r.pricePaid,
        creditsGranted: r.creditsGranted ?? 0,
        listingId: r.listingId as unknown as string,
        listingTitle: listing?.title ?? null,
        listingIcon: listing?.icon ?? null,
        payoutStatus: r.payoutStatus ?? "none",
      });
    }
    return result;
  },
});

export const listMyPurchases = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const user = await findUserByAnyId(ctx.db, userId);
    if (!user) return [];
    const purchases = await ctx.db
      .query("marketplacePurchases")
      .withIndex("by_buyer", (q) => q.eq("buyerId", user._id))
      .collect();
    const result = [] as Array<{
      purchaseId: string;
      purchasedAt: number;
      pricePaid: number;
      listing: ReturnType<typeof serializeListing> | null;
      sellerName: string | null;
      sellerEmail: string | null;
      sellerIsOfficial: boolean;
    }>;
    for (const p of purchases) {
      const listing = await ctx.db.get(p.listingId);
      const seller = await ctx.db.get(p.sellerId);
      const sellerIsOfficial = !!listing?.isOfficial;
      result.push({
        purchaseId: p._id as unknown as string,
        purchasedAt: p.purchasedAt,
        pricePaid: p.pricePaid,
        listing: listing ? serializeListing(listing) : null,
        sellerName: seller?.name ?? null,
        sellerEmail: seller?.email ?? null,
        sellerIsOfficial,
      });
    }
    result.sort((a, b) => b.purchasedAt - a.purchasedAt);
    return result;
  },
});

export const insertListing = internalMutation({
  args: {
    sellerId: v.id("users"),
    kind: kindValidator,
    title: v.string(),
    description: v.string(),
    icon: v.optional(v.string()),
    tags: v.array(v.string()),
    price: v.number(),
    r2Key: v.string(),
    fileSize: v.number(),
    promptCount: v.number(),
    flowPreview: v.optional(flowPreviewValidator),
    folderPreview: v.optional(folderPreviewValidator),
    presetPreview: v.optional(presetPreviewValidator),
    isOfficial: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("marketplaceListings", {
      sellerId: args.sellerId,
      kind: args.kind,
      title: args.title,
      description: args.description,
      icon: args.icon,
      tags: args.tags,
      price: args.price,
      currency: "usd",
      r2Key: args.r2Key,
      fileSize: args.fileSize,
      promptCount: args.promptCount,
      flowPreview: args.flowPreview,
      folderPreview: args.folderPreview,
      presetPreview: args.presetPreview,
      isPublic: true,
      isOfficial: args.isOfficial ?? false,
      downloads: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const unlistListing = mutation({
  args: {
    userId: v.string(),
    listingId: v.id("marketplaceListings"),
  },
  handler: async (ctx, { userId, listingId }) => {
    const user = await findUserByAnyId(ctx.db, userId);
    if (!user) throw new Error("User not found");
    const listing = await ctx.db.get(listingId);
    if (!listing) throw new Error("Listing not found");
    if (listing.sellerId !== user._id) throw new Error("Not owner");
    await ctx.db.patch(listingId, { isPublic: false, updatedAt: Date.now() });
    return { success: true };
  },
});

export const relistListing = mutation({
  args: {
    userId: v.string(),
    listingId: v.id("marketplaceListings"),
  },
  handler: async (ctx, { userId, listingId }) => {
    const user = await findUserByAnyId(ctx.db, userId);
    if (!user) throw new Error("User not found");
    const listing = await ctx.db.get(listingId);
    if (!listing) throw new Error("Listing not found");
    if (listing.sellerId !== user._id) throw new Error("Not owner");
    await ctx.db.patch(listingId, { isPublic: true, updatedAt: Date.now() });
    return { success: true };
  },
});

/**
 * Hard-delete a listing — removes R2 file via the storage worker and
 * drops the Convex row. Owner-only. Past purchases remain intact (they
 * keep their snapshot of pricePaid + creditsGranted) but the listing
 * itself is gone.
 */
export const deleteListing = action({
  args: {
    userId: v.string(),
    listingId: v.id("marketplaceListings"),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, { userId, listingId }): Promise<{ success: boolean }> => {
    const user = (await ctx.runQuery(api.users.getByUserId, {
      userId,
    })) as Doc<"users"> | null;
    if (!user) throw new Error("User not found");
    const listing = (await ctx.runQuery(api.marketplace.getListing, {
      listingId,
      userId,
    })) as { sellerId: string; r2Key: string; isOwner: boolean } | null;
    if (!listing) throw new Error("Listing not found");
    if (!listing.isOwner) throw new Error("Not owner");

    // Best-effort R2 delete; continue even if it fails so the row goes.
    try {
      await fetch(`${R2_API_URL()}/storage/remove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ r2Key: listing.r2Key }),
      });
    } catch (err) {
      console.warn("[marketplace.deleteListing] R2 remove failed:", err);
    }

    await ctx.runMutation(internal.marketplace.removeListingRow, { listingId });
    return { success: true };
  },
});

export const removeListingRow = internalMutation({
  args: { listingId: v.id("marketplaceListings") },
  handler: async (ctx, { listingId }) => {
    await ctx.db.delete(listingId);
  },
});

export const updateListing = mutation({
  args: {
    userId: v.string(),
    listingId: v.id("marketplaceListings"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, { userId, listingId, ...rest }) => {
    const user = await findUserByAnyId(ctx.db, userId);
    if (!user) throw new Error("User not found");
    const listing = await ctx.db.get(listingId);
    if (!listing) throw new Error("Listing not found");
    if (listing.sellerId !== user._id) throw new Error("Not owner");
    const filtered = Object.fromEntries(
      Object.entries(rest).filter(([, val]) => val !== undefined),
    );
    if (typeof filtered.price === "number") {
      if (filtered.price < MIN_PRICE || filtered.price > MAX_PRICE) {
        throw new Error("Price out of range");
      }
    }
    await ctx.db.patch(listingId, { ...filtered, updatedAt: Date.now() });
    return { success: true };
  },
});

/**
 * Free claim — for $0 listings (e.g. Skillset Team official packs). Records
 * a marketplacePurchase row immediately, no Stripe round-trip. Idempotent.
 */
export const claimFreeListing = mutation({
  args: {
    userId: v.string(),
    listingId: v.id("marketplaceListings"),
  },
  handler: async (ctx, { userId, listingId }) => {
    const user = await findUserByAnyId(ctx.db, userId);
    if (!user) throw new Error("User not found");
    const listing = await ctx.db.get(listingId);
    if (!listing) throw new Error("Listing not found");
    if (!listing.isPublic) throw new Error("Listing is unlisted");
    if (listing.price !== 0) throw new Error("Listing is not free");
    if (listing.sellerId === user._id) throw new Error("Cannot claim your own listing");

    const synthSessionId = `free_${user._id}_${listingId}`;
    const existing = await ctx.db
      .query("marketplacePurchases")
      .withIndex("by_stripe_session", (q) =>
        q.eq("stripeSessionId", synthSessionId),
      )
      .first();
    if (existing) return { success: true, alreadyClaimed: true };

    await ctx.db.insert("marketplacePurchases", {
      buyerId: user._id,
      listingId,
      sellerId: listing.sellerId,
      pricePaid: 0,
      stripeSessionId: synthSessionId,
      purchasedAt: Date.now(),
    });
    await ctx.db.patch(listingId, {
      downloads: listing.downloads + 1,
      updatedAt: Date.now(),
    });
    return { success: true, alreadyClaimed: false };
  },
});

/**
 * Credit-based purchase. Atomically:
 *   - Verifies buyer has enough topupCredits
 *   - Debits buyer
 *   - Inserts marketplacePurchases row
 *   - If not free / not official, credits seller 70% of price
 *   - Increments listing.downloads
 *
 * Idempotent against re-clicks: if a purchase row already exists for
 * (buyer, listing), returns success without double-charging.
 */
export const purchaseWithCredits = mutation({
  args: {
    userId: v.string(),
    listingId: v.id("marketplaceListings"),
  },
  returns: v.object({
    success: v.boolean(),
    alreadyPurchased: v.boolean(),
  }),
  handler: async (ctx, { userId, listingId }) => {
    const buyer = await findUserByAnyId(ctx.db, userId);
    if (!buyer) throw new Error("User not found");
    const listing = await ctx.db.get(listingId);
    if (!listing) throw new Error("Listing not found");
    if (!listing.isPublic) throw new Error("Listing is unlisted");
    if (listing.sellerId === buyer._id) throw new Error("Cannot buy your own listing");

    // Idempotency — return early if already purchased.
    const existing = await ctx.db
      .query("marketplacePurchases")
      .withIndex("by_buyer_listing", (q) =>
        q.eq("buyerId", buyer._id).eq("listingId", listingId),
      )
      .first();
    if (existing) return { success: true, alreadyPurchased: true };

    const price = listing.price;
    const buyerTopup = buyer.topupCredits ?? 0;
    if (price > 0 && buyerTopup < price) {
      throw new Error(
        `Insufficient credits — need ${price}, have ${buyerTopup}. Top up from Settings.`,
      );
    }

    const now = Date.now();
    const isOfficial = !!listing.isOfficial;
    let sellerCutCents = 0;
    let creditsGranted = 0;
    let payoutStatus: "none" | "credited" | "failed" = "none";

    // Debit buyer.
    if (price > 0) {
      const buyerAfter = buyerTopup - price;
      await ctx.db.patch(buyer._id, { topupCredits: buyerAfter });
      await ctx.db.insert("creditTransactions", {
        userId: buyer._id,
        kind: "debit_llm", // closest existing kind for spend
        monthlyDelta: 0,
        topupDelta: -price,
        monthlyBalanceAfter: buyer.monthlyCredits ?? 0,
        topupBalanceAfter: buyerAfter,
        reason: `marketplace purchase listing=${listingId}`,
        createdAt: now,
      });
    }

    // Credit seller (skip for free or official Skillset Team listings).
    if (!isOfficial && price > 0) {
      const seller = await ctx.db.get(listing.sellerId);
      const cut = Math.floor((price * 7000) / 10000); // 70%
      if (seller && cut > 0) {
        const newTopup = (seller.topupCredits ?? 0) + cut;
        await ctx.db.patch(listing.sellerId, { topupCredits: newTopup });
        await ctx.db.insert("creditTransactions", {
          userId: listing.sellerId,
          kind: "grant_admin",
          monthlyDelta: 0,
          topupDelta: cut,
          monthlyBalanceAfter: seller.monthlyCredits ?? 0,
          topupBalanceAfter: newTopup,
          reason: `marketplace sale listing=${listingId} buyer=${buyer._id}`,
          createdAt: now,
        });
        sellerCutCents = cut;
        creditsGranted = cut;
        payoutStatus = "credited";
      } else {
        payoutStatus = "failed";
      }
    }

    await ctx.db.insert("marketplacePurchases", {
      buyerId: buyer._id,
      listingId,
      sellerId: listing.sellerId,
      pricePaid: price,
      sellerCutCents,
      creditsGranted,
      stripeSessionId: `credits_${buyer._id}_${listingId}_${now}`,
      purchasedAt: now,
      payoutStatus,
    });

    await ctx.db.patch(listingId, {
      downloads: listing.downloads + 1,
      updatedAt: now,
    });

    return { success: true, alreadyPurchased: false };
  },
});

// ====================================================================
// Actions — checkout + listing creation (uploads R2)
// ====================================================================

const R2_API_URL = () => process.env.R2_API_URL ?? "https://api.skillset.so";

/**
 * List the seller's userPacks via internalQuery — used by the
 * createListingFromUserPack action below. (Internal so action can call it.)
 */
export const getUserPackById = internalQuery({
  args: { packId: v.id("userPacks") },
  handler: async (ctx, { packId }) => {
    return await ctx.db.get(packId);
  },
});

/**
 * Server-side create — copies an existing userPack into the marketplace
 * without forcing the user to re-upload from disk. Used by the desktop
 * "New listing" wizard which now lists Your Skillsets.
 *
 * Flow: fetch original .pmtpk from R2 → insert listing row → upload bytes
 * to `marketplace/{listingId}.skill` key. The .pmtpk binary is a valid
 * .skill payload (the shared decoder handles both magic bytes).
 */
export const createListingFromUserPack = action({
  args: {
    userId: v.string(),
    packId: v.id("userPacks"),
    kind: kindValidator,
    title: v.string(),
    description: v.string(),
    icon: v.optional(v.string()),
    tags: v.array(v.string()),
    price: v.number(),
    flowPreview: v.optional(flowPreviewValidator),
    folderPreview: v.optional(folderPreviewValidator),
    presetPreview: v.optional(presetPreviewValidator),
    /** Preset listings can attach up to 5 preview photos. Each entry is
     *  a base64-encoded image (jpg/png/webp). Uploaded to R2 under
     *  `marketplace/{listingId}/preview/{i}.jpg`. URLs are written into
     *  `presetPreview.sampleImages`. Ignored for non-preset kinds. */
    presetImages: v.optional(
      v.array(
        v.object({
          base64: v.string(),
          ext: v.union(
            v.literal("jpg"),
            v.literal("jpeg"),
            v.literal("png"),
            v.literal("webp"),
          ),
        }),
      ),
    ),
    /** SHA-256 hex hashes of each prompt's text (lowercased) from the
     *  source userPack. Used to look up cached `promptEvaluations` so we
     *  can render an average score next to the listing price. */
    promptHashes: v.optional(v.array(v.string())),
  },
  returns: v.object({ listingId: v.string() }),
  handler: async (ctx, args): Promise<{ listingId: string }> => {
    const user = (await ctx.runQuery(api.users.getByUserId, {
      userId: args.userId,
    })) as Doc<"users"> | null;
    if (!user) throw new Error("User not found");
    if (user.plan === "free") throw new Error("Pro+ required to list");
    // Credits-based payout — no Stripe Connect required. Earnings auto-grant
    // as topup credits to the seller's account on each successful purchase.
    if (args.price < MIN_PRICE || args.price > MAX_PRICE) {
      throw new Error("Price out of range");
    }
    if (args.price > 0 && args.price < MIN_PAID_PRICE) {
      throw new Error("Paid listings must be at least 50 credits");
    }
    if (!args.title.trim() || !args.description.trim()) {
      throw new Error("Title and description required");
    }

    const pack = (await ctx.runQuery(internal.marketplace.getUserPackById, {
      packId: args.packId,
    })) as Doc<"userPacks"> | null;
    if (!pack) throw new Error("Pack not found");
    if (pack.authorId !== user._id) throw new Error("Not owner of pack");
    if (pack.isEncrypted) {
      throw new Error(
        "Encrypted packs cannot be listed. Remove the password first.",
      );
    }

    const existing = (await ctx.runQuery(
      internal.marketplace.countActiveListingsBySeller,
      { sellerId: user._id as Id<"users"> },
    )) as number;
    const cap = MAX_ACTIVE_LISTINGS[user.plan as "pro" | "studio"] ?? 0;
    if (existing >= cap) {
      throw new Error(
        `Listing cap reached (${existing}/${cap}). Unlist or upgrade.`,
      );
    }

    // Fetch source bytes from R2 once.
    const fetchResp = await fetch(`${R2_API_URL()}/storage/fetch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ r2Key: pack.r2Key }),
    });
    if (!fetchResp.ok) {
      throw new Error(`Failed to fetch source pack from R2: ${fetchResp.status}`);
    }
    const { fileData } = (await fetchResp.json()) as { fileData: string };
    if (!fileData) throw new Error("Source pack R2 fetch returned empty body");
    const fileSize = Math.ceil((fileData.length * 3) / 4);

    const placeholderKey = `marketplace/pending-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.skill`;
    const listingId = (await ctx.runMutation(
      internal.marketplace.insertListing,
      {
        sellerId: user._id as Id<"users">,
        kind: args.kind,
        title: args.title.trim(),
        description: args.description.trim(),
        icon: args.icon ?? pack.icon,
        tags: args.tags,
        price: args.price,
        r2Key: placeholderKey,
        fileSize,
        promptCount: pack.promptCount,
        flowPreview: args.flowPreview,
        folderPreview: args.folderPreview,
        presetPreview: args.presetPreview,
        isOfficial: false,
      },
    )) as Id<"marketplaceListings">;

    const r2Key = `marketplace/${listingId}.skill`;
    const uploadResp = await fetch(`${R2_API_URL()}/storage/pack-upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        r2Key,
        fileData,
        metadata: {
          title: args.title,
          kind: args.kind,
          sourcePackId: args.packId as unknown as string,
        },
      }),
    });
    if (!uploadResp.ok) {
      const text = await uploadResp.text().catch(() => "");
      throw new Error(`R2 upload failed: ${uploadResp.status} ${text}`);
    }
    await ctx.runMutation(api.marketplace.patchListingKey, {
      listingId,
      r2Key,
    });

    // Average evaluation score — query promptEvaluations by hash, average
    // recommended-tier scores. No-op if no hashes / no scores cached.
    if (args.promptHashes && args.promptHashes.length > 0) {
      const stats = (await ctx.runQuery(
        internal.marketplace.averageScoreForHashes,
        { promptHashes: args.promptHashes },
      )) as { avg: number; count: number };
      if (stats.count > 0) {
        await ctx.runMutation(api.marketplace.patchEvalScore, {
          listingId,
          avgEvalScore: stats.avg,
          evalScoreCount: stats.count,
        });
      }
    }

    // Preset preview photos — upload each to R2 + patch sampleImages URLs.
    // Served back via the Worker's whitelisted `/storage/public/marketplace/*`
    // route so the R2 bucket itself stays private. Only the marketplace
    // preview prefix is exposed, nothing else.
    if (args.kind === "preset" && args.presetImages && args.presetImages.length > 0) {
      const ASSET_BASE = `${R2_API_URL()}/storage/public`;
      const sampleUrls: string[] = [];
      const slice = args.presetImages.slice(0, 5);
      for (let i = 0; i < slice.length; i++) {
        const img = slice[i];
        const previewKey = `marketplace/${listingId}/preview/${i}.${img.ext}`;
        const upResp = await fetch(`${R2_API_URL()}/storage/pack-upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            r2Key: previewKey,
            fileData: img.base64,
            metadata: { listingId: listingId as unknown as string, index: String(i) },
          }),
        });
        if (!upResp.ok) {
          const t = await upResp.text().catch(() => "");
          console.warn(`[marketplace] preview upload ${i} failed:`, upResp.status, t);
          continue;
        }
        sampleUrls.push(`${ASSET_BASE}/${previewKey}`);
      }
      if (sampleUrls.length > 0) {
        const mergedPreset = {
          styleSummary: args.presetPreview?.styleSummary ?? "",
          palette: args.presetPreview?.palette ?? [],
          sampleImages: sampleUrls,
        };
        await ctx.runMutation(api.marketplace.patchPresetPreview, {
          listingId,
          presetPreview: mergedPreset,
        });
      }
    }

    return { listingId: listingId as unknown as string };
  },
});

export const patchPresetPreview = mutation({
  args: {
    listingId: v.id("marketplaceListings"),
    presetPreview: presetPreviewValidator,
  },
  handler: async (ctx, { listingId, presetPreview }) => {
    await ctx.db.patch(listingId, { presetPreview, updatedAt: Date.now() });
  },
});

export const patchListingKey = mutation({
  args: {
    listingId: v.id("marketplaceListings"),
    r2Key: v.string(),
  },
  handler: async (ctx, { listingId, r2Key }) => {
    await ctx.db.patch(listingId, { r2Key, updatedAt: Date.now() });
  },
});

export const patchEvalScore = mutation({
  args: {
    listingId: v.id("marketplaceListings"),
    avgEvalScore: v.number(),
    evalScoreCount: v.number(),
  },
  handler: async (ctx, { listingId, avgEvalScore, evalScoreCount }) => {
    await ctx.db.patch(listingId, {
      avgEvalScore,
      evalScoreCount,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Look up promptEvaluations by hash, average the recommended-tier scores.
 * Uses `by_hash` index. Each hash can have multiple rows (one per evaluator
 * userId) — we pick the highest-scoring row per hash to avoid double-counting.
 */
export const averageScoreForHashes = internalQuery({
  args: { promptHashes: v.array(v.string()) },
  returns: v.object({ avg: v.number(), count: v.number() }),
  handler: async (ctx, { promptHashes }) => {
    let sum = 0;
    let count = 0;
    for (const hash of promptHashes) {
      const rows = await ctx.db
        .query("promptEvaluations")
        .withIndex("by_hash", (q) => q.eq("promptHash", hash))
        .collect();
      if (rows.length === 0) continue;
      // Score = recommendedTier's score for each row, take the max.
      let best = 0;
      for (const r of rows) {
        const tier = r.tiers[r.recommendedTier];
        if (tier && typeof tier.score === "number" && tier.score > best) {
          best = tier.score;
        }
      }
      if (best > 0) {
        sum += best;
        count++;
      }
    }
    return {
      avg: count > 0 ? Math.round((sum / count) * 10) / 10 : 0,
      count,
    };
  },
});

/**
 * Admin/seed entry — upserts an official Skillset Team listing keyed by
 * source slug. Idempotent: re-running replaces metadata, keeps purchases.
 * Caller must pre-resolve `sellerId` to an existing user (typically the
 * platform admin's Convex _id).
 */
export const seedOfficialListing = action({
  args: {
    sellerId: v.id("users"),
    slug: v.string(),                  // becomes r2Key suffix
    kind: kindValidator,
    title: v.string(),
    description: v.string(),
    icon: v.optional(v.string()),
    tags: v.array(v.string()),
    fileData: v.string(),
    promptCount: v.number(),
    flowPreview: v.optional(flowPreviewValidator),
    folderPreview: v.optional(folderPreviewValidator),
    presetPreview: v.optional(presetPreviewValidator),
  },
  returns: v.object({ listingId: v.string(), created: v.boolean() }),
  handler: async (
    ctx,
    args,
  ): Promise<{ listingId: string; created: boolean }> => {
    const r2Key = `marketplace/official/${args.slug}.skill`;
    const fileSize = Math.ceil((args.fileData.length * 3) / 4);

    // Upload (or overwrite) to R2.
    const r2Resp = await fetch(`${R2_API_URL()}/storage/pack-upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        r2Key,
        fileData: args.fileData,
        metadata: {
          title: args.title,
          kind: args.kind,
          official: "true",
          slug: args.slug,
        },
      }),
    });
    if (!r2Resp.ok) {
      const text = await r2Resp.text().catch(() => "");
      throw new Error(`R2 upload failed: ${r2Resp.status} ${text}`);
    }

    const existing = (await ctx.runQuery(
      internal.marketplace.getOfficialBySlug,
      { r2Key },
    )) as { _id: Id<"marketplaceListings"> } | null;

    if (existing) {
      await ctx.runMutation(internal.marketplace.patchSeededListing, {
        listingId: existing._id,
        kind: args.kind,
        title: args.title,
        description: args.description,
        icon: args.icon,
        tags: args.tags,
        price: 0,
        fileSize,
        promptCount: args.promptCount,
        flowPreview: args.flowPreview,
        folderPreview: args.folderPreview,
        presetPreview: args.presetPreview,
      });
      return { listingId: existing._id as unknown as string, created: false };
    }

    const listingId = (await ctx.runMutation(
      internal.marketplace.insertListing,
      {
        sellerId: args.sellerId,
        kind: args.kind,
        title: args.title,
        description: args.description,
        icon: args.icon,
        tags: args.tags,
        price: 0,
        r2Key,
        fileSize,
        promptCount: args.promptCount,
        flowPreview: args.flowPreview,
        folderPreview: args.folderPreview,
        presetPreview: args.presetPreview,
        isOfficial: true,
      },
    )) as Id<"marketplaceListings">;
    return { listingId: listingId as unknown as string, created: true };
  },
});

export const getOfficialBySlug = internalQuery({
  args: { r2Key: v.string() },
  handler: async (ctx, { r2Key }) => {
    const rows = await ctx.db
      .query("marketplaceListings")
      .withIndex("by_public_recent", (q) => q.eq("isPublic", true))
      .collect();
    return rows.find((r) => r.r2Key === r2Key && r.isOfficial) ?? null;
  },
});

export const patchSeededListing = internalMutation({
  args: {
    listingId: v.id("marketplaceListings"),
    kind: kindValidator,
    title: v.string(),
    description: v.string(),
    icon: v.optional(v.string()),
    tags: v.array(v.string()),
    price: v.number(),
    fileSize: v.number(),
    promptCount: v.number(),
    flowPreview: v.optional(flowPreviewValidator),
    folderPreview: v.optional(folderPreviewValidator),
    presetPreview: v.optional(presetPreviewValidator),
  },
  handler: async (ctx, { listingId, ...rest }) => {
    await ctx.db.patch(listingId, { ...rest, updatedAt: Date.now() });
  },
});

/**
 * Resolve admin seller — used by seed route. Looks up by email exactly
 * (defaults to env ADMIN_EMAIL or `dksathvik@gmail.com`).
 */
/**
 * Resolve admin seller — used by seed route. Looks up by email exactly.
 * Public query (no auth) — only returns _id, no PII.
 */
export const getAdminSellerId = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), email))
      .first();
    return user ? (user._id as unknown as string) : null;
  },
});

export const countActiveListingsBySeller = internalQuery({
  args: { sellerId: v.id("users") },
  handler: async (ctx, { sellerId }): Promise<number> => {
    const rows = await ctx.db
      .query("marketplaceListings")
      .withIndex("by_seller", (q) => q.eq("sellerId", sellerId))
      .collect();
    // Official Skillset Team listings don't count toward the seller's cap.
    return rows.filter((r) => r.isPublic && !r.isOfficial).length;
  },
});

// ====================================================================
// Helpers
// ====================================================================

function serializeListing(row: Doc<"marketplaceListings">) {
  return {
    id: row._id as unknown as string,
    sellerId: row.sellerId as unknown as string,
    kind: row.kind,
    title: row.title,
    description: row.description,
    icon: row.icon,
    tags: row.tags,
    price: row.price,
    currency: row.currency,
    r2Key: row.r2Key,
    fileSize: row.fileSize,
    promptCount: row.promptCount,
    flowPreview: row.flowPreview,
    folderPreview: row.folderPreview,
    presetPreview: row.presetPreview,
    isPublic: row.isPublic,
    isOfficial: !!row.isOfficial,
    avgEvalScore: row.avgEvalScore,
    evalScoreCount: row.evalScoreCount,
    downloads: row.downloads,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
