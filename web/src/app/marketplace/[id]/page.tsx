"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Id } from "../../../../convex/_generated/dataModel";

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.id as Id<"marketplaceListings">;

  const { user: clerkUser, isLoaded } = useUser();
  const convexUser = useQuery(
    api.users.getByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );

  const listing = useQuery(api.listings.getWithAuthor, { id: listingId });

  const hasPurchased = useQuery(
    api.purchasedPacks.hasPurchasedListing,
    convexUser?._id && listing
      ? { userId: convexUser._id, listingId }
      : "skip"
  );

  const userBalance = useQuery(
    api.balances.getBalance,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  const recordFreePurchase = useMutation(api.purchasedPacks.recordFreePurchase);
  const purchaseWithBalance = useMutation(api.purchasedPacks.purchaseWithBalance);

  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState<string>("");
  const [reportDetails, setReportDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReportSuccess, setShowReportSuccess] = useState(false);

  const createReport = useMutation(api.reports.create);

  if (!isLoaded || listing === undefined) {
    return <div className="loading">Loading...</div>;
  }

  if (!listing) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <h2>Listing not found</h2>
        <Link href="/marketplace">
          <button className="btn btn-primary" style={{ marginTop: "1rem" }}>
            Back to Marketplace
          </button>
        </Link>
      </div>
    );
  }

  const isOwner = convexUser?._id === listing.authorId;
  const canDownload = hasPurchased || isOwner || listing.pricingModel === "free";

  const handleGetFree = async () => {
    if (!convexUser?._id || !listing.pack) return;

    setIsSubmitting(true);
    try {
      await recordFreePurchase({
        userId: convexUser._id,
        packId: listing.pack.id,
        listingId,
      });
      // Refresh the page to show download button
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to get pack");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBuy = async () => {
    if (!convexUser?._id) return;

    setIsSubmitting(true);
    try {
      await purchaseWithBalance({
        userId: convexUser._id,
        listingId,
      });
      // Refresh to show download button
      router.refresh();
      alert("Purchase successful!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Purchase failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReport = async () => {
    if (!convexUser?._id || !reportReason) return;

    setIsSubmitting(true);
    try {
      await createReport({
        listingId,
        reporterId: convexUser._id,
        reason: reportReason as "spam" | "inappropriate" | "copyright" | "misleading" | "other",
        details: reportDetails || undefined,
      });
      setIsReporting(false);
      setShowReportSuccess(true);
      setTimeout(() => setShowReportSuccess(false), 5000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to report");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <Link
          href="/marketplace"
          style={{ color: "#959199", fontSize: "0.9rem" }}
        >
          &larr; Back to Marketplace
        </Link>
      </div>

      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
          {listing.title}
        </h1>
        <p style={{ color: "#959199", fontSize: "1.1rem", marginBottom: "1rem" }}>
          {listing.tagline}
        </p>

        {/* Tags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
          {listing.tags.map((tag, i) => (
            <span
              key={i}
              style={{
                padding: "0.3rem 0.75rem",
                background: "rgba(99,102,241,0.1)",
                borderRadius: "999px",
                fontSize: "0.85rem",
                color: "var(--accent)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Author */}
        {listing.author && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {listing.author.imageUrl && (
              <img
                src={listing.author.imageUrl}
                alt={listing.author.name || "Author"}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                }}
              />
            )}
            <span style={{ color: "#959199" }}>
              by {listing.author.name || "Anonymous"}
            </span>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "2rem" }}>
        {/* Main content */}
        <div>
          {/* Description */}
          <div style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>Description</h2>
            <div style={{ lineHeight: "1.7", whiteSpace: "pre-wrap" }}>
              {listing.description}
            </div>
          </div>

          {/* Bullet points */}
          {listing.bulletPoints && listing.bulletPoints.length > 0 && (
            <div style={{ marginBottom: "2rem" }}>
              <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>Key Features</h2>
              <ul style={{ paddingLeft: "1.5rem", lineHeight: "2" }}>
                {listing.bulletPoints.map((bullet, i) => (
                  <li key={i}>{bullet}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Example */}
          {(listing.exampleInput || listing.exampleOutput) && (
            <div style={{ marginBottom: "2rem" }}>
              <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>Example</h2>
              {listing.exampleInput && (
                <div style={{ marginBottom: "1rem" }}>
                  <h3 style={{ fontSize: "0.9rem", color: "#959199", marginBottom: "0.5rem" }}>
                    Input
                  </h3>
                  <div
                    style={{
                      padding: "1rem",
                      background: "rgba(128,128,128,0.05)",
                      borderRadius: "0.5rem",
                      border: "1px solid rgba(128,128,128,0.2)",
                      whiteSpace: "pre-wrap",
                      fontFamily: "monospace",
                      fontSize: "0.9rem",
                    }}
                  >
                    {listing.exampleInput}
                  </div>
                </div>
              )}
              {listing.exampleOutput && (
                <div>
                  <h3 style={{ fontSize: "0.9rem", color: "#959199", marginBottom: "0.5rem" }}>
                    Output
                  </h3>
                  <div
                    style={{
                      padding: "1rem",
                      background: "rgba(99,102,241,0.05)",
                      borderRadius: "0.5rem",
                      border: "1px solid rgba(99,102,241,0.2)",
                      whiteSpace: "pre-wrap",
                      fontFamily: "monospace",
                      fontSize: "0.9rem",
                    }}
                  >
                    {listing.exampleOutput}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <div
            style={{
              padding: "1.5rem",
              border: "1px solid rgba(128,128,128,0.2)",
              borderRadius: "0.75rem",
              position: "sticky",
              top: "2rem",
            }}
          >
            {/* Price */}
            <div style={{ marginBottom: "1.5rem" }}>
              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: "700",
                  color: listing.pricingModel === "free" ? "#22c55e" : "var(--text)",
                }}
              >
                {listing.pricingModel === "free"
                  ? "Free"
                  : `$${(listing.priceInCents / 100).toFixed(2)}`}
              </div>
              <div style={{ color: "#959199", fontSize: "0.9rem" }}>
                {listing.license.charAt(0).toUpperCase() + listing.license.slice(1)} License
              </div>
            </div>

            {/* Stats */}
            <div
              style={{
                display: "flex",
                gap: "1.5rem",
                marginBottom: "1.5rem",
                paddingBottom: "1rem",
                borderBottom: "1px solid rgba(128,128,128,0.2)",
              }}
            >
              <div>
                <div style={{ fontWeight: "600" }}>{listing.downloads}</div>
                <div style={{ color: "#959199", fontSize: "0.85rem" }}>Downloads</div>
              </div>
              {listing.pack && (
                <div>
                  <div style={{ fontWeight: "600" }}>{listing.pack.promptCount}</div>
                  <div style={{ color: "#959199", fontSize: "0.85rem" }}>Prompts</div>
                </div>
              )}
            </div>

            {/* User balance (for paid listings) */}
            {clerkUser && !isOwner && listing.pricingModel === "paid" && (
              <div
                style={{
                  marginBottom: "1rem",
                  padding: "0.75rem",
                  background: "rgba(99,102,241,0.05)",
                  borderRadius: "0.5rem",
                  fontSize: "0.9rem",
                }}
              >
                <div style={{ color: "#959199", marginBottom: "0.25rem" }}>Your Balance</div>
                <div style={{ fontWeight: "600" }}>
                  ${((userBalance?.balanceInCents || 0) / 100).toFixed(2)}
                </div>
              </div>
            )}

            {/* Action button */}
            {!clerkUser ? (
              <Link href="/sign-in">
                <button className="btn btn-primary" style={{ width: "100%" }}>
                  Sign in to {listing.pricingModel === "free" ? "Download" : "Purchase"}
                </button>
              </Link>
            ) : isOwner ? (
              <Link href={`/dashboard/listings/${listingId}/edit`}>
                <button className="btn btn-secondary" style={{ width: "100%" }}>
                  Edit Listing
                </button>
              </Link>
            ) : hasPurchased ? (
              <button className="btn btn-primary" style={{ width: "100%" }}>
                Download Pack
              </button>
            ) : listing.pricingModel === "free" ? (
              <button
                className="btn btn-primary"
                style={{ width: "100%" }}
                onClick={handleGetFree}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Getting..." : "Get for Free"}
              </button>
            ) : (
              <>
                <button
                  className="btn btn-primary"
                  style={{ width: "100%" }}
                  onClick={handleBuy}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Processing..." : "Buy Now"}
                </button>
                {(userBalance?.balanceInCents || 0) < listing.priceInCents && (
                  <div
                    style={{
                      marginTop: "0.5rem",
                      padding: "0.5rem",
                      background: "rgba(239,68,68,0.1)",
                      borderRadius: "0.5rem",
                      fontSize: "0.85rem",
                      color: "#ef4444",
                      textAlign: "center",
                    }}
                  >
                    Insufficient balance
                  </div>
                )}
              </>
            )}

            {/* Report button */}
            {clerkUser && !isOwner && (
              <button
                onClick={() => setIsReporting(true)}
                style={{
                  marginTop: "1rem",
                  background: "none",
                  border: "none",
                  color: "#959199",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  width: "100%",
                  textAlign: "center",
                }}
              >
                Report this listing
              </button>
            )}

            {showReportSuccess && (
              <div
                style={{
                  marginTop: "1rem",
                  padding: "0.75rem",
                  background: "rgba(34,197,94,0.1)",
                  border: "1px solid rgba(34,197,94,0.3)",
                  borderRadius: "0.5rem",
                  color: "#22c55e",
                  fontSize: "0.85rem",
                  textAlign: "center",
                }}
              >
                Report submitted. Thank you!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report modal */}
      {isReporting && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setIsReporting(false)}
        >
          <div
            style={{
              background: "var(--bg)",
              padding: "2rem",
              borderRadius: "1rem",
              maxWidth: "400px",
              width: "90%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: "1rem" }}>Report Listing</h2>
            <p style={{ color: "#959199", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
              Help us keep the marketplace safe by reporting inappropriate content.
            </p>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                Reason
              </label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid rgba(128,128,128,0.3)",
                  borderRadius: "0.5rem",
                  background: "var(--bg-secondary)",
                }}
              >
                <option value="">Select a reason</option>
                <option value="spam">Spam</option>
                <option value="inappropriate">Inappropriate content</option>
                <option value="copyright">Copyright violation</option>
                <option value="misleading">Misleading description</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                Details (optional)
              </label>
              <textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Provide additional details..."
                rows={3}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid rgba(128,128,128,0.3)",
                  borderRadius: "0.5rem",
                  background: "var(--bg-secondary)",
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => setIsReporting(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleReport}
                disabled={!reportReason || isSubmitting}
                className="btn btn-primary"
              >
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
