import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users synced from Clerk
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    plan: v.union(v.literal("free"), v.literal("pro")),
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
    headers: v.optional(v.record(v.string(), v.string())),
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
    purchasedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_pack", ["packId"])
    .index("by_user_pack", ["userId", "packId"]),

  // User's saved prompts from extension (metadata only, file stored in R2)
  savedPacks: defineTable({
    userId: v.id("users"),
    source: v.union(v.literal("chatgpt"), v.literal("claude"), v.literal("gemini")),
    // R2 object key where the encrypted .pmtpk file is stored
    r2Key: v.string(),
    promptCount: v.number(),
    fileSize: v.number(),
    headers: v.optional(v.record(v.string(), v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_source", ["userId", "source"]),

  // Refresh tokens for extension authentication
  refreshTokens: defineTable({
    clerkId: v.string(),                    // User's Clerk ID
    token: v.string(),                      // UUID refresh token
    createdAt: v.number(),                  // When token was created
    expiresAt: v.number(),                  // When token expires (7 days from creation)
    lastUsedAt: v.number(),                 // Last time token was used for refresh
    lastUsedIp: v.optional(v.string()),     // IP address of last refresh
    lastUsedUserAgent: v.optional(v.string()), // User agent of last refresh
    rotationCount: v.number(),              // How many times this token chain has been rotated
    isRevoked: v.boolean(),                 // Whether token has been revoked
  })
    .index("by_token", ["token"])
    .index("by_clerk_id", ["clerkId"])
    .index("by_clerk_id_active", ["clerkId", "isRevoked"]),
});
