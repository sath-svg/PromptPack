"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MarketplacePage() {
  const router = useRouter();
  const { user: clerkUser, isLoaded } = useUser();
  const convexUser = useQuery(
    api.users.getByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [pricingFilter, setPricingFilter] = useState<"all" | "free" | "paid">("all");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const isStudio = convexUser?.plan === "studio";

  // Use search if there's a query, otherwise list all published
  const searchResults = useQuery(
    api.listings.search,
    searchQuery.trim()
      ? {
          query: searchQuery,
          pricingModel: pricingFilter !== "all" ? pricingFilter : undefined,
        }
      : "skip"
  );

  const allListings = useQuery(
    api.listings.list,
    !searchQuery.trim()
      ? {
          status: "published",
          pricingModel: pricingFilter !== "all" ? pricingFilter : undefined,
        }
      : "skip"
  );

  const listings = searchQuery.trim() ? searchResults : allListings;

  const handleListingClick = (listingId: string, e: React.MouseEvent) => {
    // If user is not loaded yet, or is studio, allow navigation
    if (!isLoaded || isStudio || !clerkUser) {
      // Allow navigation for studio users or non-logged-in users
      return;
    }

    // Non-studio logged-in users get the popup
    e.preventDefault();
    setShowUpgradeModal(true);
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Marketplace</h1>
        <p style={{ color: "#959199" }}>
          Discover prompt packs created by the community
        </p>
      </div>

      {/* Search and filters */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "2rem",
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          placeholder="Search packs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: "1",
            minWidth: "200px",
            padding: "0.75rem 1rem",
            border: "1px solid rgba(128,128,128,0.3)",
            borderRadius: "0.5rem",
            background: "var(--bg-secondary)",
          }}
        />
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {(["all", "free", "paid"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setPricingFilter(filter)}
              style={{
                padding: "0.75rem 1rem",
                border: pricingFilter === filter
                  ? "2px solid var(--accent)"
                  : "1px solid rgba(128,128,128,0.3)",
                borderRadius: "0.5rem",
                background: pricingFilter === filter
                  ? "rgba(99,102,241,0.1)"
                  : "transparent",
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Listings grid */}
      {listings === undefined ? (
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
          <h3 style={{ marginBottom: "0.5rem" }}>No packs found</h3>
          <p style={{ color: "#959199" }}>
            {searchQuery
              ? "Try a different search term"
              : "Be the first to publish a pack!"}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(300px, 100%), 1fr))",
            gap: "1.5rem",
          }}
        >
          {listings.map((listing) => (
            <ListingCard
              key={listing._id}
              listing={listing}
              onListingClick={handleListingClick}
            />
          ))}
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
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
              Access premium prompt packs and unlock the full marketplace experience. Create and sell your own packs too!
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
                <li>• Access to all marketplace listings !!</li>
                <li>• Publish your own packs</li>
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

type ListingCardProps = {
  listing: {
    _id: string;
    title: string;
    tagline: string;
    tags: string[];
    pricingModel: "free" | "paid";
    priceInCents: number;
    downloads: number;
    license: string;
  };
  onListingClick: (listingId: string, e: React.MouseEvent) => void;
};

function ListingCard({ listing, onListingClick }: ListingCardProps) {
  return (
    <Link
      href={`/marketplace/${listing._id}`}
      style={{ textDecoration: "none", color: "inherit" }}
      onClick={(e) => onListingClick(listing._id, e)}
    >
      <div
        style={{
          padding: "1.5rem",
          borderRadius: "0.75rem",
          border: "1px solid rgba(128,128,128,0.2)",
          background: "rgba(128,128,128,0.02)",
          transition: "border-color 0.2s, transform 0.2s",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--accent)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "rgba(128,128,128,0.2)";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        <h3 style={{ marginBottom: "0.5rem", fontSize: "1.1rem" }}>{listing.title}</h3>
        <p
          style={{
            color: "#959199",
            fontSize: "0.9rem",
            marginBottom: "0.75rem",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {listing.tagline}
        </p>

        {/* Tags */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem",
            marginBottom: "1rem",
          }}
        >
          {listing.tags.slice(0, 3).map((tag, i) => (
            <span
              key={i}
              style={{
                padding: "0.2rem 0.5rem",
                background: "rgba(99,102,241,0.1)",
                borderRadius: "999px",
                fontSize: "0.75rem",
                color: "var(--accent)",
              }}
            >
              {tag}
            </span>
          ))}
          {listing.tags.length > 3 && (
            <span
              style={{
                padding: "0.2rem 0.5rem",
                background: "rgba(128,128,128,0.1)",
                borderRadius: "999px",
                fontSize: "0.75rem",
                color: "#959199",
              }}
            >
              +{listing.tags.length - 3}
            </span>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: "0.75rem",
            borderTop: "1px solid rgba(128,128,128,0.1)",
          }}
        >
          <span style={{ fontWeight: "600", color: listing.pricingModel === "free" ? "#22c55e" : "var(--text)" }}>
            {listing.pricingModel === "free"
              ? "Free"
              : `$${(listing.priceInCents / 100).toFixed(2)}`}
          </span>
          <span style={{ color: "#959199", fontSize: "0.85rem" }}>
            {listing.downloads} downloads
          </span>
        </div>
      </div>
    </Link>
  );
}
