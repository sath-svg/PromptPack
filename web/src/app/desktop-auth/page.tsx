"use client";

import { useEffect, useState } from "react";
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
  const [showConfirmation, setShowConfirmation] = useState(true);

  const handleContinue = async () => {
    if (!user) return;

    setProcessing(true);
    setShowConfirmation(false);

    try {
      // Get a session token from Clerk
      const token = await getToken();
      if (!token) {
        setError("Failed to get authentication token");
        setProcessing(false);
        return;
      }

      // Build user info - combine first and last name with space
      const firstName = user.firstName || "";
      const lastName = user.lastName || "";
      const name = [firstName, lastName].filter(Boolean).join(" ") || user.username || "";
      const email = user.primaryEmailAddress?.emailAddress || "";
      const image = user.imageUrl || "";

      // Redirect to callback URL with token and user info
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
    }
  };

  const handleSwitchAccount = async () => {
    setProcessing(true);
    await signOut();
    setProcessing(false);
    setShowConfirmation(false);
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
          }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
        >
          Try Again
        </button>
      </div>
    );
  }

  // If signed in, show confirmation screen
  if (isLoaded && isSignedIn && user && showConfirmation) {
    const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "User";

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
        <div className="w-full max-w-sm">
          <h1 className="text-xl font-semibold text-foreground text-center mb-6">
            Connect to PromptPack
          </h1>

          {/* Current account */}
          <div className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border mb-6">
            {user.imageUrl ? (
              <img
                src={user.imageUrl}
                alt="Profile"
                className="w-12 h-12 rounded-full"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-lg font-semibold">
                {displayName[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{displayName}</p>
              <p className="text-sm text-muted-foreground truncate">
                {user.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleContinue}
              disabled={processing}
              className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 font-medium"
            >
              {processing ? "Connecting..." : "Continue as " + displayName.split(" ")[0]}
            </button>

            <button
              onClick={handleSwitchAccount}
              disabled={processing}
              className="w-full px-4 py-3 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors"
            >
              Use a different account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If not signed in, show the Clerk sign-in component
  if (isLoaded && !isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <h1 className="text-xl font-semibold text-foreground mb-2">
          Sign in to PromptPack
        </h1>
        <p className="text-muted-foreground text-sm mb-6">
          Connect your desktop app
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
      <div className="w-12 h-12 border-3 border-muted border-t-primary rounded-full animate-spin mb-6" />
      <h1 className="text-xl font-semibold text-foreground mb-2">
        {processing ? "Connecting..." : "Loading..."}
      </h1>
      <p className="text-muted-foreground text-sm">
        {processing
          ? "Setting up your desktop app"
          : "Please wait..."}
      </p>
    </div>
  );
}
