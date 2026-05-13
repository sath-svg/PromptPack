import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { promptCategories, getCategory } from "@/lib/pseo/prompts";
import { TemplateCard } from "@/components/pseo/template-card";
import { CategoryCard } from "@/components/pseo/category-card";
import { SkillsetShell } from "@/components/skillset-shell";
import { SkillsetCta } from "@/components/skillset-cta";

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
    title: `${category.templates.length} Free ${category.title} for ChatGPT, Claude & Gemini (2026) | Skillset`,
    description: category.description,
    keywords: category.keywords,
    alternates: { canonical: `https://skillset.so/prompts/${slug}` },
    openGraph: {
      title: `${category.title} | Skillset`,
      description: category.description,
      url: `https://skillset.so/prompts/${slug}`,
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
    url: `https://skillset.so/prompts/${slug}`,
    publisher: {
      "@type": "Organization",
      name: "Skillset",
      url: "https://skillset.so",
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: category.templates.length,
      itemListElement: category.templates.map((t, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: t.title,
        url: `https://skillset.so/prompts/${slug}/${t.slug}`,
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
    <SkillsetShell showHalo>
      <main className="relative mx-auto max-w-[1100px] px-6 py-20 md:py-24">
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

        <nav
          className="mb-8 text-[12px] uppercase tracking-[0.18em] text-zinc-500"
          style={{ fontFamily: "var(--font-geist-mono), monospace" }}
        >
          <Link href="/prompts" className="text-[#7BA7FF] hover:text-[#2563EB]">
            Prompts
          </Link>
          <span className="mx-2 text-zinc-700">/</span>
          <span className="text-zinc-300">{category.title}</span>
        </nav>

        <div className="mb-12">
          <h1 className="flex flex-wrap items-center gap-3 text-[36px] font-medium leading-[1.05] tracking-[-0.02em] text-zinc-50 md:text-[52px]">
            <span className="text-[40px]">{category.icon}</span>
            <span>{category.title}</span>
          </h1>
          <p className="mt-5 max-w-[68ch] text-[16px] leading-[1.6] text-zinc-400">
            {category.longDescription}
          </p>
        </div>

        <h2
          className="mb-5 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
          style={{ fontFamily: "var(--font-geist-mono), monospace" }}
        >
          {category.templates.length} templates
        </h2>
        <div className="mb-16 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {category.templates.map((template) => (
            <TemplateCard key={template.slug} template={template} />
          ))}
        </div>

        {relatedCategories.length > 0 && (
          <section className="mb-16">
            <h2
              className="mb-5 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              Related categories
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {relatedCategories.map((rc) => (
                <CategoryCard key={rc.slug} category={rc} />
              ))}
            </div>
          </section>
        )}

        {category.faqs && category.faqs.length > 0 && (
          <section className="mb-12">
            <h2
              className="mb-5 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              Frequently asked
            </h2>
            <div className="flex flex-col gap-3">
              {category.faqs.map((faq, i) => (
                <details
                  key={i}
                  className="group rounded-2xl border border-white/[0.06] bg-[#0f0f12] p-7 transition-colors hover:border-white/[0.10]"
                >
                  <summary className="cursor-pointer list-none text-[16px] font-medium text-zinc-50">
                    {faq.question}
                  </summary>
                  <p className="mt-3 text-[14px] leading-[1.6] text-zinc-400">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>
        )}

        <SkillsetCta />
      </main>
    </SkillsetShell>
  );
}
