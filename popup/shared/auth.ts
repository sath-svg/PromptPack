// Auth module for PromptPack
// Handles Clerk authentication via extension auth flow

// ============================================================================
// TODO-PRODUCTION: Update BASE_URL before deploying to production
// ============================================================================
const BASE_URL = "http://localhost:3000"; // Local dev
// PRODUCTION: const BASE_URL = "https://pmtpk.ai";
const AUTH_URL = `${BASE_URL}/extension-auth`;
// ============================================================================

import { getSession, isAuthenticated, saveSession } from "./db";
import { api } from "./api";

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

const AUTH_CACHE_KEY = "pp_auth_cache";
const AUTH_CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

/**
 * Get cached auth state (instant, no network calls)
 */
async function getCachedAuthState(): Promise<AuthState | null> {
  // Debug: Check ALL storage keys to see what's there
  const allStorage = await chrome.storage.local.get(null);
  console.log("[Auth Cache] All storage keys:", Object.keys(allStorage));

  const result = await chrome.storage.local.get(AUTH_CACHE_KEY);
  const cached = result[AUTH_CACHE_KEY] as CachedAuthState | undefined;

  console.log("[Auth Cache] Get attempt:", {
    key: AUTH_CACHE_KEY,
    found: !!cached,
    cachedAt: cached?.cachedAt ? new Date(cached.cachedAt).toISOString() : null,
    expiresAt: cached?.expiresAt ? new Date(cached.expiresAt).toISOString() : null,
    now: new Date().toISOString(),
  });

  if (!cached) {
    console.log("[Auth Cache] No cache found");
    return null;
  }

  // Check if cache expired
  if (Date.now() > cached.expiresAt) {
    console.log("[Auth Cache] Cache expired, removing");
    await chrome.storage.local.remove(AUTH_CACHE_KEY);
    return null;
  }

  // Return cached state without timestamps
  const { cachedAt, expiresAt, ...authState } = cached;
  console.log("[Auth Cache] Returning cached state:", {
    isAuthenticated: authState.isAuthenticated,
    userId: authState.user?.id,
    hasBilling: !!authState.billing,
  });
  return authState;
}

/**
 * Save auth state to cache with 12-hour TTL
 */
async function setCachedAuthState(authState: AuthState): Promise<void> {
  const now = Date.now();
  const cached: CachedAuthState = {
    ...authState,
    cachedAt: now,
    expiresAt: now + AUTH_CACHE_TTL,
  };

  console.log("[Auth Cache] Setting cache:", {
    key: AUTH_CACHE_KEY,
    isAuthenticated: authState.isAuthenticated,
    userId: authState.user?.id,
    hasBilling: !!authState.billing,
    cachedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + AUTH_CACHE_TTL).toISOString(),
  });

  await chrome.storage.local.set({ [AUTH_CACHE_KEY]: cached });

  // Verify it was saved
  const verify = await chrome.storage.local.get(AUTH_CACHE_KEY);
  console.log("[Auth Cache] Verification after save:", {
    saved: !!verify[AUTH_CACHE_KEY],
    matches: JSON.stringify(verify[AUTH_CACHE_KEY]) === JSON.stringify(cached),
  });
}

/**
 * Clear cached auth state (on logout)
 */
async function clearCachedAuthState(): Promise<void> {
  console.log("[Auth Cache] Clearing cache");
  await chrome.storage.local.remove(AUTH_CACHE_KEY);
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
  } catch (error) {
    console.error("Failed to fetch billing info:", error);
    return null;
  }
}

/**
 * Get current auth state - returns cached instantly, verifies in background
 */
