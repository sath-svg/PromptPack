import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { promptCategories } from "@/lib/pseo/prompts";
import { platformPages, getPlatformPage } from "@/lib/pseo/platforms";
import { rolePages, getRolePage } from "@/lib/pseo/roles";
import { TemplateCard } from "@/components/pseo/template-card";
import { CategoryCard } from "@/components/pseo/category-card";
import { SEOToolCTA } from "@/components/tools/seo-tool-cta";
import type { PromptTemplate } from "@/lib/pseo/types";

interface Props {
  params: Promise<{ slug: string }>;
}

function getAllSlugs() {
  return [
    ...platformPages.map((p) => p.slug),
    ...rolePages.map((r) => r.slug),
  ];
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

function getTemplatesForPlatform(platformSlug: string): PromptTemplate[] {
  return promptCategories.flatMap((c) =>
    c.templates.filter((t) => t.platforms.includes(platformSlug as any))
  );
}

function getTemplatesForRole(role: {
  relevantCategories: string[];
  relevantTags: string[];
}): PromptTemplate[] {
  const categoryTemplates = promptCategories
    .filter((c) => role.relevantCategories.includes(c.slug))
    .flatMap((c) => c.templates);

  const tagTemplates = promptCategories
    .flatMap((c) => c.templates)
    .filter(
      (t) =>
        t.tags.some((tag) =>
          role.relevantTags.some(
            (rt) => tag.toLowerCase().includes(rt.toLowerCase()) || rt.toLowerCase().includes(tag.toLowerCase())
          )
        ) && !categoryTemplates.includes(t)
    );

  return [...categoryTemplates, ...tagTemplates];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const platform = getPlatformPage(slug);
  if (platform) {
    return {
      title: `${platform.title} | PromptPack`,
      description: platform.description,
      keywords: platform.keywords,
      alternates: { canonical: `https://pmtpk.com/prompts/for/${slug}` },
      openGraph: {
        title: platform.title,
        description: platform.description,
        url: `https://pmtpk.com/prompts/for/${slug}`,
      },
    };
  }

  const role = getRolePage(slug);
  if (role) {
    return {
      title: `${role.title} | PromptPack`,
      description: role.description,
      keywords: role.keywords,
      alternates: { canonical: `https://pmtpk.com/prompts/for/${slug}` },
      openGraph: {
        title: role.title,
        description: role.description,
        url: `https://pmtpk.com/prompts/for/${slug}`,
      },
    };
  }

  return {};
}

export default async function ForSlugPage({ params }: Props) {
  const { slug } = await params;

  const platform = getPlatformPage(slug);
  const role = getRolePage(slug);

  if (!platform && !role) notFound();

  const isPlatform = !!platform;
  const pageData = platform || role!;
  const templates = isPlatform
    ? getTemplatesForPlatform(slug)
    : getTemplatesForRole(role!);

  // Get relevant categories for cross-linking
  const relevantCategorySlugs = isPlatform
    ? [...new Set(templates.map((t) => t.category))]
    : role!.relevantCategories;
  const relevantCategories = promptCategories.filter((c) =>
    relevantCategorySlugs.includes(c.slug)
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: pageData.title,
    description: pageData.description,
    url: `https://pmtpk.com/prompts/for/${slug}`,
    publisher: {
      "@type": "Organization",
      name: "PromptPack",
      url: "https://pmtpk.com",
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: templates.length,
      itemListElement: templates.slice(0, 20).map((t, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: t.title,
        url: `https://pmtpk.com/prompts/${t.category}/${t.slug}`,
      })),
    },
  };

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav
        style={{
          marginBottom: "1.5rem",
          fontSize: "0.85rem",
          color: "var(--muted-foreground)",
        }}
      >
        <Link
          href="/prompts"
          style={{ color: "#6366f1", textDecoration: "none" }}
        >
          Prompts
        </Link>
        <span style={{ margin: "0 0.5rem" }}>/</span>
        <span>
          {isPlatform ? platform!.name : `For ${role!.role}`}
        </span>
      </nav>

      <h1
        style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}
      >
        <span style={{ marginRight: "0.5rem" }}>{pageData.icon}</span>
        {isPlatform
          ? `Best ${platform!.name} Prompts`
          : `AI Prompts for ${role!.role}`}
      </h1>
      <p
        style={{
          color: "var(--muted-foreground)",
          marginBottom: "1rem",
          fontSize: "1.05rem",
          lineHeight: 1.6,
        }}
      >
        {pageData.longDescription}
      </p>
      <p
        style={{
          color: "var(--muted-foreground)",
          marginBottom: "2.5rem",
          fontSize: "0.95rem",
        }}
      >
        {templates.length} free prompt templates available. Copy any template
        and start using it immediately.
      </p>

      {/* Templates grid */}
      <h2
        style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "1rem" }}
      >
        {templates.length} Prompt Templates
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fill, minmax(min(300px, 100%), 1fr))",
          gap: "1rem",
          marginBottom: "3rem",
        }}
      >
        {templates.map((template) => (
          <TemplateCard key={`${template.category}-${template.slug}`} template={template} />
        ))}
      </div>

      {/* Related categories */}
      {relevantCategories.length > 0 && (
        <section style={{ marginBottom: "2rem" }}>
          <h2
            style={{
              fontSize: "1.2rem",
              fontWeight: 600,
              marginBottom: "1rem",
            }}
          >
            Browse by Category
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(min(240px, 100%), 1fr))",
              gap: "1rem",
            }}
          >
            {relevantCategories.map((rc) => (
              <CategoryCard key={rc.slug} category={rc} />
            ))}
          </div>
        </section>
      )}

      {/* Cross-link to other views */}
      {isPlatform && (
        <section style={{ marginBottom: "2rem" }}>
          <h2
            style={{
              fontSize: "1.2rem",
              fontWeight: 600,
              marginBottom: "1rem",
            }}
          >
            Browse by Role
          </h2>
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              flexWrap: "wrap",
            }}
          >
            {rolePages.slice(0, 12).map((r) => (
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
      )}

      {!isPlatform && (
        <section style={{ marginBottom: "2rem" }}>
          <h2
            style={{
              fontSize: "1.2rem",
              fontWeight: 600,
              marginBottom: "1rem",
            }}
          >
            Browse by Platform
          </h2>
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              flexWrap: "wrap",
            }}
          >
            {platformPages.slice(0, 8).map((p) => (
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
      )}

      <SEOToolCTA variant="extension" />
    </main>
  );
}
