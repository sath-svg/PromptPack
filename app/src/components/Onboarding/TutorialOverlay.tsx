import { useState, useEffect, useCallback, useRef } from 'react';

interface TutorialStep {
  target: string | null; // data-tutorial selector, null = centered (no highlight)
  title: string;
  description: string;
  finalAction?: string; // label for the final button instead of "Next"
}

const STEPS: TutorialStep[] = [
  {
    target: null,
    title: 'Welcome to PromptPack Desktop!',
    description: "Here's a quick tour of the key features to get you started.",
  },
  {
    target: '[data-tutorial="sign-in"]',
    title: 'Sign In',
    description:
      'Sign in to sync prompts across devices and access cloud features.',
  },
  {
    target: '[data-tutorial="draft"]',
    title: 'Draft Prompts',
    description:
      'Draft and enhance prompts here. Each draft auto-saves as you type.',
  },
  {
    target: '[data-tutorial="saved-packs"]',
    title: 'Saved from Extension',
    description:
      'Prompts saved from the Chrome extension sync here automatically.',
  },
  {
    target: '[data-tutorial="import"]',
    title: 'Import Packs',
    description: 'Import .pmtpk pack files shared by others.',
    finalAction: 'Got it',
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

export function TutorialOverlay({ onComplete }: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<Rect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const overlayRef = useRef<HTMLDivElement>(null);

  // Compute the list of valid step indices (skip steps whose target element is missing)
  const getValidSteps = useCallback((): number[] => {
    const valid: number[] = [];
    for (let i = 0; i < STEPS.length; i++) {
      const step = STEPS[i];
      if (!step.target) {
        // Centered step (no target) is always valid
        valid.push(i);
      } else {
        const el = document.querySelector(step.target);
        if (el) valid.push(i);
      }
    }
    return valid;
  }, []);

  const [validSteps, setValidSteps] = useState<number[]>([]);

  // Initialize valid steps on mount
  useEffect(() => {
    const steps = getValidSteps();
    if (steps.length === 0) {
      // No valid steps at all, complete immediately
      onComplete();
      return;
    }
    setValidSteps(steps);
    setCurrentStep(steps[0]);
  }, [getValidSteps, onComplete]);

  // Position the spotlight and tooltip for the current step
  const positionElements = useCallback(() => {
    const step = STEPS[currentStep];
    if (!step) return;

    if (!step.target) {
      // Centered step: no spotlight
      setSpotlightRect(null);
      setTooltipStyle({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      });
      return;
    }

    const el = document.querySelector(step.target);
    if (!el) {
      // Element not found, skip to next valid step
      advanceStep();
      return;
    }

    const rect = el.getBoundingClientRect();
    const padding = 8;
    const spotlight: Rect = {
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    };
    setSpotlightRect(spotlight);

    // Calculate tooltip position: prefer below the element, fall back to above
    const tooltipWidth = 340;
    const tooltipHeight = 180;
    const gap = 16;

    let top: number;
    let left: number;

    const spaceBelow = window.innerHeight - (spotlight.top + spotlight.height);
    const spaceAbove = spotlight.top;

    if (spaceBelow >= tooltipHeight + gap) {
      // Place below
      top = spotlight.top + spotlight.height + gap;
    } else if (spaceAbove >= tooltipHeight + gap) {
      // Place above
      top = spotlight.top - tooltipHeight - gap;
    } else {
      // Place centered vertically beside the element
      top = Math.max(16, spotlight.top + spotlight.height / 2 - tooltipHeight / 2);
    }

    // Horizontal: center on the spotlight, clamped to viewport
    left = spotlight.left + spotlight.width / 2 - tooltipWidth / 2;
    left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));
    top = Math.max(16, Math.min(top, window.innerHeight - tooltipHeight - 16));

    setTooltipStyle({
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${tooltipWidth}px`,
    });
  }, [currentStep]);

  // Advance to the next valid step
  const advanceStep = useCallback(() => {
    const currentIndex = validSteps.indexOf(currentStep);
    if (currentIndex === -1 || currentIndex >= validSteps.length - 1) {
      // Last step or not found, complete
      onComplete();
    } else {
      setCurrentStep(validSteps[currentIndex + 1]);
    }
  }, [currentStep, validSteps, onComplete]);

  // Reposition on step change and window resize
  useEffect(() => {
    positionElements();

    // Use ResizeObserver on the document body to catch layout changes
    const resizeObserver = new ResizeObserver(() => {
      positionElements();
    });
    resizeObserver.observe(document.body);

    const handleResize = () => positionElements();
    window.addEventListener('resize', handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [positionElements]);

  // Don't render until valid steps are computed
  if (validSteps.length === 0) return null;

  const step = STEPS[currentStep];
  if (!step) return null;

  const currentValidIndex = validSteps.indexOf(currentStep);
  const isLastStep = currentValidIndex === validSteps.length - 1;
  const nextLabel = isLastStep
    ? step.finalAction || 'Finish'
    : 'Next';

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0"
      style={{ zIndex: 9999 }}
    >
      {/* Dark overlay with spotlight cutout */}
      {spotlightRect ? (
        <div
          className="absolute rounded-lg"
          style={{
            top: spotlightRect.top,
            left: spotlightRect.left,
            width: spotlightRect.width,
            height: spotlightRect.height,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        />
      ) : (
        /* No spotlight: full dark overlay */
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Click blocker - covers everything except the tooltip */}
      <div
        className="absolute inset-0"
        style={{ zIndex: 10000 }}
        onClick={(e) => {
          // Block clicks on the overlay itself
          e.stopPropagation();
        }}
      />

      {/* Tooltip card */}
      <div
        className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl p-5"
        style={{
          ...tooltipStyle,
          zIndex: 10001,
        }}
      >
        {/* Step indicator */}
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

        {/* Content */}
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
          {step.title}
        </h3>
        <p className="text-sm text-[var(--muted-foreground)] leading-relaxed mb-4">
          {step.description}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={onComplete}
            className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            Skip tour
          </button>
          <button
            onClick={advanceStep}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
          >
            {nextLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
