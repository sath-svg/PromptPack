import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Free AI Prompt Tools - Enhancer, Evaluator & Memory Migrator | PromptPack",
  description:
    "Improve and evaluate your AI prompts for free. Enhance prompts for ChatGPT, Claude, and Gemini with 4 optimization modes, score your prompts across 7 LLMs, or migrate your ChatGPT memory to Claude.",
  keywords: [
    "prompt tools",
    "AI prompt improver",
    "prompt optimizer",
    "prompt evaluator",
    "free prompt tools",
    "ChatGPT prompt enhancer",
    "chatgpt to claude",
    "migrate chatgpt memory",
  ],
  alternates: { canonical: "https://pmtpk.com/tools" },
};

const tools = [
  {
    title: "Prompt Enhancer",
    description:
      "Paste any prompt and get an AI-improved version. Choose from 4 modes: clarity, structured, concise, or strict.",
    href: "/tools/prompt-enhancer",
    icon: "✨",
    badge: "Free",
  },
  {
    title: "Prompt Evaluator",
    description:
      "Score your prompt across 7 major LLMs. See how well it performs on ChatGPT, Claude, Gemini, Perplexity, Grok, DeepSeek, and Kimi.",
    href: "/tools/prompt-evaluator",
    icon: "📊",
    badge: "Free",
  },
  {
    title: "ChatGPT to Claude Migrator",
    description:
      "Switching to Claude? Paste your ChatGPT memories or chat history and get an organized cognitive profile ready to import into Claude's memory.",
    href: "/tools/chatgpt-to-claude",
    icon: "🔄",
    badge: "Free",
  },
];

export default function ToolsPage() {
  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        Free AI Prompt Tools
      </h1>
      <p style={{ color: "var(--muted-foreground)", marginBottom: "2.5rem", fontSize: "1.05rem", lineHeight: 1.6 }}>
        Make your prompts better. Enhance them with AI or evaluate their quality across multiple LLMs — no account required for your first use.
      </p>

      <div style={{ display: "grid", gap: "1.25rem" }}>
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="pseo-card-link"
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
              <span style={{ fontSize: "2rem" }}>{tool.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                  <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 600 }}>{tool.title}</h2>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      padding: "0.15rem 0.4rem",
                      borderRadius: "4px",
                      backgroundColor: "rgba(34, 197, 94, 0.15)",
                      color: "#22c55e",
                      fontWeight: 600,
                    }}
                  >
                    {tool.badge}
                  </span>
                </div>
                <p style={{ margin: 0, color: "var(--muted-foreground)", lineHeight: 1.5 }}>
                  {tool.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <section style={{ marginTop: "3rem" }}>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 600, marginBottom: "0.75rem" }}>
          Why use prompt tools?
        </h2>
        <p style={{ color: "var(--muted-foreground)", lineHeight: 1.7, marginBottom: "1rem" }}>
          The quality of your prompt directly determines the quality of AI output. A well-structured prompt with clear constraints, context, and format guidance consistently produces better results than a vague request — regardless of which LLM you use.
        </p>
        <p style={{ color: "var(--muted-foreground)", lineHeight: 1.7 }}>
          Our tools help you close that gap. The Enhancer rewrites your prompt using proven prompt engineering techniques, the Evaluator scores it across 7 different LLMs so you know which AI will give you the best results, and the Memory Migrator lets you transfer years of ChatGPT context to Claude so you don&apos;t have to start from scratch.
        </p>
      </section>

      <section style={{ marginTop: "2.5rem" }}>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 600, marginBottom: "0.75rem" }}>
          Looking for prompt templates?
        </h2>
        <p style={{ color: "var(--muted-foreground)", lineHeight: 1.7, marginBottom: "1rem" }}>
          Browse our library of ready-to-use prompt templates for marketing, coding, SEO, email, and more.
        </p>
        <Link
          href="/prompts"
          className="btn btn-secondary"
          style={{ padding: "0.6rem 1.5rem", display: "inline-block" }}
        >
          Browse Prompt Templates
        </Link>
      </section>
    </main>
  );
}
