import type { Metadata } from "next";
import Link from "next/link";
import { promptCategories } from "@/lib/pseo/prompts";
import { platformPages } from "@/lib/pseo/platforms";
import { rolePages } from "@/lib/pseo/roles";
import { CategoryCard } from "@/components/pseo/category-card";
import { SkillsetShell } from "@/components/skillset-shell";
import { SkillsetPageHeader } from "@/components/skillset-page-header";
import { SkillsetCta } from "@/components/skillset-cta";

export const metadata: Metadata = {
  title: "AI Prompt Templates - Free Prompts for ChatGPT, Claude & Gemini | Skillset",
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
  alternates: { canonical: "https://skillset.so/prompts" },
};

export default function PromptsIndexPage() {
  const totalTemplates = promptCategories.reduce(
    (sum, c) => sum + c.templates.length,
    0,
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "AI Prompt Templates",
    description: `${totalTemplates} free AI prompt templates across ${promptCategories.length} categories.`,
    url: "https://skillset.so/prompts",
    publisher: {
      "@type": "Organization",
      name: "Skillset",
      url: "https://skillset.so",
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: promptCategories.length,
      itemListElement: promptCategories.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: c.title,
        url: `https://skillset.so/prompts/${c.slug}`,
      })),
    },
  };

  return (
    <SkillsetShell showHalo>
      <main className="relative mx-auto max-w-[1100px] px-6 py-20 md:py-28">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <SkillsetPageHeader
          eyebrow="Library"
          title="AI prompt templates."
          description={`${totalTemplates} ready-to-use prompts across ${promptCategories.length} categories. Copy any template and paste it into ChatGPT, Claude, Gemini, or any AI assistant.`}
          align="left"
        />

        <section className="mb-14">
          <h2
            className="mb-4 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            Browse by platform
          </h2>
          <div className="flex flex-wrap gap-2">
            {platformPages.map((p) => (
              <Link
                key={p.slug}
                href={`/prompts/for/${p.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.02] px-3.5 py-1.5 text-[13px] text-zinc-300 transition-all hover:border-white/20 hover:bg-white/[0.05]"
              >
                <span>{p.icon}</span>
                {p.name}
              </Link>
            ))}
          </div>
        </section>

        <section className="mb-14">
          <h2
            className="mb-4 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            Browse by role
          </h2>
          <div className="flex flex-wrap gap-2">
            {rolePages.map((r) => (
              <Link
                key={r.slug}
                href={`/prompts/for/${r.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.02] px-3.5 py-1.5 text-[13px] text-zinc-300 transition-all hover:border-white/20 hover:bg-white/[0.05]"
              >
                <span>{r.icon}</span>
                {r.role}
              </Link>
            ))}
          </div>
        </section>

        <h2
          className="mb-6 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
          style={{ fontFamily: "var(--font-geist-mono), monospace" }}
        >
          All categories
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {promptCategories.map((category) => (
            <CategoryCard key={category.slug} category={category} />
          ))}
        </div>

        <SkillsetCta
          eyebrow="Get Skillset"
          title="Save these as reusable skills."
          body="Capture the prompts you keep coming back to and run them across every AI tool — without copy-paste."
        />
      </main>
    </SkillsetShell>
  );
}
