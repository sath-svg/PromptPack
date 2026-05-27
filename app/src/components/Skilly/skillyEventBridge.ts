/**
 * Event bridge for Skilly. Subscribes to other Zustand stores from
 * outside and feeds events into `useSkillyStore`. No edits to those
 * stores are needed.
 *
 * Imported as a side-effect from `App.tsx`:
 *   import './components/Skilly/skillyEventBridge';
 *
 * Boost rules:
 *   - credit spend (settings.creditBalance total drops): hunger +N
 *   - skillset create OR download (sync.userPacks.length +1): energy +15, happy +15
 *   - marketplace publish (marketplace.myListings.length +1): happy +20
 *   - notification.severity === 'error': flashMouth('sad', 4s)
 *   - notification.category === 'payment' | 'auth' (orange tier): flashMouth('o', 4s) [overrides sad]
 *
 * Revive rules:
 *   - free → pro|studio upgrade: revive immediately
 *   - pro|studio monthly refresh (creditBalance.monthly increases vs lastMonthlyCredits): revive
 *
 * Grandfather: on first authed boot (session.user_id null → set), `bootIfNeeded`
 * stamps `firstSeenAt` so decay starts only from that moment.
 *
 * Bulk-load guard: store subscriptions skip "bulk add" events (delta > 1)
 * because those represent initial server hydration, not user actions.
 * Only delta === +1 counts as a real create/download/publish.
 */

import { useAuthStore } from '../../stores/authStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { useSyncStore } from '../../stores/syncStore';
import { useMarketplaceStore } from '../../stores/marketplaceStore';
import { useSkillyStore } from '../../stores/skillyStore';

// Guard against hot-reload double-registration.
const w = window as unknown as { __skillyBridgeWired?: boolean };
if (!w.__skillyBridgeWired) {
  w.__skillyBridgeWired = true;
  wire();
}

function wire(): void {
  // ----- Auth: session resolve (grandfather clock) + tier upgrade revive -----
  let prevUserId = useAuthStore.getState().session?.user_id ?? null;
  let prevTier = useAuthStore.getState().session?.tier ?? null;

  // Boot immediately if a session is already resolved at load time.
  if (prevUserId) {
    useSkillyStore.getState().bootIfNeeded();
  }

  useAuthStore.subscribe((state) => {
    const userId = state.session?.user_id ?? null;
    const tier = state.session?.tier ?? null;

    if (userId && !prevUserId) {
      useSkillyStore.getState().bootIfNeeded();
    }

    if (
      prevTier === 'free' &&
      (tier === 'pro' || tier === 'studio')
    ) {
      useSkillyStore.getState().revive();
    }

    prevUserId = userId;
    prevTier = tier;
  });

  // ----- Credits: spend → boostHunger; monthly refresh (paid) → revive -----
  const initialBalance = useSettingsStore.getState().creditBalance;
  let prevCreditTotal =
    (initialBalance?.monthly ?? 0) + (initialBalance?.topup ?? 0);

  // Seed lastMonthlyCredits if missing (first run): use the current monthly
  // value so the first naturally-occurring increase counts as a real refresh.
  if (useSkillyStore.getState().lastMonthlyCredits === null && initialBalance) {
    useSkillyStore.getState().setLastMonthlyCredits(initialBalance.monthly ?? 0);
  }

  useSettingsStore.subscribe((state) => {
    const bal = state.creditBalance;
    const total = (bal?.monthly ?? 0) + (bal?.topup ?? 0);

    if (total !== prevCreditTotal) {
      if (total < prevCreditTotal) {
        const delta = prevCreditTotal - total;
        useSkillyStore
          .getState()
          .boostHunger(Math.min(25, delta * 2));
      }
      prevCreditTotal = total;
    }

    // Monthly refresh detection — paid tier only.
    const monthly = bal?.monthly ?? 0;
    const tier = useSettingsStore.getState().billingTier;
    const lastMonthly = useSkillyStore.getState().lastMonthlyCredits;
    if (lastMonthly !== null && monthly > lastMonthly && tier !== 'free') {
      useSkillyStore.getState().revive();
    }
    if (lastMonthly === null || monthly !== lastMonthly) {
      useSkillyStore.getState().setLastMonthlyCredits(monthly);
    }
  });

  // ----- Notifications: error → sad mouth; payment/auth → o mouth -----
  let prevNotifIds = new Set(
    useNotificationStore.getState().notifications.map((n) => n.id),
  );
  useNotificationStore.subscribe((state) => {
    const currentIds = new Set(state.notifications.map((n) => n.id));
    for (const n of state.notifications) {
      if (prevNotifIds.has(n.id)) continue;
      const orange =
        n.error.category === 'payment' || n.error.category === 'auth';
      if (orange) {
        useSkillyStore.getState().flashMouth('o', 4000);
      } else if (n.error.severity === 'error') {
        useSkillyStore.getState().flashMouth('sad', 4000);
      }
    }
    prevNotifIds = currentIds;
  });

  // ----- Sync: userPacks.length +1 → energy/happy boost -----
  let prevPacksLen = useSyncStore.getState().userPacks.length;
  useSyncStore.subscribe((state) => {
    const len = state.userPacks.length;
    const delta = len - prevPacksLen;
    // Single create/download → +1. Bulk hydration → larger jump (ignored).
    if (delta === 1) {
      useSkillyStore.getState().boostEnergy(15);
      useSkillyStore.getState().boostHappy(15);
    }
    prevPacksLen = len;
  });

  // ----- Marketplace: myListings.length +1 → happy boost -----
  let prevListingsLen = useMarketplaceStore.getState().myListings.length;
  useMarketplaceStore.subscribe((state) => {
    const len = state.myListings.length;
    const delta = len - prevListingsLen;
    if (delta === 1) {
      useSkillyStore.getState().boostHappy(20);
    }
    prevListingsLen = len;
  });
}
