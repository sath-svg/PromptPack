import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings, UserSession, UserTier } from '../types';
import { DEFAULT_MANAGED_SELECTIONS, type ManagedTier } from '../lib/managed-models';
import { readSettingsFile, writeSettingsFile } from '../lib/settingsFile';
import { track as trackEvent } from '../lib/posthog-events';
import type { DesktopEventMap } from '../lib/posthog-events';
import { getCustomPackLimit, getPromptLimit } from '../lib/constants';

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

/**
 * AWS Bedrock auth — two supported modes:
 *
 *  1. **Bearer API key (default, simpler).** Generate a long-lived Bedrock
 *     API key in the IAM console, paste into `apiKey`. The runtime sends
 *     `Authorization: Bearer ${apiKey}` to the Bedrock runtime endpoint.
 *     No SigV4 signing. No IAM credentials required.
 *
 *  2. **IAM SigV4 (legacy, optional fallback).** For users who already
 *     have programmatic IAM credentials and don't want to mint a Bedrock
 *     API key. Provide `accessKeyId` + `secretAccessKey`; requests are
 *     signed with `aws4fetch`. Used only when `apiKey` is empty.
 *
 * `region` is always required — it goes into the host
 * (`bedrock-runtime.{region}.amazonaws.com`) regardless of auth mode.
 */
export interface BedrockConfig {
  /** Bedrock API key (bearer). Preferred. */
  apiKey?: string;
  /** Legacy IAM credentials. Used only when `apiKey` is empty. */
  accessKeyId?: string;
  secretAccessKey?: string;
  region: string;
}

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
  mistral?: string;
  cohere?: string;
  together?: string;
  fireworks?: string;
  cerebras?: string;
  bedrock?: BedrockConfig;
}

/** Subset of ApiKeys whose value is a plain string — i.e. all BYOK providers
 *  except Bedrock. Used by the generic `setApiKey` setter and the Settings
 *  multi-field input loop. */
export type StringApiKeyProvider = Exclude<keyof ApiKeys, 'bedrock'>;

/**
 * Auto top-up state snapshot. Populated from the credit-balance endpoint
 * so the desktop Settings panel can display the current configuration
 * without a separate round trip. All updates to this state happen via
 * the web /account page (Stripe Checkout for card collection, Convex
 * mutation for threshold/pack changes).
 */
export interface AutoTopupState {
  enabled: boolean;
  thresholdCredits: number;
  packKey: 'small' | 'medium' | 'large' | 'xl';
  cardBrand?: string;
  cardLast4?: string;
  hasPaymentMethod: boolean;
  lastChargeAt?: number;
  lastFailureReason?: string;
  consecutiveFailures?: number;
  monthlyCapUsd?: number;
  monthlySpentUsd?: number;
}

export interface CreditBalance {
  monthly: number;
  topup: number;
  resetAt?: number;
  autoTopup?: AutoTopupState;
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
  /**
   * Whether anonymous product usage is sent to PostHog. Defaults to true.
   * Toggled from Settings > Privacy.
   */
  telemetryOptIn: boolean;
  advancedSettingsExpanded: boolean;
  // User-chosen model per tier. Auto-routing picks one of these based on
  // prompt complexity. Defaults to recommended pick per tier.
  selectedManagedModels: Record<ManagedTier, string>;
  creditBalance: CreditBalance | null;
  /** Running totals — see TokenUsageTotals doc. */
  tokenUsage: TokenUsageTotals;

  // Default download folder for skillset/image exports.
  // When set + skipDownloadDialog=true, downloads skip the folder picker
  // and write directly to this path. Empty string = always show picker.
  defaultDownloadFolder: string;
  skipDownloadDialog: boolean;

  // Messenger bridge (Slice B: Telegram online gateway).
  // Feature-flagged off by default. Wholly client-side until WhatsApp +
  // offline fallback ship (Slice C/D).
  messengersEnabled: boolean;
  telegramBotToken: string;
  /** Chats the user has explicitly approved to spawn Skill Chat convos. */
  telegramAuthorizedChats: TelegramAuthorizedChat[];
  /** First-DM chats that hit the bot but haven't been approved yet. */
  telegramPendingChats: TelegramPendingChat[];
  /**
   * Default workspace folder applied to every fresh Skill Chat convo
   * spawned from an inbound Telegram message. Empty = no workspace —
   * agent tools (read/write/edit/bash/glob/grep) stay dormant and the
   * remote user gets text-only replies. Set this once via Settings →
   * Messengers → "Default workspace" so remote messages can edit files
   * without requiring the user to be at their desk. Per-chat overrides
   * land via the in-chat `/workspace <path>` command.
   */
  messengerDefaultWorkspace: string;

