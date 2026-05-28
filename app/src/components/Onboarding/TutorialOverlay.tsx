/**
 * Skilly-led onboarding tour.
 *
 * Each step optionally targets a `[data-tutorial="…"]` element. When it
 * does, the overlay punches a spotlight hole over that element and parks
 * Skilly + his speech bubble right next to it (bubble tail points back
 * at the highlight). Steps with no target (the welcome) render Skilly
 * hero-sized, dead-centre.
 *
 * Animation:
 *   - On mount: Skilly + bubble fade/slide in.
 *   - On final "Let's go!" (or Skip): bubble fades, Skilly translates
 *     from wherever he is down to the bottom-centre floating slot
 *     (matches `.skilly--floating` in skilly.css). When the translate
 *     finishes, `onComplete` fires and `SkillyFloating` mounts the real
 *     persistent mascot there.
 *
 * Steps whose target element is absent (e.g. Skill Control is Pro-only,
 * sign-in button hidden once authed) are skipped at runtime.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { SkillyFace } from '../Skilly/SkillyFace';
import { useSkillyStore } from '../../stores/skillyStore';
import { useSkillyContext } from '../Skilly/useSkillyContext';

interface TutorialStep {
  target: string | null; // data-tutorial selector, null = centred
  title: string;
  description: string;
  finalAction?: string;
}

const STEPS: TutorialStep[] = [
  {
    target: null,
    title: "Hi! I'm Skilly ✨",
    description:
      "I'm your AI companion — I'll show you around in 30 seconds. Save prompts as portable skills, run them across ChatGPT, Claude, Gemini — any tool. Let's go!",
  },
  {
    target: '[data-tutorial="sign-in"]',
    title: 'Sign in so I can sync',
    description:
      "Sign in first and I'll keep your skills synced across every device, unlock the marketplace, and track your seller earnings.",
  },
  {
    target: '[data-tutorial="skill-chat"]',
    title: 'Skill Chat — one box, every model',
    description:
      "Talk to every model from one chat. I route each message to the cheapest capable one — Haiku for quick stuff, Sonnet for hard reasoning, Gemini when you paste images. Your bill stays tiny!",
  },
  {
    target: '[data-tutorial="draft"]',
    title: 'Draft & enhance with me',
    description:
      "Draft prompts here — I auto-save as you type. When one feels weak, hit my enhancer and I'll rewrite it. Save the final version into a Set and reuse it forever.",
  },
  {
    target: '[data-tutorial="skill-preset"]',
    title: 'Lock your style into a Preset',
    description:
      "Drop reference images and I'll pull out your palette, line weight, and signature into an encrypted Preset. List it on the marketplace and earn royalties every time someone buys it.",
  },
  {
    target: '[data-tutorial="your-skillsets"]',
    title: 'Your Skillsets',
    description:
      "Bundle prompts into reusable Sets with {variable} placeholders. Chain them into Skill Flows — output of step 1 feeds step 2. Run the whole pipeline with one click.",
  },
  {
    target: '[data-tutorial="marketplace"]',
    title: 'Marketplace — browse, buy, sell',
    description:
      "Browse Flows, Sets, and Presets from other creators. Buy with credits, filter by tag, save your favorite searches, and check ratings before grabbing. List your own and keep 70% of every sale — I'll handle payouts.",
  },
  {
    target: '[data-tutorial="skill-control"]',
    title: 'Skill Control — version like Git',
    description:
      "Pro+ unlock. Every edit gets versioned. Diff, branch, and rollback any skill like Git for prompts — never lose a good revision again.",
  },
  {
    target: '[data-tutorial="import"]',
    title: 'Import sets from anywhere',
    description:
      "Import .skill files from friends, or pipe skills straight in from my Chrome extension as you save them from ChatGPT, Claude, and Gemini. See you inside!",
    finalAction: "Let's go!",
  },
];

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TutorialOverlayProps {
  onComplete: () => void;
}

/** Drop animation duration — keep in sync with the CSS transition. */
const DROP_MS = 700;
const SPOTLIGHT_PAD = 8;
const GROUP_GAP = 24; // gap between spotlight and Skilly+bubble group
const BUBBLE_W = 340;
const HERO_SKILLY = 200; // welcome (centred) size
const MINI_SKILLY = 120; // beside-target size

