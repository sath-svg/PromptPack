"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth, useUser, useClerk, SignIn } from "@clerk/nextjs";

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
  const [switchingAccount, setSwitchingAccount] = useState(false);
  const hasRedirected = useRef(false);

  // When user signs in after switching accounts, reset switchingAccount
  // so they see the confirmation screen with the new account
  useEffect(() => {
    if (isLoaded && isSignedIn && user && switchingAccount) {
      // User has signed in with a new account, show confirmation screen
      setSwitchingAccount(false);
    }
  }, [isLoaded, isSignedIn, user, switchingAccount]);

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

      const callbackUrl = new URL("/desktop-callback", window.location.origin);
      callbackUrl.searchParams.set("token", token);
      callbackUrl.searchParams.set("name", name);
      callbackUrl.searchParams.set("email", email);
      callbackUrl.searchParams.set("image", image);
      callbackUrl.searchParams.set("user_id", user.id);

      window.location.href = callbackUrl.toString();
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
    try {
      await signOut();
      // After sign out, reset processing so the SignIn form shows
      setProcessing(false);
    } catch (err) {
      console.error("Sign out error:", err);
      setProcessing(false);
      setSwitchingAccount(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
        <div className="text-red-500 text-4xl mb-4">✕</div>
        <h1 className="text-xl font-semibold text-foreground mb-2">Error</h1>
        <p className="text-muted-foreground text-center mb-4">{error}</p>
        <button
          onClick={() => {
            setError(null);
            setProcessing(false);
            hasRedirected.current = false;
          }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
        >
          Try Again
        </button>
      </div>
    );
  }

  // If signed in and NOT switching accounts, show confirmation screen
  if (isLoaded && isSignedIn && user && !switchingAccount) {
    const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "User";
    const firstName = displayName.split(" ")[0];

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
        <div className="w-full max-w-sm">
          {/* Logo/Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
          </div>

          <h1 className="text-xl font-semibold text-foreground text-center mb-2">
            Connect to PromptPack
          </h1>
          <p className="text-sm text-muted-foreground text-center mb-8">
            Sign in to sync your prompts with the desktop app
          </p>

          {/* Current account card */}
          <div className="p-4 rounded-xl bg-card border border-border mb-8">
            <div className="flex items-center gap-4">
              {user.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt="Profile"
                  className="w-14 h-14 rounded-full border-2 border-border"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-semibold border-2 border-border">
                  {displayName[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate text-base">{displayName}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {user.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </div>
          </div>

          {/* Primary action button */}
          <button
            onClick={handleContinue}
            disabled={processing}
            className="w-full px-4 py-3.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 disabled:opacity-50 font-semibold text-base shadow-sm transition-all"
          >
            {processing ? "Connecting..." : `Continue as ${firstName}`}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Secondary action button */}
          <button
            onClick={handleSwitchAccount}
            disabled={processing}
            className="w-full px-4 py-3 text-muted-foreground hover:text-foreground border border-border rounded-xl hover:bg-accent hover:border-accent transition-all font-medium"
          >
            Use a different account
          </button>
        </div>
      </div>
    );
  }

  // If not signed in, show the Clerk sign-in component
  // This takes priority even when switchingAccount is true (user clicked "different account")
  if (isLoaded && !isSignedIn && !processing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
        {/* Logo/Icon */}
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>

        <h1 className="text-xl font-semibold text-foreground mb-2">
          {switchingAccount ? "Switch Account" : "Sign in to PromptPack"}
        </h1>
        <p className="text-muted-foreground text-sm mb-8">
          {switchingAccount ? "Sign in with a different account" : "Connect your desktop app to sync prompts"}
        </p>
        <SignIn
          routing="hash"
          afterSignInUrl="/desktop-auth"
        />
      </div>
    );
  }

  // Show loading while processing
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
      {/* Logo/Icon */}
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary animate-pulse">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
      </div>

      <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin mb-4" />
      <h1 className="text-lg font-semibold text-foreground mb-1">
        {switchingAccount ? "Connecting..." : "Loading..."}
      </h1>
      <p className="text-muted-foreground text-sm">
        {switchingAccount
          ? "Setting up your desktop app"
          : "Please wait..."}
      </p>
    </div>
  );
}
