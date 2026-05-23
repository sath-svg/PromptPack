/**
 * Auto top-up — fires an off-session Stripe PaymentIntent when a user's
 * topupCredits balance drops below a configured threshold.
 *
 * Flow:
 *   1. settleCredits (in credits.ts) schedules `maybeFire` after each debit.
 *   2. maybeFire checks: enabled + threshold breach + cooldown + cap +
 *      no charge already in flight. On all-pass it calls `chargeAutoTopup`.
 *   3. chargeAutoTopup creates a PaymentIntent off_session=true with the
 *      saved paymentMethodId and metadata.type="auto_topup".
 *   4. Stripe webhook (payment_intent.succeeded) grants credits via the
 *      existing `grantTopup` mutation (idempotent on stripeEventId).
 *   5. payment_intent.payment_failed bumps the consecutiveFailures counter
 *      and disables the feature after 3 failures.
 *
 * Safety nets:
 *   - Default off; field is optional. Existing users unaffected.
 *   - Cooldown (5 min) prevents thrash on rapid debits.
 *   - Monthly USD cap; cycle rolls every 30 days.
 *   - pendingChargeId lock + idempotency_key on PaymentIntent → no double-fire.
 *   - 3 failures = auto-disable; user must re-enable from /account.
 *
 * Card collection happens via Stripe Checkout `mode: "setup"` (see stripe.ts).
 * No card data ever touches our servers; we only store the `pm_xxx` id.
 */

import { v } from "convex/values";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { findUserByAnyId } from "./users";
import { TOPUP_PACKS } from "./credits";
import Stripe from "stripe";

const PACK_KEYS = ["small", "medium", "large", "xl"] as const;
type PackKey = (typeof PACK_KEYS)[number];

const COOLDOWN_MS = 5 * 60 * 1000;            // 5 min between charges
const MONTHLY_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const FAILURE_DISABLE_THRESHOLD = 3;          // disable after 3 consecutive fails
const DEFAULT_MONTHLY_CAP_USD = 50;           // conservative default

// Allowed threshold presets (mirrors the dropdown in the UI).
const THRESHOLD_PRESETS = [50, 100, 200, 500] as const;
type ThresholdPreset = (typeof THRESHOLD_PRESETS)[number];

const packValidator = v.union(
  v.literal("small"),
  v.literal("medium"),
  v.literal("large"),
  v.literal("xl"),
);

function isValidPack(key: string): key is PackKey {
  return (PACK_KEYS as readonly string[]).includes(key);
}

function isValidThreshold(n: number): n is ThresholdPreset {
  return (THRESHOLD_PRESETS as readonly number[]).includes(n);
}

/* ────────────────────────────────────────────────────────────────────────── *
 * Public queries — read config
 * ────────────────────────────────────────────────────────────────────────── */

export const getConfig = query({
  args: { userId: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      enabled: v.boolean(),
      thresholdCredits: v.number(),
      packKey: packValidator,
      cardBrand: v.optional(v.string()),
      cardLast4: v.optional(v.string()),
      monthlyCapUsd: v.optional(v.number()),
      monthlySpentUsd: v.optional(v.number()),
      lastChargeAt: v.optional(v.number()),
      lastFailureAt: v.optional(v.number()),
      lastFailureReason: v.optional(v.string()),
      consecutiveFailures: v.optional(v.number()),
      hasPaymentMethod: v.boolean(),
    }),
  ),
  handler: async (ctx, { userId }) => {
    const user = await findUserByAnyId(ctx.db, userId);
    if (!user || !user.autoTopup) return null;
    const cfg = user.autoTopup;
    return {
      enabled: cfg.enabled,
      thresholdCredits: cfg.thresholdCredits,
      packKey: cfg.packKey,
      cardBrand: cfg.cardBrand,
      cardLast4: cfg.cardLast4,
      monthlyCapUsd: cfg.monthlyCapUsd,
      monthlySpentUsd: cfg.monthlySpentUsd,
      lastChargeAt: cfg.lastChargeAt,
      lastFailureAt: cfg.lastFailureAt,
      lastFailureReason: cfg.lastFailureReason,
      consecutiveFailures: cfg.consecutiveFailures,
      hasPaymentMethod: Boolean(cfg.paymentMethodId),
    };
  },
});

