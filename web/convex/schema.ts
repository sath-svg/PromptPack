import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users synced from Clerk
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    plan: v.union(v.literal("free"), v.literal("pro"), v.literal("studio")),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    createdAt: v.number(),
    // Grace period for downgraded users (timestamp when packs will be deleted)
    packDeletionAt: v.optional(v.number()),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_stripe_customer_id", ["stripeCustomerId"]),

  // User-created packs (metadata only - files stored in R2)
  userPacks: defineTable({
    authorId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    // R2 object key where the .pmtpk file is stored (e.g., "users/user123/userpacks/pack456.pmtpk")
    r2Key: v.string(),
    promptCount: v.number(),
    fileSize: v.number(), // Size in bytes for display
    version: v.string(),
    price: v.number(), // Cents, 0 = free
    isPublic: v.boolean(),
    isEncrypted: v.optional(v.boolean()), // Whether the pack has a password
    downloads: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_author", ["authorId"])
    .index("by_public", ["isPublic"])
    .index("by_category", ["category", "isPublic"]),

  // Purchased marketplace packs (what shows in their "Purchased" section)
  purchasedPacks: defineTable({
    userId: v.id("users"),
    packId: v.id("userPacks"),
    // Optional listing reference (null for legacy/non-marketplace purchases)
    listingId: v.optional(v.id("marketplaceListings")),
    // Payment details (only for marketplace purchases)
    amountPaid: v.optional(v.number()), // Cents
    platformFee: v.optional(v.number()), // 15% in cents
    creatorEarnings: v.optional(v.number()), // 85% in cents
    stripePaymentIntentId: v.optional(v.string()),
    // Purchase status
    status: v.optional(
      v.union(
        v.literal("completed"),
        v.literal("refunded"),
        v.literal("free") // For free packs
      )
    ),
    refundableUntil: v.optional(v.number()), // 7 days after purchase
    refundedAt: v.optional(v.number()),
    purchasedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_pack", ["packId"])
    .index("by_user_pack", ["userId", "packId"])
    .index("by_listing", ["listingId"])
    .index("by_status", ["status"]),

  // User's saved prompts from extension (metadata only, file stored in R2)
  savedPacks: defineTable({
    userId: v.id("users"),
    source: v.union(v.literal("chatgpt"), v.literal("claude"), v.literal("gemini")),
    // R2 object key where the encrypted .pmtpk file is stored
    r2Key: v.string(),
    promptCount: v.number(),
    fileSize: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_source", ["userId", "source"]),

  // Beta tester signups
  betaSignups: defineTable({
    email: v.string(),
    signedUpAt: v.number(),
  }).index("by_email", ["email"]),

  // Marketplace listings (published packs for sale/download)
  marketplaceListings: defineTable({
    packId: v.id("userPacks"),
    authorId: v.id("users"),
    // Required fields
    title: v.string(),
    tagline: v.string(), // One-liner description
    description: v.string(), // Full description (markdown)
    tags: v.array(v.string()), // Creator-defined, max 5
    // Computed search field (title + tagline + tags joined)
    // Updated on create/update: `${title} ${tagline} ${tags.join(" ")}`
    searchText: v.string(),
    // Pricing
    pricingModel: v.union(v.literal("free"), v.literal("paid")),
    priceInCents: v.number(), // 0 for free
    // License
    license: v.union(
      v.literal("personal"),
      v.literal("commercial"),
      v.literal("team")
    ),
    // Optional marketing
    coverImageUrl: v.optional(v.string()),
    bulletPoints: v.optional(v.array(v.string())), // Up to 3
    exampleInput: v.optional(v.string()),
    exampleOutput: v.optional(v.string()),
    supportedModels: v.optional(v.array(v.string())),
    // Stats
    downloads: v.number(),
    salesCount: v.number(),
    reportCount: v.number(), // Total reports received
    // Status (auto-publish, can be suspended via reports)
    status: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("suspended")
    ),
    suspendedReason: v.optional(v.string()), // Why suspended (for creator)
    publishedAt: v.optional(v.number()),
    suspendedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_author", ["authorId"])
    .index("by_status", ["status"])
    .index("by_status_downloads", ["status", "downloads"])
    .index("by_pack", ["packId"])
    .searchIndex("search_listings", {
      searchField: "searchText",
      filterFields: ["status", "pricingModel"],
    }),

  // Reports for moderation
  reports: defineTable({
    listingId: v.id("marketplaceListings"),
    reporterId: v.id("users"),
    reason: v.union(
      v.literal("spam"),
      v.literal("inappropriate"),
      v.literal("copyright"),
      v.literal("misleading"),
      v.literal("other")
    ),
    details: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("reviewed"),
      v.literal("dismissed")
    ),
    createdAt: v.number(),
  })
    .index("by_listing", ["listingId"])
    .index("by_status", ["status"]),
});
