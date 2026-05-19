import { useState, useEffect } from 'react';
import { Moon, Sun, Monitor, Keyboard, User, LogOut, CheckCircle2, XCircle, Loader2, Key, Eye, EyeOff, Sparkles, ChevronDown, ChevronRight, Code2, FolderOpen, Download } from 'lucide-react';
import { getVersion } from '@tauri-apps/api/app';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { open as openShell } from '@tauri-apps/plugin-shell';
import { useSettingsStore, getTierLimits, type StringApiKeyProvider, type BedrockConfig } from '../../stores/settingsStore';
import { useAuthStore } from '../../stores/authStore';
import { PROVIDER_LABELS } from '../../lib/classifier';
import { MANAGED_MODELS, MANAGED_TIER_LABELS, formatCreditRate } from '../../lib/managed-models';
import { CONVEX_URL, WEB_APP_URL } from '../../lib/constants';
import { tauriFetch } from '../../lib/tauriFetch';
import { formatShortcut } from '../../lib/platform';
import { useNotificationStore } from '../../stores/notificationStore';

interface BillingStatus {
  tier: 'free' | 'pro' | 'studio';
  hasPro: boolean;
  isStudio?: boolean;
  // `legacy_pro` flags grandfathered $9 subscribers. Drives the in-app upgrade
  // card under Account. Backend sets it from the user row's planVariant field.
  planVariant?: 'pro' | 'legacy_pro' | null;
}

