/**
 * Sticker preview page. Renders all 10 sticker variants live in a grid
 * so you can eyeball them before running the Playwright build pipeline.
 * Standalone Vite entry — does NOT mount the main app shell.
 *
 * Mirror of the STICKERS matrix in `app/scripts/build-skilly-stickers.mjs`.
 * If you change one, change both.
 */

import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useSkillyStore } from './stores/skillyStore';
import {
  SkillyFace,
  type SkillyMouth,
  type SkillyEyesMode,
} from './components/Skilly/SkillyFace';
import {
  SkillyProp,
  type SkillyContextState,
} from './components/Skilly/SkillyProps';
import './components/Skilly/skilly.css';

interface StickerVariant {
  id: string;
  mouth: SkillyMouth;
  eyes: SkillyEyesMode;
  state: SkillyContextState;
  sleeping: boolean;
  passedOut: boolean;
  extraClass: string;
}

const STICKERS: StickerVariant[] = [
  { id: 'default_smile',  mouth: 'smile',    eyes: 'normal',     state: 'default',     sleeping: false, passedOut: false, extraClass: '' },
  { id: 'default_sad',    mouth: 'sad',      eyes: 'normal',     state: 'default',     sleeping: false, passedOut: false, extraClass: '' },
  { id: 'writing',        mouth: 'smile',    eyes: 'normal',     state: 'writing',     sleeping: false, passedOut: false, extraClass: '' },
  { id: 'painting',       mouth: 'smile',    eyes: 'normal',     state: 'painting',    sleeping: false, passedOut: false, extraClass: '' },
  { id: 'reading',        mouth: 'smile',    eyes: 'normal',     state: 'reading',     sleeping: false, passedOut: false, extraClass: '' },
  { id: 'thinking',       mouth: 'thinking', eyes: 'thinking',   state: 'thinking',    sleeping: false, passedOut: false, extraClass: '' },
  { id: 'marketplace',    mouth: 'smile',    eyes: 'normal',     state: 'marketplace', sleeping: false, passedOut: false, extraClass: '' },
  { id: 'sleeping',       mouth: 'flat',     eyes: 'sleeping',   state: 'default',     sleeping: true,  passedOut: false, extraClass: '' },
  { id: 'passed_out',     mouth: 'flat',     eyes: 'passedOut',  state: 'passedOut',   sleeping: false, passedOut: true,  extraClass: 'hop' },
  { id: 'o_mouth',        mouth: 'o',        eyes: 'normal',     state: 'default',     sleeping: false, passedOut: false, extraClass: 'spin' },
];

// eslint-disable-next-line react-refresh/only-export-components -- standalone Vite entry
function StickerCard({ variant }: { variant: StickerVariant }) {
  // Re-apply `extraClass` per slow-mode animation duration so the
  // preview keeps looping cleanly (otherwise the one-shot hop / spin
  // would fire once and freeze at the end frame). Interval matches the
  // slowest animation in slow-mode (spin = 3 s) so spin completes one
  // full upright→upright rotation per cycle and never freezes mid-
  // rotation (which read as "starts upside down").
  useEffect(() => {
    if (!variant.extraClass) return;
    const el = document.getElementById(`skilly-card-${variant.id}`);
    if (!el) return;
    const apply = () => {
      el.classList.remove(variant.extraClass);
      void el.offsetWidth;
      el.classList.add(variant.extraClass);
    };
    apply();
    const t = window.setInterval(apply, 3000);
    return () => window.clearInterval(t);
  }, [variant.extraClass, variant.id]);

  const className = [
    'skilly',
    // Mirror the sticker-harness slow-motion so the preview matches
    // what the WebM recording will actually look like.
    'skilly--sticker-slow',
    variant.sleeping ? 'sleeping' : '',
    variant.passedOut ? 'passed-out' : '',
    variant.extraClass,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="card">
      <div className="stage">
        <div
          id={`skilly-card-${variant.id}`}
          className={className}
          style={{
            // Smaller than the stage so the thought-cloud (extends above
            // viewBox) AND the spin scale-up both fit inside the card
            // without clipping at the edge.
            width: 110,
            height: 120,
            position: 'relative',
            cursor: 'default',
            pointerEvents: 'none',
          }}
        >
          <div className="skilly__body" style={{ position: 'relative' }}>
            <SkillyFace
              mouth={variant.mouth}
              eyesMode={variant.eyes}
              pupilOffset={{ x: 0, y: 0 }}
            />
            <SkillyProp state={variant.state} />
          </div>
          {variant.sleeping && <div className="skilly__zzz">z</div>}
        </div>
      </div>
      <div className="label">{variant.id}</div>
      <div className="meta">
        mouth={variant.mouth} · eyes={variant.eyes} · state={variant.state}
        {variant.extraClass ? ` · class=${variant.extraClass}` : ''}
      </div>
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- standalone Vite entry
function StickerPreview() {
  // Prime the store once so sleeping/passedOut variants' CSS hooks paint.
  useEffect(() => {
    useSkillyStore.setState({
      sleeping: false,
      passedOut: false,
      firstSeenAt: null,
    });
  }, []);

  return (
    <div className="grid">
      {STICKERS.map((v) => (
        <StickerCard key={v.id} variant={v} />
      ))}
    </div>
  );
}

const container = document.getElementById('preview-root');
if (container) {
  createRoot(container).render(<StickerPreview />);
}
