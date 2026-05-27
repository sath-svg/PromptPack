/**
 * Dedicated Skilly tab. Stage on the left (big Skilly, drag-friendly),
 * stat panel on the right (mood tag, 3 bars, Feed/Play/Sleep, tips).
 */

import { Skilly } from './Skilly';
import { useSkillyStore } from '../../stores/skillyStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useAuthStore } from '../../stores/authStore';

/**
 * Credit cost per action, proportional to that stat's decay rate.
 * Energy decays fastest → Sleep is most expensive. Happy decays slowest
 * → Play is cheapest. Costs charged from `creditBalance` (topup first,
 * monthly second). Insufficient credits disables the button.
 *
 * NOTE: Client-side mutation of creditBalance is visual-only — the next
 * backend sync (`refreshCreditBalance`) will overwrite. A future PR
 * should add a `/credits/spend?source=skilly` worker endpoint to make
 * the deduction durable.
 */
const ACTION_COSTS = { feed: 3, play: 1, sleep: 5 } as const;

function spendCredits(amount: number): boolean {
  const store = useSettingsStore.getState();
  const bal = store.creditBalance;
  if (!bal) return false;
  const total = bal.monthly + bal.topup;
  if (total < amount) return false;
  // Drain topup first; spill into monthly.
  let topup = bal.topup;
  let monthly = bal.monthly;
  if (topup >= amount) {
    topup -= amount;
  } else {
    monthly -= (amount - topup);
    topup = 0;
  }
  store.setCreditBalance({ ...bal, topup, monthly });
  return true;
}

type Mood = 'happy' | 'hungry' | 'sleepy' | 'bored' | 'thriving' | 'passed-out' | 'sleeping';

function deriveMood(args: {
  hunger: number;
  happy: number;
  energy: number;
  sleeping: boolean;
  passedOut: boolean;
}): { mood: Mood; line: string; color: string } {
  const { hunger, happy, energy, sleeping, passedOut } = args;
  if (passedOut) {
    return {
      mood: 'passed-out',
      line: 'Out cold. Needs a revive.',
      color: '#888',
    };
  }
  if (sleeping) {
    return {
      mood: 'sleeping',
      line: 'Snoozing peacefully. Zzz...',
      color: '#6a6cff',
    };
  }
  if (hunger < 25) return { mood: 'hungry',  line: 'Tummy rumbling… feed me?',  color: '#ff6b3d' };
  if (energy < 20) return { mood: 'sleepy',  line: 'Eyelids heavy… need a nap.', color: '#6a6cff' };
  if (happy  < 30) return { mood: 'bored',   line: 'A little bored. Play with me?', color: '#888'  };
  if (happy > 80 && hunger > 60) {
    return { mood: 'thriving', line: 'Feeling unstoppable!', color: '#6bd28b' };
  }
  return { mood: 'happy', line: 'Bouncing around, ready to help.', color: '#2b6bff' };
}

