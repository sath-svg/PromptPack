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

// Daily inactivity-nudge scan — fires Loops events for users who crossed
// the 3d / 7d / 14d inactivity thresholds. Each user gets each nudge at most
// once (dedup via inactiveXdSentAt flags on the users table).
// 14:00 UTC = 09:00 EST / 06:00 PST baseline. Convex cron has no per-user TZ.
crons.cron(
  "inactivity-nudge",
  "0 14 * * *",
  internal.users.scanInactiveAndFireLoops
);

export default crons;
