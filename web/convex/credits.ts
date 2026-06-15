import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { findUserByAnyId } from "./users";

/* ────────────────────────────────────────────────────────────────────────── *
 * Constants
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * Monthly credit grant by plan + variant.
 *
 * `legacy_pro` = grandfathered $9 Pro subscribers from before the 2026 price
 * change. They keep their plan at $9/mo but receive 300 cr/mo instead of the
 * full 750. Upgrade flow flips planVariant → undefined (or "pro"), restoring
 * the full grant on the next billing cycle.
 *
 * Legacy table left exported (read-only) so existing callers that index by
 * plan continue to compile; new code should call `getMonthlyCredits()`.
 */
export const PLAN_MONTHLY_CREDITS: Record<"free" | "pro" | "studio", number> = {
  free: 0,
  pro: 750,
  studio: 2750,
};

export type PlanVariant = "pro" | "legacy_pro" | undefined;

export function getMonthlyCredits(
  plan: "free" | "pro" | "studio",
  variant?: PlanVariant,
): number {
  if (plan === "free") return 0;
  if (plan === "pro") {
    return variant === "legacy_pro" ? 300 : 750;
  }
  return 2750; // studio (no legacy variant currently)
}

export const FREE_SIGNUP_GRANT = 100;

// NOTE: small pack raised to $5 (was $4) to reduce stripe-fee drag.
// REQUIRED ACTION: create new Stripe Price for $5/200cr and update the
// STRIPE_TOPUP_200_PRICE_ID env var to point to it.
export const TOPUP_PACKS = {
  small: { credits: 200, priceCents: 500 },
  medium: { credits: 500, priceCents: 1000 },
  large: { credits: 1500, priceCents: 3000 },
  xl: { credits: 5000, priceCents: 10000 },
} as const;

// 1 credit = $0.005 OpenRouter cost budget (75% margin floor)
export const CREDIT_USD_VALUE = 0.005;

// Holds older than this are considered stale and refunded by the cron
export const HOLD_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

// Free-tier per-day burn cap (signup-grant pool only).
// Spreads the 100cr trial across multiple days, blocks instant drain.
export const FREE_DAILY_BURN_LIMIT = 30;

/**
 * Free-plan sunset. After this instant, free-plan accounts can no longer spend
 * AI credits — they must start the 3-day trial / subscribe. The closure email
 * gives users 3 days, so set this to (closure-email send date + 3 days).
 *
 * NOTE: update this to the actual send date + 3 days before flipping it on.
 * Default below assumes the email goes out ~2026-06-15.
 */
export const FREE_PLAN_SUNSET_MS = Date.UTC(2026, 5, 18, 0, 0, 0); // 2026-06-18 00:00 UTC

/**
 * Guard for non-credit data mutations (save pack/skillset, version control,
 * marketplace, etc.). AI spend is already gated inside `reserveCredits`; this
 * blocks every OTHER write for retired free-plan accounts so the app is fully
 * locked for free users after the sunset. Throws the same FREE_PLAN_RETIRED
 * code the worker maps to a 403 upgrade prompt.
 */