/* ────────────────────────────────────────────────────────────────────────── *
 * Public mutations — toggle / update config
 * ────────────────────────────────────────────────────────────────────────── */

export const setConfig = mutation({
  args: {
    userId: v.string(),
    enabled: v.boolean(),
    thresholdCredits: v.number(),
    packKey: packValidator,
    monthlyCapUsd: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!isValidThreshold(args.thresholdCredits)) {
      throw new Error("INVALID_THRESHOLD");
    }
    if (!isValidPack(args.packKey)) {
      throw new Error("INVALID_PACK");
    }
    if (args.monthlyCapUsd !== undefined) {
      if (!Number.isFinite(args.monthlyCapUsd) || args.monthlyCapUsd < 0) {
        throw new Error("INVALID_CAP");
      }
      if (args.monthlyCapUsd > 500) throw new Error("CAP_TOO_HIGH"); // hard ceiling
    }

    const user = await findUserByAnyId(ctx.db, args.userId);
    if (!user) throw new Error("USER_NOT_FOUND");
    if (!user.autoTopup?.paymentMethodId) {
      throw new Error("NO_PAYMENT_METHOD");
    }

    const next: NonNullable<typeof user.autoTopup> = {
      ...user.autoTopup,
      enabled: args.enabled,
      thresholdCredits: args.thresholdCredits,
      packKey: args.packKey,
      monthlyCapUsd: args.monthlyCapUsd ?? user.autoTopup.monthlyCapUsd ?? DEFAULT_MONTHLY_CAP_USD,
      // Re-enabling clears the failure counter — fresh start
      consecutiveFailures: args.enabled ? 0 : user.autoTopup.consecutiveFailures,
      lastFailureReason: args.enabled ? undefined : user.autoTopup.lastFailureReason,
    };
    await ctx.db.patch(user._id, { autoTopup: next });
    return null;
  },
});

/**
 * Disconnect saved card and disable auto-topup. Does NOT detach the
 * PaymentMethod from Stripe — that happens via the Customer Portal so users
 * keep a single source of truth for billing. We only clear our pointer.
 */
export const disconnect = mutation({
  args: { userId: v.string() },
  returns: v.null(),
  handler: async (ctx, { userId }) => {
    const user = await findUserByAnyId(ctx.db, userId);
    if (!user) throw new Error("USER_NOT_FOUND");
    await ctx.db.patch(user._id, { autoTopup: undefined });
    return null;
  },
});

/* ────────────────────────────────────────────────────────────────────────── *
 * Internal mutations — webhook + scheduled writes
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * Persist a newly-saved PaymentMethod after Stripe Checkout (mode=setup)
 * completes. Webhook calls this from `setup_intent.succeeded`. Idempotent:
 * re-saving the same pm_id just refreshes the brand/last4 metadata.
 *
 * If the user has no autoTopup config yet, seeds defaults (disabled + small
 * pack + 100cr threshold + $50 cap). Saving the card alone does not start
 * charging — the user must explicitly toggle `enabled=true` via setConfig.
 */
export const savePaymentMethod = internalMutation({
  args: {
    userId: v.string(),
    paymentMethodId: v.string(),
    cardBrand: v.optional(v.string()),
    cardLast4: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await findUserByAnyId(ctx.db, args.userId);
    if (!user) return null;

    const existing = user.autoTopup;
    const next: NonNullable<typeof user.autoTopup> = existing
      ? {
          ...existing,
          paymentMethodId: args.paymentMethodId,
          cardBrand: args.cardBrand,
          cardLast4: args.cardLast4,
        }
      : {
          enabled: false,                    // user must opt in
          thresholdCredits: 100,
          packKey: "small",
          paymentMethodId: args.paymentMethodId,
          cardBrand: args.cardBrand,
          cardLast4: args.cardLast4,
          monthlyCapUsd: DEFAULT_MONTHLY_CAP_USD,
          monthlySpentUsd: 0,
          monthlySpendBucketStart: Date.now(),
          consecutiveFailures: 0,
        };
    await ctx.db.patch(user._id, { autoTopup: next });
    return null;
  },
});

