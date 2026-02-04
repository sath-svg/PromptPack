// Auth module for PromptPack
// Handles Clerk authentication via extension auth flow

import { getSession, isAuthenticated, saveSession, clearSession, type UserSession } from "./db";
import { api } from "./api";
import {
  AUTH_URL,
  DASHBOARD_URL,
  PRICING_URL,
  SIGN_OUT_URL,
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
  classifyLimit?: number; // Daily limit for AI headers (50 free, 500 pro)
};

// Classify rate limits
const CLASSIFY_FREE_LIMIT = 50;
const CLASSIFY_PRO_LIMIT = 500;
const CLASSIFY_USAGE_KEY = "pp_classify_usage";

type AuthStateCache = {
  state: AuthState;
  cachedAt: number;
};

const RETURN_TAB_KEY = "pp_auth_return_tab";
const LEGACY_AUTH_CACHE_KEY = "pp_auth_cache";
const AUTH_STATE_CACHE_KEY = "pp_auth_state_cache";
const AUTH_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 1 day

function isSessionValid(session: UserSession | null | undefined): boolean {
  if (!session || !session.accessToken) return false;
  // Check session expiry first (3 days) - this is the primary validity check
  // JWT expiry is handled separately with refresh logic
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
 * Get cached auth state from storage
 */
async function getCachedAuthState(): Promise<AuthStateCache | null> {
  try {
    const result = await chrome.storage.local.get(AUTH_STATE_CACHE_KEY);
    const cache = result[AUTH_STATE_CACHE_KEY] as AuthStateCache | undefined;
    if (cache && cache.state && typeof cache.cachedAt === "number") {
      return cache;
    }
  } catch {
    // Ignore cache read failures
  }
  return null;
}

/**
 * Save auth state to cache
 */
async function setCachedAuthState(state: AuthState): Promise<void> {
  try {
    const cache: AuthStateCache = {
      state,
      cachedAt: Date.now(),
    };
    await chrome.storage.local.set({ [AUTH_STATE_CACHE_KEY]: cache });
  } catch {
    // Ignore cache write failures
  }
}

/**
 * Clear auth state cache
 */
async function clearAuthStateCache(): Promise<void> {
  try {
    await chrome.storage.local.remove(AUTH_STATE_CACHE_KEY);
  } catch {
    // Ignore cache clear failures
  }
}

/**
 * Check if cached auth state is still valid (less than 1 day old)
 */
function isCacheValid(cache: AuthStateCache): boolean {
  const age = Date.now() - cache.cachedAt;
  return age < AUTH_CACHE_MAX_AGE_MS;
}

// ============ Classify Usage Tracking ============

type ClassifyUsage = {
  count: number;
  date: string; // ISO date string (YYYY-MM-DD)
};

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 */
function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Get classify usage for today
 */
async function getClassifyUsage(): Promise<ClassifyUsage> {
  try {
    const result = await chrome.storage.local.get(CLASSIFY_USAGE_KEY);
    const usage = result[CLASSIFY_USAGE_KEY] as ClassifyUsage | undefined;
    const today = getTodayDate();

    // Reset counter if it's a new day
    if (usage && usage.date === today) {
      return usage;
    }

    // New day or no usage - return zero
    return { count: 0, date: today };
  } catch {
    return { count: 0, date: getTodayDate() };
  }
}

/**
 * Increment classify usage counter
 */
export async function incrementClassifyUsage(): Promise<number> {
  const usage = await getClassifyUsage();
  const newCount = usage.count + 1;

  try {
    await chrome.storage.local.set({
      [CLASSIFY_USAGE_KEY]: { count: newCount, date: usage.date },
    });
  } catch {
    // Ignore storage errors
  }

  return newCount;
}

/**
 * Check if user can classify (has remaining quota)
 */
export async function canClassify(authState: AuthState): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
}> {
  if (!authState.isAuthenticated) {
    return { allowed: false, remaining: 0, limit: 0 };
  }

  const limit = authState.classifyLimit ?? (authState.billing?.isPro ? CLASSIFY_PRO_LIMIT : CLASSIFY_FREE_LIMIT);
  const usage = await getClassifyUsage();
  const remaining = Math.max(0, limit - usage.count);

  return {
    allowed: usage.count < limit,
    remaining,
    limit,
  };
}

/**
 * Get classify limit based on billing status
 */
