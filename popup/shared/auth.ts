// Auth module for PromptPack
// Handles Clerk authentication via extension auth flow

import { getSession, isAuthenticated, saveSession, clearSession, type UserSession } from "./db";
import { api } from "./api";
import {
  AUTH_URL,
  DASHBOARD_URL,
  PRICING_URL,
  FREE_PROMPT_LIMIT,
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

const RETURN_TAB_KEY = "pp_auth_return_tab";
const LEGACY_AUTH_CACHE_KEY = "pp_auth_cache";

function decodeJwtExpiry(token: string): number | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const json = atob(padded);
    const data = JSON.parse(json) as { exp?: number };
    if (typeof data.exp === "number") {
      return data.exp * 1000;
    }
  } catch {
    // Ignore decode errors
  }
  return null;
}

function isSessionValid(session: UserSession | null | undefined): boolean {
  if (!session || !session.accessToken) return false;
  const jwtExpiry = decodeJwtExpiry(session.accessToken);
  if (jwtExpiry && jwtExpiry <= Date.now()) return false;
  return session.expiresAt > Date.now();
}

async function clearLegacyAuthCache(): Promise<void> {
  try {
    await chrome.storage.session.remove(LEGACY_AUTH_CACHE_KEY);
  } catch {
    // Ignore session cache cleanup failures
  }
  try {
    await chrome.storage.local.remove(LEGACY_AUTH_CACHE_KEY);
  } catch {
    // Ignore local cache cleanup failures
  }
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
 * Get current auth state from the server
 */
export async function getAuthState(): Promise<AuthState> {
  await clearLegacyAuthCache();
  return getAuthStateFromServer();
}

/**
 * Get auth state from server (network call)
 */
async function getAuthStateFromServer(): Promise<AuthState> {
  const session = await getSession();

  if (!session) {
    return { isAuthenticated: false };
  }

  if (!isSessionValid(session)) {
    await clearSession();
    await clearLegacyAuthCache();
    // Try to refresh if we have a refresh token
    if (session.refreshToken) {
      const refreshed = await api.refreshToken();
      if (refreshed) {
        const newSession = await getSession();
        if (newSession && isSessionValid(newSession)) {
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

    return { isAuthenticated: false };
  }

  const tokenValid = await api.verifyAuthToken(session.accessToken);
  if (!tokenValid) {
    await clearSession();
    await clearLegacyAuthCache();
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
 * Verify auth state in background and update state if changed
 */
export async function verifyAuthStateBackground(_currentState: AuthState): Promise<AuthState | null> {
  return null;
}

/**
 * Initiate login flow using tab-based auth (opens in new tab, closes on success)
 */
export async function login(): Promise<boolean> {
  // Generate a random state for CSRF protection
  const state = crypto.randomUUID();

  // Store state for verification (keep a small rolling list for concurrent auth tabs)
  try {
    const stored = await chrome.storage.local.get("pp_auth_states");
    const existing = Array.isArray(stored.pp_auth_states) ? stored.pp_auth_states : [];
    const now = Date.now();
    const normalized = existing
      .map((item: unknown) => {
        if (typeof item === "string") return { value: item, createdAt: now };
        if (item && typeof item === "object") {
          const typed = item as { value?: string; createdAt?: number };
          if (typed.value) {
            return {
              value: typed.value,
              createdAt: typeof typed.createdAt === "number" ? typed.createdAt : now,
            };
          }
        }
        return null;
      })
      .filter(Boolean) as Array<{ value: string; createdAt: number }>;

    const next = [{ value: state, createdAt: now }, ...normalized]
      .filter((item) => now - item.createdAt < 10 * 60 * 1000)
      .slice(0, 5);

    await chrome.storage.local.set({
      pp_auth_state: state,
      pp_auth_states: next,
    });
  } catch {
    await chrome.storage.local.set({ pp_auth_state: state });
  }

  // Capture the active tab so we can return after auth
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab?.id) {
      await chrome.storage.local.set({
        [RETURN_TAB_KEY]: {
          id: activeTab.id,
          windowId: activeTab.windowId,
        },
      });
    } else {
      await chrome.storage.local.remove(RETURN_TAB_KEY);
    }
  } catch {
    // Ignore tab capture failures
  }

  // Use extension callback page for redirect (preserve state in hash in case server drops it)
  const redirectUriBase = chrome.runtime.getURL("auth-callback.html");
  const redirectUriUrl = new URL(redirectUriBase);
  redirectUriUrl.hash = `state=${state}`;
  const redirectUri = redirectUriUrl.toString();

  // Build auth URL
  const authUrl = new URL(AUTH_URL);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("client_id", "promptpack-extension");
  // Duplicate params in hash to survive query stripping by auth routing
  const hashParams = new URLSearchParams({
    state,
    redirect_uri: redirectUri,
    client_id: "promptpack-extension",
  });
  authUrl.hash = hashParams.toString();

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
        if (changeInfo.url && changeInfo.url.startsWith(redirectUriBase)) {
          // Remove the listener
          chrome.tabs.onUpdated.removeListener(listener);

          try {
            // Parse the response URL
            const url = new URL(changeInfo.url);
            const params = new URLSearchParams(url.search);
            
            // Also check hash for parameters (in case they're there due to routing)
            if (url.hash) {
              const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
              
              // Read state from hash if not in search params
              if (!params.get("state")) {
                const hashState = hashParams.get("state");
                if (hashState) {
                  params.set("state", hashState);
                }
              }
              
              // Read code from hash if not in search params
              if (!params.get("code")) {
                const hashCode = hashParams.get("code");
                if (hashCode) {
                  params.set("code", hashCode);
                }
              }
            }

            // Handle the callback
            const success = await handleAuthCallback(params);

            if (success) {
              try {
                const stored = await chrome.storage.local.get(RETURN_TAB_KEY);
                const target = stored[RETURN_TAB_KEY] as { id?: number; windowId?: number } | undefined;
                await chrome.storage.local.remove(RETURN_TAB_KEY);
                if (target?.id) {
                  await chrome.tabs.update(target.id, { active: true });
                  if (typeof target.windowId === "number") {
                    await chrome.windows.update(target.windowId, { focused: true });
                  }
                }
              } catch {
                // Ignore failures returning to the original tab
              }

              await chrome.tabs.remove(authTabId);
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
          chrome.storage.local.remove(RETURN_TAB_KEY).catch(() => {});
          resolve(false);
        }
      });
    });
  } catch {
    try {
      await chrome.storage.local.remove(RETURN_TAB_KEY);
    } catch {
      // Ignore cleanup failures
    }
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
    console.error("Auth callback error:", error);
    return false;
  }

  if (!code || !state) {
    console.error("Missing required parameters in callback:", { hasCode: !!code, hasState: !!state });
    return false;
  }

  // Verify state
  const stored = await chrome.storage.local.get(["pp_auth_state", "pp_auth_states"]);
  const directState = stored["pp_auth_state"];
  const rawStates = stored["pp_auth_states"];
  const now = Date.now();
  const candidates = Array.isArray(rawStates)
    ? rawStates
        .map((item: unknown) => {
          if (typeof item === "string") return { value: item, createdAt: now };
          if (item && typeof item === "object") {
            const typed = item as { value?: string; createdAt?: number };
            if (typed.value) {
              return {
                value: typed.value,
                createdAt: typeof typed.createdAt === "number" ? typed.createdAt : now,
              };
            }
          }
          return null;
        })
        .filter(Boolean) as Array<{ value: string; createdAt: number }>
    : [];

  const validStates = candidates.filter((item) => now - item.createdAt < 10 * 60 * 1000);
  const matchesDirect = directState === state;
  const matchesList = validStates.some((item) => item.value === state);
  const hasStoredState = Boolean(directState) || validStates.length > 0;

  if (!matchesDirect && !matchesList) {
    if (!hasStoredState) {
      console.warn("Auth state missing in storage; proceeding with callback", { state });
    } else {
      console.error("Auth state mismatch:", { state, hasDirect: !!directState, listSize: validStates.length });
      return false;
    }
  }

  // Clear stored state(s)
  const remaining = validStates.filter((item) => item.value !== state);
  await chrome.storage.local.remove("pp_auth_state");
  await chrome.storage.local.set({ pp_auth_states: remaining });

  try {
    // Exchange code for token
    await api.exchangeCodeForToken(code);
    await clearLegacyAuthCache();

    const freshState = await getAuthStateFromServer();
    return freshState.isAuthenticated === true;
  } catch (err) {
    console.error("Auth callback exchange failed:", err);
    await clearLegacyAuthCache();
    return false;
  }
}

/**
 * Logout and clear session
 */
export async function logout(): Promise<void> {
  await api.logout();
  await clearSession();
  await clearLegacyAuthCache();
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
