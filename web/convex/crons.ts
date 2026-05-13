import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run every hour to check for expired grace periods
crons.interval(
  "clean-expired-packs",
  { hours: 1 },
  internal.users.cleanExpiredPacks
);

// Refund stale credit holds (LLM call crashed mid-flight before settle)
crons.interval(
  "expire-stale-credit-holds",
  { minutes: 15 },
  internal.credits.expireStaleHolds
);

// Backstop monthly credit refresh for paid users whose Stripe webhook slipped
crons.interval(
  "refresh-monthly-credits",
  { hours: 24 },
  internal.credits.refreshMonthlyForAllPaid
);

// Daily settlement-shortfall summary — sums shortfalls from the last 24h
// and logs them. Tail Convex logs / pipe to Sentry/email for alerting when
// daily total exceeds expected baseline.
crons.interval(
  "shortfall-daily-summary",
  { hours: 24 },
  internal.credits.summarizeShortfallsLast24h
);

export default crons;
