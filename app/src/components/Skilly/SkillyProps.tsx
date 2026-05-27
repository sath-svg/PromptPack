/**
 * Contextual SVG props that overlay on Skilly's body for each "doing X"
 * state. Each prop sits absolute over the main 120x130 viewBox of
 * SkillyFace so the same coordinate system applies.
 */

export type SkillyContextState =
  | 'default'
  | 'writing'
  | 'painting'
  | 'reading'
  | 'thinking'
  | 'marketplace'
  | 'passedOut';

interface SkillyPropProps {
  state: SkillyContextState;
}

/**
 * Layers a small SVG overlay onto the Skilly body. The overlay shares
 * Skilly's 0–120 / 0–130 viewBox via `position: absolute; inset: 0`.
 *
 * Note on layering: the paintbrush renders BEHIND Skilly (z-index -1)
 * so the handle visually tucks behind the upper-right star arm.
 */
export function SkillyProp({ state }: SkillyPropProps) {
  if (state === 'default' || state === 'passedOut') {
    return null;
  }

  return (
    <svg
      viewBox="0 0 120 130"
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      // `overflow: visible` lets the fedora render above the star tip
      // (negative y in the viewBox) on the marketplace state.
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
        overflow: 'visible',
      }}
    >
      {state === 'writing' && <PaperAndPen />}
      {state === 'painting' && <Paintbrush />}
      {state === 'reading' && <Book />}
      {state === 'marketplace' && <Suit />}
      {state === 'thinking' && <ThoughtCloud />}
    </svg>
  );
}

/* ---------- Thinking: thought cloud w/ pulsing dots ----------
 * Wrapped in a class-tagged group so floating-variant CSS can hide it
 * (the cloud extends outside Skilly's viewBox and would overlap the
 * surrounding UI when the floating mascot lives bottom-left).
 */
function ThoughtCloud() {
  return (
    <g className="skilly__think-cloud">
      {/* Trailing tail bubbles from head up to the cloud */}
      <circle cx="80" cy="20" r="2.5" fill="#ffffff" stroke="#0d266b" strokeWidth="1.2" />
      <circle cx="90" cy="8"  r="4"   fill="#ffffff" stroke="#0d266b" strokeWidth="1.4" />
      {/* Cloud — base ellipse + 5 lobes for proper fluffy silhouette.
          Stroke is rendered ONLY around the outer composite via a
          drawn-twice trick: dark outline ring first (slightly larger
          fills), white fills on top so internal lobe boundaries vanish. */}
      <g>
        {/* Outline layer — same shapes inflated by stroke width */}
        <g fill="#ffffff" stroke="#0d266b" strokeWidth="1.8" strokeLinejoin="round">
          <ellipse cx="105" cy="-4"  rx="26" ry="12" />
          <circle  cx="86"  cy="-6"  r="9" />
          <circle  cx="96"  cy="-13" r="9" />
          <circle  cx="108" cy="-16" r="10" />
          <circle  cx="120" cy="-12" r="8" />
          <circle  cx="125" cy="-3"  r="7" />
        </g>
        {/* White fill layer — covers internal stroke boundaries so the
            cloud reads as one fluffy shape rather than 6 separate blobs. */}
        <g fill="#ffffff" stroke="none">
          <ellipse cx="105" cy="-4"  rx="24" ry="10" />
          <circle  cx="86"  cy="-6"  r="7.5" />
          <circle  cx="96"  cy="-13" r="7.5" />
          <circle  cx="108" cy="-16" r="8.5" />
          <circle  cx="120" cy="-12" r="6.5" />
          <circle  cx="125" cy="-3"  r="5.5" />
        </g>
      </g>
      {/* Three pulsing dots inside the cloud */}
      <circle className="skilly__think-dot skilly__think-dot-1" cx="96"  cy="-4" r="2" fill="#0d266b" />
      <circle className="skilly__think-dot skilly__think-dot-2" cx="105" cy="-4" r="2" fill="#0d266b" />
      <circle className="skilly__think-dot skilly__think-dot-3" cx="114" cy="-4" r="2" fill="#0d266b" />
    </g>
  );
}

/* ---------- Writing: paper rectangle + animated pen ----------
 * Pen tip lands ON the paper at ~(82,102) after the inner -30°
 * rotation, then the outer `.skilly__writing` wiggle animates ±3 px so
 * the tip stays on the page. A faint ink scribble matches the wiggle
 * area so the page shows the writing.
 */
