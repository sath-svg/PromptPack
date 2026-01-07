// Auth module for PromptPack
// Handles Clerk authentication via extension auth flow

import { getSession, isAuthenticated, saveSession } from "./db";
import { api } from "./api";
import {
  AUTH_URL,
  DASHBOARD_URL,
  PRICING_URL,
  FREE_PROMPT_LIMIT,
  PRO_PROMPT_LIMIT,
  UNLIMITED_PACK_LIMIT,
  AUTH_CACHE_KEY,
  AUTH_CACHE_EXPIRY_MS,
  FALLBACK_LOADED_PACK_LIMIT,
} from "./config";

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

type CachedAuthState = AuthState & {
  cachedAt: number;
  expiresAt: number;
};

// Use session storage - cleared when browser closes
// Also enforce a 24h TTL to avoid stale sessions in long-running browsers.
const authStorage = chrome.storage.session;
const AUTH_CHECK_FLAG_KEY = "pp_auth_check_needed";
type AuthCheckFlag = "logged_in" | "logged_out";

/**
 * Get cached auth state (instant, no network calls)
 * Uses session storage - persists until browser is closed
 */
async function getCachedAuthState(): Promise<AuthState | null> {
  try {
    const result = await authStorage.get(AUTH_CACHE_KEY);
    const cached = result[AUTH_CACHE_KEY] as CachedAuthState | undefined;

    if (!cached) {
      return null;
    }

    if (!cached.expiresAt || cached.expiresAt <= Date.now()) {
      await authStorage.remove(AUTH_CACHE_KEY);
      return null;
    }

    // Return cached state without timestamps
    const { cachedAt, expiresAt, ...authState } = cached;
    return authState;
  } catch {
    // Fallback if session storage not available
    return null;
  }
}

/**
 * Save auth state to session cache
 * Persists until browser is closed
 */
async function setCachedAuthState(authState: AuthState): Promise<void> {
  try {
    const now = Date.now();
    const cached: CachedAuthState = {
      ...authState,
      cachedAt: now,
      expiresAt: now + AUTH_CACHE_EXPIRY_MS,
    };

    await authStorage.set({ [AUTH_CACHE_KEY]: cached });
  } catch {
    // Ignore if session storage not available
  }
}

/**
 * Clear cached auth state (on logout)
 */
async function clearCachedAuthState(): Promise<void> {
  try {
    await authStorage.remove(AUTH_CACHE_KEY);
  } catch {
    // Ignore if session storage not available
  }
}

async function consumeAuthCheckFlag(): Promise<AuthCheckFlag | null> {
  try {
    const result = await chrome.storage.local.get(AUTH_CHECK_FLAG_KEY);
    const value = result[AUTH_CHECK_FLAG_KEY];

    if (value === "logged_in" || value === "logged_out") {
      await chrome.storage.local.remove(AUTH_CHECK_FLAG_KEY);
      return value;
    }
  } catch {
    // Ignore if local storage not available
  }

  return null;
}

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
  } catch {
    return null;
  }
}

/**
 * Get current auth state - returns cached instantly, verifies in background
 */
export async function getAuthState(): Promise<AuthState> {
  const authCheckFlag = await consumeAuthCheckFlag();
  if (authCheckFlag === "logged_out") {
    await clearCachedAuthState();
    return { isAuthenticated: false };
  }

  if (authCheckFlag === "logged_in") {
    const freshState = await getAuthStateFromServer();
    if (freshState.isAuthenticated) {
      await setCachedAuthState(freshState);
      return freshState;
    }

    const cachedFallback = await getCachedAuthState();
    if (cachedFallback) {
      return cachedFallback;
    }

    return { isAuthenticated: false };
  }

  // Try to get cached state first (instant)
  const cached = await getCachedAuthState();
  if (cached) {
    return cached;
  }

  // No cache - fetch fresh state
  const freshState = await getAuthStateFromServer();

  // Cache the fresh state
  if (freshState.isAuthenticated) {
    await setCachedAuthState(freshState);
  }

  return freshState;
}

/**
 * Get auth state from server (network call)
 */
async function getAuthStateFromServer(): Promise<AuthState> {
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

          const authState = {
            isAuthenticated: true,
            user: {
              id: newSession.userId,
              email: newSession.email,
              tier: newSession.tier,
            },
            entitlements: newSession.entitlements,
            billing: billing || undefined,
          };

          return authState;
        }
      }
    }

    // No IndexedDB session - check if user is logged in on web
    const webAuth = await api.checkWebAuthStatus();

    if (webAuth?.isAuthenticated && webAuth.user) {
      // User is logged in on web, get their billing info
      const billing = await getBillingInfo(webAuth.user.id);

      const authState: AuthState = {
        isAuthenticated: true,
        user: {
          id: webAuth.user.id,
          email: webAuth.user.email,
          tier: (billing?.plan === "pro" ? "paid" : "free") as "free" | "paid",
        },
        entitlements: {
          promptLimit: billing?.isPro ? PRO_PROMPT_LIMIT : FREE_PROMPT_LIMIT,
          loadedPackLimit: billing?.isPro ? UNLIMITED_PACK_LIMIT : 0,
        },
        billing: billing || undefined,
      };

      return authState;
    }

    return { isAuthenticated: false };
  }

  // Fetch billing info from Convex
  const billing = await getBillingInfo(session.userId);

  const authState = {
    isAuthenticated: true,
    user: {
      id: session.userId,
      email: session.email,
      tier: session.tier,
    },
    entitlements: session.entitlements,
    billing: billing || undefined,
  };

  return authState;
}

/**
 * Verify auth state in background and update cache if changed
 * Since we use session storage (cleared on browser close), no throttling needed.
 * This is only called if there's already a cached state, so it won't make extra API calls.
 */
export async function verifyAuthStateBackground(_currentState: AuthState): Promise<AuthState | null> {
  // Skip background verification - session storage handles this
  // Auth is checked once per browser session, cached until browser closes
  // Only re-verify if user explicitly logs out or logs in
  return null;
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
              await chrome.tabs.update(authTabId, { url: DASHBOARD_URL });
            } else {
              // Close tab on failure
              await chrome.tabs.remove(authTabId);
            }

            resolve(success);
          } catch {
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
          resolve(false);
        }
      });
    });
  } catch {
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
    return false;
  }

  if (!code || !state) {
    return false;
  }

  // Verify state
  const stored = await chrome.storage.local.get("pp_auth_state");

  if (stored["pp_auth_state"] !== state) {
    return false;
  }

  // Clear stored state
  await chrome.storage.local.remove("pp_auth_state");

  try {
    // Exchange code for token
    await api.exchangeCodeForToken(code);

    // Fetch fresh auth state and cache it
    const freshState = await getAuthStateFromServer();

    if (freshState.isAuthenticated) {
      await setCachedAuthState(freshState);
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Logout and clear session
 */
export async function logout(): Promise<void> {
  await api.logout();
  await clearCachedAuthState();
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
  } catch {
    // Silently fail
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
  const limit = session?.entitlements?.promptLimit ?? FREE_PROMPT_LIMIT;
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
  const limit = session?.entitlements?.loadedPackLimit ?? FALLBACK_LOADED_PACK_LIMIT;
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
  await chrome.tabs.create({ url: PRICING_URL });
}

/**
 * Open billing portal - redirects to user's Clerk profile for subscription management
 */
export async function openBillingPortal(): Promise<void> {
  // Clerk manages subscriptions through the dashboard
  await chrome.tabs.create({ url: DASHBOARD_URL });
}
