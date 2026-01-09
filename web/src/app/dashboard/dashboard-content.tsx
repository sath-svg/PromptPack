"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import { SavedPrompts } from "./saved-prompts";
import { ManageSubscriptionButton } from "./manage-subscription-button";
import { useEffect } from "react";
import { PromptPacks } from "./prompt-packs";
import {
  FREE_PROMPT_LIMIT,
  PRO_PROMPT_LIMIT,
  STUDIO_PROMPT_LIMIT,
  FREE_PACK_LIMIT,
  PRO_PACK_LIMIT,
  STUDIO_PACK_LIMIT,
} from "@/lib/constants";

export function DashboardContent() {
  const { user: clerkUser, isLoaded } = useUser();
  const convexUser = useQuery(
    api.users.getByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );
  const upsertUser = useMutation(api.users.upsert);
  const savedPacks = useQuery(
    api.savedPacks.listByUser,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );
  const userPacks = useQuery(
    api.packs.listByAuthor,
    convexUser?._id ? { authorId: convexUser._id } : "skip"
  );

  // Auto-sync Clerk user to Convex if not exists
  useEffect(() => {
    async function syncUser() {
      if (isLoaded && clerkUser && convexUser === null) {
        await upsertUser({
          clerkId: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress || "",
          name: clerkUser.fullName || clerkUser.firstName || undefined,
          imageUrl: clerkUser.imageUrl || undefined,
        });
      }
    }
    syncUser();
  }, [isLoaded, clerkUser, convexUser, upsertUser]);

  if (!isLoaded || convexUser === undefined) {
    return <div className="loading">Loading dashboard...</div>;
  }

  // Still syncing user to Convex
  if (convexUser === null && clerkUser) {
    return <div className="loading">Setting up your account...</div>;
  }

  const plan = convexUser?.plan ?? "free";
  const isPro = plan === "pro";
  const isStudio = plan === "studio";
  const hasPaid = isPro || isStudio;
  const planLabel = isStudio ? "studio" : isPro ? "pro" : "free";
  const planDisplay = isStudio ? "Studio" : isPro ? "Pro" : "Free";

  // Set limits based on plan
  const promptLimit = isStudio
    ? STUDIO_PROMPT_LIMIT
    : isPro
      ? PRO_PROMPT_LIMIT
      : FREE_PROMPT_LIMIT;
  const packLimit = isStudio
    ? STUDIO_PACK_LIMIT
    : isPro
      ? PRO_PACK_LIMIT
      : FREE_PACK_LIMIT;
  const packLimitLabel = packLimit < 0 ? "Unlimited" : packLimit;

  // Calculate saved prompts count
  const savedPromptsCount = savedPacks?.reduce((sum, pack) => sum + pack.promptCount, 0) ?? 0;
  const userPackPromptsCount = userPacks?.reduce((sum, pack) => sum + pack.promptCount, 0) ?? 0;
  const promptsUsedCount = isStudio ? savedPromptsCount + userPackPromptsCount : savedPromptsCount;

  return (
    <div className="dashboard">
      <h1>Welcome back, {clerkUser?.firstName || "there"}!</h1>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h2>Saved Prompts</h2>
          <p className="stat-value">{promptsUsedCount}</p>
          <p>of {promptLimit} {planLabel} prompts used</p>
          {savedPacks && savedPacks.length > 0 && (
            <div className="saved-sources">
              {savedPacks.map((pack) => (
                <span key={pack._id} className={`source-badge source-${pack.source}`}>
                  {pack.source === "chatgpt" ? "ChatGPT" : pack.source === "claude" ? "Claude" : "Gemini"}: {pack.promptCount}
                </span>
              ))}
            </div>
          )}
        </div>

        {!isStudio && (
          <div className="dashboard-card">
            <h2>Loaded Packs</h2>
            <p className="stat-value">0</p>
            <p>of {packLimitLabel} {planLabel} pack slots used</p>
          </div>
        )}

        <div className="dashboard-card">
          <h2>Current Plan</h2>
          {hasPaid ? (
            <>
              <p className="stat-value" style={{ color: "#8b5cf6" }}>{planDisplay}</p>
              <ManageSubscriptionButton />
            </>
          ) : (
            <>
              <p className="stat-value">Free</p>
              <p>
                <Link
                  href="/pricing"
                  style={{ color: "var(--accent)", textDecoration: "underline" }}
                >
                  Upgrade plan
                </Link>
              </p>
            </>
          )}
        </div>

        <div className="dashboard-card">
          <h2>Purchased Packs</h2>
          <p className="stat-value">0</p>
          <p>
            <Link
              href="/marketplace"
              style={{ color: "var(--accent)", textDecoration: "underline" }}
            >
              Browse marketplace
            </Link>
          </p>
        </div>

        {isStudio && (
          <div className="dashboard-card">
            <h2>Your Listings</h2>
            <p className="stat-value">📦</p>
            <p>
              <Link
                href="/dashboard/listings"
                style={{ color: "var(--accent)", textDecoration: "underline" }}
              >
                Manage listings
              </Link>
            </p>
          </div>
        )}
      </div>

      {/* Saved Prompts Section */}
      <div className="dashboard-section">
        {convexUser?._id && clerkUser?.id && (
          <PromptPacks userId={convexUser._id} hasPro={hasPaid} clerkId={clerkUser.id} savedPromptsCount={promptsUsedCount} />
        )}
      </div>

      {/* Saved Prompts Section */}
      <div className="dashboard-section">
        <h2>Your Saved Prompts</h2>
        {convexUser?._id && <SavedPrompts userId={convexUser._id} />}
      </div>
    </div>
  );
}
