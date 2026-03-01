import type { ComparisonPage } from "./types";

export const comparisonPages: ComparisonPage[] = [
  {
    slug: "promptpack-vs-aiprm",
    competitorName: "AIPRM",
    title: "PromptPack vs AIPRM",
    metaDescription:
      "Compare PromptPack and AIPRM side by side. See which prompt management tool offers better features, pricing, and multi-platform support in 2026.",
    competitorDescription:
      "AIPRM is a browser extension primarily for ChatGPT that provides curated prompt templates and community-submitted prompts. It offers a library of pre-built prompts organized by category, with premium tiers for additional features.",
    comparisonPoints: [
      {
        feature: "Supported AI platforms",
        promptpack: "ChatGPT, Claude, Gemini, Grok, DeepSeek, Perplexity, and more",
        competitor: "ChatGPT only",
        winner: "promptpack",
      },
      {
        feature: "Custom prompt packs",
        promptpack: "Create, encrypt, and share .pmtpk files with your own prompt collections",
        competitor: "Community prompt templates with voting system",
        winner: "promptpack",
      },
      {
        feature: "Prompt enhancement",
        promptpack: "AI-powered prompt optimizer with 4 modes (clarity, structured, concise, strict)",
        competitor: "No built-in prompt enhancement",
        winner: "promptpack",
      },
      {
        feature: "Prompt evaluation",
        promptpack: "Score prompts across 7 LLMs with detailed breakdowns",
        competitor: "Community ratings and votes",
        winner: "promptpack",
      },
      {
        feature: "Desktop app",
        promptpack: "Native Windows and macOS app with offline support",
        competitor: "Browser extension only",
        winner: "promptpack",
      },
      {
        feature: "MCP server integration",
        promptpack: "Full MCP server for IDE integration (VS Code, Cursor, etc.)",
        competitor: "No MCP support",
        winner: "promptpack",
      },
      {
        feature: "Free tier",
        promptpack: "Free with 5 saved prompts, 6 packs, 10 enhances/day",
        competitor: "Free with basic community prompts",
        winner: "tie",
      },
      {
        feature: "Pricing",
        promptpack: "Pro from $9/mo (early bird $1.99/mo)",
        competitor: "Plus from $9/mo",
        winner: "promptpack",
      },
    ],
    verdict:
      "PromptPack is the better choice if you use multiple AI platforms beyond just ChatGPT. Its multi-platform support, AI-powered enhancement, cross-LLM evaluation, and desktop app make it a more versatile tool for serious prompt engineers. AIPRM is a solid option if you only use ChatGPT and want access to a large library of community-created templates.",
    targetKeywords: [
      "PromptPack vs AIPRM",
      "AIPRM alternative",
      "best prompt tool comparison",
    ],
  },
  {
    slug: "promptpack-vs-promptperfect",
    competitorName: "PromptPerfect",
    title: "PromptPack vs PromptPerfect",
    metaDescription:
      "Compare PromptPack and PromptPerfect for AI prompt optimization. See features, pricing, and which tool is better for managing and enhancing prompts in 2026.",
    competitorDescription:
      "PromptPerfect is a web-based prompt optimization tool that uses AI to improve prompts for various LLMs. It focuses on prompt engineering with an interactive editor and supports multiple AI models.",
    comparisonPoints: [
      {
        feature: "Prompt optimization",
        promptpack: "4 enhancement modes with model-aware optimization",
        competitor: "AI-powered prompt optimization with interactive editor",
        winner: "tie",
      },
      {
        feature: "Browser integration",
        promptpack: "Chrome, Firefox, and Safari extensions that work directly on AI chat sites",
        competitor: "Web-based tool only — requires copy-pasting between tabs",
        winner: "promptpack",
      },
      {
        feature: "Prompt library",
        promptpack: "Build personal prompt collections as portable .pmtpk files",
        competitor: "Save prompts in the web app",
        winner: "promptpack",
      },
      {
        feature: "Offline access",
        promptpack: "Desktop app with local storage and offline prompt management",
        competitor: "Requires internet connection",
        winner: "promptpack",
      },
      {
        feature: "Multi-LLM evaluation",
        promptpack: "Evaluate prompt effectiveness across 7 different LLMs simultaneously",
        competitor: "Single model optimization",
        winner: "promptpack",
      },
      {
        feature: "Developer tools",
        promptpack: "MCP server, npm package, CLI integration",
        competitor: "API access on premium plans",
        winner: "promptpack",
      },
      {
        feature: "Pricing",
        promptpack: "Free tier available, Pro from $9/mo",
        competitor: "Free tier with limits, Pro from $9.99/mo",
        winner: "promptpack",
      },
    ],
    verdict:
      "PromptPack offers a more integrated workflow with browser extensions that work directly on AI chat sites, eliminating the copy-paste cycle. PromptPerfect has a polished web-based optimization experience, but PromptPack's combination of in-browser prompt management, offline desktop app, and developer tools like MCP server integration make it more practical for daily use.",
    targetKeywords: [
      "PromptPack vs PromptPerfect",
      "PromptPerfect alternative",
      "prompt optimization tool comparison",
    ],
  },
  {
    slug: "promptpack-vs-flowgpt",
    competitorName: "FlowGPT",
    title: "PromptPack vs FlowGPT",
    metaDescription:
      "Compare PromptPack and FlowGPT for prompt management and sharing. See which platform offers better tools for building, sharing, and using AI prompts in 2026.",
    competitorDescription:
      "FlowGPT is a community-driven platform for sharing and discovering AI prompts and chatbot characters. It features a marketplace-style interface where users can browse, share, and interact with prompts created by the community.",
    comparisonPoints: [
      {
        feature: "Focus",
        promptpack: "Professional prompt management, enhancement, and workflow optimization",
        competitor: "Community prompt sharing and chatbot characters",
        winner: "tie",
      },
      {
        feature: "Prompt quality tools",
        promptpack: "AI enhancement (4 modes) + multi-LLM evaluation scoring",
        competitor: "Community voting and usage counts",
        winner: "promptpack",
      },
      {
        feature: "Workflow integration",
        promptpack: "Browser extensions, desktop app, MCP server — use prompts where you work",
        competitor: "Web platform with in-app chat interface",
        winner: "promptpack",
      },
      {
        feature: "Prompt portability",
        promptpack: "Export as encrypted .pmtpk files, share with teams, use offline",
        competitor: "Prompts live on the FlowGPT platform",
        winner: "promptpack",
      },
      {
        feature: "AI platform support",
        promptpack: "Works on ChatGPT, Claude, Gemini, Grok, DeepSeek, Perplexity, and more",
        competitor: "Built-in chat interface with selected models",
        winner: "promptpack",
      },
      {
        feature: "Community",
        promptpack: "Growing marketplace for prompt packs",
        competitor: "Large community with millions of shared prompts and characters",
        winner: "competitor",
      },
      {
        feature: "Privacy",
        promptpack: "Prompts stored locally or encrypted — you own your data",
        competitor: "All prompts are public by default on the platform",
        winner: "promptpack",
      },
    ],
    verdict:
      "PromptPack and FlowGPT serve different needs. FlowGPT excels as a community discovery platform with a massive library of shared prompts and chatbot characters. PromptPack is built for professionals who want to manage, enhance, and deploy their own prompts across multiple AI platforms with privacy and portability. If you're looking for a production-ready prompt workflow tool rather than a social browsing experience, PromptPack is the better fit.",
    targetKeywords: [
      "PromptPack vs FlowGPT",
      "FlowGPT alternative",
      "prompt sharing platform comparison",
    ],
  },
];

export function getComparison(slug: string): ComparisonPage | undefined {
  return comparisonPages.find((c) => c.slug === slug);
}
