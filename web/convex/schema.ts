import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users synced from Clerk (or BetterAuth post-migration)
  users: defineTable({
    clerkId: v.string(),
    betterAuthId: v.optional(v.string()), // User's BetterAuth ID after migration
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    plan: v.union(v.literal("free"), v.literal("pro"), v.literal("studio")),
    // Plan variant — distinguishes legacy $9 Pro subscribers from new $15 Pro.
    // Undefined = full-price tier (default for all non-legacy users).
    // "legacy_pro" = grandfathered $9 Pro: reduced credit allowance, eligible
    // for one-time upgrade flow to the new $15 Pro variant.
    planVariant: v.optional(v.union(v.literal("pro"), v.literal("legacy_pro"))),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    createdAt: v.number(),
    migratedAt: v.optional(v.number()), // Timestamp when user migrated from Clerk to BetterAuth
    // Grace period for downgraded users (timestamp when packs will be deleted)
    packDeletionAt: v.optional(v.number()),
    // Lifetime free evaluation trials used (max 3 for free users)
    evalTrialsUsed: v.optional(v.number()),
    // Whether the user has completed the onboarding tutorial
    onboardingCompleted: v.optional(v.boolean()),
    emailVerified: v.optional(v.boolean()),
    freeCreditsGrantedAt: v.optional(v.number()),
    monthlyCredits: v.optional(v.number()),
    topupCredits: v.optional(v.number()),
    monthlyCreditsResetAt: v.optional(v.number()),
    lastStripeInvoiceId: v.optional(v.string()),
    managedModeEnabled: v.optional(v.boolean()),
    // Per-day burn cap for free users on signup-grant pool.
    // Bucket = "YYYY-MM-DD" UTC. Resets when bucket flips.
    dailyBurnBucket: v.optional(v.string()),
    dailyBurnCredits: v.optional(v.number()),
    // Settlement-shortfall counter — flags repeat over-burn accounts.
    shortfallCount: v.optional(v.number()),
    lastShortfallAt: v.optional(v.number()),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_better_auth_id", ["betterAuthId"])
    .index("by_stripe_customer_id", ["stripeCustomerId"]),

  // Credit ledger: every grant, debit, hold, release, and expiration
  creditTransactions: defineTable({
    userId: v.id("users"),
    kind: v.union(
      v.literal("grant_signup"),       // Free 50 on email verification
      v.literal("grant_monthly"),      // Monthly subscription refresh
      v.literal("grant_topup"),        // One-time top-up purchase
      v.literal("debit_llm"),          // Settled LLM usage
      v.literal("hold_llm"),           // Reserved (not yet settled)
      v.literal("release_hold"),       // Hold refunded (call failed/expired)
      v.literal("refund"),             // Manual admin refund
      v.literal("expire_monthly"),     // Rollover cap enforcement (excess credits dropped)
      v.literal("grant_admin")         // Manual grant via internal addCredits mutation
    ),
    monthlyDelta: v.number(),
    topupDelta: v.number(),
    monthlyBalanceAfter: v.number(),
    topupBalanceAfter: v.number(),
    reason: v.optional(v.string()),
    modelId: v.optional(v.string()),
    inputTokens: v.optional(v.number()),
    outputTokens: v.optional(v.number()),
    openRouterCostUsd: v.optional(v.number()),
    stripeEventId: v.optional(v.string()),
    holdId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId", "createdAt"])
    .index("by_stripe_event", ["stripeEventId"])
    .index("by_hold_id", ["holdId"]),

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

  // User-created skillsets (metadata only - files stored in R2)
  userSkillsets: defineTable({
    authorId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()), // Emoji icon (e.g., "🎨", "🖌️")
    // Reference images for the skillset
    referenceImages: v.optional(v.array(v.object({
      id: v.string(),
      url: v.string(), // R2 path or base64 data URL
      uploadedAt: v.number(),
    }))),
    // Extracted style characteristics (from Claude Vision analysis v2 — research-backed framework)
    // Replaces flat fields with rich structured data: line work, palette w/ hex codes,
    // shading technique, texture, composition, signature elements (the keys to mimicry).
    styleCharacteristics: v.optional(v.object({
      lineWork: v.object({
        thickness: v.string(),       // "1-2pt clean uniform"
        edges: v.string(),
        consistency: v.string(),
      }),
      colorPalette: v.object({
        hexCodes: v.array(v.string()), // ["#FFB6C1", "#E6E6FA", ...]
        count: v.number(),
        temperature: v.string(),
        dominant: v.string(),
        accents: v.array(v.string()),
      }),
      shading: v.object({
        technique: v.string(),
        lightDirection: v.string(),
        intensity: v.string(),
      }),
      texture: v.object({
        medium: v.string(),
        scale: v.string(),
        density: v.string(),
      }),
      composition: v.object({
        framing: v.string(),
        perspective: v.string(),
      }),
      signatureElements: v.array(v.string()), // unique recurring quirks
      fullStyleDescription: v.string(),
      extractedAt: v.number(),
    })),
    // Skillset = SET of style-locked prompts for different gen surfaces.
    // Each has {subject} placeholder + own negative prompt.
    // Default 5 from Claude analysis (image/video/character/setting/mood)
    // + any custom prompts artist adds.
    prompts: v.optional(v.array(v.object({
      id: v.string(),         // "image" | "video" | "character" | "setting" | "mood" | custom-{n}
      label: v.string(),
      purpose: v.string(),
      icon: v.string(),       // emoji
      template: v.string(),   // "{subject}, drawn in chibi style with..."
      negativePrompt: v.string(),
    }))),
    // Preview generations (3 images per batch)
    previewGenerations: v.optional(v.array(v.object({
      id: v.string(),
      imageUrls: v.array(v.string()), // 3 base64 URLs
      generatedAt: v.number(),
      prompt: v.optional(v.string()),
      satisfied: v.boolean(),
    }))),
    // Artist verified ownership
    isVerified: v.boolean(),
    // R2 object key where the final .skill file is stored
    r2Key: v.optional(v.string()),
    // Public marketplace settings
    price: v.number(), // Cents, 0 = free
    isPublic: v.boolean(),
    downloads: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_author", ["authorId"])
    .index("by_public", ["isPublic"]),

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

  // Prompt evaluation scores (Pro/Studio only feature) — v2 tier-based shape.
  // Deploy note: before `npx convex deploy`, run `evaluations:wipeAll` (or
  // truncate via dashboard) so the schema validator does not reject v1
  // rows from the previous 7-brand format.
  promptEvaluations: defineTable({
    userId: v.string(), // Auth provider ID of the user
    promptHash: v.string(), // SHA-256 hash of prompt text
    schemaVersion: v.literal(2),
    tiers: v.object({
      cheap: v.object({
        tier: v.literal("cheap"),
        score: v.number(),
        selectedModelId: v.string(),
        selectedModelLabel: v.string(),
      }),
      mid: v.object({
        tier: v.literal("mid"),
        score: v.number(),
        selectedModelId: v.string(),
        selectedModelLabel: v.string(),
      }),
      frontier: v.object({
        tier: v.literal("frontier"),
        score: v.number(),
        selectedModelId: v.string(),
        selectedModelLabel: v.string(),
      }),
    }),
    recommendedTier: v.union(v.literal("cheap"), v.literal("mid"), v.literal("frontier")),
    recommendedModelId: v.string(),
    recommendedModelLabel: v.string(),
    recommendedEffort: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.null(),
    ),
    bestTierModels: v.array(
      v.object({
        modelId: v.string(),
        label: v.string(),
        score: v.number(),
      }),
    ),
    byok: v.optional(
      v.array(
        v.object({
          provider: v.union(
            v.literal("anthropic"),
            v.literal("openai"),
            v.literal("gemini"),
            v.literal("grok"),
            v.literal("deepseek"),
            v.literal("perplexity"),
            v.literal("kimi"),
          ),
          modelId: v.string(),
          modelLabel: v.string(),
          tier: v.union(v.literal("cheap"), v.literal("mid"), v.literal("frontier")),
          score: v.number(),
        }),
      ),
    ),
    rationale: v.optional(v.string()),
    evaluatedAt: v.number(),
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
