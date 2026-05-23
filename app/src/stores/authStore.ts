import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { CONVEX_URL } from '../lib/constants';
import { tauriFetch } from '../lib/tauriFetch';
// `tauriFetch` is the right transport for Convex/Worker calls because
// browser fetch can't reach `https://api.pmtpk.com/*` from the Tauri
// webview without CORS. Tauri side proxies requests via Rust.
import { useSyncStore } from './syncStore';
import { useSettingsStore } from './settingsStore';
import { useNotificationStore } from './notificationStore';

// Helper to fetch user's billing tier from the backend
async function fetchUserTier(userId: string): Promise<string> {
  try {
    const response = await tauriFetch(`${CONVEX_URL}/api/extension/billing-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.tier) {
        return data.tier;
      }
    }
  } catch (error) {
    console.error('Failed to fetch user tier:', error);
  }
  return 'free'; // Default to free if fetch fails
}

export interface AuthSession {
  user_id: string;
  email: string | null;
  name: string | null;
  image_url: string | null;
  tier: string;
  /**
   * Active short-lived access token used by the worker.
   * - When the Convex exchange-code/refresh-token flow has run, this
   *   holds an HS256 desktop access token (1h exp, refreshable).
   * - As a legacy fallback (offline / Convex unreachable on first
   *   sign-in) this can still be the raw Clerk session token.
   */
  session_token: string;
  /** Unix seconds at which `session_token` expires. */
  expires_at: number;
  /**
   * Long-lived refresh token (UUID, 7-day rotating). Sent to
   * `/auth/refresh` to mint a new access token. Persisted alongside
   * the session in `partialize` so app restart can resume.
   */
  refresh_token?: string;
  /** Unix MILLISECONDS at which `refresh_token` expires. */
  refresh_token_expires_at?: number;
}

// Auth data from callback URL
interface AuthCallbackData {
  token: string;
  name: string | null;
  email: string | null;
  image_url: string | null;
  user_id: string | null;
}

interface AuthState {
  session: AuthSession | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  openSignIn: () => Promise<void>;
  handleAuthCallback: (data: AuthCallbackData) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  refreshTier: () => Promise<void>;
  clearError: () => void;
  cancelLoading: () => void;
  closeAuthWindow: () => Promise<void>;
  initAuthListener: () => Promise<() => void>;
  /**
   * Returns a non-expired access token, refreshing it via the worker
   * `/auth/refresh` endpoint when within 60s of expiry. Callers should
   * use this instead of reading `session.session_token` directly so a
   * long-running pack run never 401s mid-flow.
   *
   * Returns `null` when no session exists or refresh fails (treat as
   * "session expired — re-sign-in required").
   */
  getValidAccessToken: () => Promise<string | null>;
}

const REFRESH_API_URL = 'https://api.skillset.so/auth/refresh';
const CONVEX_EXCHANGE_URL = `${CONVEX_URL}/api/extension/exchange-code`;
// Refresh when access token is within this many seconds of expiry.
// Worker mints HS256 with 3600s lifetime; 60s slack stays well clear of
// inflight call cancel races.
const REFRESH_SLACK_SECONDS = 60;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      isLoading: false,
      error: null,

      openSignIn: async () => {
        set({ error: null, isLoading: true });

        try {
          await invoke('open_auth_window');
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : String(error),
            isLoading: false,
          });
        }
      },

      handleAuthCallback: async (data: AuthCallbackData) => {
        set({ isLoading: true, error: null });
        try {
          // Create session directly from callback data
          const userId = data.user_id || '';

          // Clear per-user caches if user changed. Stale data leaking
          // across accounts is a privacy issue (credit balance, marketplace
          // listings, saved filters, etc.) — wipe everything user-bound.
          const currentSession = get().session;
          const userChanged = currentSession?.user_id && currentSession.user_id !== userId;
          if (userChanged) {
            useSyncStore.getState().clearCache();
            useSettingsStore.setState({
              serverChatCount: 0,
              creditBalance: null,
              tokenUsage: { input: 0, output: 0, reasoning: 0, total: 0, calls: 0 },
            });
            // Marketplace store: drop in-memory listings / purchases / saved
            // filters from the previous account.
            try {
              const { useMarketplaceStore } = await import('./marketplaceStore');
              useMarketplaceStore.setState({
                listings: [],
                cursor: 0,
                total: 0,
                purchases: [],
                myListings: [],
                savedTagFilters: [],
                filters: { kind: 'all', query: '', tag: '', sort: 'newest' },
                error: null,
              });
            } catch {
              /* store may not exist yet in some builds */
            }
          }

          // Fetch user's tier from the backend
          const tier = userId ? await fetchUserTier(userId) : 'free';

          // Sync billingTier into settingsStore (chatStore reads from there)
          useSettingsStore.getState().setBillingTier(tier as 'free' | 'pro' | 'studio');

          // Exchange the Clerk session token for an HS256 desktop access
          // token + 7-day refresh token via Convex. This is the Phase B
          // refresh flow — without it, runs longer than ~60s 401 because
          // the raw Clerk token expires fast.
          let accessToken = data.token;
          let accessExpiresAtSec = Math.floor(Date.now() / 1000) + 3600;
          let refreshToken: string | undefined;
          let refreshExpiresAtMs: number | undefined;
          try {
            const code = btoa(JSON.stringify({
              userId,
              email: data.email,
              name: data.name,
              imageUrl: data.image_url,
              token: data.token,
              timestamp: Date.now(),
            }));
            const exchangeRes = await tauriFetch(CONVEX_EXCHANGE_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code }),
            });
            if (exchangeRes.ok) {
              const exchanged = await exchangeRes.json() as {
                accessToken?: string;
                accessTokenExpiresAt?: number;
                refreshToken?: string;
                refreshTokenExpiresAt?: number;
              };
              if (exchanged.accessToken && exchanged.accessTokenExpiresAt) {
                accessToken = exchanged.accessToken;
                // Convex returns ms, our `expires_at` field is in seconds.
                accessExpiresAtSec = Math.floor(exchanged.accessTokenExpiresAt / 1000);
              }
              if (exchanged.refreshToken && exchanged.refreshTokenExpiresAt) {
                refreshToken = exchanged.refreshToken;
                refreshExpiresAtMs = exchanged.refreshTokenExpiresAt;
              }
            } else {
              // Surface the worker's error body so a misconfigured
              // JWT_SECRET on Convex (the most common 500 cause) is
              // diagnosable from devtools.
              const errBody = await exchangeRes.text().catch(() => '');
              console.warn(
                '[auth] Convex exchange-code failed; falling back to raw Clerk token. ' +
                  `status=${exchangeRes.status} body=${errBody.slice(0, 500)}`,
              );
              useNotificationStore.getState().notify({
                category: 'auth',
                severity: 'warning',
                title: 'Offline sign-in',
                message: 'Signed in but the credit/billing service was unreachable. Long runs may need re-signing.',
                actions: [{ kind: 'dismiss' }],
                details: `status=${exchangeRes.status}\nbody=${errBody.slice(0, 500)}`,
                dedupeKey: 'auth.exchange_offline',
                source: 'authStore.exchangeCode',
              });
            }
          } catch (e) {
            // Network failure during exchange — fall back to the raw Clerk
            // token so the user can still sign in offline-ish. Long runs
            // will 401 until they sign in again with Convex reachable.
            console.warn('[auth] Convex exchange-code error:', e);
            useNotificationStore.getState().report(e, {
              source: 'authStore.exchangeCode',
            });
          }

          const session: AuthSession = {
            user_id: userId,
            email: data.email,
            name: data.name,
            image_url: data.image_url,
            tier,
            session_token: accessToken,
            expires_at: accessExpiresAtSec,
            refresh_token: refreshToken,
            refresh_token_expires_at: refreshExpiresAtMs,
          };

          // Optionally verify with backend (legacy Clerk-only verifier).
          // Skip when we have an HS256 token from exchange — the Tauri
          // verifier doesn't know HS256, will reject it.
          if (!refreshToken) {
            try {
              const verifiedSession = await invoke<AuthSession>('verify_auth_token', { token: data.token });
              session.user_id = verifiedSession.user_id || session.user_id;
              session.expires_at = verifiedSession.expires_at;
            } catch {
              console.warn('Token verification failed, using callback data');
            }
          }

          set({ session, isLoading: false });

          // Pull fresh credit balance for the newly-signed-in user. Without
          // this, the UI keeps showing the previous account's balance until
          // the user visits Settings (which has its own useEffect) or
          // manually hits Refresh in Skill Chat. Background; failures are
          // swallowed inside refreshCreditBalance.
          if (userId) {
            void (async () => {
              try {
                const { refreshCreditBalance } = await import('../lib/creditSync');
                await refreshCreditBalance(userId);
              } catch (e) {
                console.warn('[auth] credit refresh after sign-in failed:', e);
              }
            })();
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : String(error),
            isLoading: false,
          });
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          // Best-effort: revoke the refresh token server-side so a stolen
          // copy can't be replayed. Failures here are non-fatal — local
          // session is wiped regardless.
          const refreshToken = get().session?.refresh_token;
          if (refreshToken) {
            try {
              await tauriFetch('https://api.pmtpk.com/auth/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
              });
            } catch (e) {
              console.warn('[auth] refresh-token revoke failed:', e);
            }
          }
          await invoke('logout');
          // Wipe all per-user caches. Critical for shared-machine + account-
          // switch flows where the next sign-in must see fresh data, not
          // the previous account's credit balance / packs / listings.
          useSyncStore.getState().clearCache();
          useSettingsStore.setState({
            serverChatCount: 0,
            creditBalance: null,
            tokenUsage: { input: 0, output: 0, reasoning: 0, total: 0, calls: 0 },
          });
          try {
            const { useMarketplaceStore } = await import('./marketplaceStore');
            useMarketplaceStore.setState({
              listings: [],
              cursor: 0,
              total: 0,
              purchases: [],
              myListings: [],
              savedTagFilters: [],
              filters: { kind: 'all', query: '', tag: '', sort: 'newest' },
              error: null,
            });
          } catch {
            /* ignore */
          }
          set({ session: null, isLoading: false, error: null });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : String(error),
            isLoading: false,
          });
        }
      },

      checkSession: async () => {
        const { session } = get();
        if (!session) return;

        // Check if token is expired
        const now = Math.floor(Date.now() / 1000);
        if (session.expires_at < now) {
          set({ session: null });
          return;
        }

        // Verify with backend
        try {
          const validSession = await invoke<AuthSession | null>('get_auth_session');
          if (!validSession) {
            set({ session: null });
          }
        } catch {
          // If verification fails, keep existing session (offline mode)
        }
      },

      refreshTier: async () => {
        const { session } = get();
        if (!session?.user_id) return;

        try {
          const tier = await fetchUserTier(session.user_id);
          if (tier !== session.tier) {
            set({ session: { ...session, tier } });
          }
          // Always sync into settingsStore (chatStore reads from there)
          useSettingsStore.getState().setBillingTier(tier as 'free' | 'pro' | 'studio');
        } catch (error) {
          console.error('Failed to refresh tier:', error);
          useNotificationStore.getState().notify({
            category: 'unknown',
            severity: 'info',
            title: 'Plan status unavailable',
            message: "Couldn't refresh your plan status — using cached tier.",
            actions: [{ kind: 'dismiss' }],
            details: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
            dedupeKey: 'auth.tier_refresh_failed',
            source: 'authStore.refreshTier',
          }, { ttlMs: 6000 });
        }
      },

      clearError: () => set({ error: null }),

      cancelLoading: () => set({ isLoading: false }),

      closeAuthWindow: async () => {
        try {
          await invoke('close_auth_window');
        } catch {
          // Ignore errors when closing
        }
        set({ isLoading: false });
      },

      initAuthListener: async () => {
        // Listen for auth callback with user data
        const unlisten = await listen<AuthCallbackData>('auth-callback', (event) => {
          get().handleAuthCallback(event.payload);
        });
        return unlisten;
      },

      getValidAccessToken: async () => {
        const session = get().session;
        if (!session) return null;
        const nowSec = Math.floor(Date.now() / 1000);
        // Still safely within lifetime — return as-is.
        if (session.expires_at > nowSec + REFRESH_SLACK_SECONDS) {
          return session.session_token;
        }
        // Expired or near-expired. If we have a refresh token, swap.
        if (
          session.refresh_token &&
          session.refresh_token_expires_at &&
          session.refresh_token_expires_at > Date.now()
        ) {
          try {
            const res = await tauriFetch(REFRESH_API_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken: session.refresh_token }),
            });
            if (res.ok) {
              const data = await res.json() as {
                accessToken?: string;
                accessTokenExpiresAt?: number;
                refreshToken?: string;
                refreshTokenExpiresAt?: number;
              };
              if (data.accessToken && data.accessTokenExpiresAt) {
                set({
                  session: {
                    ...session,
                    session_token: data.accessToken,
                    expires_at: Math.floor(data.accessTokenExpiresAt / 1000),
                    // Refresh token rotates on every call — store the new one.
                    refresh_token: data.refreshToken ?? session.refresh_token,
                    refresh_token_expires_at:
                      data.refreshTokenExpiresAt ?? session.refresh_token_expires_at,
                  },
                });
                return data.accessToken;
              }
            } else {
              // 401/403 from refresh = refresh token revoked or reused.
              // Clear the session so the UI prompts re-sign-in.
              console.warn(`[auth] refresh failed status=${res.status}`);
              set({ session: null });
              useNotificationStore.getState().notify({
                category: 'auth',
                severity: 'error',
                title: 'Session expired',
                message: 'Sign in again to keep using Skillset.',
                actions: [{ kind: 'sign_in' }, { kind: 'dismiss' }],
                details: `refresh status=${res.status}`,
                dedupeKey: 'auth.session_expired',
                source: 'authStore.refresh',
              });
              return null;
            }
          } catch (e) {
            console.warn('[auth] refresh network error:', e);
            // Network error — return the (possibly expired) token. Caller
            // will see 401 and surface the error. We don't nuke the
            // session on transient network drops.
            return session.session_token;
          }
        }
        // No refresh token, or refresh-token itself expired. Token may
        // still be live (raw Clerk fallback path) — return it; let the
        // worker decide. If 401 comes back, UI shows re-sign-in.
        return session.session_token;
      },
    }),
    {
      name: 'promptpack-auth',
      partialize: (state) => ({ session: state.session }),
    }
  )
);
