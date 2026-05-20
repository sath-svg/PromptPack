import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { promptCategories } from "@/lib/pseo/prompts";
import { platformPages, getPlatformPage } from "@/lib/pseo/platforms";
import { rolePages, getRolePage } from "@/lib/pseo/roles";
import { getTemplatesForRole } from "@/lib/pseo/role-templates";
import { TemplateCard } from "@/components/pseo/template-card";
import { CategoryCard } from "@/components/pseo/category-card";
import { SkillsetShell } from "@/components/skillset-shell";
import { SkillsetCta } from "@/components/skillset-cta";
import type { PromptTemplate } from "@/lib/pseo/types";

interface Props {
  params: Promise<{ slug: string }>;
}

function getAllSlugs() {
  return platformPages.map((p) => p.slug);
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

function getTemplatesForPlatform(platformSlug: string): PromptTemplate[] {
  return promptCategories.flatMap((c) =>
    c.templates.filter((t) => t.platforms.includes(platformSlug as any)),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const platform = getPlatformPage(slug);
  if (platform) {
    return {
      title: `${platform.title} | Skillset`,
      description: platform.description,
      keywords: platform.keywords,
      alternates: { canonical: `https://skillset.so/prompts/for/${slug}` },
      openGraph: {
        title: platform.title,
        description: platform.description,
        url: `https://skillset.so/prompts/for/${slug}`,
      },
    };
  }

  const role = getRolePage(slug);
  if (role) {
    return {
      title: `${role.title} | Skillset`,
      description: role.description,
      keywords: role.keywords,
      alternates: { canonical: `https://skillset.so/prompts/for/${slug}` },
      openGraph: {
        title: role.title,
        description: role.description,
        url: `https://skillset.so/prompts/for/${slug}`,
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

  const relevantCategorySlugs = isPlatform
    ? [...new Set(templates.map((t) => t.category))]
    : role!.relevantCategories;
  const relevantCategories = promptCategories.filter((c) =>
    relevantCategorySlugs.includes(c.slug),
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: pageData.title,
    description: pageData.description,
    url: `https://skillset.so/prompts/for/${slug}`,
    publisher: {
      "@type": "Organization",
      name: "Skillset",
      url: "https://skillset.so",
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: templates.length,
      itemListElement: templates.slice(0, 20).map((t, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: t.title,
        url: `https://skillset.so/prompts/${t.category}/${t.slug}`,
      })),
    },
  };

  return (
    <SkillsetShell showHalo>
      <main className="relative mx-auto max-w-[1100px] px-6 py-20 md:py-24">
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
          <span className="text-zinc-300">
            {isPlatform ? platform!.name : `For ${role!.role}`}
          </span>
        </nav>

        <h1 className="flex flex-wrap items-center gap-3 text-[36px] font-medium leading-[1.05] tracking-[-0.02em] text-zinc-50 md:text-[52px]">
          <span className="text-[40px]">{pageData.icon}</span>
          <span>
            {isPlatform
              ? `Best ${platform!.name} prompts`
              : `AI prompts for ${role!.role}`}
          </span>
        </h1>
        <p className="mt-5 max-w-[68ch] text-[16px] leading-[1.6] text-zinc-400">
          {pageData.longDescription}
        </p>
        <p
          className="mt-3 text-[12px] uppercase tracking-[0.18em] text-zinc-500"
          style={{ fontFamily: "var(--font-geist-mono), monospace" }}
        >
          {templates.length} free templates · copy and run
        </p>

        <h2
          className="mb-5 mt-14 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
          style={{ fontFamily: "var(--font-geist-mono), monospace" }}
        >
          {templates.length} prompt templates
        </h2>
        <div className="mb-16 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <TemplateCard
              key={`${template.category}-${template.slug}`}
              template={template}
            />
          ))}
        </div>

        {relevantCategories.length > 0 && (
          <section className="mb-12">
            <h2
              className="mb-5 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              Browse by category
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {relevantCategories.map((rc) => (
                <CategoryCard key={rc.slug} category={rc} />
              ))}
            </div>
          </section>
        )}

        {isPlatform && (
          <section className="mb-12">
            <h2
              className="mb-4 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              Browse by role
            </h2>
            <div className="flex flex-wrap gap-2">
              {rolePages.slice(0, 12).map((r) => (
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
        )}

        {!isPlatform && (
          <section className="mb-12">
            <h2
              className="mb-4 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              Browse by platform
            </h2>
            <div className="flex flex-wrap gap-2">
              {platformPages.slice(0, 8).map((p) => (
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
        )}

        <SkillsetCta />
      </main>
    </SkillsetShell>
  );
}
