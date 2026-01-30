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
    slug: "how-to-write-great-prompts-for-ai-workflows",
    title: "How to Write Great Prompts That Actually Work as Workflows",
    date: "2026-01-31",
    excerpt:
      "26 research-backed prompt engineering principles that work across ChatGPT, Claude, and Gemini. Build prompts you can save, reuse, and turn into workflows.",
    author: "PromptPack Team",
    tags: ["prompt engineering", "AI workflows", "ChatGPT", "prompt pack", "productivity"],
    content: (
      <>
        <p>
          Writing a prompt is easy. Writing a prompt that works consistently
          across ChatGPT, Claude, and Gemini — one you can save and reuse as a
          workflow — takes a bit more structure.
        </p>

        <p>
          The good news: researchers have studied what makes prompts work.
          After analyzing the top 70 most-cited prompt engineering papers,
          certain principles keep appearing. These aren't hacks that break with
          the next model update. They're fundamentals that work across every
          major AI platform.
        </p>

        <p>
          Here's how to apply them to build prompts worth saving in your prompt
          pack.
        </p>

        <h2>Why Most Prompts Fail</h2>

        <p>
          Most people write prompts like text messages: vague, casual, missing
          context. "Write me a blog post about AI" might produce something, but
          it won't be what you needed.
        </p>

        <p>
          The problem is assumptions. Every detail you leave unstated is a
          decision the AI makes for you — often wrongly. Workflow-ready prompts
          eliminate this guesswork by providing enough structure to produce
          consistent output every time.
        </p>

        <h2>26 Research-Backed Prompt Principles</h2>

        <p>
          These principles have survived multiple model generations. Build your
          prompts with these, and they'll work whether you're using ChatGPT,
          Claude, Gemini, or whatever comes next.
        </p>

        <h3>Structure & Format</h3>

        <p>
          <strong>Use delimiters to separate sections clearly.</strong> Triple
          quotes, XML tags, or markdown headers help the AI understand where
          one instruction ends and another begins.
        </p>

        <p>
          <strong>Use structured markdown format.</strong> Headers like{" "}
          <code>###Instruction###</code>, <code>###Example###</code>, and{" "}
          <code>###Output###</code> create clear boundaries the model can parse.
        </p>

        <p>
          <strong>Break down complex tasks into smaller steps.</strong> Instead
          of "analyze this data and create a report," specify each step:
          "First, identify the key metrics. Then, compare them to benchmarks.
          Finally, summarize the findings."
        </p>

        <p>
          <strong>Use output primers.</strong> Start the response with the
          anticipated structure. If you want a list, end your prompt with "1."
          If you want JSON, provide the opening bracket.
        </p>

        <h3>Directive Language</h3>

        <p>
          <strong>Employ affirmative directives.</strong> Say "do" instead of
          "don't." Tell the AI what to do, not what to avoid.
        </p>

        <p>
          <strong>Use directive phrasing with capitalization.</strong> Phrases
          like "Your task is..." and "You MUST..." signal importance and create
          clear expectations.
        </p>

        <p>
          <strong>Skip polite fillers.</strong> Get straight to the task.
          "Please, if you don't mind" adds nothing. "Summarize this document"
          is clearer.
        </p>

        <p>
          <strong>Use compliance reinforcement.</strong> Phrases like "You will
          be penalized if you skip steps" can improve adherence to complex
          instructions.
        </p>

        <p>
          <strong>Repeat key terms for emphasis.</strong> If accuracy matters,
          say it twice. "Accuracy is critical. Double-check all figures for
          accuracy."
        </p>

        <h3>Reasoning & Depth</h3>

        <p>
          <strong>Use leading words like "think step by step."</strong> This
          triggers chain-of-thought reasoning, improving performance on complex
          tasks.
        </p>

        <p>
          <strong>Combine chain-of-thought with examples.</strong> Show the
          reasoning process you want, then let the model continue the pattern.
        </p>

        <p>
          <strong>Encourage detailed explanations.</strong> Ask for reasoning:
          "Explain your approach before providing the answer."
        </p>

        <p>
          <strong>Write in full detail.</strong> "Write a detailed paragraph on
          X" produces better results than "write about X."
        </p>

        <p>
          <strong>Use teach-test prompting.</strong> Have the model explain a
          concept, then test its understanding by asking it to apply the
          concept.
        </p>

        <h3>Context & Role</h3>

        <p>
          <strong>Assign a role to the model.</strong> "You are a senior
          software engineer specializing in Python security" produces more
          focused output than no role at all.
        </p>

        <p>
          <strong>Integrate the intended audience.</strong> "Explain this to a
          junior developer" produces different output than "explain this to a
          CTO."
        </p>

        <p>
          <strong>Match the style of a provided text.</strong> Include a sample
          and say "match this tone and style" for consistent voice across
          outputs.
        </p>

        <p>
          <strong>Clearly state requirements and constraints.</strong> Rules,
          policies, word limits, format requirements — state them explicitly.
        </p>

        <h3>Interaction Patterns</h3>

        <p>
          <strong>Allow clarifying questions before the model answers.</strong>{" "}
          "Before answering, ask me 3 clarifying questions" prevents
          assumptions.
        </p>

        <p>
          <strong>Allow interactive continuation from partial input.</strong>{" "}
          Start a response and let the model complete it in your established
          style.
        </p>

        <p>
          <strong>Use few-shot prompting.</strong> Provide 2-3 examples of the
          input-output pattern you want. The model learns from the pattern.
        </p>

        <p>
          <strong>Use natural-language phrasing for questions.</strong> Ask
          questions the way you'd ask a colleague, not in keyword fragments.
        </p>

        <h3>Quality & Output</h3>

        <p>
          <strong>Ensure answers are unbiased.</strong> Add "provide a balanced
          perspective" or "consider multiple viewpoints" for sensitive topics.
        </p>

        <p>
          <strong>Revise text for clarity without changing meaning.</strong>{" "}
          For editing tasks, explicitly state that the original meaning must be
          preserved.
        </p>

        <p>
          <strong>Add incentive phrasing.</strong> "I'll tip $200 for perfect
          work" sounds silly, but research shows it can improve output quality.
        </p>

        <p>
          <strong>For coding tasks, create unified scripts.</strong> Ask for
          complete, runnable code rather than fragments.
        </p>

        <h2>The Workflow Prompt Framework</h2>

        <p>
          These 26 principles combine into a reusable framework. Here's the
          structure:
        </p>

        <pre>
{`###Role###
You are a [specific role] specializing in [domain].
Your expertise includes [relevant skills].

###Context###
The intended audience is [audience description].
This task requires [specific requirements/constraints].

###Task###
Your task is to [clear directive using affirmative language].

Think step by step:
1. First, [step one]
2. Then, [step two]
3. Finally, [step three]

###Requirements###
You MUST:
- [requirement 1]
- [requirement 2]
- [requirement 3]

###Examples###
Input: [example input]
Output: [example output]

###Clarification###
Before proceeding, ask me 2-3 clarifying questions about
[aspects that might need clarification].

###Output Format###
Structure your response as:`}
        </pre>

        <p>
          This framework hits most of the 26 principles in a single template.
          Save it as the foundation of your prompt pack and adapt it for
          specific tasks.
        </p>

        <h2>Practical Examples</h2>

        <h3>Code Review Prompt</h3>

        <pre>
{`###Role###
You are a senior software engineer specializing in
[language] with expertise in security and performance.

###Task###
Your task is to review the following code.

Think step by step:
1. First, check for security vulnerabilities
2. Then, identify performance issues
3. Finally, assess readability and maintainability

###Requirements###
You MUST:
- Provide specific line references
- Explain why each issue matters
- Suggest concrete fixes

###Clarification###
Before reviewing, ask me:
- What is this code's primary function?
- Are there specific concerns I should prioritize?
- What's the performance context (high-traffic, batch, etc.)?

###Output Format###
Structure your review as:
1. Critical Issues
2. Performance Concerns
3. Code Quality Suggestions
4. Summary`}
        </pre>

        <h3>Content Editing Prompt</h3>

        <pre>
{`###Role###
You are a professional editor specializing in [content type].
Your audience is [target reader description].

###Task###
Your task is to edit the following text for clarity,
flow, and engagement.

Think step by step:
1. First, identify structural issues
2. Then, improve sentence-level clarity
3. Finally, enhance engagement and flow

###Requirements###
You MUST:
- Preserve the original meaning
- Maintain the author's voice
- Explain significant changes

###Style Reference###
Match this tone: [paste sample text]

###Output Format###
Provide:
1. Edited text
2. Summary of major changes
3. Questions about intent (if any sections were unclear)`}
        </pre>

        <h3>Research Summary Prompt</h3>

        <pre>
{`###Role###
You are a research analyst specializing in [field].
Your audience is [decision-makers/technical team/general readers].

###Task###
Your task is to summarize the following research.

Think step by step:
1. First, identify the key findings
2. Then, assess the methodology strength
3. Finally, note limitations and implications

###Requirements###
You MUST:
- Cite specific data points
- Distinguish between findings and interpretations
- Flag any potential biases

###Output Format###
Structure as:
1. Key Findings (bullet points)
2. Methodology Assessment
3. Limitations
4. Practical Implications`}
        </pre>

        <h2>From Prompts to Prompt Packs</h2>

        <p>
          A single great prompt is useful. A library of great prompts — a
          prompt pack — is transformative.
        </p>

        <p>
          Think about your weekly tasks: code reviews, email drafting, content
          editing, data analysis, meeting summaries. Each deserves its own
          workflow prompt, built on these research-backed principles.
        </p>

        <p>
          The key is accessibility. A prompt buried in a Google Doc might as
          well not exist. You need your prompts available at the point of use —
          right where you're talking to the AI.
        </p>

        <p>
          <Link href="/">PromptPack</Link> is built for exactly this. Save
          prompts directly from ChatGPT, Claude, or Gemini with one click.
          Organize them into packs by task. Insert them with a right-click
          whenever you need them. Your prompts become actual workflows.
        </p>

        <h2>Building Your Prompt Pack</h2>

        <p>Start this week:</p>

        <ol>
          <li>
            <strong>Pick three tasks</strong> you do repeatedly with AI
          </li>
          <li>
            <strong>Apply the framework</strong> to create structured prompts
            for each
          </li>
          <li>
            <strong>Test and refine</strong> until they produce consistent
            results
          </li>
          <li>
            <strong>Save them</strong> somewhere you'll actually use them
          </li>
        </ol>

        <p>
          The 26 principles aren't rules to memorize — they're tools to reach
          for. Use delimiters when your prompt has multiple sections. Add
          few-shot examples when the output format matters. Assign a role when
          you need specialized knowledge.
        </p>

        <p>
          Build prompts worth saving. Then save them in a prompt pack you'll
          actually use.
        </p>

        <p>
          <Link href="/">Try PromptPack</Link> to build your library directly
          inside ChatGPT, Claude, and Gemini. Your workflow prompts stay one
          click away, ready to use across every AI platform.
        </p>
      </>
    ),
  },
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