export function assertNotRetiredFree(user: Doc<"users"> | null): void {
  if (!user) throw new Error("USER_NOT_FOUND");
  if (user.plan === "free" && Date.now() >= FREE_PLAN_SUNSET_MS) {
    throw new Error("FREE_PLAN_RETIRED");
  }
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MONTHLY_PERIOD_MS = 30 * MS_PER_DAY;

// UTC day bucket — "YYYY-MM-DD" — for per-day counters
function utcDayBucket(now: number): string {
  const d = new Date(now);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

/* ────────────────────────────────────────────────────────────────────────── *
 * Helpers
 * ────────────────────────────────────────────────────────────────────────── */

/** Round USD cost up to whole credits. Always at least 1 credit per call. */
export function usdToCredits(usd: number): number {
  if (!Number.isFinite(usd) || usd <= 0) return 1;
  return Math.max(1, Math.ceil(usd / CREDIT_USD_VALUE));
}

interface DebitResult {
  newMonthly: number;
  newTopup: number;
  monthlyDelta: number; // negative
  topupDelta: number; // negative
}

/** Drain monthly first, then topup. Both balances assumed >= 0 going in. */
function applyDebit(monthly: number, topup: number, debit: number): DebitResult {
  const fromMonthly = Math.min(monthly, debit);
  const fromTopup = Math.min(topup, debit - fromMonthly);
  return {
    newMonthly: monthly - fromMonthly,
    newTopup: topup - fromTopup,
    monthlyDelta: -fromMonthly,
    topupDelta: -fromTopup,
  };
}

/**
 * Lazy monthly refresh. Returns the new monthlyCredits value plus a flag
 * indicating whether a grant transaction should be recorded by the caller.
 * Caps total monthly balance at 2× monthly grant (1× rollover).
 */
function maybeRefreshMonthly(
  user: Doc<"users">,
  now: number,
): { newMonthly: number; granted: number; expired: number; resetAt: number } | null {
  if (user.plan === "free") return null;
  const grant = getMonthlyCredits(user.plan, user.planVariant);
  const resetAt = user.monthlyCreditsResetAt ?? 0;
  if (resetAt > now) return null;

  const current = user.monthlyCredits ?? 0;
  const cap = grant * 2;
  const target = Math.min(current + grant, cap);
  const granted = target - current;
  const expired = current + grant - target; // overflow lost to cap
  return {
    newMonthly: target,
    granted,
    expired,
    resetAt: now + MONTHLY_PERIOD_MS,
  };
}

/* ────────────────────────────────────────────────────────────────────────── *
 * Reserve / Settle / Release
 * ────────────────────────────────────────────────────────────────────────── */

const reserveResult = v.object({
  holdId: v.string(),
  monthlyAfter: v.number(),
  topupAfter: v.number(),
});

/**
 * Atomically reserve `estimatedCredits` from the user's balance and create a
 * hold transaction. Lazily refreshes monthly credits if the period has
 * elapsed. Throws "INSUFFICIENT_CREDITS" if the user can't cover the estimate.
 */
export const reserveCredits = internalMutation({
  args: {
    userId: v.string(),
    estimatedCredits: v.number(),
    modelId: v.string(),
    // Optional tier — when set, gates frontier models behind paid plans.
    // Worker passes the model's tier so this mutation can reject before
    // any OpenRouter spend.
    tier: v.optional(v.union(v.literal("cheap"), v.literal("mid"), v.literal("frontier"))),
    // Worker sets this true when X-From-Orchestrator header is present.
    // SkillFlow (orchestrator + agent loops) is a paid feature — free
    // plan signups cannot trigger multi-step subtask fan-out.
    fromOrchestrator: v.optional(v.boolean()),
  },
  returns: reserveResult,
  handler: async (ctx, { userId, estimatedCredits, modelId, tier, fromOrchestrator }) => {
    if (estimatedCredits <= 0) {
      throw new Error("estimatedCredits must be positive");
    }

    const user = await findUserByAnyId(ctx.db, userId);
    if (!user) throw new Error("USER_NOT_FOUND");

    // Free plan retired. After the sunset, free accounts cannot spend AI —
    // they must start the 3-day trial / subscribe. Checked before any other
    // gate so the upgrade prompt is the first thing the user sees.
    if (user.plan === "free" && Date.now() >= FREE_PLAN_SUNSET_MS) {
      throw new Error("FREE_PLAN_RETIRED");
    }

    // SkillFlow (orchestrator + agent loops) gated to paid plans.
    if (fromOrchestrator === true && user.plan === "free") {
      throw new Error("SKILLFLOW_REQUIRES_PAID");
    }

    // Free-tier frontier-model gate. Free users (signup grant only) cannot
    // burn 100cr on a single Opus turn — paid plans only.
    if (tier === "frontier" && user.plan === "free") {
      throw new Error("FRONTIER_NOT_ALLOWED");
    }

    const now = Date.now();

    // Free-tier per-day burn cap. Only enforced on free plan users still
    // drawing from the signup grant (monthly pool > 0). Once they top up,
    // they're a paying customer — no daily cap.
    if (user.plan === "free" && (user.monthlyCredits ?? 0) > 0) {
      const todayBucket = utcDayBucket(now);
      const currentBucket = user.dailyBurnBucket;
      const burnedToday = currentBucket === todayBucket ? (user.dailyBurnCredits ?? 0) : 0;
      if (burnedToday + estimatedCredits > FREE_DAILY_BURN_LIMIT) {
        throw new Error("DAILY_FREE_LIMIT_REACHED");
      }
      // Update bucket + counter atomically with the reserve below
      await ctx.db.patch(user._id, {
        dailyBurnBucket: todayBucket,
        dailyBurnCredits: burnedToday + estimatedCredits,
      });
    }

    // Lazy monthly refresh
    let monthly = user.monthlyCredits ?? 0;
    const topup = user.topupCredits ?? 0;
    const refresh = maybeRefreshMonthly(user, now);
    if (refresh) {
      monthly = refresh.newMonthly;
      await ctx.db.patch(user._id, {
        monthlyCredits: refresh.newMonthly,
        monthlyCreditsResetAt: refresh.resetAt,
      });
      if (refresh.granted > 0) {
        await ctx.db.insert("creditTransactions", {
          userId: user._id,
          kind: "grant_monthly",
          monthlyDelta: refresh.granted,
          topupDelta: 0,
          monthlyBalanceAfter: refresh.newMonthly,
          topupBalanceAfter: topup,
          reason: "lazy_refresh",
          createdAt: now,
        });
      }
      if (refresh.expired > 0) {
        await ctx.db.insert("creditTransactions", {
          userId: user._id,
          kind: "expire_monthly",
          monthlyDelta: -refresh.expired,
          topupDelta: 0,
          monthlyBalanceAfter: refresh.newMonthly,
          topupBalanceAfter: topup,
          reason: "rollover_cap",
          createdAt: now,
        });
      }
    }

    if (monthly + topup < estimatedCredits) {
      throw new Error("INSUFFICIENT_CREDITS");
    }

    const debit = applyDebit(monthly, topup, estimatedCredits);
    const holdId = crypto.randomUUID();

    await ctx.db.patch(user._id, {
      monthlyCredits: debit.newMonthly,
      topupCredits: debit.newTopup,
    });

    await ctx.db.insert("creditTransactions", {
      userId: user._id,
      kind: "hold_llm",
      monthlyDelta: debit.monthlyDelta,
      topupDelta: debit.topupDelta,
      monthlyBalanceAfter: debit.newMonthly,
      topupBalanceAfter: debit.newTopup,
      modelId,
      holdId,
      createdAt: now,
    });

    return {
      holdId,
      monthlyAfter: debit.newMonthly,
      topupAfter: debit.newTopup,
    };
  },
});

/**
 * Settle a hold with the actual OpenRouter cost. Refunds the difference if the
 * estimate was over the actual; charges the difference (down to 0, never
 * negative) if the actual was higher than the estimate.
 */
export const settleCredits = internalMutation({
  args: {
    holdId: v.string(),
    actualOpenRouterCostUsd: v.number(),
    inputTokens: v.number(),
    outputTokens: v.number(),
  },
  returns: v.object({
    monthlyAfter: v.number(),
    topupAfter: v.number(),
    actualCredits: v.number(),
    shortfall: v.number(),
  }),
  handler: async (ctx, args) => {
    const hold = await ctx.db
      .query("creditTransactions")
      .withIndex("by_hold_id", (q) => q.eq("holdId", args.holdId))
      .filter((q) => q.eq(q.field("kind"), "hold_llm"))
      .first();
    if (!hold) throw new Error("HOLD_NOT_FOUND");

    const user = await ctx.db.get(hold.userId);
    if (!user) throw new Error("USER_NOT_FOUND");

    const now = Date.now();
    const heldCredits = -hold.monthlyDelta + -hold.topupDelta; // both negative
    const actualCredits = usdToCredits(args.actualOpenRouterCostUsd);
    const diff = heldCredits - actualCredits; // positive = refund, negative = extra debit

    let monthly = user.monthlyCredits ?? 0;
    let topup = user.topupCredits ?? 0;
    let monthlyDelta = 0;
    let topupDelta = 0;
    let shortfall = 0;

    if (diff > 0) {
      // Refund: return to whichever pool the hold drew from, monthly first
      const monthlyRefund = Math.min(-hold.monthlyDelta, diff);
      const topupRefund = diff - monthlyRefund;
      monthly += monthlyRefund;
      topup += topupRefund;
      monthlyDelta = monthlyRefund;
      topupDelta = topupRefund;
    } else if (diff < 0) {
      // Extra debit: try to drain from current balance
      const extra = -diff;
      const debit = applyDebit(monthly, topup, extra);
      if (monthly + topup < extra) {
        // Cap at 0 — log shortfall, account flagged via reason field
        shortfall = extra - (monthly + topup);
      }
      monthly = debit.newMonthly;
      topup = debit.newTopup;
      monthlyDelta = debit.monthlyDelta;
      topupDelta = debit.topupDelta;
    }

    const userPatch: Record<string, unknown> = {
      monthlyCredits: monthly,
      topupCredits: topup,
    };
    if (shortfall > 0) {
      userPatch.shortfallCount = (user.shortfallCount ?? 0) + 1;
      userPatch.lastShortfallAt = now;
    }
    await ctx.db.patch(user._id, userPatch);

    // Convert hold → debit_llm with actual cost recorded
    await ctx.db.patch(hold._id, {
      kind: "debit_llm",
      inputTokens: args.inputTokens,
      outputTokens: args.outputTokens,
      openRouterCostUsd: args.actualOpenRouterCostUsd,
    });

    // Settlement adjustment (refund or extra debit)
    if (diff !== 0) {
      await ctx.db.insert("creditTransactions", {
        userId: hold.userId,
        kind: diff > 0 ? "release_hold" : "debit_llm",
        monthlyDelta,
        topupDelta,
        monthlyBalanceAfter: monthly,
        topupBalanceAfter: topup,
        modelId: hold.modelId,
        holdId: args.holdId,
        reason: shortfall > 0 ? `settlement_shortfall=${shortfall}` : "settlement",
        openRouterCostUsd: diff < 0 ? args.actualOpenRouterCostUsd : undefined,
        createdAt: now,
      });
    }

    // Auto top-up trigger — fire-and-forget. Eligibility is gated inside
    // `maybeFire` (enabled flag, threshold check, cooldown, monthly cap,
    // lock). Settling is the canonical "balance just changed" hook; we
    // schedule rather than await so chat latency is untouched. Users
    // without autoTopup config are short-circuited by loadEligibility.
    const resolvedUserId =
      user.betterAuthId ?? user.clerkId;
    if (resolvedUserId) {
      await ctx.scheduler.runAfter(0, internal.autoTopup.maybeFire, {
        userId: resolvedUserId,
      });
    }

    return {
      monthlyAfter: monthly,
      topupAfter: topup,
      actualCredits,
      shortfall,
    };
  },
});

/**
 * Release a hold without charging — full refund. Used when the LLM call fails
 * before producing a response, or when a stale hold expires via cron.
 */
export const releaseHold = internalMutation({
  args: {
    holdId: v.string(),
    reason: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, { holdId, reason }) => {
    const hold = await ctx.db
      .query("creditTransactions")
      .withIndex("by_hold_id", (q) => q.eq("holdId", holdId))
      .filter((q) => q.eq(q.field("kind"), "hold_llm"))
      .first();
    if (!hold) return null;

    const user = await ctx.db.get(hold.userId);
    if (!user) return null;

    const now = Date.now();
    const monthly = (user.monthlyCredits ?? 0) + -hold.monthlyDelta;
    const topup = (user.topupCredits ?? 0) + -hold.topupDelta;

    await ctx.db.patch(user._id, {
      monthlyCredits: monthly,
      topupCredits: topup,
    });

    await ctx.db.insert("creditTransactions", {
      userId: hold.userId,
      kind: "release_hold",
      monthlyDelta: -hold.monthlyDelta,
      topupDelta: -hold.topupDelta,
      monthlyBalanceAfter: monthly,
      topupBalanceAfter: topup,
      modelId: hold.modelId,
      holdId,
      reason: reason ?? "manual_release",
      createdAt: now,
    });

    // Mark the original hold as released by overwriting its kind to keep
    // by_hold_id queries from finding it again on retry.
    await ctx.db.patch(hold._id, { kind: "release_hold" });

    return null;
  },
});

/* ────────────────────────────────────────────────────────────────────────── *
 * Grants — signup, monthly (Stripe), top-up
 * ────────────────────────────────────────────────────────────────────────── */

export const grantFreeSignupCreditsIfEligible = internalMutation({
  args: { userId: v.string() },
  returns: v.object({ granted: v.boolean() }),
  handler: async (ctx, { userId }) => {
    const user = await findUserByAnyId(ctx.db, userId);
    if (!user) return { granted: false };
    if (user.freeCreditsGrantedAt) return { granted: false };
    if (!user.emailVerified) return { granted: false };

    const now = Date.now();
    const monthly = (user.monthlyCredits ?? 0) + FREE_SIGNUP_GRANT;
    const topup = user.topupCredits ?? 0;

    await ctx.db.patch(user._id, {
      monthlyCredits: monthly,
      freeCreditsGrantedAt: now,
    });

    await ctx.db.insert("creditTransactions", {
      userId: user._id,
      kind: "grant_signup",
      monthlyDelta: FREE_SIGNUP_GRANT,
      topupDelta: 0,
      monthlyBalanceAfter: monthly,
      topupBalanceAfter: topup,
      reason: "email_verified",
      createdAt: now,
    });

    return { granted: true };
  },
});

export const grantMonthlyFromInvoice = internalMutation({
  args: {
    userId: v.string(),
    invoiceId: v.string(),
    plan: v.union(v.literal("pro"), v.literal("studio")),
    // Optional — webhook passes it from the subscription's price ID lookup
    // so legacy_pro users get the reduced 300cr grant. Undefined = full tier.
    planVariant: v.optional(v.union(v.literal("pro"), v.literal("legacy_pro"))),
  },
  returns: v.object({ granted: v.boolean() }),
  handler: async (ctx, { userId, invoiceId, plan, planVariant }) => {
    // Idempotency: skip if this invoice already granted credits
    const existing = await ctx.db
      .query("creditTransactions")
      .withIndex("by_stripe_event", (q) => q.eq("stripeEventId", invoiceId))
      .first();
    if (existing) return { granted: false };

    const user = await findUserByAnyId(ctx.db, userId);
    if (!user) return { granted: false };

    const now = Date.now();
    // Prefer the variant from the webhook arg; fall back to whatever is
    // stored on the user record (set previously by subscription.* events).
    const grant = getMonthlyCredits(plan, planVariant ?? user.planVariant);
    const cap = grant * 2;
    const current = user.monthlyCredits ?? 0;
    const newMonthly = Math.min(current + grant, cap);
    const granted = newMonthly - current;
    const expired = current + grant - newMonthly;
    const topup = user.topupCredits ?? 0;

    await ctx.db.patch(user._id, {
      monthlyCredits: newMonthly,
      monthlyCreditsResetAt: now + MONTHLY_PERIOD_MS,
      lastStripeInvoiceId: invoiceId,
    });

    await ctx.db.insert("creditTransactions", {
      userId: user._id,
      kind: "grant_monthly",
      monthlyDelta: granted,
      topupDelta: 0,
      monthlyBalanceAfter: newMonthly,
      topupBalanceAfter: topup,
      stripeEventId: invoiceId,
      reason: `plan=${plan}`,
      createdAt: now,
    });

    if (expired > 0) {
      await ctx.db.insert("creditTransactions", {
        userId: user._id,
        kind: "expire_monthly",
        monthlyDelta: -expired,
        topupDelta: 0,
        monthlyBalanceAfter: newMonthly,
        topupBalanceAfter: topup,
        stripeEventId: `${invoiceId}_overflow`,
        reason: "rollover_cap",
        createdAt: now,
      });
    }

    return { granted: true };
  },
});

export const grantTopup = internalMutation({
  args: {
    userId: v.string(),
    credits: v.number(),
    stripeEventId: v.string(),
    sessionId: v.optional(v.string()),
  },
  returns: v.object({ granted: v.boolean() }),
  handler: async (ctx, { userId, credits, stripeEventId, sessionId }) => {
    // Idempotency
    const existing = await ctx.db
      .query("creditTransactions")
      .withIndex("by_stripe_event", (q) => q.eq("stripeEventId", stripeEventId))
      .first();
    if (existing) return { granted: false };

    const user = await findUserByAnyId(ctx.db, userId);
    if (!user) return { granted: false };

    const now = Date.now();
    const newTopup = (user.topupCredits ?? 0) + credits;

    await ctx.db.patch(user._id, { topupCredits: newTopup });

    await ctx.db.insert("creditTransactions", {
      userId: user._id,
      kind: "grant_topup",
      monthlyDelta: 0,
      topupDelta: credits,
      monthlyBalanceAfter: user.monthlyCredits ?? 0,
      topupBalanceAfter: newTopup,
      stripeEventId,
      reason: sessionId ? `session=${sessionId}` : undefined,
      createdAt: now,
    });

    return { granted: true };
  },
});

export const addCredits = internalMutation({
  args: {
    userId: v.string(),
    credits: v.number(),
    reason: v.optional(v.string()),
  },
  returns: v.object({
    granted: v.boolean(),
    topupAfter: v.number(),
  }),
  handler: async (ctx, { userId, credits, reason }) => {
    if (credits <= 0) throw new Error("credits must be > 0");

    const user = await findUserByAnyId(ctx.db, userId);
    if (!user) return { granted: false, topupAfter: 0 };

    const now = Date.now();
    const topupAfter = (user.topupCredits ?? 0) + credits;

    await ctx.db.patch(user._id, { topupCredits: topupAfter });

    await ctx.db.insert("creditTransactions", {
      userId: user._id,
      kind: "grant_admin",
      monthlyDelta: 0,
      topupDelta: credits,
      monthlyBalanceAfter: user.monthlyCredits ?? 0,
      topupBalanceAfter: topupAfter,
      reason: reason ?? "manual admin grant",
      createdAt: now,
    });

    return { granted: true, topupAfter };
  },
});

/* ────────────────────────────────────────────────────────────────────────── *
 * Maintenance — stale hold cleanup, monthly refresh sweep, backfill
 * ────────────────────────────────────────────────────────────────────────── */

export const expireStaleHolds = internalMutation({
  args: {},
  returns: v.object({ released: v.number() }),
  handler: async (ctx) => {
    const cutoff = Date.now() - HOLD_EXPIRY_MS;
    const stale = await ctx.db
      .query("creditTransactions")
      .filter((q) =>
        q.and(
          q.eq(q.field("kind"), "hold_llm"),
          q.lt(q.field("createdAt"), cutoff),
        ),
      )
      .take(200); // Bound work per cron tick

    let released = 0;
    for (const hold of stale) {
      if (!hold.holdId) continue;
      const user = await ctx.db.get(hold.userId);
      if (!user) continue;

      const now = Date.now();
      const monthly = (user.monthlyCredits ?? 0) + -hold.monthlyDelta;
      const topup = (user.topupCredits ?? 0) + -hold.topupDelta;

      await ctx.db.patch(user._id, {
        monthlyCredits: monthly,
        topupCredits: topup,
      });

      await ctx.db.insert("creditTransactions", {
        userId: hold.userId,
        kind: "release_hold",
        monthlyDelta: -hold.monthlyDelta,
        topupDelta: -hold.topupDelta,
        monthlyBalanceAfter: monthly,
        topupBalanceAfter: topup,
        modelId: hold.modelId,
        holdId: hold.holdId,
        reason: "stale_expired",
        createdAt: now,
      });

      await ctx.db.patch(hold._id, { kind: "release_hold" });
      released += 1;
    }

    return { released };
  },
});

export const refreshMonthlyForAllPaid = internalMutation({
  args: {},
  returns: v.object({ refreshed: v.number() }),
  handler: async (ctx) => {
    const now = Date.now();
    const candidates = await ctx.db
      .query("users")
      .filter((q) =>
        q.or(q.eq(q.field("plan"), "pro"), q.eq(q.field("plan"), "studio")),
      )
      .take(1000);

    let refreshed = 0;
    for (const user of candidates) {
      const result = maybeRefreshMonthly(user, now);
      if (!result) continue;

      const topup = user.topupCredits ?? 0;
      await ctx.db.patch(user._id, {
        monthlyCredits: result.newMonthly,
        monthlyCreditsResetAt: result.resetAt,
      });
      if (result.granted > 0) {
        await ctx.db.insert("creditTransactions", {
          userId: user._id,
          kind: "grant_monthly",
          monthlyDelta: result.granted,
          topupDelta: 0,
          monthlyBalanceAfter: result.newMonthly,
          topupBalanceAfter: topup,
          reason: "cron_backstop",
          createdAt: now,
        });
      }
      if (result.expired > 0) {
        await ctx.db.insert("creditTransactions", {
          userId: user._id,
          kind: "expire_monthly",
          monthlyDelta: -result.expired,
          topupDelta: 0,
          monthlyBalanceAfter: result.newMonthly,
          topupBalanceAfter: topup,
          reason: "rollover_cap",
          createdAt: now,
        });
      }
      refreshed += 1;
    }

    return { refreshed };
  },
});

/**
 * One-time migration: grant existing users their plan's monthly credits and
 * set monthlyCreditsResetAt 30 days from now. Free users are marked as having
 * already received their signup grant (so we don't retroactively give them
 * 50 credits — they had access without credits). Existing users default to
 * managedModeEnabled=false (opt-in to credit mode). Idempotent: skips users
 * who already have monthlyCredits or topupCredits set.
 */
export const backfillExistingUsers = internalMutation({
  args: {},
  returns: v.object({ updated: v.number(), skipped: v.number() }),
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const now = Date.now();
    let updated = 0;
    let skipped = 0;

    for (const user of users) {
      if (user.monthlyCredits !== undefined || user.topupCredits !== undefined) {
        skipped += 1;
        continue;
      }

      const grant = getMonthlyCredits(user.plan, user.planVariant);
      const patch: Partial<Doc<"users">> = {
        monthlyCredits: grant,
        topupCredits: 0,
        managedModeEnabled: false,
      };
      if (user.plan !== "free") {
        patch.monthlyCreditsResetAt = now + MONTHLY_PERIOD_MS;
      }
      // Free users: mark already-granted to block 50-credit signup grant
      if (user.plan === "free" && !user.freeCreditsGrantedAt) {
        patch.freeCreditsGrantedAt = user.createdAt;
      }

      await ctx.db.patch(user._id, patch);

      if (grant > 0) {
        await ctx.db.insert("creditTransactions", {
          userId: user._id,
          kind: "grant_monthly",
          monthlyDelta: grant,
          topupDelta: 0,
          monthlyBalanceAfter: grant,
          topupBalanceAfter: 0,
          reason: "backfill",
          createdAt: now,
        });
      }
      updated += 1;
    }

    return { updated, skipped };
  },
});

/* ────────────────────────────────────────────────────────────────────────── *
 * Public queries — used by web dashboard and desktop app
 * ────────────────────────────────────────────────────────────────────────── */

export const getBalance = query({
  args: { userId: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      monthly: v.number(),
      topup: v.number(),
      monthlyResetAt: v.optional(v.number()),
      plan: v.union(v.literal("free"), v.literal("pro"), v.literal("studio")),
      autoTopup: v.optional(
        v.object({
          enabled: v.boolean(),
          thresholdCredits: v.number(),
          packKey: v.union(
            v.literal("small"),
            v.literal("medium"),
            v.literal("large"),
            v.literal("xl"),
          ),
          cardBrand: v.optional(v.string()),
          cardLast4: v.optional(v.string()),
          hasPaymentMethod: v.boolean(),
          lastChargeAt: v.optional(v.number()),
          lastFailureReason: v.optional(v.string()),
          consecutiveFailures: v.optional(v.number()),
          monthlyCapUsd: v.optional(v.number()),
          monthlySpentUsd: v.optional(v.number()),
        }),
      ),
    }),
  ),
  handler: async (ctx, { userId }) => {
    const user = await findUserByAnyId(ctx.db, userId);
    if (!user) return null;
    const at = user.autoTopup;
    return {
      monthly: user.monthlyCredits ?? 0,
      topup: user.topupCredits ?? 0,
      monthlyResetAt: user.monthlyCreditsResetAt,
      plan: user.plan,
      autoTopup: at
        ? {
            enabled: at.enabled,
            thresholdCredits: at.thresholdCredits,
            packKey: at.packKey,
            cardBrand: at.cardBrand,
            cardLast4: at.cardLast4,
            hasPaymentMethod: Boolean(at.paymentMethodId),
            lastChargeAt: at.lastChargeAt,
            lastFailureReason: at.lastFailureReason,
            consecutiveFailures: at.consecutiveFailures,
            monthlyCapUsd: at.monthlyCapUsd,
            monthlySpentUsd: at.monthlySpentUsd,
          }
        : undefined,
    };
  },
});

