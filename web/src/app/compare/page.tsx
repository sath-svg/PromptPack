import type { Metadata } from "next";
import Link from "next/link";
import { comparisonPages } from "@/lib/pseo/comparisons";

export const metadata: Metadata = {
  title: "PromptPack Comparisons - How We Stack Up | PromptPack",
  description:
    "See how PromptPack compares to other prompt management tools like AIPRM, PromptPerfect, and FlowGPT. Feature-by-feature comparisons.",
  keywords: [
    "PromptPack alternatives",
    "prompt tool comparison",
    "AIPRM alternative",
    "PromptPerfect alternative",
  ],
  alternates: { canonical: "https://pmtpk.com/compare" },
};

export default function ComparePage() {
  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        PromptPack Comparisons
      </h1>
      <p style={{ color: "var(--muted-foreground)", marginBottom: "2.5rem", fontSize: "1.05rem", lineHeight: 1.6 }}>
        See how PromptPack compares to other prompt management tools. We break down features,
        pricing, and platform support so you can choose the right tool.
      </p>

      <div style={{ display: "grid", gap: "1rem" }}>
        {comparisonPages.map((page) => (
          <Link
            key={page.slug}
            href={`/compare/${page.slug}`}
            className="pseo-card-link"
          >
            <h2 style={{ margin: "0 0 0.35rem", fontSize: "1.1rem", fontWeight: 600 }}>
              {page.title}
            </h2>
            <p style={{ margin: 0, color: "var(--muted-foreground)", fontSize: "0.9rem", lineHeight: 1.5 }}>
              {page.metaDescription}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
