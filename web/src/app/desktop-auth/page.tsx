"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser, SignIn } from "@clerk/nextjs";

/**
 * Desktop Auth page for Tauri desktop app OAuth flow
 *
 * Flow:
 * 1. Desktop app opens this page in a popup WebView window
 * 2. User signs in via Clerk
 * 3. This page redirects to /desktop-callback?token=xxx&name=xxx&email=xxx&image=xxx
 * 4. The Tauri app intercepts the navigation, extracts the data, and closes the popup
 */
export default function DesktopAuthPage() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { user } = useUser();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    async function handleAuthComplete() {
      if (!isLoaded || processing) return;
      if (!isSignedIn || !user) return;

      setProcessing(true);

      try {
        // Get a session token from Clerk
        const token = await getToken();
        if (!token) {
          setError("Failed to get authentication token");
          return;
        }

        // Build user info - combine first and last name with space (not +)
        const firstName = user.firstName || "";
        const lastName = user.lastName || "";
        const name = [firstName, lastName].filter(Boolean).join(" ") || user.username || "";
        const email = user.primaryEmailAddress?.emailAddress || "";
        const image = user.imageUrl || "";

        // Redirect to callback URL with token and user info
        // The Tauri app will intercept this navigation
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
    }

    handleAuthComplete();
  }, [isLoaded, isSignedIn, user, getToken, processing]);

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
        {isSignedIn ? "Connecting..." : "Loading..."}
      </h1>
      <p className="text-muted-foreground text-sm">
        {isSignedIn
          ? "Setting up your desktop app"
          : "Please wait..."}
      </p>
    </div>
  );
}