export const listTransactions = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit }) => {
    const user = await findUserByAnyId(ctx.db, userId);
    if (!user) return [];

    const max = Math.min(limit ?? 50, 200);
    const dbUserId: Id<"users"> = user._id;
    return await ctx.db
      .query("creditTransactions")
      .withIndex("by_user", (q) => q.eq("userId", dbUserId))
      .order("desc")
      .take(max);
  },
});

/**
 * Internal query for the Workers proxy: returns balance + plan in one shot.
 * Workers fetches this via the signed httpInternal endpoint to decide if a
 * call should proceed before reserving.
 */
export const getBalanceInternal = internalQuery({
  args: { userId: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      monthly: v.number(),
      topup: v.number(),
      plan: v.union(v.literal("free"), v.literal("pro"), v.literal("studio")),
      managedModeEnabled: v.boolean(),
    }),
  ),
  handler: async (ctx, { userId }) => {
    const user = await findUserByAnyId(ctx.db, userId);
    if (!user) return null;
    return {
      monthly: user.monthlyCredits ?? 0,
      topup: user.topupCredits ?? 0,
      plan: user.plan,
      managedModeEnabled: user.managedModeEnabled ?? false,
    };
  },
});

/* ────────────────────────────────────────────────────────────────────────── *
 * User-facing mutations — toggle managed mode from the desktop app
 * ────────────────────────────────────────────────────────────────────────── */

