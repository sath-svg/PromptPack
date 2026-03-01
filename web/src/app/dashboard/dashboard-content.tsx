"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import { SavedPrompts } from "./saved-prompts";
import { ManageSubscriptionButton } from "./manage-subscription-button";
import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PromptPacks } from "./prompt-packs";
import { FREE_PROMPT_LIMIT, PRO_PROMPT_LIMIT, STUDIO_PROMPT_LIMIT, FREE_PACK_LIMIT, PRO_PACK_LIMIT, STUDIO_PACK_LIMIT } from "@/lib/constants";
import { trackEvent, trackLinkedInConversion } from "@/lib/analytics";
import { TutorialOverlay } from "@/components/onboarding/tutorial-overlay";

export function DashboardContent() {
  const { user: clerkUser, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
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
  const completeOnboarding = useMutation(api.users.completeOnboarding);
  const [toast, setToast] = useState<string | null>(null);
  const signupTracked = useRef(false);

  // Auto-sync Clerk user to Convex if not exists
  useEffect(() => {
    async function syncUser() {
      if (isLoaded && clerkUser && convexUser === null) {
        // Track first-time sign-up
        if (!signupTracked.current) {
          signupTracked.current = true;
          trackEvent("sign-up");
          trackLinkedInConversion(24381820);
        }
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

  // Track post-checkout success
  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      trackEvent("subscription-activated", { plan: "pro" });
      trackLinkedInConversion(24381828);
      setToast("You're now on Pro! Enjoy 40 prompts, evaluation, and more.");
      router.replace("/dashboard");
    }
  }, [searchParams, router]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (!isLoaded || convexUser === undefined) {
    return <div className="loading">Loading dashboard...</div>;
  }

  // Still syncing user to Convex
  if (convexUser === null && clerkUser) {
    return <div className="loading">Setting up your account...</div>;
  }

  // Check if user has Pro or Studio plan
  const isStudio = convexUser?.plan === "studio";
  const hasPro = convexUser?.plan === "pro" || isStudio;

  // Set limits based on plan
  const promptLimit = isStudio ? STUDIO_PROMPT_LIMIT : (hasPro ? PRO_PROMPT_LIMIT : FREE_PROMPT_LIMIT);
  const packLimit = isStudio ? STUDIO_PACK_LIMIT : (hasPro ? PRO_PACK_LIMIT : FREE_PACK_LIMIT);

  // Calculate saved prompts count
  const savedPromptsCount = savedPacks?.reduce((sum, pack) => sum + pack.promptCount, 0) ?? 0;
  const userPackPromptsCount = userPacks?.reduce((sum, pack) => sum + pack.promptCount, 0) ?? 0;
  const adjustedPromptLimit = Math.max(0, promptLimit - userPackPromptsCount);

  const usagePercent = adjustedPromptLimit > 0 ? Math.min(100, (savedPromptsCount / adjustedPromptLimit) * 100) : 100;
  const isNearLimit = !hasPro && !isStudio && savedPromptsCount >= adjustedPromptLimit - 1;
  const isAtLimit = !hasPro && !isStudio && savedPromptsCount >= adjustedPromptLimit;

  // Show tutorial for first-time free users with no saved prompts
  const showTutorial =
    convexUser?.onboardingCompleted !== true &&
    isLoaded &&
    !hasPro &&
    !isStudio &&
    savedPromptsCount === 0;

  const handleCompleteOnboarding = async () => {
    if (clerkUser?.id) {
      await completeOnboarding({ clerkId: clerkUser.id });
    }
  };

  return (
    <div className="dashboard">
      {toast && (
        <div style={{
          position: "fixed", top: "1rem", right: "1rem", zIndex: 1000,
          background: "#10b981", color: "white", padding: "0.75rem 1.25rem",
          borderRadius: "0.5rem", fontSize: "0.9rem", fontWeight: 500,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)", animation: "fadeIn 0.3s ease",
        }}>
          {toast}
        </div>
      )}

      {showTutorial && (
        <TutorialOverlay onComplete={handleCompleteOnboarding} />
      )}

      <h1>Welcome back, {clerkUser?.firstName || "there"}!</h1>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h2>Saved Prompts</h2>
          <p className="stat-value">{savedPromptsCount}</p>
          <div style={{ marginTop: "0.25rem" }}>
            <div style={{
              height: "6px", borderRadius: "3px",
              background: "rgba(128,128,128,0.2)",
              overflow: "hidden",
            }}>
              <div style={{
                height: "100%",
                width: `${usagePercent}%`,
                background: isAtLimit ? "#ef4444" : isNearLimit ? "#f59e0b" : "var(--accent)",
                borderRadius: "3px",
                transition: "width 0.3s ease",
              }} />
            </div>
            <p style={{ fontSize: "0.85rem", marginTop: "0.35rem", color: "var(--muted)" }}>
              {savedPromptsCount} of {adjustedPromptLimit} prompts used
              {isNearLimit && (
                <Link href="/pricing" style={{ color: "var(--accent)", marginLeft: "0.5rem", textDecoration: "underline" }}>
                  Upgrade for {PRO_PROMPT_LIMIT} →
                </Link>
              )}
            </p>
          </div>
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

        <div className="dashboard-card">
          <h2>Loaded Packs</h2>
          <p className="stat-value">0</p>
          <p>of {packLimit} {isStudio ? "studio" : (hasPro ? "pro" : "free")} pack slots used</p>
        </div>

        <div className="dashboard-card">
          <h2>Current Plan</h2>
          {isStudio ? (
            <>
              <p className="stat-value" style={{ background: "linear-gradient(135deg, #8b5cf6, #d946ef)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Studio</p>
              <ManageSubscriptionButton />
            </>
          ) : hasPro ? (
            <>
              <p className="stat-value" style={{ color: "#8b5cf6" }}>Pro</p>
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
                  Upgrade to Pro
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
      </div>

      {/* Saved Prompts Section */}
      <div className="dashboard-section">
        {convexUser?._id && clerkUser?.id && (
          <PromptPacks userId={convexUser._id} hasPro={hasPro} isStudio={isStudio} clerkId={clerkUser.id} savedPromptsCount={savedPromptsCount} />
        )}
      </div>

      {/* Saved Prompts Section */}
      <div className="dashboard-section">
        <h2>Your Saved Prompts</h2>
        {convexUser?._id && clerkUser?.id && (
          <SavedPrompts
            userId={convexUser._id}
            hasPro={hasPro}
            isStudio={isStudio}
            clerkId={clerkUser.id}
          />
        )}
      </div>
    </div>
  );
}
