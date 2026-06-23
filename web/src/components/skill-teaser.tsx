"use client";

import { useState } from "react";
import { ArrowRight, Bolt, Check, ChevronDown, Folder, Play } from "lucide-react";

const MONO = { fontFamily: "var(--font-geist-mono), monospace" } as const;

/**
 * Mini teaser on the gated landing page: prompt -> skill -> skillset -> run.
 * Deliberately minimal (one short label per node). The Run button reveals a
 * one-line result so the gate shows that a skillset *runs* where a static doc
 * just sits. Token routing is demoted to a byproduct badge on the result.
 */
export function SkillTeaser() {
  const [ran, setRan] = useState(false);
  const [open, setOpen] = useState(false);

  return (
    <section className="relative z-10 border-t border-white/5 bg-[#0a0a0c]">
      <div className="mx-auto w-full max-w-[1100px] px-5 py-10 md:px-6 md:py-12">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="mb-5 flex w-full items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-zinc-500 transition-colors hover:text-zinc-300"
          style={MONO}
        >
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${open ? "" : "-rotate-90"}`}
            strokeWidth={2}
          />
          How a skillset works
        </button>

        {open && (
        <div className="rounded-2xl border border-white/[0.06] bg-[#0f0f12] p-5 md:p-6">
          <div className="flex flex-wrap items-stretch gap-3 md:gap-4">
            {/* prompt */}
            <div className="min-w-[160px] flex-1 rounded-xl border border-white/[0.06] bg-[#0a0a0c] p-4">
              <p className="mb-2.5 text-[10px] uppercase tracking-[0.18em] text-zinc-500" style={MONO}>
                Prompt
              </p>
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5 text-[13px] leading-[1.5] text-zinc-400">
                Write a LinkedIn post about{" "}
                <span className="font-medium text-[#7BA7FF]">{"{topic}"}</span>
              </div>
            </div>

            <div className="hidden items-center text-zinc-600 sm:flex" aria-hidden>
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </div>

            {/* skill */}
            <div className="min-w-[160px] flex-1 rounded-xl border border-white/[0.06] bg-[#0a0a0c] p-4">
              <p className="mb-2.5 text-[10px] uppercase tracking-[0.18em] text-zinc-500" style={MONO}>
                Skill
              </p>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#2563EB]/30 bg-[#2563EB]/10 px-2.5 py-1.5 text-[13px] font-medium text-[#7BA7FF]">
                <Bolt className="h-3.5 w-3.5" strokeWidth={2} />
                LinkedIn post
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              </span>
            </div>

            <div className="hidden items-center text-zinc-600 sm:flex" aria-hidden>
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </div>

            {/* skillset */}
            <div className="min-w-[160px] flex-1 rounded-xl border border-white/[0.06] bg-[#0a0a0c] p-4">
              <p className="mb-2.5 text-[10px] uppercase tracking-[0.18em] text-zinc-500" style={MONO}>
                Skillset
              </p>
              <div className="flex items-center gap-2.5">
                <Folder className="h-[18px] w-[18px] shrink-0 text-[#7BA7FF]" strokeWidth={1.75} />
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium text-zinc-100">
                    LinkedIn Post Templates
                  </div>
                  <div className="text-[12px] text-zinc-500">12 skills</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRan(true)}
                disabled={ran}
                className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[#2563EB] px-3 py-2 text-[13px] font-medium text-white transition-all hover:bg-[#1d4ed8] active:translate-y-[1px] disabled:opacity-70"
              >
                {ran ? (
                  <>
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> Done
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5" strokeWidth={2} /> Run
                  </>
                )}
              </button>
            </div>
          </div>

          {ran && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-zinc-400">
              <Check className="h-4 w-4 text-emerald-400" strokeWidth={2.5} />
              <span>Draft ready</span>
              <span className="rounded-md bg-[#2563EB]/10 px-2 py-0.5 text-[12px] text-[#7BA7FF]">
                auto-routed to a cheaper model
              </span>
            </div>
          )}
        </div>
        )}
      </div>
    </section>
  );
}
