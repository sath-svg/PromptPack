// Auth module for PromptPack
// Handles Clerk authentication via extension auth flow

import { getSession, isAuthenticated, saveSession } from "./db";
import { api } from "./api";

// TODO: Update to production URL when deployed
const BASE_URL = "http://localhost:3000";
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
  billing?: {
    isPro: boolean;
    plan: "free" | "pro";
  };
};

/**
 * Get billing info from Convex
 */
export async function getBillingInfo(clerkId: string): Promise<{
  isPro: boolean;
  plan: "free" | "pro";
} | null> {
  try {
    const billingStatus = await api.getBillingStatus(clerkId);
    return {
      isPro: billingStatus.hasPro,
      plan: billingStatus.tier,
    };
  } catch (error) {
    console.error("Failed to fetch billing info:", error);
    return null;
  }
}

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
          // Fetch billing info from Convex
          const billing = await getBillingInfo(newSession.userId);

          return {
            isAuthenticated: true,
            user: {
              id: newSession.userId,
              email: newSession.email,
              tier: newSession.tier,
            },
            entitlements: newSession.entitlements,
            billing: billing || undefined,
          };
        }
      }
    }

    return { isAuthenticated: false };
  }

  // Fetch billing info from Convex
  const billing = await getBillingInfo(session.userId);

  return {
    isAuthenticated: true,
    user: {
      id: session.userId,
      email: session.email,
      tier: session.tier,
    },
    entitlements: session.entitlements,
    billing: billing || undefined,
  };
}

/**
 * Initiate login flow using tab-based auth (opens in new tab, closes on success)
 */
export async function login(): Promise<boolean> {
  // Generate a random state for CSRF protection
  const state = crypto.randomUUID();

  // Store state for verification
  await chrome.storage.local.set({ pp_auth_state: state });

  // Get the redirect URL from chrome.identity
  const redirectUri = chrome.identity.getRedirectURL();

  console.log("Starting auth flow with redirect URI:", redirectUri);

  // Build auth URL
  const authUrl = new URL(AUTH_URL);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("client_id", "promptpack-extension");

  try {
    // Open auth in a new tab
    const tab = await chrome.tabs.create({
      url: authUrl.toString(),
      active: true,
    });

    if (!tab.id) {
      console.error("Failed to create auth tab");
      return false;
    }

    const authTabId = tab.id;

    // Wait for the auth redirect with code
    return new Promise<boolean>((resolve) => {
      const listener = async (
        tabId: number,
        changeInfo: { url?: string; status?: string },
        _tab: chrome.tabs.Tab
      ) => {
        // Only process updates for our auth tab
        if (tabId !== authTabId) return;

        // Check if URL has changed and contains our redirect URI
        if (changeInfo.url && changeInfo.url.includes(redirectUri)) {
          console.log("Auth redirect detected:", changeInfo.url);

          // Remove the listener
          chrome.tabs.onUpdated.removeListener(listener);

          try {
            // Parse the response URL
            const url = new URL(changeInfo.url);
            const params = new URLSearchParams(url.search);

            // Handle the callback
            const success = await handleAuthCallback(params);

            if (success) {
              // Navigate to dashboard instead of closing tab
              await chrome.tabs.update(authTabId, { url: "http://localhost:3000/dashboard" });
            } else {
              // Close tab on failure
              await chrome.tabs.remove(authTabId);
            }

            resolve(success);
          } catch (e) {
            console.error("Error processing auth callback:", e);
            await chrome.tabs.remove(authTabId);
            resolve(false);
          }
        }
      };

      // Listen for tab updates
      chrome.tabs.onUpdated.addListener(listener);

      // Also handle if the user closes the tab manually
      chrome.tabs.onRemoved.addListener((closedTabId) => {
        if (closedTabId === authTabId) {
          chrome.tabs.onUpdated.removeListener(listener);
          console.log("Auth tab closed by user");
          resolve(false);
        }
      });
    });
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

  console.log("handleAuthCallback called with:", { code: !!code, state: !!state, error });

  if (error) {
    console.error("Auth error:", error);
    return false;
  }

  if (!code || !state) {
    console.error("Missing code or state", { code: !!code, state: !!state });
    return false;
  }

  // Verify state
  const stored = await chrome.storage.local.get("pp_auth_state");
  console.log("State verification:", { stored: stored["pp_auth_state"], received: state, match: stored["pp_auth_state"] === state });

  if (stored["pp_auth_state"] !== state) {
    console.error("State mismatch");
    return false;
  }

  // Clear stored state
  await chrome.storage.local.remove("pp_auth_state");

  try {
    console.log("Exchanging code for token...");
    // Exchange code for token
    await api.exchangeCodeForToken(code);
    console.log("Token exchange successful!");
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
  await chrome.tabs.create({ url: "http://localhost:3000/pricing" });
}

/**
 * Open billing portal - redirects to user's Clerk profile for subscription management
 */
export async function openBillingPortal(): Promise<void> {
  // Clerk manages subscriptions through the dashboard
  // TODO: Update to production URL when deployed
  await chrome.tabs.create({ url: "http://localhost:3000/dashboard" });
}
