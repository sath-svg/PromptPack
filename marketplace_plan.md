# PromptPack Marketplace Implementation Plan

## Key Decisions (Confirmed)

| Decision | Choice |
|----------|--------|
| Studio pricing | $19/month subscription |
| Moderation | Auto-publish + user reports |
| Minimum price | Free or paid (no minimum) |
| Categories | Creator-defined tags |
| Platform fee | 15% |
| Refund policy | 7-day window |
| Payouts | Monthly after $10 balance |
| Rollout | Phase 1 (core features first) |

---

## Current State Summary

### Existing Infrastructure (Ready to Use)
- **Database**: Convex with `userPacks`, `purchasedPacks`, `users` tables
- **Storage**: Cloudflare R2 for .pmtpk files
- **Auth**: Clerk integration complete
- **Payments**: Stripe subscription flow exists (Pro plan $9/mo)
- **Pack format**: .pmtpk with AES-256-GCM encryption support

### What Already Exists
- `userPacks` table has `price`, `isPublic`, `downloads` fields
- `purchasedPacks` table tracks ownership
- `packs.listPublic()` query ready
- Pack create/update API routes exist
- Marketplace page exists (placeholder "Coming Soon")

---

## Tier Structure

| Feature | Free | Pro ($9/mo) | Studio ($19/mo) |
|---------|------|-------------|-----------------|
| Import/open packs | ✓ | ✓ | ✓ |
| Save prompts locally | ✓ (10) | ✓ (40) | ✓ (100) |
| Cloud sync | - | ✓ | ✓ |
| Create custom packs | - | ✓ (2) | ✓ (unlimited) |
| Private sharing (link) | - | ✓ | ✓ |
| **Marketplace publish** | - | - | ✓ |
| Set pricing (free or paid) | - | - | ✓ |
| Sales analytics | - | - | ✓ |

---

## Phase 1 Scope (Core Marketplace)

This phase delivers a working marketplace where Studio users can publish and sell packs.

**Included:**
- Browse & search marketplace
- Publish listings (Studio tier)
- Purchase packs (Stripe checkout)
- Download purchased packs
- Basic creator earnings tracking

**Deferred to Phase 2:**
- Reviews & ratings
- Creator analytics dashboard
- Stripe Connect + automated payouts (Phase 1: manual payouts tracked in DB)
- Version history & changelogs
- Admin moderation dashboard (Phase 1: manual via DB queries)

---

## Step 1: Database Schema

### File: `web/convex/schema.ts`

**Modify users table** - add Studio plan:
```typescript
plan: v.union(v.literal("free"), v.literal("pro"), v.literal("studio")),
// NOTE: stripeConnectAccountId deferred to Phase 2
// Phase 1: Manual payouts tracked in DB only
```

**New table: marketplaceListings**
```typescript
marketplaceListings: defineTable({
  packId: v.id("userPacks"),
  authorId: v.id("users"),

  // Required fields
  title: v.string(),
  tagline: v.string(),              // One-liner description
  description: v.string(),          // Full description (markdown)
  tags: v.array(v.string()),        // Creator-defined, max 5

  // Computed search field (title + tagline + tags joined)
  // Updated on create/update: `${title} ${tagline} ${tags.join(" ")}`
  searchText: v.string(),

  // Pricing
  pricingModel: v.union(v.literal("free"), v.literal("paid")),
  priceInCents: v.number(),         // 0 for free

  // License
  license: v.union(v.literal("personal"), v.literal("commercial"), v.literal("team")),

  // Optional marketing
  coverImageUrl: v.optional(v.string()),
  bulletPoints: v.optional(v.array(v.string())),  // Up to 3
  exampleInput: v.optional(v.string()),
  exampleOutput: v.optional(v.string()),
  supportedModels: v.optional(v.array(v.string())),

  // Stats
  downloads: v.number(),
  salesCount: v.number(),
  reportCount: v.number(),          // Total reports received

  // Status (auto-publish, can be suspended via reports)
  status: v.union(v.literal("draft"), v.literal("published"), v.literal("suspended")),
  suspendedReason: v.optional(v.string()),  // Why suspended (for creator)
  publishedAt: v.optional(v.number()),
  suspendedAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_author", ["authorId"])
.index("by_status", ["status"])
.index("by_status_downloads", ["status", "downloads"])  // For trending sort
.searchIndex("search_listings", {
  searchField: "searchText",        // Searches title, tagline, AND tags
  filterFields: ["status", "pricingModel"]
})
```

