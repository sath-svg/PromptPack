"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Id } from "../../../../convex/_generated/dataModel";

export default function ListingsPage() {
  const router = useRouter();
  const { user: clerkUser, isLoaded } = useUser();
  const convexUser = useQuery(
    api.users.getByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );

  const allListings = useQuery(
    api.listings.getByAuthor,
    convexUser?._id ? { authorId: convexUser._id } : "skip"
  );

  const deleteListing = useMutation(api.listings.remove);
  const archiveListing = useMutation(api.listings.archive);
  const unarchiveListing = useMutation(api.listings.unpublish);
  const [deletingId, setDeletingId] = useState<Id<"marketplaceListings"> | null>(null);
  const [archivingId, setArchivingId] = useState<Id<"marketplaceListings"> | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const isStudio = convexUser?.plan === "studio";

  if (!isLoaded || convexUser === undefined) {
    return <div className="loading">Loading...</div>;
  }

  // Filter listings by archive status
  const activeListings = allListings?.filter(l => l.status !== "archived") ?? [];
  const archivedListings = allListings?.filter(l => l.status === "archived") ?? [];
  const listings = showArchived ? archivedListings : activeListings;

  const handleCreateListing = () => {
    if (!isStudio) {
      setShowUpgradeModal(true);
    }
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <div>
          <h1 style={{ marginBottom: "0.5rem" }}>Your Listings</h1>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <p style={{ color: "#E3E3E3", margin: 0 }}>
              Manage your marketplace listings
            </p>
            {isStudio && (
              <button
                onClick={() => setShowArchived(!showArchived)}
                style={{
                  padding: "0.25rem 0.75rem",
                  border: "1px solid rgba(128,128,128,0.3)",
                  borderRadius: "0.5rem",
                  background: showArchived ? "rgba(107,114,128,0.2)" : "transparent",
                  color: "#E3E3E3",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                }}
              >
                {showArchived ? "← Back to Active" : `📦 Archived (${archivedListings.length})`}
              </button>
            )}
          </div>
        </div>
        {!showArchived && (
          isStudio ? (
            <Link href="/dashboard/listings/new">
              <button className="btn btn-primary">Create Listing</button>
            </Link>
          ) : (
            <button className="btn btn-primary" onClick={handleCreateListing}>
              Create Listing
            </button>
          )
        )}
      </div>

      {allListings === undefined ? (
        <div className="loading">Loading listings...</div>
      ) : listings.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "3rem",
            border: "1px dashed rgba(128,128,128,0.3)",
            borderRadius: "1rem",
          }}
        >
          <p style={{ color: "#E3E3E3", marginBottom: "1rem" }}>
            {showArchived
              ? "No archived listings."
              : "You haven't created any listings yet."}
          </p>
          {!showArchived && (
            isStudio ? (
              <Link href="/dashboard/listings/new">
                <button className="btn btn-primary">Create Your First Listing</button>
              </Link>
            ) : (
              <button className="btn btn-primary" onClick={handleCreateListing}>
                Create Your First Listing
              </button>
            )
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {listings.map((listing) => (
            <ListingRow
              key={listing._id}
              listing={listing}
              onDelete={async (id) => {
                if (confirm("Are you sure you want to delete this listing? This cannot be undone.")) {
                  setDeletingId(id);
                  try {
                    await deleteListing({ id });
                  } catch (error) {
                    console.error("Failed to delete listing:", error);
                    alert("Failed to delete listing");
                  } finally {
                    setDeletingId(null);
                  }
                }
              }}
              onArchive={async (id) => {
                if (showArchived) {
                  // Unarchive
                  if (confirm("Unarchive this listing? It will return to draft status.")) {
                    setArchivingId(id);
                    try {
                      await unarchiveListing({ id });
                    } catch (error) {
                      console.error("Failed to unarchive listing:", error);
                      alert("Failed to unarchive listing");
                    } finally {
                      setArchivingId(null);
                    }
                  }
                } else {
                  // Archive
                  if (confirm("Archive this listing? You can unarchive it later.")) {
                    setArchivingId(id);
                    try {
                      await archiveListing({ id });
                    } catch (error) {
                      console.error("Failed to archive listing:", error);
                      alert("Failed to archive listing");
                    } finally {
                      setArchivingId(null);
                    }
                  }
                }
              }}
              isDeleting={deletingId === listing._id}
              isArchiving={archivingId === listing._id}
              showArchived={showArchived}
            />
          ))}
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && !isStudio && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowUpgradeModal(false)}
        >
          <div
            style={{
              background: "var(--bg)",
              padding: "2.5rem",
              borderRadius: "1rem",
              maxWidth: "500px",
              width: "90%",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🚀</div>
            <h2 style={{ fontSize: "1.75rem", marginBottom: "1rem" }}>
              Upgrade to Studio
            </h2>
            <p style={{ color: "#959199", marginBottom: "2rem", lineHeight: "1.6" }}>
              Publish and sell your PromptPacks on the marketplace. Reach thousands of users and earn from your creations.
            </p>

            <div style={{
              background: "rgba(99,102,241,0.1)",
              padding: "1rem",
              borderRadius: "0.5rem",
              marginBottom: "2rem",
              textAlign: "left"
            }}>
              <div style={{ fontWeight: "600", marginBottom: "0.75rem" }}>Studio includes:</div>
              <ul style={{ margin: 0, paddingLeft: "1.5rem", color: "#959199" }}>
                <li>• Publish unlimited listings</li>
                <li>• Set your own pricing</li>
                <li>• Earn 85% revenue share</li>
                <li>• Advanced analytics</li>
              </ul>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Maybe Later
              </button>
              <button
                onClick={() => router.push("/pricing")}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                See Pricing Plans
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type ListingRowProps = {
  listing: {
    _id: Id<"marketplaceListings">;
    title: string;
    tagline: string;
    status: "draft" | "published" | "suspended" | "archived";
    pricingModel: "free" | "paid";
    priceInCents: number;
    downloads: number;
    salesCount: number;
  };
  onDelete: (id: Id<"marketplaceListings">) => void;
  onArchive: (id: Id<"marketplaceListings">) => void;
  isDeleting: boolean;
  isArchiving: boolean;
  showArchived: boolean;
};

function ListingRow({ listing, onDelete, onArchive, isDeleting, isArchiving, showArchived }: ListingRowProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      style={{
        padding: "1.5rem",
        border: "1px solid rgba(128,128,128,0.2)",
        borderRadius: "0.75rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        opacity: isDeleting || isArchiving ? 0.5 : 1,
      }}
    >
      <div>
        <h3 style={{ marginBottom: "0.25rem" }}>{listing.title}</h3>
        <p
          style={{
            color: "#E3E3E3",
            fontSize: "0.9rem",
            marginBottom: "0.5rem",
          }}
        >
          {listing.tagline}
        </p>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <StatusBadge status={listing.status} />
          <span style={{ color: "#E3E3E3", fontSize: "0.85rem" }}>
            {listing.pricingModel === "free"
              ? "Free"
              : `$${(listing.priceInCents / 100).toFixed(2)}`}
          </span>
          <span style={{ color: "#E3E3E3", fontSize: "0.85rem" }}>
            {listing.downloads} downloads
          </span>
          {listing.salesCount > 0 && (
            <span style={{ color: "#E3E3E3", fontSize: "0.85rem" }}>
              {listing.salesCount} sales
            </span>
          )}
        </div>
      </div>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <Link href={`/dashboard/listings/${listing._id}/edit`}>
          <button className="btn btn-secondary" style={{ padding: "0.5rem 1rem" }}>
            Edit
          </button>
        </Link>
        <Link href={`/marketplace/${listing._id}`}>
          <button className="btn btn-secondary" style={{ padding: "0.5rem 1rem" }}>
            View
          </button>
        </Link>

        {/* More actions dropdown */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowActions(!showActions)}
            disabled={isDeleting}
            style={{
              padding: "0.5rem 0.75rem",
              border: "1px solid rgba(128,128,128,0.3)",
              borderRadius: "0.5rem",
              background: "transparent",
              cursor: isDeleting ? "not-allowed" : "pointer",
              fontSize: "1.2rem",
            }}
          >
            ⋮
          </button>

          {showActions && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 0.5rem)",
                background: "var(--bg-secondary)",
                border: "1px solid rgba(128,128,128,0.3)",
                borderRadius: "0.5rem",
                boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
                minWidth: "140px",
                zIndex: 10,
              }}
            >
              <button
                onClick={() => {
                  onArchive(listing._id);
                  setShowActions(false);
                }}
                disabled={isArchiving}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  border: "none",
                  borderBottom: showArchived ? "none" : "1px solid rgba(128,128,128,0.2)",
                  background: "transparent",
                  textAlign: "left",
                  cursor: "pointer",
                  color: "#E3E3E3",
                  fontSize: "0.9rem",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(128,128,128,0.1)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                {showArchived ? "📤 Unarchive" : "📦 Archive"}
              </button>
              {!showArchived && (
                <button
                  onClick={() => {
                    onDelete(listing._id);
                    setShowActions(false);
                  }}
                  disabled={isDeleting}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    border: "none",
                    background: "transparent",
                    textAlign: "left",
                    cursor: "pointer",
                    color: "#ef4444",
                    fontSize: "0.9rem",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  🗑️ Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: "draft" | "published" | "suspended" | "archived" }) {
  const colors = {
    draft: { bg: "rgba(128,128,128,0.2)", text: "#9ca3af" },
    published: { bg: "rgba(34,197,94,0.2)", text: "#22c55e" },
    suspended: { bg: "rgba(239,68,68,0.2)", text: "#ef4444" },
    archived: { bg: "rgba(107,114,128,0.2)", text: "#6b7280" },
  };

  return (
    <span
      style={{
        padding: "0.25rem 0.5rem",
        borderRadius: "999px",
        fontSize: "0.75rem",
        fontWeight: "600",
        background: colors[status].bg,
        color: colors[status].text,
        textTransform: "capitalize",
      }}
    >
      {status}
    </span>
  );
}
