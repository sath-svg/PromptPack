import type { Metadata } from "next";
import { promptCategories } from "@/lib/pseo/prompts";
import { CategoryCard } from "@/components/pseo/category-card";
import { SEOToolCTA } from "@/components/tools/seo-tool-cta";

export const metadata: Metadata = {
  title: "AI Prompt Templates - Free Prompts for ChatGPT, Claude & Gemini | PromptPack",
  description:
    "Browse free AI prompt templates for marketing, coding, SEO, email, writing, and more. Copy-paste ready prompts for ChatGPT, Claude, and Gemini.",
  keywords: [
    "AI prompt templates",
    "ChatGPT prompts",
    "Claude prompts",
    "prompt library",
    "free prompts",
    "prompt engineering templates",
  ],
  alternates: { canonical: "https://pmtpk.com/prompts" },
};

export default function PromptsIndexPage() {
  const totalTemplates = promptCategories.reduce((sum, c) => sum + c.templates.length, 0);

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        AI Prompt Templates
      </h1>
      <p style={{ color: "var(--muted-foreground)", marginBottom: "2.5rem", fontSize: "1.05rem", lineHeight: 1.6 }}>
        {totalTemplates} ready-to-use prompt templates across {promptCategories.length} categories.
        Copy any template and paste it into ChatGPT, Claude, Gemini, or any AI assistant.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(260px, 100%), 1fr))",
          gap: "1rem",
        }}
      >
        {promptCategories.map((category) => (
          <CategoryCard key={category.slug} category={category} />
        ))}
      </div>

      <SEOToolCTA variant="tools" />
    </main>
  );
}