export function SkillyPlayground() {
  const hunger = useSkillyStore((s) => s.hunger);
  const happy = useSkillyStore((s) => s.happy);
  const energy = useSkillyStore((s) => s.energy);
  const sleeping = useSkillyStore((s) => s.sleeping);
  const passedOut = useSkillyStore((s) => s.passedOut);
  const feed = useSkillyStore((s) => s.feed);
  const play = useSkillyStore((s) => s.play);
  const sleep = useSkillyStore((s) => s.sleep);
  const wake = useSkillyStore((s) => s.wake);
  const skillyEnabled = useSettingsStore((s) => s.skillyEnabled);
  const creditBalance = useSettingsStore((s) => s.creditBalance);
  const tier = useAuthStore((s) => s.session?.tier ?? 'free');

  const totalCredits = (creditBalance?.monthly ?? 0) + (creditBalance?.topup ?? 0);
  const canAfford = (cost: number) => totalCredits >= cost;

  const handleFeed = () => {
    if (!canAfford(ACTION_COSTS.feed)) return;
    if (!spendCredits(ACTION_COSTS.feed)) return;
    feed();
  };
  const handlePlay = () => {
    if (!canAfford(ACTION_COSTS.play)) return;
    if (!spendCredits(ACTION_COSTS.play)) return;
    play();
  };
  // Sleep charges on entering sleep; waking is free (just toggle off).
  const handleSleepToggle = () => {
    if (sleeping) {
      wake();
      return;
    }
    if (!canAfford(ACTION_COSTS.sleep)) return;
    if (!spendCredits(ACTION_COSTS.sleep)) return;
    sleep();
  };

  if (skillyEnabled === false) {
    return (
      <div className="h-full flex items-center justify-center text-[var(--muted-foreground)]">
        Skilly is disabled. Enable it in Settings to bring him back.
      </div>
    );
  }

  const { mood, line, color } = deriveMood({ hunger, happy, energy, sleeping, passedOut });
  const hungerDisplay = Math.round(hunger);
  const happyDisplay = Math.round(happy);
  const energyDisplay = Math.round(energy);

  const barColor = (value: number, normal: string) =>
    value < 25 ? '#ff3d3d' : normal;

  return (
    <div className="h-full flex flex-col gap-6 max-w-5xl mx-auto p-4">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Skilly</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Your Skillset companion. Keep him fed, happy, and rested.
        </p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
        {/* Stage — flex-centered so Skilly starts dead-center but `offsetParent`
            is the stage itself, giving full-stage drag bounds. */}
        <div
          className="relative rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden flex items-center justify-center"
          style={{ minHeight: 380 }}
        >
          {/* Subtle vignette / floor */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(ellipse at 50% 90%, rgba(43,107,255,0.10), transparent 60%)',
              pointerEvents: 'none',
            }}
          />
          <Skilly variant="playground" size={220} inline />
        </div>

        {/* Stat panel */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Skilly</h2>
              <span
                className="text-[10px] uppercase tracking-[0.14em] px-2 py-0.5 rounded-full text-white"
                style={{ background: color }}
              >
                {mood}
              </span>
            </div>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">{line}</p>

            <div className="mt-5 space-y-3">
              <StatBar label="Hunger" value={hungerDisplay} color={barColor(hunger, '#ff6b3d')} />
              <StatBar label="Happy"  value={happyDisplay}  color={barColor(happy,  '#ff7ab6')} />
              <StatBar label="Energy" value={energyDisplay} color={barColor(energy, '#4f86ff')} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <ActionButton
              icon="🍪"
              label="Feed"
              cost={ACTION_COSTS.feed}
              disabled={passedOut || !canAfford(ACTION_COSTS.feed)}
              onClick={handleFeed}
            />
            <ActionButton
              icon="🎾"
              label="Play"
              cost={ACTION_COSTS.play}
              disabled={passedOut || !canAfford(ACTION_COSTS.play)}
              onClick={handlePlay}
            />
            <ActionButton
              icon={sleeping ? '☀️' : '💤'}
              label={sleeping ? 'Wake' : 'Sleep'}
              cost={sleeping ? 0 : ACTION_COSTS.sleep}
              disabled={passedOut || (!sleeping && !canAfford(ACTION_COSTS.sleep))}
              onClick={handleSleepToggle}
            />
          </div>

          <div className="flex items-center text-xs text-[var(--muted-foreground)] px-1">
            <span>Credits: <span className="text-[var(--foreground)] tabular-nums">{totalCredits}</span></span>
          </div>

          <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] p-4 text-xs text-[var(--muted-foreground)] leading-relaxed">
            <p>
              <b className="text-[var(--foreground)]">Tip:</b> Click Skilly for a spin. Drag him around the stage. He hops on his own when bored.
            </p>
            <p className="mt-1.5">
              He also reacts to your real work: <br/>
              Use Skill Chat to feed him, make edits / create skillsets to energise him, and interacting with the marketplace makes Skilly a very happy star!
            </p>
            {passedOut && (
              <p className="mt-3 text-[var(--foreground)]">
                <b>Skilly's passed out.</b>{' '}
                {tier === 'free'
                  ? 'Upgrade to Pro to revive him.'
                  : 'He\'ll wake up at your next monthly credit refresh.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-14 text-xs text-[var(--muted-foreground)]">{label}</div>
      <div className="flex-1 h-2 rounded-full bg-[var(--muted)] overflow-hidden border border-[var(--border)]">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <div className="w-8 text-right text-xs text-[var(--muted-foreground)] tabular-nums">{value}</div>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  cost,
  onClick,
  disabled,
}: {
  icon: string;
  label: string;
  cost: number;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed py-3 flex flex-col items-center gap-1 transition-colors"
    >
      <span className="text-xl leading-none">{icon}</span>
      <span className="text-xs text-[var(--foreground)]">{label}</span>
      <span className="text-[10px] text-[var(--muted-foreground)] tabular-nums">
        {cost > 0 ? `${cost} cr` : 'free'}
      </span>
    </button>
  );
}
