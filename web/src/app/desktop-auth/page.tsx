"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth, useUser, useClerk, SignIn } from "@clerk/nextjs";
import { Layers3, Check } from "lucide-react";
import { SkillsetShell } from "@/components/skillset-shell";

/**
 * Desktop Auth page for Tauri desktop app OAuth flow
 *
 * Flow:
 * 1. Desktop app opens this page in a popup WebView window
 * 2. If already signed in, show confirmation with option to switch accounts
 * 3. User signs in via Clerk (or confirms current account)
 * 4. This page redirects to /desktop-callback?token=xxx&name=xxx&email=xxx&image=xxx
 * 5. The Tauri app intercepts the navigation, extracts the data, and closes the popup
 */
export default function DesktopAuthPage() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [launched, setLaunched] = useState(false);
  const [switchingAccount, setSwitchingAccount] = useState(false);
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (isLoaded && isSignedIn && user && switchingAccount) {
      setSwitchingAccount(false);
    }
  }, [isLoaded, isSignedIn, user, switchingAccount]);

  const isDesktopSource =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("source") === "desktop";

  const getAppName = () => {
    if (typeof window === "undefined") return "promptpack";
    return new URLSearchParams(window.location.search).get("app") || "promptpack";
  };

  const handleContinue = async () => {
    if (!user || hasRedirected.current) return;

    hasRedirected.current = true;
    setProcessing(true);

    try {
      const token = await getToken();
      if (!token) {
        setError("Failed to get authentication token");
        setProcessing(false);
        hasRedirected.current = false;
        return;
      }

      const firstName = user.firstName || "";
      const lastName = user.lastName || "";
      const name = [firstName, lastName].filter(Boolean).join(" ") || user.username || "";
      const email = user.primaryEmailAddress?.emailAddress || "";
      const image = user.imageUrl || "";

      if (isDesktopSource) {
        const params = new URLSearchParams({
          token,
          name,
          email,
          image_url: image,
          user_id: user.id,
        });
        const appName = getAppName();
        window.location.href = `${appName}://auth?${params.toString()}`;
        setTimeout(() => {
          setProcessing(false);
          setLaunched(true);
        }, 500);
      } else {
        const callbackUrl = new URL("/desktop-callback", window.location.origin);
        callbackUrl.searchParams.set("token", token);
        callbackUrl.searchParams.set("name", name);
        callbackUrl.searchParams.set("email", email);
        callbackUrl.searchParams.set("image", image);
        callbackUrl.searchParams.set("user_id", user.id);
        window.location.href = callbackUrl.toString();
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError("Authentication failed. Please try again.");
      setProcessing(false);
      hasRedirected.current = false;
    }
  };

  const handleSwitchAccount = async () => {
    setProcessing(true);
    setSwitchingAccount(true);
    hasRedirected.current = false;
    setLaunched(false);
    try {
      const appName = getAppName();
      const redirectUrl = isDesktopSource
        ? `/desktop-auth?source=desktop&app=${encodeURIComponent(appName)}`
        : "/desktop-auth";
      await signOut({ redirectUrl });
      setProcessing(false);
    } catch (err) {
      console.error("Sign out error:", err);
      setProcessing(false);
      setSwitchingAccount(false);
    }
  };

  const SkillsetMark = (
    <div className="grid h-14 w-14 place-items-center rounded-2xl border border-[#2563EB]/20 bg-[#2563EB]/15 text-[#7BA7FF]">
      <Layers3 strokeWidth={1.75} className="h-6 w-6" />
    </div>
  );

  if (error) {
    return (
      <SkillsetShell showNav={false}>
        <section className="flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-2xl border border-red-500/30 bg-red-500/10 text-[20px] text-red-400">
            ✕
          </div>
          <h1 className="mt-6 text-[20px] font-medium text-zinc-50">
            Authentication error
          </h1>
          <p className="mt-2 max-w-[40ch] text-[14px] text-zinc-400">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setProcessing(false);
              hasRedirected.current = false;
            }}
            style={{ padding: "10px 22px" }}
            className="mt-6 rounded-full bg-[#2563EB] text-[14px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition-all hover:bg-[#1d4ed8]"
          >
            Try Again
          </button>
        </section>
      </SkillsetShell>
    );
  }

  if (isLoaded && isSignedIn && user && !switchingAccount) {
    const displayName =
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.username ||
      "User";
    const firstName = displayName.split(" ")[0];

    return (
      <SkillsetShell showNav={false}>
        <section className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">
            <div className="mb-6 flex justify-center">{SkillsetMark}</div>

            <h1 className="mb-2 text-center text-[22px] font-medium tracking-[-0.015em] text-zinc-50">
              Connect to Skillset
            </h1>
            <p className="mb-8 text-center text-[14px] text-zinc-400">
              Sign in to sync your skills with the desktop app
            </p>

            <div className="mb-8 rounded-2xl border border-white/[0.06] bg-[#0f0f12] p-4">
              <div className="flex items-center gap-4">
                {user.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt="Profile"
                    className="h-14 w-14 rounded-full border-2 border-white/[0.06]"
                  />
                ) : (
                  <div className="grid h-14 w-14 place-items-center rounded-full border-2 border-white/[0.06] bg-[#2563EB] text-[18px] font-semibold text-white">
                    {displayName[0]?.toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium text-zinc-50">
                    {displayName}
                  </p>
                  <p className="truncate text-[13px] text-zinc-400">
                    {user.primaryEmailAddress?.emailAddress}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleContinue}
              disabled={processing}
              style={{ padding: "12px 22px" }}
              className="w-full rounded-full bg-[#2563EB] text-[15px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition-all hover:bg-[#1d4ed8] disabled:opacity-50"
            >
              {processing ? "Connecting…" : `Continue as ${firstName}`}
            </button>

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-white/[0.06]" />
              <span
                className="text-[10.5px] uppercase tracking-[0.18em] text-zinc-500"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              >
                or
              </span>
              <div className="h-px flex-1 bg-white/[0.06]" />
            </div>

            <button
              onClick={handleSwitchAccount}
              disabled={processing}
              style={{ padding: "11px 22px" }}
              className="w-full rounded-full border border-white/10 bg-white/[0.02] text-[14px] text-zinc-200 transition-all hover:border-white/20 hover:bg-white/[0.05] disabled:opacity-50"
            >
              Use a different account
            </button>
          </div>
        </section>
      </SkillsetShell>
    );
  }

  if (isLoaded && !isSignedIn && !processing) {
    return (
      <SkillsetShell showNav={false}>
        <section className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-12">
          <div className="mb-6">{SkillsetMark}</div>
          <h1 className="mb-2 text-center text-[22px] font-medium tracking-[-0.015em] text-zinc-50">
            {switchingAccount ? "Switch account" : "Sign in to Skillset"}
          </h1>
          <p className="mb-8 text-center text-[14px] text-zinc-400">
            {switchingAccount
              ? "Sign in with a different account"
              : "Connect your desktop app to sync skills"}
          </p>
          <SignIn
            routing="hash"
            forceRedirectUrl={
              isDesktopSource
                ? `/desktop-auth?source=desktop&app=${encodeURIComponent(getAppName())}`
                : "/desktop-auth"
            }
            signUpForceRedirectUrl={
              isDesktopSource
                ? `/desktop-auth?source=desktop&app=${encodeURIComponent(getAppName())}`
                : "/desktop-auth"
            }
          />
        </section>
      </SkillsetShell>
    );
  }

  if (launched) {
    return (
      <SkillsetShell showNav={false}>
        <section className="flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
            <Check strokeWidth={2} className="h-6 w-6" />
          </div>
          <h1 className="mt-6 text-[20px] font-medium text-zinc-50">
            Connected to Skillset
          </h1>
          <p className="mt-2 max-w-[44ch] text-[14px] text-zinc-400">
            You&apos;re signed in. You can close this tab and return to the desktop app.
          </p>
          <button
            onClick={() => window.close()}
            style={{ padding: "8px 18px" }}
            className="mt-6 rounded-full border border-white/10 bg-white/[0.02] text-[14px] text-zinc-200 transition-all hover:border-white/20 hover:bg-white/[0.05]"
          >
            Close tab
          </button>
        </section>
      </SkillsetShell>
    );
  }

  return (
    <SkillsetShell showNav={false}>
      <section className="flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 opacity-80">{SkillsetMark}</div>
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/[0.08] border-t-[#2563EB]" />
        <h1 className="text-[18px] font-medium text-zinc-50">
          {switchingAccount ? "Connecting…" : "Loading…"}
        </h1>
        <p className="mt-1 text-[14px] text-zinc-400">
          {switchingAccount ? "Setting up your desktop app" : "Please wait…"}
        </p>
      </section>
    </SkillsetShell>
  );
}
