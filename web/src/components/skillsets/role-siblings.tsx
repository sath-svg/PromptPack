import Link from "next/link";
import type { RolePage } from "@/lib/pseo/types";

export function RoleSiblings({ siblings }: { siblings: RolePage[] }) {
  if (siblings.length === 0) return null;
  return (
    <section className="mt-16">
      <h2
        className="mb-6 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
        style={{ fontFamily: "var(--font-geist-mono), monospace" }}
      >
        Related Skillsets
      </h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {siblings.map((r) => (
          <Link
            key={r.slug}
            href={`/skillsets/for/${r.slug}`}
            className="flex flex-col items-start gap-2 rounded-2xl border border-white/[0.06] bg-[#0f0f12] p-5 transition-all hover:border-white/[0.14] hover:bg-white/[0.025]"
          >
            <span className="text-[24px]">{r.icon}</span>
            <span className="text-[14px] font-medium text-zinc-100">
              Skillset for {r.role}
            </span>
            <span className="text-[12.5px] text-zinc-500">
              {r.aiAdoptionPct ? `${r.aiAdoptionPct}% use AI` : "Explore"}
            </span>
          </Link>
        ))}
        <Link
          href="/skillsets"
          className="flex flex-col items-start gap-2 rounded-2xl border border-[#2563EB]/30 bg-[#2563EB]/[0.06] p-5 transition-all hover:border-[#2563EB]/60"
        >
          <span className="text-[24px]">🗂️</span>
          <span className="text-[14px] font-medium text-zinc-100">All Skillsets</span>
          <span className="text-[12.5px] text-zinc-500">Browse by role</span>
        </Link>
      </div>
    </section>
  );
}
