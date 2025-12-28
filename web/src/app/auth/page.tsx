"use client";

export const runtime = "edge";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";

/**
 * Auth page for Chrome extension OAuth flow
 *
 * Flow:
 * 1. Extension opens this page with ?state=xxx&redirect_uri=chrome-extension://...&client_id=promptpack-extension
 * 2. User signs in via Clerk (already handled by middleware)
 * 3. This page generates a code and redirects back to the extension
 */
export default function AuthPage() {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    async function handleAuthCallback() {
      if (!isSignedIn || !user || processing) return;

      setProcessing(true);

      try {
        const params = new URLSearchParams(window.location.search);
        const state = params.get("state");
        const redirectUri = params.get("redirect_uri");
        const clientId = params.get("client_id");

        // Validate required params
        if (!state || !redirectUri || !clientId) {
          setError("Missing required parameters");
          return;
        }

        // Validate client_id
        if (clientId !== "promptpack-extension") {
          setError("Invalid client");
          return;
        }

        // Validate redirect_uri is a Chrome extension URL
        if (!redirectUri.startsWith("chrome-extension://")) {
          setError("Invalid redirect URI");
          return;
        }

        // Get a session token from Clerk
        const token = await getToken();
        if (!token) {
          setError("Failed to get authentication token");
          return;
        }

        // Generate an auth code (in production, this would be stored server-side
        // and exchanged for tokens via the API. For now, we pass the token directly
        // as a code that the extension can use to call our token endpoint)
        const code = btoa(JSON.stringify({
          token,
          userId: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          timestamp: Date.now(),
        }));

        // Redirect back to extension
        const callbackUrl = new URL(redirectUri);
        callbackUrl.searchParams.set("code", code);
        callbackUrl.searchParams.set("state", state);

        window.location.href = callbackUrl.toString();
      } catch (err) {
        console.error("Auth callback error:", err);
        setError("Authentication failed. Please try again.");
      }
    }

    handleAuthCallback();
  }, [isSignedIn, user, getToken, processing]);

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "4rem" }}>
        <h1 style={{ color: "#ef4444", marginBottom: "1rem" }}>Error</h1>
        <p style={{ color: "var(--muted)" }}>{error}</p>
        <button
          onClick={() => window.close()}
          className="btn btn-secondary"
          style={{ marginTop: "1rem" }}
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", padding: "4rem" }}>
      <div
        style={{
          width: "48px",
          height: "48px",
          border: "3px solid rgba(128,128,128,0.2)",
          borderTopColor: "var(--accent)",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          margin: "0 auto 1.5rem",
        }}
      />
      <h1 style={{ marginBottom: "0.5rem" }}>Authenticating...</h1>
      <p style={{ color: "var(--muted)" }}>
        Connecting your PromptPack extension
      </p>

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
