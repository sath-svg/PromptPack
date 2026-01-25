import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PromptPack Marketplace - Discover & Share AI Prompts",
  description: "Browse and discover curated AI prompt packs from the community. Find prompts for ChatGPT, Claude, and Gemini to boost your productivity.",
  alternates: {
    canonical: "https://pmtpk.com/marketplace",
  },
  openGraph: {
    title: "PromptPack Marketplace - Discover & Share AI Prompts",
    description: "Browse and discover curated AI prompt packs from the community. Find prompts for ChatGPT, Claude, and Gemini.",
    url: "https://pmtpk.com/marketplace",
  },
};

export default function MarketplacePage() {
  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Marketplace</h1>
      <p style={{ color: "var(--muted)", marginBottom: "2rem" }}>
        Discover prompt packs created by the community
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 1fr))",
          gap: "1.5rem",
        }}
      >
        {/* Placeholder packs */}
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
            <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
              Prompt packs will appear here once the marketplace launches.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
