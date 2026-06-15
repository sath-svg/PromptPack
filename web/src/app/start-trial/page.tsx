"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { useAuth, useUser } from "@/lib/auth-compat";
import { startStripeCheckout } from "@/lib/billing-client";
import { TRIAL_CTA_HREF, TRIAL_SUCCESS_PATH } from "@/lib/cta";
import { api } from "../../../convex/_generated/api";

/**
 * Universal trial funnel entry. Reused by the homepage email gate, the
 * /prompts + /skillsets clickable assets, the pricing CTAs, and the nav.
 *
 * Signed out         -> bounce to sign-up, which returns here once signed in.
 * Already subscribed -> skip checkout, go straight to the info page.
 * Otherwise          -> launch the 3-day Pro trial checkout.
 */
export default function StartTrialPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const convexUser = useQuery(
    api.users.getByUserId,
    user?.id ? { userId: user.id } : "skip",
  );
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      window.location.assign(`/sign-up?callback=${encodeURIComponent(TRIAL_CTA_HREF)}`);
      return;
    }

    // Wait until we know the user's plan before deciding to charge.
    if (convexUser === undefined) return;
    if (started.current) return;
    started.current = true;

    // Already on a paid plan — don't start a second trial/checkout.
    if (convexUser && (convexUser.plan === "pro" || convexUser.plan === "studio")) {
      window.location.assign(TRIAL_SUCCESS_PATH);
      return;
    }

    startStripeCheckout({
      interval: "annual",
      plan: "pro",
      trial: true,
      successPath: TRIAL_SUCCESS_PATH,
    }).catch((e) => {
      started.current = false;
      setError(e instanceof Error ? e.message : "Could not start your trial");
    });
  }, [isLoaded, isSignedIn, convexUser]);

  return (
    <div className="flex min-h-[100dvh] w-full flex-col items-center justify-center bg-[#0a0a0c] px-6 text-center text-zinc-100">
      {error ? (
        <>
          <p className="text-[16px] text-zinc-200">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-full bg-[#2563EB] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8]"
          >
            Try again
          </button>
          <a href="/pricing" className="mt-4 text-[13px] text-zinc-500 underline-offset-4 hover:underline">
            View plans instead
          </a>
        </>
      ) : (
        <>
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-white/15 border-t-[#2563EB]" />
          <p className="mt-5 text-[15px] text-zinc-300">Starting your 3-day free trial…</p>
          <p className="mt-1 text-[12px] text-zinc-600" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
            redirecting to secure checkout
          </p>
        </>
      )}
    </div>
  );
}
