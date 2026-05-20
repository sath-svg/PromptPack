/**
 * App-lifecycle pings — keeps the `users.lastActive` field on the Convex
 * backend fresh so Loops.so can fire inactivity drips against the right
 * cohort. No effect when the user isn't signed in.
 *
 * Strategy:
 *   - Fire once on app boot.
 *   - Fire again on window focus.
 *   - Rate-limit client-side to once per hour via localStorage; the server
 *     also debounces at 1h so any leak is harmless.
 */

import { getCurrentWindow } from '@tauri-apps/api/window';
import { CONVEX_URL } from './constants';
import { tauriFetch } from './tauriFetch';
import { useAuthStore } from '../stores/authStore';

const LS_KEY = 'skillset.lastActivePingAt';
const MIN_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

function shouldPing(): boolean {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return true;
    const at = parseInt(raw, 10);
    if (!Number.isFinite(at)) return true;
    return Date.now() - at > MIN_INTERVAL_MS;
  } catch {
    return true;
  }
}

function markPinged() {
  try {
    localStorage.setItem(LS_KEY, String(Date.now()));
  } catch {
    // localStorage unavailable — fine, server-side debounce covers us.
  }
}

async function pingLastActive() {
  if (!shouldPing()) return;
  const session = useAuthStore.getState().session;
  if (!session?.user_id) return;
  try {
    const res = await tauriFetch(`${CONVEX_URL}/api/extension/touch-active`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: session.user_id }),
    });
    if (res.ok) markPinged();
  } catch (err) {
    // Lifecycle telemetry is best-effort. Never throw into render.
    console.debug('[lifecycle] touch-active failed', err);
  }
}

let initialized = false;

export async function initLifecyclePings() {
  if (initialized) return;
  initialized = true;

  // Fire once on boot (the auth store may not have rehydrated yet — the
  // function early-returns when session is missing).
  void pingLastActive();

  // Re-ping when the OS gives the window focus back. Tauri v2 API.
  try {
    const win = getCurrentWindow();
    await win.onFocusChanged(({ payload: focused }) => {
      if (focused) void pingLastActive();
    });
  } catch (err) {
    console.debug('[lifecycle] focus listener failed', err);
  }
}
