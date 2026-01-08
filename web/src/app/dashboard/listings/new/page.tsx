"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Id } from "../../../../../convex/_generated/dataModel";

type Step = 1 | 2 | 3 | 4;

export default function NewListingPage() {
  const router = useRouter();
  const { user: clerkUser, isLoaded } = useUser();
  const convexUser = useQuery(
    api.users.getByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );

  // Get user's packs to select from
  const userPacks = useQuery(
    api.packs.listByAuthor,
    convexUser?._id ? { authorId: convexUser._id } : "skip"
  );

  const createListing = useMutation(api.listings.create);
  const publishListing = useMutation(api.listings.publish);

  const [step, setStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedPackId, setSelectedPackId] = useState<Id<"userPacks"> | null>(null);
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

  if (!isLoaded || convexUser === undefined) {
    return <div className="loading">Loading...</div>;
  }

  const isStudio = convexUser?.plan === "studio";

  if (!isStudio) {
    router.push("/dashboard/listings");
    return null;
  }

  const selectedPack = userPacks?.find((p) => p._id === selectedPackId);

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

  const handleSubmit = async (publish: boolean) => {
    if (!selectedPackId || !convexUser?._id) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const listingId = await createListing({
        packId: selectedPackId,
        authorId: convexUser._id,
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

      if (publish) {
        await publishListing({ id: listingId });
      }

      router.push("/dashboard/listings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create listing");
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return selectedPackId !== null;
      case 2:
        return title.trim() && tagline.trim() && description.trim() && tags.length > 0;
      case 3:
        return pricingModel === "free" || priceInCents > 0;
      case 4:
        return true;
      default:
        return false;
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

      <h1 style={{ marginBottom: "0.5rem" }}>Create Listing</h1>
      <p style={{ color: "var(--muted)", marginBottom: "2rem" }}>
        Step {step} of 4
      </p>

      {/* Progress bar */}
      <div
        style={{
          height: "4px",
          background: "rgba(128,128,128,0.2)",
          borderRadius: "2px",
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${(step / 4) * 100}%`,
            background: "var(--accent)",
            borderRadius: "2px",
            transition: "width 0.3s",
          }}
        />
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

      {/* Step 1: Select Pack */}
      {step === 1 && (
        <div>
          <h2 style={{ marginBottom: "1rem" }}>Select a PromptPack</h2>
          <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>
            Choose which pack you want to list on the marketplace.
          </p>

          {userPacks === undefined ? (
            <div className="loading">Loading packs...</div>
          ) : userPacks.length === 0 ? (
            <div
              style={{
                padding: "2rem",
                textAlign: "center",
                border: "1px dashed rgba(128,128,128,0.3)",
                borderRadius: "0.75rem",
              }}
            >
              <p style={{ color: "var(--muted)", marginBottom: "1rem" }}>
                You don&apos;t have any packs yet.
              </p>
              <Link href="/dashboard">
                <button className="btn btn-primary">Create a Pack</button>
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {userPacks.map((pack) => (
                <button
                  key={pack._id}
                  onClick={() => setSelectedPackId(pack._id)}
                  style={{
                    padding: "1rem",
                    border: selectedPackId === pack._id
                      ? "2px solid var(--accent)"
                      : "1px solid rgba(128,128,128,0.2)",
                    borderRadius: "0.75rem",
                    background: selectedPackId === pack._id
                      ? "rgba(99,102,241,0.05)"
                      : "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div style={{ fontWeight: "600" }}>{pack.title}</div>
                  <div style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
                    {pack.promptCount} prompts
                    {pack.description && ` - ${pack.description}`}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Metadata */}
      {step === 2 && (
        <div>
          <h2 style={{ marginBottom: "1rem" }}>Listing Details</h2>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Ultimate SEO Writing Prompts"
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid rgba(128,128,128,0.3)",
                borderRadius: "0.5rem",
                background: "var(--bg-secondary)",
              }}
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
              Tagline *
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="A short one-liner description"
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid rgba(128,128,128,0.3)",
                borderRadius: "0.5rem",
                background: "var(--bg-secondary)",
              }}
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Full description (supports markdown)"
              rows={5}
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

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
              Tags * (up to 5)
            </label>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                placeholder="Add a tag"
                style={{
                  flex: 1,
                  padding: "0.5rem",
                  border: "1px solid rgba(128,128,128,0.3)",
                  borderRadius: "0.5rem",
                  background: "var(--bg-secondary)",
                }}
              />
              <button
                onClick={handleAddTag}
                disabled={tags.length >= 5}
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
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Pricing */}
      {step === 3 && (
        <div>
          <h2 style={{ marginBottom: "1rem" }}>Pricing & License</h2>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
              Pricing Model
            </label>
            <div style={{ display: "flex", gap: "1rem" }}>
              <button
                onClick={() => setPricingModel("free")}
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
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: "600" }}>Free</div>
                <div style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
                  Available to everyone
                </div>
              </button>
              <button
                onClick={() => setPricingModel("paid")}
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
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: "600" }}>Paid</div>
                <div style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
                  Set your own price
                </div>
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
                  placeholder="9.99"
                  style={{
                    width: "120px",
                    padding: "0.75rem",
                    border: "1px solid rgba(128,128,128,0.3)",
                    borderRadius: "0.5rem",
                    background: "var(--bg-secondary)",
                  }}
                />
              </div>
              <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                You&apos;ll earn 85% after the 15% platform fee
              </p>
            </div>
          )}

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
              License Type
            </label>
            <select
              value={license}
              onChange={(e) => setLicense(e.target.value as typeof license)}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid rgba(128,128,128,0.3)",
                borderRadius: "0.5rem",
                background: "var(--bg-secondary)",
              }}
            >
              <option value="personal">Personal Use</option>
              <option value="commercial">Commercial Use</option>
              <option value="team">Team License</option>
            </select>
          </div>
        </div>
      )}

      {/* Step 4: Optional Marketing */}
      {step === 4 && (
        <div>
          <h2 style={{ marginBottom: "1rem" }}>Marketing (Optional)</h2>
          <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>
            Add extra details to help your listing stand out.
          </p>

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
                placeholder="Key feature or benefit"
                style={{
                  flex: 1,
                  padding: "0.5rem",
                  border: "1px solid rgba(128,128,128,0.3)",
                  borderRadius: "0.5rem",
                  background: "var(--bg-secondary)",
                }}
              />
              <button
                onClick={handleAddBullet}
                disabled={bulletPoints.length >= 3}
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
              placeholder="Show an example of how to use your prompts"
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

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
              Example Output
            </label>
            <textarea
              value={exampleOutput}
              onChange={(e) => setExampleOutput(e.target.value)}
              placeholder="Show the kind of output users can expect"
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

          {/* Preview */}
          <div
            style={{
              padding: "1.5rem",
              border: "1px solid rgba(128,128,128,0.2)",
              borderRadius: "0.75rem",
              background: "rgba(128,128,128,0.05)",
            }}
          >
            <h3 style={{ marginBottom: "0.5rem" }}>Preview</h3>
            <h4 style={{ marginBottom: "0.25rem" }}>{title || "Your Title"}</h4>
            <p style={{ color: "var(--muted)", marginBottom: "0.5rem" }}>
              {tagline || "Your tagline"}
            </p>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
              {tags.map((tag, i) => (
                <span
                  key={i}
                  style={{
                    padding: "0.25rem 0.5rem",
                    background: "rgba(99,102,241,0.1)",
                    borderRadius: "999px",
                    fontSize: "0.75rem",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
            <p style={{ fontWeight: "600" }}>
              {pricingModel === "free" ? "Free" : `$${(priceInCents / 100).toFixed(2)}`}
            </p>
            {selectedPack && (
              <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                {selectedPack.promptCount} prompts
              </p>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "2rem",
          paddingTop: "1rem",
          borderTop: "1px solid rgba(128,128,128,0.2)",
        }}
      >
        <button
          onClick={() => setStep((s) => (s - 1) as Step)}
          disabled={step === 1}
          className="btn btn-secondary"
        >
          Back
        </button>

        {step < 4 ? (
          <button
            onClick={() => setStep((s) => (s + 1) as Step)}
            disabled={!canProceed()}
            className="btn btn-primary"
          >
            Continue
          </button>
        ) : (
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
              className="btn btn-secondary"
            >
              Save as Draft
            </button>
            <button
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting}
              className="btn btn-primary"
            >
              {isSubmitting ? "Publishing..." : "Publish"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
