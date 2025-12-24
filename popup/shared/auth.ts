// Auth module for PromptPack
// Handles Clerk authentication via extension auth flow

import { getSession, isAuthenticated, saveSession } from "./db";
import { api } from "./api";

/**
 * TODO [PRODUCTION]: Update BASE_URL to production domain
 * Example: const BASE_URL = "https://pmtpk.ai";
 *
 * Checklist when deploying:
 * 1. Update BASE_URL to production domain
 * 2. Update manifest.config.ts host_permissions to include production domain
 * 3. Configure Clerk to allow redirects from chrome-extension:// URLs
 * 4. Test auth flow end-to-end in production
 */
const BASE_URL = "http://localhost:3000";
const AUTH_URL = `${BASE_URL}/extension-auth`;

export type AuthState = {
  isAuthenticated: boolean;
  user?: {
    id: string;
    email: string;
    tier: "free" | "paid";
  };
  entitlements?: {
    promptLimit: number;
    loadedPackLimit: number;
  };
};

/**
 * Get current auth state from local storage
 */
export async function getAuthState(): Promise<AuthState> {
  const session = await getSession();

  if (!session || session.expiresAt < Date.now()) {
    // Try to refresh if we have a refresh token
    if (session?.refreshToken) {
      const refreshed = await api.refreshToken();
      if (refreshed) {
        const newSession = await getSession();
        if (newSession) {
          return {
            isAuthenticated: true,
            user: {
              id: newSession.userId,
              email: newSession.email,
              tier: newSession.tier,
            },
            entitlements: newSession.entitlements,
          };
        }
      }
    }

    return { isAuthenticated: false };
  }

  return {
    isAuthenticated: true,
    user: {
      id: session.userId,
      email: session.email,
      tier: session.tier,
    },
    entitlements: session.entitlements,
  };
}

/**
 * Initiate login flow - opens auth page in a new tab
 * The web page will store auth data, and the popup will check for it on next render
 *
 * TODO [PRODUCTION]: When deployed to HTTPS domain, use chrome.identity.launchWebAuthFlow
 * which properly handles the OAuth redirect flow without these workarounds.
 */
export async function login(): Promise<boolean> {
  // Generate a random state for CSRF protection
  const state = crypto.randomUUID();

  // Store state for verification when callback happens
  await chrome.storage.local.set({ pp_auth_state: state });

  // Get extension ID for redirect (still needed for validation on server)
  const extensionId = chrome.runtime.id;
  const redirectUri = `chrome-extension://${extensionId}/auth-callback.html`;

  // Build auth URL
  const authUrl = new URL(AUTH_URL);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("client_id", "promptpack-extension");

  // Open auth page in new tab
  await chrome.tabs.create({ url: authUrl.toString() });

  // Return false - auth completes when user returns to popup
  // The popup will check for pending auth on render
  return false;
}

/**
 * Check for pending auth from web page and process it
 * Called by popup on render to complete any pending auth flow
 */
export async function checkPendingAuth(): Promise<boolean> {
  const stored = await chrome.storage.local.get(["pp_pending_auth", "pp_auth_state"]);

  if (!stored.pp_pending_auth) {
    return false;
  }

  const pendingAuth = stored.pp_pending_auth as { code: string; state: string; timestamp: number };

  // Clear pending auth immediately
  await chrome.storage.local.remove("pp_pending_auth");

  // Check if auth is too old (5 minutes)
  if (Date.now() - pendingAuth.timestamp > 5 * 60 * 1000) {
    console.error("Pending auth expired");
    return false;
  }

  // Verify state
  if (pendingAuth.state !== stored.pp_auth_state) {
    console.error("State mismatch");
    return false;
  }

  // Clear stored state
  await chrome.storage.local.remove("pp_auth_state");

  try {
    // Decode the auth code (it's base64 JSON with user info from Clerk)
    const decoded = JSON.parse(atob(pendingAuth.code)) as {
      token: string;
      userId: string;
      email: string;
      timestamp: number;
    };

    // Create an API token that the Workers API can decode to get userId
    // This is separate from the Clerk token - it's a simple base64 JSON with userId
    // The Workers API parses this to identify the user for R2 storage
    const apiToken = btoa(JSON.stringify({ userId: decoded.userId, email: decoded.email }));

    // Save session directly (bypassing API for dev - API would validate token in production)
    // TODO [PRODUCTION]: Use api.exchangeCodeForToken() to validate with backend
    // Note: accessToken is used for Workers API calls, not Clerk auth
    await saveSession({
      userId: decoded.userId,
      email: decoded.email,
      tier: "free", // Default to free, backend would determine actual tier
      accessToken: apiToken, // API token for Workers - contains userId for R2 path
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      entitlements: {
        promptLimit: 50,
        loadedPackLimit: 3,
      },
    });

    return true;
  } catch (e) {
    console.error("Token processing failed:", e);
    return false;
  }
}

