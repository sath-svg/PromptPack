import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";
import { comparisonPages, getComparison } from "@/lib/pseo/comparisons";
import { ComparisonTable } from "@/components/pseo/comparison-table";
import { SkillsetShell } from "@/components/skillset-shell";
import { SkillsetCta } from "@/components/skillset-cta";

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
    title: `${page.title} - 2026 Comparison | Skillset`,
    description: page.metaDescription,
    keywords: page.targetKeywords,
    alternates: { canonical: `https://skillset.so/compare/${slug}` },
    openGraph: {
      title: page.title,
      description: page.metaDescription,
      url: `https://skillset.so/compare/${slug}`,
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
    url: `https://skillset.so/compare/${slug}`,
    publisher: { "@type": "Organization", name: "Skillset" },
  };

  const ppWins = page.comparisonPoints.filter((p) => p.winner === "skillset").length;
  const compWins = page.comparisonPoints.filter((p) => p.winner === "competitor").length;
  const ties = page.comparisonPoints.filter((p) => p.winner === "tie").length;

  return (
    <SkillsetShell showHalo>
      <main className="relative mx-auto max-w-[960px] px-6 py-20 md:py-24">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <nav
          className="mb-8 text-[12px] uppercase tracking-[0.18em] text-zinc-500"
          style={{ fontFamily: "var(--font-geist-mono), monospace" }}
        >
          <Link href="/compare" className="text-[#7BA7FF] hover:text-[#2563EB]">
            Comparisons
          </Link>
          <span className="mx-2 text-zinc-700">/</span>
          <span className="text-zinc-300">{page.title}</span>
        </nav>

        <h1 className="text-[34px] font-medium leading-[1.1] tracking-[-0.02em] text-zinc-50 md:text-[48px]">
          {page.title}
        </h1>

        <div className="mb-10 mt-8 grid grid-cols-3 gap-4 rounded-2xl border border-white/[0.06] bg-[#0f0f12] p-6">
          <Stat value={ppWins} label="Skillset wins" accent />
          <Stat value={ties} label="Tied" />
          <Stat value={compWins} label={`${page.competitorName} wins`} />
        </div>

        <section className="mb-8 rounded-2xl border border-white/[0.06] bg-[#0f0f12] p-7">
          <h2
            className="mb-3 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            What is {page.competitorName}?
          </h2>
          <p className="text-[15px] leading-[1.7] text-zinc-300">
            {page.competitorDescription}
          </p>
        </section>

        <section className="mb-8">
          <h2
            className="mb-5 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            Feature comparison
          </h2>
          <ComparisonTable
            points={page.comparisonPoints}
            competitorName={page.competitorName}
          />
        </section>

        <section className="mb-10 rounded-2xl border border-white/[0.06] bg-[#0f0f12] p-7">
          <h2
            className="mb-3 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            Our take
          </h2>
          <p className="text-[15px] leading-[1.7] text-zinc-300">{page.verdict}</p>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/downloads"
            style={{ padding: "10px 22px" }}
            className="group inline-flex items-center gap-2 rounded-full bg-[#2563EB] text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_8px_24px_-12px_rgba(37,99,235,0.6)] transition-all hover:bg-[#1d4ed8]"
          >
            Start Free
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
              strokeWidth={2}
            />
          </Link>
          <Link
            href="/pricing"
            style={{ padding: "10px 22px" }}
            className="rounded-full border border-white/10 bg-white/[0.02] text-sm text-zinc-200 transition-all hover:border-white/20 hover:bg-white/[0.05]"
          >
            See pricing
          </Link>
        </div>

        <SkillsetCta />
      </main>
    </SkillsetShell>
  );
}

function Stat({
  value,
  label,
  accent = false,
}: {
  value: number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="text-center">
      <div
        className={`text-[28px] font-medium tabular-nums ${accent ? "text-[#7BA7FF]" : "text-zinc-300"}`}
        style={{ fontFamily: "var(--font-geist-mono), monospace" }}
      >
        {value}
      </div>
      <p
        className="mt-1 text-[11px] uppercase tracking-[0.18em] text-zinc-500"
        style={{ fontFamily: "var(--font-geist-mono), monospace" }}
      >
        {label}
      </p>
    </div>
  );
}
