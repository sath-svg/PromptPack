import type { Metadata } from "next";
import Link from "next/link";
import { EvaluatorTool } from "@/components/tools/evaluator-tool";
import { SEOToolCTA } from "@/components/tools/seo-tool-cta";

export const metadata: Metadata = {
  title: "Free AI Prompt Evaluator - Score Your Prompts Across 7 LLMs | PromptPack",
  description:
    "Evaluate your AI prompts for free. Get a quality score across ChatGPT, Claude, Gemini, Perplexity, Grok, DeepSeek, and Kimi. See which LLM your prompt works best with.",
  keywords: [
    "prompt evaluator",
    "prompt evaluation tool",
    "AI prompt grader",
    "prompt quality checker",
    "rate my prompt",
    "prompt score",
    "best LLM for my prompt",
  ],
  alternates: { canonical: "https://pmtpk.com/tools/prompt-evaluator" },
  openGraph: {
    title: "Free AI Prompt Evaluator | PromptPack",
    description: "Score your prompt across 7 LLMs. See which AI assistant your prompt works best with.",
    url: "https://pmtpk.com/tools/prompt-evaluator",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Free AI Prompt Evaluator - PromptPack",
  description: "Evaluate and score your AI prompts across 7 major LLMs including ChatGPT, Claude, and Gemini.",
  url: "https://pmtpk.com/tools/prompt-evaluator",
  applicationCategory: "UtilityApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  publisher: { "@type": "Organization", name: "PromptPack" },
};

export default function PromptEvaluatorPage() {
  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav style={{ marginBottom: "1.5rem", fontSize: "0.85rem", color: "var(--muted-foreground)" }}>
        <Link href="/tools" style={{ color: "#6366f1", textDecoration: "none" }}>Tools</Link>
        <span style={{ margin: "0 0.5rem" }}>/</span>
        <span>Prompt Evaluator</span>
      </nav>

      <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        Free AI Prompt Evaluator
      </h1>
      <p style={{ color: "var(--muted-foreground)", marginBottom: "2rem", fontSize: "1.05rem", lineHeight: 1.6 }}>
        Paste your prompt below to see how well it performs across 7 major AI models. Get per-LLM scores based on clarity, specificity, task alignment, predictability, and completeness.
      </p>

      <EvaluatorTool />

      {/* SEO Content */}
      <section style={{ marginTop: "3.5rem" }}>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 600, marginBottom: "0.75rem" }}>
          What does the evaluator measure?
        </h2>
        <div style={{ display: "grid", gap: "1rem" }}>
          {[
            { title: "Clarity (25%)", desc: "Is your prompt unambiguous? Can the AI interpret it in exactly one way?" },
            { title: "Specificity (25%)", desc: "Does it provide enough context, constraints, and details for a quality response?" },
            { title: "Task Alignment (20%)", desc: "How well does your task match each LLM's strengths? A coding prompt scores higher on DeepSeek than on Kimi." },
            { title: "Response Predictability (15%)", desc: "Will the AI produce consistent, quality output every time you run this prompt?" },
            { title: "Completeness (15%)", desc: "Does your prompt include format, length, tone, and output expectations?" },
          ].map((item) => (
            <div key={item.title}>
              <h3 style={{ margin: "0 0 0.2rem", fontSize: "0.95rem", fontWeight: 600 }}>{item.title}</h3>
              <p style={{ margin: 0, color: "var(--muted-foreground)", fontSize: "0.9rem", lineHeight: 1.5 }}>{item.desc}</p>
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
              q: "How is the overall score calculated?",
              a: "The overall score is the average of all 7 LLM-specific scores. Each LLM score combines the five evaluation metrics weighted by their importance, adjusted for how well your task matches that LLM's strengths.",
            },
            {
              q: "Why do scores differ between LLMs?",
              a: "Different AI models have different strengths. A prompt asking for code will score higher on DeepSeek (code specialist) than on Kimi (document analysis specialist). The evaluator accounts for these differences.",
            },
            {
              q: "What score should I aim for?",
              a: "70+ is good for most use cases. 85+ means your prompt is well-engineered. Below 50 suggests significant room for improvement — try our Prompt Enhancer to improve it.",
            },
            {
              q: "Is this free to use?",
              a: "Yes. You get 1 free evaluation per day without signing up. Create a free account for 5 daily evaluations, or upgrade to Pro for 50.",
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
