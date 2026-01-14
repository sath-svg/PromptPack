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

  // Preserve query params immediately on mount (before any Clerk redirects)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const state = params.get("state");
    const redirectUri = params.get("redirect_uri");
    const clientId = params.get("client_id");
    
    // Also check hash in case params are there (Clerk hash routing)
    if (!state || !redirectUri || !clientId) {
      const hash = window.location.hash.replace(/^#/, "");
      if (hash) {
        const hashParams = new URLSearchParams(hash);
        const hashState = hashParams.get("state");
        const hashRedirectUri = hashParams.get("redirect_uri");
        const hashClientId = hashParams.get("client_id");
        
        if (hashState && !state) params.set("state", hashState);
        if (hashRedirectUri && !redirectUri) params.set("redirect_uri", hashRedirectUri);
        if (hashClientId && !clientId) params.set("client_id", hashClientId);
      }
    }
    
    const finalState = params.get("state");
    const finalRedirectUri = params.get("redirect_uri");
    const finalClientId = params.get("client_id");
    
    if (finalState && finalRedirectUri && finalClientId) {
      try {
        sessionStorage.setItem("pp_extension_auth_params", JSON.stringify({
          state: finalState,
          redirectUri: finalRedirectUri,
          clientId: finalClientId,
        }));
      } catch {
        // Ignore storage failures
      }
    }
  }, []);

  useEffect(() => {
    async function handleAuthCallback() {
      if (!isLoaded || processing || success) return;
      if (!isSignedIn || !user) return;

      setProcessing(true);

      try {
        const params = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        let state = params.get("state") || hashParams.get("state");
        let redirectUri = params.get("redirect_uri") || hashParams.get("redirect_uri");
        let clientId = params.get("client_id") || hashParams.get("client_id");

        if (!state || !redirectUri || !clientId) {
          try {
            const cachedRaw = sessionStorage.getItem("pp_extension_auth_params");
            if (cachedRaw) {
              const cached = JSON.parse(cachedRaw) as {
                state?: string;
                redirectUri?: string;
                clientId?: string;
              };
              state = state || cached.state || null;
              redirectUri = redirectUri || cached.redirectUri || null;
              clientId = clientId || cached.clientId || null;
            }
          } catch {
            // Ignore cache read errors
          }
        }

        // Validate required params (code is generated after sign-in, so it is not required here)
        if (!state || !redirectUri || !clientId) {
          const missing = [];
          if (!state) missing.push("state");
          if (!redirectUri) missing.push("redirect_uri");
          if (!clientId) missing.push("client_id");
          setError(`Missing required parameters: ${missing.join(", ")}. Please try signing in again.`);
          console.error("Missing auth parameters:", { state: !!state, redirectUri: !!redirectUri, clientId: !!clientId });
          return;
        }

        // Validate client_id
        if (clientId !== "promptpack-extension") {
          setError("Invalid client");
          return;
        }

        // Validate redirect_uri is a Chrome/Chromium extension URL
        // Formats: chrome-extension://<id>/* or https://<id>.chromiumapp.org/*
        const isValidRedirect =
          redirectUri.startsWith("chrome-extension://") ||
          redirectUri.startsWith("moz-extension://") || // Firefox
          redirectUri.includes(".chromiumapp.org"); // Chromium browsers (Chrome, Brave, Edge, etc.)

        if (!isValidRedirect) {
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
        // In production, store this code in Redis/KV with short TTL instead of encoding in URL
        const code = btoa(JSON.stringify({
          token,
          userId: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          timestamp: Date.now(),
        }));

        // Build the redirect URL with code and state
        const redirectUrl = new URL(redirectUri);
        redirectUrl.searchParams.set("code", code);
        redirectUrl.searchParams.set("state", state);

        // Redirect back to extension callback
        window.location.href = redirectUrl.toString();
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
    // Build afterSignInUrl with query params preserved
    // Use the current URL but ensure params are in query string (not hash)
    const currentUrl = new URL(window.location.href);
    // Remove hash to avoid conflicts
    currentUrl.hash = "";
    // Ensure query params are present (restore from sessionStorage if needed)
    if (!currentUrl.searchParams.get("state") || !currentUrl.searchParams.get("redirect_uri") || !currentUrl.searchParams.get("client_id")) {
      try {
        const cachedRaw = sessionStorage.getItem("pp_extension_auth_params");
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          if (cached.state) currentUrl.searchParams.set("state", cached.state);
          if (cached.redirectUri) currentUrl.searchParams.set("redirect_uri", cached.redirectUri);
          if (cached.clientId) currentUrl.searchParams.set("client_id", cached.clientId);
        }
      } catch {
        // Ignore errors
      }
    }
    
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
          afterSignInUrl={currentUrl.toString()}
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
