"use client";

import { useState } from "react";

export function CopyPromptButton({ prompt }: { prompt: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`rounded-full border px-3.5 py-1.5 text-[12px] tracking-[0.04em] transition-all ${
        copied
          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-400"
          : "border-white/10 bg-white/[0.02] text-zinc-300 hover:border-white/20 hover:bg-white/[0.05]"
      }`}
    >
      {copied ? "Copied!" : "Copy Prompt"}
    </button>
  );
}
