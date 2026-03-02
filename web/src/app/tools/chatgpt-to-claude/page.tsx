import type { Metadata } from "next";
import Link from "next/link";
import { MemoryMigratorTool } from "@/components/tools/memory-migrator-tool";
import { SEOToolCTA } from "@/components/tools/seo-tool-cta";

export const metadata: Metadata = {
  title: "Free ChatGPT to Claude Memory Migrator - Transfer Your Context | PromptPack",
  description:
    "Migrate your ChatGPT memories and context to Claude for free. Paste your ChatGPT history and get an organized cognitive profile ready to import into Claude's memory.",
  keywords: [
    "chatgpt to claude",
    "switch from chatgpt to claude",
    "migrate chatgpt to claude",
    "import chatgpt memory to claude",
    "chatgpt memory export",
    "claude memory import",
    "transfer chatgpt to claude",
    "chatgpt to claude migration tool",
  ],
  alternates: { canonical: "https://pmtpk.com/tools/chatgpt-to-claude" },
  openGraph: {
    title: "Free ChatGPT to Claude Memory Migrator | PromptPack",
    description: "Transfer years of ChatGPT context to Claude in minutes. Free cognitive profile generator.",
    url: "https://pmtpk.com/tools/chatgpt-to-claude",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Free ChatGPT to Claude Memory Migrator - PromptPack",
  description: "Migrate your ChatGPT memories and conversation context to Claude. Creates an organized cognitive profile ready for import.",
  url: "https://pmtpk.com/tools/chatgpt-to-claude",
  applicationCategory: "UtilityApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  publisher: { "@type": "Organization", name: "PromptPack" },
};

export default function ChatGPTToClaudePage() {
  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav style={{ marginBottom: "1.5rem", fontSize: "0.85rem", color: "var(--muted-foreground)" }}>
        <Link href="/tools" style={{ color: "#6366f1", textDecoration: "none" }}>Tools</Link>
        <span style={{ margin: "0 0.5rem" }}>/</span>
        <span>ChatGPT to Claude</span>
      </nav>

      <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        Free ChatGPT to Claude Memory Migrator
      </h1>
      <p style={{ color: "var(--muted-foreground)", marginBottom: "2rem", fontSize: "1.05rem", lineHeight: 1.6 }}>
        Switching to Claude? Don&apos;t start from scratch. Paste your ChatGPT memories or conversation history below and get an organized cognitive profile — ready to import into Claude so it understands who you are from day one.
      </p>

      <MemoryMigratorTool />

      {/* SEO Content */}
      <section style={{ marginTop: "3.5rem" }}>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 600, marginBottom: "0.75rem" }}>
          How it works
        </h2>
        <div style={{ display: "grid", gap: "1rem" }}>
          {[
            {
              step: "1",
              title: "Export your ChatGPT data",
              desc: "Go to ChatGPT Settings > Data Controls > Export Data. You'll receive an email with a download link (can take up to 24 hours). Or copy your memories directly from Settings > Personalization > Manage Memories.",
            },
            {
              step: "2",
              title: "Paste your content",
              desc: "Paste your ChatGPT memories, conversation excerpts, or text from your exported chat.html file. The more context you provide, the richer your profile will be.",
            },
            {
              step: "3",
              title: "Get your cognitive profile",
              desc: "Our AI analyzes your content and creates a condensed abstraction — your personality, working style, skills, decision patterns, and preferences — all organized and ready for Claude.",
            },
            {
              step: "4",
              title: "Import into Claude",
              desc: "Copy the profile and paste it into Claude Settings > Capabilities > Memory. Every new conversation will have your full context from day one.",
            },
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
              q: "What's a cognitive profile?",
              a: "A condensed abstraction of your personality, working style, technical skills, decision-making patterns, and preferences. It's synthesized from your ChatGPT history so Claude can understand you without starting from scratch.",
            },
            {
              q: "Is this really free?",
              a: "Yes. You get 1 free use per day without signing up. Create a free account for 5 daily uses, or upgrade to Pro for 50.",
            },
            {
              q: "What can I paste in?",
              a: "ChatGPT memories (from Manage Memories), conversation excerpts, or text copied from your exported chat.html file. The more context you provide, the better the profile.",
            },
            {
              q: "Where do I paste the result in Claude?",
              a: "Go to Claude Settings > Capabilities > Memory. Paste the profile with a note like \"Cognitive profile synthesized from my ChatGPT history.\" You can also use it as Claude Project instructions or a CLAUDE.md file.",
            },
            {
              q: "What about the full data export method?",
              a: "For power users with large exports (1GB+), you can use Claude's desktop app to process the full chat.html file directly. This tool is optimized for pasted text up to 15,000 characters — perfect for memories and conversation excerpts.",
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