export const setManagedModeEnabled = mutation({
  args: { userId: v.string(), enabled: v.boolean() },
  returns: v.null(),
  handler: async (ctx, { userId, enabled }) => {
    const user = await findUserByAnyId(ctx.db, userId);
    if (!user) throw new Error("USER_NOT_FOUND");
    await ctx.db.patch(user._id, { managedModeEnabled: enabled });
    return null;
  },
});

/* ────────────────────────────────────────────────────────────────────────── *
 * Cron — daily settlement-shortfall summary (called from crons.ts)
 * ────────────────────────────────────────────────────────────────────────── */

export const summarizeShortfallsLast24h = internalMutation({
  args: {},
  returns: v.object({
    totalShortfallCredits: v.number(),
    totalShortfallUsd: v.number(),
    eventCount: v.number(),
    affectedUsers: v.number(),
  }),
  handler: async (ctx) => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    // Scan recent transactions; reason field carries "settlement_shortfall=N"
    const recent = await ctx.db
      .query("creditTransactions")
      .filter((q) => q.gte(q.field("createdAt"), cutoff))
      .collect();

    let totalShortfallCredits = 0;
    let eventCount = 0;
    const affected = new Set<string>();
    for (const txn of recent) {
      const m = txn.reason?.match(/^settlement_shortfall=(\d+(?:\.\d+)?)$/);
      if (!m) continue;
      const amt = Number(m[1]);
      if (!Number.isFinite(amt) || amt <= 0) continue;
      totalShortfallCredits += amt;
      eventCount += 1;
      affected.add(String(txn.userId));
    }

    const totalShortfallUsd = totalShortfallCredits * CREDIT_USD_VALUE;

    console.log(
      "[shortfall-summary]",
      JSON.stringify({
        windowHours: 24,
        totalShortfallCredits,
        totalShortfallUsd,
        eventCount,
        affectedUsers: affected.size,
      }),
    );

    return {
      totalShortfallCredits,
      totalShortfallUsd,
      eventCount,
      affectedUsers: affected.size,
    };
  },
});
