"use client";

import Link from "next/link";
import type { PromptCategory } from "@/lib/pseo/types";

interface CategoryCardProps {
  category: PromptCategory;
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      href={`/prompts/${category.slug}`}
      style={{
        display: "block",
        padding: "1.25rem",
        borderRadius: "8px",
        border: "1px solid var(--border, #27272a)",
        backgroundColor: "var(--card, #18181b)",
        textDecoration: "none",
        color: "inherit",
        transition: "border-color 0.15s, transform 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#6366f1";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border, #27272a)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>{category.icon}</div>
      <h3 style={{ margin: "0 0 0.35rem", fontSize: "1.05rem", fontWeight: 600 }}>
        {category.title}
      </h3>
      <p
        style={{
          margin: "0 0 0.5rem",
          fontSize: "0.85rem",
          color: "var(--muted-foreground, #a1a1aa)",
          lineHeight: 1.5,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {category.description}
      </p>
      <span style={{ fontSize: "0.8rem", color: "#6366f1" }}>
        {category.templates.length} templates
      </span>
    </Link>
  );
}