  /**
   * Skilly companion toggle. When false: floating Skilly hides, sidebar
   * row disappears, decay halts, the Skilly tab is inert. Default: true.
   */
  skillyEnabled: boolean;

  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setStorageLocation: (path: string) => void;
  setSyncEnabled: (enabled: boolean) => void;
  setSession: (session: UserSession | null) => void;
  setApiKey: (provider: StringApiKeyProvider, key: string) => void;
  setBedrockConfig: (config: BedrockConfig | null) => void;
  /** Hydrate `apiKeys` from `{appConfigDir}/settings.json`. Called once
   *  at app start. File takes priority over the localStorage-persisted
   *  values — gives users a stable on-disk source of truth they can
   *  edit by hand. */
  hydrateApiKeysFromFile: () => Promise<void>;
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
  setTelemetryOptIn: (enabled: boolean) => void;
  setAdvancedExpanded: (expanded: boolean) => void;
  setSelectedManagedModelForTier: (tier: ManagedTier, modelId: string) => void;
  setCreditBalance: (balance: CreditBalance | null) => void;
  /** Add a single managed-proxy call's token usage to the running totals. */
  recordTokenUsage: (delta: { input?: number; output?: number; reasoning?: number; total?: number }) => void;
  resetTokenUsage: () => void;
  setDefaultDownloadFolder: (path: string) => void;
  setSkipDownloadDialog: (skip: boolean) => void;
  setMessengersEnabled: (enabled: boolean) => void;
  setTelegramBotToken: (token: string) => void;
  setMessengerDefaultWorkspace: (path: string) => void;
  setSkillyEnabled: (enabled: boolean) => void;
  addTelegramPendingChat: (chat: TelegramPendingChat) => void;
  approveTelegramChat: (chatId: number) => void;
  rejectTelegramChat: (chatId: number) => void;
  removeTelegramAuthorizedChat: (chatId: number) => void;
  logout: () => void;
  initTheme: () => void;
  completeOnboarding: () => void;
  /** Re-arm the onboarding tour — TutorialOverlay re-mounts on next render. */
  resetOnboarding: () => void;
}

function todayLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export interface TelegramAuthorizedChat {
  chatId: number;
  username?: string;
  displayName?: string;
  approvedAt: number;
}

