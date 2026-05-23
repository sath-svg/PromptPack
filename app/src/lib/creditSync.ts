/**
 * Sync the in-memory credit balance from a managed-proxy response.
 *
 * The Cloudflare worker (`api/src/credits.ts`) tags every settled call
 * with `X-Credits-Monthly` + `X-Credits-Topup` headers. Without this
 * helper the UI counter only refreshes on `callManagedProxy` paths,
 * leaving orchestrator subtasks + the managed-proxy agent loop stale
 * until the next plain-chat round trip.
 *
 * Safe to call on any `Response`: when headers are missing or
 * non-numeric (e.g. a BYOK provider, `api.anthropic.com` direct), we
 * silently no-op.
 */
import { useSettingsStore } from '../stores/settingsStore';
import { useAuthStore } from '../stores/authStore';
import { tauriFetch } from './tauriFetch';
import { CONVEX_URL } from './constants';

export function syncCreditsFromHeaders(res: Response | { headers: Headers }): void {
  const h = (res as Response).headers;
  if (!h || typeof h.get !== 'function') return;
  const monthly = parseInt(h.get('X-Credits-Monthly') ?? '', 10);
  const topup = parseInt(h.get('X-Credits-Topup') ?? '', 10);
  if (Number.isFinite(monthly) && Number.isFinite(topup)) {
    // Preserve existing autoTopup + resetAt — header sync only carries the
    // two balance pools, never the auto-topup config. Without the merge
    // we'd wipe the desktop's autoTopup view on every chat round-trip.
    const prev = useSettingsStore.getState().creditBalance;
    useSettingsStore.getState().setCreditBalance({
      monthly,
      topup,
      resetAt: prev?.resetAt,
      autoTopup: prev?.autoTopup,
    });
    // If topup pool just jumped vs the previous snapshot, an auto-topup
    // likely fired server-side. Pull fresh autoTopup metadata (lastChargeAt,
    // monthlySpentUsd, failure flags) so the Settings panel reflects it
    // without forcing the user to click Refresh.
    if (prev && topup > prev.topup && prev.autoTopup?.hasPaymentMethod) {
      const userId = useAuthStore.getState().session?.user_id;
      if (userId) void refreshCreditBalance(userId);
    }
  }
  // Token totals — worker emits these on every settled managed-proxy
  // response. No-op on direct provider URLs (anthropic / openai etc.)
  // because they don't set the X-Tokens-* headers.
  const inputTok = parseInt(h.get('X-Tokens-Input') ?? '', 10);
  const outputTok = parseInt(h.get('X-Tokens-Output') ?? '', 10);
  const reasoningTok = parseInt(h.get('X-Tokens-Reasoning') ?? '', 10);
  const totalTok = parseInt(h.get('X-Tokens-Total') ?? '', 10);
  if (Number.isFinite(inputTok) || Number.isFinite(outputTok)) {
    useSettingsStore.getState().recordTokenUsage({
      input: Number.isFinite(inputTok) ? inputTok : undefined,
      output: Number.isFinite(outputTok) ? outputTok : undefined,
      reasoning: Number.isFinite(reasoningTok) ? reasoningTok : undefined,
      total: Number.isFinite(totalTok) ? totalTok : undefined,
    });
  }
}

/**
 * Pull the latest balance from Convex's `/api/extension/credit-balance`
 * and push it into the settings store. Used by the explicit Refresh
 * button in the chat header — the header sync only fires after a
 * settled managed-proxy call, so users who haven't run anything since
 * the last topup or admin grant don't see the new total without this.
 *
 * Returns `true` on success so the caller can flash a brief check icon.
 */
export async function refreshCreditBalance(userId: string): Promise<boolean> {
  try {
    const res = await tauriFetch(`${CONVEX_URL}/api/extension/credit-balance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Endpoint reads `clerkId` (legacy field name) — server-side
      // findUserByAnyId resolves it whether the id is Clerk or BetterAuth.
      // Send both for safety + forward compat.
      body: JSON.stringify({ clerkId: userId, userId }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as {
      monthly?: number;
      topup?: number;
      monthlyResetAt?: number;
      autoTopup?: {
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
      };
    };
    useSettingsStore.getState().setCreditBalance({
      monthly: data.monthly ?? 0,
      topup: data.topup ?? 0,
      resetAt: data.monthlyResetAt,
      autoTopup: data.autoTopup,
    });
    return true;
  } catch (e) {
    console.warn('[creditSync] refresh failed', e);
    return false;
  }
}
