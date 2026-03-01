"use client";

import { useState } from "react";
import Link from "next/link";
import type { PromptTemplate } from "@/lib/pseo/types";

interface TemplateCardProps {
  template: PromptTemplate;
}

export function TemplateCard({ template }: TemplateCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await navigator.clipboard.writeText(template.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const difficultyColor = {
    beginner: "#22c55e",
    intermediate: "#eab308",
    advanced: "#ef4444",
  };

  return (
    <div
      style={{
        padding: "1.25rem",
        borderRadius: "8px",
        border: "1px solid var(--border, #27272a)",
        backgroundColor: "var(--card, #18181b)",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
      }}
    >
      <Link
        href={`/prompts/${template.category}/${template.slug}`}
        style={{ textDecoration: "none", color: "inherit" }}
      >
        <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>{template.title}</h3>
      </Link>
      <p
        style={{
          margin: 0,
          fontSize: "0.85rem",
          color: "var(--muted-foreground, #a1a1aa)",
          lineHeight: 1.5,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {template.description}
      </p>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          flexWrap: "wrap",
          marginTop: "auto",
          paddingTop: "0.5rem",
        }}
      >
        <span
          style={{
            fontSize: "0.7rem",
            padding: "0.15rem 0.4rem",
            borderRadius: "4px",
            backgroundColor: `${difficultyColor[template.difficulty]}20`,
            color: difficultyColor[template.difficulty],
            textTransform: "capitalize",
          }}
        >
          {template.difficulty}
        </span>
        {template.tags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            style={{
              fontSize: "0.7rem",
              padding: "0.15rem 0.4rem",
              borderRadius: "4px",
              backgroundColor: "rgba(99, 102, 241, 0.1)",
              color: "#818cf8",
            }}
          >
            {tag}
          </span>
        ))}
        <button
          onClick={handleCopy}
          style={{
            marginLeft: "auto",
            padding: "0.3rem 0.6rem",
            fontSize: "0.75rem",
            borderRadius: "4px",
            border: "1px solid var(--border, #27272a)",
            backgroundColor: "transparent",
            color: copied ? "#22c55e" : "var(--muted-foreground)",
            cursor: "pointer",
          }}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}
