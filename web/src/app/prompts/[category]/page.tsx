import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { promptCategories, getCategory } from "@/lib/pseo/prompts";
import { TemplateCard } from "@/components/pseo/template-card";
import { CategoryCard } from "@/components/pseo/category-card";
import { SEOToolCTA } from "@/components/tools/seo-tool-cta";

interface Props {
  params: Promise<{ category: string }>;
}

export async function generateStaticParams() {
  return promptCategories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getCategory(slug);
  if (!category) return {};

  return {
    title: `${category.templates.length} Free ${category.title} for ChatGPT, Claude & Gemini (2026) | PromptPack`,
    description: category.description,
    keywords: category.keywords,
    alternates: { canonical: `https://pmtpk.com/prompts/${slug}` },
    openGraph: {
      title: `${category.title} | PromptPack`,
      description: category.description,
      url: `https://pmtpk.com/prompts/${slug}`,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category: slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const relatedCategories = category.relatedCategories
    .map((s) => getCategory(s))
    .filter((c): c is NonNullable<typeof c> => c !== undefined);

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.title,
    description: category.description,
    url: `https://pmtpk.com/prompts/${slug}`,
    publisher: {
      "@type": "Organization",
      name: "PromptPack",
      url: "https://pmtpk.com",
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: category.templates.length,
      itemListElement: category.templates.map((t, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: t.title,
        url: `https://pmtpk.com/prompts/${slug}/${t.slug}`,
      })),
    },
  };

  const faqJsonLd = category.faqs?.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: category.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      }
    : null;

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      <nav style={{ marginBottom: "1.5rem", fontSize: "0.85rem", color: "var(--muted-foreground)" }}>
        <Link href="/prompts" style={{ color: "#6366f1", textDecoration: "none" }}>Prompts</Link>
        <span style={{ margin: "0 0.5rem" }}>/</span>
        <span>{category.title}</span>
      </nav>

      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          <span style={{ marginRight: "0.5rem" }}>{category.icon}</span>
          {category.title}
        </h1>
        <p style={{ color: "var(--muted-foreground)", fontSize: "1.05rem", lineHeight: 1.6, margin: 0 }}>
          {category.longDescription}
        </p>
      </div>

      <h2 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "1rem" }}>
        {category.templates.length} Templates
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(300px, 100%), 1fr))",
          gap: "1rem",
          marginBottom: "3rem",
        }}
      >
        {category.templates.map((template) => (
          <TemplateCard key={template.slug} template={template} />
        ))}
      </div>

      {relatedCategories.length > 0 && (
        <section style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "1rem" }}>
            Related Categories
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(240px, 100%), 1fr))",
              gap: "1rem",
            }}
          >
            {relatedCategories.map((rc) => (
              <CategoryCard key={rc.slug} category={rc} />
            ))}
          </div>
        </section>
      )}

      {/* FAQ section */}
      {category.faqs && category.faqs.length > 0 && (
        <section style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "1rem" }}>
            Frequently Asked Questions
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {category.faqs.map((faq, i) => (
              <details
                key={i}
                style={{
                  padding: "1rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border, #27272a)",
                  backgroundColor: "var(--card, #18181b)",
                }}
              >
                <summary
                  style={{
                    fontWeight: 600,
                    fontSize: "0.95rem",
                    cursor: "pointer",
                    listStyle: "none",
                  }}
                >
                  {faq.question}
                </summary>
                <p
                  style={{
                    margin: "0.75rem 0 0",
                    color: "var(--muted-foreground)",
                    lineHeight: 1.6,
                    fontSize: "0.9rem",
                  }}
                >
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      )}

      <SEOToolCTA variant="tools" />
    </main>
  );
}
