/**
 * Skilly-led onboarding tour.
 *
 * Layout:
 *   - Full-screen dim overlay.
 *   - Hero-sized Skilly mascot anchored on the left.
 *   - Speech bubble to his right contains the current step's title,
 *     description, dot indicator, Skip / Next buttons.
 *
 * Animation:
 *   - On mount: Skilly + bubble slide up from below (`intro` class).
 *   - On final step "Let's go!" click: bubble fades out, then Skilly
 *     translates from hero position down to the bottom-center
 *     floating slot (matches `.skilly--floating` left/bottom in
 *     skilly.css). When the translate finishes, `onComplete` fires —
 *     `SkillyFloating` then mounts the real persistent Skilly there.
 *
 * Skipping mid-tour: same drop animation, just from whichever step
 * the user bailed on.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { SkillyFace } from '../Skilly/SkillyFace';

interface TutorialStep {
  title: string;
  description: string;
  finalAction?: string; // label for the final button instead of "Next"
}

const STEPS: TutorialStep[] = [
  {
    title: "Hi! I'm Skilly ✨",
    description:
      "I'm your AI companion — I'll show you around in 30 seconds. Save prompts as portable skills, run them across ChatGPT, Claude, Gemini — any tool. Let's go!",
  },
  {
    title: 'Sign in so I can sync',
    description:
      "Sign in first and I'll keep your skills synced across every device, unlock the marketplace, and track your seller earnings.",
  },
  {
    title: 'Skill Chat — one box, every model',
    description:
      "Talk to every model from one chat. I route each message to the cheapest capable one — Haiku for quick stuff, Sonnet for hard reasoning, Gemini when you paste images. Your bill stays tiny!",
  },
  {
    title: 'Draft & enhance with me',
    description:
      "Draft prompts here — I auto-save as you type. When one feels weak, hit my enhancer and I'll rewrite it. Save the final version into a Set and reuse it forever.",
  },
  {
    title: 'Lock your style into a Preset',
    description:
      "Drop reference images and I'll pull out your palette, line weight, and signature into an encrypted Preset. List it on the marketplace and earn royalties every time someone buys it.",
  },
  {
    title: 'Your Skillsets',
    description:
      "Bundle prompts into reusable Sets with {variable} placeholders. Chain them into Skill Flows — output of step 1 feeds step 2. Run the whole pipeline with one click.",
  },
  {
    title: 'Marketplace — browse, buy, sell',
    description:
      "Browse Flows, Sets, and Presets from other creators. Buy with credits, filter by tag, save your favorite searches, and check ratings before grabbing. List your own and keep 70% of every sale — I'll handle payouts.",
  },
  {
    title: 'Skill Control — version like Git',
    description:
      "Pro+ unlock. Every edit gets versioned. Diff, branch, and rollback any skill like Git for prompts — never lose a good revision again.",
  },
  {
    title: 'Import sets from anywhere',
    description:
      "Import .skill files from friends, or pipe skills straight in from my Chrome extension as you save them from ChatGPT, Claude, and Gemini. See you inside!",
    finalAction: "Let's go!",
  },
];

interface TutorialOverlayProps {
  onComplete: () => void;
}

/** Drop animation duration — must match the CSS transition below. */
const DROP_MS = 700;

