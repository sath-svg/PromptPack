"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { useAuth, useUser, continueWithSocial } from "@/lib/auth-compat";
import { api } from "../../../../convex/_generated/api";

const DONE_PATH = "/overview";
// Max time to wait for the Stripe webhook to flip the plan to pro before
// forwarding anyway (webhook is usually 1-2s; this is just a safety net).
const WEBHOOK_WAIT_MS = 20000;

export default function SetPasswordPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const convexUser = useQuery(
    api.users.getByUserId,
    user?.id ? { userId: user.id } : "skip",
  );

  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  // True once we're done with this page and just waiting for the plan to go
  // pro (Stripe webhook) before forwarding to the gated info page.
  const [waiting, setWaiting] = useState(false);
  const waitedTooLong = useRef(false);

  const isPaid =
    convexUser?.plan === "pro" || convexUser?.plan === "studio";
  const isTemp = convexUser?.passwordIsTemporary === true;

  // Forward to the app once the plan is confirmed pro. If the webhook is slow,
  // show a "finalizing" state and let the reactive query flip us through; a
  // timeout forwards anyway so the user is never stuck.
  const goToApp = () => {
    if (isPaid) {
      window.location.assign(DONE_PATH);
    } else {
      setWaiting(true);
    }
  };

  // Returning from a social link (?linked=1): clear the temp flag, then forward.
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("linked") === "1") {
      setFinalizing(true);
      fetch("/api/account/finalize-social", { method: "POST", credentials: "include" })
        .catch(() => {})
        .finally(() => setWaiting(true));
    }
  }, []);

  // Not signed in -> sign in and come back.
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      window.location.assign("/sign-in?callback=/account/set-password");
    }
  }, [isLoaded, isSignedIn]);

  // Non-temp accounts have nothing to set here — wait for pro, then forward.
  useEffect(() => {
    if (convexUser === undefined || convexUser === null) return;
    if (!isTemp && !waiting) setWaiting(true);
  }, [convexUser, isTemp, waiting]);

  // While waiting for the webhook: forward as soon as the plan is pro, or after
  // the timeout regardless.
  useEffect(() => {
    if (!waiting) return;
    if (isPaid) {
      window.location.assign(DONE_PATH);
      return;
    }
    const t = setTimeout(() => {
      waitedTooLong.current = true;
      window.location.assign(DONE_PATH);
    }, WEBHOOK_WAIT_MS);
    return () => clearTimeout(t);
  }, [waiting, isPaid]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) return setErr("Use at least 8 characters.");
    if (pw !== pw2) return setErr("Passwords do not match.");
    setSaving(true);
    setErr("");
    try {
      const res = await fetch("/api/account/set-initial-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: pw }),
      });
      if (res.ok) {
        goToApp();
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setErr(data.error || "Could not set your password.");
      setSaving(false);
    } catch {
      setErr("Could not set your password.");
      setSaving(false);
    }
  };

  const linkSocial = (provider: "google" | "facebook") => {
    const origin = window.location.origin;
    void continueWithSocial(provider, `${origin}/account/set-password?linked=1`);
  };

  const showForm =
    isLoaded && isSignedIn && isTemp && !waiting && !finalizing;

  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-[#0a0a0c] px-5 py-12 text-zinc-100">
      <div className="w-full max-w-md rounded-3xl border border-white/[0.08] bg-[#0f0f12] p-7 md:p-9">
        {showForm ? (
          <>
            <h1 className="text-[22px] font-medium tracking-tight text-zinc-50">
              You&apos;re in. Set a password.
            </h1>
            <p className="mt-2 text-[14px] leading-[1.55] text-zinc-400">
              Your trial is active. Choose a password so you can sign back in anytime,
              or link a Google or Facebook account instead.
            </p>

            <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
              <input
                type="password"
                autoComplete="new-password"
                placeholder="New password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                className="w-full rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-[15px] text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors focus:border-[#2563EB]/60"
              />
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Confirm password"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                className="w-full rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-[15px] text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors focus:border-[#2563EB]/60"
              />
              {err && <p className="px-1 text-[13px] text-red-400">{err}</p>}
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-[#2563EB] px-6 py-3 text-[15px] font-medium text-white transition-colors hover:bg-[#1d4ed8] disabled:opacity-60"
              >
                {saving ? "Saving…" : "Set password"}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3 text-[12px] text-zinc-600">
              <span className="h-px flex-1 bg-white/10" /> or <span className="h-px flex-1 bg-white/10" />
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => linkSocial("google")}
                className="rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-[14px] text-zinc-200 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
              >
                Continue with Google
              </button>
              <button
                onClick={() => linkSocial("facebook")}
                className="rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-[14px] text-zinc-200 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
              >
                Continue with Facebook
              </button>
            </div>

            <button
              onClick={goToApp}
              className="mt-6 block w-full text-center text-[13px] text-zinc-500 underline-offset-4 hover:text-zinc-300 hover:underline"
            >
              I&apos;ll do this later
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center py-6 text-center">
            <span className="h-7 w-7 animate-spin rounded-full border-2 border-white/15 border-t-[#2563EB]" />
            <p className="mt-5 text-[15px] text-zinc-300">
              {finalizing ? "Linking your account…" : "Finalizing your trial…"}
            </p>
            <p className="mt-1 text-[12px] text-zinc-600" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
              setting up your account
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
