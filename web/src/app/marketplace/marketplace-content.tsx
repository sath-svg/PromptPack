"use client";

import { useState } from "react";
import { PresetBoard } from "./presets/preset-board";

type Tab = "presets" | "flows";

export function MarketplaceContent() {
  const [activeTab, setActiveTab] = useState<Tab>("presets");

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Marketplace</h1>
      <p style={{ color: "var(--muted-foreground)", marginBottom: "1.5rem" }}>
        Discover prompt presets and prompt flows from the community
      </p>

      {/* Tab bar */}
      <div className="marketplace-tabs">
        <button
          className={`marketplace-tab ${activeTab === "presets" ? "marketplace-tab--active" : ""}`}
          onClick={() => setActiveTab("presets")}
        >
          Prompt Presets
        </button>
        <button
          className={`marketplace-tab ${activeTab === "flows" ? "marketplace-tab--active" : ""}`}
          onClick={() => setActiveTab("flows")}
        >
          Prompt Flows
        </button>
      </div>

      {/* Tab content */}
      {activeTab === "presets" ? (
        <PresetBoard />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 1fr))",
            gap: "1.5rem",
          }}
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              style={{
                padding: "1.5rem",
                borderRadius: "0.75rem",
                border: "1px solid rgba(128,128,128,0.2)",
                background: "rgba(128,128,128,0.05)",
              }}
            >
              <h3 style={{ marginBottom: "0.5rem" }}>Coming Soon</h3>
              <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>
                Prompt flows will appear here once the marketplace launches.
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
