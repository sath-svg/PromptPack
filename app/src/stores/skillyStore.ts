import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useSettingsStore } from './settingsStore';

/**
 * Skilly — the in-app tamagochi mascot.
 *
 * Stats decay over time and get boosted by user actions wired in
 * `components/Skilly/skillyEventBridge.ts`.
 *
 * Decay tick = 60 s. Target full-bar→empty times:
 *   - energy 1 day  → -0.0694 per tick
 *   - hunger 3 days → -0.0231 per tick
 *   - happy  10 days → -0.00694 per tick
 *
 * The loop short-circuits unless:
 *   1. `settingsStore.skillyEnabled !== false`
 *   2. `firstSeenAt !== null` (grandfather timer satisfied — set on
 *      the first authed boot after this feature ships).
 *   3. `passedOut === false`.
 *   4. `sleeping === false` (sleep mode regenerates energy instead).
 *
 * When all three stats reach 0, Skilly passes out — eyes become `X X`,
 * decay halts. Recovery requires an upgrade (free → pro) or the next
 * monthly credit refresh (pro / studio).
 */

export type MouthOverrideKind = 'sad' | 'o' | null;

export interface MouthOverride {
  kind: MouthOverrideKind;
  until: number; // ms timestamp
}

export interface SkillyPosition {
  x: number;
  y: number;
}

/**
 * Last user-button action. The Skilly component subscribes to this so
 * pressing Feed / Play / Sleep / Wake in the playground triggers the
 * matching animation on the on-screen mascot.
 */
export type SkillyAction = 'feed' | 'play' | 'sleep' | 'wake';
export interface LastAction {
  kind: SkillyAction | null;
  at: number;
}

interface SkillyState {
  // Stats — kept as floats internally; UI rounds for display.
  hunger: number;
  happy: number;
  energy: number;
  // Mode flags.
  sleeping: boolean;
  passedOut: boolean;
  dragging: boolean;
  // Grandfather clock anchor — null until first authed boot.
  firstSeenAt: number | null;
  // Per-tab (and 'floating') drag positions.
  position: Record<string, SkillyPosition>;
  // Animation trigger timestamps (consumed by views for boost flashes).
  lastBoostAt: { hunger: number; happy: number; energy: number };
  // Transient mouth override (sad / o).
  mouthOverride: MouthOverride;
  // Last user-button action (Feed/Play/Sleep/Wake) — Skilly subscribes
  // to bump matching animation.
  lastAction: LastAction;
  // Credit deltas — used by the bridge to detect spend and monthly refresh.
  lastCreditTotal: number | null;
  lastMonthlyCredits: number | null;

