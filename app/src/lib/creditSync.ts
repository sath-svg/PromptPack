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

export function syncCreditsFromHeaders(res: Response | { headers: Headers }): void {
  const h = (res as Response).headers;
  if (!h || typeof h.get !== 'function') return;
  const monthly = parseInt(h.get('X-Credits-Monthly') ?? '', 10);
  const topup = parseInt(h.get('X-Credits-Topup') ?? '', 10);
  if (Number.isFinite(monthly) && Number.isFinite(topup)) {
    useSettingsStore.getState().setCreditBalance({ monthly, topup });
  }
}