/**
 * Set the pendingChargeId lock to prevent concurrent fires. Returns false
 * if a lock is already held (within the cooldown window) so the caller
 * aborts without creating a duplicate PaymentIntent.
 */
export const acquireLock = internalMutation({
  args: {
    userId: v.id("users"),
    chargeId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, { userId, chargeId }) => {
    const user = await ctx.db.get(userId);
    if (!user || !user.autoTopup) return false;
    const now = Date.now();
    const lockedAt = user.autoTopup.pendingChargeAt ?? 0;
    // Existing lock within cooldown → bail. Beyond cooldown = stale, take over.
    if (user.autoTopup.pendingChargeId && now - lockedAt < COOLDOWN_MS) {
      return false;
    }
    await ctx.db.patch(userId, {
      autoTopup: {
        ...user.autoTopup,
        pendingChargeId: chargeId,
        pendingChargeAt: now,
      },
    });
    return true;
  },
});

export const releaseLock = internalMutation({
  args: { userId: v.id("users"), chargeId: v.string() },
  returns: v.null(),
  handler: async (ctx, { userId, chargeId }) => {
    const user = await ctx.db.get(userId);
    if (!user || !user.autoTopup) return null;
    if (user.autoTopup.pendingChargeId !== chargeId) return null; // already released
    await ctx.db.patch(userId, {
      autoTopup: {
        ...user.autoTopup,
        pendingChargeId: undefined,
        pendingChargeAt: undefined,
      },
    });
    return null;
  },
});

/**
 * Record a successful auto-topup charge. Called from the webhook AFTER
 * `grantTopup` runs (so credits are already in the user's balance).
 *
 * Updates: lastChargeAt, monthlySpentUsd, releases lock, resets failures.
 */
export const recordSuccess = internalMutation({
  args: {
    userId: v.string(),
    chargeId: v.string(),
    amountUsd: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await findUserByAnyId(ctx.db, args.userId);
    if (!user || !user.autoTopup) return null;
    const now = Date.now();
    const bucketStart = user.autoTopup.monthlySpendBucketStart ?? now;
    const bucketExpired = now - bucketStart > MONTHLY_WINDOW_MS;
    const spent = bucketExpired
      ? args.amountUsd
      : (user.autoTopup.monthlySpentUsd ?? 0) + args.amountUsd;

    await ctx.db.patch(user._id, {
      autoTopup: {
        ...user.autoTopup,
        lastChargeAt: now,
        monthlySpentUsd: spent,
        monthlySpendBucketStart: bucketExpired ? now : bucketStart,
        consecutiveFailures: 0,
        lastFailureReason: undefined,
        pendingChargeId: undefined,
        pendingChargeAt: undefined,
      },
    });
    return null;
  },
});

/**
 * Record a failed auto-topup charge. After FAILURE_DISABLE_THRESHOLD
 * consecutive failures, disables the feature (user must re-enable).
 */
export const recordFailure = internalMutation({
  args: {
    userId: v.string(),
    chargeId: v.optional(v.string()),
    reason: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await findUserByAnyId(ctx.db, args.userId);
    if (!user || !user.autoTopup) return null;
    const now = Date.now();
    const failures = (user.autoTopup.consecutiveFailures ?? 0) + 1;
    const shouldDisable = failures >= FAILURE_DISABLE_THRESHOLD;

    await ctx.db.patch(user._id, {
      autoTopup: {
        ...user.autoTopup,
        enabled: shouldDisable ? false : user.autoTopup.enabled,
        lastFailureAt: now,
        lastFailureReason: args.reason,
        consecutiveFailures: failures,
        pendingChargeId: undefined,
        pendingChargeAt: undefined,
      },
    });

    if (shouldDisable) {
      console.warn(
        `[auto-topup] disabled user=${args.userId} after ${failures} failures (${args.reason})`,
      );
    }
    return null;
  },
});

