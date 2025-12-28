export const runtime = "edge";

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
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
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