function PaperAndPen() {
  return (
    <g>
      {/* Paper — small rect to lower-right of body. */}
      <rect
        x="68"
        y="92"
        width="26"
        height="20"
        rx="2"
        fill="#ffffff"
        stroke="#0d266b"
        strokeWidth="1.5"
        transform="rotate(-6 81 102)"
      />
      {/* Ruled lines + ink scribble where the pen is "writing". */}
      <g transform="rotate(-6 81 102)">
        <g stroke="#a8b3c9" strokeWidth="0.8" strokeLinecap="round">
          <line x1="71" y1="98"  x2="91" y2="98" />
          <line x1="71" y1="108" x2="86" y2="108" />
        </g>
        {/* Ink scribble on the middle line — looks like Skilly's writing. */}
        <path
          d="M 71 103 q 2 -2 4 0 t 4 0 t 4 0 t 4 0 t 3 0"
          fill="none"
          stroke="#0d266b"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.75"
        />
      </g>
      {/* Pen — positioning translate on the OUTER g (SVG attr), CSS
          animation on the INNER g. CSS `transform` on an SVG element
          replaces its `transform` attribute, so they must live on
          different elements. */}
      <g transform="translate(82 102)">
        <g className="skilly__writing">
          <g transform="rotate(-30)">
            {/* Pen body */}
            <line x1="-2" y1="0" x2="-15" y2="-3" stroke="#0d266b" strokeWidth="2.8" strokeLinecap="round" />
            {/* Pen tip (orange) at origin */}
            <line x1="-2" y1="0" x2="2"   y2="1"  stroke="#ff6b3d" strokeWidth="2.4" strokeLinecap="round" />
            {/* Small dot at tip on paper */}
            <circle cx="2" cy="1" r="0.9" fill="#0d266b" />
          </g>
        </g>
      </g>
    </g>
  );
}

/* ---------- Painting: paintbrush held at Skilly's right "hand" ----------
 * "Right hand" = first arm clockwise from the top tip = upper-right
 * outer star vertex at (106,42). Brush gripped at that point; bristles
 * extend outward (up-right), handle tucks back toward body.
 */
function Paintbrush() {
  return (
    <g transform="translate(106 42) rotate(125)">
      <g className="skilly__brush">
        {/* Handle (long wooden shaft) */}
        <rect x="-4" y="-4" width="34" height="8" rx="3" fill="#8a5a30" stroke="#0d266b" strokeWidth="1.6" />
        {/* Wood grain hint */}
        <line x1="2" y1="-2" x2="26" y2="-2" stroke="#5a3a18" strokeWidth="0.7" opacity="0.6" />
        {/* Ferrule */}
        <rect x="-10" y="-5" width="8" height="10" rx="1.2" fill="#c8cdd6" stroke="#0d266b" strokeWidth="1.6" />
        <line x1="-7" y1="-5" x2="-7" y2="5" stroke="#0d266b" strokeWidth="0.8" opacity="0.6" />
        {/* Bristles */}
        <polygon points="-22,-5 -10,-5 -10,5 -22,5" fill="#2b6bff" stroke="#0d266b" strokeWidth="1.6" />
        <line x1="-22" y1="-3" x2="-12" y2="-3" stroke="#0d266b" strokeWidth="0.5" opacity="0.5" />
        <line x1="-22" y1="0"  x2="-12" y2="0"  stroke="#0d266b" strokeWidth="0.5" opacity="0.5" />
        <line x1="-22" y1="3"  x2="-12" y2="3"  stroke="#0d266b" strokeWidth="0.5" opacity="0.5" />
        {/* Paint drop hint */}
        <circle cx="-24" cy="8" r="2.5" fill="#ff8fb8" opacity="0.9" stroke="#0d266b" strokeWidth="0.8" />
      </g>
    </g>
  );
}

/* ---------- Reading: open book held facing Skilly ----------
 * Pages tilt UP toward Skilly's face (top of the SVG). Spine sits at
 * the bottom; both pages fan up like he's holding the book open in
 * front of his chest. Page-flip animation pivots scaleX around the
 * spine for a horizontal flip.
 */