export interface TelegramPendingChat {
  chatId: number;
  username?: string;
  displayName?: string;
  firstSeenAt: number;
  lastMessagePreview: string;
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
      telemetryOptIn: true,
      advancedSettingsExpanded: false,
      selectedManagedModels: { ...DEFAULT_MANAGED_SELECTIONS },
      creditBalance: null,
      tokenUsage: { input: 0, output: 0, reasoning: 0, total: 0, calls: 0 },
      defaultDownloadFolder: '',
      skipDownloadDialog: false,
      messengersEnabled: false,
      telegramBotToken: '',
      telegramAuthorizedChats: [],
      telegramPendingChats: [],
      messengerDefaultWorkspace: '',
      skillyEnabled: true,

      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      setStorageLocation: (path) => set({ storageLocation: path }),
      setSyncEnabled: (enabled) => set({ syncEnabled: enabled }),
      setApiKey: (provider, key) => {
        const prevKey = get().apiKeys?.[provider];
        set((state) => ({ apiKeys: { ...state.apiKeys, [provider]: key || undefined } }));
        // Best-effort mirror to disk so {appConfigDir}/settings.json
        // stays in sync. Fire-and-forget — the in-memory store stays
        // authoritative even if the write fails.
        void writeSettingsFile(get().apiKeys);
        // PostHog: fire only on the empty → non-empty transition so editing
        // an existing key (or clearing it) doesn't spam events.
        if (!prevKey && key && key.trim().length > 0) {
          trackEvent('byok_added', {
            provider: provider as DesktopEventMap['byok_added']['provider'],
          });
        }
      },
      setBedrockConfig: (config) => {
        // Valid config requires `region` plus at least one auth path —
        // bearer API key OR IAM access key + secret. An empty config
        // wipes the entry.
        const isValid =
          config &&
          config.region &&
          (
            (config.apiKey && config.apiKey.length > 0) ||
            (config.accessKeyId && config.secretAccessKey)
          );
        set((state) => ({
          apiKeys: {
            ...state.apiKeys,
            bedrock: isValid ? config : undefined,
          },
        }));
        void writeSettingsFile(get().apiKeys);
      },
      hydrateApiKeysFromFile: async () => {
        const fileKeys = await readSettingsFile();
        if (!fileKeys) return;
        // File wins over the localStorage-persisted store so a user
        // can rotate keys by editing settings.json without launching
        // the app twice. Merge instead of replace so other persisted
        // fields (theme, tier, etc.) survive.
        set((state) => ({ apiKeys: { ...state.apiKeys, ...fileKeys } }));
      },
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
      setManagedModeEnabled: (enabled) => {
        set({ managedModeEnabled: enabled });
        trackEvent('managed_mode_toggled', { enabled });
      },
      setOrchestratorEnabled: (enabled) => set({ orchestratorEnabled: enabled }),
      setDeveloperMode: (enabled) => set({ developerMode: enabled }),
      setTelemetryOptIn: (enabled) => set({ telemetryOptIn: enabled }),
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
      setDefaultDownloadFolder: (path) => set({ defaultDownloadFolder: path }),
      setSkipDownloadDialog: (skip) => set({ skipDownloadDialog: skip }),
      setMessengersEnabled: (enabled) => set({ messengersEnabled: enabled }),
      setTelegramBotToken: (token) => set({ telegramBotToken: token.trim() }),
      setMessengerDefaultWorkspace: (path) => set({ messengerDefaultWorkspace: path.trim() }),
      setSkillyEnabled: (enabled) => set({ skillyEnabled: enabled }),
      addTelegramPendingChat: (chat) =>
        set((state) => {
          if (
            state.telegramAuthorizedChats.some((c) => c.chatId === chat.chatId) ||
            state.telegramPendingChats.some((c) => c.chatId === chat.chatId)
          ) {
            return {};
          }
          return { telegramPendingChats: [...state.telegramPendingChats, chat] };
        }),
      approveTelegramChat: (chatId) =>
        set((state) => {
          const pending = state.telegramPendingChats.find((c) => c.chatId === chatId);
          if (!pending) return {};
          return {
            telegramPendingChats: state.telegramPendingChats.filter((c) => c.chatId !== chatId),
            telegramAuthorizedChats: [
              ...state.telegramAuthorizedChats,
              {
                chatId: pending.chatId,
                username: pending.username,
                displayName: pending.displayName,
                approvedAt: Date.now(),
              },
            ],
          };
        }),
      rejectTelegramChat: (chatId) =>
        set((state) => ({
          telegramPendingChats: state.telegramPendingChats.filter((c) => c.chatId !== chatId),
        })),
      removeTelegramAuthorizedChat: (chatId) =>
        set((state) => ({
          telegramAuthorizedChats: state.telegramAuthorizedChats.filter((c) => c.chatId !== chatId),
        })),
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
      resetOnboarding: () => set({ hasCompletedOnboarding: false }),
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
      version: 4,
      migrate: (persisted: unknown, version: number) => {
        const s = (persisted ?? {}) as Record<string, unknown>;
        if (version < 2) {
          delete s.selectedManagedModel;
          if (!s.selectedManagedModels) {
            s.selectedManagedModels = { ...DEFAULT_MANAGED_SELECTIONS };
          }
        }
        if (version < 3) {
          // Default existing users to opted-in, matching the new install default.
          if (typeof s.telemetryOptIn !== 'boolean') s.telemetryOptIn = true;
        }
        if (version < 4) {
          // New Skilly companion toggle — default existing users on.
          if (typeof s.skillyEnabled !== 'boolean') s.skillyEnabled = true;
        }
        return s as unknown as SettingsState;
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

// Helper to surface tier limits. Single source of truth: `lib/constants.ts`.
// Free=1 pack/5 prompts, Pro=7 packs/56 prompts, Studio=17 packs/200 prompts.
export const getTierLimits = (tier: UserTier) => ({
  promptLimit: getPromptLimit(tier),
  packLimit: getCustomPackLimit(tier),
});
