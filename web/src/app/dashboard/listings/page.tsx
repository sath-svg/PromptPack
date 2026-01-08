"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import Link from "next/link";

export default function ListingsPage() {
  const { user: clerkUser, isLoaded } = useUser();
  const convexUser = useQuery(
    api.users.getByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );

  const listings = useQuery(
    api.listings.getByAuthor,
    convexUser?._id ? { authorId: convexUser._id } : "skip"
  );

  if (!isLoaded || convexUser === undefined) {
    return <div className="loading">Loading...</div>;
  }

  const isStudio = convexUser?.plan === "studio";

  if (!isStudio) {
    return (
      <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center", padding: "3rem 1rem" }}>
        <h1 style={{ marginBottom: "1rem" }}>Marketplace Publishing</h1>
        <p style={{ color: "var(--muted)", marginBottom: "2rem" }}>
          Upgrade to Studio to publish and sell your PromptPacks on the marketplace.
        </p>
        <Link href="/pricing">
          <button className="btn btn-primary">Upgrade to Studio</button>
        </Link>
      </div>
    );
  }

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
          <p style={{ color: "var(--muted)" }}>
            Manage your marketplace listings
          </p>
        </div>
        <Link href="/dashboard/listings/new">
          <button className="btn btn-primary">Create Listing</button>
        </Link>
      </div>

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
          <p style={{ color: "var(--muted)", marginBottom: "1rem" }}>
            You haven&apos;t created any listings yet.
          </p>
          <Link href="/dashboard/listings/new">
            <button className="btn btn-primary">Create Your First Listing</button>
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {listings.map((listing) => (
            <div
              key={listing._id}
              style={{
                padding: "1.5rem",
                border: "1px solid rgba(128,128,128,0.2)",
                borderRadius: "0.75rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h3 style={{ marginBottom: "0.25rem" }}>{listing.title}</h3>
                <p
                  style={{
                    color: "var(--muted)",
                    fontSize: "0.9rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  {listing.tagline}
                </p>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <StatusBadge status={listing.status} />
                  <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                    {listing.pricingModel === "free"
                      ? "Free"
                      : `$${(listing.priceInCents / 100).toFixed(2)}`}
                  </span>
                  <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                    {listing.downloads} downloads
                  </span>
                  {listing.salesCount > 0 && (
                    <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                      {listing.salesCount} sales
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: "draft" | "published" | "suspended" }) {
  const colors = {
    draft: { bg: "rgba(128,128,128,0.2)", text: "#9ca3af" },
    published: { bg: "rgba(34,197,94,0.2)", text: "#22c55e" },
    suspended: { bg: "rgba(239,68,68,0.2)", text: "#ef4444" },
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
