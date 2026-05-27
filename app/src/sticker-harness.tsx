/**
 * Sticker-harness entry. Standalone Vite page (`/sticker-harness.html`)
 * that Playwright drives in `app/scripts/build-skilly-stickers.mjs`.
 *
 * Renders ONE Skilly at 480×480 inside a 512×512 transparent stage with
 * NO event handlers, no idle wander, no eye-tracking, no speech bubbles
 * — so every captured frame is deterministic. Forces sleeping /
 * passedOut state via direct store writes BEFORE mount so CSS hooks
 * (`.skilly.sleeping`, `.skilly.passed-out`) apply on first paint.
 *
 * URL params (all optional):
 *   mouth      = smile | sad | o | thinking | flat
 *   eyes       = normal | thinking | passedOut | sleeping
 *   state      = default | writing | painting | reading | thinking | marketplace | passedOut
 *   sleeping   = 0 | 1
 *   passedOut  = 0 | 1
 *   extraClass = hop | spin | walking | ''  (re-applied every 800ms so
 *                                            one-shot keyframes loop)
 */

import { createRoot } from 'react-dom/client';
import { useEffect, useRef } from 'react';
import { useSkillyStore } from './stores/skillyStore';
import { SkillyFace, type SkillyMouth, type SkillyEyesMode } from './components/Skilly/SkillyFace';
import { SkillyProp, type SkillyContextState } from './components/Skilly/SkillyProps';
import './components/Skilly/skilly.css';

function readParams() {
  const q = new URLSearchParams(window.location.search);
  return {
    mouth: (q.get('mouth') ?? 'smile') as SkillyMouth,
    eyes: (q.get('eyes') ?? 'normal') as SkillyEyesMode,
    state: (q.get('state') ?? 'default') as SkillyContextState,
    sleeping: q.get('sleeping') === '1',
    passedOut: q.get('passedOut') === '1',
    extraClass: q.get('extraClass') ?? '',
  };
}

const params = readParams();

// Prime the store BEFORE React renders so `.skilly.sleeping` / `.skilly.passed-out`
// CSS hooks paint correctly on the very first frame Playwright captures.
useSkillyStore.setState({
  sleeping: params.sleeping,
  passedOut: params.passedOut,
  // Disable the grandfather decay so the store doesn't tick stats away
  // mid-recording.
  firstSeenAt: null,
});

// eslint-disable-next-line react-refresh/only-export-components -- standalone Vite entry; HMR fast-refresh not relevant for a build-time recording harness.
function StickerHarness() {
  const rootRef = useRef<HTMLDivElement>(null);

  // `extraClass` is already on the wrapper via React's className prop, so
  // the keyframe fires once at mount. We do NOT re-apply on a timer:
  // slow-mode animation durations (hop 2.2 s, spin 3 s) are sized to
  // fill the 3 s recording window with ONE clean cycle that begins +
  // ends with Skilly upright. The old 800 ms re-apply interrupted the
  // spin mid-rotation (~192°, upside-down), which became visible once
  // animations were slowed for sticker recording.

  // Reset every running CSS animation on Skilly's subtree to cycle
  // position 0 RIGHT BEFORE flagging skilly-ready. Without this, mount
  // → first capture gap (~150 ms) means frame 0 lands mid-cycle and
  // frame N lands at "period + 150 ms" → seam when Telegram loops the
  // WebM. Aligning cycle-start to capture-start makes the loop
  // frame-perfect.
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const targets = document.querySelectorAll(
        '.skilly, .skilly *, .skilly__body, .skilly__zzz, .eye, .skilly__brush, .skilly__page, .skilly__writing, .skilly__think-dot, .skilly__thinking-eye',
      );
      targets.forEach((el) => {
        const getAnims = (el as HTMLElement).getAnimations;
        if (typeof getAnims !== 'function') return;
        const anims = getAnims.call(el as HTMLElement);
        anims.forEach((a: Animation) => {
          try {
            a.currentTime = 0;
          } catch {
            /* ignore animations w/o a settable currentTime */
          }
        });
      });
      document.body.classList.add('skilly-ready');
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const className = [
    'skilly',
    // Slow-motion CSS — recording-only. Stretches animation durations
    // so the captured 3 s WebM reads calmer than the in-app version.
    'skilly--sticker-slow',
    params.sleeping ? 'sleeping' : '',
    params.passedOut ? 'passed-out' : '',
    params.extraClass,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={rootRef}
      className={className}
      style={{
        // 360×390 inside a 512×512 stage leaves ~75 px headroom each
        // side — enough for the thought-cloud (extends above viewBox)
        // and for spin scale-up not to clip against canvas edge.
        width: 360,
        height: 390,
        position: 'relative',
        cursor: 'default',
        pointerEvents: 'none',
      }}
    >
      <div className="skilly__body" style={{ position: 'relative' }}>
        <SkillyFace
          mouth={params.mouth}
          eyesMode={params.eyes}
          pupilOffset={{ x: 0, y: 0 }}
        />
        <SkillyProp state={params.state} />
      </div>
      {params.sleeping && <div className="skilly__zzz">z</div>}
    </div>
  );
}

const container = document.getElementById('harness-root');
if (container) {
  createRoot(container).render(<StickerHarness />);
}
