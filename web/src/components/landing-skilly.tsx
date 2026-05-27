"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

type Mouth = "smile" | "o";

interface LandingSkillyProps {
  /** Outer wrapper classes — caller controls absolute/relative + offsets. */
  className?: string;
  /** Skilly visual size (px). Defaults to 88. */
  size?: number;
  /** Side the tooltip anchors to relative to Skilly. */
  tooltipSide?: "left" | "right";
}

export function LandingSkilly({
  className = "",
  size = 88,
  tooltipSide = "right",
}: LandingSkillyProps) {
  const [open, setOpen] = useState(false);
  const [mouth, setMouth] = useState<Mouth>("smile");
  const wrapRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  // Portal-positioned tooltip coords. Computed from Skilly's viewport rect
  // so the tooltip escapes every ancestor's stacking context / overflow.
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  // Unique per-instance ID prefix — guards against two LandingSkilly mounts
  // colliding on gradient/filter IDs (browser picks the first match, which
  // ends up inside a display:none subtree and paints as empty).
  const rawId = useId();
  const uid = rawId.replace(/:/g, "");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Recompute tooltip position whenever it opens, on scroll, on resize.
  useLayoutEffect(() => {
    if (!open) return;
    function place() {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dialogW = window.innerWidth >= 768 ? 300 : 260;
      const margin = 12;
      // Tooltip uses position:fixed, so feed it viewport coords directly.
      const top = r.bottom + margin;
      const desired = tooltipSide === "right" ? r.left : r.right - dialogW;
      // Keep tooltip inside viewport with 8px breathing room on each side.
      const left = Math.max(8, Math.min(desired, window.innerWidth - dialogW - 8));
      setPos({ top, left });
    }
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, tooltipSide]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const target = e.target as Node;
      if (wrapRef.current?.contains(target)) return;
      if (dialogRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function handleClick() {
    // Avoid functional-updater toggle: React StrictMode double-invokes the
    // updater in dev, which would flip the state back to its previous value.
    setOpen(!open);
    setMouth("o");
    window.setTimeout(() => setMouth("smile"), 450);
  }

  return (
    <div ref={wrapRef} className={`pointer-events-auto z-30 select-none ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        aria-label="Meet Skilly"
        className="group relative block cursor-pointer transition-transform duration-300 hover:-translate-y-1"
        style={{
          width: size,
          height: size,
          animation: "skilly-float 4.2s ease-in-out infinite",
        }}
      >
        <SkillyFace mouth={mouth} uid={uid} />
        {/* "tap me" hint — always visible below lg (where touch is likely),
            fades in on hover at lg+ (pointer devices). */}
        <span
          aria-hidden
          className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-full border border-white/15 bg-[#0a0a0c]/85 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-zinc-300 backdrop-blur transition-opacity duration-200 opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
          style={{ fontFamily: "var(--font-geist-mono), monospace" }}
        >
          tap me
        </span>
      </button>

      {mounted && open && pos &&
        createPortal(
          <div
            ref={dialogRef}
            role="dialog"
            className="pointer-events-auto fixed z-[9999] w-[260px] rounded-2xl border border-white/[0.08] bg-[#0f0f12] p-4 shadow-[0_20px_50px_-20px_rgba(37,99,235,0.45)] md:w-[300px]"
            style={{
              top: pos.top,
              left: pos.left,
              animation: "skilly-pop 220ms cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            <p className="text-[13.5px] leading-[1.5] text-zinc-200">
              Hi, I&rsquo;m <strong className="font-medium text-white">Skilly</strong> — your AI buddy in Skillset.
            </p>
            <p className="mt-1.5 text-[12.5px] leading-[1.5] text-zinc-400">
              Download now to meet me :)
            </p>
            <Link
              href="/downloads"
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#2563EB] px-3.5 py-1.5 text-[12px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition-colors hover:bg-[#1d4ed8]"
            >
              Get Skillset
            </Link>
          </div>,
          document.body,
        )}

      <style>{`
        @keyframes skilly-float {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50%       { transform: translateY(-6px) rotate(2deg); }
        }
        @keyframes skilly-pop {
          0%   { opacity: 0; transform: translateY(6px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0)   scale(1); }
        }
      `}</style>
    </div>
  );
}

const STAR_OUTER = "58,14 78,56 106,42 88,76 98,108 58,86 18,112 30,78 10,50 40,50";
const STAR_MID   = "58.3,21.7 75.3,57.4 99.1,45.5 83.8,74.4 92.3,101.6 58.3,82.9 24.3,105 34.5,76.1 17.5,52.3 43,52.3";
const STAR_INNER = "58.7,31.9 71.7,59.2 89.9,50.1 78.2,72.2 84.7,93 58.7,78.7 32.7,95.6 40.5,73.5 27.5,55.3 47,55.3";

function SkillyFace({ mouth, uid }: { mouth: Mouth; uid: string }) {
  const idOuter = `ls-outer-${uid}`;
  const idMid = `ls-mid-${uid}`;
  const idInner = `ls-inner-${uid}`;
  const idShine = `ls-shine-${uid}`;
  const idCl = `ls-cl-${uid}`;
  const idShadow = `ls-shadow-${uid}`;
  const idWonky = `ls-wonky-${uid}`;
  return (
    <svg
      viewBox="0 0 120 130"
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      style={{ overflow: "visible" }}
    >
      <defs>
        <radialGradient id={idOuter} gradientUnits="userSpaceOnUse" cx="35" cy="30" r="110">
          <stop offset="0%" stopColor="#3658c2" />
          <stop offset="50%" stopColor="#0d266b" />
          <stop offset="100%" stopColor="#04143f" />
        </radialGradient>
        <radialGradient id={idMid} gradientUnits="userSpaceOnUse" cx="35" cy="30" r="100">
          <stop offset="0%" stopColor="#82a8ff" />
          <stop offset="55%" stopColor="#2b6bff" />
          <stop offset="100%" stopColor="#143fb0" />
        </radialGradient>
        <radialGradient id={idInner} gradientUnits="userSpaceOnUse" cx="40" cy="35" r="90">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="35%" stopColor="#dde9ff" />
          <stop offset="70%" stopColor="#aac7ff" />
          <stop offset="100%" stopColor="#8aa9dd" />
        </radialGradient>
        <radialGradient id={idShine} gradientUnits="userSpaceOnUse" cx="0" cy="0" r="22">
          <stop offset="0%" stopColor="white" stopOpacity="0.95" />
          <stop offset="35%" stopColor="white" stopOpacity="0.45" />
          <stop offset="70%" stopColor="white" stopOpacity="0.20" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={idCl} gradientUnits="userSpaceOnUse" cx="0" cy="0" r="6">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="40%" stopColor="white" stopOpacity="0.85" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <filter id={idShadow} x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="1.5" dy="3" stdDeviation="3.5" floodColor="#000000" floodOpacity="0.55" />
        </filter>
        <filter id={idWonky} x="-15%" y="-15%" width="130%" height="130%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="4" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" />
        </filter>
      </defs>

      <g strokeLinejoin="round" strokeLinecap="round" filter={`url(#${idShadow})`}>
        <polygon points={STAR_OUTER} fill={`url(#${idOuter})`} stroke="#0d266b" strokeWidth={22} />
        <polygon points={STAR_MID}   fill={`url(#${idMid})`}   stroke="#2b6bff" strokeWidth={16} />
        <polygon points={STAR_INNER} fill={`url(#${idInner})`} stroke="#aac7ff" strokeWidth={10} />
      </g>

      <g transform="translate(60 60)">
        <ellipse cx="0" cy="0" rx="26" ry="20" fill={`url(#${idShine})`} />
        <ellipse cx="0" cy="0" rx="7"  ry="5"  fill={`url(#${idCl})`} />
      </g>

      <ellipse cx="36" cy="74" rx="5" ry="2.8" fill="#ff8fb8" opacity="0.55" transform="rotate(-8 36 74)" />
      <ellipse cx="84" cy="72" rx="4" ry="2.4" fill="#ff8fb8" opacity="0.5"  transform="rotate(6 84 72)" />

      <g className="eye left">
        <ellipse cx="48" cy="60" rx="6.2" ry="7" fill="#0d266b" />
        <circle cx="49.5" cy="58" r="1.7" fill="white" />
      </g>
      <g className="eye right">
        <ellipse cx="74" cy="63" rx="5.2" ry="6.2" fill="#0d266b" />
        <circle cx="75.2" cy="61" r="1.5" fill="white" />
      </g>

      {mouth === "smile" && (
        <path d="M 52 74 Q 60 83 70 77" stroke="#0d266b" strokeWidth={2.8} fill="none" strokeLinecap="round" />
      )}
      {mouth === "o" && <circle cx="60" cy="78" r="3" fill="#0d266b" />}

      <g
        fill="rgba(255,255,255,0.18)"
        stroke="#0d266b"
        strokeWidth="2.4"
        strokeLinecap="round"
        filter={`url(#${idWonky})`}
      >
        <ellipse cx="48" cy="60" rx="11"  ry="10.5" transform="rotate(-6 48 60)" />
        <ellipse cx="74" cy="63" rx="9.5" ry="9"    transform="rotate(4 74 63)" />
        <path d="M 59 59 Q 62 56 66 61" fill="none" />
        <path d="M 37 58 Q 32 56 28 55" fill="none" />
        <path d="M 83.5 62 Q 88 60 91 59" fill="none" />
        <path d="M 43 53 Q 46 50 51 54" stroke="white" strokeWidth="1.4" opacity="0.7" fill="none" />
        <path d="M 69 56 Q 72 53 76 56" stroke="white" strokeWidth="1.2" opacity="0.65" fill="none" />
      </g>
    </svg>
  );
}
