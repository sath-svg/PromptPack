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

  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setGlobalHotkey: (hotkey: string) => void;
  setStorageLocation: (path: string) => void;
  setSyncEnabled: (enabled: boolean) => void;
  setSession: (session: UserSession | null) => void;
  setApiKey: (provider: keyof ApiKeys, key: string) => void;
  setBillingTier: (tier: 'free' | 'pro' | 'studio') => void;
  incrementServerChatCount: () => void;
  logout: () => void;
  initTheme: () => void;
  completeOnboarding: () => void;
}

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
      logout: () => set({ session: null, syncEnabled: false, billingTier: 'free', serverChatCount: 0 }),
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
