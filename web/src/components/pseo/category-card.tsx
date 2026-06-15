import Link from "next/link";
import type { PromptCategory } from "@/lib/pseo/types";
import { TRIAL_CTA_HREF } from "@/lib/cta";

interface CategoryCardProps {
  category: PromptCategory;
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      href={TRIAL_CTA_HREF}
      className="group flex flex-col gap-2 rounded-2xl border border-white/[0.06] bg-[#0f0f12] p-6 transition-all duration-200 hover:border-white/[0.14] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_20px_40px_-30px_rgba(37,99,235,0.4)]"
    >
      <div className="text-[28px]">{category.icon}</div>
      <h3 className="text-[16px] font-medium text-zinc-50 group-hover:text-white">
        {category.title}
      </h3>
      <p className="line-clamp-2 text-[13.5px] leading-[1.55] text-zinc-400">
        {category.description}
      </p>
      <span
        className="mt-auto pt-2 text-[11px] uppercase tracking-[0.18em] text-[#7BA7FF]"
        style={{ fontFamily: "var(--font-geist-mono), monospace" }}
      >
        {category.templates.length} templates →
      </span>
    </Link>
  );
}
