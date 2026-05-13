export function LogoConstruction() {
  return (
    <div className="relative aspect-[4/3] w-full bg-[#0a0a0c]">
      <svg
        viewBox="0 0 480 360"
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="brand-grid"
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 24 0 L 0 0 0 24"
              fill="none"
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="0.5"
            />
          </pattern>
          <linearGradient id="brand-blue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>

        <rect width="480" height="360" fill="url(#brand-grid)" />

        {/* Construction axes */}
        <line
          x1="240"
          y1="0"
          x2="240"
          y2="360"
          stroke="rgba(123,167,255,0.25)"
          strokeDasharray="2 4"
          strokeWidth="1"
        />
        <line
          x1="0"
          y1="180"
          x2="480"
          y2="180"
          stroke="rgba(123,167,255,0.25)"
          strokeDasharray="2 4"
          strokeWidth="1"
        />

        {/* Bounding square */}
        <rect
          x="140"
          y="80"
          width="200"
          height="200"
          rx="44"
          fill="url(#brand-blue)"
        />

        {/* Three stacked lozenges (signature mark) */}
        <g transform="translate(240 180)">
          <path
            d="M 0 -56 L 56 0 L 0 56 L -56 0 Z"
            fill="rgba(255,255,255,0.18)"
          />
          <path
            d="M 0 -36 L 56 20 L 0 76 L -56 20 Z"
            fill="rgba(255,255,255,0.42)"
          />
          <path
            d="M 0 -16 L 56 40 L 0 96 L -56 40 Z"
            fill="#ffffff"
          />
        </g>

        {/* Dimension labels */}
        <g
          fill="#7BA7FF"
          fontSize="9"
          fontFamily="var(--font-geist-mono), monospace"
          letterSpacing="0.1em"
        >
          <text x="140" y="72">A</text>
          <text x="336" y="72">A</text>
          <text x="132" y="76" textAnchor="end">A</text>
          <text x="132" y="284" textAnchor="end">A</text>

          <text x="50" y="184" fill="rgba(123,167,255,0.5)">0.5R</text>
          <text x="412" y="184" fill="rgba(123,167,255,0.5)">0.5R</text>
        </g>

        {/* Tick marks on axes */}
        <g stroke="rgba(123,167,255,0.4)" strokeWidth="1">
          <line x1="140" y1="76" x2="140" y2="84" />
          <line x1="340" y1="76" x2="340" y2="84" />
          <line x1="136" y1="80" x2="144" y2="80" />
          <line x1="136" y1="280" x2="144" y2="280" />
        </g>

        {/* Crosshair callouts */}
        <g fill="none" stroke="#7BA7FF" strokeWidth="0.75">
          <circle cx="240" cy="124" r="3" />
          <line x1="240" y1="127" x2="240" y2="148" />
          <circle cx="240" cy="236" r="3" />
          <line x1="240" y1="220" x2="240" y2="233" />
        </g>

        <g
          fill="#7BA7FF"
          fontSize="8"
          fontFamily="var(--font-geist-mono), monospace"
          letterSpacing="0.14em"
        >
          <text x="250" y="118">APEX</text>
          <text x="250" y="245">BASE</text>
        </g>
      </svg>
    </div>
  );
}
