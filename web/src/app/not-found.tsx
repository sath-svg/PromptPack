import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SkillsetShell } from "@/components/skillset-shell";

export default function NotFound() {
  return (
    <SkillsetShell showHalo>
      <section className="mx-auto flex min-h-[calc(100dvh-65px)] max-w-[640px] flex-col items-center justify-center px-6 text-center">
        <p
          className="mb-4 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
          style={{ fontFamily: "var(--font-geist-mono), monospace" }}
        >
          Error · 404
        </p>
        <h1 className="text-[64px] font-medium leading-[0.95] tracking-[-0.025em] text-zinc-50 md:text-[88px]">
          Page not found.
        </h1>
        <p className="mt-6 max-w-[48ch] text-[16px] leading-[1.6] text-zinc-400">
          The link you followed may be broken, or the page may have been removed.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/"
            style={{ padding: "10px 22px" }}
            className="group inline-flex items-center gap-2 rounded-full bg-[#2563EB] text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_8px_24px_-12px_rgba(37,99,235,0.6)] transition-all hover:bg-[#1d4ed8]"
          >
            Back to home
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
      </section>
    </SkillsetShell>
  );
}