/* ────────────────────────────────────────────────────────────────────────── *
 * Internal query — load eligibility snapshot for the trigger action
 * ────────────────────────────────────────────────────────────────────────── */

const eligibilityShape = v.object({
  userDocId: v.id("users"),
  resolvedUserId: v.string(),  // betterAuthId ?? clerkId — for Stripe metadata
  stripeCustomerId: v.string(),
  paymentMethodId: v.string(),
  packKey: packValidator,
  thresholdCredits: v.number(),
  currentTopup: v.number(),
  monthlyCapUsd: v.number(),
  monthlySpentUsd: v.number(),
  monthlySpendBucketStart: v.number(),
  lastChargeAt: v.number(),
  pendingChargeId: v.optional(v.string()),
  pendingChargeAt: v.optional(v.number()),
});

export const loadEligibility = internalQuery({
  args: { userId: v.string() },
  returns: v.union(v.null(), eligibilityShape),
  handler: async (ctx, { userId }) => {
    const user = await findUserByAnyId(ctx.db, userId);
    if (!user) return null;
    const cfg = user.autoTopup;
    if (!cfg || !cfg.enabled) return null;
    if (!cfg.paymentMethodId) return null;
    if (!user.stripeCustomerId) return null;

    return {
      userDocId: user._id,
      resolvedUserId: user.betterAuthId ?? user.clerkId,
      stripeCustomerId: user.stripeCustomerId,
      paymentMethodId: cfg.paymentMethodId,
      packKey: cfg.packKey,
      thresholdCredits: cfg.thresholdCredits,
      currentTopup: user.topupCredits ?? 0,
      monthlyCapUsd: cfg.monthlyCapUsd ?? DEFAULT_MONTHLY_CAP_USD,
      monthlySpentUsd: cfg.monthlySpentUsd ?? 0,
      monthlySpendBucketStart: cfg.monthlySpendBucketStart ?? 0,
      lastChargeAt: cfg.lastChargeAt ?? 0,
      pendingChargeId: cfg.pendingChargeId,
      pendingChargeAt: cfg.pendingChargeAt,
    };
  },
});

/* ────────────────────────────────────────────────────────────────────────── *
 * Trigger — scheduled by credits.settleCredits after each debit
 * ────────────────────────────────────────────────────────────────────────── */

export const maybeFire = internalAction({
  args: { userId: v.string() },
  returns: v.object({
    fired: v.boolean(),
    reason: v.optional(v.string()),
  }),
  handler: async (ctx, { userId }): Promise<{ fired: boolean; reason?: string }> => {
    const snap = await ctx.runQuery(internal.autoTopup.loadEligibility, { userId });
    if (!snap) return { fired: false, reason: "ineligible" };

    const now = Date.now();

    // 1) Threshold not breached
    if (snap.currentTopup >= snap.thresholdCredits) {
      return { fired: false, reason: "above_threshold" };
    }

    // 2) Cooldown — last charge within 5 min
    if (now - snap.lastChargeAt < COOLDOWN_MS) {
      return { fired: false, reason: "cooldown" };
    }

    // 3) Monthly cap
    const pack = TOPUP_PACKS[snap.packKey as PackKey];
    const packUsd = pack.priceCents / 100;
    const bucketExpired = now - snap.monthlySpendBucketStart > MONTHLY_WINDOW_MS;
    const spentThisCycle = bucketExpired ? 0 : snap.monthlySpentUsd;
    if (spentThisCycle + packUsd > snap.monthlyCapUsd) {
      return { fired: false, reason: "monthly_cap" };
    }

    // 4) Lock — guards against concurrent fires
    const chargeId = crypto.randomUUID();
    const locked = await ctx.runMutation(internal.autoTopup.acquireLock, {
      userId: snap.userDocId,
      chargeId,
    });
    if (!locked) return { fired: false, reason: "lock_held" };

    // 5) Fire PaymentIntent off-session. Errors from Stripe → record failure
    //    AND release the lock (recordFailure clears it).
    try {
      await ctx.runAction(internal.autoTopup.chargeAutoTopupAction, {
        userId: snap.resolvedUserId,
        userDocId: snap.userDocId,
        stripeCustomerId: snap.stripeCustomerId,
        paymentMethodId: snap.paymentMethodId,
        packKey: snap.packKey,
        chargeId,
      });
      return { fired: true };
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      await ctx.runMutation(internal.autoTopup.recordFailure, {
        userId: snap.resolvedUserId,
        chargeId,
        reason: reason.slice(0, 200),
      });
      return { fired: false, reason: "stripe_error" };
    }
  },
});

