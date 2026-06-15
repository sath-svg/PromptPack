import { useState } from 'react';
import { open as openShell } from '@tauri-apps/plugin-shell';
import { Lock, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { UPGRADE_URL } from '../../lib/constants';

/**
 * Full-screen, non-dismissible lockout shown when a signed-in account is on the
 * retired free plan. Blocks all app usage until the user starts a trial /
 * subscribes. The server also blocks AI spend (FREE_PLAN_RETIRED); this is the
 * UI counterpart so free users can't use the desktop app at all.
 */
export function FreePlanGate() {
  const refreshTier = useAuthStore((s) => s.refreshTier);
  const logout = useAuthStore((s) => s.logout);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshTier();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--background)] p-6">
      <div className="w-[460px] max-w-[92vw] rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center shadow-2xl">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
          <Lock size={22} />
        </div>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Your free plan has ended
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
          Rising AI costs mean we can no longer offer a free plan. Start a 3-day free
          trial to keep using Skillset — your skills, skillsets, and settings stay safe
          in your account.
        </p>

        <button
          onClick={() => openShell(UPGRADE_URL).catch(console.error)}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
        >
          Start 3-day free trial
          <ArrowRight size={15} />
        </button>

        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="mt-3 w-full rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--accent)] disabled:opacity-60"
        >
          {refreshing ? 'Checking…' : "I've upgraded — refresh"}
        </button>

        <button
          onClick={() => logout()}
          className="mt-4 text-xs text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
