import React from "react";
import Link from "next/link";

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  author: string;
  tags: string[];
  content: React.ReactNode;
}

export const blogPosts: BlogPost[] = [
  {
    slug: "what-is-a-prompt-pack",
    title: "What is a Prompt Pack? How to Build Reusable AI Workflows",
    date: "2026-01-26",
    excerpt:
      "Stop rewriting the same prompts. Learn how prompt packs turn your best AI prompts into repeatable workflows across ChatGPT, Claude, and Gemini.",
    author: "PromptPack Team",
    tags: ["prompt pack", "AI prompts", "workflows", "productivity"],
    content: (
      <>
        <p>
          If you use ChatGPT, Claude, or Gemini regularly, you've probably
          noticed something: you keep writing the same prompts over and over.
          The perfect prompt you crafted last Tuesday? Buried in your chat
          history. The one that got your code review just right? Gone.
        </p>

        <p>
          A <strong>prompt pack</strong> solves this. It's a saved, organized
          collection of your best AI prompts — ready to use with a single
          click, across every AI platform you work with.
        </p>

        <h2>The Problem: Your Best Prompts Disappear</h2>

        <p>
          ChatGPT alone processes billions of prompts every day. Most of those
          prompts are written once, used once, and forgotten. But some prompts
          are genuinely great — they produce consistent, high-quality results
          every time you use them.
        </p>

        <p>The issue is that AI platforms don't make it easy to save and
          reuse prompts. Your chat history is a timeline, not a library. Trying
          to find that one prompt you wrote three weeks ago means scrolling
          through dozens of conversations, across multiple platforms.
        </p>

        <p>
          Some people copy prompts into Google Docs or Notion. That works
          until you have to switch tabs, search through pages of notes, copy
          the text, switch back to your AI tool, and paste it in. Every time.
        </p>

        <h2>What Makes a Good Prompt Pack</h2>

        <p>
          A useful prompt pack has a few key qualities:
        </p>

        <ul>
          <li>
            <strong>Organized by purpose:</strong> Group prompts by task —
            code review, email drafting, brainstorming, data analysis — not
            by date or platform.
          </li>
          <li>
            <strong>Instantly accessible:</strong> You shouldn't have to leave
            your AI conversation to find a saved prompt. It should be
            available right where you type.
          </li>
          <li>
            <strong>Cross-platform:</strong> A prompt that works great in
            ChatGPT should be just as easy to use in Claude or Gemini. Your
            library shouldn't be locked to one tool.
          </li>
          <li>
            <strong>Shareable:</strong> Teams that align on prompt standards
            produce more consistent output. Sharing a prompt pack is faster
            than writing a style guide.
          </li>
        </ul>

        <h2>How to Build Your First Prompt Pack</h2>

        <p>
          Start with the prompts you already use most often. Think about the
          tasks you repeat daily:
        </p>

        <h3>1. Identify Your Repeating Tasks</h3>

        <p>
          Look at your recent AI conversations. Which prompts did you write
          more than once? Common categories include:
        </p>

        <ul>
          <li>Code review and debugging prompts</li>
          <li>Email and communication templates</li>
          <li>Content creation and editing prompts</li>
          <li>Data analysis and summarization</li>
          <li>Meeting prep and follow-up</li>
        </ul>

        <h3>2. Refine Each Prompt</h3>

        <p>
          Before saving a prompt, make it reusable. Remove specific details
          and replace them with placeholders. A prompt like "Review my Python
          function for bugs" becomes "Review my [language] [code type] for
          [concern]." The more adaptable it is, the more you'll use it.
        </p>

        <h3>3. Organize Into Packs</h3>

        <p>
          Group related prompts together. A "Code Review Pack" might contain
          prompts for bug detection, performance optimization, security
          review, and readability improvements. A "Content Writing Pack" could
          have prompts for blog outlines, editing, SEO optimization, and
          social media posts.
        </p>

        <h3>4. Make Them Accessible</h3>

        <p>
          This is where most people fail. A prompt saved in a document you
          never open is the same as a prompt that doesn't exist. You need
          your prompts available at the point of use — inside the AI
          conversation itself.
        </p>

        <p>
          <Link href="/">PromptPack</Link> is a free Chrome extension built
          for exactly this. It adds a save button directly to ChatGPT,
          Claude, and Gemini. Save a prompt with one click, organize it into
          packs, and insert it later with a right-click — no tab switching,
          no copy-pasting.
        </p>

        <h2>From Single Prompts to Workflows</h2>

        <p>
          Once you have a collection of reliable prompts, something changes
          in how you work with AI. Instead of starting from scratch each
          time, you build on what already works. A prompt pack becomes a
          workflow:
        </p>

        <ol>
          <li>Open your AI tool</li>
          <li>Right-click to insert your saved prompt</li>
          <li>Get consistent, high-quality output</li>
          <li>Move on to the next task</li>
        </ol>

        <p>
          Teams benefit even more. When everyone uses the same prompt pack
          for code reviews, the feedback is consistent. When your marketing
          team shares a content pack, the brand voice stays aligned across
          every piece of copy.
        </p>

        <h2>Getting Started</h2>

        <p>
          Building a prompt library doesn't have to be a big project. Start
          with three to five prompts you use every week. Save them, organize
          them, and make them easy to access. You'll notice the difference
          immediately — less time writing prompts, more time using the
          results.
        </p>

        <p>
          <Link href="/">Try PromptPack for free</Link> and start building
          your first prompt pack today. It works with ChatGPT, Claude, and
          Gemini — right from your browser.
        </p>
      </>
    ),
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}
