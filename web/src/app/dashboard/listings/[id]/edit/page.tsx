"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Id } from "../../../../../../convex/_generated/dataModel";

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams();
  const listingId = params.id as Id<"marketplaceListings">;

  const { user: clerkUser, isLoaded } = useUser();
  const convexUser = useQuery(
    api.users.getByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );

  const listing = useQuery(api.listings.get, { id: listingId });
  const updateListing = useMutation(api.listings.update);
  const publishListing = useMutation(api.listings.publish);
  const unpublishListing = useMutation(api.listings.unpublish);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [pricingModel, setPricingModel] = useState<"free" | "paid">("free");
  const [priceInCents, setPriceInCents] = useState(0);
  const [license, setLicense] = useState<"personal" | "commercial" | "team">("personal");
  const [bulletPoints, setBulletPoints] = useState<string[]>([]);
  const [bulletInput, setBulletInput] = useState("");
  const [exampleInput, setExampleInput] = useState("");
  const [exampleOutput, setExampleOutput] = useState("");

  // Populate form when listing loads
  useEffect(() => {
    if (listing) {
      setTitle(listing.title);
      setTagline(listing.tagline);
      setDescription(listing.description);
      setTags(listing.tags);
      setPricingModel(listing.pricingModel);
      setPriceInCents(listing.priceInCents);
      setLicense(listing.license);
      setBulletPoints(listing.bulletPoints || []);
      setExampleInput(listing.exampleInput || "");
      setExampleOutput(listing.exampleOutput || "");
    }
  }, [listing]);

  if (!isLoaded || convexUser === undefined || listing === undefined) {
    return <div className="loading">Loading...</div>;
  }

  if (!listing) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <h2>Listing not found</h2>
        <Link href="/dashboard/listings">
          <button className="btn btn-primary" style={{ marginTop: "1rem" }}>
            Back to Listings
          </button>
        </Link>
      </div>
    );
  }

  // Check ownership
  if (listing.authorId !== convexUser?._id) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <h2>Access Denied</h2>
        <p style={{ color: "var(--muted)" }}>You don&apos;t have permission to edit this listing.</p>
      </div>
    );
  }

  const isSuspended = listing.status === "suspended";

  const handleAddTag = () => {
    if (tagInput.trim() && tags.length < 5) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleAddBullet = () => {
    if (bulletInput.trim() && bulletPoints.length < 3) {
      setBulletPoints([...bulletPoints, bulletInput.trim()]);
      setBulletInput("");
    }
  };

  const handleRemoveBullet = (index: number) => {
    setBulletPoints(bulletPoints.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await updateListing({
        id: listingId,
        title,
        tagline,
        description,
        tags,
        pricingModel,
        priceInCents: pricingModel === "free" ? 0 : priceInCents,
        license,
        bulletPoints: bulletPoints.length > 0 ? bulletPoints : undefined,
        exampleInput: exampleInput || undefined,
        exampleOutput: exampleOutput || undefined,
      });

      setSuccess("Changes saved successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await publishListing({ id: listingId });
      router.push("/dashboard/listings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish");
      setIsSubmitting(false);
    }
  };

  const handleUnpublish = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await unpublishListing({ id: listingId });
      router.push("/dashboard/listings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unpublish");
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <Link
          href="/dashboard/listings"
          style={{ color: "var(--muted)", fontSize: "0.9rem" }}
        >
          &larr; Back to Listings
        </Link>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ marginBottom: "0.25rem" }}>Edit Listing</h1>
          <StatusBadge status={listing.status} />
        </div>
        {listing.status === "published" && (
          <Link href={`/marketplace/${listingId}`}>
            <button className="btn btn-secondary">View Live</button>
          </Link>
        )}
      </div>

      {isSuspended && (
        <div
          style={{
            padding: "1rem",
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "0.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <strong style={{ color: "#ef4444" }}>This listing is suspended</strong>
          <p style={{ color: "var(--muted)", marginTop: "0.25rem" }}>
            {listing.suspendedReason || "Contact support for more information."}
          </p>
        </div>
      )}

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

      {success && (
        <div
          style={{
            padding: "1rem",
            background: "rgba(34,197,94,0.1)",
            border: "1px solid rgba(34,197,94,0.3)",
            borderRadius: "0.5rem",
            color: "#22c55e",
            marginBottom: "1rem",
          }}
        >
          {success}
        </div>
      )}

      {/* Form fields */}
      <div style={{ marginBottom: "1.5rem" }}>
        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isSuspended}
          style={{
            width: "100%",
            padding: "0.75rem",
            border: "1px solid rgba(128,128,128,0.3)",
            borderRadius: "0.5rem",
            background: "var(--bg-secondary)",
            opacity: isSuspended ? 0.5 : 1,
          }}
        />
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
          Tagline
        </label>
        <input
          type="text"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          disabled={isSuspended}
          style={{
            width: "100%",
            padding: "0.75rem",
            border: "1px solid rgba(128,128,128,0.3)",
            borderRadius: "0.5rem",
            background: "var(--bg-secondary)",
            opacity: isSuspended ? 0.5 : 1,
          }}
        />
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isSuspended}
          rows={5}
          style={{
            width: "100%",
            padding: "0.75rem",
            border: "1px solid rgba(128,128,128,0.3)",
            borderRadius: "0.5rem",
            background: "var(--bg-secondary)",
            resize: "vertical",
            opacity: isSuspended ? 0.5 : 1,
          }}
        />
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
          Tags (up to 5)
        </label>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
            disabled={isSuspended}
            placeholder="Add a tag"
            style={{
              flex: 1,
              padding: "0.5rem",
              border: "1px solid rgba(128,128,128,0.3)",
              borderRadius: "0.5rem",
              background: "var(--bg-secondary)",
              opacity: isSuspended ? 0.5 : 1,
            }}
          />
          <button
            onClick={handleAddTag}
            disabled={tags.length >= 5 || isSuspended}
            className="btn btn-secondary"
            style={{ padding: "0.5rem 1rem" }}
          >
            Add
          </button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {tags.map((tag, i) => (
            <span
              key={i}
              style={{
                padding: "0.25rem 0.75rem",
                background: "rgba(99,102,241,0.1)",
                borderRadius: "999px",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              {tag}
              {!isSuspended && (
                <button
                  onClick={() => handleRemoveTag(i)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    color: "var(--muted)",
                  }}
                >
                  &times;
                </button>
              )}
            </span>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
          Pricing Model
        </label>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            onClick={() => !isSuspended && setPricingModel("free")}
            disabled={isSuspended}
            style={{
              flex: 1,
              padding: "1rem",
              border: pricingModel === "free"
                ? "2px solid var(--accent)"
                : "1px solid rgba(128,128,128,0.2)",
              borderRadius: "0.75rem",
              background: pricingModel === "free"
                ? "rgba(99,102,241,0.05)"
                : "transparent",
              cursor: isSuspended ? "not-allowed" : "pointer",
              opacity: isSuspended ? 0.5 : 1,
            }}
          >
            <div style={{ fontWeight: "600" }}>Free</div>
          </button>
          <button
            onClick={() => !isSuspended && setPricingModel("paid")}
            disabled={isSuspended}
            style={{
              flex: 1,
              padding: "1rem",
              border: pricingModel === "paid"
                ? "2px solid var(--accent)"
                : "1px solid rgba(128,128,128,0.2)",
              borderRadius: "0.75rem",
              background: pricingModel === "paid"
                ? "rgba(99,102,241,0.05)"
                : "transparent",
              cursor: isSuspended ? "not-allowed" : "pointer",
              opacity: isSuspended ? 0.5 : 1,
            }}
          >
            <div style={{ fontWeight: "600" }}>Paid</div>
          </button>
        </div>
      </div>

      {pricingModel === "paid" && (
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
            Price (USD)
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.25rem" }}>$</span>
            <input
              type="number"
              min="1"
              step="0.01"
              value={priceInCents / 100 || ""}
              onChange={(e) => setPriceInCents(Math.round(parseFloat(e.target.value || "0") * 100))}
              disabled={isSuspended}
              style={{
                width: "120px",
                padding: "0.75rem",
                border: "1px solid rgba(128,128,128,0.3)",
                borderRadius: "0.5rem",
                background: "var(--bg-secondary)",
                opacity: isSuspended ? 0.5 : 1,
              }}
            />
          </div>
        </div>
      )}

      <div style={{ marginBottom: "1.5rem" }}>
        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
          License Type
        </label>
        <select
          value={license}
          onChange={(e) => setLicense(e.target.value as typeof license)}
          disabled={isSuspended}
          style={{
            width: "100%",
            padding: "0.75rem",
            border: "1px solid rgba(128,128,128,0.3)",
            borderRadius: "0.5rem",
            background: "var(--bg-secondary)",
            opacity: isSuspended ? 0.5 : 1,
          }}
        >
          <option value="personal">Personal Use</option>
          <option value="commercial">Commercial Use</option>
          <option value="team">Team License</option>
        </select>
      </div>

      {/* Optional fields */}
      <div style={{ marginBottom: "1.5rem" }}>
        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
          Bullet Points (up to 3)
        </label>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <input
            type="text"
            value={bulletInput}
            onChange={(e) => setBulletInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddBullet())}
            disabled={isSuspended}
            placeholder="Key feature or benefit"
            style={{
              flex: 1,
              padding: "0.5rem",
              border: "1px solid rgba(128,128,128,0.3)",
              borderRadius: "0.5rem",
              background: "var(--bg-secondary)",
              opacity: isSuspended ? 0.5 : 1,
            }}
          />
          <button
            onClick={handleAddBullet}
            disabled={bulletPoints.length >= 3 || isSuspended}
            className="btn btn-secondary"
            style={{ padding: "0.5rem 1rem" }}
          >
            Add
          </button>
        </div>
        <ul style={{ paddingLeft: "1.5rem" }}>
          {bulletPoints.map((bullet, i) => (
            <li key={i} style={{ marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {bullet}
              {!isSuspended && (
                <button
                  onClick={() => handleRemoveBullet(i)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    color: "var(--muted)",
                  }}
                >
                  &times;
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
          Example Input
        </label>
        <textarea
          value={exampleInput}
          onChange={(e) => setExampleInput(e.target.value)}
          disabled={isSuspended}
          rows={3}
          style={{
            width: "100%",
            padding: "0.75rem",
            border: "1px solid rgba(128,128,128,0.3)",
            borderRadius: "0.5rem",
            background: "var(--bg-secondary)",
            resize: "vertical",
            opacity: isSuspended ? 0.5 : 1,
          }}
        />
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
          Example Output
        </label>
        <textarea
          value={exampleOutput}
          onChange={(e) => setExampleOutput(e.target.value)}
          disabled={isSuspended}
          rows={3}
          style={{
            width: "100%",
            padding: "0.75rem",
            border: "1px solid rgba(128,128,128,0.3)",
            borderRadius: "0.5rem",
            background: "var(--bg-secondary)",
            resize: "vertical",
            opacity: isSuspended ? 0.5 : 1,
          }}
        />
      </div>

      {/* Stats */}
      <div
        style={{
          padding: "1rem",
          background: "rgba(128,128,128,0.05)",
          borderRadius: "0.75rem",
          marginBottom: "1.5rem",
        }}
      >
        <h3 style={{ marginBottom: "0.5rem", fontSize: "0.9rem" }}>Stats</h3>
        <div style={{ display: "flex", gap: "2rem" }}>
          <div>
            <div style={{ fontSize: "1.5rem", fontWeight: "700" }}>{listing.downloads}</div>
            <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Downloads</div>
          </div>
          <div>
            <div style={{ fontSize: "1.5rem", fontWeight: "700" }}>{listing.salesCount}</div>
            <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Sales</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          paddingTop: "1rem",
          borderTop: "1px solid rgba(128,128,128,0.2)",
        }}
      >
        <div>
          {listing.status === "published" && (
            <button
              onClick={handleUnpublish}
              disabled={isSubmitting}
              className="btn btn-secondary"
              style={{ color: "#ef4444" }}
            >
              Unpublish
            </button>
          )}
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={handleSave}
            disabled={isSubmitting || isSuspended}
            className="btn btn-secondary"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
          {listing.status === "draft" && (
            <button
              onClick={handlePublish}
              disabled={isSubmitting || isSuspended}
              className="btn btn-primary"
            >
              Publish
            </button>
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
