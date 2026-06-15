"use client";

import { useEffect } from "react";
import { X, ArrowRight } from "lucide-react";
import type { SkillsetPack } from "@/lib/pseo/skillset-packs";
import { TRIAL_CTA_HREF } from "@/lib/cta";

interface Props {
  pack: SkillsetPack | null;
  onClose: () => void;
}

/**
 * Modal that lists every prompt in a pack (label + purpose). Template
 * bodies are intentionally hidden so the Download .skill button stays
 * the primary CTA — the value is in importing the pack, not previewing
 * raw prompt strings.
 */
export function PackPreviewModal({ pack, onClose }: Props) {
  useEffect(() => {
    if (!pack) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [pack, onClose]);

  if (!pack) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`pack-preview-${pack.id}-title`}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[85vh] w-full max-w-[640px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f12] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex items-start justify-between border-b border-white/[0.06] p-6">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.03] text-[24px]">
              {pack.icon}
            </span>
            <div>
              <h2
                id={`pack-preview-${pack.id}-title`}
                className="text-[20px] font-medium leading-[1.2] tracking-[-0.01em] text-zinc-50"
              >
                {pack.title}
              </h2>
              <p className="mt-1 text-[13px] leading-[1.5] text-zinc-400">
                {pack.description}
              </p>
              <div className="mt-3 flex items-center gap-2 text-[11px]">
                <span
                  className="rounded-full border border-white/10 bg-white/[0.02] px-2 py-0.5 text-zinc-400"
                  style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                >
                  {pack.prompts.length} skills
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 ${
                    pack.type === "workflow"
                      ? "border border-[#2563EB]/40 bg-[#2563EB]/10 text-[#7BA7FF]"
                      : "border border-white/10 bg-white/[0.02] text-zinc-400"
                  }`}
                  style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                >
                  {pack.type}
                </span>
                <span
                  className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-emerald-300"
                  style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                >
                  trial
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.02] text-zinc-400 transition-colors hover:border-white/20 hover:bg-white/[0.06] hover:text-zinc-100"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </header>

        {/* Prompts list */}
        <div className="flex-1 overflow-y-auto p-6">
          <p
            className="mb-4 text-[10px] uppercase tracking-[0.18em] text-zinc-500"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            Every skill in this pack
          </p>
          <ol className="space-y-3">
            {pack.prompts.map((prompt) => (
              <li
                key={prompt.id}
                className="flex items-start gap-3 rounded-lg border border-white/[0.06] bg-white/[0.01] p-4"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-white/10 bg-white/[0.03] text-[16px]">
                  {prompt.icon}
                </span>
                <div className="min-w-0">
                  <div className="text-[14px] font-medium leading-[1.3] text-zinc-100">
                    {prompt.label}
                  </div>
                  <div className="mt-1 text-[12.5px] leading-[1.5] text-zinc-400">
                    {prompt.purpose}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between gap-4 border-t border-white/[0.06] bg-[#0a0a0c] p-5">
          <span className="text-[12px] text-zinc-500">
            Import into Skillset desktop or any AI tool.
          </span>
          <a
            href={TRIAL_CTA_HREF}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#2563EB] px-5 py-2.5 text-[13px] font-medium text-white transition-all duration-200 hover:bg-[#1d4ed8] active:translate-y-[1px]"
          >
            Start trial to import
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
          </a>
        </footer>
      </div>
    </div>
  );
}
