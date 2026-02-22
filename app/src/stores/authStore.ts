import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { CONVEX_URL } from '../lib/constants';
import { tauriFetch } from '../lib/tauriFetch';
import { useSyncStore } from './syncStore';

// Helper to fetch user's billing tier from the backend
async function fetchUserTier(clerkId: string): Promise<string> {
  try {
    const response = await tauriFetch(`${CONVEX_URL}/api/extension/billing-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clerkId }),
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
  session_token: string;
  expires_at: number;
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
}

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

          // Clear sync store cache if user changed (prevents showing old user's packs)
          const currentSession = get().session;
          if (currentSession?.user_id && currentSession.user_id !== userId) {
            useSyncStore.getState().clearCache();
          }

          // Fetch user's tier from the backend
          const tier = userId ? await fetchUserTier(userId) : 'free';

          const session: AuthSession = {
            user_id: userId,
            email: data.email,
            name: data.name,
            image_url: data.image_url,
            tier,
            session_token: data.token,
            expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
          };

          // Optionally verify with backend
          try {
            const verifiedSession = await invoke<AuthSession>('verify_auth_token', { token: data.token });
            // Merge verified data with user info from callback
            session.user_id = verifiedSession.user_id || session.user_id;
            session.expires_at = verifiedSession.expires_at;
          } catch {
            // If verification fails, use data from callback
            console.warn('Token verification failed, using callback data');
          }

          set({ session, isLoading: false });
          // Close the auth window after successful login
          await invoke('close_auth_window');
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
          await invoke('logout');
          // Clear sync store cache on logout to prevent showing old user's packs
          useSyncStore.getState().clearCache();
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
        } catch (error) {
          console.error('Failed to refresh tier:', error);
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
    }),
    {
      name: 'promptpack-auth',
      partialize: (state) => ({ session: state.session }),
    }
  )
);