export function TutorialOverlay({ onComplete }: TutorialOverlayProps) {
  const [validSteps, setValidSteps] = useState<number[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlight, setSpotlight] = useState<Rect | null>(null);
  const [groupStyle, setGroupStyle] = useState<React.CSSProperties>({});
  const [phase, setPhase] = useState<'intro' | 'live' | 'dropping'>('intro');

  const skillyRef = useRef<HTMLDivElement>(null);
  const dropTimeoutRef = useRef<number | null>(null);
  const setTourDropping = useSkillyStore((s) => s.setTourDropping);
  // Match the hero's face to the real mascot so the drop hand-off doesn't
  // pop a different pose (sad / sleeping / thinking) on reveal.
  const { mouth, eyesMode } = useSkillyContext();

  // ---- Which steps have a present target (or no target)? ----
  const getValidSteps = useCallback((): number[] => {
    const valid: number[] = [];
    for (let i = 0; i < STEPS.length; i++) {
      const s = STEPS[i];
      if (!s.target || document.querySelector(s.target)) valid.push(i);
    }
    return valid;
  }, []);

  useEffect(() => {
    const steps = getValidSteps();
    if (steps.length === 0) {
      onComplete();
      return;
    }
    setValidSteps(steps);
    setCurrentStep(steps[0]);
  }, [getValidSteps, onComplete]);

  // intro → live so the slide-in animation plays.
  useEffect(() => {
    const id = window.setTimeout(() => setPhase('live'), 60);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    return () => {
      if (dropTimeoutRef.current) window.clearTimeout(dropTimeoutRef.current);
      // Defensive: never leave the flag stuck on if we unmount mid-drop.
      setTourDropping(false);
    };
  }, [setTourDropping]);

  const currentValidIndex = validSteps.indexOf(currentStep);
  const isLastStep =
    validSteps.length > 0 && currentValidIndex === validSteps.length - 1;
  const step = STEPS[currentStep];
  const nextLabel = isLastStep ? step?.finalAction || 'Finish' : 'Next';

  // ---- Position spotlight + Skilly/bubble group for the current step ----
  const position = useCallback(() => {
    if (!step) return;

    // No target → centred hero pose.
    if (!step.target) {
      setSpotlight(null);
      setGroupStyle({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        flexDirection: 'row',
      });
      return;
    }

    const el = document.querySelector(step.target);
    if (!el) {
      advance();
      return;
    }

    // Scroll the target into view first. Sidebar nav is a scroll
    // container; when "Your Sets" is expanded, lower items (Skill
    // Control) can sit below the fold, so measuring without scrolling
    // would spotlight an off-screen/footer-overlapping rect.
    el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' });

    const r = el.getBoundingClientRect();
    const spot: Rect = {
      top: r.top - SPOTLIGHT_PAD,
      left: r.left - SPOTLIGHT_PAD,
      width: r.width + SPOTLIGHT_PAD * 2,
      height: r.height + SPOTLIGHT_PAD * 2,
    };
    setSpotlight(spot);

    // Park the group to the RIGHT of the highlight (targets live in the
    // left sidebar). Vertically centre on the highlight, clamped to the
    // viewport. Group width ≈ mini-Skilly + gap + bubble.
    const groupW = MINI_SKILLY + 16 + BUBBLE_W;
    const groupH = 240;
    let left = spot.left + spot.width + GROUP_GAP;
    let top = spot.top + spot.height / 2 - groupH / 2;

    // If no room on the right, drop below the highlight instead.
    if (left + groupW > window.innerWidth - 16) {
      left = Math.max(16, spot.left);
      top = spot.top + spot.height + GROUP_GAP;
    }
    left = Math.max(16, Math.min(left, window.innerWidth - groupW - 16));
    top = Math.max(16, Math.min(top, window.innerHeight - groupH - 16));

    setGroupStyle({
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      transform: 'none',
      flexDirection: 'row',
    });
  }, [step]);

  // Reposition on step change + window/layout changes.
  useEffect(() => {
    position();
    const ro = new ResizeObserver(() => position());
    ro.observe(document.body);
    const onResize = () => position();
    window.addEventListener('resize', onResize);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, [position]);

  const advance = useCallback(() => {
    if (isLastStep) {
      finishWithDrop();
      return;
    }
    const idx = validSteps.indexOf(currentStep);
    if (idx === -1 || idx >= validSteps.length - 1) {
      finishWithDrop();
    } else {
      setCurrentStep(validSteps[idx + 1]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLastStep, validSteps, currentStep]);

  // Drop Skilly into the floating slot, then complete.
  // Order matters for a seamless hand-off:
  //   1. `setTourDropping(true)` mounts the REAL floating Skilly now.
  //   2. Wait one frame so it commits to the DOM + lays out.
  //   3. `setPhase('dropping')` — the dropping render then measures that
  //      floating element's actual rect (computeDropTransform) and lands
  //      the hero exactly on top of it, whatever its real position/size
  //      (covers a dragged-away saved position too).
  //   4. After the transform settles, unmount the overlay — the identical
  //      floating Skilly is already underneath, so nothing visibly changes.
  const finishWithDrop = useCallback(() => {
    setTourDropping(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setPhase('dropping');
        dropTimeoutRef.current = window.setTimeout(() => {
          onComplete();
          setTourDropping(false);
        }, DROP_MS + 80);
      });
    });
  }, [onComplete, setTourDropping]);

  const computeDropTransform = (): string => {
    const el = skillyRef.current;
    if (!el) return 'translate(0,0) scale(0.5)';
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;

    // Prefer the REAL floating Skilly's rect (mounted via tourDropping)
    // so the hero lands precisely on it — handles a dragged-away saved
    // position and matches its exact size. Fall back to the CSS default
    // slot (centre-bottom) if it isn't in the DOM yet.
    const floatingEl = document.querySelector('.skilly--floating');
    let targetX: number;
    let targetY: number;
    let targetW: number;
    if (floatingEl) {
      const fr = floatingEl.getBoundingClientRect();
      targetX = fr.left + fr.width / 2;
      targetY = fr.top + fr.height / 2;
      targetW = fr.width;
    } else {
      targetX = window.innerWidth / 2;
      targetY = window.innerHeight - 16 - 60;
      targetW = 108;
    }

    const targetScale = targetW / (r.width || MINI_SKILLY);
    return `translate(${targetX - cx}px, ${targetY - cy}px) scale(${targetScale.toFixed(3)})`;
  };

  if (validSteps.length === 0 || !step) return null;

  const isCentred = !step.target;
  const skillySize = isCentred ? HERO_SKILLY : MINI_SKILLY;

  const bubbleVisible = phase === 'live';
  const skillyTransform =
    phase === 'dropping'
      ? computeDropTransform()
      : phase === 'intro'
        ? 'translateY(30px) scale(0.9)'
        : 'translate(0,0) scale(1)';

  return (
    <div className="fixed inset-0" style={{ zIndex: 9999 }}>
      {/* Spotlight mask — a box-shadow that dims everything except the
          hole over the target. No target → flat dim sheet. */}
      {spotlight ? (
        <div
          className="absolute rounded-lg"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
            boxShadow: '0 0 0 9999px rgba(5, 8, 22, 0.80)',
            outline: '2px solid rgba(58, 123, 255, 0.6)',
            outlineOffset: 2,
            pointerEvents: 'none',
            transition: 'all 300ms ease-out',
            opacity: phase === 'dropping' ? 0 : 1,
          }}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: 'rgba(5, 8, 22, 0.80)',
            pointerEvents: 'none',
            transition: `opacity ${DROP_MS}ms ease-out`,
            opacity: phase === 'dropping' ? 0 : 1,
          }}
        />
      )}

      {/* Click blocker (lets the spotlighted element peek but not be
          clicked). Sits below the group so bubble buttons still work. */}
      <div
        className="absolute inset-0"
        style={{ zIndex: 1 }}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Skilly + bubble group */}
      <div
        className="flex items-center gap-4"
        style={{ ...groupStyle, zIndex: 2 }}
      >
        {/* Skilly */}
        <div
          ref={skillyRef}
          style={{
            width: skillySize,
            height: skillySize * (220 / 200),
            flexShrink: 0,
            transform: skillyTransform,
            opacity: phase === 'intro' ? 0 : 1,
            transition: `transform ${
              phase === 'dropping' ? DROP_MS : 450
            }ms cubic-bezier(.34,1.56,.64,1), opacity 350ms ease-out`,
          }}
        >
          <SkillyFace mouth={mouth} eyesMode={eyesMode} />
        </div>

        {/* Speech bubble */}
        <div
          style={{
            position: 'relative',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: '20px 22px',
            width: BUBBLE_W,
            boxShadow: '0 10px 40px rgba(0,0,0,0.45)',
            opacity: bubbleVisible ? 1 : 0,
            transform: bubbleVisible ? 'translateX(0)' : 'translateX(-10px)',
            transition: 'opacity 280ms ease-out, transform 280ms ease-out',
            pointerEvents: bubbleVisible ? 'auto' : 'none',
          }}
        >
          {/* Tail pointing left toward Skilly / the highlight */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              left: -10,
              top: 40,
              width: 0,
              height: 0,
              borderTop: '10px solid transparent',
              borderBottom: '10px solid transparent',
              borderRight: '10px solid var(--card)',
              filter: 'drop-shadow(-1px 0 0 var(--border))',
            }}
          />

          <div className="flex items-center gap-1.5 mb-3">
            {validSteps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i <= currentValidIndex
                    ? 'bg-[var(--primary)] w-6'
                    : 'bg-[var(--border)] w-3'
                }`}
              />
            ))}
            <span className="ml-auto text-xs text-[var(--muted-foreground)]">
              {currentValidIndex + 1} / {validSteps.length}
            </span>
          </div>

          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
            {step.title}
          </h3>
          <p className="text-sm text-[var(--muted-foreground)] leading-relaxed mb-4">
            {step.description}
          </p>

          <div className="flex items-center justify-between">
            <button
              onClick={finishWithDrop}
              className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              Skip tour
            </button>
            <button
              onClick={advance}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
            >
              {nextLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
