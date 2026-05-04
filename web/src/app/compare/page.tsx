import type { Metadata } from "next";
import Link from "next/link";
import { comparisonPages } from "@/lib/pseo/comparisons";
import { SkillsetShell } from "@/components/skillset-shell";
import { SkillsetPageHeader } from "@/components/skillset-page-header";

export const metadata: Metadata = {
  title: "Skillset Comparisons - How We Stack Up | Skillset",
  description:
    "See how Skillset compares to other prompt management tools like AIPRM, PromptPerfect, and FlowGPT. Feature-by-feature comparisons.",
  keywords: [
    "Skillset alternatives",
    "prompt tool comparison",
    "AIPRM alternative",
    "PromptPerfect alternative",
  ],
  alternates: { canonical: "https://skillset.so/compare" },
};

export default function ComparePage() {
  return (
    <SkillsetShell showHalo>
      <main className="relative mx-auto max-w-[900px] px-6 py-20 md:py-28">
        <SkillsetPageHeader
          eyebrow="Comparisons"
          title="Skillset vs the alternatives."
          description="Feature-by-feature breakdowns against the other prompt-management tools, so you can pick what actually fits your stack."
          align="left"
        />

        <div className="grid grid-cols-1 gap-4">
          {comparisonPages.map((page) => (
            <Link
              key={page.slug}
              href={`/compare/${page.slug}`}
              className="group block rounded-2xl border border-white/[0.06] bg-[#0f0f12] p-7 transition-all hover:border-white/[0.14] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_20px_40px_-30px_rgba(37,99,235,0.4)]"
            >
              <h2 className="text-[18px] font-medium text-zinc-50 group-hover:text-white">
                {page.title}
              </h2>
              <p className="mt-2 text-[14px] leading-[1.55] text-zinc-400">
                {page.metaDescription}
              </p>
            </Link>
          ))}
        </div>
      </main>
    </SkillsetShell>
  );
}
