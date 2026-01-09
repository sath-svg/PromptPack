"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Id } from "../../../../../convex/_generated/dataModel";

export default function CheckoutPage() {
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

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already purchased
  useEffect(() => {
    if (hasPurchased) {
      router.push(`/marketplace/${listingId}?purchased=true`);
    }
  }, [hasPurchased, listingId, router]);

  // Redirect if free pack
  useEffect(() => {
    if (listing && listing.pricingModel === "free") {
      router.push(`/marketplace/${listingId}`);
    }
  }, [listing, listingId, router]);

  const handleCheckout = async () => {
    if (!clerkUser || !listing) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/purchases/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Checkout failed");
      }

      const data = await response.json();
      if (data.url) {
        window.location.assign(data.url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setIsLoading(false);
    }
  };

  if (!isLoaded || listing === undefined) {
    return <div className="loading">Loading...</div>;
  }

  if (!clerkUser) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <h2>Sign in to continue</h2>
        <Link href="/sign-in">
          <button className="btn btn-primary" style={{ marginTop: "1rem" }}>
            Sign In
          </button>
        </Link>
      </div>
    );
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

  return (
    <div style={{ maxWidth: "500px", margin: "0 auto" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <Link
          href={`/marketplace/${listingId}`}
          style={{ color: "#959199", fontSize: "0.9rem" }}
        >
          &larr; Back to Listing
        </Link>
      </div>

      <h1 style={{ marginBottom: "2rem" }}>Checkout</h1>

      {/* Order summary */}
      <div
        style={{
          padding: "1.5rem",
          border: "1px solid rgba(128,128,128,0.2)",
          borderRadius: "0.75rem",
          marginBottom: "1.5rem",
        }}
      >
        <h2 style={{ fontSize: "1rem", marginBottom: "1rem", color: "#959199" }}>
          Order Summary
        </h2>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "1rem",
            paddingBottom: "1rem",
            borderBottom: "1px solid rgba(128,128,128,0.2)",
          }}
        >
          <div>
            <div style={{ fontWeight: "600" }}>{listing.title}</div>
            <div style={{ color: "#959199", fontSize: "0.9rem" }}>
              {listing.pack?.promptCount} prompts
            </div>
            <div style={{ color: "#959199", fontSize: "0.85rem" }}>
              {listing.license.charAt(0).toUpperCase() + listing.license.slice(1)} License
            </div>
          </div>
          <div style={{ fontWeight: "600" }}>
            ${(listing.priceInCents / 100).toFixed(2)}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontWeight: "700",
            fontSize: "1.25rem",
          }}
        >
          <span>Total</span>
          <span>${(listing.priceInCents / 100).toFixed(2)}</span>
        </div>
      </div>

      {/* Info */}
      <div
        style={{
          padding: "1rem",
          background: "rgba(99,102,241,0.05)",
          borderRadius: "0.5rem",
          marginBottom: "1.5rem",
          fontSize: "0.9rem",
        }}
      >
        <p style={{ marginBottom: "0.5rem" }}>
          <strong>7-day refund policy</strong>
        </p>
        <p style={{ color: "#959199" }}>
          If you&apos;re not satisfied, you can request a refund within 7 days of purchase.
        </p>
      </div>

      {error && (
        <div
          style={{
            padding: "1rem",
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "0.5rem",
            color: "#ef4444",
            marginBottom: "1rem",
          }}
        >
          {error}
        </div>
      )}

      {/* Checkout button */}
      <button
        className="btn btn-primary"
        style={{ width: "100%", padding: "1rem" }}
        onClick={handleCheckout}
        disabled={isLoading}
      >
        {isLoading ? "Redirecting to payment..." : `Pay $${(listing.priceInCents / 100).toFixed(2)}`}
      </button>

      <p
        style={{
          textAlign: "center",
          color: "#959199",
          fontSize: "0.85rem",
          marginTop: "1rem",
        }}
      >
        Secure payment powered by Stripe
      </p>
    </div>
  );
}
