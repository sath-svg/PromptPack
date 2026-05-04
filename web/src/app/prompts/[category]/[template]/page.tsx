import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  promptCategories,
  getCategory,
  getTemplate,
  getRelatedTemplates,
} from "@/lib/pseo/prompts";
import { platformPages } from "@/lib/pseo/platforms";
import { TemplateCard } from "@/components/pseo/template-card";
import { CopyPromptButton } from "./copy-button";
import { SkillsetShell } from "@/components/skillset-shell";
import { SkillsetCta } from "@/components/skillset-cta";

interface Props {
  params: Promise<{ category: string; template: string }>;
}

export async function generateStaticParams() {
  return promptCategories.flatMap((c) =>
    c.templates.map((t) => ({ category: c.slug, template: t.slug })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: catSlug, template: tplSlug } = await params;
  const template = getTemplate(catSlug, tplSlug);
  if (!template) return {};

  return {
    title: `${template.title} - Copy & Paste Prompt for ChatGPT & Claude | Skillset`,
    description: template.description,
    keywords: template.targetKeywords,
    alternates: { canonical: `https://skillset.so/prompts/${catSlug}/${tplSlug}` },
    openGraph: {
      title: `${template.title} | Skillset`,
      description: template.description,
      url: `https://skillset.so/prompts/${catSlug}/${tplSlug}`,
    },
  };
}

const difficultyClass: Record<string, string> = {
  beginner: "bg-emerald-400/10 border-emerald-400/20 text-emerald-400",
  intermediate: "bg-amber-400/10 border-amber-400/20 text-amber-400",
  advanced: "bg-red-400/10 border-red-400/20 text-red-400",
};

export default async function TemplatePage({ params }: Props) {
  const { category: catSlug, template: tplSlug } = await params;
  const template = getTemplate(catSlug, tplSlug);
  if (!template) notFound();

  const category = getCategory(catSlug);
  const related = getRelatedTemplates(template);

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
    <SkillsetShell showHalo>
      <main className="relative mx-auto max-w-[860px] px-6 py-20 md:py-24">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <nav
          className="mb-8 text-[12px] uppercase tracking-[0.18em] text-zinc-500"
          style={{ fontFamily: "var(--font-geist-mono), monospace" }}
        >
          <Link href="/prompts" className="text-[#7BA7FF] hover:text-[#2563EB]">
            Prompts
          </Link>
          <span className="mx-2 text-zinc-700">/</span>
          <Link href={`/prompts/${catSlug}`} className="text-[#7BA7FF] hover:text-[#2563EB]">
            {category?.title}
          </Link>
          <span className="mx-2 text-zinc-700">/</span>
          <span className="text-zinc-300">{template.title}</span>
        </nav>

        <h1 className="text-[32px] font-medium leading-[1.1] tracking-[-0.02em] text-zinc-50 md:text-[44px]">
          {template.title}
        </h1>
        <p className="mt-5 max-w-[68ch] text-[16px] leading-[1.6] text-zinc-400">
          {template.description}
        </p>

        <div className="mb-10 mt-6 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[11px] uppercase tracking-[0.14em] capitalize ${difficultyClass[template.difficulty]}`}
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            {template.difficulty}
          </span>
          {template.platforms.map((p) => (
            <span
              key={p}
              className="rounded-full border border-[#2563EB]/20 bg-[#2563EB]/10 px-2.5 py-0.5 text-[11px] uppercase tracking-[0.14em] capitalize text-[#7BA7FF]"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              {p}
            </span>
          ))}
          {template.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/10 bg-white/[0.02] px-2.5 py-0.5 text-[11px] tracking-[0.04em] text-zinc-400"
            >
              {tag}
            </span>
          ))}
        </div>

        <section className="mb-6 rounded-2xl border border-white/[0.06] bg-[#0f0f12] p-7">
          <h2
            className="mb-3 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            When to use this
          </h2>
          <p className="text-[15px] leading-[1.65] text-zinc-300">
            {template.useCase}
          </p>
        </section>

        <section className="mb-6 rounded-2xl border border-white/[0.06] bg-[#0f0f12] p-7">
          <div className="mb-4 flex items-center justify-between">
            <h2
              className="text-[11px] uppercase tracking-[0.22em] text-zinc-500"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              Prompt template
            </h2>
            <CopyPromptButton prompt={template.prompt} />
          </div>
          <div
            className="overflow-x-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-[#0a0a0c] p-5 text-[13.5px] leading-[1.7] text-zinc-200"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            {template.prompt}
          </div>
        </section>

        {template.exampleInput && (
          <section className="mb-6 rounded-2xl border border-white/[0.06] bg-[#0f0f12] p-7">
            <h2
              className="mb-4 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              Example
            </h2>
            <h3 className="mb-2 text-[13px] font-medium uppercase tracking-[0.16em] text-[#7BA7FF]">
              Input
            </h3>
            <p className="mb-5 text-[14px] leading-[1.65] text-zinc-300">
              {template.exampleInput}
            </p>
            {template.exampleOutput && (
              <>
                <h3 className="mb-2 text-[13px] font-medium uppercase tracking-[0.16em] text-emerald-400">
                  Output
                </h3>
                <p className="text-[14px] leading-[1.65] text-zinc-300">
                  {template.exampleOutput}
                </p>
              </>
            )}
          </section>
        )}

        <section className="mb-12">
          <h2
            className="mb-4 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            Use this prompt with
          </h2>
          <div className="flex flex-wrap gap-2">
            {template.platforms.map((p) => {
              const platform = platformPages.find((pp) => pp.slug === p);
              return platform ? (
                <Link
                  key={p}
                  href={`/prompts/for/${p}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.02] px-3.5 py-1.5 text-[13px] text-[#7BA7FF] transition-all hover:border-white/20 hover:bg-white/[0.05]"
                >
                  <span>{platform.icon}</span>
                  {platform.name}
                </Link>
              ) : (
                <span
                  key={p}
                  className="rounded-full border border-white/10 bg-white/[0.02] px-3.5 py-1.5 text-[13px] capitalize text-zinc-400"
                >
                  {p}
                </span>
              );
            })}
          </div>
        </section>

        {related.length > 0 && (
          <section className="mb-12">
            <h2
              className="mb-5 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              Related templates
            </h2>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {related.map((rt) => (
                <TemplateCard key={rt.slug} template={rt} />
              ))}
            </div>
          </section>
        )}

        <SkillsetCta />
      </main>
    </SkillsetShell>
  );
}
