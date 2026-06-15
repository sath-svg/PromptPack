import Link from "next/link";
import type { PromptTemplate } from "@/lib/pseo/types";
import { TRIAL_CTA_HREF } from "@/lib/cta";

interface TemplateCardProps {
  template: PromptTemplate;
}

const difficultyClass: Record<PromptTemplate["difficulty"], string> = {
  beginner: "bg-emerald-400/10 border-emerald-400/20 text-emerald-400",
  intermediate: "bg-amber-400/10 border-amber-400/20 text-amber-400",
  advanced: "bg-red-400/10 border-red-400/20 text-red-400",
};

export function TemplateCard({ template }: TemplateCardProps) {
  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-white/[0.06] bg-[#0f0f12] p-6 transition-all hover:border-white/[0.14]">
      <Link
        href={TRIAL_CTA_HREF}
        className="text-zinc-50 no-underline hover:text-white"
      >
        <h3 className="text-[15px] font-medium leading-[1.35]">
          {template.title}
        </h3>
      </Link>
      <p className="line-clamp-2 text-[13.5px] leading-[1.55] text-zinc-400">
        {template.description}
      </p>
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
        <span
          className={`rounded-full border px-2 py-0.5 text-[10.5px] uppercase tracking-[0.14em] capitalize ${difficultyClass[template.difficulty]}`}
          style={{ fontFamily: "var(--font-geist-mono), monospace" }}
        >
          {template.difficulty}
        </span>
        {template.tags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-white/10 bg-white/[0.02] px-2 py-0.5 text-[11px] tracking-[0.04em] text-zinc-400"
          >
            {tag}
          </span>
        ))}
        <Link
          href={TRIAL_CTA_HREF}
          className="ml-auto rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 text-[12px] text-zinc-300 transition-all hover:border-white/20 hover:bg-white/[0.05]"
        >
          Use prompt
        </Link>
      </div>
    </div>
  );
}