**Modify existing purchasedPacks table** - add payment fields:
```typescript
purchasedPacks: defineTable({
  userId: v.id("users"),
  packId: v.id("userPacks"),

  // NEW: Optional listing reference (null for legacy/non-marketplace purchases)
  listingId: v.optional(v.id("marketplaceListings")),

  // NEW: Payment details (only for marketplace purchases)
  amountPaid: v.optional(v.number()),           // Cents
  platformFee: v.optional(v.number()),          // 15% in cents
  creatorEarnings: v.optional(v.number()),      // 85% in cents
  stripePaymentIntentId: v.optional(v.string()),

  // NEW: Purchase status
  status: v.optional(v.union(
    v.literal("completed"),
    v.literal("refunded"),
    v.literal("free")  // For free packs
  )),
  refundableUntil: v.optional(v.number()),      // 7 days after purchase
  refundedAt: v.optional(v.number()),

  purchasedAt: v.number(),
})
.index("by_user", ["userId"])
.index("by_pack", ["packId"])
.index("by_user_pack", ["userId", "packId"])
// NEW indexes:
.index("by_listing", ["listingId"])
.index("by_status", ["status"])
```

**Why this approach:**
- Avoids reconciling two separate tables
- Backward compatible (existing purchases work, new fields optional)
- Single source of truth for "user owns this pack"
- Free packs and paid packs in same table
- Legacy saved packs (without listingId) continue to work

**New table: reports** (for moderation)
```typescript
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
  status: v.union(v.literal("pending"), v.literal("reviewed"), v.literal("dismissed")),
  createdAt: v.number(),
})
.index("by_listing", ["listingId"])
.index("by_status", ["status"])
```

**Auto-suspend guardrails:**
- **1 copyright report** = instant auto-suspend (highest severity)
- **3+ reports total** = auto-suspend (spam protection)
- **Suspended listings** = only admins can unsuspend (prevents bad actors from republishing)
- Track report count on `marketplaceListings` table for efficient querying

---

## Step 2: Convex Functions

### File: `web/convex/listings.ts` (new)

```typescript
// Queries
- list({ status?, tag?, search?, limit?, cursor? })  // Browse marketplace
- get(id)                                             // Single listing
- getByAuthor(authorId)                              // Creator's listings
- getTrending({ limit? })                            // By downloads/sales

// Mutations
- create({ packId, title, tagline, ... })            // Create draft
- update(id, { ...fields })                          // Update listing
- publish(id)                                        // Set status = published
- unpublish(id)                                      // Back to draft (only if not suspended)
- unsuspend(id)                                      // Admin only - clears suspension
```

### File: `web/convex/purchasedPacks.ts` (modify existing)

Add new functions to existing file:

```typescript
// NEW Queries
- listMarketplacePurchases(userId)                   // User's marketplace purchases
- hasPurchasedListing(userId, listingId)             // Check listing ownership
- getCreatorEarnings(creatorId)                      // Total pending earnings for payouts

// NEW Mutations
- recordMarketplacePurchase({
    userId,
    packId,
    listingId,
    amountPaid,
    platformFee,
    creatorEarnings,
    stripePaymentIntentId
  })
- markRefunded(purchaseId)
```

### File: `web/convex/reports.ts` (new)

```typescript
// Mutations
- create({ listingId, reason, details? })
  // Auto-suspend logic:
  // - If reason === "copyright" → suspend immediately
  // - Otherwise: increment reportCount, suspend if >= 3

- review(reportId, action: "dismiss")                // Admin only
  // Note: suspension lifted via listings.unsuspend()
```

---

## Step 3: API Routes

### File: `web/src/app/api/marketplace/route.ts`
- GET: List published listings with filters

