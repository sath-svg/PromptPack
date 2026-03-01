import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { comparisonPages, getComparison } from "@/lib/pseo/comparisons";
import { ComparisonTable } from "@/components/pseo/comparison-table";
import { SEOToolCTA } from "@/components/tools/seo-tool-cta";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return comparisonPages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getComparison(slug);
  if (!page) return {};

  return {
    title: `${page.title} - 2026 Comparison | PromptPack`,
    description: page.metaDescription,
    keywords: page.targetKeywords,
    alternates: { canonical: `https://pmtpk.com/compare/${slug}` },
    openGraph: {
      title: page.title,
      description: page.metaDescription,
      url: `https://pmtpk.com/compare/${slug}`,
    },
  };
}

export default async function ComparisonPage({ params }: Props) {
  const { slug } = await params;
  const page = getComparison(slug);
  if (!page) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: page.title,
    description: page.metaDescription,
    url: `https://pmtpk.com/compare/${slug}`,
    publisher: { "@type": "Organization", name: "PromptPack" },
  };

  const ppWins = page.comparisonPoints.filter((p) => p.winner === "promptpack").length;
  const compWins = page.comparisonPoints.filter((p) => p.winner === "competitor").length;
  const ties = page.comparisonPoints.filter((p) => p.winner === "tie").length;

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav style={{ marginBottom: "1.5rem", fontSize: "0.85rem", color: "var(--muted-foreground)" }}>
        <Link href="/compare" style={{ color: "#6366f1", textDecoration: "none" }}>Comparisons</Link>
        <span style={{ margin: "0 0.5rem" }}>/</span>
        <span>{page.title}</span>
      </nav>

      <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.75rem" }}>
        {page.title}
      </h1>

      {/* Score summary */}
      <div
        style={{
          display: "flex",
          gap: "1.5rem",
          marginBottom: "2rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "#6366f1" }}>{ppWins}</span>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--muted-foreground)" }}>PromptPack wins</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--muted-foreground)" }}>{ties}</span>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--muted-foreground)" }}>Tied</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--muted-foreground)" }}>{compWins}</span>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--muted-foreground)" }}>{page.competitorName} wins</p>
        </div>
      </div>

      {/* About the competitor */}
      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "0.5rem" }}>
          What is {page.competitorName}?
        </h2>
        <p style={{ color: "var(--muted-foreground)", lineHeight: 1.7, margin: 0 }}>
          {page.competitorDescription}
        </p>
      </section>

      {/* Comparison table */}
      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "1rem" }}>
          Feature Comparison
        </h2>
        <ComparisonTable points={page.comparisonPoints} competitorName={page.competitorName} />
      </section>

      {/* Verdict */}
      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "0.5rem" }}>
          Our Take
        </h2>
        <p style={{ color: "var(--muted-foreground)", lineHeight: 1.7, margin: 0 }}>
          {page.verdict}
        </p>
      </section>

      {/* CTAs */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <Link href="/downloads" className="btn btn-primary" style={{ padding: "0.6rem 1.5rem" }}>
          Try PromptPack Free
        </Link>
        <Link href="/pricing" className="btn btn-secondary" style={{ padding: "0.6rem 1.5rem" }}>
          See Pricing
        </Link>
      </div>

      <SEOToolCTA variant="tools" />
    </main>
  );
}
