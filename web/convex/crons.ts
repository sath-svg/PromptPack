import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run every hour to check for expired grace periods
crons.interval(
  "clean-expired-packs",
  { hours: 1 },
  internal.users.cleanExpiredPacks
);

export default crons;