### File: `web/src/app/api/marketplace/[id]/route.ts`
- GET: Get listing details + author info

### File: `web/src/app/api/listings/route.ts`
- POST: Create listing (Studio only)
- GET: Get current user's listings

### File: `web/src/app/api/listings/[id]/route.ts`
- PUT: Update listing
- DELETE: Delete listing (if no sales)

### File: `web/src/app/api/listings/[id]/publish/route.ts`
- POST: Publish listing (auto-approve, unless suspended)

### File: `web/src/app/api/purchases/checkout/route.ts`
- POST: Create Stripe checkout session for pack purchase

### File: `web/src/app/api/purchases/route.ts`
- GET: User's purchase history

### File: `web/src/app/api/reports/route.ts`
- POST: Report a listing

### File: `web/src/app/api/stripe/checkout/route.ts` (modify)
- Add Studio tier price ID support

---

## Step 4: Stripe Setup

### New Price IDs needed:
- `STRIPE_STUDIO_MONTHLY_PRICE_ID` - $19/month

### Purchase Flow:
1. User clicks "Buy" → `/api/purchases/checkout`
2. Create Stripe Checkout Session with **metadata**:
   ```typescript
   {
     mode: "payment",
     metadata: {
       type: "pack_purchase",  // Differentiate from subscriptions
       listingId: string,
       packId: string,
       buyerUserId: string,    // Clerk user ID
       authorId: string,       // Pack creator ID
       priceInCents: string,   // Amount (for verification)
     }
   }
   ```
3. User completes payment on Stripe
4. Stripe sends `checkout.session.completed` webhook with metadata
5. Webhook handler creates `purchasedPacks` record (idempotent)
6. User redirected to `/marketplace/[id]?purchased=true`

### Webhook Updates (`web/convex/http.ts`):

**Handle `checkout.session.completed`:**
```typescript
// Check metadata.type to differentiate:
// - "subscription" (existing) → update user plan
// - "pack_purchase" (new) → record marketplace purchase

if (metadata.type === "pack_purchase") {
  // Extract metadata
  const { listingId, packId, buyerUserId, authorId, priceInCents } = metadata;

  // CRITICAL: Check for existing purchase (idempotency)
  // Unique constraint: buyerId + listingId
  const existing = await ctx.db
    .query("purchasedPacks")
    .withIndex("by_user_pack", q =>
      q.eq("userId", buyerUserId).eq("packId", packId)
    )
    .filter(q => q.eq(q.field("listingId"), listingId))
    .first();

  if (existing) {
    // Already recorded, skip (webhook replay)
    return;
  }

  // Calculate fees
  const amountPaid = parseInt(priceInCents);
  const platformFee = Math.floor(amountPaid * 0.15);  // 15%
  const creatorEarnings = amountPaid - platformFee;

  // Record purchase
  await ctx.db.insert("purchasedPacks", {
    userId: buyerUserId,
    packId,
    listingId,
    amountPaid,
    platformFee,
    creatorEarnings,
    stripePaymentIntentId: session.payment_intent,
    status: "completed",
    refundableUntil: Date.now() + 7 * 24 * 60 * 60 * 1000,  // 7 days
    purchasedAt: Date.now(),
  });

  // Increment listing sales count
  await ctx.db.patch(listingId, {
    salesCount: listing.salesCount + 1,
    downloads: listing.downloads + 1,
  });
}
```

**Uniqueness constraint enforcement:**
- Query by `(userId, packId, listingId)` before inserting
- If exists, skip insert (idempotent webhook handling)
- One user can only purchase a listing once

---

## Step 5: UI Pages

### Marketplace Browse: `web/src/app/marketplace/page.tsx` (modify)
- Grid of published listings
- Search bar + tag filters
- Sort: Trending / Newest / Price

### Listing Detail: `web/src/app/marketplace/[id]/page.tsx` (new)
- Title, tagline, description
- Price + Buy button (or "Download" if free/purchased)
- Author info
- Example input/output preview
- Supported models badges
- Report button

