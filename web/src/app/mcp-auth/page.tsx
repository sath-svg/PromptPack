"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth, useUser, SignIn } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

const API_BASE = "https://api.pmtpk.com";

/**
 * MCP Auth page for CLI device auth flow
 *
 * Flow:
 * 1. User runs `pmtpk login` in their terminal
 * 2. CLI generates a device code and opens this page: /mcp-auth?code=xxx
 * 3. User signs in via Clerk
 * 4. This page calls POST /auth/device-complete with { code, clerkId, refreshToken }
 * 5. CLI polls GET /auth/device-poll?code=xxx and receives the refresh token
 */
export default function McpAuthPage() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { user } = useUser();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const [status, setStatus] = useState<"loading" | "sign-in" | "completing" | "done" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const hasCompleted = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;

    if (!code) {
      setStatus("error");
      setError("Missing device code. Please run `pmtpk login` from your terminal.");
      return;
    }

    if (!isSignedIn) {
      setStatus("sign-in");
      return;
    }

    // User is signed in — complete the device auth
    if (isSignedIn && user && !hasCompleted.current) {
      hasCompleted.current = true;
      completeDeviceAuth();
    }
  }, [isLoaded, isSignedIn, user, code]);

  async function completeDeviceAuth() {
    setStatus("completing");
    try {
      const token = await getToken();
      if (!token || !user) {
        setStatus("error");
        setError("Failed to get authentication token");
        return;
      }

      // Call device-complete endpoint
      const res = await fetch(`${API_BASE}/auth/device-complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          clerkId: user.id,
          refreshToken: token, // Use the Clerk session token as the refresh token for now
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Unknown error" })) as { error?: string };
        setStatus("error");
        setError(data.error || "Failed to complete authentication");
        return;
      }

      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Authentication failed");
    }
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
        <div className="text-red-500 text-4xl mb-4">&#x2715;</div>
        <h1 className="text-xl font-semibold text-foreground mb-2">Connection Failed</h1>
        <p className="text-muted-foreground text-center mb-4 max-w-md">{error}</p>
        <button
          onClick={() => {
            hasCompleted.current = false;
            setError(null);
            setStatus("loading");
          }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
        <div className="text-green-500 text-4xl mb-4">&#x2713;</div>
        <h1 className="text-xl font-semibold text-foreground mb-2">Connected!</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Your terminal is now connected to PromptPack. You can close this tab and return to your terminal.
        </p>
      </div>
    );
  }

  if (status === "sign-in" && isLoaded && !isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-foreground mb-2">Connect MCP Server</h1>
        <p className="text-muted-foreground text-sm mb-8 text-center max-w-md">
          Sign in to connect your OpenClaw or AI assistant to PromptPack
        </p>
        <SignIn
          routing="hash"
          forceRedirectUrl={`/mcp-auth?code=${code}`}
          signUpForceRedirectUrl={`/mcp-auth?code=${code}`}
        />
      </div>
    );
  }

  // Loading / completing state
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary animate-pulse">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
      </div>
      <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin mb-4" />
      <h1 className="text-lg font-semibold text-foreground mb-1">
        {status === "completing" ? "Connecting..." : "Loading..."}
      </h1>
      <p className="text-muted-foreground text-sm">
        {status === "completing" ? "Linking your account to the MCP server" : "Please wait..."}
      </p>
    </div>
  );
}