  // Actions
  bootIfNeeded: () => void;
  boostHunger: (n: number) => void;
  boostHappy: (n: number) => void;
  boostEnergy: (n: number) => void;
  feed: () => void;
  play: () => void;
  sleep: () => void;
  wake: () => void;
  setPosition: (tab: string, x: number, y: number) => void;
  setDragging: (b: boolean) => void;
  flashMouth: (kind: 'sad' | 'o', ms?: number) => void;
  setLastCreditTotal: (n: number) => void;
  setLastMonthlyCredits: (n: number) => void;
  revive: () => void;
  /** Test/debug only — force a decay tick to fire now. */
  _tick: () => void;
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

const INIT_STATS = { hunger: 80, happy: 90, energy: 75 };

/** Per-tick decay rates (60 s ticks). */
const DECAY = {
  energy: 100 / 1440,   // 1 day  → 0.0694
  hunger: 100 / 4320,   // 3 days → 0.0231
  happy:  100 / 14400,  // 10 days → 0.00694
} as const;

/** Sleep regenerates energy at this rate per tick (~3 h full recharge). */
const SLEEP_ENERGY_GAIN = 0.5;

export const useSkillyStore = create<SkillyState>()(
  persist(
    (set, get) => ({
      ...INIT_STATS,
      sleeping: false,
      passedOut: false,
      dragging: false,
      firstSeenAt: null,
      position: {},
      lastBoostAt: { hunger: 0, happy: 0, energy: 0 },
      mouthOverride: { kind: null, until: 0 },
      lastAction: { kind: null, at: 0 },
      lastCreditTotal: null,
      lastMonthlyCredits: null,

      bootIfNeeded: () => {
        if (get().firstSeenAt === null) {
          set({ firstSeenAt: Date.now() });
        }
      },

      boostHunger: (n) => set((s) => ({
        hunger: clamp(s.hunger + n, 0, 100),
        lastBoostAt: { ...s.lastBoostAt, hunger: Date.now() },
        passedOut: s.passedOut && (s.hunger + n) <= 0 && s.happy <= 0 && s.energy <= 0,
      })),
      boostHappy: (n) => set((s) => ({
        happy: clamp(s.happy + n, 0, 100),
        lastBoostAt: { ...s.lastBoostAt, happy: Date.now() },
        passedOut: s.passedOut && s.hunger <= 0 && (s.happy + n) <= 0 && s.energy <= 0,
      })),
      boostEnergy: (n) => set((s) => ({
        energy: clamp(s.energy + n, 0, 100),
        lastBoostAt: { ...s.lastBoostAt, energy: Date.now() },
        passedOut: s.passedOut && s.hunger <= 0 && s.happy <= 0 && (s.energy + n) <= 0,
      })),

      feed: () => {
        get().boostHunger(25);
        set({ lastAction: { kind: 'feed', at: Date.now() } });
      },
      play: () => {
        get().boostHappy(20);
        get().boostEnergy(-10);
        set({ lastAction: { kind: 'play', at: Date.now() } });
      },
      sleep: () => set({
        sleeping: true,
        lastAction: { kind: 'sleep', at: Date.now() },
      }),
      wake: () => set({
        sleeping: false,
        lastAction: { kind: 'wake', at: Date.now() },
      }),

      setPosition: (tab, x, y) =>
        set((s) => ({ position: { ...s.position, [tab]: { x, y } } })),
      setDragging: (b) => set({ dragging: b }),

      flashMouth: (kind, ms = 4000) =>
        set({ mouthOverride: { kind, until: Date.now() + ms } }),

      setLastCreditTotal: (n) => set({ lastCreditTotal: n }),
      setLastMonthlyCredits: (n) => set({ lastMonthlyCredits: n }),

      revive: () => set({
        ...INIT_STATS,
        sleeping: false,
        passedOut: false,
        mouthOverride: { kind: null, until: 0 },
      }),

      _tick: () => runTick(),
    }),
    {
      name: 'skilly-store',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // v0 → v1: floating Skilly default position moved (originally bottom-
      // left of viewport, now right of the sidebar). Persisted drag coords
      // from v0 would pin Skilly behind the sidebar, so drop them all.
      // Stats / sleeping / firstSeenAt etc. survive untouched.
      migrate: (persisted: unknown, version: number) => {
        const s = (persisted ?? {}) as Record<string, unknown>;
        if (version < 1) {
          s.position = {};
        }
        return s as unknown as SkillyState;
      },
      // Persist only stable user state. Drop ephemeral fields so a
      // crash mid-drag or mid-flash doesn't leave Skilly stuck.
      partialize: (state) => ({
        hunger: state.hunger,
        happy: state.happy,
        energy: state.energy,
        sleeping: state.sleeping,
        passedOut: state.passedOut,
        firstSeenAt: state.firstSeenAt,
        position: state.position,
        lastCreditTotal: state.lastCreditTotal,
        lastMonthlyCredits: state.lastMonthlyCredits,
      }) as Partial<SkillyState>,
    },
  ),
);

/** Single source of truth for one tick of decay. */
function runTick() {
  const enabled = useSettingsStore.getState().skillyEnabled;
  if (enabled === false) return;

  const s = useSkillyStore.getState();
  if (s.firstSeenAt === null) return; // grandfather not satisfied yet
  if (s.passedOut) return;

  // Sleep mode: regen energy, freeze the rest.
  if (s.sleeping) {
    useSkillyStore.setState({
      energy: clamp(s.energy + SLEEP_ENERGY_GAIN, 0, 100),
    });
    return;
  }

  const nextHunger = clamp(s.hunger - DECAY.hunger, 0, 100);
  const nextHappy  = clamp(s.happy  - DECAY.happy,  0, 100);
  const nextEnergy = clamp(s.energy - DECAY.energy, 0, 100);
  const passedOut = nextHunger <= 0 && nextHappy <= 0 && nextEnergy <= 0;

  useSkillyStore.setState({
    hunger: nextHunger,
    happy: nextHappy,
    energy: nextEnergy,
    passedOut,
  });
}

// Module-level decay interval. Single timer for the whole app.
// 60 s tick — see DECAY rates above.
if (typeof window !== 'undefined') {
  // Guard against hot-reload double-registration.
  const w = window as unknown as { __skillyTick?: number };
  if (w.__skillyTick) {
    clearInterval(w.__skillyTick);
  }
  w.__skillyTick = window.setInterval(runTick, 60_000);
}
