"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface TutorialStep {
  /** CSS selector for the element to highlight, or null for centered card */
  selector: string | null;
  /** Which match of the selector to use (0-indexed). Defaults to 0. */
  selectorIndex?: number;
  title: string;
  description: string;
  /** If true, show a "Got it" button instead of "Next" */
  isFinal?: boolean;
}

const STEPS: TutorialStep[] = [
  {
    selector: null,
    title: "Welcome to PromptPack!",
    description: "Let's take a quick tour.",
  },
  {
    selector: ".dashboard-card",
    selectorIndex: 0,
    title: "Your Prompt Stats",
    description:
      "Your saved prompts appear here. Install the Chrome extension to save prompts from ChatGPT, Claude, and Gemini.",
  },
  {
    selector: ".dashboard-section",
    selectorIndex: 1,
    title: "Your Saved Prompts",
    description:
      "Organize prompts into packs. Pro users can create up to 3 custom packs.",
  },
  {
    selector: ".dashboard-card",
    selectorIndex: 2,
    title: "Current Plan",
    description:
      "You're on the Free plan with 5 prompts. Upgrade anytime for more.",
  },
  {
    selector: null,
    title: "You're all set!",
    description:
      "Install the Chrome extension or save your first prompt to get started.",
    isFinal: true,
  },
];

interface TutorialOverlayProps {
  onComplete: () => void;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function TutorialOverlay({ onComplete }: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  const step = STEPS[currentStep];
  const totalSteps = STEPS.length;

  // Measure and track the highlighted element
  const measureTarget = useCallback(() => {
    if (!step.selector) {
      setTargetRect(null);
      return;
    }

    const elements = document.querySelectorAll(step.selector);
    const index = step.selectorIndex ?? 0;
    const el = elements[index] as HTMLElement | undefined;

    if (el) {
      const rect = el.getBoundingClientRect();
      const padding = 8;
      setTargetRect({
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      });
    } else {
      setTargetRect(null);
    }
  }, [step.selector, step.selectorIndex]);

  // Set up ResizeObserver and window resize listener
  useEffect(() => {
    measureTarget();

    const handleResize = () => measureTarget();
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize, true);

    // Observe the target element for size changes
    if (step.selector) {
      const elements = document.querySelectorAll(step.selector);
      const index = step.selectorIndex ?? 0;
      const el = elements[index] as HTMLElement | undefined;

      if (el) {
        observerRef.current = new ResizeObserver(() => measureTarget());
        observerRef.current.observe(el);
      }
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize, true);
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [currentStep, measureTarget, step.selector, step.selectorIndex]);

  // Scroll highlighted element into view
  useEffect(() => {
    if (step.selector) {
      const elements = document.querySelectorAll(step.selector);
      const index = step.selectorIndex ?? 0;
      const el = elements[index] as HTMLElement | undefined;
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        // Re-measure after scroll settles
        const timer = setTimeout(() => measureTarget(), 400);
        return () => clearTimeout(timer);
      }
    }
  }, [currentStep, step.selector, step.selectorIndex, measureTarget]);

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  // Compute tooltip position relative to the highlighted element
  const getTooltipStyle = (): React.CSSProperties => {
    // Centered card when no target
    if (!targetRect) {
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 10000,
      };
    }

    const tooltipWidth = 340;
    const tooltipEstimatedHeight = 180;
    const gap = 16;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top: number;
    let left: number;

    // Prefer placing below the element
    const spaceBelow = viewportHeight - (targetRect.top + targetRect.height);
    const spaceAbove = targetRect.top;

    if (spaceBelow >= tooltipEstimatedHeight + gap) {
      top = targetRect.top + targetRect.height + gap;
    } else if (spaceAbove >= tooltipEstimatedHeight + gap) {
      top = targetRect.top - tooltipEstimatedHeight - gap;
    } else {
      // Place beside
      top = Math.max(
        gap,
        Math.min(
          targetRect.top,
          viewportHeight - tooltipEstimatedHeight - gap
        )
      );
    }

    // Center horizontally with the target, but keep on-screen
    left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
    left = Math.max(gap, Math.min(left, viewportWidth - tooltipWidth - gap));

    return {
      position: "fixed",
      top,
      left,
      zIndex: 10000,
    };
  };

  // Styles
  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
  };

  const backdropStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.6)",
    zIndex: 9999,
  };

  const spotlightStyle: React.CSSProperties | null = targetRect
    ? {
        position: "fixed",
        top: targetRect.top,
        left: targetRect.left,
        width: targetRect.width,
        height: targetRect.height,
        borderRadius: "12px",
        boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.6)",
        zIndex: 9999,
        pointerEvents: "none" as const,
      }
    : null;

  const cardStyle: React.CSSProperties = {
    background: "#1a1a2e",
    border: "1px solid rgba(139, 92, 246, 0.3)",
    borderRadius: "12px",
    padding: "1.5rem",
    width: "340px",
    maxWidth: "calc(100vw - 2rem)",
    color: "#e0e0e0",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
    ...getTooltipStyle(),
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "1.1rem",
    fontWeight: 600,
    marginBottom: "0.5rem",
    color: "#ffffff",
  };

  const descriptionStyle: React.CSSProperties = {
    fontSize: "0.9rem",
    lineHeight: 1.5,
    color: "#a0a0b8",
    marginBottom: "1rem",
  };

  const footerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  };

  const stepCounterStyle: React.CSSProperties = {
    fontSize: "0.8rem",
    color: "#6b6b80",
  };

  const buttonGroupStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  };

  const skipStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    color: "#6b6b80",
    fontSize: "0.85rem",
    cursor: "pointer",
    padding: "0.25rem",
    textDecoration: "underline",
  };

  const nextButtonStyle: React.CSSProperties = {
    background: "var(--accent, #8b5cf6)",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "0.5rem 1.25rem",
    fontSize: "0.9rem",
    fontWeight: 500,
    cursor: "pointer",
    transition: "opacity 0.2s",
  };

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true" aria-label="Tutorial overlay">
      {/* Backdrop: only shown when there is no spotlight (centered card steps) */}
      {!targetRect && <div style={backdropStyle} onClick={handleSkip} />}

      {/* Spotlight hole via box-shadow */}
      {spotlightStyle && <div style={spotlightStyle} />}

      {/* Tooltip card */}
      <div style={cardStyle}>
        <div style={titleStyle}>{step.title}</div>
        <div style={descriptionStyle}>{step.description}</div>
        <div style={footerStyle}>
          <span style={stepCounterStyle}>
            Step {currentStep + 1} of {totalSteps}
          </span>
          <div style={buttonGroupStyle}>
            <button style={skipStyle} onClick={handleSkip}>
              Skip tour
            </button>
            <button
              style={nextButtonStyle}
              onClick={handleNext}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.opacity = "0.85";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.opacity = "1";
              }}
            >
              {step.isFinal ? "Got it" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
