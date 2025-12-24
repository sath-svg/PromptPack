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
    createdAt: v.number(),
  }).index("by_clerk_id", ["clerkId"]),

  // Marketplace packs
  packs: defineTable({
    authorId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    // The .pmtpk file content (base64 encoded, already compressed/encrypted)
    fileData: v.string(),
    promptCount: v.number(),
    version: v.string(),
    price: v.number(), // Cents, 0 = free
    isPublic: v.boolean(),
    downloads: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_author", ["authorId"])
    .index("by_public", ["isPublic"])
    .index("by_category", ["category", "isPublic"]),

  // User purchased packs (what shows in their "Purchased" section)
  userPacks: defineTable({
    userId: v.id("users"),
    packId: v.id("packs"),
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
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_source", ["userId", "source"]),
});
