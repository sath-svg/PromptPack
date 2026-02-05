import { useState, useEffect } from 'react';
import { Moon, Sun, Monitor, Keyboard, User, LogOut, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useSettingsStore, getTierLimits } from '../../stores/settingsStore';
import { useAuthStore } from '../../stores/authStore';
import { CONVEX_URL } from '../../lib/constants';
import { formatShortcut } from '../../lib/platform';

interface BillingStatus {
  tier: 'free' | 'pro' | 'studio';
  hasPro: boolean;
  isStudio?: boolean;
}

export function SettingsPage() {
  const { theme, setTheme, globalHotkey } = useSettingsStore();
  const { session } = useAuthStore();
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
        const response = await fetch(`${CONVEX_URL}/api/extension/billing-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clerkId: session.user_id }),
        });

        if (response.ok) {
          const data = await response.json();
          setBillingStatus(data);
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
                  <span className="text-[var(--muted-foreground)]">Prompt Limit</span>
                  <span className="text-[var(--foreground)]">{tierLimits.promptLimit}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--muted-foreground)]">Pack Limit</span>
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

        {/* About */}
        <section className="p-4 border border-[var(--border)] rounded-lg bg-[var(--card)]">
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
            About
          </h3>
          <p className="text-sm text-[var(--muted-foreground)]">
            Prompt Pack Desktop v0.1.0
          </p>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            2025 Prompt Pack. All rights reserved.
          </p>
        </section>
      </div>
    </div>
  );
}
