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

interface SettingsState extends AppSettings {
  session: UserSession | null;

  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setGlobalHotkey: (hotkey: string) => void;
  setStorageLocation: (path: string) => void;
  setSyncEnabled: (enabled: boolean) => void;
  setSession: (session: UserSession | null) => void;
  logout: () => void;
  initTheme: () => void;
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

      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      setGlobalHotkey: (hotkey) => set({ globalHotkey: hotkey }),
      setStorageLocation: (path) => set({ storageLocation: path }),
      setSyncEnabled: (enabled) => set({ syncEnabled: enabled }),
      setSession: (session) => set({ session }),
      logout: () => set({ session: null, syncEnabled: false }),
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
