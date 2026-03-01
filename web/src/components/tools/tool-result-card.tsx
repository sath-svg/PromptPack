"use client";

import { useState } from "react";

interface ToolResultCardProps {
  title: string;
  content: string;
  children?: React.ReactNode;
}

export function ToolResultCard({ title, content, children }: ToolResultCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        padding: "1.25rem",
        borderRadius: "8px",
        border: "1px solid var(--border, #27272a)",
        backgroundColor: "var(--card, #18181b)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.75rem",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>{title}</h3>
        <button
          onClick={handleCopy}
          style={{
            padding: "0.35rem 0.75rem",
            fontSize: "0.8rem",
            borderRadius: "4px",
            border: "1px solid var(--border, #27272a)",
            backgroundColor: "transparent",
            color: copied ? "#22c55e" : "var(--muted-foreground)",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <div
        style={{
          whiteSpace: "pre-wrap",
          lineHeight: 1.7,
          fontSize: "0.95rem",
          color: "var(--foreground, #ededed)",
        }}
      >
        {content}
      </div>
      {children}
    </div>
  );
}
