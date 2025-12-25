// Auth module for PromptPack
// Handles Clerk authentication via extension auth flow

import { getSession, isAuthenticated, saveSession } from "./db";
import { api } from "./api";

// TODO: Update to production URL when deployed
const BASE_URL = "http://localhost:3001";
const AUTH_URL = `${BASE_URL}/extension-auth`; // Extension-specific auth endpoint

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
 * Initiate login flow using chrome.identity.launchWebAuthFlow (MV3 compliant)
 */
export async function login(): Promise<boolean> {
  // Generate a random state for CSRF protection
  const state = crypto.randomUUID();

  // Get the redirect URL from chrome.identity
  const redirectUri = chrome.identity.getRedirectURL();

  // Build auth URL
  const authUrl = new URL(AUTH_URL);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("client_id", "promptpack-extension");

  try {
    // Use launchWebAuthFlow for MV3 compliant auth
    const responseUrl = await chrome.identity.launchWebAuthFlow({
      url: authUrl.toString(),
      interactive: true,
    });

    if (!responseUrl) {
      console.error("No response URL from auth flow");
      return false;
    }

    // Parse the response URL
    const url = new URL(responseUrl);
    const params = new URLSearchParams(url.search);

    // Handle the callback
    return await handleAuthCallback(params);
  } catch (e) {
    console.error("Auth flow error:", e);
    return false;
  }
}

/**
 * Handle auth callback - called from auth-callback.html
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

  // Verify state
  const stored = await chrome.storage.local.get("pp_auth_state");
  if (stored["pp_auth_state"] !== state) {
    console.error("State mismatch");
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
 */
export async function openUpgradePage(): Promise<void> {
  // Clerk handles billing through the web app's pricing page
  // TODO: Update to production URL when deployed
  await chrome.tabs.create({ url: "http://localhost:3001/pricing" });
}

/**
 * Open billing portal - redirects to user's Clerk profile for subscription management
 */
export async function openBillingPortal(): Promise<void> {
  // Clerk manages subscriptions through the dashboard
  // TODO: Update to production URL when deployed
  await chrome.tabs.create({ url: "http://localhost:3001/dashboard" });
}
