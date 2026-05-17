"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, RefreshCw, Copy, Check } from "lucide-react";
import { SkillsetShell } from "@/components/skillset-shell";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    console.error("[error.tsx]", error);
  }, [error]);

  const copyDetails = async () => {
    const payload = [
      "[Skillset error]",
      `source: web.error.tsx`,
      `name: ${error.name}`,
      `message: ${error.message}`,
      `digest: ${error.digest ?? "(none)"}`,
      `when: ${new Date().toISOString()}`,
      "---",
      error.stack ?? "(no stack)",
    ].join("\n");
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* ignore */
    }
  };

  return (
    <SkillsetShell showHalo>
      <section className="mx-auto flex min-h-[calc(100dvh-65px)] max-w-[640px] flex-col items-center justify-center px-6 text-center">
        <p
          className="mb-4 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
          style={{ fontFamily: "var(--font-geist-mono), monospace" }}
        >
          Error
        </p>
        <h1 className="text-[64px] font-medium leading-[0.95] tracking-[-0.025em] text-zinc-50 md:text-[72px]">
          Something broke.
        </h1>
        <p className="mt-6 max-w-[48ch] text-[16px] leading-[1.6] text-zinc-400">
          {error.message || "An unexpected error occurred while rendering this page."}
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            style={{ padding: "10px 22px" }}
            className="group inline-flex items-center gap-2 rounded-full bg-[#2563EB] text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_8px_24px_-12px_rgba(37,99,235,0.6)] transition-all hover:bg-[#1d4ed8]"
          >
            <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
            Try again
          </button>
          <Link
            href="/"
            style={{ padding: "10px 22px" }}
            className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] text-sm text-zinc-200 transition-all hover:border-white/20 hover:bg-white/[0.05]"
          >
            Back to home
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
              strokeWidth={2}
            />
          </Link>
          <button
            type="button"
            onClick={copyDetails}
            style={{ padding: "10px 18px" }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] text-sm text-zinc-400 transition-all hover:border-white/20 hover:bg-white/[0.05]"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" strokeWidth={2} /> : <Copy className="h-3.5 w-3.5" strokeWidth={2} />}
            {copied ? "Copied" : "Copy details"}
          </button>
        </div>
      </section>
    </SkillsetShell>
  );
}
