import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings, UserSession, UserTier } from '../types';

// Helper to apply theme to document
const applyTheme = (theme: 'light' | 'dark' | 'system') => {
  const root = document.documentElement;
  if (theme === 'system') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
  } else {
    root.setAttribute('data-theme', theme);
  }
};

export interface ApiKeys {
  anthropic?: string;
  openai?: string;
  gemini?: string;
  grok?: string;
  deepseek?: string;
  perplexity?: string;
  kimi?: string;
  groq?: string;
  openrouter?: string;
}

interface SettingsState extends AppSettings {
  session: UserSession | null;
  hasCompletedOnboarding: boolean;
  apiKeys: ApiKeys;
  billingTier: 'free' | 'pro' | 'studio';
  serverChatCount: number;
  // Daily usage of the inbuilt server (Groq) — resets at local midnight.
  // Free tier is also tracked here even though its cap is small/lifetime-ish.
  serverDailyCount: number;
  serverDailyDate: string; // YYYY-MM-DD

  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setGlobalHotkey: (hotkey: string) => void;
  setStorageLocation: (path: string) => void;
  setSyncEnabled: (enabled: boolean) => void;
  setSession: (session: UserSession | null) => void;
  setApiKey: (provider: keyof ApiKeys, key: string) => void;
  setBillingTier: (tier: 'free' | 'pro' | 'studio') => void;
  incrementServerChatCount: () => void;
  /// Increment the daily inbuilt-server counter. Resets when the local
  /// date rolls over. Returns the post-increment count for cap checks.
  incrementServerDailyCount: () => number;
  /// Returns the up-to-date daily count, applying a date-rollover reset
  /// without bumping the counter. Use before sending to gate the request.
  getServerDailyCount: () => number;
  logout: () => void;
  initTheme: () => void;
  completeOnboarding: () => void;
}

function todayLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const SERVER_DAILY_CAPS: Record<'free' | 'pro' | 'studio', number> = {
  free: 3,
  pro: 200,
  studio: 400,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Default settings
      theme: 'system',
      globalHotkey: 'CommandOrControl+Shift+P',
      storageLocation: '',
      syncEnabled: false,
      session: null,
      hasCompletedOnboarding: false,
      apiKeys: {},
      billingTier: 'free',
      serverChatCount: 0,
      serverDailyCount: 0,
      serverDailyDate: todayLocal(),

      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      setGlobalHotkey: (hotkey) => set({ globalHotkey: hotkey }),
      setStorageLocation: (path) => set({ storageLocation: path }),
      setSyncEnabled: (enabled) => set({ syncEnabled: enabled }),
      setApiKey: (provider, key) =>
        set((state) => ({ apiKeys: { ...state.apiKeys, [provider]: key || undefined } })),
      setSession: (session) => set({ session }),
      setBillingTier: (tier) => set({ billingTier: tier }),
      incrementServerChatCount: () => set((s) => ({ serverChatCount: s.serverChatCount + 1 })),
      incrementServerDailyCount: () => {
        const today = todayLocal();
        let post = 0;
        set((s) => {
          if (s.serverDailyDate !== today) {
            post = 1;
            return { serverDailyDate: today, serverDailyCount: 1 };
          }
          post = s.serverDailyCount + 1;
          return { serverDailyCount: post };
        });
        return post;
      },
      getServerDailyCount: () => {
        const today = todayLocal();
        const s = get();
        if (s.serverDailyDate !== today) {
          set({ serverDailyDate: today, serverDailyCount: 0 });
          return 0;
        }
        return s.serverDailyCount;
      },
      logout: () =>
        set({
          session: null,
          syncEnabled: false,
          billingTier: 'free',
          serverChatCount: 0,
          serverDailyCount: 0,
          serverDailyDate: todayLocal(),
        }),
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      initTheme: () => {
        const { theme } = get();
        applyTheme(theme);
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
          if (get().theme === 'system') {
            applyTheme('system');
          }
        });
      },
    }),
    {
      name: 'promptpack-settings',
    }
  )
);

// Helper to check user tier limits
export const getTierLimits = (tier: UserTier) => {
  switch (tier) {
    case 'studio':
      return { promptLimit: 200, packLimit: 10 };
    case 'pro':
      return { promptLimit: 40, packLimit: 5 };
    default:
      return { promptLimit: 10, packLimit: 2 };
  }
};