export async function getAuthState(): Promise<AuthState> {
  // Try to get cached state first (instant)
  const cached = await getCachedAuthState();
  if (cached) {
    console.log("[Auth] Using cached auth state");
    return cached;
  }

  // No cache - fetch fresh state
  console.log("[Auth] No cache, fetching fresh auth state");
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
  console.log("[Auth] Getting session from IndexedDB...");
  const session = await getSession();

  console.log("[Auth] Session retrieved:", {
    found: !!session,
    userId: session?.userId,
    email: session?.email,
    expiresAt: session?.expiresAt ? new Date(session.expiresAt).toISOString() : null,
    expired: session ? session.expiresAt < Date.now() : null,
  });

  if (!session || session.expiresAt < Date.now()) {
    // Try to refresh if we have a refresh token
    if (session?.refreshToken) {
      console.log("[Auth] Session expired, attempting refresh...");
      const refreshed = await api.refreshToken();
      if (refreshed) {
        const newSession = await getSession();
        if (newSession) {
          // Fetch billing info from Convex
          console.log("[Auth] Fetching billing info after refresh...");
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
    console.log("[Auth] No extension session, checking web auth status...");
    const webAuth = await api.checkWebAuthStatus();
    console.log("[Auth] Web auth status:", webAuth);

    if (webAuth?.isAuthenticated && webAuth.user) {
      console.log("[Auth] User is authenticated on web, fetching billing info...");
      // User is logged in on web, get their billing info
      const billing = await getBillingInfo(webAuth.user.id);
      console.log("[Auth] Billing info received:", {
        found: !!billing,
        isPro: billing?.isPro,
        plan: billing?.plan,
      });

      const authState: AuthState = {
        isAuthenticated: true,
        user: {
          id: webAuth.user.id,
          email: webAuth.user.email,
          tier: (billing?.plan === "pro" ? "paid" : "free") as "free" | "paid",
        },
        entitlements: {
          promptLimit: billing?.isPro ? 40 : 10,
          loadedPackLimit: billing?.isPro ? 999999 : 0,
        },
        billing: billing || undefined,
      };

      console.log("[Auth] Returning web auth state:", {
        isAuthenticated: authState.isAuthenticated,
        userId: authState.user?.id,
        tier: authState.user?.tier,
        hasBilling: !!authState.billing,
      });

      return authState;
    }

    console.log("[Auth] No valid session anywhere, returning unauthenticated");
    return { isAuthenticated: false };
  }

  // Fetch billing info from Convex
  console.log("[Auth] Valid session found, fetching billing info...");
  const billing = await getBillingInfo(session.userId);
  console.log("[Auth] Billing info received:", {
    found: !!billing,
    isPro: billing?.isPro,
    plan: billing?.plan,
  });

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

  console.log("[Auth] Returning extension session auth state:", {
    isAuthenticated: authState.isAuthenticated,
    userId: authState.user?.id,
    tier: authState.user?.tier,
    hasBilling: !!authState.billing,
  });

  return authState;
}

/**
 * Verify auth state in background and update cache if changed
 */
export async function verifyAuthStateBackground(currentState: AuthState): Promise<AuthState | null> {
  try {
    const freshState = await getAuthStateFromServer();

    // Compare states
    if (JSON.stringify(freshState) !== JSON.stringify(currentState)) {
      console.log("[Auth] State changed, updating cache");

      // Update cache
      if (freshState.isAuthenticated) {
        await setCachedAuthState(freshState);
      } else {
        await clearCachedAuthState();
      }

      return freshState; // Return new state
    }

    console.log("[Auth] State unchanged");
    return null; // No change
  } catch (error) {
    console.error("[Auth] Background verification failed:", error);
    return null;
  }
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
    console.log("[Auth Callback] Exchanging code for token...");
    // Exchange code for token
    await api.exchangeCodeForToken(code);
    console.log("[Auth Callback] Token exchange successful!");

    // Fetch fresh auth state and cache it
    console.log("[Auth Callback] Fetching fresh auth state...");
    const freshState = await getAuthStateFromServer();
    console.log("[Auth Callback] Fresh state received:", {
      isAuthenticated: freshState.isAuthenticated,
      userId: freshState.user?.id,
      hasBilling: !!freshState.billing,
    });

    if (freshState.isAuthenticated) {
      console.log("[Auth Callback] Caching auth state...");
      await setCachedAuthState(freshState);
      console.log("[Auth Callback] Auth state cached successfully");
    } else {
      console.log("[Auth Callback] User not authenticated, not caching");
    }

    return true;
  } catch (e) {
    console.error("[Auth Callback] Token exchange failed:", e);
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
