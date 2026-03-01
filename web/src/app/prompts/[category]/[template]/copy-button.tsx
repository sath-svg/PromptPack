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
      style={{
        padding: "0.35rem 0.75rem",
        fontSize: "0.8rem",
        borderRadius: "4px",
        border: "1px solid var(--border, #27272a)",
        backgroundColor: copied ? "rgba(34, 197, 94, 0.1)" : "transparent",
        color: copied ? "#22c55e" : "var(--muted-foreground)",
        cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      {copied ? "Copied!" : "Copy Prompt"}
    </button>
  );
}