export function TutorialOverlay({ onComplete }: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  // Animation phase: 'intro' = slide up from below on mount,
  // 'live' = settled in hero pose, 'dropping' = sliding to floating slot.
  const [phase, setPhase] = useState<'intro' | 'live' | 'dropping'>('intro');
  const skillyHeroRef = useRef<HTMLDivElement>(null);
  const dropTimeoutRef = useRef<number | null>(null);

  // Transition from intro → live after a brief settle so the slide-up
  // animation actually plays (CSS animations only retrigger on class
  // change, not on initial mount in some browsers).
  useEffect(() => {
    const id = window.setTimeout(() => setPhase('live'), 50);
    return () => window.clearTimeout(id);
  }, []);

  // Cleanup any pending drop timeout on unmount.
  useEffect(() => {
    return () => {
      if (dropTimeoutRef.current) window.clearTimeout(dropTimeoutRef.current);
    };
  }, []);

  const isLastStep = currentStep === STEPS.length - 1;
  const nextLabel = isLastStep ? STEPS[currentStep].finalAction || 'Finish' : 'Next';

  const advance = useCallback(() => {
    if (isLastStep) {
      finishWithDrop();
    } else {
      setCurrentStep((s) => s + 1);
    }
  }, [isLastStep]);

  // Trigger the drop animation, then signal completion. Called by both
  // Next-on-last-step and Skip.
  const finishWithDrop = useCallback(() => {
    setPhase('dropping');
    dropTimeoutRef.current = window.setTimeout(() => {
      onComplete();
    }, DROP_MS);
  }, [onComplete]);

  const step = STEPS[currentStep];

  // Drop translate targets the floating slot defined in skilly.css:
  //   .skilly--floating { left: 50%; bottom: 16px; transform: translateX(-50%); }
  // Compute pixel offsets from the hero anchor to that slot at runtime,
  // so the drop lands precisely regardless of viewport size.
  const computeDropTransform = (): string => {
    const el = skillyHeroRef.current;
    if (!el) return 'translate(0, 0) scale(0.55)';
    const rect = el.getBoundingClientRect();
    const heroCenterX = rect.left + rect.width / 2;
    const heroCenterY = rect.top + rect.height / 2;
    // Floating slot: viewport-center horizontally, 16 + 60 (half height) up.
    const targetX = window.innerWidth / 2;
    const targetY = window.innerHeight - 16 - 60;
    const dx = targetX - heroCenterX;
    const dy = targetY - heroCenterY;
    return `translate(${dx}px, ${dy}px) scale(0.55)`;
  };

  const heroTransform =
    phase === 'dropping'
      ? computeDropTransform()
      : phase === 'intro'
        ? 'translateY(40px) scale(0.9)'
        : 'translate(0, 0) scale(1)';

  const heroOpacity = phase === 'intro' ? 0 : 1;
  const bubbleVisible = phase === 'live';

  return (
    <div
      className="fixed inset-0 flex items-center justify-center pointer-events-auto"
      style={{
        zIndex: 9999,
        background: 'rgba(5, 8, 22, 0.78)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        transition: `background ${DROP_MS}ms ease-out, backdrop-filter ${DROP_MS}ms ease-out`,
        ...(phase === 'dropping' && {
          background: 'rgba(5, 8, 22, 0)',
          backdropFilter: 'blur(0)',
          WebkitBackdropFilter: 'blur(0)',
          pointerEvents: 'none' as const,
        }),
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="flex items-center gap-6 sm:gap-10 max-w-3xl px-6"
        style={{ pointerEvents: 'auto' }}
      >
        {/* Hero Skilly — slides up on mount, drops to floating slot on finish. */}
        <div
          ref={skillyHeroRef}
          style={{
            width: 200,
            height: 220,
            flexShrink: 0,
            transform: heroTransform,
            opacity: heroOpacity,
            transition: `transform ${
              phase === 'dropping' ? DROP_MS : 500
            }ms cubic-bezier(.34,1.56,.64,1), opacity 400ms ease-out`,
          }}
        >
          <SkillyFace mouth="smile" eyesMode="normal" />
        </div>

        {/* Speech bubble — points left toward Skilly. Hidden during drop
            so the user's eye follows the mascot, not stale text. */}
        <div
          style={{
            position: 'relative',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: '20px 22px',
            maxWidth: 360,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.45)',
            opacity: bubbleVisible ? 1 : 0,
            transform: bubbleVisible ? 'translateX(0)' : 'translateX(-12px)',
            transition: 'opacity 300ms ease-out, transform 300ms ease-out',
            pointerEvents: bubbleVisible ? 'auto' : 'none',
          }}
        >
          {/* Bubble tail pointing left toward Skilly */}
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

          {/* Step dots */}
          <div className="flex items-center gap-1.5 mb-3">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i <= currentStep
                    ? 'bg-[var(--primary)] w-6'
                    : 'bg-[var(--border)] w-3'
                }`}
              />
            ))}
            <span className="ml-auto text-xs text-[var(--muted-foreground)]">
              {currentStep + 1} / {STEPS.length}
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