export function SettingsPage() {
  const {
    theme, setTheme, apiKeys, setApiKey, setBedrockConfig, setBillingTier,
    managedModeEnabled, setManagedModeEnabled,
    developerMode, setDeveloperMode,
    advancedSettingsExpanded, setAdvancedExpanded,
    selectedManagedModels, setSelectedManagedModelForTier,
    creditBalance, setCreditBalance,
    tokenUsage, resetTokenUsage,
    defaultDownloadFolder, setDefaultDownloadFolder,
    skipDownloadDialog, setSkipDownloadDialog,
  } = useSettingsStore();
  const { session } = useAuthStore();
  const [appVersion, setAppVersion] = useState('');

  useEffect(() => {
    getVersion().then(setAppVersion).catch(() => setAppVersion(''));
  }, []);

  // Fetch credit balance for managed mode display
  useEffect(() => {
    if (!session?.user_id) {
      setCreditBalance(null);
      return;
    }
    const fetchBalance = async () => {
      try {
        const r = await tauriFetch(`${CONVEX_URL}/api/extension/credit-balance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: session.user_id }),
        });
        if (!r.ok) return;
        const data = await r.json() as {
          monthly?: number;
          topup?: number;
          monthlyResetAt?: number;
        };
        setCreditBalance({
          monthly: data.monthly ?? 0,
          topup: data.topup ?? 0,
          resetAt: data.monthlyResetAt,
        });
      } catch (err) {
        console.error('credit balance fetch failed:', err);
        useNotificationStore.getState().notify({
          category: 'unknown',
          severity: 'info',
          title: 'Credit balance unavailable',
          message: "Couldn't load your credit balance — check your connection.",
          actions: [{ kind: 'dismiss' }],
          details: err instanceof Error ? `${err.name}: ${err.message}` : String(err),
          dedupeKey: 'settings.credit_balance_failed',
          source: 'Settings.fetchBalance',
        }, { ttlMs: 6000 });
      }
    };
    fetchBalance();
  }, [session?.user_id]);

  const openTopupPage = () => {
    openShell('https://skillset.so/dashboard?topup=open').catch(console.error);
  };

  const totalCredits = creditBalance
    ? creditBalance.monthly + creditBalance.topup
    : 0;

  type KeyedProvider = StringApiKeyProvider;
  const KEYED_PROVIDERS: { key: KeyedProvider; placeholder: string }[] = [
    { key: 'anthropic',  placeholder: 'sk-ant-...' },
    { key: 'openai',     placeholder: 'sk-...' },
    { key: 'gemini',     placeholder: 'AIza...' },
    { key: 'grok',       placeholder: 'xai-...' },
    { key: 'deepseek',   placeholder: 'sk-...' },
    { key: 'perplexity', placeholder: 'pplx-...' },
    { key: 'kimi',       placeholder: 'sk-...' },
    { key: 'mistral',    placeholder: 'mistral API key' },
    { key: 'cohere',     placeholder: 'Cohere API key' },
    { key: 'together',   placeholder: 'Together AI key' },
    { key: 'fireworks',  placeholder: 'fw_...' },
    { key: 'cerebras',   placeholder: 'csk-...' },
    // `groq` + `openrouter` BYOK fields removed from the UI so the
    // user surface stays brand-clean. Stored values still pass through
    // the runtime providers list — users with a key already saved keep
    // it; only the input row is hidden.
  ];
  const [inputs, setInputs] = useState<Record<KeyedProvider, string>>({
    anthropic:  apiKeys?.anthropic  ?? '',
    openai:     apiKeys?.openai     ?? '',
    gemini:     apiKeys?.gemini     ?? '',
    grok:       apiKeys?.grok       ?? '',
    deepseek:   apiKeys?.deepseek   ?? '',
    perplexity: apiKeys?.perplexity ?? '',
    kimi:       apiKeys?.kimi       ?? '',
    groq:       apiKeys?.groq       ?? '',
    openrouter: apiKeys?.openrouter ?? '',
    mistral:    apiKeys?.mistral    ?? '',
    cohere:     apiKeys?.cohere     ?? '',
    together:   apiKeys?.together   ?? '',
    fireworks:  apiKeys?.fireworks  ?? '',
    cerebras:   apiKeys?.cerebras   ?? '',
  });
  // Bedrock has three required fields (access key + secret + region) plus
  // optional cross-region inference toggle and per-tier model-ID overrides.
  const [bedrockInput, setBedrockInput] = useState<BedrockConfig>({
    accessKeyId:     apiKeys?.bedrock?.accessKeyId     ?? '',
    secretAccessKey: apiKeys?.bedrock?.secretAccessKey ?? '',
    region:          apiKeys?.bedrock?.region          ?? 'us-east-1',
    useInferenceProfile: apiKeys?.bedrock?.useInferenceProfile ?? false,
    modelIdOverrides: {
      haiku:  apiKeys?.bedrock?.modelIdOverrides?.haiku  ?? '',
      sonnet: apiKeys?.bedrock?.modelIdOverrides?.sonnet ?? '',
      opus:   apiKeys?.bedrock?.modelIdOverrides?.opus   ?? '',
    },
  });
  const [bedrockSecretVisible, setBedrockSecretVisible] = useState(false);
  const [bedrockOverridesOpen, setBedrockOverridesOpen] = useState(false);
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
  const [isLoadingBilling, setIsLoadingBilling] = useState(false);

  // Fetch actual billing status from API
  useEffect(() => {
    if (!session?.user_id) {
      setBillingStatus(null);
      return;
    }

    const fetchBillingStatus = async () => {
      setIsLoadingBilling(true);
      try {
        const response = await tauriFetch(`${CONVEX_URL}/api/extension/billing-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: session.user_id }),
        });

        if (response.ok) {
          const data = await response.json();
          setBillingStatus(data);
          if (data.tier) setBillingTier(data.tier);
        }
      } catch (error) {
        console.error('Failed to fetch billing status:', error);
        useNotificationStore.getState().notify({
          category: 'unknown',
          severity: 'info',
          title: 'Billing status unavailable',
          message: "Couldn't load your plan details — using cached info.",
          actions: [{ kind: 'dismiss' }],
          details: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
          dedupeKey: 'settings.billing_status_failed',
          source: 'Settings.fetchBillingStatus',
        }, { ttlMs: 6000 });
      } finally {
        setIsLoadingBilling(false);
      }
    };

    fetchBillingStatus();
  }, [session?.user_id]);

  const currentTier = billingStatus?.tier || 'free';
  const tierLimits = getTierLimits(currentTier);

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6">
        Settings
      </h2>

      <div className="space-y-6">
        {/* Appearance */}
        <section id="settings-appearance" className="p-4 border border-[var(--border)] rounded-lg bg-[var(--card)] scroll-mt-16">
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-4">
            Appearance
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Theme
              </label>
              <div className="flex gap-2">
                {[
                  { value: 'light', icon: Sun, label: 'Light' },
                  { value: 'dark', icon: Moon, label: 'Dark' },
                  { value: 'system', icon: Monitor, label: 'System' },
                ].map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    onClick={() => setTheme(value as 'light' | 'dark' | 'system')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                      theme === value
                        ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                        : 'border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)]'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Shortcuts */}
        <section id="settings-shortcuts" className="p-4 border border-[var(--border)] rounded-lg bg-[var(--card)] scroll-mt-16">
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-4">
            Shortcuts
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Keyboard size={18} className="text-[var(--muted-foreground)]" />
                <div>
                  <p className="font-medium text-[var(--foreground)]">Search</p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Focus the header search bar
                  </p>
                </div>
              </div>
              <kbd className="px-3 py-1.5 rounded bg-[var(--muted)] text-sm font-mono text-[var(--foreground)]">
                {formatShortcut('Control+K')}
              </kbd>
            </div>
          </div>
        </section>

        {/* Account */}
        <section id="settings-account" className="p-4 border border-[var(--border)] rounded-lg bg-[var(--card)] scroll-mt-16">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-[var(--foreground)]">
              Account
            </h3>
            {session ? (
              <div className="flex items-center gap-1.5 text-green-500">
                <CheckCircle2 size={16} />
                <span className="text-sm">Synced</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
                <XCircle size={16} />
                <span className="text-sm">Not synced</span>
              </div>
            )}
          </div>

          {session ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {session.image_url ? (
                  <img
                    src={session.image_url}
                    alt={session.name ?? session.email ?? undefined}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[var(--primary)] flex items-center justify-center">
                    <User size={24} className="text-[var(--primary-foreground)]" />
                  </div>
                )}
                <div>
                  {session.name && (
                    <p className="font-medium text-[var(--foreground)]">{session.name}</p>
                  )}
                  <p className={session.name ? "text-sm text-[var(--muted-foreground)]" : "font-medium text-[var(--foreground)]"}>
                    {session.email}
                  </p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {isLoadingBilling ? (
                      <span className="flex items-center gap-1">
                        <Loader2 size={12} className="animate-spin" />
                        Loading...
                      </span>
                    ) : (
                      `${currentTier.charAt(0).toUpperCase() + currentTier.slice(1)} Plan`
                    )}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[var(--muted)]">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[var(--muted-foreground)]">Skill Limit</span>
                  <span className="text-[var(--foreground)]">{tierLimits.promptLimit}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--muted-foreground)]">Skillset Limit</span>
                  <span className="text-[var(--foreground)]">{tierLimits.packLimit}</span>
                </div>
              </div>

              {/* Legacy Pro grandfather upgrade card. Only renders for
                  grandfathered $9 subscribers (planVariant === "legacy_pro").
                  CTA opens skillset.so/account/upgrade?from=legacy in default
                  browser. After Stripe checkout completes, the webhook flips
                  planVariant → "pro" and this card disappears on next render. */}
              {billingStatus?.planVariant === 'legacy_pro' && (
                <div className="p-4 rounded-lg border border-[var(--primary)]/30 bg-[var(--primary)]/[0.04]">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        You're on the legacy Pro plan
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                        Locked at your original price · 300 credits / month from next cycle
                      </p>
                    </div>
                    <span
                      className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider border border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                    >
                      Legacy
                    </span>
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)] mb-3 leading-relaxed">
                    Upgrade to the new $15 Pro plan for the full 750 credits / month
                    and more headroom for heavy days. Cancel any time — you keep
                    your legacy rate if you change your mind before checkout.
                  </p>
                  <a
                    href="https://skillset.so/account/upgrade?from=legacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-3 py-1.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm hover:opacity-90 transition-opacity"
                  >
                    Upgrade to $15 Pro →
                  </a>
                </div>
              )}

              <button
                onClick={() => useAuthStore.getState().logout()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-[var(--muted-foreground)] mb-4">
                Sign in to sync your prompts across devices
              </p>
              <button className="px-6 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90">
                Sign In
              </button>
            </div>
          )}
        </section>

        {/* AI Credits (managed-mode) */}
        <section id="settings-credits" className="p-4 border border-[var(--border)] rounded-lg bg-[var(--card)] scroll-mt-16">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={18} className="text-[var(--primary)]" />
            <h3 className="text-lg font-medium text-[var(--foreground)]">AI Credits</h3>
          </div>

          {/* Managed-mode toggle */}
          <label className="flex items-center justify-between p-3 rounded-lg bg-[var(--background)] border border-[var(--border)] mb-3 cursor-pointer">
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">Managed mode (using Skillset credits)</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                Route chats through curated managed models. Metered against your credit balance.
              </p>
            </div>
            <input
              type="checkbox"
              checked={managedModeEnabled}
              onChange={(e) => setManagedModeEnabled(e.target.checked)}
              className="w-5 h-5 accent-[var(--primary)]"
            />
          </label>

          {/* Balance + top-up */}
          {session ? (
            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--primary)]/5 border border-[var(--primary)]/20 mb-3">
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">{totalCredits} credits</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {creditBalance
                    ? `${creditBalance.monthly} monthly · ${creditBalance.topup} top-up`
                    : 'Loading…'}
                </p>
              </div>
              <button
                onClick={openTopupPage}
                className="px-3 py-1.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm hover:opacity-90"
              >
                Buy more
              </button>
            </div>
          ) : (
            <p className="text-xs text-[var(--muted-foreground)] mb-3">Sign in to see your credit balance.</p>
          )}

          {/* Token usage — pulled from worker headers on every settled
              managed-proxy call. Resets on logout or via the button.
              Only renders when the user has actually used managed mode
              this session, so a fresh sign-in doesn't show all zeros. */}
          {session && tokenUsage.calls > 0 && (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 mb-3 text-[11px] text-[var(--muted-foreground)] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-[var(--foreground)]">
                  Tokens this session
                </span>
                <button
                  onClick={resetTokenUsage}
                  className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  title="Reset session token counter"
                >
                  Reset
                </button>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 font-mono">
                <span>input</span>
                <span className="text-right">{tokenUsage.input.toLocaleString()}</span>
                <span>output</span>
                <span className="text-right">{tokenUsage.output.toLocaleString()}</span>
                {tokenUsage.reasoning > 0 && (
                  <>
                    <span>reasoning</span>
                    <span className="text-right">
                      {tokenUsage.reasoning.toLocaleString()}
                    </span>
                  </>
                )}
                <span>total</span>
                <span className="text-right">{tokenUsage.total.toLocaleString()}</span>
                <span>calls</span>
                <span className="text-right">{tokenUsage.calls.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Per-tier model picks. Auto-router selects one of these
              based on prompt complexity. */}
          <p className="text-sm font-medium text-[var(--foreground)] mb-1">Auto-router models</p>
          <p className="text-xs text-[var(--muted-foreground)] mb-1">
            Pick one model per tier. Each chat message is routed to the cheapest tier capable of handling it.
          </p>
          <div className="rounded-md bg-[var(--background)] border border-[var(--border)] px-3 py-2 mb-3 space-y-1">
            <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">
              <span className="font-mono text-[var(--foreground)]">cr/K</span>{' '}
              = credits per <strong>1,000 tokens</strong>.
            </p>
            <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">
              <span className="font-mono text-[var(--foreground)]">in</span> = your prompt + chat history + tool results sent to the model.
              {' '}<span className="font-mono text-[var(--foreground)]">out</span> = the model's reply (reasoning tokens count as output).
            </p>
            <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">
              Example: a model labeled <span className="font-mono">2 cr/K in · 8 cr/K out</span> charges{' '}
              <span className="font-mono">2 credits</span> for every 1,000 tokens you send and{' '}
              <span className="font-mono">8 credits</span> for every 1,000 it generates.
              A typical 500-token question with a 1,000-token answer costs{' '}
              <span className="font-mono">~9 credits</span>.
            </p>
          </div>
          <div className="space-y-3">
            {(['cheap', 'mid', 'frontier'] as const).map((tier) => (
              <div key={tier}>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  {MANAGED_TIER_LABELS[tier]}
                </label>
                <select
                  value={selectedManagedModels[tier]}
                  onChange={(e) => setSelectedManagedModelForTier(tier, e.target.value)}
                  disabled={!managedModeEnabled}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] disabled:opacity-50"
                >
                  {MANAGED_MODELS.filter((m) => m.tier === tier).map((m) => (
                    <option
                      key={m.id}
                      value={m.id}
                      // Chromium-based browsers (Tauri webview) honour
                      // option style attributes when the listbox is
                      // open. The selected-row colour is OS-themed and
                      // can't be overridden — that's expected.
                      style={m.expensive ? { color: '#f97316' } : undefined}
                    >
                      {m.label}
                      {m.expensive ? ' · expensive — burns credits fast' : ''}
                      {' · '}
                      {formatCreditRate(m)}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </section>

        {/* Downloads — default folder + skip dialog */}
        <section id="settings-downloads" className="p-4 border border-[var(--border)] rounded-lg bg-[var(--card)] scroll-mt-16">
          <div className="flex items-center gap-2 mb-3">
            <Download size={18} className="text-[var(--muted-foreground)]" />
            <h3 className="text-lg font-medium text-[var(--foreground)]">Downloads</h3>
          </div>
          <div className="space-y-3">
            {/* Default folder picker */}
            <div className="p-3 rounded-lg bg-[var(--background)] border border-[var(--border)]">
              <p className="text-sm font-medium text-[var(--foreground)] mb-1">Default Download Folder</p>
              <p className="text-xs text-[var(--muted-foreground)] mb-2">
                Used as starting folder for export dialogs. When "Skip dialog" is on, files save here directly.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={defaultDownloadFolder}
                  onChange={(e) => setDefaultDownloadFolder(e.target.value)}
                  placeholder="e.g., C:/Users/You/Downloads/Skillsets"
                  className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--input)] text-[var(--foreground)] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
                <button
                  onClick={async () => {
                    try {
                      const selected = await openDialog({
                        directory: true,
                        multiple: false,
                        defaultPath: defaultDownloadFolder || undefined,
                      });
                      if (typeof selected === 'string') {
                        setDefaultDownloadFolder(selected.replace(/\\/g, '/'));
                      }
                    } catch (err) {
                      console.error('Folder picker failed:', err);
                    }
                  }}
                  className="px-3 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg-[var(--accent)] flex items-center gap-1.5"
                >
                  <FolderOpen size={14} />
                  Browse
                </button>
                {defaultDownloadFolder && (
                  <button
                    onClick={() => setDefaultDownloadFolder('')}
                    className="px-3 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Skip dialog toggle */}
            <label className="flex items-center justify-between p-3 rounded-lg bg-[var(--background)] border border-[var(--border)] cursor-pointer">
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">Skip folder picker dialog</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  When ON, downloads save directly to the default folder above (no system dialog). Requires default folder to be set.
                </p>
              </div>
              <input
                type="checkbox"
                checked={skipDownloadDialog}
                disabled={!defaultDownloadFolder}
                onChange={(e) => setSkipDownloadDialog(e.target.checked)}
                className="w-5 h-5 accent-[var(--primary)]"
              />
            </label>
          </div>
        </section>

        {/* Developer — Run Trace verbosity + BYOK keys */}
        <section id="settings-developer" className="p-4 border border-[var(--border)] rounded-lg bg-[var(--card)] scroll-mt-16">
          <div className="flex items-center gap-2 mb-3">
            <Code2 size={18} className="text-[var(--muted-foreground)]" />
            <h3 className="text-lg font-medium text-[var(--foreground)]">Developer</h3>
          </div>

          {/* Developer mode toggle (Run Trace verbosity) */}
          <label className="flex items-center justify-between p-3 rounded-lg bg-[var(--background)] border border-[var(--border)] cursor-pointer mb-4">
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">Developer mode</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                Show technical details in the Run Trace panel — tool catalogs, planner internals,
                shared-memory snapshot, model ids. Off by default for a friendlier progress view.
              </p>
            </div>
            <input
              type="checkbox"
              checked={developerMode}
              onChange={(e) => setDeveloperMode(e.target.checked)}
              className="w-5 h-5 accent-[var(--primary)]"
            />
          </label>

          {/* Developer keys (BYOK) — collapsible subsection */}
          <div id="settings-developer-keys" className="scroll-mt-16">
          <button
            onClick={() => setAdvancedExpanded(!advancedSettingsExpanded)}
            className="w-full flex items-center justify-between text-left p-3 rounded-lg bg-[var(--background)] border border-[var(--border)] hover:bg-[var(--accent)] transition-colors"
          >
            <div className="flex items-center gap-2">
              {advancedSettingsExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              <Key size={18} className="text-[var(--muted-foreground)]" />
              <h4 className="text-sm font-medium text-[var(--foreground)]">Developer keys (BYOK)</h4>
            </div>
            <span className="text-xs text-[var(--muted-foreground)]">Your own keys · unmetered</span>
          </button>
          {advancedSettingsExpanded && (
          <div className="mt-3">
          {/* PromptPack built-in — always on */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--primary)]/5 border border-[var(--primary)]/20 mb-4">
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">Skillset · Llama 3.1 8B</p>
              <p className="text-xs text-[var(--muted-foreground)]">Hosted on our servers — always available, no key needed</p>
            </div>
            <span className="flex items-center gap-1 text-xs text-green-500 font-medium">
              <CheckCircle2 size={13} /> Active
            </span>
          </div>

          {(session?.tier || 'free') === 'free' ? (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4 text-center">
              <p className="text-sm font-medium text-[var(--foreground)] mb-1">
                Bring Your Own Key — Pro & Studio only
              </p>
              <p className="text-xs text-[var(--muted-foreground)] mb-3">
                Free plan runs on managed models. Upgrade to add your own provider keys and bypass the 30 cr/day cap.
              </p>
              <a
                href={`${WEB_APP_URL}/pricing`}
                target="_blank"
                rel="noreferrer"
                className="inline-block px-3 py-1.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm hover:opacity-90 transition-opacity"
              >
                View plans
              </a>
            </div>
          ) : (
            <>
              <p className="text-sm text-[var(--muted-foreground)] mb-4">
                Add any key below to unlock that provider as an additional option in Chat.
                Keys stay on this device and are sent directly to the provider — Skillset never sees them.
              </p>

              <div className="space-y-4">
                {KEYED_PROVIDERS.map(({ key, placeholder }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                      {PROVIDER_LABELS[key]}
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)]">
                        <input
                          type={visible[key] ? 'text' : 'password'}
                          value={inputs[key]}
                          onChange={(e) => setInputs((prev) => ({ ...prev, [key]: e.target.value }))}
                          placeholder={placeholder}
                          className="flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none"
                        />
                        <button
                          onClick={() => setVisible((v) => ({ ...v, [key]: !v[key] }))}
                          className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        >
                          {visible[key] ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      <button
                        onClick={() => setApiKey(key, inputs[key].trim())}
                        className="px-3 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm hover:opacity-90 transition-opacity"
                      >
                        Save
                      </button>
                    </div>
                    {apiKeys?.[key] && (
                      <p className="mt-1 text-xs text-green-500 flex items-center gap-1">
                        <CheckCircle2 size={11} /> Saved
                      </p>
                    )}
                  </div>
                ))}

                {/* AWS Bedrock — three fields (SigV4 signing). Save button is
                    disabled until all three are non-empty. Clear wipes the
                    stored config (passing null to setBedrockConfig). */}
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    {PROVIDER_LABELS.bedrock}
                  </label>
                  <p className="text-xs text-[var(--muted-foreground)] mb-2">
                    Signs requests with AWS SigV4. Use an IAM key with{' '}
                    <span className="font-mono">bedrock:InvokeModel</span> permission for the Claude family.
                  </p>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={bedrockInput.accessKeyId}
                      onChange={(e) => setBedrockInput((p) => ({ ...p, accessKeyId: e.target.value }))}
                      placeholder="AKIA... (Access Key ID)"
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none font-mono"
                    />
                    <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)]">
                      <input
                        type={bedrockSecretVisible ? 'text' : 'password'}
                        value={bedrockInput.secretAccessKey}
                        onChange={(e) => setBedrockInput((p) => ({ ...p, secretAccessKey: e.target.value }))}
                        placeholder="Secret Access Key"
                        className="flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none font-mono"
                      />
                      <button
                        onClick={() => setBedrockSecretVisible((v) => !v)}
                        className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      >
                        {bedrockSecretVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    <select
                      value={bedrockInput.region}
                      onChange={(e) => setBedrockInput((p) => ({ ...p, region: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)]"
                    >
                      {/* Subset of Bedrock-enabled regions where Claude models
                          are commonly available. Users can self-select; AWS
                          adds new regions periodically. */}
                      <option value="us-east-1">us-east-1 (N. Virginia)</option>
                      <option value="us-east-2">us-east-2 (Ohio)</option>
                      <option value="us-west-2">us-west-2 (Oregon)</option>
                      <option value="eu-central-1">eu-central-1 (Frankfurt)</option>
                      <option value="eu-west-1">eu-west-1 (Ireland)</option>
                      <option value="eu-west-3">eu-west-3 (Paris)</option>
                      <option value="ap-northeast-1">ap-northeast-1 (Tokyo)</option>
                      <option value="ap-southeast-1">ap-southeast-1 (Singapore)</option>
                      <option value="ap-southeast-2">ap-southeast-2 (Sydney)</option>
                    </select>

                    {/* Cross-region inference profile toggle. When ON, the
                        model ID is auto-prefixed at call time based on the
                        region family (us./eu./apac.). Needed in regions
                        where direct invoke is gated behind a profile. */}
                    <label className="flex items-start justify-between gap-3 p-3 rounded-lg bg-[var(--background)] border border-[var(--border)] cursor-pointer">
                      <div>
                        <p className="text-sm font-medium text-[var(--foreground)]">
                          Use cross-region inference profile
                        </p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          Auto-prefixes model IDs based on region family
                          (<span className="font-mono">us.</span>,{' '}
                          <span className="font-mono">eu.</span>,{' '}
                          <span className="font-mono">apac.</span>). Turn ON if
                          direct invoke returns <span className="font-mono">ResourceNotFoundException</span>.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={!!bedrockInput.useInferenceProfile}
                        onChange={(e) => setBedrockInput((p) => ({ ...p, useInferenceProfile: e.target.checked }))}
                        className="w-5 h-5 accent-[var(--primary)] mt-0.5"
                      />
                    </label>

                    {/* Advanced: per-tier model ID overrides. Wins over the
                        auto-prefix toggle. For exotic profile names or
                        models AWS adds after this build ships. */}
                    <button
                      onClick={() => setBedrockOverridesOpen((v) => !v)}
                      className="w-full flex items-center justify-between text-left px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] hover:bg-[var(--accent)] text-sm text-[var(--foreground)]"
                    >
                      <span className="flex items-center gap-2">
                        {bedrockOverridesOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        Advanced: custom model IDs
                      </span>
                      <span className="text-xs text-[var(--muted-foreground)]">Overrides auto-prefix</span>
                    </button>
                    {bedrockOverridesOpen && (
                      <div className="space-y-2 p-3 rounded-lg border border-[var(--border)] bg-[var(--background)]">
                        <p className="text-xs text-[var(--muted-foreground)]">
                          Paste the exact Bedrock model ID or inference profile
                          ARN to use for each tier. Leave blank to use the
                          default (with auto-prefix applied if enabled above).
                        </p>
                        {(['haiku', 'sonnet', 'opus'] as const).map((tier) => (
                          <div key={tier}>
                            <label className="block text-[11px] font-medium text-[var(--muted-foreground)] mb-1 uppercase tracking-wide">
                              Claude {tier}
                            </label>
                            <input
                              type="text"
                              value={bedrockInput.modelIdOverrides?.[tier] ?? ''}
                              onChange={(e) => setBedrockInput((p) => ({
                                ...p,
                                modelIdOverrides: { ...p.modelIdOverrides, [tier]: e.target.value },
                              }))}
                              placeholder={`anthropic.claude-${tier}-...`}
                              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none font-mono"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          // Strip empty override strings so the resolver
                          // skips them cleanly. Trim whitespace on all
                          // saved fields.
                          const overrides = bedrockInput.modelIdOverrides;
                          const cleanedOverrides = overrides
                            ? {
                                haiku:  overrides.haiku?.trim()  || undefined,
                                sonnet: overrides.sonnet?.trim() || undefined,
                                opus:   overrides.opus?.trim()   || undefined,
                              }
                            : undefined;
                          const hasAnyOverride =
                            !!cleanedOverrides &&
                            (cleanedOverrides.haiku || cleanedOverrides.sonnet || cleanedOverrides.opus);
                          setBedrockConfig({
                            accessKeyId:         bedrockInput.accessKeyId.trim(),
                            secretAccessKey:     bedrockInput.secretAccessKey.trim(),
                            region:              bedrockInput.region.trim(),
                            useInferenceProfile: !!bedrockInput.useInferenceProfile,
                            modelIdOverrides:    hasAnyOverride ? cleanedOverrides : undefined,
                          });
                        }}
                        disabled={
                          !bedrockInput.accessKeyId.trim() ||
                          !bedrockInput.secretAccessKey.trim() ||
                          !bedrockInput.region.trim()
                        }
                        className="px-3 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Save Bedrock config
                      </button>
                      {apiKeys?.bedrock && (
                        <button
                          onClick={() => {
                            setBedrockConfig(null);
                            setBedrockInput({
                              accessKeyId: '',
                              secretAccessKey: '',
                              region: 'us-east-1',
                              useInferenceProfile: false,
                              modelIdOverrides: { haiku: '', sonnet: '', opus: '' },
                            });
                          }}
                          className="px-3 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                  {apiKeys?.bedrock && (
                    <p className="mt-1 text-xs text-green-500 flex items-center gap-1">
                      <CheckCircle2 size={11} /> Saved · region {apiKeys.bedrock.region}
                      {apiKeys.bedrock.useInferenceProfile ? ' · inference profile' : ''}
                    </p>
                  )}
                </div>

              </div>
            </>
          )}
          </div>
          )}
          </div>
        </section>

        {/* About */}
        <section id="settings-about" className="p-4 border border-[var(--border)] rounded-lg bg-[var(--card)] scroll-mt-16">
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
            About
          </h3>
          <p className="text-sm text-[var(--muted-foreground)]">
            Skillset Desktop{appVersion ? ` v${appVersion}` : ''}
          </p>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            2025 Skillset. All rights reserved.
          </p>
        </section>
      </div>
    </div>
  );
}
