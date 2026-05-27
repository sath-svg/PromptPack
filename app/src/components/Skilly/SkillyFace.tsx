/**
 * Pure presentational SVG body for Skilly.
 *
 * Ported from `skillset-mascot.html`:
 *  - 3 nested asymmetric 10-vertex polygons w/ thick round-joined strokes
 *    yields chunky star with round tips & valleys.
 *  - Glasses wrap inside a feTurbulence displacement (`#skilly-wonky`) so
 *    they wobble hand-drawn.
 *
 * Eyes / mouth / glasses respond to mode props so the parent component
 * can drive context (thinking, passed out, sad, etc.).
 */

import type { CSSProperties } from 'react';

export type SkillyMouth = 'smile' | 'sad' | 'o' | 'thinking' | 'flat';
export type SkillyEyesMode = 'normal' | 'thinking' | 'passedOut' | 'sleeping';

interface SkillyFaceProps {
  mouth: SkillyMouth;
  eyesMode: SkillyEyesMode;
  pupilOffset?: { x: number; y: number };
  /** Hide the glasses (rarely useful — defaults to showing them). */
  hideGlasses?: boolean;
  style?: CSSProperties;
}

// Asymmetric polygon vertex sets ported verbatim from the HTML prototype.
// Polygon order: tip → valley → tip → … (10 points).
const STAR_OUTER = '58,14 78,56 106,42 88,76 98,108 58,86 18,112 30,78 10,50 40,50';
const STAR_MID   = '58.3,21.7 75.3,57.4 99.1,45.5 83.8,74.4 92.3,101.6 58.3,82.9 24.3,105 34.5,76.1 17.5,52.3 43,52.3';
const STAR_INNER = '58.7,31.9 71.7,59.2 89.9,50.1 78.2,72.2 84.7,93 58.7,78.7 32.7,95.6 40.5,73.5 27.5,55.3 47,55.3';

