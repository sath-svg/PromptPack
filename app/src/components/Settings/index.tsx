import { useState, useEffect } from 'react';
import { Moon, Sun, Monitor, Keyboard, User, LogOut, CheckCircle2, XCircle, Loader2, Key, Eye, EyeOff, Sparkles, ChevronDown, ChevronRight } from 'lucide-react';
import { open as openShell } from '@tauri-apps/plugin-shell';
import { useSettingsStore, getTierLimits, type ApiKeys } from '../../stores/settingsStore';
import { useAuthStore } from '../../stores/authStore';
import { PROVIDER_LABELS } from '../../lib/classifier';
import { MANAGED_MODELS, MANAGED_TIER_LABELS } from '../../lib/managed-models';
import { CONVEX_URL } from '../../lib/constants';
import { tauriFetch } from '../../lib/tauriFetch';
import { formatShortcut } from '../../lib/platform';

interface BillingStatus {
  tier: 'free' | 'pro' | 'studio';
  hasPro: boolean;
  isStudio?: boolean;
}

export function SettingsPage() {
  const {
    theme, setTheme, globalHotkey, apiKeys, setApiKey, setBillingTier,
    managedModeEnabled, setManagedModeEnabled,
    advancedSettingsExpanded, setAdvancedExpanded,
    selectedManagedModel, setSelectedManagedModel,
    creditBalance, setCreditBalance,
  } = useSettingsStore();
  const { session } = useAuthStore();

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
          body: JSON.stringify({ clerkId: session.user_id }),
        });
        if (!r.ok) return;
        const data = await r.json() as {
          monthlyCredits?: number;
          topupCredits?: number;
          monthlyCreditsResetAt?: number;
        };
        setCreditBalance({
          monthly: data.monthlyCredits ?? 0,
          topup: data.topupCredits ?? 0,
          resetAt: data.monthlyCreditsResetAt,
        });
      } catch (err) {
        console.error('credit balance fetch failed:', err);
      }
    };
    fetchBalance();
  }, [session?.user_id]);

  const openTopupPage = () => {
    openShell('https://pmtpk.com/dashboard?topup=open').catch(console.error);
  };

  const totalCredits = creditBalance
    ? creditBalance.monthly + creditBalance.topup
    : 0;

  type KeyedProvider = keyof ApiKeys;
  const KEYED_PROVIDERS: { key: KeyedProvider; placeholder: string }[] = [
    { key: 'anthropic',  placeholder: 'sk-ant-...' },
    { key: 'openai',     placeholder: 'sk-...' },
    { key: 'gemini',     placeholder: 'AIza...' },
    { key: 'grok',       placeholder: 'xai-...' },
    { key: 'deepseek',   placeholder: 'sk-...' },
    { key: 'perplexity', placeholder: 'pplx-...' },
    { key: 'kimi',       placeholder: 'sk-...' },
    { key: 'groq',       placeholder: 'gsk_...' },
    { key: 'openrouter', placeholder: 'sk-or-...' },
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
  });
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
          body: JSON.stringify({ clerkId: session.user_id }),
        });

        if (response.ok) {
          const data = await response.json();
          setBillingStatus(data);
          if (data.tier) setBillingTier(data.tier);
        }
      } catch (error) {
        console.error('Failed to fetch billing status:', error);
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
        <section className="p-4 border border-[var(--border)] rounded-lg bg-[var(--card)]">
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
        <section className="p-4 border border-[var(--border)] rounded-lg bg-[var(--card)]">
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-4">
            Shortcuts
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Keyboard size={18} className="text-[var(--muted-foreground)]" />
                <div>
                  <p className="font-medium text-[var(--foreground)]">Quick Access</p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Open floating search window
                  </p>
                </div>
              </div>
              <kbd className="px-3 py-1.5 rounded bg-[var(--muted)] text-sm font-mono text-[var(--foreground)]">
                {formatShortcut(globalHotkey)}
              </kbd>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Keyboard size={18} className="text-[var(--muted-foreground)]" />
                <div>
                  <p className="font-medium text-[var(--foreground)]">Search</p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Focus search bar
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
        <section className="p-4 border border-[var(--border)] rounded-lg bg-[var(--card)]">
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
        <section className="p-4 border border-[var(--border)] rounded-lg bg-[var(--card)]">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={18} className="text-[var(--primary)]" />
            <h3 className="text-lg font-medium text-[var(--foreground)]">AI Credits</h3>
          </div>

          {/* Managed-mode toggle */}
          <label className="flex items-center justify-between p-3 rounded-lg bg-[var(--background)] border border-[var(--border)] mb-3 cursor-pointer">
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">Use Skillset credits</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                Route chats through curated frontier models. Metered against your credit balance.
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

          {/* Default model picker */}
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
            Default model
          </label>
          <select
            value={selectedManagedModel ?? ''}
            onChange={(e) => setSelectedManagedModel(e.target.value || null)}
            disabled={!managedModeEnabled}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] disabled:opacity-50"
          >
            <option value="">Auto (pick by prompt complexity)</option>
            {(['cheap', 'mid', 'frontier'] as const).map((tier) => (
              <optgroup key={tier} label={MANAGED_TIER_LABELS[tier]}>
                {MANAGED_MODELS.filter((m) => m.tier === tier).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label} · {m.creditsPerCall}c
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </section>

        {/* Advanced — Developer keys (BYOK) */}
        <section className="p-4 border border-[var(--border)] rounded-lg bg-[var(--card)]">
          <button
            onClick={() => setAdvancedExpanded(!advancedSettingsExpanded)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              {advancedSettingsExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              <Key size={18} className="text-[var(--muted-foreground)]" />
              <h3 className="text-lg font-medium text-[var(--foreground)]">Advanced — Developer keys</h3>
            </div>
            <span className="text-xs text-[var(--muted-foreground)]">BYOK · unmetered</span>
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

          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            Add any key below to unlock that provider as an additional option in Chat.
            <br />
            <span className="text-[var(--primary)]">Tip:</span> OpenRouter gives access to 200+ models including Gemma 4.
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

          </div>
          </div>
          )}
        </section>

        {/* About */}
        <section className="p-4 border border-[var(--border)] rounded-lg bg-[var(--card)]">
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
            About
          </h3>
          <p className="text-sm text-[var(--muted-foreground)]">
            Skillset Desktop v0.1.0
          </p>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            2025 Skillset. All rights reserved.
          </p>
        </section>
      </div>
    </div>
  );
}
