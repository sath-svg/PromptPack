import type { ComparisonPage } from "./types";

export const comparisonPages: ComparisonPage[] = [
  {
    slug: "skillset-vs-claude-code",
    competitorName: "Claude Code",
    title: "Skillset vs Claude Code",
    metaDescription:
      "Compare Skillset and Claude Code side by side. See how the multi-model agent + Skill Flow workflow chains stack up against Anthropic's single-model coding agent in 2026.",
    competitorDescription:
      "Claude Code is Anthropic's terminal + desktop coding agent. It runs on Claude models (Sonnet, Opus, Haiku) with tool access to the filesystem, shell, and Git. Strong at agentic dev tasks inside a single workspace; tied to Anthropic's model family.",
    comparisonPoints: [
      {
        feature: "Model coverage",
        promptpack:
          "Auto-routes across Claude, GPT-5, Gemini, Grok, DeepSeek, Llama. One credit pool, per-task tier selection (Fast/Mid/Frontier).",
        competitor: "Claude family only (Sonnet, Opus, Haiku).",
        winner: "promptpack",
      },
      {
        feature: "Multi-step workflows",
        promptpack:
          "Skill Flow orchestrator decomposes a goal into subtasks, runs them sequentially, persists generated files between steps, and references prior outputs explicitly.",
        competitor: "Single-shot agent loop. Multi-step work happens inside one run, no formal chain artifact.",
        winner: "promptpack",
      },
      {
        feature: "Prompt packs",
        promptpack:
          "Build reusable .skill packs with `{variable}` placeholders. Run a pack end-to-end with each step inheriting the previous step's output. Share via marketplace or file.",
        competitor: "Custom slash commands + skills (markdown files). No managed sequential pack runner.",
        winner: "promptpack",
      },
      {
        feature: "Workspace integration",
        promptpack:
          "Native Tauri desktop app. Connect a folder, agent reads/writes files, drops a Skillset.md skill into `.skillset/` automatically. Diff-review on every edit.",
        competitor: "Terminal-first + desktop. Reads/writes files via tools. Comparable workspace agent.",
        winner: "tie",
      },
      {
        feature: "Skill Preset (art style mimicry)",
        promptpack:
          "Upload reference images → Vision LLM extracts hex palette, line weight, signature elements → generates 5-prompt skillset (image/video/character/setting/mood) → DALL-E 3 previews.",
        competitor: "No image-style extraction or image generation.",
        winner: "promptpack",
      },
      {
        feature: "Pricing",
        promptpack:
          "Significantly cheaper than Anthropic's pricing for the same model usage, with predictable monthly caps. Free tier + paid plans with built-in spending limits so you don't get surprise bills.",
        competitor: "Anthropic API pricing + Claude Pro / Max subscriptions for the desktop app.",
        winner: "promptpack",
      },
      {
        feature: "Open ecosystem",
        promptpack: "Vendor-neutral. Switch providers without changing prompts or packs.",
        competitor: "Anthropic ecosystem. Best Claude experience; not designed for non-Claude models.",
        winner: "promptpack",
      },
    ],
    verdict:
      "Claude Code is the best agentic-coding experience for Claude models specifically — deep tool integration, fast feedback loop, strong at long-horizon refactors. Skillset wins when you want multi-model auto-routing (cheap tier for lookups, frontier for hard tasks), reusable prompt packs as sequential workflows (SkillFlow), browser-side prompt management on ChatGPT/Gemini/Grok, and creative tools like Skill Preset for image style mimicry. They're complementary: run Claude Code for deep refactors and Skillset for everything else.",
    targetKeywords: [
      "Skillset vs Claude Code",
      "Claude Code alternative",
      "multi-model AI agent comparison",
      "Skill Flow vs Claude Code",
    ],
  },
  {
    slug: "skillset-vs-chatgpt",
    competitorName: "ChatGPT",
    title: "Skillset vs ChatGPT",
    metaDescription:
      "Compare Skillset and ChatGPT. See how a multi-model router + workflow chains stack up against OpenAI's flagship chat product for serious prompt and agent workflows.",
    competitorDescription:
      "ChatGPT is OpenAI's chat product. Single product surface (web/mobile/desktop), one model family (GPT-5 / GPT-4o / o-series), with features like Projects, GPTs (custom assistants), Code Interpreter, and DALL-E image generation built in.",
    comparisonPoints: [
      {
        feature: "Model coverage",
        promptpack:
          "Auto-routes across GPT-5, Claude, Gemini, Grok, DeepSeek, Llama. Per-task model picked by classifier; you stay in one app.",
        competitor: "GPT family only. No native access to Claude/Gemini/etc.",
        winner: "promptpack",
      },
      {
        feature: "Multi-step workflows",
        promptpack:
          "Skill Flow chains a pack's prompts sequentially. Each step inherits prior step's text + generated files + variables. Designed for reusable multi-prompt tasks.",
        competitor:
          "Custom GPTs + memory + Projects help with context, but multi-step prompt chaining is manual (you run each turn yourself).",
        winner: "promptpack",
      },
      {
        feature: "Workspace agent",
        promptpack:
          "Connect a local folder → agent reads, edits, runs code with diff review. Auto-drops Skillset.md skill spec into workspace.",
        competitor:
          "No local workspace. Code Interpreter runs in a sandboxed cloud environment; files don't persist to your machine.",
        winner: "promptpack",
      },
      {
        feature: "Image generation (style mimicry)",
        promptpack:
          "Skill Preset extracts an artist's style (palette, line weight, signature quirks) from reference images and generates 5 reusable prompts (image/video/character/setting/mood). DALL-E 3 used under the hood when configured.",
        competitor:
          "DALL-E 3 + GPT Image-1 directly available in chat. No structured style-extraction or reusable prompt set.",
        winner: "promptpack",
      },
      {
        feature: "Prompt portability",
        promptpack:
          "Encrypted .skill files you can share, version-control, or sell on the marketplace. Your prompts, your files.",
        competitor:
          "GPTs live on chatgpt.com. No export to a portable file format.",
        winner: "promptpack",
      },
      {
        feature: "Privacy & ownership",
        promptpack:
          "Prompts can stay local (Free tier) or sync encrypted to your account. BYOK keeps requests off Skillset entirely.",
        competitor:
          "All conversations + GPTs stored on OpenAI infrastructure. Trained-on-by-default unless toggled off.",
        winner: "promptpack",
      },
      {
        feature: "Pricing",
        promptpack:
          "Significantly cheaper than OpenAI's plans for the same model usage, with predictable monthly caps. Pay-per-use without flat seat fees, and built-in spending limits so you don't get surprise bills.",
        competitor:
          "Free, Plus $20/mo, Pro $200/mo, Team $30/seat. Per-seat, not per-task.",
        winner: "promptpack",
      },
    ],
    verdict:
      "ChatGPT is the polished default for general chat + GPT-only workflows: tightly integrated DALL-E, Code Interpreter sandbox, GPTs marketplace, mobile apps. Skillset is the right choice when you want multi-model routing (so easy questions don't burn frontier-tier credits), reusable prompt chains with persistent generated files (Skill Flow), a workspace agent that touches YOUR local files with diff review, and portable encrypted prompt packs you actually own. Many users run both — ChatGPT for casual chat, Skillset for serious prompt engineering and agentic work across providers.",
    targetKeywords: [
      "Skillset vs ChatGPT",
      "ChatGPT alternative",
      "multi-model AI assistant",
      "ChatGPT workflow automation",
    ],
  },
];

export function getComparison(slug: string): ComparisonPage | undefined {
  return comparisonPages.find((c) => c.slug === slug);
}
