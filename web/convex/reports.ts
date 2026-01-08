import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================================================
// QUERIES
// ============================================================================

// Get all reports for a listing
export const getByListing = query({
  args: { listingId: v.id("marketplaceListings") },
  handler: async (ctx, { listingId }) => {
    return await ctx.db
      .query("reports")
      .withIndex("by_listing", (q) => q.eq("listingId", listingId))
      .collect();
  },
});

// Get pending reports (for admin review)
export const getPending = query({
  args: {},
  handler: async (ctx) => {
    const reports = await ctx.db
      .query("reports")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    // Fetch listing details for each report
    const results = await Promise.all(
      reports.map(async (report) => {
        const listing = await ctx.db.get(report.listingId);
        const reporter = await ctx.db.get(report.reporterId);
        return {
          ...report,
          listing,
          reporter: reporter
            ? { id: reporter._id, name: reporter.name, email: reporter.email }
            : null,
        };
      })
    );

    return results;
  },
});

// Check if user has already reported a listing
export const hasReported = query({
  args: {
    listingId: v.id("marketplaceListings"),
    reporterId: v.id("users"),
  },
  handler: async (ctx, { listingId, reporterId }) => {
    const existing = await ctx.db
      .query("reports")
      .withIndex("by_listing", (q) => q.eq("listingId", listingId))
      .filter((q) => q.eq(q.field("reporterId"), reporterId))
      .first();
    return existing !== null;
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

// Create a report
export const create = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    // Check if listing exists
    const listing = await ctx.db.get(args.listingId);
    if (!listing) {
      throw new Error("Listing not found");
    }

    // Check if already reported by this user
    const existingReport = await ctx.db
      .query("reports")
      .withIndex("by_listing", (q) => q.eq("listingId", args.listingId))
      .filter((q) => q.eq(q.field("reporterId"), args.reporterId))
      .first();

    if (existingReport) {
      throw new Error("You have already reported this listing");
    }

    // Can't report own listing
    if (listing.authorId === args.reporterId) {
      throw new Error("You cannot report your own listing");
    }

    // Can't report already suspended listings
    if (listing.status === "suspended") {
      throw new Error("This listing is already suspended");
    }

    // Create the report
    const reportId = await ctx.db.insert("reports", {
      listingId: args.listingId,
      reporterId: args.reporterId,
      reason: args.reason,
      details: args.details,
      status: "pending",
      createdAt: Date.now(),
    });

    // Increment report count on listing
    const newReportCount = listing.reportCount + 1;
    await ctx.db.patch(args.listingId, {
      reportCount: newReportCount,
    });

    // Auto-suspend logic:
    // 1. Copyright report = instant suspend (highest severity)
    // 2. 3+ reports total = auto-suspend (spam protection)
    let shouldSuspend = false;
    let suspendReason = "";

    if (args.reason === "copyright") {
      shouldSuspend = true;
      suspendReason = "Suspended due to copyright report. Please contact support to resolve.";
    } else if (newReportCount >= 3) {
      shouldSuspend = true;
      suspendReason = "Suspended due to multiple reports. Please contact support to review.";
    }

    if (shouldSuspend) {
      await ctx.db.patch(args.listingId, {
        status: "suspended",
        suspendedReason: suspendReason,
        suspendedAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return reportId;
  },
});

// Admin: Review and dismiss a report
export const dismiss = mutation({
  args: {
    reportId: v.id("reports"),
    adminUserId: v.id("users"),
  },
  handler: async (ctx, { reportId, adminUserId }) => {
    // TODO: Add proper admin check when admin system is implemented
    const admin = await ctx.db.get(adminUserId);
    if (!admin) {
      throw new Error("Admin user not found");
    }

    const report = await ctx.db.get(reportId);
    if (!report) {
      throw new Error("Report not found");
    }

    if (report.status !== "pending") {
      throw new Error("Report has already been reviewed");
    }

    await ctx.db.patch(reportId, {
      status: "dismissed",
    });

    return reportId;
  },
});

// Admin: Mark report as reviewed
export const markReviewed = mutation({
  args: {
    reportId: v.id("reports"),
    adminUserId: v.id("users"),
  },
  handler: async (ctx, { reportId, adminUserId }) => {
    // TODO: Add proper admin check when admin system is implemented
    const admin = await ctx.db.get(adminUserId);
    if (!admin) {
      throw new Error("Admin user not found");
    }

    const report = await ctx.db.get(reportId);
    if (!report) {
      throw new Error("Report not found");
    }

    if (report.status !== "pending") {
      throw new Error("Report has already been reviewed");
    }

    await ctx.db.patch(reportId, {
      status: "reviewed",
    });

    return reportId;
  },
});
