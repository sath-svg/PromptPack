"use client";

import { useState } from "react";
import Link from "next/link";

export function EvalUpgradeCTA() {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        className="btn btn-icon btn-small"
        style={{ opacity: 0.4, cursor: "pointer" }}
        onClick={() => setShowTooltip((prev) => !prev)}
        title="Evaluation trials used"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 3v18h18" />
          <path d="m19 9-5 5-4-4-3 3" />
        </svg>
      </button>

      {showTooltip && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            right: 0,
            width: "220px",
            padding: "0.75rem",
            background: "var(--card, #1a1a2e)",
            border: "1px solid rgba(128,128,128,0.3)",
            borderRadius: "0.5rem",
            boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
            zIndex: 100,
            fontSize: "0.8rem",
            lineHeight: 1.4,
          }}
        >
          <p style={{ margin: "0 0 0.5rem", fontWeight: 600 }}>
            Free evaluations used up
          </p>
          <p style={{ margin: "0 0 0.75rem", color: "var(--muted)" }}>
            Pro users get unlimited evaluations across 7 AI platforms.
          </p>
          <Link href="/pricing">
            <button
              className="btn btn-primary btn-sm"
              style={{ width: "100%", fontSize: "0.8rem" }}
            >
              Start 3-day free trial
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