export function SkillyFace({
  mouth,
  eyesMode,
  pupilOffset = { x: 0, y: 0 },
  hideGlasses = false,
  style,
}: SkillyFaceProps) {
  return (
    <svg
      viewBox="0 0 120 130"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: 'visible', ...style }}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* Per-ring radial gradients — all gradients use userSpaceOnUse
            so they share ONE light source in viewBox coords (top-left
            ~(35,30)), regardless of each polygon's bounding box. Avoids
            the cut-off look that objectBoundingBox produced on the
            irregular star silhouette. */}
        <radialGradient
          id="skilly-outer-grad"
          gradientUnits="userSpaceOnUse"
          cx="35" cy="30" r="110"
        >
          <stop offset="0%"   stopColor="#3658c2" />
          <stop offset="50%"  stopColor="#0d266b" />
          <stop offset="100%" stopColor="#04143f" />
        </radialGradient>
        <radialGradient
          id="skilly-mid-grad"
          gradientUnits="userSpaceOnUse"
          cx="35" cy="30" r="100"
        >
          <stop offset="0%"   stopColor="#82a8ff" />
          <stop offset="55%"  stopColor="#2b6bff" />
          <stop offset="100%" stopColor="#143fb0" />
        </radialGradient>
        <radialGradient
          id="skilly-inner-grad"
          gradientUnits="userSpaceOnUse"
          cx="40" cy="35" r="90"
        >
          <stop offset="0%"   stopColor="#ffffff" />
          <stop offset="35%"  stopColor="#dde9ff" />
          <stop offset="70%"  stopColor="#aac7ff" />
          <stop offset="100%" stopColor="#8aa9dd" />
        </radialGradient>
        {/* Diffuse incandescence — broad soft glow around the specular.
            Intensity boosted so the halo reads against the light-blue
            inner face. Center at (0,0); wrapping <g translate> moves it. */}
        <radialGradient
          id="skilly-face-shine"
          gradientUnits="userSpaceOnUse"
          cx="0" cy="0" r="22"
        >
          <stop offset="0%"  stopColor="white" stopOpacity="0.95" />
          <stop offset="35%" stopColor="white" stopOpacity="0.45" />
          <stop offset="70%" stopColor="white" stopOpacity="0.20" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        {/* Specular pinpoint — pure white hot-spot, sharper falloff. */}
        <radialGradient
          id="skilly-catchlight"
          gradientUnits="userSpaceOnUse"
          cx="0" cy="0" r="6"
        >
          <stop offset="0%"   stopColor="white" stopOpacity="1" />
          <stop offset="40%"  stopColor="white" stopOpacity="0.85" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        {/* Per-tip glossy bubble — soft white highlight that reads as a
            reflection on the rounded vertex surface. Reused across all
            five tips via translate/rotate. */}
        <radialGradient
          id="skilly-tip-shine"
          gradientUnits="objectBoundingBox"
          cx="0.5" cy="0.5" r="0.5"
        >
          <stop offset="0%"   stopColor="white" stopOpacity="0.9"  />
          <stop offset="55%"  stopColor="white" stopOpacity="0.35" />
          <stop offset="100%" stopColor="white" stopOpacity="0"    />
        </radialGradient>
        {/* Drop shadow behind the whole star body — soft black blur
            offset slightly down-right, gives Skilly a grounded, lifted
            feel on dark backgrounds. Filter region padded so the blur
            isn't clipped at the polygon's bounding box. */}
        <filter
          id="skilly-body-shadow"
          x="-25%" y="-25%" width="150%" height="150%"
        >
          <feDropShadow
            dx="1.5"
            dy="3"
            stdDeviation="3.5"
            floodColor="#000000"
            floodOpacity="0.55"
          />
        </filter>
        <filter id="skilly-wonky" x="-15%" y="-15%" width="130%" height="130%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.05"
            numOctaves="2"
            seed="4"
            result="noise"
          />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" />
        </filter>
      </defs>

      {/* Body: 3 nested asymmetric 10-vertex star polygons w/ shading.
          Drop-shadow filter on group level renders one soft blurred
          silhouette behind ALL three rings — gives Skilly a grounded,
          lifted feel on dark backgrounds. */}
      <g
        strokeLinejoin="round"
        strokeLinecap="round"
        filter="url(#skilly-body-shadow)"
      >
        <polygon
          points={STAR_OUTER}
          fill="url(#skilly-outer-grad)"
          stroke="#0d266b"
          strokeWidth={22}
        />
        <polygon
          points={STAR_MID}
          fill="url(#skilly-mid-grad)"
          stroke="#2b6bff"
          strokeWidth={16}
        />
        <polygon
          points={STAR_INNER}
          fill="url(#skilly-inner-grad)"
          stroke="#aac7ff"
          strokeWidth={10}
        />
      </g>

      {/*
        Per-tip glossy bubbles — white catchlights on each rounded tip
        cap so vertices read as 3D bulges. Positioned 2-4 units inward
        from each STAR_OUTER tip vertex toward the global light source
        at viewBox ~(35, 30). Rotation aligns long axis with tip axis
        so the bubble hugs the cap curve.

        Outer-star tips (STAR_OUTER vertices 0, 2, 4, 6, 8):
          T1 top         (58, 14)
          T2 right       (106, 42)
          T3 bottom-right(98, 108)
          T4 bottom-left (18, 112)
          T5 left        (10, 50)
      */}
      <g>
        {/* T1 top */}
        <ellipse cx="59" cy="17" rx="4" ry="2.4" fill="url(#skilly-tip-shine)" />
        {/* T2 upper-right — tip axis ~70° */}
        <ellipse cx="102" cy="44" rx="4" ry="2.4" fill="url(#skilly-tip-shine)" transform="rotate(70 102 44)" />
        {/* T3 lower-right — tip axis ~-40° */}
        <ellipse cx="94"  cy="104" rx="4" ry="2.4" fill="url(#skilly-tip-shine)" transform="rotate(-40 94 104)" />
        {/* T4 lower-left — tip axis ~40° */}
        <ellipse cx="22" cy="108" rx="4" ry="2.4" fill="url(#skilly-tip-shine)" transform="rotate(40 22 108)" />
        {/* T5 left — tip axis ~80° */}
        <ellipse cx="14" cy="52" rx="4" ry="2.4" fill="url(#skilly-tip-shine)" transform="rotate(80 14 52)" />
      </g>

      {/*
        Spherical lighting (halo + specular pinpoint).
        To move the WHOLE highlight, edit only the translate(X Y)
        below — both ellipses + their gradients live at (0,0) inside
        this group, so they move together.
          X = horizontal position in viewBox (0..120)
          Y = vertical position in viewBox (0..130)
      */}
      <g transform="translate(60 60)">
        <ellipse cx="0" cy="0" rx="26" ry="20" fill="url(#skilly-face-shine)" />
        <ellipse cx="0" cy="0" rx="7"  ry="5"  fill="url(#skilly-catchlight)" />
      </g>

      {/* Asymmetric blush. */}
      <ellipse cx="36" cy="74" rx="5" ry="2.8" fill="#ff8fb8" opacity="0.55" transform="rotate(-8 36 74)" />
      <ellipse cx="84" cy="72" rx="4" ry="2.4" fill="#ff8fb8" opacity="0.5"  transform="rotate(6 84 72)" />

      {/* Eyes — mode-dependent. */}
      {eyesMode === 'normal' && (
        <>
          <g className="eye left">
            <ellipse cx="48" cy="60" rx="6.2" ry="7" fill="#0d266b" />
            <circle
              cx="49.5"
              cy="58"
              r="1.7"
              fill="white"
              transform={`translate(${pupilOffset.x} ${pupilOffset.y})`}
            />
          </g>
          <g className="eye right">
            <ellipse cx="74" cy="63" rx="5.2" ry="6.2" fill="#0d266b" />
            <circle
              cx="75.2"
              cy="61"
              r="1.5"
              fill="white"
              transform={`translate(${pupilOffset.x} ${pupilOffset.y})`}
            />
          </g>
        </>
      )}

      {eyesMode === 'thinking' && (
        // `> <` — focused / squinting eyes. Squeeze animation pulses them.
        <>
          <path
            className="skilly__thinking-eye"
            d="M 42 55 L 52 60 L 42 65"
            stroke="#0d266b"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            className="skilly__thinking-eye"
            d="M 80 58 L 70 63 L 80 68"
            stroke="#0d266b"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}

      {eyesMode === 'passedOut' && (
        // X X — limp, knocked out.
        <>
          <g>
            <path d="M 42 54 L 54 66" stroke="#0d266b" strokeWidth="3" strokeLinecap="round" />
            <path d="M 54 54 L 42 66" stroke="#0d266b" strokeWidth="3" strokeLinecap="round" />
          </g>
          <g>
            <path d="M 68 57 L 80 69" stroke="#0d266b" strokeWidth="3" strokeLinecap="round" />
            <path d="M 80 57 L 68 69" stroke="#0d266b" strokeWidth="3" strokeLinecap="round" />
          </g>
        </>
      )}

      {eyesMode === 'sleeping' && (
        // Closed eyes — soft downward arcs like sleeping cartoon.
        <>
          <path
            d="M 42 60 Q 48 64 54 60"
            stroke="#0d266b"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 68 62 Q 74 66 80 62"
            stroke="#0d266b"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
          />
        </>
      )}

      {/* Mouth — variants. Passed-out forces flat regardless of incoming prop. */}
      {renderMouth(eyesMode === 'passedOut' ? 'flat' : mouth)}

      {/* Glasses on top of eyes. Skipped when explicitly hidden. */}
      {!hideGlasses && (
        <g
          fill="rgba(255,255,255,0.18)"
          stroke="#0d266b"
          strokeWidth="2.4"
          strokeLinecap="round"
          filter="url(#skilly-wonky)"
        >
          <ellipse cx="48" cy="60" rx="11"  ry="10.5" transform="rotate(-6 48 60)" />
          <ellipse cx="74" cy="63" rx="9.5" ry="9"    transform="rotate(4 74 63)" />
          <path d="M 59 59 Q 62 56 66 61" fill="none" />
          <path d="M 37 58 Q 32 56 28 55"  fill="none" />
          <path d="M 83.5 62 Q 88 60 91 59" fill="none" />
          <path d="M 43 53 Q 46 50 51 54" stroke="white" strokeWidth="1.4" opacity="0.7" fill="none" />
          <path d="M 69 56 Q 72 53 76 56" stroke="white" strokeWidth="1.2" opacity="0.65" fill="none" />
        </g>
      )}
    </svg>
  );
}

function renderMouth(mouth: SkillyMouth) {
  const strokeProps = {
    stroke: '#0d266b',
    strokeWidth: 2.8,
    fill: 'none',
    strokeLinecap: 'round' as const,
  };
  switch (mouth) {
    case 'smile':
      return <path d="M 52 74 Q 60 83 70 77" {...strokeProps} />;
    case 'sad':
      // Inverted curve — corners up, center dipped.
      return <path d="M 52 80 Q 60 72 70 77" {...strokeProps} />;
    case 'o':
      return <circle cx="60" cy="78" r="3" fill="#0d266b" />;
    case 'thinking':
      return <path d="M 56 76 L 64 76" {...strokeProps} />;
    case 'flat':
      return <path d="M 54 78 L 66 78" {...strokeProps} />;
  }
}
