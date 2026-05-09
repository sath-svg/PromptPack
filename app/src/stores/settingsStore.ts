import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings, UserSession, UserTier } from '../types';
import { DEFAULT_MANAGED_SELECTIONS, type ManagedTier } from '../lib/managed-models';

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

export interface CreditBalance {
  monthly: number;
  topup: number;
  resetAt?: number;
}

/**
 * Cumulative token spend across managed-proxy calls in this session.
 * Reset on logout. Per-call deltas come from the worker's
 * `X-Tokens-Input` / `X-Tokens-Output` / `X-Tokens-Reasoning` /
 * `X-Tokens-Total` headers (see `creditSync.syncCreditsFromHeaders`).
 */
export interface TokenUsageTotals {
  input: number;
  output: number;
  reasoning: number;
  total: number;
  /** Number of managed-proxy calls counted into the totals above. */
  calls: number;
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

  // Managed-mode (credit-metered OpenRouter via /api/llm/chat)
  managedModeEnabled: boolean;
  // Skill Chat orchestrator (planner → router → executor → merge).
  // Off by default so the existing single-shot path stays the default
  // experience. Toggle on to route managed-mode messages through the
  // multi-subtask workflow runner.
  orchestratorEnabled: boolean;
  /**
   * Developer mode. Off by default — Run Trace renders a friendly,
   * jargon-free progress view (step 1 of 3, current model, plain
   * status text). On — full technical view with tool catalogs,
   * shared-memory snapshot, planner JSON, etc. Toggle in Settings.
   */
  developerMode: boolean;
  advancedSettingsExpanded: boolean;
  // User-chosen model per tier. Auto-routing picks one of these based on
  // prompt complexity. Defaults to recommended pick per tier.
  selectedManagedModels: Record<ManagedTier, string>;
  creditBalance: CreditBalance | null;
  /** Running totals — see TokenUsageTotals doc. */
  tokenUsage: TokenUsageTotals;

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
  setManagedModeEnabled: (enabled: boolean) => void;
  setOrchestratorEnabled: (enabled: boolean) => void;
  setDeveloperMode: (enabled: boolean) => void;
  setAdvancedExpanded: (expanded: boolean) => void;
  setSelectedManagedModelForTier: (tier: ManagedTier, modelId: string) => void;
  setCreditBalance: (balance: CreditBalance | null) => void;
  /** Add a single managed-proxy call's token usage to the running totals. */
  recordTokenUsage: (delta: { input?: number; output?: number; reasoning?: number; total?: number }) => void;
  resetTokenUsage: () => void;
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
      managedModeEnabled: true,
      // Auto-routes multi-step prompts through the orchestrator, single-
      // shot for everything else. The chat header used to expose a manual
      // toggle for this; the dual gate (`looksMultiStep` + non-fast tier)
      // is conservative enough that we leave it on by default and surface
      // the decision via the "Auto: workflow"/"Auto: single-shot" pill on
      // each assistant message.
      orchestratorEnabled: true,
      developerMode: false,
      advancedSettingsExpanded: false,
      selectedManagedModels: { ...DEFAULT_MANAGED_SELECTIONS },
      creditBalance: null,
      tokenUsage: { input: 0, output: 0, reasoning: 0, total: 0, calls: 0 },

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
      setManagedModeEnabled: (enabled) => set({ managedModeEnabled: enabled }),
      setOrchestratorEnabled: (enabled) => set({ orchestratorEnabled: enabled }),
      setDeveloperMode: (enabled) => set({ developerMode: enabled }),
      setAdvancedExpanded: (expanded) => set({ advancedSettingsExpanded: expanded }),
      setSelectedManagedModelForTier: (tier, modelId) =>
        set((s) => ({ selectedManagedModels: { ...s.selectedManagedModels, [tier]: modelId } })),
      setCreditBalance: (balance) => set({ creditBalance: balance }),
      recordTokenUsage: (delta) => set((s) => ({
        tokenUsage: {
          input: s.tokenUsage.input + (delta.input ?? 0),
          output: s.tokenUsage.output + (delta.output ?? 0),
          reasoning: s.tokenUsage.reasoning + (delta.reasoning ?? 0),
          total:
            s.tokenUsage.total +
            (delta.total ?? (delta.input ?? 0) + (delta.output ?? 0)),
          calls: s.tokenUsage.calls + 1,
        },
      })),
      resetTokenUsage: () => set({
        tokenUsage: { input: 0, output: 0, reasoning: 0, total: 0, calls: 0 },
      }),
      logout: () =>
        set({
          session: null,
          syncEnabled: false,
          billingTier: 'free',
          serverChatCount: 0,
          serverDailyCount: 0,
          serverDailyDate: todayLocal(),
          creditBalance: null,
          tokenUsage: { input: 0, output: 0, reasoning: 0, total: 0, calls: 0 },
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
      version: 2,
      migrate: (persisted: unknown, version: number) => {
        const s = (persisted ?? {}) as Record<string, unknown>;
        if (version < 2) {
          delete s.selectedManagedModel;
          if (!s.selectedManagedModels) {
            s.selectedManagedModels = { ...DEFAULT_MANAGED_SELECTIONS };
          }
        }
        return s as SettingsState;
      },
      merge: (persisted, current) => {
        const merged = { ...current, ...(persisted as Partial<SettingsState>) };
        if (!merged.selectedManagedModels) {
          merged.selectedManagedModels = { ...DEFAULT_MANAGED_SELECTIONS };
        }
        return merged;
      },
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
