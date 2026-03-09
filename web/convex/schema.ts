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
    // Lifetime free evaluation trials used (max 3 for free users)
    evalTrialsUsed: v.optional(v.number()),
    // Whether the user has completed the onboarding tutorial
    onboardingCompleted: v.optional(v.boolean()),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_stripe_customer_id", ["stripeCustomerId"]),

  // User-created packs (metadata only - files stored in R2)
  userPacks: defineTable({
    authorId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    icon: v.optional(v.string()), // Emoji icon for the pack (e.g., "📦", "🚀", "💡")
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
    versionControlEnabled: v.optional(v.boolean()), // PromptControl: Pro users toggle on 1 pack, Studio all packs
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_author", ["authorId"])
    .index("by_public", ["isPublic"])
    .index("by_category", ["category", "isPublic"]),

  // PromptControl: version snapshots for user packs (up to 10 per pack)
  packVersions: defineTable({
    packId: v.id("userPacks"),
    authorId: v.id("users"),
    versionNumber: v.number(), // Sequential: 1, 2, 3... max 10
    r2Key: v.string(), // R2 key for this version's .pmtpk snapshot
    fileSize: v.number(),
    promptCount: v.number(),
    prompts: v.optional(v.array(v.object({
      text: v.string(),
      header: v.optional(v.string()),
    }))), // Stored prompt content for version preview
    message: v.optional(v.string()), // Optional version description
    createdAt: v.number(),
  })
    .index("by_pack", ["packId"])
    .index("by_pack_version", ["packId", "versionNumber"])
    .index("by_author", ["authorId"]),

  // PromptControl: per-prompt version history (up to 10 versions per prompt)
  promptVersions: defineTable({
    packId: v.id("userPacks"),
    authorId: v.id("users"),
    promptCreatedAt: v.number(), // Stable prompt identifier (the prompt's createdAt timestamp)
    versionNumber: v.number(), // Sequential: 1, 2, 3... max 10 per prompt
    text: v.string(), // The prompt text at this version
    header: v.optional(v.string()), // The prompt header at this version
    savedAt: v.number(), // When this version was saved
  })
    .index("by_pack_prompt", ["packId", "promptCreatedAt"])
    .index("by_pack", ["packId"])
    .index("by_author", ["authorId"]),

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
    source: v.union(
      v.literal("chatgpt"),
      v.literal("claude"),
      v.literal("gemini"),
      // Pro-only LLMs
      v.literal("perplexity"),
      v.literal("grok"),
      v.literal("deepseek"),
      v.literal("kimi")
    ),
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

  // Prompt evaluation scores (Pro/Studio only feature)
  promptEvaluations: defineTable({
    userId: v.string(), // Clerk ID of the user
    promptHash: v.string(), // SHA-256 hash of prompt text
    overallScore: v.number(), // 0-100 average of all LLM scores
    scores: v.object({
      chatgpt: v.number(),
      claude: v.number(),
      gemini: v.number(),
      perplexity: v.number(),
      grok: v.number(),
      deepseek: v.number(),
      kimi: v.number(),
    }),
    evaluatedAt: v.number(),
    version: v.string(), // Evaluation algorithm version (e.g., "1.0")
  })
    .index("by_user_hash", ["userId", "promptHash"])
    .index("by_hash", ["promptHash"]),

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
