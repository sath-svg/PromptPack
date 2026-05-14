"use client";

import Link from "next/link";
import { usePlausible } from "next-plausible";

export function SkillsetCta({
  eyebrow = "Get Skillset",
  title = "Save this as a reusable skill.",
  body = "Capture prompts once and run them across every AI tool you use.",
}: {
  eyebrow?: string;
  title?: string;
  body?: string;
}) {
  const plausible = usePlausible();

  return (
    <section className="mt-16 rounded-2xl border border-white/[0.06] bg-[#0f0f12] p-10 text-center md:p-12">
      <p
        className="mb-3 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
        style={{ fontFamily: "var(--font-geist-mono), monospace" }}
      >
        {eyebrow}
      </p>
      <h2 className="text-[28px] font-medium tracking-[-0.02em] text-zinc-50">
        {title}
      </h2>
      <p className="mx-auto mt-3 max-w-[52ch] text-[15px] leading-[1.6] text-zinc-400">
        {body}
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link
          href="/downloads"
          style={{ padding: "10px 22px" }}
          className="rounded-full bg-[#2563EB] text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition-all hover:bg-[#1d4ed8]"
          onClick={() => plausible("CTA Click", { props: { button: "start_free", location: "skillset_cta" } })}
        >
          Start Free
        </Link>
        <Link
          href="/pricing"
          style={{ padding: "10px 22px" }}
          className="rounded-full border border-white/10 bg-white/[0.02] text-sm text-zinc-200 transition-all hover:border-white/20 hover:bg-white/[0.05]"
          onClick={() => plausible("CTA Click", { props: { button: "see_plans", location: "skillset_cta" } })}
        >
          See plans
        </Link>
      </div>
    </section>
  );
}