/**
 * Store pending auth data (called from content script on auth page)
 */
export async function storePendingAuth(code: string, state: string): Promise<void> {
  await chrome.storage.local.set({
    pp_pending_auth: {
      code,
      state,
      timestamp: Date.now(),
    },
  });
}

/**
 * Handle auth callback - processes the response from auth page redirect
 */
export async function handleAuthCallback(params: URLSearchParams): Promise<boolean> {
  const code = params.get("code");
  const state = params.get("state");
  const error = params.get("error");

  if (error) {
    console.error("Auth error:", error);
    return false;
  }

  if (!code || !state) {
    console.error("Missing code or state");
    return false;
  }

  // Verify state matches what we stored
  const stored = await chrome.storage.local.get("pp_auth_state");
  if (stored.pp_auth_state !== state) {
    console.error("State mismatch - possible CSRF attack");
    return false;
  }

  // Clear stored state
  await chrome.storage.local.remove("pp_auth_state");

  try {
    // Exchange code for token
    await api.exchangeCodeForToken(code);
    return true;
  } catch (e) {
    console.error("Token exchange failed:", e);
    return false;
  }
}

/**
 * Logout and clear session
 */
export async function logout(): Promise<void> {
  await api.logout();
}

/**
 * Check if user is authenticated
 */
export { isAuthenticated };

/**
 * Refresh entitlements from server
 */
export async function refreshEntitlements(): Promise<void> {
  const session = await getSession();
  if (!session) return;

  try {
    const entitlements = await api.getEntitlements();
    await saveSession({
      ...session,
      tier: entitlements.tier,
      entitlements: {
        promptLimit: entitlements.promptLimit,
        loadedPackLimit: entitlements.loadedPackLimit,
      },
    });
  } catch (e) {
    console.error("Failed to refresh entitlements:", e);
  }
}

/**
 * Check if user can save more prompts
 */
export async function canSavePrompt(currentCount: number): Promise<{
  allowed: boolean;
  limit: number;
  remaining: number;
}> {
  const session = await getSession();
  const limit = session?.entitlements?.promptLimit ?? 10; // Free tier default
  const remaining = Math.max(0, limit - currentCount);

  return {
    allowed: currentCount < limit,
    limit,
    remaining,
  };
}

/**
 * Check if user can load more packs
 */
export async function canLoadPack(currentLoaded: number): Promise<{
  allowed: boolean;
  limit: number;
  remaining: number;
}> {
  const session = await getSession();
  const limit = session?.entitlements?.loadedPackLimit ?? 2; // Free tier default
  const remaining = Math.max(0, limit - currentLoaded);

  return {
    allowed: currentLoaded < limit,
    limit,
    remaining,
  };
}

/**
 * Open upgrade page - redirects to Clerk-powered pricing page
 * TODO [PRODUCTION]: Update URL to use BASE_URL constant
 */
export async function openUpgradePage(): Promise<void> {
  await chrome.tabs.create({ url: `${BASE_URL}/pricing` });
}

/**
 * Open billing portal - redirects to user's dashboard
 * TODO [PRODUCTION]: Update URL to use BASE_URL constant
 */
export async function openBillingPortal(): Promise<void> {
  await chrome.tabs.create({ url: `${BASE_URL}/dashboard` });
}
