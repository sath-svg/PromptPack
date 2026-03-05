import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { promptCategories, getCategory, getTemplate, getRelatedTemplates } from "@/lib/pseo/prompts";
import { platformPages } from "@/lib/pseo/platforms";
import { TemplateCard } from "@/components/pseo/template-card";
import { CopyPromptButton } from "./copy-button";
import { SEOToolCTA } from "@/components/tools/seo-tool-cta";

interface Props {
  params: Promise<{ category: string; template: string }>;
}

export async function generateStaticParams() {
  return promptCategories.flatMap((c) =>
    c.templates.map((t) => ({ category: c.slug, template: t.slug }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: catSlug, template: tplSlug } = await params;
  const template = getTemplate(catSlug, tplSlug);
  if (!template) return {};

  return {
    title: `${template.title} - Copy & Paste Prompt for ChatGPT & Claude | PromptPack`,
    description: template.description,
    keywords: template.targetKeywords,
    alternates: { canonical: `https://pmtpk.com/prompts/${catSlug}/${tplSlug}` },
    openGraph: {
      title: `${template.title} | PromptPack`,
      description: template.description,
      url: `https://pmtpk.com/prompts/${catSlug}/${tplSlug}`,
    },
  };
}

export default async function TemplatePage({ params }: Props) {
  const { category: catSlug, template: tplSlug } = await params;
  const template = getTemplate(catSlug, tplSlug);
  if (!template) notFound();

  const category = getCategory(catSlug);
  const related = getRelatedTemplates(template);

  const difficultyColor: Record<string, string> = {
    beginner: "#22c55e",
    intermediate: "#eab308",
    advanced: "#ef4444",
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: template.title,
    description: template.description,
    step: [
      { "@type": "HowToStep", text: "Copy the prompt template below" },
      { "@type": "HowToStep", text: "Paste it into ChatGPT, Claude, or Gemini" },
      { "@type": "HowToStep", text: "Replace the [brackets] with your specific details" },
    ],
  };

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav style={{ marginBottom: "1.5rem", fontSize: "0.85rem", color: "var(--muted-foreground)" }}>
        <Link href="/prompts" style={{ color: "#6366f1", textDecoration: "none" }}>Prompts</Link>
        <span style={{ margin: "0 0.5rem" }}>/</span>
        <Link href={`/prompts/${catSlug}`} style={{ color: "#6366f1", textDecoration: "none" }}>
          {category?.title}
        </Link>
        <span style={{ margin: "0 0.5rem" }}>/</span>
        <span>{template.title}</span>
      </nav>

      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        {template.title}
      </h1>
      <p style={{ color: "var(--muted-foreground)", marginBottom: "1.5rem", fontSize: "1.05rem", lineHeight: 1.6 }}>
        {template.description}
      </p>

      {/* Metadata badges */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        <span
          style={{
            fontSize: "0.75rem",
            padding: "0.2rem 0.5rem",
            borderRadius: "4px",
            backgroundColor: `${difficultyColor[template.difficulty]}20`,
            color: difficultyColor[template.difficulty],
            textTransform: "capitalize",
          }}
        >
          {template.difficulty}
        </span>
        {template.platforms.map((p) => (
          <span
            key={p}
            style={{
              fontSize: "0.75rem",
              padding: "0.2rem 0.5rem",
              borderRadius: "4px",
              backgroundColor: "rgba(99, 102, 241, 0.1)",
              color: "#818cf8",
              textTransform: "capitalize",
            }}
          >
            {p}
          </span>
        ))}
        {template.tags.map((tag) => (
          <span
            key={tag}
            style={{
              fontSize: "0.75rem",
              padding: "0.2rem 0.5rem",
              borderRadius: "4px",
              backgroundColor: "rgba(255,255,255,0.06)",
              color: "var(--muted-foreground)",
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Use case */}
      <section style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.35rem" }}>When to use this</h2>
        <p style={{ margin: 0, color: "var(--muted-foreground)", lineHeight: 1.6 }}>{template.useCase}</p>
      </section>

      {/* Prompt text */}
      <section style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: 0 }}>Prompt Template</h2>
          <CopyPromptButton prompt={template.prompt} />
        </div>
        <div
          style={{
            padding: "1.25rem",
            borderRadius: "8px",
            border: "1px solid var(--border, #27272a)",
            backgroundColor: "rgba(0,0,0,0.3)",
            whiteSpace: "pre-wrap",
            fontFamily: "monospace",
            fontSize: "0.85rem",
            lineHeight: 1.7,
            color: "var(--foreground, #ededed)",
            overflowX: "auto",
          }}
        >
          {template.prompt}
        </div>
      </section>

      {/* Example input/output */}
      {template.exampleInput && (
        <section style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.5rem" }}>Example</h2>
          <div
            style={{
              padding: "1rem",
              borderRadius: "8px",
              border: "1px solid var(--border, #27272a)",
              backgroundColor: "var(--card, #18181b)",
            }}
          >
            <h3 style={{ fontSize: "0.9rem", fontWeight: 600, margin: "0 0 0.35rem", color: "#818cf8" }}>Input</h3>
            <p style={{ margin: "0 0 1rem", fontSize: "0.85rem", lineHeight: 1.6, color: "var(--muted-foreground)" }}>
              {template.exampleInput}
            </p>
            {template.exampleOutput && (
              <>
                <h3 style={{ fontSize: "0.9rem", fontWeight: 600, margin: "0 0 0.35rem", color: "#22c55e" }}>Output</h3>
                <p style={{ margin: 0, fontSize: "0.85rem", lineHeight: 1.6, color: "var(--muted-foreground)" }}>
                  {template.exampleOutput}
                </p>
              </>
            )}
          </div>
        </section>
      )}

      {/* Action links */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "2rem" }}>
        <Link
          href={`/tools/prompt-enhancer`}
          className="btn btn-primary"
          style={{ padding: "0.5rem 1.25rem", fontSize: "0.9rem" }}
        >
          Enhance This Prompt
        </Link>
        <Link
          href={`/tools/prompt-evaluator`}
          className="btn btn-secondary"
          style={{ padding: "0.5rem 1.25rem", fontSize: "0.9rem" }}
        >
          Evaluate This Prompt
        </Link>
      </div>

      {/* Platform links */}
      <section style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.5rem" }}>Use this prompt with</h2>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {template.platforms.map((p) => {
            const platform = platformPages.find((pp) => pp.slug === p);
            return platform ? (
              <Link
                key={p}
                href={`/prompts/for/${p}`}
                style={{
                  padding: "0.35rem 0.7rem",
                  borderRadius: "6px",
                  border: "1px solid var(--border, #27272a)",
                  fontSize: "0.8rem",
                  color: "#818cf8",
                  textDecoration: "none",
                }}
              >
                {platform.icon} {platform.name}
              </Link>
            ) : (
              <span
                key={p}
                style={{
                  padding: "0.35rem 0.7rem",
                  borderRadius: "6px",
                  border: "1px solid var(--border, #27272a)",
                  fontSize: "0.8rem",
                  color: "var(--muted-foreground)",
                  textTransform: "capitalize",
                }}
              >
                {p}
              </span>
            );
          })}
        </div>
      </section>

      {/* Related templates */}
      {related.length > 0 && (
        <section style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "1rem" }}>Related Templates</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(260px, 100%), 1fr))",
              gap: "1rem",
            }}
          >
            {related.map((rt) => (
              <TemplateCard key={rt.slug} template={rt} />
            ))}
          </div>
        </section>
      )}

      <SEOToolCTA variant="extension" />
    </main>
  );
}