/* ────────────────────────────────────────────────────────────────────────── *
 * Stripe call — off-session PaymentIntent. Webhook completes the grant.
 * ────────────────────────────────────────────────────────────────────────── */

export const chargeAutoTopupAction = internalAction({
  args: {
    userId: v.string(),
    userDocId: v.id("users"),
    stripeCustomerId: v.string(),
    paymentMethodId: v.string(),
    packKey: packValidator,
    chargeId: v.string(),
  },
  returns: v.object({
    paymentIntentId: v.string(),
    status: v.string(),
  }),
  handler: async (_ctx, args) => {
    const pack = TOPUP_PACKS[args.packKey as PackKey];
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    // idempotency_key — Stripe will return the same PaymentIntent if the
    // request is replayed (network retry, double-fire) so we never charge
    // twice for the same auto-topup attempt.
    const pi = await stripe.paymentIntents.create(
      {
        amount: pack.priceCents,
        currency: "usd",
        customer: args.stripeCustomerId,
        payment_method: args.paymentMethodId,
        off_session: true,
        confirm: true,
        // Auto-topup is card-only; declines surface via webhook
        payment_method_types: ["card"],
        metadata: {
          userId: args.userId,
          type: "auto_topup",
          credits: String(pack.credits),
          packKey: args.packKey,
          chargeId: args.chargeId,
        },
        description: `Auto top-up — ${pack.credits} credits`,
      },
      { idempotencyKey: `auto_topup_${args.chargeId}` },
    );

    return { paymentIntentId: pi.id, status: pi.status };
  },
});

/* ────────────────────────────────────────────────────────────────────────── *
 * Stripe checkout — `mode: "setup"` session to collect a card off-session.
 * Hosted by Stripe so no card data touches our servers (no PCI scope).
 * ────────────────────────────────────────────────────────────────────────── */

export const createSetupCheckout = action({
  args: {
    userId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
  returns: v.object({
    url: v.union(v.string(), v.null()),
    sessionId: v.string(),
  }),
  handler: async (_ctx, args): Promise<{ url: string | null; sessionId: string }> => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    // Get-or-create Stripe Customer. We reuse the existing customer if the
    // user already has one (subscription or prior topup) so the saved
    // PaymentMethod ends up on a single Customer record.
    let customerId: string | undefined;
    const search = await stripe.customers.search({
      query: `metadata['userId']:'${args.userId}'`,
      limit: 1,
    });
    if (search.data[0]) {
      customerId = search.data[0].id;
    } else {
      const created = await stripe.customers.create({
        email: args.email,
        name: args.name,
        metadata: { userId: args.userId },
      });
      customerId = created.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "setup",
      payment_method_types: ["card"],
      success_url: args.successUrl,
      cancel_url: args.cancelUrl,
      metadata: {
        userId: args.userId,
        type: "auto_topup_setup",
      },
      // SetupIntent inherits these — webhook reads from setup_intent.metadata
      setup_intent_data: {
        metadata: {
          userId: args.userId,
          type: "auto_topup_setup",
        },
      },
    });

    return { url: session.url, sessionId: session.id };
  },
});