### Creator Listings: `web/src/app/dashboard/listings/page.tsx` (new)
- Table of creator's listings
- Status badges (draft/published)
- Edit/Publish/Unpublish actions
- Sales count per listing

### Create Listing: `web/src/app/dashboard/listings/new/page.tsx` (new)
- Step 1: Select pack to list
- Step 2: Fill metadata (title, tagline, tags, description)
- Step 3: Set price + license
- Step 4: Optional marketing (bullets, examples, models)
- Step 5: Preview & publish

### Edit Listing: `web/src/app/dashboard/listings/[id]/edit/page.tsx` (new)
- Same form as create, pre-filled

### Pricing Page: `web/src/app/pricing/page.tsx` (modify)
- Add Studio tier card ($19/mo)
- Feature comparison table

---

## Step 6: Secure Pack Downloads

**CRITICAL:** Don't expose raw R2 URLs - even encrypted packs need access control to prevent hotlinking.

### File: `web/src/app/api/packs/[packId]/download/route.ts` (new)

**POST `/api/packs/[packId]/download`**

```typescript
// 1. Verify user authentication (Clerk)
// 2. Get listing for this pack
// 3. Check access:
//    - If listing is free → allow
//    - If listing is paid → check purchasedPacks table
// 4. If authorized:
//    - Generate signed R2 URL (1-hour expiry)
//    - OR stream file directly from R2
// 5. Return signed URL or file stream

// Benefits:
// - No hotlinking of paid packs
// - Access control enforced server-side
// - Works with encrypted packs (defense in depth)
```

### Extension Updates

### File: `popup/shared/config.ts`
- No changes needed (marketplace accessed via web)

### File: `popup/shared/api.ts`
- Add `getMarketplacePacks()` - fetch published listings
- Add `getPurchasedPacks()` - fetch user's purchases
- Add `downloadPack(packId)` - calls `/api/packs/[packId]/download` endpoint

---

## Files to Modify/Create

| Action | File Path |
|--------|-----------|
| Modify | `web/convex/schema.ts` |
| Modify | `web/convex/users.ts` |
| Modify | `web/convex/purchasedPacks.ts` |
| Modify | `web/convex/http.ts` |
| Create | `web/convex/listings.ts` |
| Create | `web/convex/reports.ts` |
| Create | `web/src/app/api/marketplace/route.ts` |
| Create | `web/src/app/api/marketplace/[id]/route.ts` |
| Create | `web/src/app/api/listings/route.ts` |
| Create | `web/src/app/api/listings/[id]/route.ts` |
| Create | `web/src/app/api/listings/[id]/publish/route.ts` |
| Create | `web/src/app/api/purchases/checkout/route.ts` |
| Create | `web/src/app/api/purchases/route.ts` |
| Create | `web/src/app/api/reports/route.ts` |
| Create | `web/src/app/api/packs/[packId]/download/route.ts` |
| Modify | `web/src/app/api/stripe/checkout/route.ts` |
| Modify | `web/src/app/marketplace/page.tsx` |
| Create | `web/src/app/marketplace/[id]/page.tsx` |
| Create | `web/src/app/dashboard/listings/page.tsx` |
| Create | `web/src/app/dashboard/listings/new/page.tsx` |
| Create | `web/src/app/dashboard/listings/[id]/edit/page.tsx` |
| Modify | `web/src/app/pricing/page.tsx` |
| Modify | `web/src/lib/constants.ts` |
| Modify | `popup/shared/api.ts` |

---

## Environment Variables Needed

```env
# Add to .env
STRIPE_STUDIO_MONTHLY_PRICE_ID=price_xxx
```

---

## Implementation Order

1. **Schema** - Add new tables to Convex
2. **Convex functions** - listings.ts, purchases.ts, reports.ts
3. **Studio tier** - Update pricing page + Stripe checkout
4. **Listing CRUD** - Create/edit/publish flow for creators
5. **Marketplace UI** - Browse page with search/filters
6. **Listing detail page** - View + purchase flow
7. **Purchase flow** - Stripe checkout for packs
8. **Extension API** - Fetch marketplace + download purchased
9. **Reports** - Basic report submission
