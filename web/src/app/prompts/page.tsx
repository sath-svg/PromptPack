import type { Metadata } from "next";
import Link from "next/link";
import { promptCategories } from "@/lib/pseo/prompts";
import { platformPages } from "@/lib/pseo/platforms";
import { rolePages } from "@/lib/pseo/roles";
import { CategoryCard } from "@/components/pseo/category-card";
import { SEOToolCTA } from "@/components/tools/seo-tool-cta";

export const metadata: Metadata = {
  title: "AI Prompt Templates - Free Prompts for ChatGPT, Claude & Gemini | PromptPack",
  description:
    "Browse 250+ free AI prompt templates for marketing, coding, SEO, email, writing, sales, legal, and more. Copy-paste ready prompts for ChatGPT, Claude, and Gemini.",
  keywords: [
    "AI prompt templates",
    "ChatGPT prompts",
    "Claude prompts",
    "Gemini prompts",
    "prompt library",
    "free prompts",
    "prompt engineering templates",
    "AI prompts",
  ],
  alternates: { canonical: "https://pmtpk.com/prompts" },
};

export default function PromptsIndexPage() {
  const totalTemplates = promptCategories.reduce((sum, c) => sum + c.templates.length, 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "AI Prompt Templates",
    description: `${totalTemplates} free AI prompt templates across ${promptCategories.length} categories.`,
    url: "https://pmtpk.com/prompts",
    publisher: {
      "@type": "Organization",
      name: "PromptPack",
      url: "https://pmtpk.com",
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: promptCategories.length,
      itemListElement: promptCategories.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: c.title,
        url: `https://pmtpk.com/prompts/${c.slug}`,
      })),
    },
  };

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        AI Prompt Templates
      </h1>
      <p style={{ color: "var(--muted-foreground)", marginBottom: "2.5rem", fontSize: "1.05rem", lineHeight: 1.6 }}>
        {totalTemplates} ready-to-use prompt templates across {promptCategories.length} categories.
        Copy any template and paste it into ChatGPT, Claude, Gemini, or any AI assistant.
      </p>

      {/* Browse by Platform */}
      <section style={{ marginBottom: "2.5rem" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "0.75rem" }}>
          Browse by Platform
        </h2>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {platformPages.map((p) => (
            <Link
              key={p.slug}
              href={`/prompts/for/${p.slug}`}
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: "6px",
                border: "1px solid var(--border, #27272a)",
                fontSize: "0.85rem",
                color: "var(--foreground)",
                textDecoration: "none",
              }}
            >
              {p.icon} {p.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Browse by Role */}
      <section style={{ marginBottom: "2.5rem" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "0.75rem" }}>
          Browse by Role
        </h2>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {rolePages.map((r) => (
            <Link
              key={r.slug}
              href={`/prompts/for/${r.slug}`}
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: "6px",
                border: "1px solid var(--border, #27272a)",
                fontSize: "0.85rem",
                color: "var(--foreground)",
                textDecoration: "none",
              }}
            >
              {r.icon} {r.role}
            </Link>
          ))}
        </div>
      </section>

      {/* Browse by Category */}
      <h2 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "1rem" }}>
        All Categories
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(260px, 100%), 1fr))",
          gap: "1rem",
        }}
      >
        {promptCategories.map((category) => (
          <CategoryCard key={category.slug} category={category} />
        ))}
      </div>

      <SEOToolCTA variant="tools" />
    </main>
  );
}
