"use client";

import { FreeCard } from "./free-card";
import { ProCard } from "./pro-card";
import { StudioCard } from "./studio-card";

export default function PricingPage() {
  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", textAlign: "center" }}>
      <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
        Choose a plan that fits your needs.
      </h1>
      <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>
        Start free, upgrade for creative access.
      </p>

      <span
        style={{
          display: "inline-block",
          background: "linear-gradient(135deg, #f59e0b, #ef4444)",
          color: "white",
          padding: "0.4rem 1rem",
          borderRadius: "999px",
          fontSize: "0.85rem",
          fontWeight: "700",
          letterSpacing: "0.02em",
          marginBottom: "2.5rem",
          animation: "pulse-glow 2s ease-in-out infinite",
        }}
      >
        Only 9 spots left at $1.99/mo!
      </span>
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 8px rgba(245, 158, 11, 0.4); }
          50% { box-shadow: 0 0 20px rgba(245, 158, 11, 0.7); }
        }
      `}</style>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))",
          gap: "1.5rem",
          maxWidth: "960px",
          margin: "0 auto",
        }}
      >
        <FreeCard />
        <ProCard />
        <StudioCard />
      </div>
    </div>
  );
}