function getClassifyLimit(isPro: boolean): number {
  return isPro ? CLASSIFY_PRO_LIMIT : CLASSIFY_FREE_LIMIT;
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
 * Get cached auth state instantly (for fast UI rendering)
 * Returns cached state if valid, otherwise null
 */
export async function getAuthStateCached(): Promise<AuthState | null> {
  const cache = await getCachedAuthState();
  if (cache && isCacheValid(cache)) {
    return cache.state;
  }
  return null;
}

/**
 * Get current auth state - uses cache if valid, otherwise fetches fresh
 */
export async function getAuthState(): Promise<AuthState> {
  await clearLegacyAuthCache();

  // Check cache first
  const cache = await getCachedAuthState();
  if (cache && isCacheValid(cache)) {
    return cache.state;
  }

  // Cache miss or expired - fetch fresh
  const state = await getAuthStateFromServer();
  await setCachedAuthState(state);
  return state;
}

/**
 * Get auth state from server (network call)
 */
async function getAuthStateFromServer(): Promise<AuthState> {
  const session = await getSession();

  if (!session) {
    return { isAuthenticated: false };
  }

  // Check if session is still valid (JWT not expired, session not expired)
  if (!isSessionValid(session)) {
    // Session expired - try to refresh if we have a refresh token
    if (session.refreshToken) {
      // Check if this is a legacy token (JWT used as refresh token)
      const isLegacyToken = session.refreshToken.includes(".") || session.refreshToken.length > 100;

      if (isLegacyToken) {
        await clearSession();
        await clearLegacyAuthCache();
        return { isAuthenticated: false };
      }

      const refreshed = await api.refreshToken();
      if (refreshed) {
        const newSession = await getSession();
        // After successful refresh, trust the session's expiresAt (not JWT expiry)
        // The refresh updated expiresAt but not the JWT itself
        if (newSession && newSession.expiresAt > Date.now()) {
          // Fetch billing info from Convex
          const billing = await getBillingInfo(newSession.userId);
          const isPro = billing?.isPro ?? false;

          return {
            isAuthenticated: true,
            user: {
              id: newSession.userId,
              email: newSession.email,
              tier: newSession.tier,
            },
            entitlements: newSession.entitlements,
            billing: billing || undefined,
            classifyLimit: getClassifyLimit(isPro),
          };
        }
      }
    }

    // Refresh failed or no refresh token - clear session
    await clearSession();
    await clearLegacyAuthCache();
    return { isAuthenticated: false };
  }

  // Session is valid locally - trust it without server verification
  // JWT verification is expensive and JWTs expire quickly (60s-2min)
  // The session.expiresAt (3 days) is the source of truth for local validity
  // Server-side operations will fail and trigger re-auth if truly invalid

  // Fetch billing info from Convex
  const billing = await getBillingInfo(session.userId);
  const isPro = billing?.isPro ?? false;

  return {
    isAuthenticated: true,
    user: {
      id: session.userId,
      email: session.email,
      tier: session.tier,
    },
    entitlements: session.entitlements,
    billing: billing || undefined,
    classifyLimit: getClassifyLimit(isPro),
  };
}

/**
 * Verify auth state in background and update cache if changed
 * Returns new state if different from current, null if same
 *
 * IMPORTANT: If user is currently authenticated, we only check billing status
 * to avoid logging them out due to JWT expiry or network issues.
 */
export async function verifyAuthStateBackground(currentState: AuthState): Promise<AuthState | null> {
  try {
    // If user is authenticated, only check billing - don't do full JWT verification
    // This prevents logout due to expired JWT or network issues
    if (currentState.isAuthenticated && currentState.user?.id) {
      const billing = await getBillingInfo(currentState.user.id);

      if (billing) {
        // Check if billing status changed
        const proChanged = billing.isPro !== currentState.billing?.isPro;

        if (proChanged) {
          const newState: AuthState = {
            ...currentState,
            billing,
            classifyLimit: billing.isPro ? 500 : 50,
          };
          await setCachedAuthState(newState);
          return newState;
        }

        // No change - just refresh cache timestamp
        await setCachedAuthState(currentState);
      }
      // If billing call failed, don't change anything
      return null;
    }

    // User not authenticated - do full check
    const freshState = await getAuthStateFromServer();

    // Check if state changed
    const changed =
      freshState.isAuthenticated !== currentState.isAuthenticated ||
      freshState.user?.id !== currentState.user?.id ||
      freshState.billing?.isPro !== currentState.billing?.isPro;

    // Update cache with fresh state
    await setCachedAuthState(freshState);

    // Return new state only if changed
    return changed ? freshState : null;
  } catch {
    // Silently fail background verification - don't change auth state
    return null;
  }
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
    // Cache the auth state for instant popup rendering next time
    await setCachedAuthState(freshState);
    return freshState.isAuthenticated === true;
  } catch (err) {
    console.error("Auth callback exchange failed:", err);
    await clearLegacyAuthCache();
    return false;
  }
}

/**
 * Logout and clear session
 * Opens Clerk sign-out page in new tab, closes it when done
 */
export async function logout(): Promise<void> {
  // First revoke refresh token and clear local session
  await api.logout();
  await clearSession();
  await clearLegacyAuthCache();
  await clearAuthStateCache();

  // Open Clerk sign-out page in a new tab
  try {
    const tab = await chrome.tabs.create({
      url: SIGN_OUT_URL,
      active: false, // Open in background
    });

    if (tab.id) {
      const signOutTabId = tab.id;

      // Listen for the tab to finish loading, then close it
      const listener = (
        tabId: number,
        changeInfo: { status?: string },
      ) => {
        if (tabId !== signOutTabId) return;

        // Wait for the page to complete loading
        if (changeInfo.status === "complete") {
          chrome.tabs.onUpdated.removeListener(listener);

          // Give Clerk a moment to process the sign-out, then close
          setTimeout(() => {
            chrome.tabs.remove(signOutTabId).catch(() => {
              // Tab might already be closed
            });
          }, 1500);
        }
      };

      chrome.tabs.onUpdated.addListener(listener);

      // Safety timeout - close tab after 10 seconds regardless
      setTimeout(() => {
        chrome.tabs.onUpdated.removeListener(listener);
        chrome.tabs.remove(signOutTabId).catch(() => {
          // Tab might already be closed
        });
      }, 10000);
    }
  } catch {
    // Ignore errors opening sign-out tab
    // Local session is already cleared, so user is logged out locally
  }
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
