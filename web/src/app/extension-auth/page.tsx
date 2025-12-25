"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser, SignIn } from "@clerk/nextjs";

/**
 * Extension Auth page for Chrome extension OAuth flow
 *
 * Flow:
 * 1. Extension opens this page in a new tab
 * 2. User signs in via Clerk
 * 3. This page generates a code and redirects to the extension's callback page
 *
 * The redirect_uri will be in format: chrome-extension://<extension-id>/auth-callback.html
 *
 * TODO [PRODUCTION]: Security improvements for production:
 * 1. Store auth codes server-side with short TTL (e.g., Redis/KV)
 * 2. Validate extension ID against allowlist
 * 3. Use proper JWT signing instead of base64 encoding
 * 4. Add rate limiting to prevent abuse
 * 5. Configure Clerk redirect URLs in dashboard for production domain
 */
export default function ExtensionAuthPage() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { user } = useUser();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function handleAuthCallback() {
      if (!isLoaded || processing || success) return;
      if (!isSignedIn || !user) return;

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
          setError("Invalid redirect URI format");
          return;
        }

        // Get a session token from Clerk
        const token = await getToken();
        if (!token) {
          setError("Failed to get authentication token");
          return;
        }

        // Generate an auth code containing user info
        // In production, this would be a short-lived code stored server-side
        const code = btoa(JSON.stringify({
          token,
          userId: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          timestamp: Date.now(),
        }));

        /**
         * TODO [PRODUCTION]: When you have a production domain, you can use
         * chrome.identity.launchWebAuthFlow which handles redirects properly.
         * For now, we store the auth data and let the user manually return to extension.
         *
         * Production flow:
         * 1. Use HTTPS domain
         * 2. Use chrome.identity.launchWebAuthFlow in extension
         * 3. Redirect to https://<ext-id>.chromiumapp.org/ callback
         */

        // Store auth data in localStorage for the extension's content script to capture
        const authData = {
          code,
          state,
          timestamp: Date.now(),
        };
        localStorage.setItem("pp_extension_auth", JSON.stringify(authData));

        // Show success message
        setSuccess(true);
        setProcessing(false);
      } catch (err) {
        console.error("Auth callback error:", err);
        setError("Authentication failed. Please try again.");
      }
    }

    handleAuthCallback();
  }, [isLoaded, isSignedIn, user, getToken, processing, success]);

  // Show success message
  if (success) {
    return (
      <div style={{ textAlign: "center", padding: "4rem" }}>
        <div style={{ color: "#22c55e", fontSize: "48px", marginBottom: "1rem" }}>✓</div>
        <h1 style={{ marginBottom: "0.5rem" }}>Success!</h1>
        <p style={{ color: "#a0a0a0", marginBottom: "1.5rem" }}>
          You&apos;re now signed in. Please close this tab and return to the extension.
        </p>
      </div>
    );
  }

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

  // If not signed in, show the Clerk sign-in component
  if (isLoaded && !isSignedIn) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "80vh",
          gap: "1rem",
        }}
      >
        <h1 style={{ marginBottom: "1rem" }}>Sign in to PromptPack</h1>
        <p style={{ color: "var(--muted)", marginBottom: "1rem" }}>
          Sign in to connect your extension
        </p>
        <SignIn
          routing="hash"
          afterSignInUrl={window.location.href}
        />
      </div>
    );
  }

  // Show loading while processing
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
      <h1 style={{ marginBottom: "0.5rem" }}>
        {isSignedIn ? "Connecting..." : "Loading..."}
      </h1>
      <p style={{ color: "var(--muted)" }}>
        {isSignedIn
          ? "Connecting your PromptPack extension"
          : "Please wait..."}
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
