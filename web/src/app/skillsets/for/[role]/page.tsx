import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { rolePages, getRolePage, getSiblingRoles } from "@/lib/pseo/roles";
import { getTemplatesForRole, getRelevantCategories } from "@/lib/pseo/role-templates";
import { TemplateCard } from "@/components/pseo/template-card";
import { CategoryCard } from "@/components/pseo/category-card";
import { SkillsetShell } from "@/components/skillset-shell";
import { SkillsetCta } from "@/components/skillset-cta";
import { RoleStatsStrip } from "@/components/skillsets/role-stats-strip";
import { RoleKeyTasks } from "@/components/skillsets/role-key-tasks";
import { RolePackGrid } from "@/components/skillsets/role-pack-grid";
import { getPacksForRole } from "@/lib/pseo/skillset-packs";
import { RoleVsConsultant } from "@/components/skillsets/role-vs-consultant";
import { RoleHowTo } from "@/components/skillsets/role-how-to";
import { RoleFaq } from "@/components/skillsets/role-faq";
import { RoleSiblings } from "@/components/skillsets/role-siblings";
import { RoleCitations } from "@/components/skillsets/role-citations";

interface Props {
  params: Promise<{ role: string }>;
}

export const revalidate = 3600;

export async function generateStaticParams() {
  return rolePages.map((r) => ({ role: r.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { role: slug } = await params;
  const role = getRolePage(slug);
  if (!role) return {};

  const title = role.skillsetHeadline ?? `The Skillset for ${role.role}`;
  const description =
    role.skillsetSubhead ??
    `A portable bundle of prompts that turns ChatGPT, Claude, Gemini, and your IDE into a senior ${role.role.toLowerCase().replace(/s$/, "")} co-pilot.`;

  return {
    title: `${title} | Skillset`,
    description,
    keywords: role.keywords,
    alternates: { canonical: `https://skillset.so/skillsets/for/${slug}` },
    openGraph: {
      title,
      description,
      url: `https://skillset.so/skillsets/for/${slug}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function SkillsetForRolePage({ params }: Props) {
  const { role: slug } = await params;
  const role = getRolePage(slug);
  if (!role) notFound();

  const templates = getTemplatesForRole(role);
  const relevantCategories = getRelevantCategories(role);
  const siblings = getSiblingRoles(slug, 5);
  const headline = role.skillsetHeadline ?? `The Skillset for ${role.role}`;
  const subhead =
    role.skillsetSubhead ??
    `A portable bundle of prompts that turns ChatGPT, Claude, Gemini, and your IDE into a senior co-pilot built for ${role.role.toLowerCase()}.`;
  const ctaTitle = `Get the ${role.role} Skillset`;
  const ctaBody = `Save these prompts once and run them across every AI tool you use — ChatGPT, Claude, Gemini, Cursor, Copilot.`;

  const baseUrl = "https://skillset.so";
  const pageUrl = `${baseUrl}/skillsets/for/${slug}`;

  const graph: object[] = [
    {
      "@type": "WebPage",
      "@id": pageUrl,
      url: pageUrl,
      name: headline,
      description: subhead,
      isPartOf: { "@id": `${baseUrl}/skillsets` },
      breadcrumb: { "@id": `${pageUrl}#breadcrumb` },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${pageUrl}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Skillset", item: baseUrl },
        { "@type": "ListItem", position: 2, name: "Skillsets", item: `${baseUrl}/skillsets` },
        { "@type": "ListItem", position: 3, name: role.role },
      ],
    },
    {
      "@type": "Product",
      name: `Skillset for ${role.role}`,
      description: subhead,
      url: pageUrl,
      brand: { "@type": "Brand", name: "Skillset" },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        url: `${baseUrl}/downloads`,
      },
    },
    {
      "@type": "ItemList",
      name: `Prompts in the ${role.role} Skillset`,
      numberOfItems: templates.length,
      itemListElement: templates.slice(0, 20).map((t, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${baseUrl}/prompts/${t.category}/${t.slug}`,
        name: t.title,
      })),
    },
  ];

  if (role.faqs && role.faqs.length > 0) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: role.faqs.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    });
  }

  if (role.howToSteps && role.howToSteps.length > 0) {
    graph.push({
      "@type": "HowTo",
      name: `How ${role.role} use the Skillset`,
      step: role.howToSteps.map((s, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        name: s.name,
        text: s.text,
      })),
    });
  }

  if (role.oNetCode || role.medianSalary) {
    graph.push({
      "@type": "Occupation",
      name: role.role,
      ...(role.oNetCode && { occupationalCategory: role.oNetCode }),
      ...(role.medianSalary && {
        estimatedSalary: {
          "@type": "MonetaryAmountDistribution",
          name: "base",
          currency: "USD",
          median: role.medianSalary,
        },
      }),
      ...(role.keyTasks && { responsibilities: role.keyTasks }),
    });
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": graph,
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
          <Link href="/skillsets" className="text-[#7BA7FF] hover:text-[#2563EB]">
            Skillsets
          </Link>
          <span className="mx-2 text-zinc-700">/</span>
          <span className="text-zinc-300">For {role.role}</span>
        </nav>

        <h1 className="flex flex-wrap items-center gap-3 text-[36px] font-medium leading-[1.05] tracking-[-0.02em] text-zinc-50 md:text-[52px]">
          <span className="text-[40px]">{role.icon}</span>
          <span>{headline}</span>
        </h1>
        <p className="mt-5 max-w-[68ch] text-[16.5px] leading-[1.6] text-zinc-300">
          {subhead}
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/downloads"
            style={{ padding: "12px 24px" }}
            className="rounded-full bg-[#2563EB] text-[14.5px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition-all hover:bg-[#1d4ed8]"
          >
            {ctaTitle}
          </Link>
          <Link
            href="/pricing"
            style={{ padding: "12px 24px" }}
            className="rounded-full border border-white/10 bg-white/[0.02] text-[14.5px] text-zinc-200 transition-all hover:border-white/20 hover:bg-white/[0.05]"
          >
            See pricing
          </Link>
        </div>

        <RoleStatsStrip role={role} promptCount={templates.length} />

        <section className="mt-16">
          <h2 className="mb-4 text-[26px] font-medium tracking-[-0.02em] text-zinc-50 md:text-[32px]">
            What is a Skillset for {role.role.toLowerCase()}?
          </h2>
          <p className="max-w-[72ch] text-[15.5px] leading-[1.7] text-zinc-400">
            A Skillset is a portable bundle of prompts that runs identically across
            ChatGPT, Claude, Gemini, Cursor, and Copilot. Configure it once for{" "}
            {role.role.toLowerCase()} — your voice, your workflows, your tools — and reuse it across
            every AI session. Skill Router automatically picks the cheapest capable
            model per prompt, cutting LLM spend by 60–80% versus always using a
            frontier model. {role.longDescription}
          </p>
        </section>

        {role.keyTasks && role.keyTasks.length > 0 && (
          <RoleKeyTasks tasks={role.keyTasks} role={role.role} />
        )}

        <RolePackGrid roleLabel={role.role} packs={getPacksForRole(role.slug)} />

        <section className="mt-16">
          <h2
            className="mb-6 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            {templates.length} prompts inside this Skillset
          </h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {templates.slice(0, 12).map((template) => (
              <TemplateCard
                key={`${template.category}-${template.slug}`}
                template={template}
              />
            ))}
          </div>
          {templates.length > 12 && (
            <p className="mt-6 text-[13.5px] text-zinc-500">
              + {templates.length - 12} more prompts inside the {role.role} Skillset.
            </p>
          )}
        </section>

        {role.howToSteps && role.howToSteps.length > 0 && (
          <RoleHowTo steps={role.howToSteps} role={role.role.toLowerCase()} />
        )}

        {role.vsConsultant && role.vsConsultant.length > 0 && (
          <RoleVsConsultant rows={role.vsConsultant} role={role.role.replace(/s$/, "")} />
        )}

        {relevantCategories.length > 0 && (
          <section className="mt-16">
            <h2
              className="mb-6 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
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

        {role.faqs && role.faqs.length > 0 && (
          <RoleFaq faqs={role.faqs} role={role.role} />
        )}

        <RoleSiblings siblings={siblings} />

        <SkillsetCta eyebrow="Get Skillset" title={ctaTitle} body={ctaBody} />

        {role.citations && role.citations.length > 0 && (
          <RoleCitations citations={role.citations} lastUpdated={role.lastUpdated} />
        )}
      </main>
    </SkillsetShell>
  );
}
