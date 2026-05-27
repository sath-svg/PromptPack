/**
 * Skilly — core mascot component.
 *
 * Two variants:
 *   - `floating`   : the small bottom-left mascot shown across every tab.
 *   - `playground` : the larger mascot inside the Skilly tab.
 *
 * Handles:
 *   - Click → spin reward + boostHappy + heart burst.
 *   - Drag (pointerdown/move/up) — position persisted per-tab.
 *   - Eye tracking via a document-level mousemove listener.
 *   - Idle hop + speech bubble (random).
 *   - Passed-out: click shows a revive-hint bubble instead.
 */

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { SkillyFace } from './SkillyFace';
import { SkillyProp } from './SkillyProps';
import { useSkillyContext } from './useSkillyContext';
import { useSkillyStore } from '../../stores/skillyStore';
import { useUiStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import './skilly.css';

export type SkillyVariant = 'floating' | 'playground';

interface SkillyProps {
  variant: SkillyVariant;
  /** Override the variant's default size (px). */
  size?: number;
  /** When true, no fixed/absolute positioning — caller wraps. */
  inline?: boolean;
}

const IDLE_WANDER_MS = 3800;
const SPIN_MS = 820;
const HOP_MS = 700;

const IDLE_LINES = ['hi!', '*bounce*', 'mmhm!', '✨', 'eep!', 'wheee!'];
const PLAY_LINES = ['yay!', 'wheee!', 'again!', '✨', 'hehe'];
const REVIVE_LINES_FREE  = ['i need a revive…', 'upgrade me…', 'help…'];
const REVIVE_LINES_PAID  = ['i need a revive…', 'next refresh…', 'soon…'];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function Skilly({ variant, size, inline = false }: SkillyProps) {
  const { state, mouth, eyesMode } = useSkillyContext();
  const sleeping = useSkillyStore((s) => s.sleeping);
  const passedOut = useSkillyStore((s) => s.passedOut);
  const setDragging = useSkillyStore((s) => s.setDragging);
  const setPosition = useSkillyStore((s) => s.setPosition);
  const boostHappy = useSkillyStore((s) => s.boostHappy);
  const wake = useSkillyStore((s) => s.wake);
  const lastAction = useSkillyStore((s) => s.lastAction);
  const currentPage = useUiStore((s) => s.currentPage);
  const tier = useAuthStore((s) => s.session?.tier ?? 'free');

  const tabKey = variant === 'floating' ? 'floating' : `pg:${currentPage}`;
  const savedPos = useSkillyStore((s) => s.position[tabKey]);

  const rootRef = useRef<HTMLDivElement>(null);

  // Transient animation flags (driven by className additions).
  const [hopping, setHopping] = useState(false);
  const [spinning, setSpinning] = useState(false);

  // Pupil offset for eye tracking.
  const [pupil, setPupil] = useState({ x: 0, y: 0 });

  // Speech bubble.
  const [speech, setSpeech] = useState<string | null>(null);
  const speechTimeoutRef = useRef<number | null>(null);
  const say = (text: string, ms = 1400) => {
    if (speechTimeoutRef.current) window.clearTimeout(speechTimeoutRef.current);
    setSpeech(text);
    speechTimeoutRef.current = window.setTimeout(() => setSpeech(null), ms);
  };

  // Heart particles.
  const [hearts, setHearts] = useState<{ id: number; dx: number; delay: number }[]>([]);
  const burstHearts = () => {
    const batch = Array.from({ length: 5 }).map((_, i) => ({
      id: Date.now() + i,
      dx: Math.random() * 50 - 25,
      delay: i * 60,
    }));
    setHearts((prev) => [...prev, ...batch]);
    window.setTimeout(() => {
      setHearts((prev) => prev.filter((h) => !batch.find((b) => b.id === h.id)));
    }, 1200);
  };

  // Animation triggers — declared before effects so the idle wander
  // effect can capture them without TDZ access.
  const triggerHop = () => {
    if (spinning || hopping) return;
    setHopping(true);
    window.setTimeout(() => setHopping(false), HOP_MS);
  };
  const triggerSpin = () => {
    setSpinning(true);
    burstHearts();
    boostHappy(6);
    window.setTimeout(() => setSpinning(false), SPIN_MS);
  };

  // ---------- Eye tracking ----------
  useEffect(() => {
    if (eyesMode !== 'normal' || passedOut || sleeping) return;
    const onMove = (e: MouseEvent) => {
      const el = rootRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.min(2.5, Math.hypot(dx, dy) / 80);
      const ang = Math.atan2(dy, dx);
      setPupil({ x: Math.cos(ang) * dist, y: Math.sin(ang) * dist });
    };
    document.addEventListener('mousemove', onMove);
    return () => document.removeEventListener('mousemove', onMove);
  }, [eyesMode, passedOut, sleeping]);

  // ---------- React to playground button actions ----------
  // Skip the initial mount tick by tracking the previous `at` timestamp.
  const lastActionAtRef = useRef(lastAction.at);
  useEffect(() => {
    if (lastAction.at === lastActionAtRef.current) return;
    lastActionAtRef.current = lastAction.at;
    if (passedOut) return;
    // While sleeping, only the wake transition is allowed to animate.
    if (sleeping && lastAction.kind !== 'wake') return;
    switch (lastAction.kind) {
      case 'feed':
        triggerHop();
        say('nom nom!', 1100);
        break;
      case 'play':
        triggerSpin();
        say(pick(PLAY_LINES), 1100);
        break;
      case 'sleep':
        say('zzz...', 1400);
        break;
      case 'wake':
        triggerHop();
        say('yawn!', 1200);
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to action changes
  }, [lastAction.at, lastAction.kind]);

  // ---------- Idle wander ----------
  useEffect(() => {
    if (passedOut || sleeping) return;
    const id = window.setInterval(() => {
      // Don't fire while user is interacting.
      if (useSkillyStore.getState().dragging) return;
      const r = Math.random();
      if (r < 0.35) {
        triggerHop();
      } else if (r < 0.65) {
        say(pick(IDLE_LINES), 1100);
      }
    }, IDLE_WANDER_MS);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- triggerHop & say are stable enough for an idle interval; capturing them would cause needless re-creates.
  }, [passedOut, sleeping]);

  // ---------- Click ----------
  const onClick = () => {
    if (useSkillyStore.getState().dragging) return;
    if (passedOut) {
      const lines = tier === 'free' ? REVIVE_LINES_FREE : REVIVE_LINES_PAID;
      say(pick(lines), 1800);
      return;
    }
    if (sleeping) {
      wake();
      say('yawn!', 1200);
      return;
    }
    triggerSpin();
    say(pick(PLAY_LINES), 1100);
  };

  // ---------- Drag ----------
  // Floating variant uses viewport-absolute coords (`position: fixed`).
  // Inline/playground variant escapes its centering wrapper at drag-start
  // by switching to `position: absolute` against its stage parent, so
  // pointer math stays within stage bounds.
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const dragParentRef = useRef<HTMLElement | null>(null);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (passedOut) return;
    const el = rootRef.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);
    setDragging(true);
    const rect = el.getBoundingClientRect();
    dragOffsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    el.style.transition = 'none';

    if (variant !== 'floating') {
      // Capture current visual position relative to the nearest positioned
      // ancestor (the stage), then re-pin Skilly there as `absolute` so
      // future left/top writes stay in stage-local coords.
      const parent = el.offsetParent as HTMLElement | null;
      dragParentRef.current = parent;
      if (parent) {
        const parentRect = parent.getBoundingClientRect();
        el.style.position = 'absolute';
        el.style.left = `${rect.left - parentRect.left}px`;
        el.style.top = `${rect.top - parentRect.top}px`;
        el.style.right = 'auto';
        el.style.bottom = 'auto';
        // Wrapping div centered Skilly via translate(-50%, -50%) — kill it
        // so the new left/top values are the true position.
        el.style.transform = '';
      }
    }
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!useSkillyStore.getState().dragging) return;
    const el = rootRef.current;
    if (!el) return;
    if (variant === 'floating') {
      const newX = e.clientX - dragOffsetRef.current.x;
      const newY = e.clientY - dragOffsetRef.current.y;
      el.style.left = `${newX}px`;
      el.style.top = `${newY}px`;
      el.style.right = 'auto';
      el.style.bottom = 'auto';
      return;
    }
    // Inline / playground — coords relative to stage parent.
    const parent = dragParentRef.current;
    if (!parent) return;
    const parentRect = parent.getBoundingClientRect();
    const elW = el.offsetWidth;
    const elH = el.offsetHeight;
    let x = e.clientX - parentRect.left - dragOffsetRef.current.x;
    let y = e.clientY - parentRect.top - dragOffsetRef.current.y;
    // Clamp inside stage so Skilly can't be lost off-edge.
    x = Math.max(0, Math.min(x, parent.clientWidth - elW));
    y = Math.max(0, Math.min(y, parent.clientHeight - elH));
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = rootRef.current;
    if (!el) return;
    try {
      el.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore — pointer might already be released */
    }
    if (!useSkillyStore.getState().dragging) return;
    setDragging(false);
    // Persist drop position so Skilly stays where the user dropped him.
    // Floating uses viewport coords; playground uses stage-relative coords.
    if (variant === 'floating') {
      const rect = el.getBoundingClientRect();
      setPosition(tabKey, rect.left, rect.top);
    } else if (dragParentRef.current) {
      const parent = dragParentRef.current;
      const parentRect = parent.getBoundingClientRect();
      const rect = el.getBoundingClientRect();
      setPosition(tabKey, rect.left - parentRect.left, rect.top - parentRect.top);
    }
    triggerHop();
  };

  // ---------- Mount-time position restore ----------
  // On mount, wipe stale inline styles then apply persisted drop position
  // if any. Floating uses viewport coords; playground uses stage-relative
  // coords (and switches to `position: absolute` since the stage is the
  // positioned ancestor).
  //
  // Viewport-bounds clamp: if a stored coord lands off-screen (e.g. user
  // shrunk the window since last drag), drop the inline styles and let
  // the CSS default (`.skilly--floating`) win. Prevents Skilly from
  // becoming invisible.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    // Always start from a clean slate so HMR-loaded CSS edits paint.
    el.style.left = '';
    el.style.top = '';
    el.style.right = '';
    el.style.bottom = '';
    el.style.position = '';
    el.style.transform = '';
    el.style.transition = '';
    if (!savedPos) return;
    if (variant === 'floating') {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const ELW = el.offsetWidth || 110;
      const ELH = el.offsetHeight || 120;
      const MARGIN = 8;
      const validX =
        Number.isFinite(savedPos.x) &&
        savedPos.x >= MARGIN &&
        savedPos.x <= w - ELW - MARGIN;
      const validY =
        Number.isFinite(savedPos.y) &&
        savedPos.y >= MARGIN &&
        savedPos.y <= h - ELH - MARGIN;
      if (!validX || !validY) return; // off-screen → CSS default wins
      el.style.left = `${savedPos.x}px`;
      el.style.top = `${savedPos.y}px`;
      el.style.right = 'auto';
      el.style.bottom = 'auto';
      el.style.transform = '';
    } else {
      // Playground: stage-relative coords. Skilly takes `position: absolute`
      // inside the stage parent.
      const parent = el.offsetParent as HTMLElement | null;
      if (!parent) return;
      const ELW = el.offsetWidth || 220;
      const ELH = el.offsetHeight || 240;
      const MARGIN = 4;
      const validX =
        Number.isFinite(savedPos.x) &&
        savedPos.x >= MARGIN &&
        savedPos.x <= parent.clientWidth - ELW - MARGIN;
      const validY =
        Number.isFinite(savedPos.y) &&
        savedPos.y >= MARGIN &&
        savedPos.y <= parent.clientHeight - ELH - MARGIN;
      if (!validX || !validY) return;
      el.style.position = 'absolute';
      el.style.left = `${savedPos.x}px`;
      el.style.top = `${savedPos.y}px`;
      el.style.right = 'auto';
      el.style.bottom = 'auto';
      el.style.transform = '';
    }
  }, [variant, tabKey, savedPos]);

  // ---------- Class composition ----------
  const className = [
    'skilly',
    inline ? '' : `skilly--${variant}`,
    hopping ? 'hop' : '',
    spinning ? 'spin' : '',
    sleeping ? 'sleeping' : '',
    passedOut ? 'passed-out' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const sizeStyle: CSSProperties | undefined =
    size !== undefined
      ? { width: size, height: size * (130 / 120) }
      : undefined;

  return (
    <div
      ref={rootRef}
      className={className}
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={sizeStyle}
    >
      {/* Speech bubble */}
      {speech && (
        <div className={`skilly__speech ${speech ? 'show' : ''}`}>{speech}</div>
      )}

      {/* Sleep "z" */}
      <div className="skilly__zzz">z</div>

      {/* Body: Face + (overlaid) prop */}
      <div className="skilly__body" style={{ position: 'relative' }}>
        <SkillyFace mouth={mouth} eyesMode={eyesMode} pupilOffset={pupil} />
        <SkillyProp state={state} />
      </div>

      {/* Hearts */}
      {hearts.map((h) => (
        <div
          key={h.id}
          className="skilly__heart"
          style={{
            left: '50%',
            top: '20%',
            ['--dx' as string]: `${h.dx}px`,
            animationDelay: `${h.delay}ms`,
          } as CSSProperties}
        >
          <svg viewBox="0 0 24 24" fill="#ff7ab6" width="14" height="14">
            <path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6C19 16.5 12 21 12 21z" />
          </svg>
        </div>
      ))}
    </div>
  );
}
