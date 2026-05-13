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
import { tauriFetch } from './tauriFetch';
import { CONVEX_URL } from './constants';

export function syncCreditsFromHeaders(res: Response | { headers: Headers }): void {
  const h = (res as Response).headers;
  if (!h || typeof h.get !== 'function') return;
  const monthly = parseInt(h.get('X-Credits-Monthly') ?? '', 10);
  const topup = parseInt(h.get('X-Credits-Topup') ?? '', 10);
  if (Number.isFinite(monthly) && Number.isFinite(topup)) {
    useSettingsStore.getState().setCreditBalance({ monthly, topup });
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
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as {
      monthly?: number;
      topup?: number;
      monthlyResetAt?: number;
    };
    useSettingsStore.getState().setCreditBalance({
      monthly: data.monthly ?? 0,
      topup: data.topup ?? 0,
      resetAt: data.monthlyResetAt,
    });
    return true;
  } catch (e) {
    console.warn('[creditSync] refresh failed', e);
    return false;
  }
}
