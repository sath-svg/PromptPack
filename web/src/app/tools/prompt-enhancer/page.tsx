import type { Metadata } from "next";
import Link from "next/link";
import { EnhancerTool } from "@/components/tools/enhancer-tool";
import { SEOToolCTA } from "@/components/tools/seo-tool-cta";

export const metadata: Metadata = {
  title: "Free AI Prompt Enhancer - Improve Your Prompts Instantly | PromptPack",
  description:
    "Enhance your AI prompts for free. Paste any prompt and get an optimized version for ChatGPT, Claude, or Gemini. 4 modes: clarity, structured, concise, strict.",
  keywords: [
    "prompt improver",
    "prompt optimizer",
    "AI prompt enhancer",
    "ChatGPT prompt improver",
    "free prompt optimizer",
    "prompt engineering tool",
    "improve AI prompts",
    "better ChatGPT prompts",
  ],
  alternates: { canonical: "https://pmtpk.com/tools/prompt-enhancer" },
  openGraph: {
    title: "Free AI Prompt Enhancer | PromptPack",
    description: "Paste any prompt and get an AI-improved version instantly. 4 optimization modes. Works for ChatGPT, Claude, and Gemini.",
    url: "https://pmtpk.com/tools/prompt-enhancer",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Free AI Prompt Enhancer - PromptPack",
  description: "Enhance and optimize your AI prompts for ChatGPT, Claude, and Gemini with 4 improvement modes.",
  url: "https://pmtpk.com/tools/prompt-enhancer",
  applicationCategory: "UtilityApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  publisher: { "@type": "Organization", name: "PromptPack" },
};

export default function PromptEnhancerPage() {
  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav style={{ marginBottom: "1.5rem", fontSize: "0.85rem", color: "var(--muted-foreground)" }}>
        <Link href="/tools" style={{ color: "#6366f1", textDecoration: "none" }}>Tools</Link>
        <span style={{ margin: "0 0.5rem" }}>/</span>
        <span>Prompt Enhancer</span>
      </nav>

      <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        Free AI Prompt Enhancer
      </h1>
      <p style={{ color: "var(--muted-foreground)", marginBottom: "2rem", fontSize: "1.05rem", lineHeight: 1.6 }}>
        Paste your prompt below and choose an enhancement mode. Our AI will rewrite it using proven prompt engineering techniques — making it clearer, more structured, and more effective.
      </p>

      <EnhancerTool />

      {/* SEO Content */}
      <section style={{ marginTop: "3.5rem" }}>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 600, marginBottom: "0.75rem" }}>
          How it works
        </h2>
        <div style={{ display: "grid", gap: "1rem" }}>
          {[
            { step: "1", title: "Paste your prompt", desc: "Enter any prompt you'd use with ChatGPT, Claude, Gemini, or any AI assistant." },
            { step: "2", title: "Choose a mode", desc: "Structured adds sections and format. Clarity removes ambiguity. Concise shortens it. Strict adds constraints." },
            { step: "3", title: "Get your enhanced prompt", desc: "Copy the improved version and use it directly — your original intent is always preserved." },
          ].map((item) => (
            <div key={item.step} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  backgroundColor: "rgba(99, 102, 241, 0.15)",
                  color: "#818cf8",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {item.step}
              </span>
              <div>
                <h3 style={{ margin: "0 0 0.2rem", fontSize: "1rem", fontWeight: 600 }}>{item.title}</h3>
                <p style={{ margin: 0, color: "var(--muted-foreground)", fontSize: "0.9rem", lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: "2.5rem" }}>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 600, marginBottom: "0.75rem" }}>
          Frequently asked questions
        </h2>
        <div style={{ display: "grid", gap: "1.25rem" }}>
          {[
            {
              q: "Is the prompt enhancer really free?",
              a: "Yes. You get 1 free use per day without signing up. Create a free account for 10 daily uses, or upgrade to Pro for 100.",
            },
            {
              q: "Which AI models does it work with?",
              a: "Enhanced prompts work with any AI assistant — ChatGPT, Claude, Gemini, Perplexity, Grok, DeepSeek, and more. The enhancement focuses on universal prompt engineering principles.",
            },
            {
              q: "Does the enhancer change my prompt's meaning?",
              a: "No. The AI preserves your original intent and only restructures the prompt for clarity, specificity, and effectiveness. If your prompt is already well-written, it will make minimal changes.",
            },
            {
              q: "What's the difference between the 4 modes?",
              a: "Structured organizes your prompt into clear sections. Clarity removes ambiguity. Concise shortens it while keeping the core intent. Strict adds explicit constraints and edge cases.",
            },
          ].map((faq) => (
            <div key={faq.q}>
              <h3 style={{ margin: "0 0 0.3rem", fontSize: "0.95rem", fontWeight: 600 }}>{faq.q}</h3>
              <p style={{ margin: 0, color: "var(--muted-foreground)", fontSize: "0.9rem", lineHeight: 1.5 }}>{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      <SEOToolCTA variant="extension" />
    </main>
  );
}