function Book() {
  return (
    <g transform="translate(28 95)">
      {/* Left page — fans up-left toward Skilly's face. Spine at right edge. */}
      <polygon
        points="22,22 22,4 2,2 0,22"
        fill="#fefcf6"
        stroke="#0d266b"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {/* Right page — fans up-right. Spine at left edge. */}
      <polygon
        points="22,22 22,4 42,2 44,22"
        fill="#f0ebe0"
        stroke="#0d266b"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {/* Spine */}
      <line x1="22" y1="4" x2="22" y2="22" stroke="#0d266b" strokeWidth="1.6" />
      {/* Text lines on left page (slanting up-left). */}
      <g stroke="#a8b3c9" strokeWidth="0.7" strokeLinecap="round">
        <line x1="4"  y1="8"  x2="20" y2="9"  />
        <line x1="4"  y1="12" x2="20" y2="13" />
        <line x1="6"  y1="16" x2="20" y2="17" />
      </g>
      {/* Text lines on right page. */}
      <g stroke="#a8b3c9" strokeWidth="0.7" strokeLinecap="round">
        <line x1="24" y1="9"  x2="40" y2="8"  />
        <line x1="24" y1="13" x2="40" y2="12" />
        <line x1="24" y1="17" x2="38" y2="16" />
      </g>
      {/* Flipping page — starts on the LEFT page, pivots at the spine
          (right edge of left page), flips over to the right.
          Outer g holds the SVG transform attribute (positioning);
          inner g carries the CSS animation so the two don't collide. */}
      <g transform="translate(0 4)">
        <g
          className="skilly__page"
          style={{ transformBox: 'fill-box', transformOrigin: '100% 100%' }}
        >
          <polygon
            points="22,18 22,0 2,-2 0,18"
            fill="#fefcf6"
            stroke="#0d266b"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <line x1="4"  y1="4" x2="20" y2="5"  stroke="#a8b3c9" strokeWidth="0.7" />
          <line x1="4"  y1="8" x2="20" y2="9"  stroke="#a8b3c9" strokeWidth="0.7" />
          <line x1="4" y1="12" x2="18" y2="13" stroke="#a8b3c9" strokeWidth="0.7" />
        </g>
      </g>
    </g>
  );
}

/* ---------- Marketplace: full suit on bottom half of star ----------
 * Dark jacket polygon covers the lower face plate (y >= ~73) with a
 * V-neck cut at the chest. White collar peeks through the V. Short
 * red tie ends mid-chest — no overflow below the body silhouette.
 */
function Suit() {
  return (
    <g>
      {/* Jacket — follows outer star silhouette around both lower-left
          (18,112) and lower-right (98,108) tips. V-neck cut at chest. */}
      <path
        d="M 30 78 L 48 82 L 60 94 L 72 82 L 88 76 L 98 108 L 58 86 L 18 112 Z"
        fill="#1a1d2e"
        stroke="#0d266b"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Left lapel highlight. */}
      <polygon
        points="48,82 60,94 55,90"
        fill="#2a2d3e"
        stroke="#0d266b"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      {/* Right lapel highlight. */}
      <polygon
        points="72,82 60,94 65,90"
        fill="#2a2d3e"
        stroke="#0d266b"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      {/* White shirt collar peeking through V. */}
      <polygon
        points="54,88 60,94 66,88"
        fill="#ffffff"
        stroke="#0d266b"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Red bowtie — replaces long necktie. Two triangles + center knot. */}
      <polygon
        points="52,90 60,94 52,98"
        fill="#c41e3a"
        stroke="#0d266b"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <polygon
        points="68,90 60,94 68,98"
        fill="#c41e3a"
        stroke="#0d266b"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <rect
        x="58"
        y="92"
        width="4"
        height="4"
        rx="0.5"
        fill="#8b1027"
        stroke="#0d266b"
        strokeWidth="0.8"
      />
      {/* Buttons down the jacket. */}
      <circle cx="60" cy="102" r="0.9" fill="#0d266b" />
      <circle cx="60" cy="108" r="0.9" fill="#0d266b" />

      {/* 1950s fedora — brim covers the top star vertex (58,14). */}
      <g>
        {/* Brim — wide ellipse over the tip */}
        <ellipse
          cx="58"
          cy="16"
          rx="24"
          ry="3.8"
          fill="#1a1d2e"
          stroke="#0d266b"
          strokeWidth="1.4"
        />
        {/* Crown */}
        <path
          d="M 44 16 Q 42 0 58 -2 Q 74 0 72 16 Z"
          fill="#2a2d3e"
          stroke="#0d266b"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        {/* Hat band */}
        <rect
          x="44"
          y="13"
          width="28"
          height="3"
          fill="#0d266b"
          stroke="#0d266b"
          strokeWidth="0.6"
        />
        {/* Crown pinch crease */}
        <path
          d="M 58 -2 L 58 8"
          stroke="#0d266b"
          strokeWidth="0.7"
          opacity="0.5"
        />
        {/* Red feather accent */}
        <line
          x1="70"
          y1="13"
          x2="76"
          y2="4"
          stroke="#c41e3a"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </g>
    </g>
  );
}
