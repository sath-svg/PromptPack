import type { PromptCategory, PromptTemplate, Platform } from "./types";

export const promptCategories: PromptCategory[] = [
  // ── Marketing ──────────────────────────────────────────────────────────
  {
    slug: "marketing",
    title: "Marketing Prompts",
    description:
      "AI prompt templates for marketing campaigns, ad copy, brand messaging, and growth strategies. Ready to paste into ChatGPT, Claude, or Gemini.",
    longDescription:
      "Craft high-converting marketing copy, plan product launches, and build brand narratives with these tested prompt templates. Each template is designed for real marketing workflows — from writing Google Ads headlines to building full content calendars. Paste them into any major AI assistant and customize the bracketed placeholders to match your brand.",
    icon: "📣",
    keywords: [
      "marketing prompts",
      "AI marketing templates",
      "ChatGPT marketing",
      "ad copy prompts",
    ],
    relatedCategories: ["seo", "email", "social-media"],
    templates: [
      {
        slug: "product-launch-announcement",
        title: "Product Launch Announcement",
        description:
          "Generate a compelling product launch announcement for multiple channels.",
        prompt:
          "You are a senior marketing strategist. Write a product launch announcement for [PRODUCT NAME], a [PRODUCT TYPE] that [KEY BENEFIT]. Target audience: [AUDIENCE]. Include:\n\n1. A punchy headline (under 10 words)\n2. A 2-sentence elevator pitch\n3. Three key feature highlights with benefits\n4. A social media post version (under 280 characters)\n5. An email subject line with 3 alternatives\n\nTone: [TONE, e.g., professional, playful, bold]. Avoid generic superlatives — use specific, concrete language.",
        category: "marketing",
        tags: ["product launch", "announcement", "copywriting"],
        useCase:
          "Create launch messaging across channels when releasing a new product or feature.",
        exampleInput:
          'PRODUCT NAME: AirDesk Pro, PRODUCT TYPE: standing desk with built-in air purifier, KEY BENEFIT: improves posture and air quality simultaneously, AUDIENCE: remote workers aged 25-45, TONE: modern and confident',
        exampleOutput:
          'Headline: "Breathe Better. Stand Taller. Work Smarter."\nElevator pitch: AirDesk Pro combines an ergonomic standing desk with a medical-grade HEPA air purifier, so you can improve your posture and breathe clean air without adding another gadget to your office...',
        targetKeywords: [
          "product launch prompt",
          "launch announcement template",
          "AI product launch copy",
        ],
        relatedTemplates: ["value-proposition-generator", "landing-page-copy"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "value-proposition-generator",
        title: "Value Proposition Generator",
        description:
          "Create a clear, differentiated value proposition for any product or service.",
        prompt:
          "Act as a brand positioning expert. Create a value proposition for [COMPANY/PRODUCT] that competes in the [INDUSTRY] space.\n\nContext:\n- Target customer: [CUSTOMER DESCRIPTION]\n- Main competitors: [COMPETITOR 1], [COMPETITOR 2]\n- Key differentiator: [WHAT MAKES YOU DIFFERENT]\n\nDeliver:\n1. A one-sentence value proposition (format: We help [WHO] do [WHAT] by [HOW], unlike [ALTERNATIVE])\n2. Three supporting proof points\n3. A before/after comparison from the customer's perspective\n4. A headline version for a landing page hero section",
        category: "marketing",
        tags: ["value proposition", "positioning", "brand strategy"],
        useCase:
          "Define your product positioning for landing pages, pitch decks, and brand guidelines.",
        targetKeywords: [
          "value proposition template",
          "AI value proposition generator",
          "brand positioning prompt",
        ],
        relatedTemplates: [
          "product-launch-announcement",
          "landing-page-copy",
        ],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "landing-page-copy",
        title: "Landing Page Copy Generator",
        description:
          "Write high-converting landing page copy with headline, subhead, features, and CTA.",
        prompt:
          "You are a conversion copywriter. Write landing page copy for [PRODUCT/SERVICE].\n\nDetails:\n- Offer: [WHAT YOU'RE SELLING]\n- Price: [PRICE/PRICING MODEL]\n- Target audience: [WHO IT'S FOR]\n- Primary pain point: [MAIN PROBLEM IT SOLVES]\n- Desired action: [CTA, e.g., Start free trial, Book a demo]\n\nWrite these sections:\n1. Hero: Headline (under 8 words), subheadline (1 sentence), CTA button text\n2. Problem section: 3 pain points your audience faces\n3. Solution section: How your product solves each pain point\n4. Social proof section: Suggest 3 types of proof to include (testimonial angles, stats, logos)\n5. Final CTA section: Urgency-driven closing copy\n\nUse the PAS framework (Problem-Agitate-Solve). Write for scanning — short paragraphs, bullet points.",
        category: "marketing",
        tags: ["landing page", "conversion copy", "CTA"],
        useCase:
          "Generate full landing page copy structure for a new product or campaign page.",
        targetKeywords: [
          "landing page copy prompt",
          "AI landing page generator",
          "conversion copywriting template",
        ],
        relatedTemplates: [
          "value-proposition-generator",
          "google-ads-copy",
        ],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "google-ads-copy",
        title: "Google Ads Copy Writer",
        description:
          "Generate Google Ads headlines and descriptions that follow character limits.",
        prompt:
          "You are a Google Ads specialist. Write ad copy for [PRODUCT/SERVICE] targeting the keyword \"[TARGET KEYWORD]\".\n\nRules:\n- Headlines: Max 30 characters each. Write 10 headline variations.\n- Descriptions: Max 90 characters each. Write 4 description variations.\n- Include at least 2 headlines with numbers or statistics\n- Include at least 1 headline as a question\n- Include the target keyword naturally in at least 3 headlines\n\nTarget audience: [AUDIENCE]\nUnique selling point: [USP]\nCTA focus: [DESIRED ACTION]\n\nFormat the output as a table with character counts.",
        category: "marketing",
        tags: ["Google Ads", "PPC", "ad copy", "SEM"],
        useCase:
          "Quickly generate compliant Google Ads copy variations for A/B testing.",
        targetKeywords: [
          "Google Ads copy prompt",
          "PPC ad copy template",
          "AI Google Ads generator",
        ],
        relatedTemplates: [
          "landing-page-copy",
          "social-media-ad-variants",
        ],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "social-media-ad-variants",
        title: "Social Media Ad Variants",
        description:
          "Create multiple ad copy variations for Facebook, Instagram, and LinkedIn.",
        prompt:
          "Create social media ad copy for [PRODUCT/SERVICE] across three platforms.\n\nCampaign goal: [GOAL: awareness / traffic / conversions]\nTarget audience: [AUDIENCE DESCRIPTION]\nOffer/hook: [WHAT YOU'RE PROMOTING]\nBudget tier: [LOW/MEDIUM/HIGH]\n\nFor each platform, write:\n\n**Facebook (Feed Ad):**\n- Primary text (125 chars max for above-fold)\n- Headline (40 chars max)\n- Description (30 chars max)\n- 2 alternative primary text variations\n\n**Instagram (Story/Reel caption):**\n- Caption (under 150 chars)\n- 5 relevant hashtags\n- CTA overlay text suggestion\n\n**LinkedIn (Sponsored Post):**\n- Post text (under 300 chars, professional tone)\n- Headline for the link preview\n\nKeep copy platform-appropriate — casual for IG, professional for LinkedIn, benefit-driven for FB.",
        category: "marketing",
        tags: ["social media ads", "Facebook Ads", "Instagram", "LinkedIn"],
        useCase:
          "Generate platform-specific ad copy from a single campaign brief.",
        targetKeywords: [
          "social media ad copy prompt",
          "Facebook ad template",
          "AI ad copy generator",
        ],
        relatedTemplates: ["google-ads-copy", "content-calendar-generator"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "content-calendar-generator",
        title: "Content Calendar Generator",
        description:
          "Plan a month of content across channels with themes, formats, and posting schedule.",
        prompt:
          "Create a 4-week content calendar for [BRAND/COMPANY] in the [INDUSTRY] space.\n\nGoals: [CONTENT GOALS, e.g., brand awareness, lead gen, engagement]\nChannels: [LIST CHANNELS, e.g., Blog, LinkedIn, Twitter, Newsletter]\nContent pillars: [2-4 THEMES, e.g., industry insights, product tips, customer stories]\nPosting frequency: [e.g., Blog 2x/week, Social daily, Newsletter weekly]\n\nFor each week, provide:\n- Theme of the week\n- Content pieces with: title, format (blog/video/carousel/thread), channel, brief description (1 sentence), target keyword or hashtag\n\nFormat as a table with columns: Day | Channel | Format | Title | Notes\n\nInclude a mix of educational, promotional, and engagement content (80/20 rule: 80% value, 20% promotion).",
        category: "marketing",
        tags: ["content calendar", "content strategy", "planning"],
        useCase:
          "Plan a full month of content across all your marketing channels.",
        targetKeywords: [
          "content calendar prompt",
          "AI content calendar generator",
          "content planning template",
        ],
        relatedTemplates: [
          "social-media-ad-variants",
          "blog-post-outline",
        ],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
    ],
  },

  // ── Coding ─────────────────────────────────────────────────────────────
  {
    slug: "coding",
    title: "Coding & Development Prompts",
    description:
      "AI prompt templates for writing code, debugging, code review, architecture design, and developer productivity. Works with ChatGPT, Claude, and Gemini.",
    longDescription:
      "Speed up your development workflow with tested prompt templates for writing clean code, debugging tricky issues, designing system architecture, and automating code reviews. These templates are structured to give AI assistants the context they need to produce production-quality code rather than toy examples.",
    icon: "💻",
    keywords: [
      "coding prompts",
      "AI coding templates",
      "ChatGPT coding",
      "developer prompts",
    ],
    relatedCategories: ["data-analysis", "productivity"],
    templates: [
      {
        slug: "code-review-assistant",
        title: "Code Review Assistant",
        description:
          "Get a thorough code review with actionable feedback on bugs, performance, and best practices.",
        prompt:
          "You are a senior software engineer conducting a code review. Review the following [LANGUAGE] code and provide feedback.\n\n```[LANGUAGE]\n[PASTE YOUR CODE HERE]\n```\n\nReview for:\n1. **Bugs & Logic Errors**: Identify any bugs, off-by-one errors, null reference risks, or race conditions\n2. **Performance**: Flag N+1 queries, unnecessary re-renders, memory leaks, or O(n²) where O(n) is possible\n3. **Security**: Check for injection vulnerabilities, improper input validation, exposed secrets\n4. **Readability**: Suggest better naming, decomposition into smaller functions, or clearer control flow\n5. **Best Practices**: Note violations of [LANGUAGE] idioms or framework conventions\n\nFor each issue, provide:\n- Severity: 🔴 Critical | 🟡 Warning | 🔵 Suggestion\n- The problematic code snippet\n- What's wrong and why\n- A corrected code snippet\n\nEnd with a summary: overall quality rating (1-10) and top 3 priorities to fix.",
        category: "coding",
        tags: ["code review", "debugging", "best practices"],
        useCase:
          "Get AI-powered code review feedback before submitting a pull request.",
        targetKeywords: [
          "AI code review prompt",
          "code review template",
          "ChatGPT code review",
        ],
        relatedTemplates: ["debug-error-solver", "refactoring-guide"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "debug-error-solver",
        title: "Debug Error Solver",
        description:
          "Systematically diagnose and fix errors with step-by-step debugging guidance.",
        prompt:
          "You are an expert debugger. Help me fix this error in my [LANGUAGE/FRAMEWORK] project.\n\n**Error message:**\n```\n[PASTE ERROR MESSAGE]\n```\n\n**Relevant code:**\n```[LANGUAGE]\n[PASTE CODE THAT CAUSES THE ERROR]\n```\n\n**Context:**\n- Runtime/version: [e.g., Node 20, Python 3.12, React 19]\n- When it happens: [e.g., on page load, when clicking submit, during build]\n- What I've tried: [LIST WHAT YOU'VE ALREADY ATTEMPTED]\n\nPlease:\n1. Explain what this error means in plain language\n2. Identify the root cause (not just the symptom)\n3. Provide the exact fix with corrected code\n4. Explain why the fix works\n5. Suggest how to prevent this class of error in the future (e.g., linting rules, type guards)",
        category: "coding",
        tags: ["debugging", "error fixing", "troubleshooting"],
        useCase:
          "Quickly diagnose and fix errors instead of scouring Stack Overflow.",
        targetKeywords: [
          "debug error prompt",
          "AI debugging assistant",
          "fix code error ChatGPT",
        ],
        relatedTemplates: ["code-review-assistant", "unit-test-generator"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "refactoring-guide",
        title: "Code Refactoring Guide",
        description:
          "Refactor messy code into clean, maintainable, well-structured code.",
        prompt:
          "You are a software architect specializing in clean code. Refactor the following [LANGUAGE] code to improve readability, maintainability, and adherence to SOLID principles.\n\n```[LANGUAGE]\n[PASTE CODE TO REFACTOR]\n```\n\nRequirements:\n- Preserve all existing functionality (same inputs → same outputs)\n- Apply the [PATTERN/PRINCIPLE, e.g., Single Responsibility, DRY, composition over inheritance]\n- Target [FRAMEWORK CONVENTIONS, e.g., React hooks pattern, Pythonic idioms]\n\nProvide:\n1. The refactored code with inline comments explaining key decisions\n2. A before/after comparison of the most significant changes\n3. A list of design patterns or principles applied\n4. Any trade-offs made (e.g., added complexity vs. flexibility)",
        category: "coding",
        tags: ["refactoring", "clean code", "SOLID"],
        useCase:
          "Transform legacy or rushed code into clean, production-quality code.",
        targetKeywords: [
          "code refactoring prompt",
          "AI refactoring assistant",
          "clean code template",
        ],
        relatedTemplates: ["code-review-assistant", "api-endpoint-builder"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "unit-test-generator",
        title: "Unit Test Generator",
        description:
          "Generate comprehensive unit tests with edge cases for any function or module.",
        prompt:
          "Write comprehensive unit tests for the following [LANGUAGE] code using [TEST FRAMEWORK, e.g., Jest, pytest, Go testing].\n\n```[LANGUAGE]\n[PASTE THE CODE TO TEST]\n```\n\nRequirements:\n- Cover all public functions/methods\n- Include: happy path, edge cases, error cases, boundary values\n- Use descriptive test names that explain the expected behavior\n- Mock external dependencies (database, API calls, file system)\n- Aim for >90% branch coverage\n\nFor each test, add a brief comment explaining what scenario it covers and why it matters.\n\nOrganize tests using describe/it blocks (or equivalent) grouped by function.",
        category: "coding",
        tags: ["unit testing", "test generation", "TDD"],
        useCase:
          "Generate a full test suite for existing code to improve coverage.",
        targetKeywords: [
          "unit test generator prompt",
          "AI test generation",
          "ChatGPT unit tests",
        ],
        relatedTemplates: ["debug-error-solver", "api-endpoint-builder"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "api-endpoint-builder",
        title: "REST API Endpoint Builder",
        description:
          "Design and implement a REST API endpoint with validation, error handling, and documentation.",
        prompt:
          "Design and implement a REST API endpoint with the following specification.\n\n**Endpoint:** [METHOD] [PATH, e.g., POST /api/users]\n**Purpose:** [WHAT IT DOES]\n**Framework:** [e.g., Express.js, FastAPI, Go Gin, Rails]\n**Database:** [e.g., PostgreSQL, MongoDB, Prisma ORM]\n\n**Request:**\n- Auth: [e.g., Bearer token, API key, none]\n- Body/Params: [DESCRIBE THE INPUT]\n\n**Business rules:**\n- [RULE 1, e.g., Email must be unique]\n- [RULE 2, e.g., Only admins can delete]\n\nProvide:\n1. Route handler with input validation\n2. Database query/mutation\n3. Proper HTTP status codes for success and error cases\n4. Error response format: `{ error: string, code: string }`\n5. OpenAPI/Swagger documentation for the endpoint\n6. A curl example to test it",
        category: "coding",
        tags: ["API design", "REST", "backend"],
        useCase:
          "Scaffold a well-structured API endpoint with validation and error handling.",
        targetKeywords: [
          "API endpoint prompt",
          "REST API template",
          "AI API builder",
        ],
        relatedTemplates: ["unit-test-generator", "refactoring-guide"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "regex-pattern-builder",
        title: "Regex Pattern Builder",
        description:
          "Build and explain regex patterns for any text matching or validation need.",
        prompt:
          "You are a regex expert. Build a regular expression for the following requirement.\n\n**What to match:** [DESCRIBE WHAT THE REGEX SHOULD MATCH]\n**Language/engine:** [e.g., JavaScript, Python, PCRE]\n**Examples that should match:**\n- [EXAMPLE 1]\n- [EXAMPLE 2]\n\n**Examples that should NOT match:**\n- [EXAMPLE 1]\n- [EXAMPLE 2]\n\nProvide:\n1. The regex pattern\n2. A character-by-character explanation of what each part does\n3. Edge cases it handles and any limitations\n4. A code snippet showing it in use with your target language\n5. 5 additional test cases (3 pass, 2 fail) to verify correctness",
        category: "coding",
        tags: ["regex", "pattern matching", "validation"],
        useCase:
          "Create correct regex patterns with clear explanations instead of trial and error.",
        targetKeywords: [
          "regex prompt",
          "AI regex generator",
          "regex builder ChatGPT",
        ],
        relatedTemplates: ["debug-error-solver", "code-review-assistant"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
    ],
  },

  // ── SEO ────────────────────────────────────────────────────────────────
  {
    slug: "seo",
    title: "SEO & Content Optimization Prompts",
    description:
      "AI prompt templates for keyword research, meta tags, content optimization, and technical SEO audits.",
    longDescription:
      "Optimize your website for search engines with prompt templates covering keyword research, on-page optimization, meta tag writing, and technical SEO audits. These templates help you produce SEO-friendly content that ranks — whether you're writing blog posts, product pages, or landing pages.",
    icon: "🔍",
    keywords: [
      "SEO prompts",
      "AI SEO templates",
      "keyword research prompts",
      "content optimization",
    ],
    relatedCategories: ["marketing", "writing", "social-media"],
    templates: [
      {
        slug: "keyword-research-strategy",
        title: "Keyword Research Strategy",
        description:
          "Generate a keyword strategy with primary, secondary, and long-tail keywords for any topic.",
        prompt:
          "You are an SEO strategist. Build a keyword research strategy for a [BUSINESS TYPE] targeting [TARGET AUDIENCE] in [MARKET/REGION].\n\nMain topic: [TOPIC OR SEED KEYWORD]\nContent type: [e.g., blog, product page, landing page, SaaS tool]\nDomain authority: [LOW/MEDIUM/HIGH — affects difficulty targeting]\n\nProvide:\n1. **Primary keyword** (highest volume, most relevant)\n2. **5 secondary keywords** (related terms with good volume)\n3. **10 long-tail keywords** (lower competition, high intent)\n4. **5 question-based keywords** (for FAQ sections and featured snippets)\n5. **Content cluster map**: Group the keywords into 3-4 topic clusters with a pillar page and supporting pages\n6. **Search intent** for each keyword: informational, navigational, transactional, or commercial\n\nFormat as a table with columns: Keyword | Intent | Estimated Difficulty | Suggested Content Type",
        category: "seo",
        tags: ["keyword research", "content strategy", "search intent"],
        useCase:
          "Plan a keyword strategy before writing content to maximize organic search visibility.",
        targetKeywords: [
          "keyword research prompt",
          "AI keyword research",
          "SEO keyword strategy template",
        ],
        relatedTemplates: ["meta-tags-generator", "blog-post-seo-outline"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "meta-tags-generator",
        title: "Meta Tags Generator",
        description:
          "Write SEO-optimized title tags and meta descriptions for any page.",
        prompt:
          "Write SEO-optimized meta tags for the following page.\n\n**Page URL:** [URL]\n**Page type:** [e.g., blog post, product page, landing page, category page]\n**Primary keyword:** [KEYWORD]\n**Page content summary:** [2-3 SENTENCES ABOUT THE PAGE]\n**Brand name:** [BRAND]\n\nGenerate:\n1. **Title tag** (50-60 characters, keyword near the front, include brand)\n2. **Meta description** (150-160 characters, include keyword, compelling CTA)\n3. **3 alternative title tags** for A/B testing\n4. **3 alternative meta descriptions**\n5. **OG title** (for social sharing, can be slightly different)\n6. **OG description** (for social sharing)\n\nRules:\n- Show character count for each\n- Avoid keyword stuffing\n- Use power words that drive clicks (free, ultimate, proven, guide)\n- Include a call to action in meta descriptions",
        category: "seo",
        tags: ["meta tags", "title tags", "meta description"],
        useCase:
          "Generate optimized meta tags for any web page to improve click-through rates from search.",
        targetKeywords: [
          "meta tags generator prompt",
          "SEO meta description template",
          "AI title tag generator",
        ],
        relatedTemplates: [
          "keyword-research-strategy",
          "blog-post-seo-outline",
        ],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "blog-post-seo-outline",
        title: "SEO Blog Post Outline",
        description:
          "Create a detailed blog post outline optimized for search rankings and reader engagement.",
        prompt:
          "Create an SEO-optimized blog post outline for the following topic.\n\n**Target keyword:** [PRIMARY KEYWORD]\n**Secondary keywords:** [KEYWORD 2], [KEYWORD 3]\n**Word count target:** [e.g., 1500, 2500]\n**Audience:** [WHO IS READING THIS]\n**Search intent:** [informational / how-to / comparison / listicle]\n\nProvide:\n1. **Title**: 3 options (include primary keyword, use numbers or power words)\n2. **Introduction** (hook, problem statement, what the reader will learn)\n3. **H2 and H3 structure** with:\n   - Heading text (naturally include keywords)\n   - 2-3 bullet points of what each section should cover\n   - Suggested word count per section\n4. **FAQ section**: 4 questions based on \"People Also Ask\" patterns\n5. **Internal linking opportunities**: Suggest 3 related pages to link to\n6. **CTA**: What action the reader should take after reading\n\nOptimize for featured snippets by including a definition paragraph, a numbered list, or a comparison table where appropriate.",
        category: "seo",
        tags: ["blog outline", "content optimization", "on-page SEO"],
        useCase:
          "Plan blog content that's structured to rank in search and capture featured snippets.",
        targetKeywords: [
          "SEO blog outline prompt",
          "AI blog post outline",
          "content optimization template",
        ],
        relatedTemplates: [
          "keyword-research-strategy",
          "meta-tags-generator",
        ],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "technical-seo-audit",
        title: "Technical SEO Audit Checklist",
        description:
          "Generate a comprehensive technical SEO audit checklist for any website.",
        prompt:
          "You are a technical SEO consultant. Create a comprehensive technical SEO audit checklist for [WEBSITE URL / SITE TYPE].\n\nSite details:\n- Platform: [e.g., WordPress, Next.js, Shopify]\n- Pages: [APPROXIMATE NUMBER]\n- Current issues: [ANY KNOWN PROBLEMS]\n\nOrganize the audit into these categories:\n1. **Crawling & Indexing**: robots.txt, sitemap, canonical tags, noindex directives\n2. **Site Speed**: Core Web Vitals (LCP, FID, CLS), image optimization, JS/CSS delivery\n3. **Mobile**: Responsive design, mobile usability, viewport settings\n4. **URL Structure**: Clean URLs, redirects, 404s, parameter handling\n5. **On-Page**: Title tags, headings, internal linking, structured data\n6. **Security**: HTTPS, mixed content, security headers\n7. **International** (if applicable): hreflang, language targeting\n\nFor each item, provide:\n- What to check\n- How to check it (specific tool or method)\n- What \"good\" looks like\n- Priority: High / Medium / Low",
        category: "seo",
        tags: ["technical SEO", "site audit", "Core Web Vitals"],
        useCase:
          "Run a structured technical SEO audit to find and fix issues hurting search performance.",
        targetKeywords: [
          "technical SEO audit prompt",
          "SEO audit checklist",
          "AI SEO audit template",
        ],
        relatedTemplates: [
          "keyword-research-strategy",
          "meta-tags-generator",
        ],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "schema-markup-generator",
        title: "Schema Markup Generator",
        description:
          "Generate JSON-LD structured data for rich snippets in search results.",
        prompt:
          "Generate JSON-LD schema markup for the following page.\n\n**Page type:** [e.g., Article, Product, FAQ, HowTo, LocalBusiness, Recipe, Event]\n**Page details:**\n- Title: [PAGE TITLE]\n- Description: [BRIEF DESCRIPTION]\n- URL: [PAGE URL]\n- [ADD RELEVANT DETAILS: author, price, rating, dates, etc.]\n\nProvide:\n1. Complete JSON-LD script tag ready to paste into the page `<head>`\n2. Explanation of each field and why it matters for SEO\n3. Which rich snippet type this enables in Google (e.g., star ratings, FAQ accordion, recipe card)\n4. Validation: Suggest testing with Google's Rich Results Test tool\n\nFollow Google's structured data guidelines strictly — no deprecated properties.",
        category: "seo",
        tags: ["schema markup", "structured data", "JSON-LD", "rich snippets"],
        useCase:
          "Add structured data to pages to earn rich snippets in Google search results.",
        targetKeywords: [
          "schema markup prompt",
          "JSON-LD generator",
          "structured data template",
        ],
        relatedTemplates: [
          "meta-tags-generator",
          "technical-seo-audit",
        ],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
    ],
  },

  // ── Email ──────────────────────────────────────────────────────────────
  {
    slug: "email",
    title: "Email Writing Prompts",
    description:
      "AI prompt templates for email marketing, cold outreach, newsletters, follow-ups, and transactional emails.",
    longDescription:
      "Write emails that get opened, read, and acted on. These prompt templates cover the full spectrum of email communication — from marketing campaigns and drip sequences to cold outreach and follow-ups. Each template includes subject line options because the best email body is useless if nobody opens it.",
    icon: "✉️",
    keywords: [
      "email prompts",
      "AI email templates",
      "email copywriting",
      "cold email prompts",
    ],
    relatedCategories: ["marketing", "writing", "customer-support"],
    templates: [
      {
        slug: "cold-outreach-email",
        title: "Cold Outreach Email",
        description:
          "Write a personalized cold email that gets responses, not spam reports.",
        prompt:
          "Write a cold outreach email for [PURPOSE, e.g., sales, partnerships, guest posting, hiring].\n\n**Sender:** [YOUR ROLE/COMPANY]\n**Recipient:** [THEIR ROLE/COMPANY TYPE]\n**Goal:** [DESIRED OUTCOME, e.g., book a call, get a reply, start a conversation]\n**Value proposition:** [WHAT'S IN IT FOR THEM — be specific]\n**Personalization hook:** [SOMETHING SPECIFIC ABOUT THEM: recent post, company news, mutual connection]\n\nRules:\n- Under 150 words (shorter = higher response rate)\n- No \"I hope this finds you well\" or other filler\n- Lead with value, not your pitch\n- One clear CTA (question format, not a demand)\n- P.S. line with a conversation starter or social proof\n\nProvide:\n1. Subject line (under 40 chars, no clickbait)\n2. Email body\n3. 2 alternative subject lines\n4. A follow-up email for 3 days later (under 75 words)",
        category: "email",
        tags: ["cold email", "outreach", "B2B", "sales"],
        useCase:
          "Write cold outreach emails that feel personal and drive responses.",
        targetKeywords: [
          "cold email prompt",
          "AI cold outreach template",
          "sales email generator",
        ],
        relatedTemplates: [
          "follow-up-email-sequence",
          "newsletter-content-writer",
        ],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "follow-up-email-sequence",
        title: "Follow-Up Email Sequence",
        description:
          "Create a multi-touch follow-up sequence that stays persistent without being annoying.",
        prompt:
          "Create a 4-email follow-up sequence for [CONTEXT, e.g., after a demo, after a proposal, after no response to initial outreach].\n\n**Original email topic:** [WHAT THE FIRST EMAIL WAS ABOUT]\n**Goal:** [DESIRED OUTCOME]\n**Audience:** [RECIPIENT TYPE]\n**Tone:** [professional / casual / friendly-persistent]\n\nFor each email, provide:\n- Send timing (e.g., Day 3, Day 7, Day 14, Day 21)\n- Subject line\n- Email body (progressively shorter — Email 1: 120 words, Email 4: 50 words)\n- Strategy note (what angle this email takes: add value, create urgency, breakup email, etc.)\n\nRules:\n- Never guilt-trip (\"just checking in\" → banned phrase)\n- Each email should stand alone (they may not have read previous ones)\n- Add new value in each email (insight, resource, case study)\n- Final email: \"breakup\" email (last attempt, no pressure, leave the door open)",
        category: "email",
        tags: ["follow-up", "email sequence", "drip campaign"],
        useCase:
          "Build a multi-touch follow-up sequence that converts without annoying recipients.",
        targetKeywords: [
          "follow-up email prompt",
          "email sequence template",
          "AI follow-up generator",
        ],
        relatedTemplates: [
          "cold-outreach-email",
          "newsletter-content-writer",
        ],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "newsletter-content-writer",
        title: "Newsletter Content Writer",
        description:
          "Write engaging newsletter content with sections, formatting, and CTAs.",
        prompt:
          "Write a newsletter edition for [BRAND/PUBLICATION NAME].\n\n**Topic/theme:** [THIS WEEK'S THEME]\n**Audience:** [SUBSCRIBER DESCRIPTION]\n**Tone:** [e.g., witty, authoritative, conversational]\n**Key content to include:**\n- [ITEM 1: article, announcement, tip, etc.]\n- [ITEM 2]\n- [ITEM 3]\n\nStructure:\n1. **Subject line**: 3 options (aim for 35-50 chars, create curiosity)\n2. **Preview text**: The first line they see after the subject (40-90 chars)\n3. **Opening hook**: 2-3 sentences that make them want to keep reading\n4. **Main content sections** (2-3 sections with headers)\n5. **Quick links / resources**: 3 curated links with one-line descriptions\n6. **CTA**: What you want readers to do\n7. **Sign-off**: Brief, on-brand closing\n\nFormat for email: use short paragraphs, bold key phrases, and clear section breaks.",
        category: "email",
        tags: ["newsletter", "email marketing", "content curation"],
        useCase:
          "Write a complete newsletter edition with structured sections and engaging copy.",
        targetKeywords: [
          "newsletter prompt",
          "AI newsletter writer",
          "email newsletter template",
        ],
        relatedTemplates: [
          "cold-outreach-email",
          "follow-up-email-sequence",
        ],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "email-subject-line-generator",
        title: "Email Subject Line Generator",
        description:
          "Generate high-open-rate subject lines using proven copywriting formulas.",
        prompt:
          "Generate 15 email subject lines for [EMAIL PURPOSE/TOPIC].\n\n**Audience:** [WHO RECEIVES THIS]\n**Email type:** [promotional / transactional / newsletter / cold outreach]\n**Key message:** [MAIN POINT OF THE EMAIL]\n**Tone:** [urgent / casual / professional / playful]\n\nGenerate subject lines using these formulas (at least one each):\n1. **Number + Benefit**: \"5 ways to [BENEFIT]\"\n2. **Question**: Ask something they can't resist answering\n3. **Curiosity gap**: Hint at something without revealing it\n4. **Social proof**: \"How [PERSON/COMPANY] achieved [RESULT]\"\n5. **Urgency**: Time-sensitive without being spammy\n6. **Personalized**: Include [FIRST NAME] or [COMPANY] placeholder\n7. **Contrarian**: Challenge a common belief\n\nRules:\n- Under 50 characters each (show count)\n- No ALL CAPS or excessive punctuation\n- No spam trigger words (free, guarantee, act now)\n- Mark your top 3 picks with ⭐",
        category: "email",
        tags: ["subject lines", "open rates", "email copywriting"],
        useCase:
          "Generate compelling subject lines to increase email open rates.",
        targetKeywords: [
          "email subject line prompt",
          "AI subject line generator",
          "email open rate template",
        ],
        relatedTemplates: [
          "newsletter-content-writer",
          "cold-outreach-email",
        ],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "win-back-email",
        title: "Customer Win-Back Email",
        description:
          "Re-engage inactive customers or churned users with a compelling win-back email.",
        prompt:
          "Write a win-back email to re-engage [CUSTOMER TYPE] who [CHURN REASON, e.g., haven't logged in for 30 days, cancelled subscription, abandoned their cart].\n\n**Product/Service:** [WHAT YOU OFFER]\n**What they're missing:** [NEW FEATURES, IMPROVEMENTS SINCE THEY LEFT]\n**Incentive (optional):** [DISCOUNT, FREE TRIAL EXTENSION, BONUS]\n\nProvide:\n1. Subject line (3 options — empathetic, not desperate)\n2. Email body:\n   - Acknowledge their absence (no guilt)\n   - Remind them of the value they got (specific, not generic)\n   - Share what's new or improved\n   - Offer the incentive (if applicable)\n   - Single clear CTA\n3. A \"last chance\" version for a second send 7 days later\n\nTone: Warm and genuine. Never use \"We miss you!\" — show value instead.",
        category: "email",
        tags: ["win-back", "retention", "churn", "re-engagement"],
        useCase:
          "Bring back inactive customers with a value-focused win-back campaign.",
        targetKeywords: [
          "win-back email prompt",
          "customer re-engagement template",
          "AI win-back email",
        ],
        relatedTemplates: [
          "follow-up-email-sequence",
          "cold-outreach-email",
        ],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
    ],
  },

  // ── Writing ────────────────────────────────────────────────────────────
  {
    slug: "writing",
    title: "Writing & Copywriting Prompts",
    description:
      "AI prompt templates for blog posts, articles, product descriptions, and creative writing projects.",
    longDescription:
      "Write better content faster with structured prompt templates for every type of writing. From long-form blog posts to punchy product descriptions, these templates give AI assistants the context and constraints they need to produce publish-ready copy instead of generic filler.",
    icon: "✍️",
    keywords: [
      "writing prompts",
      "AI writing templates",
      "copywriting prompts",
      "content writing",
    ],
    relatedCategories: ["marketing", "seo", "email"],
    templates: [
      {
        slug: "blog-post-writer",
        title: "Blog Post Writer",
        description:
          "Write a complete, well-structured blog post on any topic with SEO considerations.",
        prompt:
          "Write a blog post on [TOPIC].\n\n**Target keyword:** [PRIMARY KEYWORD]\n**Word count:** [TARGET, e.g., 1500]\n**Audience:** [WHO IS READING]\n**Tone:** [e.g., conversational, authoritative, technical]\n**Goal:** [e.g., educate, persuade, entertain]\n\nStructure:\n1. **Title**: Compelling, includes keyword, under 60 characters\n2. **Introduction** (100-150 words): Hook with a surprising stat, question, or story. State what the reader will learn.\n3. **Body sections** (3-5 H2 sections): Each with a clear point, supporting evidence, and actionable takeaway\n4. **Conclusion** (100 words): Summarize key points, include a CTA\n\nRules:\n- Write in active voice\n- Use short paragraphs (2-3 sentences max)\n- Include transition sentences between sections\n- Add 2-3 places where data/quotes could be inserted (mark as [DATA NEEDED])\n- Naturally include the target keyword 3-5 times without stuffing",
        category: "writing",
        tags: ["blog post", "content writing", "long-form"],
        useCase:
          "Draft a complete blog post that's structured for both readers and search engines.",
        targetKeywords: [
          "blog post prompt",
          "AI blog writer",
          "blog post template ChatGPT",
        ],
        relatedTemplates: [
          "product-description-writer",
          "case-study-framework",
        ],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "product-description-writer",
        title: "Product Description Writer",
        description:
          "Write compelling product descriptions that sell features as benefits.",
        prompt:
          "Write a product description for [PRODUCT NAME].\n\n**Product type:** [CATEGORY]\n**Price:** [PRICE POINT]\n**Target buyer:** [WHO BUYS THIS]\n**Key features:** \n- [FEATURE 1]\n- [FEATURE 2]\n- [FEATURE 3]\n**Competitors:** [WHAT ELSE THEY MIGHT CONSIDER]\n\nProvide:\n1. **Headline** (under 10 words, benefit-focused)\n2. **Short description** (2-3 sentences for search results / product cards)\n3. **Full description** (150-250 words) using the Feature-Advantage-Benefit framework:\n   - Feature: What it has\n   - Advantage: Why that matters technically\n   - Benefit: How it improves the buyer's life\n4. **Bullet points**: 5 scannable feature+benefit bullets\n5. **Objection handler**: Address the #1 reason someone wouldn't buy\n\nTone: [e.g., premium, accessible, technical, fun]. Avoid clichés like \"best-in-class\" or \"state-of-the-art.\"",
        category: "writing",
        tags: ["product description", "e-commerce", "copywriting"],
        useCase:
          "Write product descriptions that convert browsers into buyers.",
        targetKeywords: [
          "product description prompt",
          "AI product copy",
          "product description generator",
        ],
        relatedTemplates: ["blog-post-writer", "case-study-framework"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "case-study-framework",
        title: "Case Study Framework",
        description:
          "Structure a compelling customer case study that demonstrates real results.",
        prompt:
          "Write a customer case study for [COMPANY/CLIENT NAME].\n\n**Your product/service:** [WHAT YOU SELL]\n**Client industry:** [THEIR INDUSTRY]\n**Challenge:** [WHAT PROBLEM THEY FACED]\n**Solution:** [HOW YOUR PRODUCT HELPED]\n**Results:** [SPECIFIC METRICS OR OUTCOMES]\n**Timeline:** [HOW LONG IT TOOK]\n**Quote (optional):** [REAL QUOTE FROM THE CLIENT]\n\nStructure using the STAR framework:\n1. **Situation** (100 words): Context about the client and their business\n2. **Task** (100 words): The specific challenge or goal\n3. **Action** (200 words): How they implemented your solution (be specific about features used)\n4. **Results** (150 words): Quantified outcomes with before/after comparison\n\nAlso include:\n- A compelling title (format: \"How [Company] achieved [Result] with [Product]\")\n- Key metrics callout box (3-4 stats)\n- Pull quote for social sharing\n- CTA for readers facing similar challenges",
        category: "writing",
        tags: ["case study", "customer story", "B2B content"],
        useCase:
          "Turn customer success stories into structured case studies for marketing.",
        targetKeywords: [
          "case study prompt",
          "AI case study writer",
          "customer case study template",
        ],
        relatedTemplates: ["blog-post-writer", "product-description-writer"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "tone-rewriter",
        title: "Tone & Style Rewriter",
        description:
          "Rewrite any text in a different tone while preserving the core message.",
        prompt:
          "Rewrite the following text in a [TARGET TONE] tone.\n\n**Original text:**\n[PASTE TEXT HERE]\n\n**Target tone:** [e.g., professional, casual, humorous, empathetic, authoritative, Gen Z, academic]\n**Target audience:** [WHO WILL READ THE REWRITTEN VERSION]\n**Keep:** [ANYTHING THAT MUST STAY THE SAME — facts, names, key phrases]\n**Remove:** [ANYTHING TO CUT — jargon, filler, specific references]\n\nProvide:\n1. The rewritten text\n2. A brief note on what you changed and why\n3. A second version in a slightly different variation of the target tone (e.g., if target is \"casual,\" also provide \"casual-professional\")\n\nRules:\n- Preserve all factual content\n- Match the paragraph structure unless it conflicts with the new tone\n- Adjust vocabulary, sentence length, and punctuation to match the tone\n- Keep approximately the same word count (±10%)",
        category: "writing",
        tags: ["tone", "rewriting", "style adaptation"],
        useCase:
          "Adapt existing content for different audiences or channels by changing tone.",
        targetKeywords: [
          "tone rewriter prompt",
          "AI rewrite tone",
          "change writing tone ChatGPT",
        ],
        relatedTemplates: ["blog-post-writer", "product-description-writer"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
    ],
  },

  // ── Data Analysis ──────────────────────────────────────────────────────
  {
    slug: "data-analysis",
    title: "Data Analysis Prompts",
    description:
      "AI prompt templates for data analysis, visualization, SQL queries, spreadsheet formulas, and reporting.",
    longDescription:
      "Analyze data faster with prompt templates that help you write SQL queries, build Excel formulas, create data visualizations, and generate reports. These templates are designed to give AI the right context about your data structure so you get working queries on the first try.",
    icon: "📊",
    keywords: [
      "data analysis prompts",
      "AI data templates",
      "SQL prompts",
      "spreadsheet prompts",
    ],
    relatedCategories: ["coding", "productivity"],
    templates: [
      {
        slug: "sql-query-builder",
        title: "SQL Query Builder",
        description:
          "Generate complex SQL queries from plain English descriptions of what you need.",
        prompt:
          "Write a SQL query for the following request.\n\n**Database:** [e.g., PostgreSQL, MySQL, SQLite, BigQuery]\n**Tables and columns:**\n```\n[TABLE 1]: column1 (type), column2 (type), ...\n[TABLE 2]: column1 (type), column2 (type), ...\n```\n**Relationships:** [e.g., users.id = orders.user_id]\n\n**What I need:** [DESCRIBE IN PLAIN ENGLISH WHAT DATA YOU WANT]\n\n**Constraints:**\n- [e.g., last 30 days, active users only, exclude test data]\n- [e.g., group by month, top 10 only]\n\nProvide:\n1. The SQL query with comments explaining each section\n2. Expected output format (column names and example row)\n3. Performance notes (index recommendations, potential bottlenecks)\n4. A simplified version if the query is complex (for debugging)\n5. How to modify it for common variations (e.g., different date range, different grouping)",
        category: "data-analysis",
        tags: ["SQL", "database", "queries"],
        useCase:
          "Generate correct SQL queries by describing what data you need in plain English.",
        targetKeywords: [
          "SQL query prompt",
          "AI SQL generator",
          "SQL query template ChatGPT",
        ],
        relatedTemplates: [
          "spreadsheet-formula-expert",
          "data-visualization-guide",
        ],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "spreadsheet-formula-expert",
        title: "Spreadsheet Formula Expert",
        description:
          "Build complex Excel or Google Sheets formulas explained step by step.",
        prompt:
          "Create a spreadsheet formula for the following requirement.\n\n**Platform:** [Excel / Google Sheets]\n**What I need:** [DESCRIBE THE CALCULATION IN PLAIN ENGLISH]\n**Data layout:**\n- Column A: [WHAT'S IN IT]\n- Column B: [WHAT'S IN IT]\n- [ADD MORE COLUMNS AS NEEDED]\n**Data starts at row:** [e.g., row 2 (row 1 is headers)]\n**Number of rows:** [APPROXIMATE]\n\n**Example data:**\n| A | B | Expected Result |\n|---|---|---|\n| [EXAMPLE] | [EXAMPLE] | [WHAT YOU EXPECT] |\n\nProvide:\n1. The formula\n2. Step-by-step breakdown of how it works\n3. Where to paste it (which cell)\n4. How to drag/copy it for all rows\n5. An alternative approach using a different function\n6. Common errors and how to fix them (e.g., #REF!, #N/A)",
        category: "data-analysis",
        tags: ["Excel", "Google Sheets", "formulas", "spreadsheet"],
        useCase:
          "Build complex spreadsheet formulas without memorizing function syntax.",
        targetKeywords: [
          "Excel formula prompt",
          "Google Sheets formula AI",
          "spreadsheet formula generator",
        ],
        relatedTemplates: ["sql-query-builder", "data-visualization-guide"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "data-visualization-guide",
        title: "Data Visualization Advisor",
        description:
          "Get recommendations for the best chart types and visualization approaches for your data.",
        prompt:
          "Recommend the best way to visualize the following data.\n\n**Data description:** [WHAT YOUR DATA REPRESENTS]\n**Number of variables:** [HOW MANY DIMENSIONS]\n**Data types:** [categorical, numerical, time series, geographic, etc.]\n**Audience:** [WHO WILL SEE THIS — executives, analysts, general public]\n**Tool:** [e.g., Python matplotlib, Tableau, Google Sheets, D3.js, Excel]\n**Goal:** [WHAT INSIGHT SHOULD THE VIEWER TAKE AWAY]\n\n**Sample data:**\n```\n[PASTE 5-10 ROWS OF YOUR DATA]\n```\n\nProvide:\n1. **Recommended chart type** with explanation of why it's the best choice\n2. **2 alternative chart types** with pros/cons vs. the recommendation\n3. **Design guidelines**: Colors, labels, annotations to include\n4. **Code/formula** to create the recommended chart in your tool\n5. **Anti-patterns**: Chart types to avoid for this data and why\n6. **Accessibility**: How to make it readable for colorblind viewers",
        category: "data-analysis",
        tags: ["data visualization", "charts", "reporting"],
        useCase:
          "Choose the right visualization for your data and get implementation code.",
        targetKeywords: [
          "data visualization prompt",
          "chart recommendation AI",
          "best chart type for data",
        ],
        relatedTemplates: [
          "sql-query-builder",
          "spreadsheet-formula-expert",
        ],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "data-cleaning-assistant",
        title: "Data Cleaning Assistant",
        description:
          "Clean messy datasets with step-by-step instructions and code.",
        prompt:
          "Help me clean the following messy dataset.\n\n**Tool:** [Python pandas / R / Excel / Google Sheets / SQL]\n**Data sample (first 10 rows):**\n```\n[PASTE DATA]\n```\n\n**Known issues:**\n- [e.g., inconsistent date formats, missing values, duplicates]\n- [e.g., mixed units, typos in category names, extra whitespace]\n\n**Expected output format:**\n- [DESCRIBE WHAT CLEAN DATA LOOKS LIKE]\n\nProvide:\n1. A diagnosis of all data quality issues found in the sample\n2. Step-by-step cleaning plan (ordered by dependency)\n3. Code for each cleaning step with comments\n4. Validation checks to run after cleaning\n5. A summary of rows/values that would be modified or removed\n\nAssume the full dataset has [NUMBER] rows and may contain issues not visible in the sample.",
        category: "data-analysis",
        tags: ["data cleaning", "ETL", "data quality"],
        useCase:
          "Systematically clean messy data with reproducible code and validation steps.",
        targetKeywords: [
          "data cleaning prompt",
          "AI data cleaning",
          "clean dataset ChatGPT",
        ],
        relatedTemplates: [
          "sql-query-builder",
          "spreadsheet-formula-expert",
        ],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
    ],
  },

  // ── Education ──────────────────────────────────────────────────────────
  {
    slug: "education",
    title: "Education & Teaching Prompts",
    description:
      "AI prompt templates for lesson planning, student feedback, quiz generation, and educational content creation.",
    longDescription:
      "Save hours of lesson prep with prompt templates for creating lesson plans, generating quizzes, writing student feedback, and breaking down complex topics. These templates are designed by educators to work across grade levels and subjects.",
    icon: "🎓",
    keywords: [
      "education prompts",
      "AI teaching templates",
      "lesson plan prompts",
      "quiz generator prompts",
    ],
    relatedCategories: ["writing", "productivity"],
    templates: [
      {
        slug: "lesson-plan-creator",
        title: "Lesson Plan Creator",
        description:
          "Generate a structured lesson plan with objectives, activities, and assessment criteria.",
        prompt:
          "Create a detailed lesson plan for the following class.\n\n**Subject:** [SUBJECT]\n**Topic:** [SPECIFIC TOPIC]\n**Grade level / audience:** [e.g., 8th grade, college intro, adult learners]\n**Duration:** [e.g., 45 minutes, 90 minutes]\n**Learning objectives:** [WHAT STUDENTS SHOULD KNOW/DO AFTER THE LESSON]\n**Prerequisites:** [WHAT THEY SHOULD ALREADY KNOW]\n\nInclude:\n1. **Warm-up** (5 min): Engaging opener that connects to prior knowledge\n2. **Direct instruction** (15 min): Key concepts with examples\n3. **Guided practice** (15 min): Activity where students apply concepts with support\n4. **Independent practice** (10 min): Activity students do on their own\n5. **Assessment**: How to check understanding (formative assessment question or exit ticket)\n6. **Differentiation**: Modifications for advanced learners and those who need extra support\n7. **Materials needed**: List of resources, handouts, or tech required\n\nAlign with [STANDARDS, e.g., Common Core, NGSS, or skip if not applicable].",
        category: "education",
        tags: ["lesson plan", "teaching", "curriculum"],
        useCase:
          "Create a complete lesson plan with differentiation and assessment.",
        targetKeywords: [
          "lesson plan prompt",
          "AI lesson plan generator",
          "teaching prompt template",
        ],
        relatedTemplates: [
          "quiz-generator",
          "concept-explainer",
        ],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "quiz-generator",
        title: "Quiz & Assessment Generator",
        description:
          "Generate quizzes with multiple question types, answer keys, and difficulty levels.",
        prompt:
          "Create a quiz on [TOPIC] for [GRADE LEVEL / AUDIENCE].\n\n**Number of questions:** [e.g., 15]\n**Question types to include:**\n- [NUMBER] multiple choice (4 options each)\n- [NUMBER] true/false\n- [NUMBER] short answer\n- [NUMBER] essay/open-ended\n\n**Difficulty distribution:** [e.g., 40% easy, 40% medium, 20% hard]\n**Topics to cover:** [LIST SUBTOPICS]\n**Time limit:** [e.g., 30 minutes]\n\nFor each question, provide:\n1. The question\n2. Difficulty label (Easy / Medium / Hard)\n3. Bloom's taxonomy level (Remember / Understand / Apply / Analyze / Evaluate / Create)\n4. Answer (for the answer key)\n5. Explanation of why the answer is correct\n\nFor multiple choice: Make distractors plausible (common misconceptions, not obviously wrong).\nEnd with a grading rubric for the short answer and essay questions.",
        category: "education",
        tags: ["quiz", "assessment", "testing", "exam"],
        useCase:
          "Generate well-balanced quizzes with answer keys and grading rubrics.",
        targetKeywords: [
          "quiz generator prompt",
          "AI quiz maker",
          "test generator ChatGPT",
        ],
        relatedTemplates: ["lesson-plan-creator", "concept-explainer"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "concept-explainer",
        title: "Concept Explainer (ELI5 to Expert)",
        description:
          "Explain any concept at multiple complexity levels for different audiences.",
        prompt:
          "Explain [CONCEPT] at three different levels of complexity.\n\n**Level 1 — ELI5 (Explain Like I'm 5):**\nUse a simple analogy, everyday language, no jargon. Under 100 words.\n\n**Level 2 — High school student:**\nIntroduce proper terminology with definitions. Include a real-world example. 150-200 words.\n\n**Level 3 — Expert / professional:**\nUse precise technical language. Reference relevant theories, formulas, or research. Discuss nuances, edge cases, or ongoing debates. 200-300 words.\n\nFor each level, also provide:\n- A one-sentence summary\n- A \"check your understanding\" question\n- One common misconception about this topic and why it's wrong\n\nContext: [ANY SPECIFIC ANGLE OR APPLICATION, e.g., \"explain it in the context of machine learning\" or \"focus on the biological perspective\"]",
        category: "education",
        tags: ["explanation", "teaching", "ELI5", "learning"],
        useCase:
          "Break down complex concepts for different audience levels — from beginners to experts.",
        targetKeywords: [
          "explain concept prompt",
          "ELI5 prompt template",
          "AI concept explainer",
        ],
        relatedTemplates: ["lesson-plan-creator", "quiz-generator"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "student-feedback-writer",
        title: "Student Feedback Writer",
        description:
          "Write constructive, personalized feedback on student work.",
        prompt:
          "Write constructive feedback for a student's [ASSIGNMENT TYPE, e.g., essay, project, presentation, code submission].\n\n**Student level:** [GRADE / COURSE LEVEL]\n**Assignment topic:** [WHAT THE ASSIGNMENT WAS ABOUT]\n**Rubric criteria:**\n- [CRITERION 1, e.g., Thesis clarity]\n- [CRITERION 2, e.g., Evidence quality]\n- [CRITERION 3, e.g., Writing mechanics]\n- [CRITERION 4, e.g., Critical analysis]\n\n**Student's strengths (observed):** [WHAT THEY DID WELL]\n**Areas for improvement (observed):** [WHAT NEEDS WORK]\n**Grade/Score:** [IF APPLICABLE]\n\nWrite feedback that:\n1. Opens with genuine praise for specific strengths (not generic \"good job\")\n2. Identifies 2-3 improvement areas with concrete examples from their work\n3. Provides actionable suggestions (not just \"do better\" — tell them HOW)\n4. Ends with encouragement and one specific goal for next time\n5. Uses \"I noticed...\" and \"Consider...\" framing (growth mindset language)\n\nTone: Supportive but honest. Length: 150-250 words.",
        category: "education",
        tags: ["feedback", "grading", "student assessment"],
        useCase:
          "Write personalized, constructive student feedback in less time.",
        targetKeywords: [
          "student feedback prompt",
          "AI grading feedback",
          "teacher feedback template",
        ],
        relatedTemplates: ["quiz-generator", "lesson-plan-creator"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
    ],
  },

  // ── Productivity ───────────────────────────────────────────────────────
  {
    slug: "productivity",
    title: "Productivity & Task Management Prompts",
    description:
      "AI prompt templates for project planning, meeting agendas, decision-making frameworks, and workflow automation.",
    longDescription:
      "Get more done with prompt templates that help you plan projects, run better meetings, make decisions faster, and streamline workflows. These templates turn AI into a personal productivity consultant that adapts to your specific work context.",
    icon: "⚡",
    keywords: [
      "productivity prompts",
      "AI productivity templates",
      "project planning prompts",
      "meeting agenda prompts",
    ],
    relatedCategories: ["coding", "data-analysis"],
    templates: [
      {
        slug: "project-planning-assistant",
        title: "Project Planning Assistant",
        description:
          "Break down any project into phases, milestones, tasks, and timelines.",
        prompt:
          "Help me plan the following project.\n\n**Project:** [PROJECT NAME / DESCRIPTION]\n**Goal:** [DESIRED OUTCOME]\n**Team size:** [NUMBER OF PEOPLE AND ROLES]\n**Timeline:** [DEADLINE OR DURATION]\n**Budget (optional):** [BUDGET RANGE]\n**Constraints:** [KNOWN LIMITATIONS — tech stack, dependencies, resources]\n\nProvide:\n1. **Project phases** (3-5 phases with clear deliverables per phase)\n2. **Task breakdown** for each phase:\n   - Task name\n   - Owner (role, not person)\n   - Estimated duration\n   - Dependencies (what must be done first)\n   - Priority: Must-have / Should-have / Nice-to-have\n3. **Milestones** with dates (work backwards from deadline)\n4. **Risk assessment**: Top 3 risks and mitigation strategies\n5. **Definition of done**: How you'll know the project is complete\n\nFormat as a structured outline. Flag any tasks that are on the critical path (delays here delay everything).",
        category: "productivity",
        tags: ["project planning", "project management", "task breakdown"],
        useCase:
          "Break down a project into actionable tasks with timelines and dependencies.",
        targetKeywords: [
          "project planning prompt",
          "AI project planner",
          "task breakdown template",
        ],
        relatedTemplates: [
          "meeting-agenda-builder",
          "decision-matrix-builder",
        ],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "meeting-agenda-builder",
        title: "Meeting Agenda Builder",
        description:
          "Create a focused meeting agenda that respects everyone's time.",
        prompt:
          "Create a meeting agenda for the following meeting.\n\n**Meeting type:** [e.g., team standup, sprint planning, 1:1, client call, brainstorm, retrospective]\n**Duration:** [e.g., 30 minutes, 60 minutes]\n**Attendees:** [ROLES / NUMBER OF PEOPLE]\n**Meeting goal:** [THE ONE THING THIS MEETING MUST ACCOMPLISH]\n**Topics to cover:**\n- [TOPIC 1]\n- [TOPIC 2]\n- [TOPIC 3]\n\nProvide:\n1. **Agenda** with time allocations for each item\n2. **Pre-meeting prep**: What attendees should review or prepare\n3. **Discussion prompts**: 1-2 specific questions per agenda item to keep discussion focused\n4. **Decision items**: Clearly mark items that need a decision (not just discussion)\n5. **Action items template**: Format for capturing next steps (Who, What, By When)\n6. **Parking lot**: Space for off-topic items to address later\n\nRules:\n- Start with the most important item (not announcements)\n- Include buffer time (10% of total duration)\n- End 5 minutes early for summary and action items\n- No agenda item should take more than 1/3 of total time",
        category: "productivity",
        tags: ["meetings", "agenda", "team management"],
        useCase:
          "Run focused, productive meetings that end on time with clear next steps.",
        targetKeywords: [
          "meeting agenda prompt",
          "AI meeting planner",
          "meeting agenda template",
        ],
        relatedTemplates: [
          "project-planning-assistant",
          "decision-matrix-builder",
        ],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "decision-matrix-builder",
        title: "Decision Matrix Builder",
        description:
          "Evaluate options systematically using a weighted decision matrix.",
        prompt:
          "Help me make a decision using a weighted decision matrix.\n\n**Decision:** [WHAT ARE YOU DECIDING]\n**Options:**\n1. [OPTION A]\n2. [OPTION B]\n3. [OPTION C]\n\n**Criteria that matter to me:**\n- [CRITERION 1, e.g., cost]\n- [CRITERION 2, e.g., time to implement]\n- [CRITERION 3, e.g., quality]\n- [CRITERION 4, e.g., team satisfaction]\n- [CRITERION 5, e.g., risk level]\n\n**Priority ranking of criteria:** [e.g., quality > cost > time > risk > satisfaction]\n\nProvide:\n1. **Weighted criteria** (assign weights 1-10 based on priority ranking, explain why)\n2. **Scoring matrix**: Rate each option on each criterion (1-10 scale) with brief justification\n3. **Weighted scores**: Multiply and sum for final scores\n4. **Result table** formatted for easy comparison\n5. **Recommendation** with reasoning\n6. **Sensitivity check**: Would the recommendation change if the top criterion's weight changed by ±2?\n7. **Key assumptions** that could affect the decision",
        category: "productivity",
        tags: ["decision making", "analysis", "framework"],
        useCase:
          "Make better decisions by systematically evaluating options against weighted criteria.",
        targetKeywords: [
          "decision matrix prompt",
          "AI decision maker",
          "decision framework template",
        ],
        relatedTemplates: [
          "project-planning-assistant",
          "meeting-agenda-builder",
        ],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "weekly-review-template",
        title: "Weekly Review Template",
        description:
          "Conduct a structured weekly review to reflect on progress and plan ahead.",
        prompt:
          "Guide me through a structured weekly review.\n\n**This week's main goal was:** [WHAT YOU SET OUT TO DO]\n**Role/context:** [YOUR JOB OR PROJECT]\n\nWalk me through these sections (I'll fill in the details as we go):\n\n1. **Wins** (What went well?)\n   - Ask me: What 3 things am I most proud of this week?\n   - Ask me: What skills or habits contributed to these wins?\n\n2. **Challenges** (What didn't go as planned?)\n   - Ask me: What was the biggest obstacle this week?\n   - Ask me: Was this within my control? What would I do differently?\n\n3. **Metrics check** (Am I on track?)\n   - Ask me: What are my key metrics/KPIs? How did they move this week?\n\n4. **Lessons learned** (What did I learn?)\n   - Ask me: What's one insight I'll carry forward?\n\n5. **Next week planning**\n   - Ask me: What are my top 3 priorities for next week?\n   - Help me identify: Which tasks are urgent vs. important (Eisenhower matrix)\n   - Suggest: Time blocks for focused work\n\nKeep your responses concise. After each section, provide a brief coaching observation before moving to the next section.",
        category: "productivity",
        tags: ["weekly review", "reflection", "planning", "GTD"],
        useCase:
          "Run a structured weekly review to stay on track with goals and priorities.",
        targetKeywords: [
          "weekly review prompt",
          "AI weekly planning",
          "productivity review template",
        ],
        relatedTemplates: [
          "project-planning-assistant",
          "meeting-agenda-builder",
        ],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
    ],
  },

  // ── Customer Support ───────────────────────────────────────────────────
  {
    slug: "customer-support",
    title: "Customer Support Prompts",
    description:
      "AI prompt templates for support replies, FAQ creation, escalation handling, and customer communication.",
    longDescription:
      "Handle customer support faster and more consistently with prompt templates for common scenarios. From drafting empathetic responses to angry customers to building FAQ content, these templates help support teams maintain quality while reducing response time.",
    icon: "🎧",
    keywords: [
      "customer support prompts",
      "AI support templates",
      "help desk prompts",
      "customer service AI",
    ],
    relatedCategories: ["email", "writing"],
    templates: [
      {
        slug: "support-reply-drafter",
        title: "Support Reply Drafter",
        description:
          "Draft professional support responses for common ticket types.",
        prompt:
          "Draft a customer support reply for the following ticket.\n\n**Ticket type:** [e.g., bug report, billing question, feature request, complaint, how-to question]\n**Customer message:**\n```\n[PASTE THE CUSTOMER'S MESSAGE]\n```\n\n**Context:**\n- Product: [YOUR PRODUCT]\n- Customer tier: [free / paid / enterprise]\n- Known issue?: [YES — with ETA for fix / NO / INVESTIGATING]\n- Resolution: [WHAT YOU CAN DO FOR THEM]\n\nWrite a reply that:\n1. Acknowledges their issue specifically (not generic \"sorry for the inconvenience\")\n2. Explains what happened or why (if known)\n3. Provides the solution or next steps clearly\n4. Sets expectations (timeline, what they need to do)\n5. Offers something extra if appropriate (credit, workaround, early access)\n\nTone: [empathetic / professional / casual] — match the customer's energy level.\nLength: Under 150 words. Support replies should be scannable, not essays.",
        category: "customer-support",
        tags: ["support reply", "ticket response", "customer service"],
        useCase:
          "Draft consistent, empathetic support replies for common ticket types.",
        targetKeywords: [
          "support reply prompt",
          "AI customer support",
          "help desk response template",
        ],
        relatedTemplates: ["faq-content-builder", "escalation-response"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "faq-content-builder",
        title: "FAQ Content Builder",
        description:
          "Generate comprehensive FAQ content from common customer questions.",
        prompt:
          "Create FAQ content for [PRODUCT/SERVICE].\n\n**Common questions customers ask:**\n1. [QUESTION 1]\n2. [QUESTION 2]\n3. [QUESTION 3]\n4. [QUESTION 4]\n5. [QUESTION 5]\n\n**Additional context:**\n- Product description: [BRIEF DESCRIPTION]\n- Pricing model: [HOW YOU CHARGE]\n- Key features: [TOP 3 FEATURES]\n\nFor each question, provide:\n1. **Question** (reworded for clarity if needed)\n2. **Short answer** (1-2 sentences for featured snippets / chatbots)\n3. **Detailed answer** (3-5 sentences with specifics)\n4. **Related questions** (2 follow-up questions this person might ask next)\n\nAlso generate:\n- 5 additional questions you'd expect from [CUSTOMER TYPE] that weren't listed\n- Group all questions into categories (e.g., Getting Started, Billing, Features, Troubleshooting)\n- Suggest which answers should include screenshots or video tutorials",
        category: "customer-support",
        tags: ["FAQ", "help center", "knowledge base"],
        useCase:
          "Build a comprehensive FAQ or knowledge base from real customer questions.",
        targetKeywords: [
          "FAQ generator prompt",
          "AI FAQ builder",
          "help center content template",
        ],
        relatedTemplates: ["support-reply-drafter", "escalation-response"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "escalation-response",
        title: "Escalation & Angry Customer Response",
        description:
          "Handle angry or escalated customers with empathy and professionalism.",
        prompt:
          "Draft a response to an escalated / angry customer.\n\n**Customer message:**\n```\n[PASTE THE ANGRY MESSAGE]\n```\n\n**What went wrong:** [EXPLAIN THE ISSUE FROM YOUR SIDE]\n**What you can offer:** [RESOLUTION OPTIONS — refund, credit, expedited fix, etc.]\n**Company policy:** [ANY RELEVANT POLICIES THAT APPLY]\n**Is the customer right?** [YES / PARTIALLY / NO — be honest]\n\nWrite a response that:\n1. **Validates their frustration** — name the emotion, don't dismiss it\n2. **Takes ownership** — no deflecting, no passive voice (\"mistakes were made\")\n3. **Explains** what happened briefly (they want to be understood, not lectured)\n4. **Offers a clear resolution** with options if possible\n5. **Provides a direct contact** for follow-up (not \"reply to this ticket\")\n\nRules:\n- Never say: \"per our policy,\" \"unfortunately,\" \"as I mentioned,\" or \"I understand your frustration, but...\"\n- Do say: \"You're right that...\" \"Here's what I'm doing...\" \"You can reach me directly at...\"\n- If the customer is wrong: still be empathetic, gently correct while offering a goodwill gesture\n- Length: 100-200 words. Angry customers don't want a novel.",
        category: "customer-support",
        tags: ["escalation", "angry customer", "conflict resolution"],
        useCase:
          "De-escalate tense customer situations with professional, empathetic responses.",
        targetKeywords: [
          "angry customer response prompt",
          "escalation email template",
          "AI customer de-escalation",
        ],
        relatedTemplates: ["support-reply-drafter", "faq-content-builder"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
    ],
  },

  // ── Social Media ───────────────────────────────────────────────────────
  {
    slug: "social-media",
    title: "Social Media Content Prompts",
    description:
      "AI prompt templates for creating social media posts, threads, captions, and engagement strategies across platforms.",
    longDescription:
      "Create scroll-stopping social media content with prompt templates for every major platform. From Twitter/X threads to LinkedIn posts to Instagram captions, these templates help you maintain a consistent voice while adapting content to each platform's style and algorithm.",
    icon: "📱",
    keywords: [
      "social media prompts",
      "AI social media templates",
      "social media content",
      "post generator prompts",
    ],
    relatedCategories: ["marketing", "writing", "seo"],
    templates: [
      {
        slug: "twitter-thread-builder",
        title: "Twitter/X Thread Builder",
        description:
          "Create engaging Twitter/X threads that get shared and bookmarked.",
        prompt:
          "Write a Twitter/X thread about [TOPIC].\n\n**Thread goal:** [educate / tell a story / share lessons / break down a concept]\n**Target audience:** [WHO FOLLOWS YOU]\n**Thread length:** [e.g., 7-10 tweets]\n**Tone:** [authoritative / casual / storytelling / contrarian]\n\n**Key points to cover:**\n- [POINT 1]\n- [POINT 2]\n- [POINT 3]\n\nRules:\n1. **Tweet 1 (Hook):** Must stop the scroll. Use a bold claim, surprising stat, or question. No \"Thread 🧵\" — that's lazy.\n2. **Each tweet:** Under 280 characters, one idea per tweet, end with a setup for the next\n3. **Use specifics:** Replace \"a lot\" with \"73%\". Replace \"recently\" with \"last Tuesday.\"\n4. **Tweet 3-4:** Include a concrete example, story, or case study\n5. **Penultimate tweet:** The most actionable/shareable insight\n6. **Final tweet:** Summary + CTA (follow for more, bookmark, retweet)\n\nFormat each tweet clearly numbered. After the thread, provide:\n- A standalone version of Tweet 1 (for quoting the thread)\n- 3 reply tweets you'd add for engagement",
        category: "social-media",
        tags: ["Twitter", "X", "threads", "micro-content"],
        useCase:
          "Build structured Twitter/X threads that drive engagement and followers.",
        targetKeywords: [
          "Twitter thread prompt",
          "AI thread builder",
          "tweet thread template",
        ],
        relatedTemplates: [
          "linkedin-post-writer",
          "instagram-caption-generator",
        ],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "linkedin-post-writer",
        title: "LinkedIn Post Writer",
        description:
          "Write LinkedIn posts that drive engagement and establish thought leadership.",
        prompt:
          "Write a LinkedIn post about [TOPIC].\n\n**Post type:** [personal story / industry insight / hot take / how-to / lesson learned / behind-the-scenes]\n**Your role:** [YOUR JOB TITLE AND INDUSTRY]\n**Goal:** [brand awareness / engagement / lead gen / recruiting]\n**Tone:** [professional-casual / vulnerable / authoritative / conversational]\n\n**Key message:** [THE ONE THING YOU WANT PEOPLE TO TAKE AWAY]\n\nStructure:\n1. **Hook** (first line — this is what shows before \"...see more\"): Bold, specific, slightly provocative\n2. **Story/context** (3-5 short lines): Build context with personal experience\n3. **Insight/lesson** (3-5 lines): The actionable takeaway\n4. **Engagement question** (final line): Ask something specific, not generic\n\nRules:\n- One sentence per line (LinkedIn's format rewards this)\n- Under 1300 characters total (ideal engagement length)\n- No hashtag spam (max 3-5 relevant hashtags at the end)\n- No emoji overload (max 2-3 total)\n- Use \"I\" statements and personal stories (LinkedIn rewards authenticity)\n- Avoid: \"Excited to announce\" / \"Thrilled to share\" / \"I'm humbled\"",
        category: "social-media",
        tags: ["LinkedIn", "thought leadership", "professional networking"],
        useCase:
          "Write LinkedIn posts that build authority and drive meaningful engagement.",
        targetKeywords: [
          "LinkedIn post prompt",
          "AI LinkedIn writer",
          "LinkedIn content template",
        ],
        relatedTemplates: [
          "twitter-thread-builder",
          "instagram-caption-generator",
        ],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "instagram-caption-generator",
        title: "Instagram Caption Generator",
        description:
          "Write engaging Instagram captions with hashtag strategies for maximum reach.",
        prompt:
          "Write an Instagram caption for [DESCRIBE THE POST / IMAGE].\n\n**Account type:** [personal brand / business / creator]\n**Niche:** [YOUR NICHE]\n**Goal:** [engagement / saves / shares / link clicks / followers]\n**Tone:** [playful / inspirational / educational / raw/authentic]\n\nProvide:\n1. **Caption** (under 150 words for feed, under 50 for Reels):\n   - First line: Hook that makes them stop scrolling\n   - Body: Story, tip, or value (use line breaks for readability)\n   - CTA: Specific ask (save this, tag a friend, drop a 🔥, link in bio)\n2. **3 caption alternatives** in different styles\n3. **Hashtag strategy:**\n   - 5 high-volume hashtags (100K+ posts)\n   - 5 medium-volume (10K-100K posts)\n   - 5 niche hashtags (under 10K posts)\n4. **Best posting time** suggestion based on the content type\n5. **Story prompt**: A complementary Instagram Story idea to drive traffic to this post",
        category: "social-media",
        tags: ["Instagram", "captions", "hashtags", "Reels"],
        useCase:
          "Create Instagram captions with optimized hashtag strategies for maximum reach.",
        targetKeywords: [
          "Instagram caption prompt",
          "AI Instagram writer",
          "caption generator template",
        ],
        relatedTemplates: [
          "twitter-thread-builder",
          "linkedin-post-writer",
        ],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "content-repurposing-machine",
        title: "Content Repurposing Machine",
        description:
          "Transform one piece of content into posts for every social media platform.",
        prompt:
          "Repurpose the following content for multiple social media platforms.\n\n**Original content:**\n```\n[PASTE YOUR BLOG POST, ARTICLE, PODCAST TRANSCRIPT, OR VIDEO SCRIPT]\n```\n\n**Your brand voice:** [DESCRIBE YOUR TONE]\n**Platforms to target:** [Twitter/X, LinkedIn, Instagram, TikTok/Reels script, Newsletter]\n\nFor each platform, create:\n\n1. **Twitter/X**: A 7-tweet thread + 3 standalone tweets\n2. **LinkedIn**: A text post (under 1300 chars) with a personal angle\n3. **Instagram**: A carousel concept (slide-by-slide outline, 5-8 slides) + caption\n4. **TikTok/Reels**: A 30-60 second script with hook, body, CTA\n5. **Newsletter snippet**: A 3-paragraph excerpt with a link-back CTA\n\nRules:\n- Each platform version should feel native, not copy-pasted\n- Extract different angles from the original for each platform\n- Maintain the core message across all versions\n- Note which platform each key insight works best for",
        category: "social-media",
        tags: [
          "content repurposing",
          "cross-platform",
          "content strategy",
        ],
        useCase:
          "Turn one piece of content into platform-optimized posts for every channel.",
        targetKeywords: [
          "content repurposing prompt",
          "AI content repurposing",
          "social media content template",
        ],
        relatedTemplates: [
          "twitter-thread-builder",
          "linkedin-post-writer",
          "instagram-caption-generator",
        ],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
    ],
  },

  // ── HR & Recruiting ──────────────────────────────────────────────────────
  {
    slug: "hr-recruiting",
    title: "HR & Recruiting Prompts",
    description:
      "AI prompt templates for job descriptions, interview questions, performance reviews, onboarding, and HR policy drafting. Ready for ChatGPT, Claude, or Gemini.",
    longDescription:
      "Streamline your human resources workflows with tested prompt templates for writing job descriptions, building interview questions, drafting company policies, and managing the full employee lifecycle. Each template is designed for real HR scenarios — from talent acquisition to exit interviews. Paste them into any major AI assistant and customize the bracketed placeholders for your organization.",
    icon: "👥",
    keywords: [
      "HR prompts",
      "recruiting prompts",
      "ChatGPT for HR",
      "job description prompts",
      "interview question prompts",
    ],
    relatedCategories: ["writing", "email", "productivity"],
    templates: [
      {
        slug: "job-description-generator",
        title: "Job Description Generator",
        description:
          "Generate a comprehensive, inclusive job description for any role with responsibilities, qualifications, and benefits.",
        prompt:
          "You are a senior HR professional and talent acquisition specialist. Write a comprehensive job description for the following role.\n\n**Role Details:**\n- Job title: [JOB TITLE]\n- Department: [DEPARTMENT]\n- Reports to: [MANAGER TITLE]\n- Location: [LOCATION / REMOTE / HYBRID]\n- Employment type: [FULL-TIME / PART-TIME / CONTRACT]\n- Salary range: [RANGE OR 'Competitive']\n\n**Company Context:**\n- Company name: [COMPANY NAME]\n- Industry: [INDUSTRY]\n- Company size: [SIZE]\n- Company culture: [2-3 SENTENCES ABOUT CULTURE]\n\n**Role Specifics:**\n- Primary purpose of the role: [WHY THIS ROLE EXISTS]\n- Key projects or goals for first 6 months: [INITIAL OBJECTIVES]\n- Team size: [NUMBER OF DIRECT REPORTS OR TEAM MEMBERS]\n\nWrite the job description with these sections:\n1. **About Us** — 3-4 sentences about the company (engaging, not generic)\n2. **The Role** — 2-3 sentence overview of the position and its impact\n3. **Key Responsibilities** — 8-10 bullet points, starting with action verbs, ordered by importance\n4. **Required Qualifications** — 5-7 must-have skills and experience\n5. **Preferred Qualifications** — 3-5 nice-to-haves\n6. **What We Offer** — 5-7 benefits and perks\n7. **How to Apply** — Clear next steps\n\nGuidelines:\n- Use inclusive, gender-neutral language throughout\n- Avoid jargon and unnecessary acronyms\n- Focus on outcomes and impact rather than just tasks\n- Keep required qualifications realistic to avoid discouraging diverse candidates\n- Include a diversity statement at the end",
        category: "hr-recruiting",
        tags: ["job description", "talent acquisition", "hiring"],
        useCase:
          "Create a polished, inclusive job posting when opening a new position or refreshing an outdated listing.",
        exampleInput:
          "JOB TITLE: Senior Product Designer, DEPARTMENT: Design, LOCATION: Remote (US), COMPANY NAME: Bloom Health, INDUSTRY: Digital health, CULTURE: Collaborative, mission-driven, flexible work hours",
        exampleOutput:
          "About Us: Bloom Health is reshaping how people manage chronic conditions through intuitive digital tools. The Role: As our Senior Product Designer, you will lead the end-to-end design of patient-facing features that directly improve health outcomes for millions of users...",
        targetKeywords: [
          "job description generator prompt",
          "AI job description template",
          "ChatGPT job posting",
        ],
        relatedTemplates: ["interview-question-builder", "candidate-rejection-email"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "interview-question-builder",
        title: "Interview Question Builder",
        description:
          "Build a structured interview question set with behavioral, technical, and culture-fit questions for any role.",
        prompt:
          "You are an experienced hiring manager and interview design expert. Create a structured interview question set for the following role.\n\n**Role:** [JOB TITLE]\n**Department:** [DEPARTMENT]\n**Level:** [ENTRY / MID / SENIOR / LEAD / EXECUTIVE]\n**Key competencies to assess:** [LIST 3-5 COMPETENCIES, e.g., leadership, problem-solving, technical depth, collaboration]\n**Interview stage:** [PHONE SCREEN / FIRST ROUND / TECHNICAL / FINAL / PANEL]\n**Interview duration:** [MINUTES]\n\nCreate questions organized into these categories:\n\n1. **Behavioral Questions (STAR method)** — 4 questions that probe past experience\n   - For each, provide the competency being assessed and what a strong answer looks like\n2. **Situational Questions** — 3 hypothetical scenario questions relevant to the role\n   - Include the scenario and the ideal reasoning pattern to look for\n3. **Technical / Role-Specific Questions** — 4 questions that test domain knowledge\n   - Include expected depth of answer for the target level\n4. **Culture & Values Fit** — 3 questions aligned with [COMPANY VALUES OR CULTURE TRAITS]\n5. **Candidate Questions** — Suggest 3 questions the interviewer should encourage the candidate to ask\n\nFor each question provide:\n- The question itself\n- Why it matters for this role\n- Red flags to watch for in answers\n- A scoring rubric: 1 (Poor) / 2 (Acceptable) / 3 (Strong) with brief descriptions\n\nEnd with a recommended interview flow and time allocation for each section.",
        category: "hr-recruiting",
        tags: ["interview questions", "hiring", "behavioral interview"],
        useCase:
          "Prepare a structured, fair interview process when you need consistent evaluation criteria across all candidates.",
        exampleInput:
          "JOB TITLE: Backend Engineer, LEVEL: Mid, KEY COMPETENCIES: system design, debugging, collaboration, ownership, INTERVIEW STAGE: Technical round, DURATION: 60 minutes",
        exampleOutput:
          "Behavioral Q1: Tell me about a time you had to debug a production outage under pressure. What was your process? (Assesses: debugging, ownership. Strong answer: describes systematic triage, communication with stakeholders, and post-mortem follow-up)...",
        targetKeywords: [
          "interview question prompt",
          "AI interview questions generator",
          "structured interview template",
        ],
        relatedTemplates: ["job-description-generator", "employee-performance-review-writer"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "employee-performance-review-writer",
        title: "Employee Performance Review Writer",
        description:
          "Draft a balanced, constructive employee performance review with strengths, growth areas, and goals.",
        prompt:
          "You are an HR consultant who specializes in performance management. Draft a comprehensive performance review for the following employee.\n\n**Employee Details:**\n- Name: [EMPLOYEE NAME]\n- Role: [JOB TITLE]\n- Department: [DEPARTMENT]\n- Review period: [START DATE] to [END DATE]\n- Manager: [MANAGER NAME]\n\n**Performance Data:**\n- Key accomplishments this period: [LIST 3-5 ACCOMPLISHMENTS]\n- Goals from last review and status: [LIST GOALS AND WHETHER MET/PARTIALLY MET/NOT MET]\n- Areas where employee excelled: [STRENGTHS]\n- Areas needing improvement: [DEVELOPMENT AREAS]\n- Feedback from peers or stakeholders: [SUMMARY OF 360 FEEDBACK]\n- Any notable incidents (positive or negative): [INCIDENTS]\n\n**Rating Scale:** [e.g., 1-5, Exceeds/Meets/Below Expectations]\n\nWrite the review with these sections:\n1. **Overall Summary** — 3-4 sentences capturing the review period holistically\n2. **Key Accomplishments** — Detailed write-up of top 3-5 achievements with business impact\n3. **Strengths** — 3 core strengths with specific examples\n4. **Development Areas** — 2-3 areas for growth, framed constructively with actionable suggestions\n5. **Goals for Next Period** — 3-5 SMART goals (Specific, Measurable, Achievable, Relevant, Time-bound)\n6. **Overall Rating** — Rating with justification\n7. **Manager Comments** — Space for personalized closing remarks\n\nTone: Professional, specific, balanced. Avoid vague language like 'good job' — use concrete examples. Frame development areas as opportunities, not criticisms.",
        category: "hr-recruiting",
        tags: ["performance review", "employee evaluation", "HR management"],
        useCase:
          "Write thorough, fair performance reviews during annual or quarterly review cycles.",
        exampleInput:
          "EMPLOYEE NAME: Sarah Chen, ROLE: Marketing Manager, REVIEW PERIOD: Jan-Jun 2026, ACCOMPLISHMENTS: Led rebrand launch, grew social engagement 40%, mentored 2 junior marketers, DEVELOPMENT AREAS: delegation, cross-functional communication",
        exampleOutput:
          "Overall Summary: Sarah has delivered exceptional results during the first half of 2026, most notably leading our rebrand initiative that increased brand recognition by 25%. Her mentorship of junior team members demonstrates growing leadership capabilities...",
        targetKeywords: [
          "performance review prompt",
          "AI employee review generator",
          "performance evaluation template",
        ],
        relatedTemplates: ["interview-question-builder", "exit-interview-question-set"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "onboarding-checklist-creator",
        title: "Onboarding Checklist Creator",
        description:
          "Create a structured new-hire onboarding checklist covering the first 30, 60, and 90 days.",
        prompt:
          "You are an HR onboarding specialist. Create a comprehensive onboarding checklist for a new hire joining the company.\n\n**New Hire Details:**\n- Role: [JOB TITLE]\n- Department: [DEPARTMENT]\n- Start date: [DATE]\n- Location: [OFFICE / REMOTE / HYBRID]\n- Manager: [MANAGER NAME]\n- Buddy/Mentor assigned: [YES/NO]\n\n**Company Context:**\n- Company size: [SIZE]\n- Key tools used: [LIST TOOLS, e.g., Slack, Jira, Google Workspace, Figma]\n- Training resources available: [e.g., LMS, recorded sessions, wiki]\n\nCreate an onboarding plan organized as follows:\n\n**Pre-Start (Before Day 1):**\n- 8-10 items covering IT setup, access provisioning, welcome materials, and manager prep\n\n**Week 1 — Orientation & Setup:**\n- Day-by-day schedule for the first 5 days\n- Include: system access, team introductions, tool walkthroughs, HR paperwork, first 1:1 with manager\n- Assign owners for each task (HR, IT, Manager, Buddy)\n\n**Days 8-30 — Learning & Integration:**\n- Key milestones: complete training modules, shadow team members, attend key meetings\n- Weekly check-in topics with manager\n- Social integration activities\n\n**Days 31-60 — Contributing:**\n- First independent deliverables or projects\n- Cross-functional introductions\n- Feedback checkpoint with manager\n\n**Days 61-90 — Ownership:**\n- Performance expectations and first review criteria\n- Goal-setting session\n- Formal 90-day review checklist\n\nFormat each item as a checkbox with: Task | Owner | Due Date | Status. Include a section on how to measure onboarding success.",
        category: "hr-recruiting",
        tags: ["onboarding", "new hire", "employee experience"],
        useCase:
          "Build a repeatable onboarding program when hiring for a new role or improving your current new-hire experience.",
        exampleInput:
          "ROLE: Software Engineer, DEPARTMENT: Engineering, LOCATION: Remote, TOOLS: GitHub, Slack, Linear, VS Code, Notion, COMPANY SIZE: 80 employees",
        exampleOutput:
          "Pre-Start: IT provisions laptop with standard dev environment (Owner: IT, Due: 3 days before start). Week 1 Day 1: Welcome call with manager and buddy, complete HR paperwork, Slack and email access setup...",
        targetKeywords: [
          "onboarding checklist prompt",
          "AI onboarding template",
          "new hire checklist generator",
        ],
        relatedTemplates: ["employee-handbook-section-writer", "company-policy-drafter"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "company-policy-drafter",
        title: "Company Policy Drafter",
        description:
          "Draft a clear, enforceable company policy on any workplace topic with scope, guidelines, and compliance notes.",
        prompt:
          "You are an HR policy consultant. Draft a comprehensive company policy for the following topic.\n\n**Policy Topic:** [POLICY TOPIC, e.g., Remote Work, PTO, Social Media Use, Anti-Harassment, Expense Reimbursement]\n**Company Name:** [COMPANY NAME]\n**Industry:** [INDUSTRY]\n**Company Size:** [SIZE]\n**Location(s):** [JURISDICTIONS FOR COMPLIANCE]\n**Current policy status:** [NEW POLICY / UPDATING EXISTING]\n\n**Specific requirements or constraints:**\n- [REQUIREMENT 1, e.g., must comply with FMLA]\n- [REQUIREMENT 2, e.g., applies to both employees and contractors]\n- [REQUIREMENT 3, e.g., CEO wants flexible approach]\n\nDraft the policy with these sections:\n1. **Policy Title and Version** — Name, effective date, version number\n2. **Purpose** — Why this policy exists (2-3 sentences)\n3. **Scope** — Who the policy applies to (roles, departments, employment types)\n4. **Definitions** — Key terms used in the policy\n5. **Policy Statement** — The core rules and guidelines (detailed, unambiguous)\n6. **Procedures** — Step-by-step processes for implementation (e.g., how to request PTO, how to report violations)\n7. **Roles and Responsibilities** — What employees, managers, and HR are each responsible for\n8. **Compliance and Consequences** — What happens if the policy is violated, escalation process\n9. **Exceptions** — How to request an exception and who approves\n10. **Review Schedule** — When and how the policy will be reviewed and updated\n11. **Acknowledgment** — Employee signature/acknowledgment section\n\nTone: Clear, professional, firm but fair. Avoid legalese where possible — employees should understand this without a law degree. Flag any areas where legal counsel should review before finalizing.",
        category: "hr-recruiting",
        tags: ["company policy", "HR compliance", "workplace guidelines"],
        useCase:
          "Draft or update a company policy document when introducing new workplace rules or refreshing outdated ones.",
        exampleInput:
          "POLICY TOPIC: Remote Work Policy, COMPANY NAME: NovaTech Solutions, INDUSTRY: SaaS, SIZE: 200, LOCATIONS: US and Canada, REQUIREMENTS: Must address equipment stipends, core hours for collaboration, and data security",
        exampleOutput:
          "Policy: NovaTech Solutions Remote Work Policy v1.0. Purpose: This policy establishes guidelines for remote work arrangements to ensure productivity, collaboration, and data security across our distributed workforce...",
        targetKeywords: [
          "company policy prompt",
          "AI HR policy generator",
          "workplace policy template",
        ],
        relatedTemplates: ["employee-handbook-section-writer", "onboarding-checklist-creator"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "employee-handbook-section-writer",
        title: "Employee Handbook Section Writer",
        description:
          "Write a polished employee handbook section on any topic with company-specific tone and compliance considerations.",
        prompt:
          "You are a senior HR director writing an employee handbook. Write a complete handbook section for the following topic.\n\n**Section Topic:** [TOPIC, e.g., Code of Conduct, Leave Policies, Compensation & Benefits, Workplace Safety, Professional Development]\n**Company Name:** [COMPANY NAME]\n**Company Values:** [LIST 3-5 CORE VALUES]\n**Company Tone:** [FORMAL / CONVERSATIONAL / STARTUP-CASUAL]\n**Industry:** [INDUSTRY]\n**Jurisdiction:** [STATE/COUNTRY FOR LEGAL COMPLIANCE]\n\n**Specific items to address:**\n- [ITEM 1]\n- [ITEM 2]\n- [ITEM 3]\n\nWrite the handbook section with:\n1. **Section Header** with a brief, welcoming introduction (2-3 sentences that connect the topic to company values)\n2. **Detailed Content** — Cover all aspects of the topic with clear, specific guidelines. Use numbered lists for processes, bullet points for options or categories\n3. **Examples** — Include 2-3 real-world examples or scenarios to illustrate key points\n4. **FAQ** — 4-5 frequently asked questions employees might have about this topic\n5. **Key Contacts** — Who to reach out to for questions (placeholder roles)\n6. **Related Policies** — Cross-references to other handbook sections\n\nGuidelines:\n- Write in second person ('you') to feel direct and personal\n- Keep paragraphs short (3-4 sentences max)\n- Bold key terms and important deadlines\n- Flag any statements that should be reviewed by legal counsel with [LEGAL REVIEW]\n- Match the specified company tone throughout",
        category: "hr-recruiting",
        tags: ["employee handbook", "HR documentation", "company culture"],
        useCase:
          "Build or refresh your employee handbook one section at a time with consistent formatting and tone.",
        exampleInput:
          "TOPIC: Professional Development & Learning, COMPANY: Meridian Labs, VALUES: Growth mindset, transparency, ownership, TONE: Conversational, JURISDICTION: California",
        exampleOutput:
          "Professional Development & Learning: At Meridian Labs, we believe your growth is our growth. We invest in your development because when you level up, the whole team benefits. Learning Budget: Every full-time employee receives $2,000 per year...",
        targetKeywords: [
          "employee handbook prompt",
          "AI handbook section writer",
          "HR handbook template",
        ],
        relatedTemplates: ["company-policy-drafter", "onboarding-checklist-creator"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "candidate-rejection-email",
        title: "Candidate Rejection Email",
        description:
          "Write a professional, empathetic rejection email that preserves the candidate relationship and employer brand.",
        prompt:
          "You are a talent acquisition specialist known for delivering excellent candidate experience. Write a rejection email for the following situation.\n\n**Candidate Details:**\n- Candidate name: [CANDIDATE NAME]\n- Role applied for: [JOB TITLE]\n- Interview stage reached: [APPLICATION / PHONE SCREEN / FIRST INTERVIEW / FINAL ROUND]\n- Specific strengths noted: [1-2 STRENGTHS YOU OBSERVED]\n- Reason for rejection: [REASON — e.g., another candidate had more relevant experience, role requirements shifted, not enough experience in X]\n\n**Company Details:**\n- Company name: [COMPANY NAME]\n- Recruiter/sender name: [YOUR NAME]\n- Keep on file for future roles: [YES/NO]\n- Offer feedback session: [YES/NO]\n\nWrite the email with:\n1. **Subject line** — Professional, not misleading (3 options)\n2. **Opening** — Thank them genuinely for their time and interest\n3. **Decision** — Deliver the news clearly and respectfully without burying the lead\n4. **Personalized feedback** — Reference their specific strengths (do NOT give detailed reasons for rejection unless feedback session is offered)\n5. **Future connection** — If keeping on file, explain how and encourage them to apply again. If offering feedback, include how to schedule.\n6. **Warm closing** — Wish them well in their search\n\nTone guidelines:\n- Empathetic but direct — don't make them read 3 paragraphs before the decision\n- Avoid corporate cliches like 'after careful consideration' or 'we regret to inform you'\n- Keep it under 200 words for application/phone screen stage, up to 300 words for final round\n- Make the candidate feel valued even though the answer is no",
        category: "hr-recruiting",
        tags: ["rejection email", "candidate experience", "talent acquisition"],
        useCase:
          "Send thoughtful rejection emails that maintain your employer brand and keep the door open for future talent.",
        exampleInput:
          "CANDIDATE: James Rivera, ROLE: Product Manager, STAGE: Final Round, STRENGTHS: strong analytical thinking, excellent presentation skills, REASON: another candidate had deeper industry experience, KEEP ON FILE: Yes, OFFER FEEDBACK: Yes",
        exampleOutput:
          "Subject: Your Product Manager Interview at Bloom — Update. Hi James, Thank you for the time you invested in our interview process — your product case presentation was one of the strongest we've seen. After completing our final interviews, we've decided to move forward with another candidate...",
        targetKeywords: [
          "rejection email prompt",
          "AI candidate rejection template",
          "professional rejection letter",
        ],
        relatedTemplates: ["job-description-generator", "interview-question-builder"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "diversity-inclusion-initiative-planner",
        title: "Diversity & Inclusion Initiative Planner",
        description:
          "Design a structured diversity and inclusion initiative with objectives, programs, metrics, and an implementation timeline.",
        prompt:
          "You are a Diversity, Equity, and Inclusion (DEI) strategist. Design a comprehensive DEI initiative for the following organization.\n\n**Organization Details:**\n- Company name: [COMPANY NAME]\n- Industry: [INDUSTRY]\n- Size: [EMPLOYEE COUNT]\n- Current DEI maturity: [EARLY STAGE / DEVELOPING / ESTABLISHED]\n- Key demographics: [ANY KNOWN WORKFORCE COMPOSITION DATA]\n\n**Focus Areas:**\n- Primary goals: [LIST 2-3 GOALS, e.g., improve representation in leadership, reduce bias in hiring, create inclusive culture]\n- Known challenges: [CURRENT CHALLENGES, e.g., low retention of underrepresented groups, lack of mentorship programs, unconscious bias in promotions]\n- Budget range: [LOW / MEDIUM / HIGH]\n- Timeline: [6 MONTHS / 1 YEAR / 2 YEARS]\n\nCreate a DEI initiative plan with:\n\n1. **Executive Summary** — 3-4 sentences on the business case for this initiative\n2. **Assessment Framework** — How to measure current state (surveys, data audits, focus groups)\n3. **Strategic Pillars** — 3-4 core pillars (e.g., Inclusive Hiring, Belonging & Culture, Equitable Growth, Community Impact) with 2-3 programs under each\n4. **Program Details** — For each program, include:\n   - Description and objectives\n   - Target audience\n   - Resources needed\n   - Success metrics (quantitative and qualitative)\n5. **Implementation Timeline** — Phase 1 (foundation), Phase 2 (launch), Phase 3 (scale) with milestones\n6. **Governance** — DEI council structure, executive sponsors, reporting cadence\n7. **Budget Estimate** — Breakdown by category\n8. **Measurement & Accountability** — KPIs, reporting dashboard, annual review process\n\nEnsure recommendations are evidence-based, actionable, and avoid performative measures. Focus on systemic changes, not just awareness campaigns.",
        category: "hr-recruiting",
        tags: ["diversity inclusion", "DEI", "workplace culture"],
        useCase:
          "Launch or revamp your company's DEI strategy with a structured, measurable initiative plan.",
        exampleInput:
          "COMPANY: Atlas Robotics, SIZE: 500, DEI MATURITY: Early stage, GOALS: improve hiring pipeline diversity and create ERGs, CHALLENGES: 85% male engineering team, no formal DEI programs, TIMELINE: 1 year",
        exampleOutput:
          "Executive Summary: Atlas Robotics has an opportunity to build a diverse, innovative workforce that reflects the global communities our technology serves. Strategic Pillar 1 — Inclusive Hiring: Blind resume screening, diverse interview panels, partnership with HBCUs and coding bootcamps...",
        targetKeywords: [
          "DEI initiative prompt",
          "diversity inclusion plan template",
          "AI DEI strategy generator",
        ],
        relatedTemplates: ["company-policy-drafter", "team-building-activity-generator"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "team-building-activity-generator",
        title: "Team Building Activity Generator",
        description:
          "Generate creative, inclusive team building activities tailored to your team's size, format, and goals.",
        prompt:
          "You are an organizational development consultant who designs team-building experiences. Generate team building activities for the following context.\n\n**Team Details:**\n- Team size: [NUMBER OF PEOPLE]\n- Department(s): [DEPARTMENT(S)]\n- Work setup: [IN-PERSON / REMOTE / HYBRID]\n- Team tenure: [NEW TEAM / ESTABLISHED / MIX OF NEW AND TENURED]\n- Known team dynamics: [e.g., silos between subteams, low engagement, recently merged teams, great collaboration but want more fun]\n\n**Activity Requirements:**\n- Purpose: [GOAL, e.g., build trust, improve communication, celebrate a milestone, break silos, welcome new members]\n- Time available: [e.g., 30 minutes, half day, full day]\n- Budget: [NONE / LOW / MEDIUM / HIGH]\n- Constraints: [e.g., some team members have mobility limitations, multiple time zones, introverts on team]\n\nGenerate:\n\n1. **5 Activity Options** — For each activity include:\n   - Name and tagline\n   - Format: In-person / Virtual / Hybrid compatible\n   - Duration and group size requirements\n   - Materials or tools needed\n   - Step-by-step facilitation guide (what the organizer says and does)\n   - How it achieves the stated goal\n   - Inclusivity notes (accommodations for different abilities, personalities, cultures)\n   - Energy level: Low / Medium / High\n\n2. **Recommended Agenda** — If this is a half-day or full-day event, provide a sample agenda combining 2-3 activities with breaks\n\n3. **Follow-Up** — Suggest a way to reinforce the team-building outcomes in the following weeks (e.g., Slack rituals, recurring activities)\n\nAvoid activities that are exclusionary, overly competitive, or require sharing personal information that could make people uncomfortable.",
        category: "hr-recruiting",
        tags: ["team building", "employee engagement", "team activities"],
        useCase:
          "Plan engaging team activities for offsites, virtual events, or regular team bonding sessions.",
        exampleInput:
          "TEAM SIZE: 15, SETUP: Hybrid (8 in-office, 7 remote), PURPOSE: Break silos between design and engineering, TIME: 2 hours, BUDGET: Low, CONSTRAINTS: 3 time zones (US)",
        exampleOutput:
          "Activity 1: 'Design & Debug Swap' — Designers attempt a simple coding challenge while engineers try a quick design task, then pairs share results. Format: Virtual-compatible. Duration: 45 min. Goal: builds empathy across disciplines...",
        targetKeywords: [
          "team building activity prompt",
          "AI team building ideas",
          "virtual team building generator",
        ],
        relatedTemplates: ["diversity-inclusion-initiative-planner", "onboarding-checklist-creator"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "exit-interview-question-set",
        title: "Exit Interview Question Set",
        description:
          "Create a thoughtful exit interview question set that uncovers genuine feedback on culture, management, and retention.",
        prompt:
          "You are an HR business partner who specializes in employee retention and organizational insights. Create an exit interview question set for the following context.\n\n**Departing Employee Details:**\n- Role: [JOB TITLE]\n- Department: [DEPARTMENT]\n- Tenure: [LENGTH OF EMPLOYMENT]\n- Reason for leaving (if known): [REASON, e.g., new opportunity, relocation, dissatisfaction, career change]\n- Performance level: [HIGH PERFORMER / SOLID CONTRIBUTOR / UNDERPERFORMER]\n\n**Company Context:**\n- Known retention challenges: [e.g., compensation concerns, limited growth paths, management issues]\n- Areas HR wants to investigate: [SPECIFIC TOPICS, e.g., manager effectiveness, culture post-merger, remote work satisfaction]\n\nCreate the exit interview with:\n\n1. **Opening Questions (Rapport Building)** — 3 questions to set a comfortable tone and encourage honesty\n2. **Role & Work Experience** — 4 questions about day-to-day satisfaction, workload, and resources\n3. **Management & Leadership** — 4 questions about their relationship with their manager, leadership visibility, and communication\n4. **Culture & Environment** — 4 questions about belonging, values alignment, and team dynamics\n5. **Growth & Development** — 3 questions about career development opportunities, feedback quality, and learning\n6. **Compensation & Benefits** — 3 questions about pay satisfaction, benefits utilization, and competitiveness\n7. **Decision to Leave** — 4 questions about the tipping point, what could have changed their mind, and what the new role offers\n8. **Recommendations** — 3 questions asking for candid suggestions for improvement\n9. **Closing** — 2 questions about willingness to return (boomerang potential) and final thoughts\n\nFor each question:\n- Provide the question text\n- Add a follow-up probe question\n- Note what insight HR should extract from the answer\n- Flag which questions are critical vs. optional based on time constraints\n\nInclude instructions for the interviewer on creating psychological safety so the employee gives honest answers rather than polite deflections.",
        category: "hr-recruiting",
        tags: ["exit interview", "employee retention", "HR insights"],
        useCase:
          "Conduct meaningful exit interviews that produce actionable insights for improving retention and culture.",
        exampleInput:
          "ROLE: Senior Software Engineer, TENURE: 3 years, REASON: Leaving for a startup with equity, PERFORMANCE: High performer, RETENTION CHALLENGES: Limited senior IC track, below-market equity",
        exampleOutput:
          "Opening Q1: Before we dive in, I want you to know this conversation is confidential and helps us improve. Looking back at your three years here, what stands out as the highlight of your experience? (Probe: What made that moment meaningful?) Insight: Identifies what the company does well to retain talent...",
        targetKeywords: [
          "exit interview questions prompt",
          "AI exit interview template",
          "employee exit interview generator",
        ],
        relatedTemplates: ["employee-performance-review-writer", "interview-question-builder"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
    ],
  },

  // ── Legal ────────────────────────────────────────────────────────────────
  {
    slug: "legal",
    title: "Legal Prompts",
    description:
      "AI prompt templates for contract drafting, legal research, NDAs, terms of service, privacy policies, and legal communication. Works with ChatGPT, Claude, or Gemini.",
    longDescription:
      "Accelerate legal workflows with prompt templates designed for contract clause drafting, legal research summaries, client communications, and compliance checklists. Each template provides a structured framework that helps you produce well-organized legal documents faster — while always flagging areas that require licensed attorney review. Paste into any AI assistant and customize the bracketed placeholders for your matter.",
    icon: "⚖️",
    keywords: [
      "legal prompts",
      "ChatGPT for lawyers",
      "AI legal templates",
      "contract prompts",
      "legal writing prompts",
    ],
    relatedCategories: ["writing", "hr-recruiting", "finance"],
    templates: [
      {
        slug: "contract-clause-drafter",
        title: "Contract Clause Drafter",
        description:
          "Draft precise, enforceable contract clauses for any agreement type with plain-language explanations.",
        prompt:
          "You are a commercial contracts attorney with 15 years of experience. Draft a contract clause for the following requirement.\n\n**Clause Type:** [CLAUSE TYPE, e.g., Indemnification, Limitation of Liability, Termination for Convenience, Non-Compete, Force Majeure, Payment Terms, Intellectual Property Assignment]\n**Agreement Type:** [e.g., SaaS Agreement, Employment Contract, Vendor Agreement, Partnership Agreement]\n**Governing Law:** [JURISDICTION, e.g., State of Delaware, England and Wales]\n**Parties:**\n- Party A: [NAME AND ROLE, e.g., 'Acme Corp (Service Provider)']\n- Party B: [NAME AND ROLE, e.g., 'Client Co (Customer)']\n\n**Specific Requirements:**\n- [REQUIREMENT 1, e.g., cap liability at 12 months of fees]\n- [REQUIREMENT 2, e.g., mutual indemnification for IP infringement]\n- [REQUIREMENT 3, e.g., 30-day cure period before termination]\n\n**Drafting Perspective:** [PARTY A / PARTY B / BALANCED]\n\nProvide:\n1. **Clause Text** — The formal contract language, properly numbered and formatted\n2. **Plain-Language Summary** — A 2-3 sentence explanation of what this clause means in everyday language\n3. **Key Protections** — What each party gains and gives up under this clause\n4. **Negotiation Notes** — Common pushback points and suggested compromise positions\n5. **Alternative Version** — A more aggressive and a more conservative version of the same clause\n6. **Risk Flags** — Potential enforceability issues or jurisdiction-specific considerations\n\n[DISCLAIMER: This is a drafting aid, not legal advice. All clauses should be reviewed by a licensed attorney before use in any binding agreement.]",
        category: "legal",
        tags: ["contract drafting", "legal clauses", "commercial law"],
        useCase:
          "Draft or refine specific contract clauses when building agreements or responding to redlines from the other party.",
        exampleInput:
          "CLAUSE TYPE: Limitation of Liability, AGREEMENT TYPE: SaaS Agreement, GOVERNING LAW: Delaware, PARTY A: CloudSync Inc (Provider), PARTY B: RetailMax (Customer), REQUIREMENTS: cap at 12 months fees, exclude willful misconduct, PERSPECTIVE: Balanced",
        exampleOutput:
          "Clause: Limitation of Liability. 8.1 Except for obligations under Section 7 (Indemnification) and breaches of Section 9 (Confidentiality), neither party's aggregate liability under this Agreement shall exceed the total fees paid or payable by Customer in the twelve (12) months preceding the claim...",
        targetKeywords: [
          "contract clause prompt",
          "AI contract drafter",
          "legal clause generator",
        ],
        relatedTemplates: ["nda-generator", "terms-of-service-outline"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "legal-research-summary",
        title: "Legal Research Summary",
        description:
          "Structure a legal research summary with issue identification, applicable law, analysis, and actionable conclusions.",
        prompt:
          "You are a legal research analyst. Create a structured legal research summary for the following question.\n\n**Research Question:** [STATE THE LEGAL QUESTION CLEARLY]\n**Jurisdiction:** [JURISDICTION(S)]\n**Area of Law:** [e.g., Employment Law, Contract Law, Intellectual Property, Data Privacy, Corporate Governance]\n**Client Context:** [BRIEF DESCRIPTION OF THE CLIENT'S SITUATION]\n**Urgency:** [ROUTINE / TIME-SENSITIVE / URGENT]\n\n**Known Information:**\n- Relevant facts: [KEY FACTS]\n- Any applicable statutes or regulations already identified: [LIST IF KNOWN]\n- Opposing party's position (if applicable): [THEIR ARGUMENT]\n\nOrganize the research summary as follows:\n\n1. **Issue Statement** — Restate the legal question precisely in one sentence\n2. **Short Answer** — A 2-3 sentence direct answer to the question\n3. **Applicable Law** — Identify relevant statutes, regulations, and key case law. For each authority:\n   - Citation and jurisdiction\n   - Relevant holding or provision\n   - How it applies to this situation\n4. **Analysis** — Apply the law to the client's facts. Address:\n   - Strongest arguments for the client's position\n   - Potential counterarguments and how to address them\n   - Any ambiguities or unsettled areas of law\n5. **Risk Assessment** — Rate the legal risk as Low / Medium / High with explanation\n6. **Recommended Action** — 3-5 specific, prioritized steps the client should take\n7. **Further Research Needed** — Flag any areas requiring deeper investigation\n8. **Key Deadlines** — Any statutes of limitations or filing deadlines to note\n\n[DISCLAIMER: This summary is a research framework, not legal advice. Verify all citations and consult with a licensed attorney for case-specific guidance.]",
        category: "legal",
        tags: ["legal research", "case analysis", "legal writing"],
        useCase:
          "Organize legal research findings into a clear, actionable memo when responding to a client question or preparing for litigation.",
        exampleInput:
          "QUESTION: Can our company enforce a non-compete clause against a departing employee who is moving to a competitor in California? JURISDICTION: Texas (employer) and California (new employer), AREA: Employment Law, CONTEXT: Employee signed non-compete in Texas, accepted role with CA competitor",
        exampleOutput:
          "Issue: Whether a non-compete agreement executed in Texas is enforceable against a former employee who relocates to California for competing employment. Short Answer: Enforcement is highly unlikely. California Business and Professions Code Section 16600 generally voids non-compete agreements...",
        targetKeywords: [
          "legal research prompt",
          "AI legal research template",
          "legal memo generator",
        ],
        relatedTemplates: ["legal-memo-writer", "case-brief-summarizer"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "client-communication-drafter",
        title: "Client Communication Drafter",
        description:
          "Draft professional legal client communications including updates, advice letters, and engagement confirmations.",
        prompt:
          "You are a client relationship-focused attorney. Draft a professional client communication for the following situation.\n\n**Communication Type:** [STATUS UPDATE / ADVICE LETTER / ENGAGEMENT LETTER / DEMAND RESPONSE / SETTLEMENT DISCUSSION / FEE ESTIMATE]\n**Client Name:** [CLIENT NAME]\n**Matter:** [BRIEF DESCRIPTION OF THE LEGAL MATTER]\n**Recipient Sophistication:** [INDIVIDUAL / SMALL BUSINESS OWNER / IN-HOUSE COUNSEL / EXECUTIVE]\n**Tone:** [FORMAL / PROFESSIONAL-FRIENDLY / REASSURING]\n\n**Key Points to Communicate:**\n- [POINT 1, e.g., case status update]\n- [POINT 2, e.g., upcoming deadlines]\n- [POINT 3, e.g., recommended next steps]\n- [POINT 4, e.g., fee or cost information]\n\n**Sensitive Elements:**\n- [ANY BAD NEWS TO DELIVER]\n- [AREAS OF UNCERTAINTY]\n- [BUDGET CONCERNS]\n\nDraft the communication with:\n1. **Subject Line / RE Line** — Clear and specific to the matter\n2. **Opening** — Appropriate greeting and context reminder\n3. **Body** — Organized presentation of key points with:\n   - Plain-language explanations (avoid unnecessary jargon, define legal terms when used)\n   - Clear distinction between facts, analysis, and recommendations\n   - Any decisions the client needs to make, with options and trade-offs\n4. **Action Items** — Numbered list of what the client needs to do, with deadlines\n5. **Next Steps** — What you will do next and the expected timeline\n6. **Closing** — Invitation for questions, contact information\n\nGuidelines:\n- Adjust complexity to recipient sophistication level\n- If delivering bad news, use the buffer-reason-decision structure\n- Include appropriate caveats without being unnecessarily alarming\n- Keep under 500 words for updates, up to 1000 for advice letters\n- Flag any privileged or confidential markings needed",
        category: "legal",
        tags: ["client communication", "legal correspondence", "attorney letters"],
        useCase:
          "Write clear, professional client communications that build trust and ensure clients understand their legal situation.",
        exampleInput:
          "TYPE: Status Update, CLIENT: Maria Santos, MATTER: Employment discrimination claim, RECIPIENT: Individual, TONE: Reassuring, KEY POINTS: Deposition scheduled for next month, opposing counsel requested extension, settlement conference offered",
        exampleOutput:
          "RE: Santos v. Pinnacle Industries — Case Status Update. Dear Maria, I'm writing to update you on several recent developments in your case. First, some positive news: the court has scheduled your deposition for March 15...",
        targetKeywords: [
          "legal client letter prompt",
          "attorney communication template",
          "AI legal correspondence",
        ],
        relatedTemplates: ["cease-and-desist-letter-template", "legal-memo-writer"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "nda-generator",
        title: "NDA Generator",
        description:
          "Generate a structured non-disclosure agreement framework with customizable terms, obligations, and exceptions.",
        prompt:
          "You are a corporate attorney specializing in confidentiality agreements. Generate a comprehensive NDA framework for the following situation.\n\n**NDA Type:** [MUTUAL / ONE-WAY (specify discloser and recipient)]\n**Purpose:** [WHY CONFIDENTIAL INFORMATION IS BEING SHARED, e.g., potential partnership, due diligence, vendor evaluation, employment discussion]\n**Parties:**\n- Party A: [NAME, ENTITY TYPE, JURISDICTION]\n- Party B: [NAME, ENTITY TYPE, JURISDICTION]\n\n**Key Terms:**\n- Duration of obligations: [e.g., 2 years, 3 years, perpetual for trade secrets]\n- Definition of confidential information: [BROAD / NARROW / SPECIFIC CATEGORIES]\n- Permitted disclosures: [e.g., employees on need-to-know basis, legal advisors, affiliates]\n- Return/destruction of materials: [TIMEFRAME AFTER TERMINATION]\n- Governing law: [JURISDICTION]\n- Dispute resolution: [LITIGATION / ARBITRATION / MEDIATION FIRST]\n\n**Special Considerations:**\n- [e.g., involves trade secrets, international parties, publicly traded companies, prior NDA exists]\n\nGenerate the NDA with these sections:\n1. **Recitals** — Purpose and context of the agreement\n2. **Definitions** — Confidential Information, Disclosing Party, Receiving Party, Representatives\n3. **Obligations of Receiving Party** — Standard of care, permitted use, access limitations\n4. **Exclusions** — Information that is not considered confidential (publicly available, independently developed, lawfully obtained from third parties, required by law)\n5. **Compelled Disclosure** — Procedure when legally compelled to disclose (notice requirement, cooperation)\n6. **Term and Termination** — Duration and survival of obligations\n7. **Remedies** — Injunctive relief, damages, indemnification\n8. **Return of Materials** — Obligations upon termination\n9. **General Provisions** — Assignment, amendment, severability, entire agreement, counterparts\n10. **Signature Block** — Formatted for both parties\n\n[DISCLAIMER: This is a template framework. Have a licensed attorney review and customize for your specific situation before execution.]",
        category: "legal",
        tags: ["NDA", "confidentiality agreement", "corporate law"],
        useCase:
          "Draft an NDA framework quickly when entering into confidential discussions with potential partners, vendors, or employees.",
        exampleInput:
          "TYPE: Mutual, PURPOSE: Exploring potential SaaS integration partnership, PARTY A: DataFlow Inc (Delaware C-Corp), PARTY B: AnalyticsPro Ltd (UK Limited), DURATION: 3 years, GOVERNING LAW: Delaware",
        exampleOutput:
          "MUTUAL NON-DISCLOSURE AGREEMENT. This Mutual Non-Disclosure Agreement is entered into as of [DATE] by and between DataFlow Inc., a Delaware corporation, and AnalyticsPro Ltd., a company incorporated under the laws of England and Wales, for the purpose of evaluating a potential integration partnership...",
        targetKeywords: [
          "NDA generator prompt",
          "AI NDA template",
          "non-disclosure agreement generator",
        ],
        relatedTemplates: ["contract-clause-drafter", "terms-of-service-outline"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "terms-of-service-outline",
        title: "Terms of Service Outline",
        description:
          "Create a structured terms of service outline covering user rights, obligations, liability, and dispute resolution.",
        prompt:
          "You are an internet law attorney who drafts terms of service for digital products. Create a comprehensive ToS outline for the following product.\n\n**Product Details:**\n- Product name: [PRODUCT NAME]\n- Product type: [SaaS / MOBILE APP / E-COMMERCE / MARKETPLACE / API / SOCIAL PLATFORM]\n- Description: [WHAT THE PRODUCT DOES]\n- Pricing model: [FREE / FREEMIUM / SUBSCRIPTION / ONE-TIME / USAGE-BASED]\n- User base: [B2B / B2C / BOTH]\n\n**Key Considerations:**\n- User-generated content: [YES/NO — if yes, describe types]\n- Payment processing: [YES/NO — if yes, describe]\n- Data collection: [TYPES OF DATA COLLECTED]\n- Third-party integrations: [LIST ANY]\n- Jurisdiction: [PRIMARY JURISDICTION]\n- Age restrictions: [MINIMUM AGE, e.g., 13+ for COPPA, 16+ for GDPR]\n\nCreate the ToS outline with these sections, providing 3-5 key provisions for each:\n\n1. **Acceptance of Terms** — How users agree, updates to terms, notification process\n2. **Account Registration & Security** — Eligibility, account responsibilities, credentials\n3. **Service Description & Availability** — What you provide, uptime commitments (or lack thereof), modification rights\n4. **User Obligations & Acceptable Use** — Permitted uses, prohibited conduct, content standards\n5. **Intellectual Property** — Ownership of service, user content licensing, DMCA/takedown process\n6. **Payment Terms** (if applicable) — Billing, refunds, price changes, failed payments\n7. **Privacy & Data** — Reference to privacy policy, data rights summary\n8. **Third-Party Services** — Disclaimers for integrations and links\n9. **Disclaimers & Limitation of Liability** — Warranty disclaimers, liability caps, exclusions\n10. **Indemnification** — User indemnification obligations\n11. **Termination** — Grounds for termination, effect of termination, data retention\n12. **Dispute Resolution** — Governing law, arbitration clause, class action waiver, forum selection\n13. **General Provisions** — Severability, entire agreement, waiver, assignment, force majeure\n\nFor each provision, include:\n- The provision text in plain language\n- A note on why it matters and what risk it mitigates\n- Flag any provisions that are jurisdiction-specific\n\n[DISCLAIMER: This outline is a starting framework. Have qualified legal counsel review and finalize before publishing.]",
        category: "legal",
        tags: ["terms of service", "ToS", "internet law"],
        useCase:
          "Build a terms of service document when launching a new digital product or updating existing terms for compliance.",
        exampleInput:
          "PRODUCT: TaskFlow, TYPE: SaaS project management tool, PRICING: Freemium with $15/mo Pro tier, USER BASE: B2B, USER CONTENT: Yes (project files, comments), JURISDICTION: California, AGE: 16+",
        exampleOutput:
          "1. Acceptance of Terms: By creating an account or using TaskFlow, you agree to these Terms. We may update these Terms with 30 days' notice via email or in-app notification. Continued use after the notice period constitutes acceptance...",
        targetKeywords: [
          "terms of service prompt",
          "AI ToS generator",
          "terms of service template",
        ],
        relatedTemplates: ["privacy-policy-framework", "contract-clause-drafter"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "privacy-policy-framework",
        title: "Privacy Policy Framework",
        description:
          "Generate a GDPR and CCPA-aware privacy policy framework covering data collection, usage, rights, and retention.",
        prompt:
          "You are a data privacy attorney specializing in GDPR, CCPA, and global privacy regulations. Create a comprehensive privacy policy framework for the following product.\n\n**Product Details:**\n- Product name: [PRODUCT NAME]\n- Product type: [WEB APP / MOBILE APP / SaaS / E-COMMERCE]\n- Company name: [COMPANY NAME]\n- Company jurisdiction: [WHERE COMPANY IS BASED]\n- Markets served: [COUNTRIES/REGIONS]\n\n**Data Collection:**\n- Personal data collected: [LIST TYPES, e.g., name, email, IP address, payment info, usage data]\n- Collection methods: [FORMS / COOKIES / ANALYTICS / THIRD-PARTY LOGIN / API]\n- Sensitive data: [ANY HEALTH, BIOMETRIC, FINANCIAL, OR CHILDREN'S DATA]\n- Cookies and tracking: [LIST TYPES — essential, analytics, advertising, social]\n\n**Data Usage:**\n- Primary purposes: [e.g., account management, service delivery, communications]\n- Secondary purposes: [e.g., analytics, product improvement, marketing]\n- Third-party sharing: [LIST PARTNERS/CATEGORIES, e.g., payment processors, analytics providers, advertising networks]\n- International transfers: [YES/NO — if yes, mechanisms used]\n\n**Compliance Requirements:**\n- Applicable regulations: [GDPR / CCPA / PIPEDA / OTHER]\n- Data Protection Officer: [YES/NO]\n- Legal basis for processing (GDPR): [CONSENT / CONTRACT / LEGITIMATE INTEREST]\n\nCreate the privacy policy framework with:\n1. **Introduction** — Who you are, what this policy covers, effective date\n2. **Information We Collect** — Categories with specific examples, sources\n3. **How We Use Your Information** — Purposes mapped to legal bases (for GDPR compliance)\n4. **How We Share Your Information** — Categories of recipients and purposes\n5. **Cookies & Tracking Technologies** — Types, purposes, management options\n6. **Data Retention** — How long data is kept and criteria for determining retention periods\n7. **Your Rights** — GDPR rights (access, rectification, erasure, portability, objection), CCPA rights (know, delete, opt-out, non-discrimination), how to exercise them\n8. **International Data Transfers** — Transfer mechanisms (SCCs, adequacy decisions)\n9. **Data Security** — Measures taken to protect data\n10. **Children's Privacy** — Age requirements and parental consent mechanisms\n11. **Updates to This Policy** — How changes will be communicated\n12. **Contact Information** — DPO, privacy team, supervisory authority\n\n[DISCLAIMER: This is a framework for drafting purposes. Have a qualified privacy attorney review for compliance with all applicable laws before publishing.]",
        category: "legal",
        tags: ["privacy policy", "GDPR", "CCPA", "data privacy"],
        useCase:
          "Build or update your privacy policy when launching a product, entering new markets, or responding to regulatory changes.",
        exampleInput:
          "PRODUCT: FitTrack, TYPE: Mobile fitness app, COMPANY: FitTrack Inc (Delaware), MARKETS: US and EU, DATA COLLECTED: name, email, health metrics, location, device info, THIRD-PARTY SHARING: Google Analytics, Stripe, REGULATIONS: GDPR and CCPA",
        exampleOutput:
          "Introduction: FitTrack Inc. ('we,' 'us,' 'our') operates the FitTrack mobile application. This Privacy Policy explains how we collect, use, disclose, and safeguard your information, including health and fitness data, when you use our application...",
        targetKeywords: [
          "privacy policy prompt",
          "AI privacy policy generator",
          "GDPR privacy policy template",
        ],
        relatedTemplates: ["terms-of-service-outline", "compliance-checklist-generator"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "case-brief-summarizer",
        title: "Case Brief Summarizer",
        description:
          "Summarize a legal case into a structured brief with facts, issues, holdings, reasoning, and practical takeaways.",
        prompt:
          "You are a legal research assistant who excels at case analysis. Create a structured case brief from the following information.\n\n**Case Information:**\n- Case name: [CASE NAME, e.g., Smith v. Jones]\n- Citation: [CITATION IF KNOWN]\n- Court: [WHICH COURT DECIDED THIS]\n- Year: [YEAR OF DECISION]\n- Area of law: [e.g., Contract Law, Employment, Constitutional, IP]\n\n**Case Details (provide what you have):**\n- Facts: [KEY FACTS OF THE CASE]\n- Procedural history: [HOW THE CASE GOT TO THIS COURT]\n- Key arguments: [WHAT EACH SIDE ARGUED]\n- Decision: [WHAT THE COURT DECIDED]\n\n**Your Purpose:** [WHY YOU'RE BRIEFING THIS — e.g., class preparation, writing a memo, understanding precedent for a client matter]\n\nCreate the case brief with these sections:\n\n1. **Case Header** — Full case name, citation, court, date, judge(s)\n2. **Facts** — Material facts only, organized chronologically, distinguishing between undisputed and disputed facts. Bold the most critical facts.\n3. **Procedural History** — How the case moved through the courts\n4. **Issue(s)** — The precise legal question(s) the court addressed, framed as yes/no questions\n5. **Holding** — The court's answer to each issue in one sentence\n6. **Reasoning** — The court's analysis, including:\n   - Legal rule or test applied\n   - How the court applied it to these facts\n   - Key precedents cited and how they were used\n   - Any policy considerations mentioned\n7. **Concurrence/Dissent** — Key points from any concurring or dissenting opinions\n8. **Significance** — Why this case matters: what rule it established or clarified\n9. **Practical Takeaway** — How this case affects real-world practice (2-3 sentences tailored to your stated purpose)\n10. **Key Quote** — The most important sentence from the opinion\n\nKeep the entire brief under 800 words. Prioritize clarity over completeness.",
        category: "legal",
        tags: ["case brief", "legal analysis", "case law"],
        useCase:
          "Quickly brief a case for class preparation, legal research, or understanding relevant precedent for a client matter.",
        exampleInput:
          "CASE: Carpenter v. United States, COURT: US Supreme Court, YEAR: 2018, AREA: Fourth Amendment / digital privacy, PURPOSE: Understanding precedent for client's cell-site location data dispute",
        exampleOutput:
          "Case: Carpenter v. United States, 585 U.S. 296 (2018). Court: Supreme Court of the United States. Issue: Whether the government's acquisition of historical cell-site location information constitutes a search under the Fourth Amendment. Holding: Yes — accessing seven days or more of historical CSLI constitutes a search requiring a warrant...",
        targetKeywords: [
          "case brief prompt",
          "AI case brief generator",
          "legal case summary template",
        ],
        relatedTemplates: ["legal-research-summary", "legal-memo-writer"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "cease-and-desist-letter-template",
        title: "Cease and Desist Letter Template",
        description:
          "Draft a firm, professional cease and desist letter for intellectual property, contract, or harassment situations.",
        prompt:
          "You are a litigation attorney drafting a cease and desist letter. Create a professional and effective letter for the following situation.\n\n**Sender Details:**\n- Client name: [CLIENT NAME]\n- Client type: [INDIVIDUAL / COMPANY]\n- Attorney name: [ATTORNEY NAME / 'Self-represented']\n- Law firm: [FIRM NAME, if applicable]\n\n**Recipient Details:**\n- Name: [RECIPIENT NAME]\n- Title/Company: [RECIPIENT COMPANY]\n- Address: [ADDRESS]\n\n**Violation Details:**\n- Type of violation: [TRADEMARK INFRINGEMENT / COPYRIGHT INFRINGEMENT / BREACH OF CONTRACT / DEFAMATION / HARASSMENT / TRADE SECRET MISAPPROPRIATION / PATENT INFRINGEMENT]\n- Specific conduct: [DESCRIBE EXACTLY WHAT THE RECIPIENT IS DOING WRONG]\n- When it started: [DATE OR TIMEFRAME]\n- Evidence available: [WHAT PROOF YOU HAVE]\n- Damages or harm: [IMPACT ON YOUR CLIENT]\n\n**Demands:**\n- Primary demand: [WHAT YOU WANT THEM TO STOP DOING]\n- Deadline: [TIMEFRAME FOR COMPLIANCE, e.g., 14 days]\n- Additional demands: [e.g., remove content, provide accounting, destroy copies]\n\n**Escalation:** [WHAT WILL HAPPEN IF THEY DON'T COMPLY — e.g., lawsuit, DMCA takedown, report to authorities]\n\nDraft the letter with:\n1. **Header** — Firm letterhead format, date, recipient address, RE line, delivery method notation (Certified Mail / Email)\n2. **Introduction** — Identify your client, state the purpose firmly but professionally\n3. **Statement of Rights** — Establish your client's legal rights and interests with specificity\n4. **Description of Violations** — Detail the infringing conduct with dates and evidence references\n5. **Legal Basis** — Cite applicable law and potential causes of action without overreaching\n6. **Demands** — Numbered list of specific actions required, with clear deadline\n7. **Consequences** — What legal action will follow if demands are not met, including potential remedies (injunction, damages, attorney fees)\n8. **Preservation Notice** — Instruct recipient to preserve all relevant documents and communications\n9. **Closing** — Professional close, request written confirmation of compliance\n\nTone: Firm and authoritative but professional. Avoid threats that are disproportionate or legally unsupportable. The letter should be persuasive enough to resolve the matter without litigation.\n\n[DISCLAIMER: This is a letter template for drafting purposes. Have a licensed attorney review before sending.]",
        category: "legal",
        tags: ["cease and desist", "IP protection", "litigation"],
        useCase:
          "Draft a cease and desist letter when you need to formally demand that someone stop infringing your rights before escalating to litigation.",
        exampleInput:
          "CLIENT: PixelWorks Studio, VIOLATION: Copyright infringement — competitor copied UI designs from our mobile app, EVIDENCE: Screenshots with timestamps, code similarities, DEMAND: Remove infringing designs within 14 days, ESCALATION: Federal copyright lawsuit",
        exampleOutput:
          "RE: Copyright Infringement — Demand to Cease and Desist. Dear [Recipient], This firm represents PixelWorks Studio ('our Client') in connection with the unauthorized reproduction of copyrighted user interface designs in your mobile application...",
        targetKeywords: [
          "cease and desist prompt",
          "AI cease and desist template",
          "cease and desist letter generator",
        ],
        relatedTemplates: ["client-communication-drafter", "contract-clause-drafter"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "legal-memo-writer",
        title: "Legal Memo Writer",
        description:
          "Write a structured internal legal memorandum analyzing a specific legal issue with conclusions and recommendations.",
        prompt:
          "You are a senior associate at a law firm. Write an internal legal memorandum analyzing the following issue.\n\n**Memo Details:**\n- To: [RECIPIENT, e.g., Partner Name]\n- From: [YOUR NAME]\n- Date: [DATE]\n- Re: [MATTER NAME AND NUMBER]\n- Question Presented: [THE SPECIFIC LEGAL QUESTION]\n\n**Background:**\n- Client: [CLIENT NAME AND DESCRIPTION]\n- Facts: [DETAILED FACTS RELEVANT TO THE ANALYSIS]\n- Relevant jurisdiction: [JURISDICTION]\n- Opposing position (if applicable): [WHAT THE OTHER SIDE ARGUES]\n- Time sensitivity: [DEADLINE OR FILING DATE]\n\n**Research Parameters:**\n- Area of law: [SPECIFIC AREA]\n- Key statutes to consider: [IF KNOWN]\n- Analogous cases to consider: [IF KNOWN]\n- Budget/depth: [PRELIMINARY ANALYSIS / FULL RESEARCH MEMO]\n\nWrite the memorandum with:\n1. **Header Block** — Standard memo format (To, From, Date, Re)\n2. **Question Presented** — Framed as a specific, answerable legal question incorporating key facts\n3. **Brief Answer** — Direct 3-5 sentence answer with confidence level\n4. **Statement of Facts** — Relevant facts presented objectively, organized logically, with source notes\n5. **Discussion** — The analytical core:\n   - State the applicable legal rule/test\n   - Analyze how each element applies to the client's facts\n   - Address favorable and unfavorable precedents\n   - Distinguish adverse authority\n   - Consider practical implications and policy arguments\n   - Use IRAC structure (Issue, Rule, Application, Conclusion) for each sub-issue\n6. **Counterarguments** — Anticipate and address opposing arguments\n7. **Conclusion** — Summarize findings and provide a clear recommendation\n8. **Recommended Next Steps** — Actionable steps prioritized by urgency\n\nFormatting: Use headings, numbered paragraphs, and footnotes for secondary authorities. Keep the memo between 1500-3000 words depending on complexity.\n\n[DISCLAIMER: This is a memo drafting framework. All legal analysis should be verified by a licensed attorney with jurisdiction-specific expertise.]",
        category: "legal",
        tags: ["legal memo", "legal analysis", "legal writing"],
        useCase:
          "Draft an internal legal memorandum when a partner or client needs a thorough analysis of a specific legal question.",
        exampleInput:
          "QUESTION: Whether our client's non-compete agreement is enforceable given the recent FTC proposed rule on non-competes, JURISDICTION: Federal / Texas, CLIENT: MedTech Innovations, FACTS: Former VP of Sales joined direct competitor, signed non-compete with 2-year term and 50-mile radius",
        exampleOutput:
          "MEMORANDUM. To: Sarah Williams, Partner. From: [Associate]. Re: MedTech Innovations — Enforceability of Non-Compete. Question Presented: Whether MedTech's two-year, 50-mile non-compete agreement with its former VP of Sales is enforceable under Texas law...",
        targetKeywords: [
          "legal memo prompt",
          "AI legal memorandum generator",
          "legal writing template",
        ],
        relatedTemplates: ["legal-research-summary", "case-brief-summarizer"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "compliance-checklist-generator",
        title: "Compliance Checklist Generator",
        description:
          "Generate a comprehensive compliance checklist for any regulatory framework with action items, owners, and deadlines.",
        prompt:
          "You are a compliance consultant. Generate a comprehensive compliance checklist for the following regulation or framework.\n\n**Compliance Framework:** [FRAMEWORK, e.g., GDPR, HIPAA, SOC 2, PCI DSS, ADA, CCPA, SOX, OSHA, ISO 27001]\n**Organization Details:**\n- Company name: [COMPANY NAME]\n- Industry: [INDUSTRY]\n- Size: [EMPLOYEE COUNT]\n- Current compliance status: [NOT STARTED / IN PROGRESS / MAINTAINING]\n- Relevant data types: [TYPES OF DATA HANDLED]\n\n**Scope:**\n- Departments involved: [LIST DEPARTMENTS]\n- Systems in scope: [KEY SYSTEMS AND APPLICATIONS]\n- Third-party vendors to assess: [KEY VENDORS]\n- Timeline for compliance: [DEADLINE]\n\n**Specific Concerns:**\n- [CONCERN 1, e.g., cross-border data transfers]\n- [CONCERN 2, e.g., vendor management gaps]\n- [CONCERN 3, e.g., employee training not formalized]\n\nCreate the compliance checklist organized by category:\n\n1. **Governance & Documentation** — Policies, procedures, roles, and responsibilities\n2. **Technical Controls** — Security measures, access controls, encryption, monitoring\n3. **Administrative Controls** — Training, background checks, incident response, business continuity\n4. **Data Management** — Collection, processing, storage, retention, disposal\n5. **Third-Party Management** — Vendor assessments, DPAs, contractual requirements\n6. **Rights & Requests** — How to handle data subject requests, complaints, opt-outs\n7. **Monitoring & Audit** — Ongoing monitoring, internal audits, penetration testing\n8. **Incident Response** — Breach notification, reporting timelines, remediation\n\nFor each checklist item provide:\n- Requirement description (plain language)\n- Regulatory reference (section/article number)\n- Priority: Critical / High / Medium / Low\n- Suggested owner (role, not person)\n- Status options: Not Started / In Progress / Complete / N/A\n- Evidence needed for audit\n\nEnd with a compliance timeline showing which items should be completed in Phase 1 (0-30 days), Phase 2 (30-90 days), and Phase 3 (90-180 days).\n\n[DISCLAIMER: This checklist is a planning tool. Engage qualified compliance professionals and legal counsel to ensure full regulatory compliance.]",
        category: "legal",
        tags: ["compliance", "regulatory", "audit checklist"],
        useCase:
          "Build a compliance program or prepare for an audit by systematically checking every requirement of a regulatory framework.",
        exampleInput:
          "FRAMEWORK: SOC 2 Type II, COMPANY: CloudVault (SaaS data backup), SIZE: 75 employees, STATUS: Preparing for first audit, SYSTEMS: AWS infrastructure, PostgreSQL, React app, Stripe billing, TIMELINE: 6 months",
        exampleOutput:
          "Governance & Documentation: 1. Information Security Policy — Documented policy covering all trust service criteria (TSC reference: CC1.1). Priority: Critical. Owner: CISO. Evidence: Signed policy document with version history and board approval...",
        targetKeywords: [
          "compliance checklist prompt",
          "AI compliance generator",
          "regulatory compliance template",
        ],
        relatedTemplates: ["privacy-policy-framework", "company-policy-drafter"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
    ],
  },

  // ── Real Estate ──────────────────────────────────────────────────────────
  {
    slug: "real-estate",
    title: "Real Estate Prompts",
    description:
      "AI prompt templates for property listings, buyer consultations, market analysis, open house follow-ups, and real estate marketing. Ready for ChatGPT, Claude, or Gemini.",
    longDescription:
      "Close more deals and serve clients better with prompt templates built for real estate professionals. From writing property descriptions that sell to crafting market analysis narratives and social media posts, these templates cover the full real estate workflow. Paste them into any major AI assistant and customize the bracketed placeholders for your listings and market.",
    icon: "🏠",
    keywords: [
      "real estate prompts",
      "ChatGPT for real estate",
      "property listing prompts",
      "realtor prompts",
    ],
    relatedCategories: ["marketing", "email", "finance"],
    templates: [
      {
        slug: "property-listing-description-writer",
        title: "Property Listing Description Writer",
        description:
          "Write a compelling, SEO-friendly property listing description that highlights features, lifestyle, and neighborhood appeal.",
        prompt:
          "You are an experienced real estate copywriter who specializes in listing descriptions that drive showings. Write a compelling property listing description for the following property.\n\n**Property Details:**\n- Address: [ADDRESS]\n- Property type: [SINGLE FAMILY / CONDO / TOWNHOUSE / MULTI-FAMILY / LUXURY / COMMERCIAL]\n- Bedrooms/Bathrooms: [BED/BATH COUNT]\n- Square footage: [SQ FT]\n- Lot size: [LOT SIZE]\n- Year built: [YEAR]\n- List price: [PRICE]\n\n**Key Features:**\n- [FEATURE 1, e.g., renovated chef's kitchen with quartz countertops]\n- [FEATURE 2, e.g., primary suite with walk-in closet and spa bath]\n- [FEATURE 3, e.g., fenced backyard with mature landscaping]\n- [FEATURE 4, e.g., attached 2-car garage]\n- [FEATURE 5, e.g., new HVAC system installed 2025]\n\n**Neighborhood & Location:**\n- Neighborhood: [NEIGHBORHOOD NAME]\n- School district: [DISTRICT]\n- Nearby amenities: [e.g., parks, restaurants, transit, shopping]\n- Commute highlights: [e.g., 10 min to downtown, walking distance to metro]\n\n**Target Buyer:** [e.g., young families, downsizers, investors, first-time buyers]\n**Unique Selling Point:** [WHAT MAKES THIS PROPERTY STAND OUT]\n\nWrite:\n1. **MLS Description** (250-350 words) — Professional, feature-rich, flows from exterior to interior to lifestyle. Open with a hook, not the address. Use sensory language. End with a call to action.\n2. **Zillow/Realtor.com Headline** — 3 options (under 80 characters each, attention-grabbing)\n3. **Short Description** (75 words) — For syndication sites with character limits\n4. **Social Media Caption** — Instagram/Facebook version with relevant hashtags\n5. **Agent Remarks** (MLS private, agents only) — Showing instructions, commission details, key selling points for buyer agents\n\nGuidelines:\n- Comply with Fair Housing Act — no discriminatory language\n- Avoid overused phrases like 'hidden gem,' 'won't last,' or 'move-in ready' (unless genuinely accurate)\n- Include specific details over generic praise\n- Mention recent upgrades with approximate dates\n- Paint a lifestyle picture, not just a feature list",
        category: "real-estate",
        tags: ["property listing", "real estate copywriting", "MLS description"],
        useCase:
          "Write listing descriptions when you have a new property to market and want descriptions that drive showings and offers.",
        exampleInput:
          "PROPERTY: 3BR/2BA single family, 1,850 sqft, PRICE: $475,000, NEIGHBORHOOD: Elmwood Park, FEATURES: updated kitchen, hardwood floors, finished basement, large deck, TARGET: Young families, USP: Only home in the neighborhood with a finished basement under $500K",
        exampleOutput:
          "Headline: 'Elmwood Park Charmer — Finished Basement, Updated Kitchen, Under $500K'. MLS Description: Step into this sunlit Elmwood Park colonial where original hardwood floors meet modern updates throughout. The recently renovated kitchen features soft-close cabinetry and quartz countertops...",
        targetKeywords: [
          "property listing prompt",
          "AI real estate description generator",
          "MLS listing description template",
        ],
        relatedTemplates: ["social-media-post-generator-listings", "open-house-follow-up-email"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "buyer-consultation-script",
        title: "Buyer Consultation Script",
        description:
          "Create a structured buyer consultation script that builds rapport, qualifies needs, and sets expectations for the home search.",
        prompt:
          "You are a top-producing buyer's agent known for exceptional client consultations. Create a comprehensive buyer consultation script for the following scenario.\n\n**Buyer Profile:**\n- Buyer type: [FIRST-TIME BUYER / MOVE-UP BUYER / DOWNSIZER / INVESTOR / RELOCATION]\n- Budget range: [PRICE RANGE]\n- Pre-approval status: [PRE-APPROVED / PRE-QUALIFIED / NOT YET]\n- Timeline: [WHEN THEY NEED TO MOVE]\n- Motivation: [WHY THEY'RE BUYING, e.g., growing family, job change, investment]\n\n**Market Context:**\n- Market conditions: [BUYER'S MARKET / SELLER'S MARKET / BALANCED]\n- Location: [CITY/AREA]\n- Current inventory level: [LOW / MODERATE / HIGH]\n- Average days on market: [DAYS]\n\n**Consultation Setting:** [IN-PERSON / VIRTUAL / PHONE]\n**Consultation Duration:** [30 MIN / 60 MIN]\n\nCreate the consultation script with:\n\n1. **Opening & Rapport Building** (5 min)\n   - Warm greeting and agenda setting\n   - 3-4 open-ended questions to understand their story and motivation\n   - Active listening prompts\n\n2. **Needs Assessment** (10-15 min)\n   - Questions about must-haves vs. nice-to-haves\n   - Lifestyle questions (commute, schools, daily routines)\n   - Deal-breakers to identify early\n   - Questions about their home search experience so far\n\n3. **Market Education** (10 min)\n   - Current market overview (key talking points, not a data dump)\n   - How to explain market dynamics to this buyer type\n   - Setting realistic expectations on pricing, competition, and timeline\n   - Addressing common misconceptions for their buyer type\n\n4. **Process Walkthrough** (10 min)\n   - Step-by-step home buying process, simplified for their level\n   - Your role and how you add value\n   - What they should expect at each stage\n   - How you handle multiple offer situations\n\n5. **Financial Discussion** (5-10 min)\n   - Tactful questions about budget and financing\n   - Explanation of closing costs, earnest money, and other expenses\n   - Lender referral talking points (without pressure)\n\n6. **Next Steps & Commitment** (5 min)\n   - Explain the buyer-agent agreement\n   - Set up property search criteria\n   - Schedule first showings\n   - Confirm preferred communication method and frequency\n\nFor each section, provide:\n- Exact language for key questions and talking points\n- Transition phrases between sections\n- How to handle common objections (e.g., 'we want to look around first,' 'our friend is an agent')\n- Notes on body language and tone",
        category: "real-estate",
        tags: ["buyer consultation", "client meeting", "real estate sales"],
        useCase:
          "Prepare for buyer consultations to convert leads into committed clients with a professional, structured approach.",
        exampleInput:
          "BUYER TYPE: First-time buyer, BUDGET: $350K-$425K, TIMELINE: 3 months, MARKET: Seller's market with low inventory, LOCATION: Austin TX metro, SETTING: In-person, 60 min",
        exampleOutput:
          "Opening: 'Thank you for coming in today, [Name]. Before we dive into houses, I'd love to learn more about you. What's prompting the move to homeownership right now?' Needs Assessment: 'If you could describe your ideal weekday morning in your new home — where are you, what do you see out the window, how long is your commute?'...",
        targetKeywords: [
          "buyer consultation script prompt",
          "real estate consultation template",
          "AI buyer meeting script",
        ],
        relatedTemplates: ["first-time-buyer-faq-generator", "market-analysis-narrator"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "market-analysis-narrator",
        title: "Market Analysis Narrator",
        description:
          "Turn raw market data into a compelling narrative for clients explaining local trends, pricing, and opportunities.",
        prompt:
          "You are a real estate market analyst who makes data accessible and actionable for clients. Transform the following market data into a compelling narrative.\n\n**Market Data:**\n- Area: [CITY / NEIGHBORHOOD / ZIP CODE]\n- Time period: [MONTH/QUARTER/YEAR]\n- Median sale price: [PRICE] (change: [+/- %] year-over-year)\n- Average days on market: [DAYS] (change: [+/- DAYS] year-over-year)\n- Active listings: [NUMBER] (change: [+/- %] year-over-year)\n- Months of inventory: [NUMBER]\n- List-to-sale price ratio: [%]\n- Number of sales: [COUNT]\n- Price per square foot: [$/SQFT]\n- Mortgage rate context: [CURRENT RATE]\n\n**Additional Context:**\n- Notable developments: [NEW CONSTRUCTION, INFRASTRUCTURE, EMPLOYERS, etc.]\n- Seasonal factors: [ANY SEASONAL TRENDS]\n- Comparison areas: [NEIGHBORING MARKETS FOR CONTEXT]\n\n**Audience:** [BUYERS / SELLERS / INVESTORS / GENERAL — adjust emphasis accordingly]\n**Tone:** [OPTIMISTIC / NEUTRAL / CAUTIOUS]\n\nCreate the market analysis narrative with:\n\n1. **Executive Summary** (3-4 sentences) — The headline story: is this market hot, cooling, stable? Frame it around what matters to the audience.\n2. **Price Trends** — What prices are doing and why, with context (not just numbers)\n3. **Supply & Demand** — Inventory levels, days on market, and what it means for negotiations\n4. **Buyer/Seller Dynamics** — Who has the advantage and how it affects strategy\n5. **Comparison** — How this area compares to neighboring markets or broader metro trends\n6. **Forward Look** — What to expect in the next 3-6 months based on current data and trends\n7. **Actionable Advice** — 3-5 specific recommendations tailored to the audience (e.g., for buyers: 'properties priced under $X are receiving multiple offers within 48 hours — be prepared with pre-approval and a competitive offer strategy')\n8. **Key Takeaway** — One sentence that summarizes the market opportunity\n\nGuidelines:\n- Translate every statistic into a 'so what' for the client\n- Use analogies and comparisons to make data relatable\n- Avoid jargon — explain terms like 'months of inventory' in context\n- Include a visual description suggestion (chart type, key data points) for each section",
        category: "real-estate",
        tags: ["market analysis", "CMA", "real estate data"],
        useCase:
          "Create client-facing market reports or newsletter content that makes local real estate data engaging and actionable.",
        exampleInput:
          "AREA: North Austin 78759, MEDIAN PRICE: $525,000 (+4.2% YoY), DOM: 18 days (-5 days YoY), INVENTORY: 1.8 months, LIST-TO-SALE: 98.5%, AUDIENCE: Sellers, TONE: Optimistic",
        exampleOutput:
          "Executive Summary: North Austin's 78759 zip code continues to favor sellers heading into spring 2026, with median prices climbing 4.2% year-over-year to $525,000 while homes sell in just 18 days. Seller Advantage: With only 1.8 months of inventory, demand continues to outpace supply...",
        targetKeywords: [
          "market analysis prompt",
          "real estate market report template",
          "AI CMA narrative generator",
        ],
        relatedTemplates: ["investment-property-analysis", "seller-cma-presentation-narrative"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "open-house-follow-up-email",
        title: "Open House Follow-Up Email",
        description:
          "Write personalized open house follow-up emails that convert visitors into active buyers or listing appointments.",
        prompt:
          "You are a real estate agent with exceptional follow-up skills. Write a follow-up email for an open house visitor.\n\n**Open House Details:**\n- Property address: [ADDRESS]\n- List price: [PRICE]\n- Property highlights: [2-3 KEY FEATURES]\n- Open house date: [DATE]\n- Market conditions: [HOT / BALANCED / SLOW]\n\n**Visitor Details:**\n- Visitor name: [NAME]\n- Visitor type: [SERIOUS BUYER / EARLY STAGE / NEIGHBOR / INVESTOR / CURRENTLY LISTED SELLER]\n- What they mentioned liking: [WHAT THEY SAID THEY LIKED]\n- Concerns raised: [ANY CONCERNS OR HESITATIONS]\n- Currently working with an agent: [YES / NO / UNKNOWN]\n- Pre-approved: [YES / NO / UNKNOWN]\n\n**Your Goal:** [SCHEDULE A SHOWING / SEND SIMILAR LISTINGS / GET THEM PRE-APPROVED / BOOK A LISTING APPOINTMENT / GENERAL NURTURE]\n\nWrite the following email variations:\n\n1. **Primary Follow-Up Email** (sent within 24 hours)\n   - Subject line (3 options)\n   - Body: Thank them, reference something specific from their visit (shows you listened), address any concerns naturally, provide value (comparable properties, neighborhood info, or market insight), clear call to action\n   - Keep under 200 words\n\n2. **Second Touch** (sent 3-5 days later if no response)\n   - Subject line (2 options)\n   - Body: New angle — share a relevant market update, a just-listed comparable, or a helpful resource. Do not repeat the first email. Softer CTA.\n   - Keep under 150 words\n\n3. **Long-Term Nurture** (sent 2 weeks later if still no response)\n   - Subject line (2 options)\n   - Body: Position yourself as a market resource, not a salesperson. Offer ongoing value without pressure.\n   - Keep under 100 words\n\nGuidelines:\n- Sound like a helpful human, not a marketing funnel\n- Reference specifics from the visit to show genuine attention\n- Match energy to the visitor type (enthusiastic for serious buyers, informational for neighbors)\n- Every email should provide value even if they never respond\n- Avoid 'just checking in' and 'circling back' language",
        category: "real-estate",
        tags: ["open house", "follow-up email", "lead conversion"],
        useCase:
          "Convert open house visitors into clients with personalized, multi-touch follow-up sequences.",
        exampleInput:
          "PROPERTY: 42 Maple Dr, listed at $389K, VISITOR: David Kim, TYPE: Serious buyer, LIKED: open floor plan and backyard, CONCERNS: worried about school ratings, AGENT: No, GOAL: Schedule private showing of similar homes",
        exampleOutput:
          "Subject: David — That Backyard on Maple Dr + a School District Tip. Hi David, Great meeting you at the open house on Maple Drive yesterday. I could tell the open layout and that backyard caught your attention — that south-facing exposure means great natural light year-round...",
        targetKeywords: [
          "open house follow-up email prompt",
          "real estate follow-up template",
          "AI open house email",
        ],
        relatedTemplates: ["property-listing-description-writer", "expired-listing-outreach"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "neighborhood-guide-creator",
        title: "Neighborhood Guide Creator",
        description:
          "Create a detailed neighborhood guide covering lifestyle, amenities, schools, and market data for prospective buyers.",
        prompt:
          "You are a local real estate expert and community storyteller. Create a comprehensive neighborhood guide for the following area.\n\n**Neighborhood Details:**\n- Neighborhood name: [NEIGHBORHOOD NAME]\n- City/Metro: [CITY]\n- General location: [DESCRIPTION, e.g., 'northeast suburb, 15 miles from downtown']\n- Population/Size: [APPROXIMATE]\n- Character: [e.g., urban walkable, suburban family-friendly, rural acreage, historic, up-and-coming]\n\n**Market Snapshot:**\n- Median home price: [PRICE]\n- Price range: [LOW] to [HIGH]\n- Property types: [SINGLE FAMILY / CONDOS / TOWNHOMES / MIX]\n- Average HOA (if applicable): [AMOUNT]\n\n**Key Amenities:**\n- Schools: [SCHOOL NAMES AND RATINGS IF KNOWN]\n- Parks/Recreation: [LIST]\n- Shopping/Dining: [KEY AREAS]\n- Healthcare: [NEAREST HOSPITALS/CLINICS]\n- Transit: [PUBLIC TRANSIT OPTIONS, HIGHWAYS]\n\n**Target Audience:** [FAMILIES / YOUNG PROFESSIONALS / RETIREES / INVESTORS]\n\nCreate the neighborhood guide with:\n\n1. **Opening Hook** — A vivid 3-4 sentence description that captures the feel of living there. What does a typical Saturday morning look like?\n2. **At a Glance** — Quick-reference box with key stats (median price, school ratings, commute times, walk score)\n3. **Lifestyle & Culture** — What makes this neighborhood special, who lives here, community events, local favorites\n4. **Schools & Education** — Overview of school options (public, private, charter) with context beyond just ratings\n5. **Dining & Entertainment** — Top 5 local spots with 1-sentence descriptions that feel like insider recommendations\n6. **Outdoor & Recreation** — Parks, trails, sports facilities, outdoor lifestyle opportunities\n7. **Commute & Transportation** — Realistic commute times to major employment centers, transit options, traffic patterns\n8. **Real Estate Market** — What to expect when buying here, property types, price trends, and competition level\n9. **Pros & Cons** — Honest assessment (3 pros, 2 cons) that builds trust through transparency\n10. **Who Should Live Here** — 3 ideal buyer profiles for this neighborhood\n11. **Insider Tip** — One thing only locals know\n\nTone: Warm, knowledgeable, enthusiastic but honest. Write like a trusted friend who lives there, not a marketing brochure.",
        category: "real-estate",
        tags: ["neighborhood guide", "area information", "buyer resources"],
        useCase:
          "Create neighborhood content for your website, buyer packets, or social media to establish local expertise and attract area-specific leads.",
        exampleInput:
          "NEIGHBORHOOD: Mueller, CITY: Austin TX, CHARACTER: Urban planned community, walkable, eco-friendly, MEDIAN PRICE: $610,000, SCHOOLS: Blanton Elementary (9/10), Mueller parks, TARGET: Young families and professionals",
        exampleOutput:
          "Opening: On a typical Saturday morning in Mueller, you'll find families walking to the farmers market at Browning Hangar, kids riding bikes along the wide sidewalks, and neighbors grabbing coffee at Flightpath. At a Glance: Median Price $610K | Walk Score 82 | Top-rated elementary...",
        targetKeywords: [
          "neighborhood guide prompt",
          "real estate area guide template",
          "AI neighborhood content generator",
        ],
        relatedTemplates: ["property-listing-description-writer", "market-analysis-narrator"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "investment-property-analysis",
        title: "Investment Property Analysis",
        description:
          "Analyze a rental or investment property with cash flow projections, cap rate, ROI, and risk assessment.",
        prompt:
          "You are a real estate investment analyst. Perform a comprehensive investment analysis for the following property.\n\n**Property Details:**\n- Address: [ADDRESS]\n- Property type: [SINGLE FAMILY / MULTI-FAMILY / COMMERCIAL / SHORT-TERM RENTAL]\n- Units: [NUMBER OF UNITS]\n- Purchase price: [PRICE]\n- Square footage: [SQ FT]\n- Year built: [YEAR]\n- Current condition: [TURNKEY / LIGHT REHAB / MAJOR RENOVATION]\n- Estimated rehab cost (if applicable): [AMOUNT]\n\n**Income Information:**\n- Current rent (if occupied): [MONTHLY RENT PER UNIT]\n- Market rent estimate: [ESTIMATED MARKET RENT PER UNIT]\n- Vacancy rate for area: [%]\n- Other income: [e.g., laundry, parking, storage]\n\n**Expense Information:**\n- Property tax: [ANNUAL AMOUNT]\n- Insurance: [ANNUAL AMOUNT]\n- HOA/Condo fees: [MONTHLY IF APPLICABLE]\n- Estimated maintenance: [ANNUAL OR % OF RENT]\n- Property management: [% OF RENT OR SELF-MANAGED]\n- Utilities paid by owner: [LIST IF ANY]\n\n**Financing:**\n- Down payment: [AMOUNT OR %]\n- Loan type: [CONVENTIONAL / FHA / PORTFOLIO / DSCR / CASH]\n- Interest rate: [%]\n- Loan term: [YEARS]\n\n**Investment Goals:**\n- Strategy: [BUY AND HOLD / BRRRR / FIX AND FLIP / SHORT-TERM RENTAL]\n- Minimum cash-on-cash return target: [%]\n- Hold period: [YEARS]\n- Appreciation assumption: [ANNUAL %]\n\nProvide the analysis with:\n\n1. **Investment Summary** — 3-4 sentence overview: is this a good deal and why?\n2. **Monthly Cash Flow Analysis** — Detailed income minus all expenses, showing per-unit and total\n3. **Key Metrics:**\n   - Cap Rate\n   - Cash-on-Cash Return\n   - Gross Rent Multiplier (GRM)\n   - Debt Service Coverage Ratio (DSCR)\n   - Net Operating Income (NOI)\n   - Total Return on Investment (including appreciation and equity paydown)\n4. **5-Year Projection** — Year-by-year table showing cash flow, equity build, and total return with assumptions stated\n5. **Scenario Analysis** — Best case, base case, worst case (vary vacancy, rent growth, and expenses)\n6. **Risk Assessment** — Top 5 risks specific to this property and mitigation strategies\n7. **Comparable Investments** — How does this compare to typical returns for this property type in this market?\n8. **Recommendation** — Buy, pass, or negotiate with specific reasoning and suggested offer price if applicable\n\nShow all math. Flag assumptions clearly.",
        category: "real-estate",
        tags: ["investment analysis", "rental property", "real estate investing"],
        useCase:
          "Evaluate whether a rental or investment property meets your financial criteria before making an offer.",
        exampleInput:
          "PROPERTY: 4-unit multifamily, PRICE: $480,000, RENT: $1,200/unit/month, TAXES: $6,800/yr, INSURANCE: $3,200/yr, DOWN PAYMENT: 25%, RATE: 6.75%, STRATEGY: Buy and hold, TARGET RETURN: 8% cash-on-cash",
        exampleOutput:
          "Investment Summary: This 4-unit multifamily presents a solid cash flow opportunity with a 7.6% cap rate and projected 9.2% cash-on-cash return, exceeding your 8% target. Monthly Cash Flow: Gross rent $4,800 - Vacancy (5%) $240 - Mortgage $2,336 - Taxes $567 - Insurance $267 - Maintenance $480 - Management $384 = Net $526/month...",
        targetKeywords: [
          "investment property analysis prompt",
          "AI rental property calculator",
          "real estate investment template",
        ],
        relatedTemplates: ["market-analysis-narrator", "financial-report-narrator"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "expired-listing-outreach",
        title: "Expired Listing Outreach",
        description:
          "Craft empathetic, value-driven outreach messages for expired listing homeowners to win new listing appointments.",
        prompt:
          "You are a listing specialist who wins expired listing appointments by leading with empathy and value. Create an outreach sequence for the following expired listing.\n\n**Expired Listing Details:**\n- Address: [ADDRESS]\n- Original list price: [PRICE]\n- Days on market before expiring: [DAYS]\n- Property type: [TYPE]\n- Bedrooms/Bathrooms: [BED/BATH]\n- Previous listing agent's approach (if known): [e.g., limited marketing, overpriced, poor photos]\n\n**Market Context:**\n- Current market conditions: [HOT / BALANCED / SLOW]\n- Similar homes selling for: [PRICE RANGE]\n- Average DOM for comparable sales: [DAYS]\n- What comparable homes offered that this one didn't: [e.g., staging, video tours, price adjustments]\n\n**Your Differentiators:**\n- [DIFFERENTIATOR 1, e.g., professional photography and video included]\n- [DIFFERENTIATOR 2, e.g., average 15 days to sell vs. market average of 30]\n- [DIFFERENTIATOR 3, e.g., targeted digital marketing to qualified buyers]\n\nCreate a multi-touch outreach sequence:\n\n1. **Handwritten Note / Letter** (sent Day 1)\n   - Acknowledge their frustration without bashing the previous agent\n   - Provide one specific insight about why the home may not have sold\n   - Offer value with no strings attached (e.g., free market analysis)\n   - Keep under 150 words, warm and personal\n\n2. **Email** (sent Day 3)\n   - Subject line (3 options — avoid 'expired listing' language)\n   - Body: Share a specific comparable sale that illustrates opportunity, explain one thing you would do differently, include a low-pressure CTA\n   - Keep under 200 words\n\n3. **Phone Script** (Day 5-7)\n   - Opening line that doesn't sound like every other agent calling\n   - 3-4 questions to understand the seller's current mindset\n   - How to handle: 'We're not relisting,' 'We already have an agent,' 'We're going FSBO'\n   - Transition to booking an appointment\n\n4. **Social Media DM** (Day 10 — if no response to above)\n   - Brief, casual message that provides a neighborhood market insight\n   - No pitch — just value and a door left open\n\nGuidelines:\n- Never disparage the previous agent or their strategy\n- Lead with empathy — selling a home is stressful and not selling is worse\n- Provide genuine value in every touch, not just sales pitches\n- Respect their time and decision — no guilt or pressure tactics\n- Comply with Do Not Call regulations and CAN-SPAM requirements",
        category: "real-estate",
        tags: ["expired listing", "listing appointment", "prospecting"],
        useCase:
          "Prospect expired listings with a respectful, multi-channel approach that demonstrates value and wins listing appointments.",
        exampleInput:
          "ADDRESS: 88 Oak Lane, ORIGINAL PRICE: $549,000, DOM: 120 days, MARKET: Balanced, COMPARABLES: similar homes selling at $510-$525K in 30-45 days, YOUR DIFFERENTIATOR: 3D Matterport tours, targeted Facebook ads to relocating buyers",
        exampleOutput:
          "Handwritten Note: Dear [Homeowner], I noticed your home on Oak Lane is no longer on the market, and I imagine that's not the outcome you were hoping for. I took a closer look at the recent sales in your neighborhood, and I believe there's still a strong opportunity...",
        targetKeywords: [
          "expired listing script prompt",
          "AI expired listing outreach",
          "realtor prospecting template",
        ],
        relatedTemplates: ["seller-cma-presentation-narrative", "open-house-follow-up-email"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "seller-cma-presentation-narrative",
        title: "Seller CMA Presentation Narrative",
        description:
          "Transform comparable sales data into a persuasive listing presentation narrative that justifies your pricing recommendation.",
        prompt:
          "You are a listing agent preparing a Comparative Market Analysis presentation for a potential seller. Create a compelling CMA narrative from the following data.\n\n**Subject Property:**\n- Address: [ADDRESS]\n- Property type: [TYPE]\n- Bed/Bath: [BED/BATH]\n- Square footage: [SQ FT]\n- Lot size: [LOT SIZE]\n- Year built: [YEAR]\n- Condition: [EXCELLENT / GOOD / AVERAGE / NEEDS WORK]\n- Recent improvements: [LIST UPGRADES]\n- Unique features: [ANYTHING SPECIAL]\n\n**Comparable Sales (provide 3-5):**\nFor each comp:\n- Address: [COMP ADDRESS]\n- Sale price: [PRICE]\n- Sale date: [DATE]\n- Bed/Bath/SqFt: [DETAILS]\n- Days on market: [DOM]\n- How it compares: [BETTER/WORSE/SIMILAR and why]\n\n**Active Competition (2-3 current listings):**\n- [LISTING 1 with price and key details]\n- [LISTING 2 with price and key details]\n\n**Seller's Expected Price:** [WHAT THE SELLER HOPES TO GET]\n**Your Recommended Price:** [YOUR SUGGESTED LIST PRICE]\n**Market Conditions:** [BUYER'S / SELLER'S / BALANCED]\n\nCreate the CMA presentation narrative with:\n\n1. **Market Overview Slide** — 3-4 sentences setting the stage for the local market\n2. **Subject Property Strengths** — What makes this home competitive, framed positively\n3. **Comparable Sales Analysis** — For each comp, explain:\n   - Why you selected it as comparable\n   - Key similarities and differences\n   - Adjustment rationale (up or down from comp price)\n   - What it tells us about the subject's value\n4. **Active Competition Analysis** — What the subject is up against and how to stand out\n5. **Pricing Strategy** — Build the case for your recommended price:\n   - Show the data-supported price range\n   - Explain the risk of overpricing (DOM impact, stigma, net proceeds)\n   - If your price differs from the seller's expectation, bridge the gap with data and empathy\n6. **Days-on-Market Strategy** — How pricing affects DOM and final sale price\n7. **Net Proceeds Estimate** — Approximate net at recommended price vs. seller's price\n8. **Recommended Strategy** — Pricing, timing, staging, and marketing approach\n\nTone: Confident, data-driven, and respectful of the seller's emotional attachment to their home. Never dismiss their price expectation — educate with data.",
        category: "real-estate",
        tags: ["CMA", "listing presentation", "pricing strategy"],
        useCase:
          "Win listing appointments by presenting a data-backed pricing strategy that sellers trust and understand.",
        exampleInput:
          "SUBJECT: 220 Pine St, 4BR/3BA, 2,400 sqft, CONDITION: Good with updated kitchen, SELLER'S PRICE: $625,000, YOUR PRICE: $589,000, COMP 1: 215 Pine St sold $585K (similar but no kitchen update), COMP 2: 300 Oak Ave sold $595K (slightly larger, same condition), MARKET: Balanced",
        exampleOutput:
          "Market Overview: The Pine Street corridor has seen steady demand this quarter, with well-priced homes selling within 25 days. Your home's recently updated kitchen gives it a meaningful advantage over most recent sales in the immediate area. Comp Analysis — 215 Pine St ($585K): This is your most direct comparable...",
        targetKeywords: [
          "CMA presentation prompt",
          "listing presentation template",
          "AI real estate pricing narrative",
        ],
        relatedTemplates: ["market-analysis-narrator", "expired-listing-outreach"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "first-time-buyer-faq-generator",
        title: "First-Time Buyer FAQ Generator",
        description:
          "Generate a comprehensive FAQ resource for first-time homebuyers covering financing, process, and common concerns.",
        prompt:
          "You are a patient, knowledgeable real estate agent who specializes in helping first-time homebuyers. Create a comprehensive FAQ resource for buyers in the following market.\n\n**Market Context:**\n- Location: [CITY/STATE]\n- Median home price: [PRICE]\n- Typical first-time buyer budget: [RANGE]\n- Current mortgage rates: [APPROXIMATE RATE]\n- State-specific programs: [ANY KNOWN FIRST-TIME BUYER PROGRAMS]\n\n**Audience:**\n- Age range: [e.g., 25-35]\n- Current living situation: [RENTING / LIVING WITH FAMILY / OTHER]\n- Common concerns: [e.g., affordability, market timing, process confusion]\n- Financial literacy level: [BASIC / MODERATE / SOPHISTICATED]\n\nCreate a FAQ guide organized into these categories with the specified number of Q&A pairs:\n\n1. **Getting Started** (4 questions)\n   - When to start looking, readiness assessment, timeline expectations, first steps\n\n2. **Financing & Affordability** (5 questions)\n   - Down payment reality (debunk 20% myth), pre-approval process, credit score requirements, closing costs breakdown, monthly payment components (PITI)\n\n3. **The Home Search** (4 questions)\n   - How to prioritize needs vs. wants, understanding listings, making sense of disclosures, how many homes to expect to see\n\n4. **Making an Offer** (4 questions)\n   - How to determine offer price, contingencies explained, earnest money, negotiation basics\n\n5. **Under Contract to Closing** (4 questions)\n   - Inspection process, appraisal explained, what can go wrong and how to handle it, closing day walkthrough\n\n6. **After Closing** (3 questions)\n   - Immediate to-dos, homeownership costs beyond mortgage, building equity\n\nFor each FAQ:\n- Write the question as a first-time buyer would actually ask it (conversational, not formal)\n- Provide a clear, jargon-free answer (150-250 words each)\n- Include a 'Pro Tip' with each answer — insider advice they won't find on Google\n- Where applicable, include specific numbers relevant to the market context provided\n\nTone: Encouraging, straightforward, never condescending. Acknowledge that buying a home is overwhelming and normalize their questions.",
        category: "real-estate",
        tags: ["first-time buyer", "homebuyer education", "real estate FAQ"],
        useCase:
          "Create educational content for your website, email drip campaigns, or buyer packets to nurture first-time buyer leads.",
        exampleInput:
          "LOCATION: Denver CO, MEDIAN PRICE: $550,000, FIRST-TIME BUDGET: $375K-$475K, RATES: 6.5%, PROGRAMS: Colorado Housing and Finance Authority (CHFA) down payment assistance, AUDIENCE: 28-34 year olds currently renting",
        exampleOutput:
          "Q: I've been renting for years — how do I know if I'm actually ready to buy? A: Being 'ready' isn't just about money — though that matters. Here's a quick readiness check: you've been at your job for at least 2 years, you have minimal high-interest debt, and you plan to stay in Denver for 3+ years. Pro Tip: You don't need 20% down. CHFA offers up to 3% down payment assistance...",
        targetKeywords: [
          "first-time buyer FAQ prompt",
          "homebuyer guide template",
          "AI real estate FAQ generator",
        ],
        relatedTemplates: ["buyer-consultation-script", "neighborhood-guide-creator"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "social-media-post-generator-listings",
        title: "Social Media Post Generator for Listings",
        description:
          "Create scroll-stopping social media content for property listings across Instagram, Facebook, TikTok, and LinkedIn.",
        prompt:
          "You are a real estate social media strategist who creates content that generates engagement and leads. Create social media content for the following property listing.\n\n**Property Details:**\n- Address/Area: [ADDRESS OR GENERAL AREA]\n- List price: [PRICE]\n- Bedrooms/Bathrooms: [BED/BATH]\n- Square footage: [SQ FT]\n- Key features: [LIST 3-5 STANDOUT FEATURES]\n- Target buyer: [WHO WOULD LOVE THIS HOME]\n- Unique angle: [WHAT MAKES THIS PROPERTY SPECIAL OR PHOTOGENIC]\n\n**Agent Details:**\n- Your name: [NAME]\n- Your brand voice: [PROFESSIONAL / RELATABLE / LUXURY / FUN / EDUCATIONAL]\n- Your market: [CITY/AREA]\n\n**Content Goals:** [GENERATE INQUIRIES / BUILD BRAND / DRIVE OPEN HOUSE TRAFFIC / CREATE SHAREABLE CONTENT]\n\nCreate content for each platform:\n\n1. **Instagram Carousel Post** (the workhorse)\n   - Hook slide text (the first slide that stops the scroll)\n   - 5-7 slide outline with text overlay suggestions for each\n   - Caption (under 200 words with storytelling hook, property highlights, and CTA)\n   - 20 relevant hashtags organized by reach (5 broad, 10 niche, 5 local)\n   - Best posting time suggestion\n\n2. **Instagram Reel / TikTok Script** (15-30 seconds)\n   - Hook (first 2 seconds — what makes them stop scrolling)\n   - Scene-by-scene shot list with timing\n   - Voiceover script or text overlay for each scene\n   - Trending audio suggestion (describe the vibe, not specific song)\n   - CTA overlay for final frame\n\n3. **Facebook Post** (for local reach)\n   - Post text optimized for Facebook algorithm (question or story format)\n   - Photo selection strategy (which photos to lead with)\n   - Suggested audience for boosting (demographics, interests, location radius)\n\n4. **LinkedIn Post** (for professional network)\n   - Market insight angle that features the property naturally\n   - Professional tone that positions you as a market expert\n   - Engagement question to drive comments\n\n5. **Story Content** (Instagram/Facebook)\n   - 5-frame story sequence with interactive elements (polls, questions, quizzes)\n   - Each frame: visual description + text overlay + interactive element\n\nGuidelines:\n- Never lead with price — lead with lifestyle or emotion\n- Comply with Fair Housing in all content\n- Each platform should feel native, not cross-posted\n- Include at least one piece of educational or entertaining content mixed with the listing promotion",
        category: "real-estate",
        tags: ["social media", "real estate marketing", "listing promotion"],
        useCase:
          "Promote new listings across all social platforms with content optimized for each platform's algorithm and audience.",
        exampleInput:
          "PROPERTY: Modern 3BR loft condo, $425K, downtown district, FEATURES: floor-to-ceiling windows, rooftop access, exposed brick, BUYER: Young professionals, BRAND VOICE: Relatable and fun, GOAL: Generate inquiries",
        exampleOutput:
          "Instagram Carousel Hook Slide: 'POV: Your morning coffee with this view.' Slide 2: Floor-to-ceiling windows flooding the living room with light. Caption: 'I walked into this downtown loft and immediately thought: this is where Sunday mornings were meant to be spent...'",
        targetKeywords: [
          "real estate social media prompt",
          "listing social media template",
          "AI real estate marketing content",
        ],
        relatedTemplates: ["property-listing-description-writer", "open-house-follow-up-email"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
    ],
  },

  // ── Finance & Accounting ─────────────────────────────────────────────────
  {
    slug: "finance",
    title: "Finance & Accounting Prompts",
    description:
      "AI prompt templates for financial reports, budgeting, cash flow analysis, tax planning, and client communications for finance professionals. Works with ChatGPT, Claude, or Gemini.",
    longDescription:
      "Streamline your finance and accounting workflows with prompt templates for writing financial narratives, building budgets, analyzing cash flow, and communicating with clients. Each template is designed for real-world finance scenarios — from drafting quarterly reports to handling invoice disputes. Paste them into any major AI assistant and customize the bracketed placeholders for your organization.",
    icon: "💰",
    keywords: [
      "finance prompts",
      "ChatGPT for accounting",
      "financial analysis prompts",
      "bookkeeping prompts",
    ],
    relatedCategories: ["legal", "writing", "productivity"],
    templates: [
      {
        slug: "financial-report-narrator",
        title: "Financial Report Narrator",
        description:
          "Transform raw financial data into a clear, executive-ready narrative report with insights and recommendations.",
        prompt:
          "You are a CFO-level financial analyst who excels at translating numbers into strategic narratives. Write an executive financial report narrative from the following data.\n\n**Report Details:**\n- Company name: [COMPANY NAME]\n- Report period: [MONTH / QUARTER / YEAR]\n- Report type: [MONTHLY SUMMARY / QUARTERLY REVIEW / ANNUAL REPORT / BOARD PRESENTATION]\n- Audience: [BOARD / EXECUTIVE TEAM / INVESTORS / DEPARTMENT HEADS]\n\n**Financial Data:**\n- Revenue: [AMOUNT] (vs. prior period: [+/- %], vs. budget: [+/- %])\n- COGS/Cost of Revenue: [AMOUNT]\n- Gross margin: [%]\n- Operating expenses: [AMOUNT] (breakdown by category if available)\n- EBITDA: [AMOUNT]\n- Net income: [AMOUNT]\n- Cash position: [AMOUNT]\n- Key receivables/payables: [NOTABLE ITEMS]\n- Headcount: [NUMBER] (change: [+/-])\n\n**Context:**\n- Key business events this period: [e.g., product launch, new client win, restructuring]\n- Industry conditions: [e.g., market downturn, supply chain issues, growth sector]\n- Previous period commitments: [WHAT WAS PROMISED LAST PERIOD]\n\n**Specific Metrics to Highlight:**\n- [METRIC 1, e.g., customer acquisition cost trend]\n- [METRIC 2, e.g., recurring revenue growth]\n- [METRIC 3, e.g., burn rate and runway]\n\nWrite the financial narrative with:\n\n1. **Executive Summary** (4-5 sentences) — The headline: how did we perform, and what does it mean? Lead with the most important story, not just the biggest number.\n2. **Revenue Analysis** — What drove revenue performance? Break down by segment, product, or customer cohort. Explain variances from budget and prior period.\n3. **Profitability** — Margin trends, cost drivers, and operational efficiency. Flag any concerning trends.\n4. **Cash Flow & Balance Sheet Highlights** — Cash position, working capital, notable changes in assets or liabilities\n5. **Operational Metrics** — The non-financial KPIs that explain the financial results (e.g., churn, conversion, pipeline)\n6. **Variance Analysis** — Top 3 favorable and unfavorable variances from budget with explanations\n7. **Risk & Concerns** — 2-3 items the audience should be aware of\n8. **Outlook & Recommendations** — Forward-looking guidance and 3-5 recommended actions\n\nGuidelines:\n- Every number should have context (vs. what?)\n- Lead with insights, not data dumps\n- Use plain language — avoid accounting jargon unless the audience expects it\n- Bold key figures and percentages\n- Include suggestions for chart/visual types alongside each section",
        category: "finance",
        tags: ["financial report", "executive summary", "financial narrative"],
        useCase:
          "Write the narrative portion of monthly, quarterly, or annual financial reports that executives and board members actually read and act on.",
        exampleInput:
          "COMPANY: TechBridge SaaS, PERIOD: Q4 2025, REVENUE: $2.4M (+18% YoY, +5% vs budget), NET INCOME: $180K, CASH: $1.2M, EVENTS: launched enterprise tier, lost 2 mid-market accounts, AUDIENCE: Board of Directors",
        exampleOutput:
          "Executive Summary: TechBridge closed Q4 with $2.4M in revenue, exceeding budget by 5% and marking our strongest quarter to date. The enterprise tier launch contributed $320K in new ARR, though mid-market churn offset gains and warrants attention heading into Q1...",
        targetKeywords: [
          "financial report prompt",
          "AI financial narrative generator",
          "executive financial summary template",
        ],
        relatedTemplates: ["cash-flow-forecast-narrative", "client-financial-review-summary"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "budget-planning-assistant",
        title: "Budget Planning Assistant",
        description:
          "Create a detailed department or company budget with line items, assumptions, and scenario planning.",
        prompt:
          "You are a financial planning and analysis (FP&A) manager. Create a comprehensive budget plan for the following.\n\n**Budget Details:**\n- Budget for: [COMPANY / DEPARTMENT / PROJECT / EVENT]\n- Budget period: [FISCAL YEAR / QUARTER / PROJECT DURATION]\n- Budget type: [ANNUAL OPERATING / CAPITAL / PROJECT / ZERO-BASED]\n- Organization: [COMPANY NAME]\n- Department (if applicable): [DEPARTMENT]\n\n**Current State:**\n- Last period's actual spend: [AMOUNT]\n- Last period's budget: [AMOUNT]\n- Variance explanation: [WHY OVER/UNDER]\n- Headcount: [CURRENT AND PLANNED]\n\n**Known Commitments:**\n- Fixed costs: [LIST, e.g., salaries, rent, software subscriptions]\n- Planned investments: [NEW HIRES, TOOLS, PROJECTS]\n- Revenue target (if applicable): [TARGET]\n\n**Constraints:**\n- Budget ceiling: [MAX AMOUNT OR % CHANGE FROM PRIOR YEAR]\n- Mandatory reductions: [AREAS TO CUT IF APPLICABLE]\n- Growth areas: [WHERE ADDITIONAL INVESTMENT IS APPROVED]\n\n**Assumptions:**\n- Inflation/cost increase assumption: [%]\n- Headcount change: [+/- HEADS]\n- Revenue growth assumption: [%]\n\nCreate the budget plan with:\n\n1. **Budget Summary** — Total budget request with 3-sentence justification tied to business objectives\n2. **Revenue Projections** (if applicable) — Monthly breakdown with assumptions for each revenue stream\n3. **Expense Categories** — Detailed line items organized by:\n   - Personnel (salaries, benefits, contractors, recruiting)\n   - Technology (software, infrastructure, tools)\n   - Marketing/Sales (campaigns, events, travel)\n   - Operations (office, supplies, insurance)\n   - Professional Services (legal, accounting, consulting)\n   - Contingency (recommended 5-10%)\n4. **Monthly Phasing** — How spend is distributed across months (front-loaded, even, seasonal)\n5. **Assumptions Document** — Every assumption listed and justified\n6. **Scenario Analysis:**\n   - Base case: Approved budget\n   - Austerity case: 15% reduction — what gets cut and impact\n   - Growth case: 20% increase — what you would invest in and expected ROI\n7. **KPIs and Accountability** — How budget performance will be tracked, review cadence, reforecast triggers\n8. **Approval Request** — Clear ask with decision-maker action items\n\nFormat key figures in a table structure. Flag any line items that are estimates requiring further validation.",
        category: "finance",
        tags: ["budgeting", "financial planning", "FP&A"],
        useCase:
          "Build annual or quarterly budgets with clear assumptions and scenario planning for leadership approval.",
        exampleInput:
          "BUDGET FOR: Marketing Department, PERIOD: FY2026, LAST YEAR SPEND: $850K, HEADCOUNT: 8 (adding 2), GROWTH AREAS: paid acquisition and content, CEILING: $1.1M, REVENUE TARGET: $8M company revenue",
        exampleOutput:
          "Budget Summary: The Marketing Department requests $1.05M for FY2026, a 24% increase driven by two new hires and expanded paid acquisition to support the company's $8M revenue target. Personnel: $620K (8 current + 2 new hires at $85K avg loaded cost)...",
        targetKeywords: [
          "budget planning prompt",
          "AI budget template",
          "financial budget generator",
        ],
        relatedTemplates: ["financial-report-narrator", "cash-flow-forecast-narrative"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "invoice-dispute-response-drafter",
        title: "Invoice Dispute Response Drafter",
        description:
          "Draft professional invoice dispute responses that resolve billing conflicts while maintaining client relationships.",
        prompt:
          "You are an accounts receivable specialist who resolves billing disputes diplomatically. Draft a response to the following invoice dispute.\n\n**Invoice Details:**\n- Invoice number: [NUMBER]\n- Invoice amount: [AMOUNT]\n- Invoice date: [DATE]\n- Due date: [DUE DATE]\n- Service/Product: [WHAT WAS BILLED]\n- Payment terms: [NET 30 / NET 60 / etc.]\n\n**Dispute Details:**\n- Disputed by: [CLIENT NAME AND CONTACT]\n- Dispute reason: [REASON, e.g., services not rendered, incorrect amount, duplicate charge, unauthorized charges, quality issues, pricing discrepancy]\n- Amount in dispute: [FULL AMOUNT / PARTIAL — specify]\n- Client's specific complaint: [QUOTE OR SUMMARIZE THEIR MESSAGE]\n- History: [FIRST DISPUTE / RECURRING ISSUE / LONG-STANDING CLIENT]\n\n**Your Position:**\n- Is the invoice correct: [YES / PARTIALLY / NO — explain]\n- Supporting documentation: [WHAT PROOF YOU HAVE, e.g., signed SOW, delivery confirmation, time logs]\n- Desired outcome: [FULL PAYMENT / PARTIAL CREDIT / PAYMENT PLAN / WRITE-OFF]\n- Flexibility level: [FIRM / NEGOTIABLE / WILLING TO CREDIT]\n\nDraft the response with:\n\n1. **Acknowledgment** — Thank them for bringing this to your attention. Show you take their concern seriously.\n2. **Investigation Summary** — What you reviewed and found. Reference specific documents.\n3. **Resolution** — Based on your position:\n   - If invoice is correct: Explain clearly with evidence, but offer to walk through the charges\n   - If partially correct: Acknowledge the error, issue a credit memo, and present the revised amount\n   - If incorrect: Apologize, issue the correction immediately, and explain what went wrong\n4. **Supporting Evidence** — List the documents you can provide (don't attach in the template — reference them)\n5. **Proposed Next Steps** — Clear path forward with timeline\n6. **Relationship Maintenance** — Reaffirm the value of the relationship regardless of outcome\n\nProvide 3 versions:\n- **Version A: Invoice is correct** — Professional, firm, evidence-based\n- **Version B: Partial credit warranted** — Collaborative, solution-oriented\n- **Version C: Full credit needed** — Apologetic, swift resolution\n\nGuidelines:\n- Never be adversarial or condescending\n- Reference contract terms when relevant but don't weaponize them\n- Offer a phone call for complex disputes\n- Include escalation path if the client remains unsatisfied\n- Keep each version under 300 words",
        category: "finance",
        tags: ["invoice dispute", "accounts receivable", "billing"],
        useCase:
          "Respond professionally to invoice disputes to recover revenue while preserving client relationships.",
        exampleInput:
          "INVOICE: #4521, AMOUNT: $12,500, SERVICE: Monthly retainer for marketing services, DISPUTE: Client says deliverables were not met — only received 3 of 5 promised blog posts, YOUR POSITION: Correct — 5 posts were delivered, 2 were sent to wrong contact, DOCUMENTATION: Email delivery confirmations with timestamps",
        exampleOutput:
          "Version A (Invoice Correct): Dear [Client], Thank you for reaching out about Invoice #4521. I reviewed our delivery records and confirmed that all five blog posts were delivered during the billing period. It appears two posts were sent to [old contact] rather than your current team...",
        targetKeywords: [
          "invoice dispute response prompt",
          "AI billing dispute template",
          "accounts receivable email generator",
        ],
        relatedTemplates: ["accounts-receivable-collection-email", "client-financial-review-summary"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "tax-planning-checklist",
        title: "Tax Planning Checklist",
        description:
          "Generate a comprehensive tax planning checklist covering deductions, credits, deadlines, and strategies for individuals or businesses.",
        prompt:
          "You are a tax planning advisor. Create a comprehensive tax planning checklist for the following client.\n\n**Client Details:**\n- Client type: [INDIVIDUAL / SMALL BUSINESS / CORPORATION / FREELANCER / PARTNERSHIP]\n- Entity type (if business): [SOLE PROPRIETOR / LLC / S-CORP / C-CORP]\n- Industry: [INDUSTRY]\n- Annual revenue/income: [RANGE]\n- State(s): [STATE(S) FOR TAX PURPOSES]\n- Tax year: [YEAR]\n\n**Financial Situation:**\n- Filing status (if individual): [SINGLE / MARRIED FILING JOINTLY / HEAD OF HOUSEHOLD]\n- Major income sources: [LIST, e.g., W-2, 1099, rental, investments, business income]\n- Known deductions: [WHAT THEY ALREADY CLAIM]\n- Retirement accounts: [401k, IRA, SEP, etc.]\n- Major life events this year: [e.g., marriage, home purchase, new business, sale of property]\n- Estimated tax liability: [APPROXIMATE]\n\n**Planning Goals:**\n- Primary goal: [MINIMIZE CURRENT YEAR TAX / MAXIMIZE DEDUCTIONS / PLAN FOR FUTURE / OPTIMIZE ENTITY STRUCTURE]\n- Specific concerns: [e.g., estimated payments, AMT, state nexus, retirement contributions]\n\nCreate the tax planning checklist organized into:\n\n1. **Pre-Year-End Actions** (time-sensitive)\n   - Deduction acceleration or deferral strategies\n   - Income timing decisions\n   - Retirement contribution deadlines and maximums\n   - Charitable giving optimization (bunching, donor-advised funds, QCDs)\n   - Capital gain/loss harvesting opportunities\n\n2. **Income Optimization**\n   - Income splitting strategies (if applicable)\n   - Entity structure review\n   - Compensation vs. distribution optimization\n   - Deferral opportunities\n\n3. **Deductions & Credits**\n   - Commonly overlooked deductions for this client type\n   - Available tax credits with eligibility criteria\n   - Section 199A (QBI) deduction considerations\n   - Home office, vehicle, travel deductions (if applicable)\n\n4. **Retirement & Benefits**\n   - Contribution limits and deadlines\n   - Roth conversion analysis considerations\n   - Employer plan optimization\n\n5. **State & Local**\n   - State-specific deductions or credits\n   - Multi-state filing requirements\n   - SALT deduction strategies\n\n6. **Record-Keeping & Compliance**\n   - Documents to gather and organize\n   - Estimated tax payment schedule\n   - Filing deadlines and extension options\n\n7. **Long-Term Planning**\n   - Strategies for next year to implement now\n   - Estate planning considerations\n   - Succession planning (if business)\n\nFor each item: action description, deadline (if applicable), estimated tax impact (High/Medium/Low), and who is responsible (client, CPA, financial advisor).\n\n[DISCLAIMER: This is a planning framework, not tax advice. Consult a licensed CPA or tax attorney for implementation.]",
        category: "finance",
        tags: ["tax planning", "tax strategy", "deductions"],
        useCase:
          "Prepare a comprehensive tax planning strategy before year-end or when starting engagement with a new client.",
        exampleInput:
          "CLIENT: Freelance software developer, LLC single-member, INCOME: $180K, STATE: Texas, RETIREMENT: No current plan, CONCERNS: High estimated tax payments, wants to reduce taxable income, HOME OFFICE: Yes",
        exampleOutput:
          "Pre-Year-End Action 1: Open and fund a Solo 401(k) before December 31 — employee contribution up to $23,000, plus 25% of net self-employment income as employer contribution. Estimated tax impact: HIGH (could reduce taxable income by $40K+). Deadline: Account must be established by Dec 31...",
        targetKeywords: [
          "tax planning checklist prompt",
          "AI tax strategy template",
          "tax planning generator",
        ],
        relatedTemplates: ["budget-planning-assistant", "expense-report-categorizer"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "cash-flow-forecast-narrative",
        title: "Cash Flow Forecast Narrative",
        description:
          "Create a narrative cash flow forecast with assumptions, scenarios, and actionable recommendations for managing liquidity.",
        prompt:
          "You are a treasury management specialist. Create a cash flow forecast narrative for the following business.\n\n**Business Details:**\n- Company name: [COMPANY NAME]\n- Industry: [INDUSTRY]\n- Revenue model: [SUBSCRIPTION / PROJECT-BASED / PRODUCT SALES / MIXED]\n- Forecast period: [e.g., Next 13 weeks, next 6 months, next 12 months]\n- Current cash position: [AMOUNT]\n\n**Cash Inflows:**\n- Monthly recurring revenue: [AMOUNT]\n- Average accounts receivable: [AMOUNT, AVERAGE COLLECTION DAYS]\n- Expected new sales: [PIPELINE WITH PROBABILITIES]\n- Other income: [INTEREST, TAX REFUNDS, etc.]\n\n**Cash Outflows:**\n- Payroll (including taxes and benefits): [AMOUNT / FREQUENCY]\n- Rent/Facilities: [AMOUNT / FREQUENCY]\n- Vendor payments: [KEY VENDORS AND AMOUNTS]\n- Loan/Debt service: [PAYMENTS AND SCHEDULE]\n- Planned capital expenditures: [UPCOMING PURCHASES]\n- Variable costs: [AS % OF REVENUE OR FIXED ESTIMATE]\n\n**Known Events:**\n- [EVENT 1, e.g., large client payment due in 45 days]\n- [EVENT 2, e.g., annual insurance premium due next month]\n- [EVENT 3, e.g., seasonal revenue dip in Q3]\n\n**Concerns:**\n- [CONCERN 1, e.g., slow-paying customer]\n- [CONCERN 2, e.g., upcoming debt maturity]\n\nCreate the cash flow forecast narrative with:\n\n1. **Overview** — Current liquidity position and headline forecast (will you have enough cash?)\n2. **Week-by-Week or Month-by-Month Forecast** — Show opening balance, inflows, outflows, and closing balance for each period. Highlight any weeks/months where cash falls below a safe threshold.\n3. **Key Assumptions** — Every assumption listed with confidence level (High/Medium/Low)\n4. **Scenario Analysis:**\n   - Best case: Strong collections, new deals close on time\n   - Base case: Historical patterns continue\n   - Worst case: Delayed collections, lost client, unexpected expense\n5. **Cash Crunch Warning** — If any scenario shows a cash shortfall, identify exactly when it occurs and how large the gap is\n6. **Liquidity Recommendations** — 5-7 specific actions to optimize cash flow:\n   - Immediate actions (this week)\n   - Short-term actions (this month)\n   - Structural changes (this quarter)\n7. **Monitoring Dashboard** — Key metrics to track weekly and trigger points for action\n8. **Contingency Plan** — What to do if the worst case materializes (credit lines, expense cuts, collection acceleration)\n\nPresent numbers clearly with suggested table/chart formats for each section.",
        category: "finance",
        tags: ["cash flow", "forecasting", "treasury management"],
        useCase:
          "Forecast cash flow when planning for growth, managing tight liquidity, or preparing for board/investor reporting.",
        exampleInput:
          "COMPANY: GreenLeaf Landscaping, INDUSTRY: Seasonal services, CASH: $85K, MRR: Variable ($40K winter, $120K summer), PAYROLL: $55K/month, CONCERN: Cash gets tight in Jan-Feb, has $50K line of credit available",
        exampleOutput:
          "Overview: GreenLeaf enters the forecast period with $85K in cash and faces a predictable seasonal trough in January-February where monthly outflows ($72K) will exceed inflows ($40K). Base case projects cash dropping to $13K in late February before recovering in March...",
        targetKeywords: [
          "cash flow forecast prompt",
          "AI cash flow projection template",
          "liquidity planning generator",
        ],
        relatedTemplates: ["financial-report-narrator", "budget-planning-assistant"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "client-financial-review-summary",
        title: "Client Financial Review Summary",
        description:
          "Prepare a clear, actionable financial review summary for client meetings covering performance, insights, and recommendations.",
        prompt:
          "You are a client-facing accountant or financial advisor preparing for a quarterly review meeting. Create a financial review summary for the following client.\n\n**Client Details:**\n- Client name: [CLIENT NAME]\n- Business type: [INDUSTRY AND ENTITY TYPE]\n- Client relationship: [NEW CLIENT / 1-2 YEARS / LONG-TERM]\n- Meeting format: [IN-PERSON / VIRTUAL / REPORT ONLY]\n- Client sophistication: [HIGH — understands financial statements / MEDIUM — needs some explanation / LOW — needs everything simplified]\n\n**Financial Performance:**\n- Revenue: [AMOUNT] (vs. prior period: [CHANGE], vs. budget: [CHANGE])\n- Gross profit: [AMOUNT AND MARGIN %]\n- Operating expenses: [AMOUNT] (notable changes: [LIST])\n- Net income: [AMOUNT AND MARGIN %]\n- Cash position: [AMOUNT] (trend: [IMPROVING / DECLINING / STABLE])\n- Outstanding AR: [AMOUNT AND AGING SUMMARY]\n- Outstanding AP: [AMOUNT]\n- Debt position: [TOTAL AND KEY TERMS]\n\n**Key Issues to Discuss:**\n- [ISSUE 1, e.g., expenses growing faster than revenue]\n- [ISSUE 2, e.g., tax planning opportunity]\n- [ISSUE 3, e.g., receivables aging concern]\n\n**Upcoming Events:**\n- [EVENT 1, e.g., tax filing deadline]\n- [EVENT 2, e.g., loan renewal]\n- [EVENT 3, e.g., planned expansion]\n\nCreate the financial review summary with:\n\n1. **Meeting Agenda** — Structured agenda with time allocations\n2. **Financial Snapshot** — One-page summary with key metrics, trends (up/down arrows), and traffic light indicators (green/yellow/red)\n3. **Performance Narrative** — 3-4 paragraphs explaining what happened and why, calibrated to client sophistication level\n4. **Deep Dive Topics** — For each key issue:\n   - What the data shows\n   - Why it matters\n   - Recommended action with timeline\n   - Decision needed from client\n5. **Benchmarks** — How does this client compare to industry averages? (suggest which benchmarks to reference)\n6. **Action Items** — Clear list with owners and deadlines\n7. **Forward Look** — What to expect next quarter and what to prepare for\n8. **Questions for the Client** — 3-5 questions you need answers to for effective ongoing advising\n\nTone: Proactive, advisory (not just reporting), and calibrated to the client's financial sophistication. Position yourself as a trusted advisor, not just a number-cruncher.",
        category: "finance",
        tags: ["client review", "financial advisory", "accounting"],
        useCase:
          "Prepare for quarterly client review meetings with a structured summary that demonstrates advisory value beyond bookkeeping.",
        exampleInput:
          "CLIENT: Sunrise Bakery, TYPE: LLC bakery with catering, RELATIONSHIP: 2 years, SOPHISTICATION: Medium, REVENUE: $320K (up 12% YoY), NET INCOME: $38K (down from $45K due to ingredient costs), ISSUES: food cost inflation, should they raise prices?",
        exampleOutput:
          "Financial Snapshot: Revenue is up 12% to $320K — strong top-line growth. However, net income declined 16% as ingredient costs rose faster than pricing. Deep Dive — Pricing Strategy: Your food cost ratio has increased from 28% to 34% over the past 6 months...",
        targetKeywords: [
          "client financial review prompt",
          "AI accounting review template",
          "financial advisory meeting generator",
        ],
        relatedTemplates: ["financial-report-narrator", "invoice-dispute-response-drafter"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "expense-report-categorizer",
        title: "Expense Report Categorizer",
        description:
          "Categorize and organize business expenses into proper accounting categories with tax deduction notes and audit-ready documentation.",
        prompt:
          "You are a bookkeeper and expense management specialist. Help categorize and organize the following business expenses.\n\n**Business Details:**\n- Business type: [INDUSTRY AND ENTITY TYPE]\n- Accounting method: [CASH / ACCRUAL]\n- Chart of accounts style: [STANDARD / CUSTOMIZED — describe]\n- Tax year: [YEAR]\n- Accounting software: [QUICKBOOKS / XERO / FRESHBOOKS / WAVE / OTHER]\n\n**Expenses to Categorize:**\n[PASTE YOUR LIST OF EXPENSES — include date, vendor/payee, amount, and any description available]\n\nExample format:\n- 01/15 — Amazon — $127.43 — office supplies\n- 01/16 — Delta Airlines — $342.00 — flight to client meeting\n- 01/16 — Uber — $28.50 — airport to hotel\n\n**Special Considerations:**\n- [CONSIDERATION 1, e.g., home office setup — need to determine personal vs. business]\n- [CONSIDERATION 2, e.g., meals with clients vs. team meals]\n- [CONSIDERATION 3, e.g., mixed-use purchases]\n\nFor each expense, provide:\n\n1. **Categorization Table** with columns:\n   - Date | Vendor | Amount | Category | Sub-Category | Tax Deductible (Yes/Partial/No) | Deduction % | Notes\n\n2. **Category Summary** — Totals by category with:\n   - Category name and account number (if standard chart of accounts)\n   - Total spend\n   - % of total expenses\n   - Tax deduction rules that apply\n   - Documentation needed for audit\n\n3. **Flagged Items** — Expenses that need clarification:\n   - Why they're flagged\n   - What additional information is needed\n   - How categorization changes based on the answer\n\n4. **Tax Deduction Notes:**\n   - Meals: 50% vs. 100% deductible rules\n   - Vehicle: Mileage rate vs. actual expenses\n   - Home office: Simplified vs. regular method\n   - Entertainment: What's deductible vs. not under current tax law\n\n5. **Missing Documentation Alert** — Which expenses need receipts or additional documentation to be deductible\n\n6. **Monthly Journal Entry** — Suggested journal entry to record these expenses\n\n[DISCLAIMER: Tax categorization should be confirmed by a licensed CPA. Deductibility depends on specific circumstances.]",
        category: "finance",
        tags: ["expense management", "bookkeeping", "categorization"],
        useCase:
          "Organize and categorize business expenses for clean books, tax preparation, or expense report submission.",
        exampleInput:
          "BUSINESS: Consulting LLC, METHOD: Cash, SOFTWARE: QuickBooks Online, EXPENSES: 15 items from a business trip including flights, hotels, meals, Uber, conference registration, and a new laptop",
        exampleOutput:
          "Categorization: Delta Airlines $342 — Category: Travel — Sub: Airfare — Tax Deductible: Yes (100%) — Documentation: Boarding pass + receipt. Hilton $198/night x 3 — Category: Travel — Sub: Lodging — Tax Deductible: Yes (100%) — Note: Room rate only, minibar excluded...",
        targetKeywords: [
          "expense categorization prompt",
          "AI bookkeeping template",
          "expense report generator",
        ],
        relatedTemplates: ["tax-planning-checklist", "budget-planning-assistant"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "investment-thesis-builder",
        title: "Investment Thesis Builder",
        description:
          "Construct a structured investment thesis with market analysis, competitive positioning, financial projections, and risk factors.",
        prompt:
          "You are an investment analyst building a thesis for a potential investment. Construct a comprehensive investment thesis for the following opportunity.\n\n**Investment Details:**\n- Company/Asset: [NAME]\n- Investment type: [VENTURE CAPITAL / PRIVATE EQUITY / PUBLIC EQUITY / REAL ESTATE / DEBT]\n- Stage: [SEED / SERIES A-D / GROWTH / MATURE / TURNAROUND]\n- Sector: [INDUSTRY AND SUB-SECTOR]\n- Ask/Valuation: [INVESTMENT AMOUNT AND VALUATION]\n\n**Company Overview:**\n- What they do: [DESCRIPTION]\n- Founded: [YEAR]\n- Revenue: [CURRENT AND GROWTH RATE]\n- Business model: [HOW THEY MAKE MONEY]\n- Team: [KEY LEADERSHIP]\n- Key metrics: [e.g., ARR, GMV, DAU, retention rates]\n\n**Market:**\n- Total addressable market: [TAM]\n- Market growth rate: [%]\n- Key trends driving the market: [LIST]\n- Market structure: [FRAGMENTED / CONSOLIDATING / OLIGOPOLY]\n\n**Competition:**\n- Direct competitors: [LIST WITH BRIEF DESCRIPTIONS]\n- Company's competitive advantage: [MOAT]\n- Market position: [LEADER / CHALLENGER / NICHE]\n\n**Your Investment Criteria:**\n- Return target: [e.g., 3x in 5 years, 15% IRR]\n- Hold period: [YEARS]\n- Governance requirements: [BOARD SEAT / OBSERVER / PASSIVE]\n\nBuild the investment thesis with:\n\n1. **Thesis Statement** — 3-4 sentences that capture why this is a compelling investment. This should be memorably concise.\n2. **Market Opportunity** — Size, growth, and structural tailwinds with evidence\n3. **Competitive Positioning** — Why this company wins in this market (moat analysis)\n4. **Financial Analysis:**\n   - Historical performance and unit economics\n   - Revenue projection model (3-5 year) with assumptions\n   - Path to profitability (if not yet profitable)\n   - Comparable company analysis (valuation multiples)\n5. **Growth Drivers** — Top 3-5 catalysts for value creation\n6. **Risk Factors** — Top 5 risks ranked by likelihood and impact, with mitigants\n7. **Return Analysis:**\n   - Base case, bull case, bear case returns\n   - Sensitivity analysis on key variables\n   - Exit scenarios (IPO, M&A, secondary, dividend)\n8. **Key Questions for Due Diligence** — 10 questions to answer before investing\n9. **Recommendation** — Invest / Pass / Watch with clear reasoning\n\nTone: Analytical, evidence-based, balanced (acknowledge both bulls and bears). This should be presentable to an investment committee.",
        category: "finance",
        tags: ["investment analysis", "thesis building", "due diligence"],
        useCase:
          "Build a structured investment thesis when evaluating a potential investment for yourself, your fund, or your advisory clients.",
        exampleInput:
          "COMPANY: MealPlanr (Series B), SECTOR: FoodTech SaaS, REVENUE: $8M ARR growing 90% YoY, VALUATION: $80M, TAM: $12B meal planning market, MOAT: Proprietary nutrition AI engine and 400K active users, ASK: $15M for 18.75% equity",
        exampleOutput:
          "Thesis: MealPlanr is positioned to capture significant share of the $12B meal planning market through its proprietary nutrition AI, which drives 3x higher retention than competitors. At $80M valuation on $8M ARR (10x multiple), entry is reasonable given 90% growth...",
        targetKeywords: [
          "investment thesis prompt",
          "AI investment analysis template",
          "investment memo generator",
        ],
        relatedTemplates: ["financial-report-narrator", "investment-property-analysis"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "financial-glossary-explainer",
        title: "Financial Glossary Explainer",
        description:
          "Create plain-language explanations of financial concepts, ratios, and terms for non-financial audiences.",
        prompt:
          "You are a financial educator who makes complex concepts accessible. Create clear, plain-language explanations for the following financial terms and concepts.\n\n**Context:**\n- Audience: [NON-FINANCIAL MANAGERS / NEW BUSINESS OWNERS / STUDENTS / INVESTORS / CLIENTS]\n- Industry context: [INDUSTRY, if specific examples are needed]\n- Depth needed: [QUICK DEFINITIONS / DETAILED EXPLANATIONS WITH EXAMPLES]\n- Format: [GLOSSARY / TRAINING MATERIAL / FAQ / CHEAT SHEET]\n\n**Terms to Explain:**\n[LIST OF FINANCIAL TERMS OR CONCEPTS, e.g.:\n- EBITDA\n- Working capital\n- Accounts receivable vs. accounts payable\n- Burn rate\n- Gross margin vs. net margin\n- Depreciation\n- Cash flow vs. profit\n- P/E ratio\n- Break-even point\n- Accrual vs. cash accounting]\n\nFor each term/concept, provide:\n\n1. **One-Sentence Definition** — Plain language, no jargon in the definition\n2. **Why It Matters** — Why should this audience care about this concept? (2-3 sentences)\n3. **Real-World Example** — A concrete, relatable example using [INDUSTRY] context if provided. Use specific numbers.\n4. **Common Misconception** — One thing people often get wrong about this concept\n5. **Quick Formula** (if applicable) — The calculation with labeled components\n6. **Analogy** — A non-financial analogy that makes the concept intuitive\n7. **Red Flag / Green Flag** — What's a concerning value vs. a healthy value for this metric\n\nAdditional sections:\n- **How These Connect** — A brief explanation of how 3-4 of the terms relate to each other\n- **Cheat Sheet** — A one-page summary table with: Term | Definition (10 words max) | Formula | Good vs. Bad\n\nGuidelines:\n- Never assume the reader knows what any acronym stands for\n- Use everyday language — if a 5th grader can't understand the analogy, simplify it\n- Make examples specific (use $X amounts, not vague descriptions)\n- Avoid the phrase 'simply put' — just say it simply\n- Each explanation should stand alone (no 'as mentioned above')",
        category: "finance",
        tags: ["financial literacy", "education", "glossary"],
        useCase:
          "Educate non-financial team members, new business owners, or clients on financial concepts they need to understand for better decision-making.",
        exampleInput:
          "AUDIENCE: Non-financial department managers at a SaaS company, DEPTH: Detailed with examples, TERMS: EBITDA, burn rate, MRR, churn rate, CAC, LTV, runway, gross margin",
        exampleOutput:
          "EBITDA — Earnings Before Interest, Taxes, Depreciation, and Amortization. One-Sentence: How much money your business makes from its core operations, before accounting for financing decisions, taxes, and wear-and-tear on assets. Analogy: Think of EBITDA like measuring how fast a car's engine runs, separate from the cost of gas, insurance, or the car losing value over time...",
        targetKeywords: [
          "financial glossary prompt",
          "AI finance explainer template",
          "financial literacy generator",
        ],
        relatedTemplates: ["client-financial-review-summary", "budget-planning-assistant"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "accounts-receivable-collection-email",
        title: "Accounts Receivable Collection Email",
        description:
          "Write a professional, escalating series of collection emails for overdue invoices that recover revenue without damaging relationships.",
        prompt:
          "You are an accounts receivable specialist who excels at collecting overdue payments while maintaining positive client relationships. Create a collection email sequence for the following overdue invoice.\n\n**Invoice Details:**\n- Invoice number: [NUMBER]\n- Original amount: [AMOUNT]\n- Invoice date: [DATE]\n- Original due date: [DUE DATE]\n- Days overdue: [DAYS]\n- Service/Product: [WHAT WAS DELIVERED]\n- Payment terms: [CONTRACTUAL TERMS]\n\n**Client Details:**\n- Client name: [CLIENT NAME]\n- Contact person: [NAME AND TITLE]\n- Relationship history: [NEW CLIENT / ESTABLISHED / STRATEGIC ACCOUNT]\n- Payment history: [USUALLY ON TIME / OCCASIONALLY LATE / CHRONICALLY LATE]\n- Known circumstances: [ANY CONTEXT, e.g., client is going through restructuring, contact person is new]\n\n**Collection Status:**\n- Previous attempts: [WHAT'S BEEN TRIED SO FAR]\n- Client response: [IGNORING / PROMISED BUT DIDN'T PAY / DISPUTED / CLAIMED CASH FLOW ISSUES]\n- Your flexibility: [CAN OFFER PAYMENT PLAN / FIRM ON FULL AMOUNT / WILLING TO NEGOTIATE]\n\nCreate a 5-email escalation sequence:\n\n1. **Friendly Reminder** (1-7 days overdue)\n   - Subject line (2 options)\n   - Tone: Casual, helpful — assume they simply forgot\n   - Include: Invoice reference, amount, easy payment options\n   - Under 100 words\n\n2. **Second Notice** (14-21 days overdue)\n   - Subject line (2 options)\n   - Tone: Professional, slightly more direct\n   - Include: Recap of previous outreach, specific ask for payment date\n   - Under 150 words\n\n3. **Escalation Warning** (30-45 days overdue)\n   - Subject line (2 options)\n   - Tone: Firm, business-focused\n   - Include: Total outstanding, late fee notice (if applicable), payment plan offer, consequence preview\n   - Under 200 words\n\n4. **Final Notice** (60 days overdue)\n   - Subject line (2 options)\n   - Tone: Serious, formal\n   - Include: Account status, service impact (pause/suspension), deadline for response, escalation path\n   - Under 200 words\n\n5. **Collections Transfer Notice** (90+ days overdue)\n   - Subject line (1 option)\n   - Tone: Formal, factual\n   - Include: Final opportunity before external collections, total with interest/fees, specific deadline\n   - Under 150 words\n\nFor each email:\n- Provide the full email text\n- Note the best day/time to send\n- Suggest a parallel action (phone call, LinkedIn message, manager-to-manager outreach)\n- Include a payment link placeholder\n\nGuidelines:\n- Comply with Fair Debt Collection Practices Act principles\n- Never threaten action you're not prepared to take\n- Always provide an easy off-ramp (payment link, phone number, payment plan)\n- Preserve the relationship — today's late payer might be tomorrow's biggest client",
        category: "finance",
        tags: ["collections", "accounts receivable", "overdue payments"],
        useCase:
          "Recover overdue payments systematically with a professional escalation sequence that balances firmness with relationship preservation.",
        exampleInput:
          "INVOICE: #3847, AMOUNT: $8,750, DAYS OVERDUE: 35, CLIENT: Vertex Marketing Agency, HISTORY: Usually pays on time, this is first late payment, RESPONSE: Acknowledged first email but hasn't paid, FLEXIBILITY: Can offer 2-installment plan",
        exampleOutput:
          "Email 3 (Escalation Warning): Subject: Action Needed — Invoice #3847 Now 35 Days Past Due. Dear [Name], I appreciate your response earlier this month regarding Invoice #3847 for $8,750. As we haven't yet received payment, I want to discuss options to resolve this promptly...",
        targetKeywords: [
          "collection email prompt",
          "AI accounts receivable template",
          "overdue invoice email generator",
        ],
        relatedTemplates: ["invoice-dispute-response-drafter", "client-financial-review-summary"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
    ],
  },

  // ── Healthcare ───────────────────────────────────────────────────────────
  {
    slug: "healthcare",
    title: "Healthcare Prompts",
    description:
      "AI prompt templates for patient education, clinical notes, health communications, wellness programs, and medical practice management. Works with ChatGPT, Claude, or Gemini.",
    longDescription:
      "Support healthcare workflows with prompt templates designed for patient communication, clinical documentation, wellness program design, and practice marketing. Each template provides a structured framework for creating clear, accurate health content while always flagging the need for clinical review. Paste them into any major AI assistant and customize the bracketed placeholders for your practice or organization.",
    icon: "🏥",
    keywords: [
      "healthcare prompts",
      "AI prompts for doctors",
      "medical prompts",
      "ChatGPT for healthcare",
    ],
    relatedCategories: ["education", "writing", "customer-support"],
    templates: [
      {
        slug: "patient-education-material-writer",
        title: "Patient Education Material Writer",
        description:
          "Create clear, health-literate patient education materials on any condition, procedure, or wellness topic.",
        prompt:
          "You are a health communications specialist who creates patient education materials at appropriate literacy levels. Write patient education content for the following topic.\n\n**Content Details:**\n- Topic: [CONDITION / PROCEDURE / MEDICATION / WELLNESS TOPIC]\n- Material type: [HANDOUT / BROCHURE / POST-VISIT SUMMARY / WEBSITE CONTENT / VIDEO SCRIPT]\n- Target audience: [GENERAL PUBLIC / NEWLY DIAGNOSED / PRE-OPERATIVE / CAREGIVERS / PEDIATRIC PARENTS / ELDERLY]\n- Literacy level: [4TH-6TH GRADE / 8TH GRADE / COLLEGE-LEVEL]\n- Language considerations: [ANY CULTURAL OR LANGUAGE NEEDS]\n\n**Clinical Context:**\n- Practice/Organization: [NAME]\n- Specialty: [DEPARTMENT OR SPECIALTY]\n- Key messages the clinician wants to convey: [LIST 3-5 KEY POINTS]\n- Common patient questions about this topic: [LIST IF KNOWN]\n- Common misconceptions: [LIST IF KNOWN]\n\n**Format Requirements:**\n- Length: [1 PAGE / 2 PAGES / 5 MINUTES READ]\n- Include visuals: [YES — suggest where diagrams, icons, or images would help]\n- Available in print: [YES/NO — affects formatting]\n\nWrite the patient education material with:\n\n1. **Title** — Clear, descriptive, avoids medical jargon (3 options)\n2. **Key Takeaway Box** — The 3 most important things to remember (top of page, high visibility)\n3. **What Is It?** — Plain-language explanation of the condition, procedure, or topic. Use analogies where helpful.\n4. **Why It Matters** — Why the patient should care, framed around their daily life and goals\n5. **What to Expect** — Step-by-step walkthrough (for procedures) or progression information (for conditions)\n6. **What You Can Do** — Actionable self-management steps, lifestyle modifications, or preparation instructions\n7. **Warning Signs** — When to call the doctor vs. when to go to the ER — be specific with symptoms\n8. **Frequently Asked Questions** — 5-7 Q&As addressing the most common patient concerns\n9. **Resources** — Where to learn more (suggest types of reputable sources, not specific URLs)\n10. **Contact Information** — Placeholder for practice phone, patient portal, after-hours line\n\nGuidelines:\n- Use short sentences (under 15 words when possible)\n- Define every medical term the first time it appears\n- Use 'you' and 'your' to make it personal\n- Avoid scare tactics — inform without alarming\n- Use bullet points and numbered lists for scannability\n- Suggest where to place visual aids (diagrams, icons, photos)\n- Include a teach-back question at the end to verify understanding\n\n[DISCLAIMER: This material is for educational drafting purposes. All patient education content must be reviewed and approved by a licensed healthcare provider before distribution.]",
        category: "healthcare",
        tags: ["patient education", "health literacy", "patient communication"],
        useCase:
          "Create patient-facing educational materials for handouts, websites, or post-visit summaries that patients can actually understand and use.",
        exampleInput:
          "TOPIC: Type 2 Diabetes self-management, AUDIENCE: Newly diagnosed adults, LITERACY: 6th grade, KEY MESSAGES: blood sugar monitoring, dietary changes, exercise importance, medication adherence, when to seek help",
        exampleOutput:
          "Title: 'Living Well with Type 2 Diabetes — Your Guide to Daily Management'. Key Takeaways: 1. Check your blood sugar as often as your doctor recommends. 2. Small changes to what you eat can make a big difference. 3. Moving your body for 30 minutes a day helps control blood sugar...",
        targetKeywords: [
          "patient education prompt",
          "AI health education generator",
          "patient handout template",
        ],
        relatedTemplates: ["medication-information-sheet-generator", "patient-follow-up-message"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "clinical-note-summarizer",
        title: "Clinical Note Summarizer",
        description:
          "Summarize lengthy clinical notes into concise, structured summaries for handoffs, referrals, or patient portal messages.",
        prompt:
          "You are a clinical documentation specialist. Summarize the following clinical notes into a structured, concise format.\n\n**Summary Purpose:**\n- Use case: [CARE TEAM HANDOFF / REFERRAL LETTER / PATIENT PORTAL SUMMARY / INSURANCE PRE-AUTH / CHART REVIEW]\n- Audience: [ANOTHER PHYSICIAN / SPECIALIST / NURSE / PATIENT / INSURANCE REVIEWER]\n- Urgency: [ROUTINE / URGENT / EMERGENT]\n\n**Clinical Notes to Summarize:**\n[PASTE CLINICAL NOTES HERE — can include progress notes, H&P, discharge summary, consult notes, or lab/imaging results]\n\n**Additional Context:**\n- Patient demographics: [AGE, SEX, RELEVANT HISTORY]\n- Primary concern: [CHIEF COMPLAINT OR REASON FOR ENCOUNTER]\n- Key decisions pending: [ANY OUTSTANDING DECISIONS]\n\nCreate the summary in the following format:\n\n1. **One-Line Summary** — The most critical information in a single sentence\n2. **Patient Overview** — Demographics, relevant PMH, allergies, current medications (only the relevant ones)\n3. **Encounter Summary:**\n   - Chief complaint / Reason for visit\n   - Key findings (exam, labs, imaging) — highlight abnormals\n   - Assessment with active problem list (numbered)\n   - Plan for each active problem\n4. **Critical Values/Alerts** — Any abnormal results that need immediate attention, flagged prominently\n5. **Action Items** — What needs to happen next, with responsible party and timeline\n6. **Follow-Up** — Scheduled appointments, pending results, recommended follow-up timeframe\n7. **Patient Instructions** (if audience is patient) — Simplified version of the plan in plain language\n\nFormatting for different audiences:\n- **For physicians**: Use standard medical abbreviations, focus on clinical reasoning\n- **For patients**: Use plain language (6th grade reading level), avoid abbreviations, focus on what they need to do\n- **For insurance**: Focus on medical necessity, include relevant diagnosis codes, quantify functional impact\n\nGuidelines:\n- Preserve clinical accuracy — never infer information not in the original notes\n- Highlight discrepancies or gaps in the notes\n- Flag any safety concerns (drug interactions, allergy alerts, abnormal vitals)\n- Keep the summary to 25-30% of the original length\n- Use standardized formatting for easy scanning\n\n[DISCLAIMER: Clinical summaries must be reviewed by the treating provider before use in patient care decisions. This tool is for documentation assistance only.]",
        category: "healthcare",
        tags: ["clinical notes", "medical documentation", "care coordination"],
        useCase:
          "Quickly summarize complex clinical notes for handoffs, referrals, or patient-friendly communication without losing critical details.",
        exampleInput:
          "PURPOSE: Referral to cardiology, AUDIENCE: Cardiologist, NOTES: 3-page primary care progress note for 58-year-old male with new onset chest pain, elevated troponin, normal ECG, family history of MI, currently on metformin and lisinopril",
        exampleOutput:
          "One-Line: 58M with new-onset exertional chest pain, elevated troponin (0.08 ng/mL), normal ECG, strong family history of premature CAD — needs urgent cardiology evaluation. Assessment: 1. Chest pain — concerning for ACS given troponin elevation and risk factors. Plan: Urgent cardiology referral, hold metformin pending stress test...",
        targetKeywords: [
          "clinical note summary prompt",
          "AI medical documentation template",
          "healthcare note summarizer",
        ],
        relatedTemplates: ["patient-follow-up-message", "medical-literature-summary"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "differential-diagnosis-brainstorm",
        title: "Differential Diagnosis Brainstorm",
        description:
          "Generate a structured differential diagnosis list with reasoning, likelihood assessment, and recommended workup for clinical presentations.",
        prompt:
          "You are a clinical reasoning assistant helping a healthcare provider think through a differential diagnosis. Generate a structured differential for the following presentation.\n\n**Patient Presentation:**\n- Age/Sex: [AGE AND SEX]\n- Chief complaint: [MAIN SYMPTOM(S)]\n- Duration: [HOW LONG]\n- Onset: [SUDDEN / GRADUAL]\n- Associated symptoms: [LIST]\n- Relevant past medical history: [PMH]\n- Medications: [CURRENT MEDS]\n- Social history: [RELEVANT — smoking, alcohol, occupation, travel, exposures]\n- Family history: [RELEVANT CONDITIONS]\n- Vital signs: [IF AVAILABLE]\n- Exam findings: [KEY PHYSICAL EXAM FINDINGS]\n- Initial labs/imaging: [IF AVAILABLE]\n\n**Clinical Setting:** [ED / PRIMARY CARE / SPECIALTY CLINIC / INPATIENT / TELEMEDICINE]\n**Provider's Initial Suspicion:** [WHAT THE PROVIDER IS THINKING, if any]\n\nGenerate the differential diagnosis with:\n\n1. **Must-Not-Miss Diagnoses** (life-threatening or time-sensitive)\n   - For each: Diagnosis name, why it's on the list (which features match), key distinguishing features, immediate workup needed\n   - Rank by urgency of evaluation\n\n2. **Most Likely Diagnoses** (highest probability given the presentation)\n   - For each: Diagnosis name, supporting evidence from the presentation, evidence against, pre-test probability estimate (high/moderate/low), recommended workup\n   - Rank by likelihood\n\n3. **Less Likely But Worth Considering**\n   - For each: Diagnosis name, what would make it more likely, when to revisit this diagnosis\n\n4. **Recommended Workup Strategy:**\n   - Tier 1 (order now): Tests that rule in/out the most dangerous or most likely diagnoses\n   - Tier 2 (if Tier 1 inconclusive): Next-step investigations\n   - Tier 3 (specialist referral): When to involve subspecialty\n\n5. **Clinical Decision Rules** — Any validated scoring tools or algorithms that apply (e.g., Wells criteria, HEART score, Ottawa ankle rules)\n\n6. **Red Flags** — Specific symptoms or findings that would change the urgency or direction\n\n7. **Cognitive Bias Check** — 2-3 cognitive biases to be aware of with this presentation (anchoring, premature closure, availability bias) and how to guard against them\n\n[CRITICAL DISCLAIMER: This is a clinical reasoning aid for educational and brainstorming purposes only. It does not constitute medical advice or replace clinical judgment. All diagnostic and treatment decisions must be made by a licensed healthcare provider based on direct patient evaluation.]",
        category: "healthcare",
        tags: ["differential diagnosis", "clinical reasoning", "medical decision-making"],
        useCase:
          "Brainstorm a thorough differential diagnosis when evaluating a complex or ambiguous clinical presentation, as a clinical reasoning exercise.",
        exampleInput:
          "AGE/SEX: 34F, CHIEF COMPLAINT: 2 weeks of progressive fatigue and joint pain, ASSOCIATED: low-grade fever, facial rash across cheeks, hair thinning, PMH: Raynaud's phenomenon, LABS: Elevated ESR, low WBC, SETTING: Primary care",
        exampleOutput:
          "Must-Not-Miss: 1. Systemic Lupus Erythematosus (SLE) — Malar rash, joint pain, fatigue, Raynaud's, elevated ESR, and cytopenias create a high-probability presentation. Meets 4+ SLICC criteria. Immediate workup: ANA, anti-dsDNA, complement levels (C3/C4), CBC with diff, urinalysis...",
        targetKeywords: [
          "differential diagnosis prompt",
          "AI clinical reasoning template",
          "medical differential generator",
        ],
        relatedTemplates: ["clinical-note-summarizer", "medical-literature-summary"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "patient-follow-up-message",
        title: "Patient Follow-Up Message",
        description:
          "Write warm, clear patient follow-up messages for post-visit check-ins, lab results, or care plan adherence.",
        prompt:
          "You are a patient communication specialist who writes messages that are warm, clear, and actionable. Draft a patient follow-up message for the following scenario.\n\n**Message Context:**\n- Message type: [POST-VISIT CHECK-IN / LAB RESULTS NOTIFICATION / MEDICATION CHECK / PROCEDURE FOLLOW-UP / CHRONIC CARE CHECK-IN / MISSED APPOINTMENT]\n- Delivery method: [PATIENT PORTAL / SECURE MESSAGE / EMAIL / TEXT / LETTER]\n- Practice name: [PRACTICE NAME]\n- Provider name: [PROVIDER NAME]\n\n**Patient Details:**\n- Patient name: [NAME]\n- Recent visit/procedure: [WHAT HAPPENED AND WHEN]\n- Relevant condition: [CONDITION BEING MANAGED]\n- Current treatment plan: [MEDICATIONS, LIFESTYLE CHANGES, ETC.]\n\n**Message Content:**\n- Primary purpose: [WHAT YOU NEED TO COMMUNICATE]\n- Results to share (if applicable): [LAB VALUES — normal, abnormal, or pending]\n- Action needed from patient: [WHAT THEY SHOULD DO, e.g., schedule follow-up, continue medications, come in for additional testing]\n- Urgency: [ROUTINE / NEEDS ATTENTION / URGENT]\n\n**Tone Considerations:**\n- Patient relationship: [NEW / ESTABLISHED / LONG-TERM]\n- Emotional context: [REASSURING / NEUTRAL / SENSITIVE — e.g., delivering concerning results]\n- Patient communication preference: [BRIEF AND DIRECT / DETAILED / WARM AND SUPPORTIVE]\n\nDraft the message with:\n\n1. **Subject Line** (for portal/email) — Clear, non-alarming, specific (3 options)\n2. **Greeting** — Warm, personalized\n3. **Purpose Statement** — Why you're reaching out (first sentence, no burying the lead)\n4. **Key Information** — The main content:\n   - For results: What the results mean in plain language, whether they're normal or need attention\n   - For check-ins: Specific questions about their recovery or treatment adherence\n   - For follow-up: Clear instructions on next steps\n5. **What to Do Next** — Numbered action items (make it impossible to miss)\n6. **Reassurance / Context** — Address likely concerns without minimizing legitimate issues\n7. **Contact Information** — How to reach the office with questions, after-hours information if urgent\n8. **Closing** — Warm, supportive, emphasizes partnership in their care\n\nProvide 2 versions:\n- **Version A: Standard** — For patient portal or email\n- **Version B: Brief** — For text message or quick communication (under 160 characters for the core message)\n\nGuidelines:\n- Use 6th-8th grade reading level\n- Never use medical abbreviations\n- If sharing concerning results, be honest but compassionate — don't catastrophize or over-reassure\n- Include specific numbers for results with clear context ('Your cholesterol is 242, which is above the ideal range of under 200')\n- Comply with HIPAA — no protected information in unsecured channels\n\n[DISCLAIMER: All patient communications should be reviewed and approved by the treating provider.]",
        category: "healthcare",
        tags: ["patient communication", "follow-up", "care coordination"],
        useCase:
          "Send thoughtful patient follow-up messages that improve engagement, adherence, and patient satisfaction scores.",
        exampleInput:
          "TYPE: Lab results notification, PATIENT: Robert Martinez, CONDITION: Pre-diabetes, RESULTS: HbA1c improved from 6.3% to 5.9% (now normal range), CURRENT PLAN: Metformin 500mg, diet modifications, 30min daily walking, TONE: Warm and encouraging",
        exampleOutput:
          "Subject: Great News About Your Lab Results, Robert. Hi Robert, I'm reaching out with your recent lab results — and it's good news. Your HbA1c has improved from 6.3% to 5.9%, which brings you back into the normal range. The changes you've been making to your diet and exercise are clearly working...",
        targetKeywords: [
          "patient follow-up message prompt",
          "AI patient communication template",
          "healthcare messaging generator",
        ],
        relatedTemplates: ["patient-education-material-writer", "clinical-note-summarizer"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "health-insurance-appeal-letter",
        title: "Health Insurance Appeal Letter",
        description:
          "Draft a persuasive insurance appeal letter with medical necessity arguments, supporting evidence, and regulatory references.",
        prompt:
          "You are a healthcare billing advocate who specializes in insurance appeals. Draft a compelling appeal letter for the following denial.\n\n**Denial Details:**\n- Insurance company: [INSURER NAME]\n- Claim/Reference number: [NUMBER]\n- Patient name: [NAME]\n- Date of service: [DATE]\n- Procedure/Service denied: [CPT CODE AND DESCRIPTION]\n- Denial reason: [SPECIFIC REASON, e.g., not medically necessary, experimental, out of network, prior auth not obtained, coding error]\n- Denial date: [DATE]\n- Appeal deadline: [DATE]\n- Appeal level: [FIRST LEVEL / SECOND LEVEL / EXTERNAL REVIEW]\n\n**Clinical Details:**\n- Diagnosis: [ICD-10 CODE AND DESCRIPTION]\n- Clinical indication: [WHY THE PROCEDURE/SERVICE IS NEEDED]\n- Previous treatments tried: [WHAT WAS ATTEMPTED FIRST]\n- Why alternatives are insufficient: [WHY THIS SPECIFIC SERVICE IS NECESSARY]\n- Expected outcome without treatment: [PROGNOSIS IF DENIED]\n- Supporting clinical evidence: [GUIDELINES, STUDIES, OR STANDARDS OF CARE]\n\n**Provider Information:**\n- Ordering provider: [NAME AND CREDENTIALS]\n- Practice: [PRACTICE NAME]\n- Specialty: [SPECIALTY]\n\nDraft the appeal letter with:\n\n1. **Header** — Formal letter format with all reference numbers, patient identifiers, and dates\n2. **Opening** — Clear statement that this is a formal appeal, reference the specific denial, and state the requested action\n3. **Patient History** — Concise clinical narrative establishing why this patient needs this service\n4. **Medical Necessity Argument:**\n   - How this service meets the insurer's own medical necessity criteria (reference their policy if known)\n   - Clinical guidelines supporting the service (cite specific guidelines, e.g., ACC/AHA, NCCN, ADA)\n   - Evidence-based literature supporting this approach\n   - Step therapy or conservative treatment that has already failed\n5. **Rebuttal of Denial Reason** — Directly address the specific reason for denial with evidence\n6. **Impact Statement** — What happens to the patient if the appeal is denied (functional impact, quality of life, progression of disease)\n7. **Regulatory References** — Applicable federal or state laws (ERISA, ACA essential health benefits, state parity laws, external review rights)\n8. **Requested Action** — Specific request: overturn denial and authorize payment/service\n9. **Supporting Documentation List** — Itemized list of attached evidence\n10. **Closing** — Professional close with contact information and request for timely response\n\nGuidelines:\n- Be assertive but professional — you're advocating, not attacking\n- Use clinical language appropriate for a medical director reviewer\n- Reference the insurer's own coverage policies when possible\n- Include specific dates, dosages, and clinical findings\n- Note the patient's right to external review if this appeal fails\n\n[DISCLAIMER: This is a drafting framework. Have the ordering provider review and sign before submission. Complex appeals may require legal counsel.]",
        category: "healthcare",
        tags: ["insurance appeal", "medical billing", "prior authorization"],
        useCase:
          "Draft insurance appeal letters when a medically necessary service is denied, to help patients access the care they need.",
        exampleInput:
          "INSURER: BlueCross, DENIAL REASON: Not medically necessary, SERVICE: MRI of lumbar spine, DIAGNOSIS: Lumbar radiculopathy with progressive weakness, PREVIOUS TREATMENTS: 8 weeks physical therapy, NSAIDs, oral steroids — all failed, EVIDENCE: ACR Appropriateness Criteria rates MRI as 'usually appropriate' for radiculopathy with red flags",
        exampleOutput:
          "RE: Formal Appeal — Claim #BC-2026-45821 — Denial of Lumbar MRI. Dear Medical Director, I am writing to formally appeal the denial of an MRI of the lumbar spine for [Patient Name], issued on [Date] under claim #BC-2026-45821. The stated reason for denial — 'not medically necessary' — is inconsistent with the clinical evidence and established practice guidelines...",
        targetKeywords: [
          "insurance appeal letter prompt",
          "AI medical appeal template",
          "healthcare denial appeal generator",
        ],
        relatedTemplates: ["patient-education-material-writer", "clinical-note-summarizer"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "medical-literature-summary",
        title: "Medical Literature Summary",
        description:
          "Summarize medical research articles into structured, actionable summaries for clinical application or patient education.",
        prompt:
          "You are a medical research analyst who makes clinical literature accessible and actionable. Summarize the following medical article or study.\n\n**Article Details:**\n- Title: [ARTICLE TITLE]\n- Authors: [FIRST AUTHOR et al.]\n- Journal: [JOURNAL NAME]\n- Year: [PUBLICATION YEAR]\n- Study type: [RCT / META-ANALYSIS / COHORT / CASE-CONTROL / SYSTEMATIC REVIEW / CASE REPORT / GUIDELINE]\n\n**Article Content:**\n[PASTE THE ABSTRACT OR KEY SECTIONS OF THE ARTICLE]\n\n**Summary Purpose:**\n- Audience: [CLINICIANS / RESEARCHERS / PATIENTS / HEALTH ADMINISTRATORS / STUDENTS]\n- Use case: [CLINICAL DECISION-MAKING / JOURNAL CLUB / PATIENT COUNSELING / GRANT WRITING / TEACHING]\n- Specific question to answer: [WHAT DO YOU WANT TO KNOW FROM THIS ARTICLE]\n\nCreate the summary with:\n\n1. **One-Sentence Takeaway** — The single most important finding, in plain language\n2. **Study Overview:**\n   - What question did they ask?\n   - How did they study it? (design, population, intervention, comparator)\n   - What did they find? (primary outcome with numbers)\n   - What does it mean for practice?\n\n3. **Detailed Summary:**\n   - Background and rationale (why this study was needed)\n   - Methods (population, sample size, intervention, primary and secondary endpoints, follow-up duration)\n   - Key results (primary outcome with effect size, confidence intervals, p-values; secondary outcomes; subgroup analyses)\n   - Authors' conclusions\n\n4. **Critical Appraisal:**\n   - Strengths of the study\n   - Limitations (methodological issues, bias risk, generalizability concerns)\n   - Internal validity assessment\n   - External validity — does this apply to your patient population?\n\n5. **Clinical Application:**\n   - How does this change (or not change) practice?\n   - Number needed to treat/harm (if applicable)\n   - Which patients benefit most from these findings?\n   - How to communicate these findings to patients\n\n6. **Context:**\n   - How does this fit with existing evidence?\n   - Does it confirm or challenge current guidelines?\n   - What questions remain unanswered?\n\n7. **Bottom Line** — 3-bullet summary suitable for a quick clinical reference\n\nAdjust technical depth for the specified audience:\n- Clinicians: Include NNT, effect sizes, applicability assessment\n- Patients: Focus on what it means for them, translated to everyday language\n- Students: Include teaching points about methodology\n\n[DISCLAIMER: Literature summaries are for educational purposes. Clinical decisions should integrate multiple sources of evidence and individual patient factors.]",
        category: "healthcare",
        tags: ["medical literature", "research summary", "evidence-based medicine"],
        useCase:
          "Quickly summarize research articles for journal club presentations, clinical decision support, or staying current with medical literature.",
        exampleInput:
          "TITLE: Effect of Semaglutide on Cardiovascular Events in Patients with Obesity, JOURNAL: NEJM, TYPE: RCT, AUDIENCE: Primary care clinicians, PURPOSE: Decide whether to discuss this medication with obese patients with cardiovascular risk",
        exampleOutput:
          "One-Sentence Takeaway: Semaglutide significantly reduced major cardiovascular events by 20% in adults with obesity and established cardiovascular disease, independent of weight loss. Clinical Application: Consider discussing semaglutide with obese patients (BMI 27+) who have established CVD or multiple risk factors...",
        targetKeywords: [
          "medical literature summary prompt",
          "AI research article summarizer",
          "journal club template",
        ],
        relatedTemplates: ["differential-diagnosis-brainstorm", "clinical-note-summarizer"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "wellness-program-designer",
        title: "Wellness Program Designer",
        description:
          "Design a comprehensive workplace or community wellness program with goals, activities, metrics, and implementation timeline.",
        prompt:
          "You are a wellness program designer with expertise in evidence-based health promotion. Design a comprehensive wellness program for the following organization.\n\n**Organization Details:**\n- Organization type: [EMPLOYER / HEALTH SYSTEM / COMMUNITY ORG / SCHOOL / SENIOR CENTER]\n- Name: [ORGANIZATION NAME]\n- Population: [NUMBER AND DEMOGRAPHICS OF TARGET PARTICIPANTS]\n- Industry/Setting: [INDUSTRY]\n- Current wellness offerings: [EXISTING PROGRAMS]\n- Known health challenges: [e.g., high rates of obesity, stress, sedentary work, chronic disease]\n\n**Program Goals:**\n- Primary objective: [e.g., reduce healthcare costs, improve employee wellbeing, manage chronic disease, increase physical activity]\n- Secondary objectives: [LIST]\n- Budget: [ANNUAL BUDGET]\n- Timeline: [PROGRAM DURATION]\n- Success metrics already tracked: [ANY EXISTING DATA]\n\n**Constraints:**\n- [CONSTRAINT 1, e.g., remote workforce, limited facilities]\n- [CONSTRAINT 2, e.g., diverse age range, cultural considerations]\n- [CONSTRAINT 3, e.g., union requirements, privacy concerns]\n\nDesign the wellness program with:\n\n1. **Executive Summary** — Program vision, goals, and expected ROI in 3-4 sentences\n2. **Needs Assessment** — Framework for assessing the population's specific needs (health risk assessment, interest survey, claims data analysis)\n3. **Program Pillars** — 4-5 core areas (e.g., Physical Activity, Nutrition, Mental Health, Preventive Care, Financial Wellness) with:\n   - Evidence base for why this pillar matters\n   - 3-4 specific programs or activities under each pillar\n   - Participation format (individual, group, digital, in-person)\n   - Estimated participation rate\n\n4. **Program Calendar** — Month-by-month plan for the first year with:\n   - Monthly theme\n   - Key activities and events\n   - Communication touchpoints\n   - Challenges or campaigns\n\n5. **Engagement Strategy:**\n   - Incentive structure (points, rewards, premium discounts)\n   - Communication plan (launch, ongoing, re-engagement)\n   - Champion/Ambassador program design\n   - Gamification elements\n   - Addressing barriers to participation\n\n6. **Digital Platform Requirements** — Features needed in a wellness platform (if applicable)\n\n7. **Measurement Framework:**\n   - Process metrics (participation, engagement, satisfaction)\n   - Outcome metrics (biometric improvements, absenteeism, claims cost)\n   - ROI calculation methodology\n   - Evaluation timeline (30/60/90 day and annual)\n\n8. **Budget Allocation** — Breakdown by category with estimated costs\n\n9. **Implementation Timeline** — Phased rollout plan with key milestones\n\n10. **Risk Mitigation** — Potential program risks and how to address them (low participation, privacy concerns, equity issues)\n\nEnsure the program is inclusive, evidence-based, and respects participant autonomy (voluntary participation, no penalization for non-participation).",
        category: "healthcare",
        tags: ["wellness program", "health promotion", "workplace wellness"],
        useCase:
          "Design or revamp an organizational wellness program that is evidence-based, engaging, and measurable.",
        exampleInput:
          "ORGANIZATION: TechCo (500 remote employees), CHALLENGES: Sedentary work, burnout, poor sleep reported in surveys, BUDGET: $75K annual, GOALS: Reduce burnout scores by 20%, increase physical activity participation to 40%",
        exampleOutput:
          "Executive Summary: TechCo Thrive is a 12-month, digitally-delivered wellness program targeting burnout reduction and physical activity among 500 remote employees, with an estimated 3:1 ROI through reduced absenteeism and turnover. Pillar 1 — Movement & Energy: Weekly virtual fitness classes, step challenges with team leaderboards, ergonomic assessment program...",
        targetKeywords: [
          "wellness program prompt",
          "AI wellness program designer",
          "workplace wellness template",
        ],
        relatedTemplates: ["patient-education-material-writer", "practice-marketing-content-writer"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "symptom-triage-flowchart-builder",
        title: "Symptom Triage Flowchart Builder",
        description:
          "Build a structured symptom triage decision flowchart for nurse lines, patient portals, or clinical staff guidance.",
        prompt:
          "You are a clinical triage specialist. Build a structured triage decision flowchart for the following symptom or presentation.\n\n**Triage Context:**\n- Symptom/Presentation: [SYMPTOM, e.g., chest pain, headache, abdominal pain, shortness of breath, fever in children]\n- Setting: [NURSE TRIAGE LINE / PATIENT PORTAL SELF-TRIAGE / URGENT CARE INTAKE / ED TRIAGE / SCHOOL NURSE]\n- Population: [ADULTS / PEDIATRIC / GERIATRIC / PREGNANT / GENERAL]\n- Triage system: [e.g., Emergency Severity Index (ESI), Schmitt-Thompson protocols, custom]\n\n**Disposition Options:**\n- [CALL 911 / GO TO ED IMMEDIATELY]\n- [SAME-DAY URGENT CARE / ED WITHIN HOURS]\n- [SCHEDULE APPOINTMENT WITHIN 24-48 HOURS]\n- [HOME CARE WITH MONITORING]\n- [ROUTINE APPOINTMENT / SELF-CARE]\n\n**Organizational Context:**\n- Organization: [NAME]\n- Available resources: [WHAT SERVICES CAN YOU DIRECT PATIENTS TO]\n- After-hours coverage: [AVAILABLE / LIMITED / NONE]\n\nBuild the triage flowchart with:\n\n1. **Initial Assessment Questions** — The first 3-5 questions to ask, in order, to identify emergent situations\n   - For each question: exact wording, possible answers, and which path each answer leads to\n\n2. **Red Flag Screen** (highest priority) — Life-threatening signs that route immediately to 911/ED\n   - List specific red flags for this symptom\n   - Exact language for advising the patient to call 911\n\n3. **Urgent Pathway** — Concerning but not immediately life-threatening\n   - Decision points that distinguish urgent from routine\n   - Time-sensitive actions needed\n   - Where to direct the patient\n\n4. **Semi-Urgent Pathway** — Needs medical evaluation within 24-48 hours\n   - Symptoms and duration thresholds\n   - Interim self-care instructions\n   - When to escalate if symptoms worsen\n\n5. **Home Care Pathway** — Safe for self-management\n   - Specific self-care instructions\n   - When to call back (specific symptoms or time triggers)\n   - Over-the-counter recommendations (with appropriate disclaimers)\n\n6. **Special Populations** — Modifications for:\n   - Children (age-specific thresholds)\n   - Elderly (atypical presentations)\n   - Pregnant patients\n   - Immunocompromised patients\n\n7. **Documentation Template** — What to document for each triage call (chief complaint, questions asked, disposition, time)\n\n8. **Flowchart Visualization** — A text-based decision tree showing the logic flow from initial question to each disposition\n\nGuidelines:\n- Always err on the side of caution — when in doubt, triage to a higher acuity level\n- Use clear, unambiguous language that non-clinical staff can follow\n- Include a 'gut feeling' escalation — if the caller/patient sounds distressed beyond what the algorithm suggests, escalate\n- Note where clinical judgment should override the flowchart\n\n[CRITICAL DISCLAIMER: Triage protocols must be reviewed and approved by a licensed physician and comply with organizational clinical standards. This is a framework for protocol development, not a clinical tool.]",
        category: "healthcare",
        tags: ["triage", "clinical protocols", "patient safety"],
        useCase:
          "Develop standardized triage protocols for nurse lines, patient portals, or clinical intake to ensure consistent, safe patient routing.",
        exampleInput:
          "SYMPTOM: Chest pain, SETTING: Nurse triage line, POPULATION: Adults (18+), TRIAGE SYSTEM: Schmitt-Thompson adapted, ORGANIZATION: Community health system with ED, urgent care, and primary care",
        exampleOutput:
          "Initial Question 1: 'Are you having chest pain right now?' If YES and severe, proceed to Red Flag Screen. Red Flag Screen: Ask about crushing/pressure pain, radiating to arm/jaw, associated shortness of breath, diaphoresis, or history of cardiac disease. If ANY red flags present: 'Please hang up and call 911 immediately. Do not drive yourself.'...",
        targetKeywords: [
          "triage flowchart prompt",
          "AI clinical triage template",
          "symptom triage generator",
        ],
        relatedTemplates: ["differential-diagnosis-brainstorm", "patient-education-material-writer"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "medication-information-sheet-generator",
        title: "Medication Information Sheet Generator",
        description:
          "Create patient-friendly medication information sheets covering usage, side effects, interactions, and safety precautions.",
        prompt:
          "You are a clinical pharmacist creating patient medication information sheets. Generate a comprehensive, patient-friendly medication information sheet for the following medication.\n\n**Medication Details:**\n- Medication name: [GENERIC NAME (BRAND NAME)]\n- Drug class: [CLASS]\n- Prescribed for: [INDICATION — why this patient is taking it]\n- Dosage: [PRESCRIBED DOSE AND FREQUENCY]\n- Route: [ORAL / INJECTION / TOPICAL / INHALED / etc.]\n- Duration: [SHORT-TERM / LONG-TERM / AS NEEDED]\n\n**Patient Context:**\n- Patient age group: [PEDIATRIC / ADULT / GERIATRIC]\n- Health literacy level: [LOW / MODERATE / HIGH]\n- Other medications: [LIST — for interaction checking]\n- Relevant conditions: [e.g., kidney disease, pregnancy, allergies]\n- Language considerations: [ANY SPECIAL NEEDS]\n\n**Practice Details:**\n- Practice name: [NAME]\n- Pharmacy: [PREFERRED PHARMACY]\n- Prescribing provider: [PROVIDER NAME]\n\nCreate the medication information sheet with:\n\n1. **Header** — Medication name (both generic and brand), what it looks like (color, shape, markings), drug class in plain language\n\n2. **Why You're Taking This** — Plain-language explanation of what this medication does and how it helps with their specific condition (not a generic drug class description)\n\n3. **How to Take It:**\n   - Exact dosing instructions with timing\n   - With food or without? With water?\n   - What to do if you miss a dose\n   - What to do if you take too much\n   - Storage instructions\n\n4. **What to Expect:**\n   - When it starts working (onset)\n   - How to know it's working\n   - Common side effects (likelihood: very common, common, uncommon) with plain-language descriptions\n   - Which side effects are normal and will pass vs. which need medical attention\n\n5. **Important Warnings:**\n   - Serious side effects requiring immediate medical attention (use clear, specific symptoms)\n   - Activities to avoid (driving, alcohol, sun exposure, etc.)\n   - Food and drug interactions relevant to this patient's medication list\n   - Pregnancy/breastfeeding considerations (if applicable)\n\n6. **Practical Tips:**\n   - How to remember to take it (timing strategies)\n   - How to manage common side effects at home\n   - Can it be crushed, split, or mixed with food?\n   - Refill information and when to request refills\n\n7. **When to Call Your Doctor:**\n   - Specific symptoms that warrant a call\n   - When to go to the ER\n   - Number to call\n\n8. **Quick Reference Card** — A wallet-sized summary: medication name, dose, frequency, 1 critical warning, emergency number\n\nGuidelines:\n- Write at the specified health literacy level\n- Use large font-friendly formatting (short sentences, lots of white space)\n- Never use medical abbreviations (write 'twice a day' not 'BID')\n- Use 'your doctor' not specific medical terms for the provider role\n- Include icons/emoji placeholders for visual cues\n\n[DISCLAIMER: This information sheet must be reviewed by the prescribing provider or a licensed pharmacist before distribution. It does not replace professional medical advice.]",
        category: "healthcare",
        tags: ["medication information", "pharmacy", "patient safety"],
        useCase:
          "Create clear medication information sheets for patients starting new medications, improving adherence and reducing adverse events.",
        exampleInput:
          "MEDICATION: Metformin (Glucophage) 500mg, INDICATION: Type 2 diabetes, DOSAGE: 500mg twice daily with meals, PATIENT: 55-year-old adult, LITERACY: Moderate, OTHER MEDS: Lisinopril 10mg, Atorvastatin 20mg",
        exampleOutput:
          "METFORMIN (Glucophage) 500mg. What it looks like: White, round tablet. Why You're Taking This: Metformin helps your body use insulin more effectively to lower your blood sugar levels. Think of it as helping your cells open the door to let sugar in, so it doesn't build up in your blood...",
        targetKeywords: [
          "medication information prompt",
          "AI medication sheet generator",
          "patient medication guide template",
        ],
        relatedTemplates: ["patient-education-material-writer", "patient-follow-up-message"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "practice-marketing-content-writer",
        title: "Practice Marketing Content Writer",
        description:
          "Create compliant, engaging marketing content for healthcare practices including website copy, social media, and patient newsletters.",
        prompt:
          "You are a healthcare marketing specialist who creates engaging content that is also compliant with medical advertising regulations. Write marketing content for the following healthcare practice.\n\n**Practice Details:**\n- Practice name: [NAME]\n- Specialty: [SPECIALTY, e.g., Family Medicine, Dermatology, Orthopedics, Dental, Mental Health]\n- Location: [CITY, STATE]\n- Unique selling points: [WHAT DIFFERENTIATES THIS PRACTICE]\n- Target patient demographics: [WHO YOU WANT TO ATTRACT]\n- Practice personality: [WARM & FAMILY-FRIENDLY / CUTTING-EDGE & MODERN / LUXURIOUS & BOUTIQUE / COMMUNITY-FOCUSED]\n\n**Content Request:**\n- Content type: [WEBSITE SERVICE PAGE / BLOG POST / SOCIAL MEDIA POSTS / EMAIL NEWSLETTER / GOOGLE BUSINESS PROFILE / PATIENT TESTIMONIAL REQUEST]\n- Topic: [SPECIFIC SERVICE, CONDITION, OR CAMPAIGN]\n- Goal: [ATTRACT NEW PATIENTS / EDUCATE EXISTING / PROMOTE NEW SERVICE / SEASONAL CAMPAIGN / REPUTATION BUILDING]\n- Keywords for SEO (if web content): [LIST]\n\n**Compliance Context:**\n- Advertising regulations to follow: [STATE MEDICAL BOARD RULES / ADA GUIDELINES / AMA GUIDELINES / HIPAA]\n- Disclaimers required: [ANY SPECIFIC DISCLAIMERS]\n- Testimonial policy: [CAN USE / CANNOT USE / WITH DISCLAIMER]\n\nCreate the marketing content:\n\n1. **Website Service Page** (if requested):\n   - SEO-optimized title and meta description\n   - Hero section with patient-centric headline (focus on outcomes, not credentials)\n   - Service description in patient-friendly language\n   - Benefits section (what the patient gains)\n   - What to expect section (reduces anxiety about visiting)\n   - Provider credentials (briefly, not ego-driven)\n   - FAQ section (4-5 questions)\n   - CTA (call to book, online scheduling link)\n\n2. **Social Media Posts** (if requested):\n   - 4 posts per platform (Instagram, Facebook, LinkedIn)\n   - Mix of: educational, humanizing (meet the team), patient-centric, promotional\n   - Carousel concepts and caption copy\n   - Hashtag strategy\n   - Content calendar suggestion for 1 month\n\n3. **Blog Post / Newsletter** (if requested):\n   - SEO-optimized title (3 options)\n   - 800-word article outline with section headers\n   - Key points to cover\n   - Patient engagement elements (quiz, self-assessment, downloadable resource)\n\n4. **Review Request Template** — Email or text to send after positive visits requesting Google/Yelp reviews\n\nGuidelines:\n- Never guarantee outcomes or use superlatives ('best doctor,' 'guaranteed results')\n- Include required disclaimers naturally\n- Focus on patient experience and outcomes, not just clinical credentials\n- HIPAA-compliant — never reference real patient cases without explicit written consent\n- Avoid fear-based marketing — educate and empower instead\n- Include accessibility considerations (alt text suggestions, plain language)\n- Local SEO optimization where applicable",
        category: "healthcare",
        tags: ["medical marketing", "healthcare content", "practice growth"],
        useCase:
          "Create compliant, patient-attracting marketing content for healthcare practice websites, social media, and email campaigns.",
        exampleInput:
          "PRACTICE: Bright Smile Dental, SPECIALTY: General & Cosmetic Dentistry, LOCATION: Portland OR, PERSONALITY: Warm and modern, CONTENT TYPE: Social media posts, TOPIC: Invisalign promotion, GOAL: Attract adults considering teeth straightening",
        exampleOutput:
          "Instagram Post 1 (Educational Carousel): Slide 1: 'Think braces are just for teenagers? Think again.' Slide 2: '60% of adults wish they had straighter teeth.' Caption: If you've been covering your smile in photos, you're not alone. At Bright Smile Dental, we've helped hundreds of Portland adults get the smile they've always wanted — without metal brackets...",
        targetKeywords: [
          "healthcare marketing prompt",
          "AI medical practice content generator",
          "healthcare social media template",
        ],
        relatedTemplates: ["patient-education-material-writer", "wellness-program-designer"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
    ],
  },

  // ── Resume & Career ───────────────────────────────────────────────────
  {
    slug: "resume-career",
    title: "Resume & Career Prompts",
    description:
      "AI prompt templates for resume writing, cover letters, interview prep, LinkedIn optimization, and career advancement. Ready to paste into ChatGPT, Claude, or Gemini.",
    longDescription:
      "Land your next role faster with proven prompt templates for every stage of the job search. From crafting achievement-driven resume bullets and tailored cover letters to preparing for behavioral interviews and negotiating salary offers, these templates turn AI into your personal career coach. Customize the bracketed placeholders with your details and paste into any major AI assistant.",
    icon: "\uD83D\uDCBC",
    keywords: [
      "resume prompts",
      "cover letter prompts",
      "interview prompts",
      "career prompts",
      "ChatGPT resume",
      "AI job search",
    ],
    relatedCategories: ["sales", "email", "writing"],
    templates: [
      {
        slug: "resume-bullet-point-generator",
        title: "Resume Bullet Point Generator",
        description:
          "Transform job duties into achievement-driven resume bullet points with measurable impact.",
        prompt:
          "You are a professional resume writer with 15 years of experience placing candidates at top companies. Transform the following job responsibilities into powerful, achievement-driven resume bullet points.\n\n**My Job Title:** [JOB TITLE]\n**Company:** [COMPANY NAME]\n**Industry:** [INDUSTRY]\n**Duration:** [START DATE] - [END DATE]\n\n**Raw responsibilities / accomplishments to transform:**\n[PASTE YOUR ROUGH NOTES, DUTIES, OR EXISTING BULLETS HERE]\n\nFor each bullet point:\n1. Start with a strong action verb (avoid \"Responsible for\", \"Helped\", \"Worked on\")\n2. Follow the XYZ formula: Accomplished [X] as measured by [Y], by doing [Z]\n3. Include specific metrics wherever possible (%, $, time saved, team size, scale)\n4. If no metrics are available, quantify scope (e.g., number of users, projects, stakeholders)\n5. Keep each bullet to 1-2 lines maximum\n\nProvide:\n- 3-5 polished bullet points per role\n- For each bullet, add a brief note explaining why it works\n- Flag any bullets where adding a specific number would make it stronger\n\nTarget role I am applying for: [TARGET ROLE] (tailor language and emphasis accordingly)\nTone: [PROFESSIONAL / EXECUTIVE / TECHNICAL]",
        category: "resume-career",
        tags: ["resume", "bullet points", "achievements", "quantified impact"],
        useCase:
          "Rewrite weak resume bullets into compelling achievement statements before applying for a new role.",
        exampleInput:
          "JOB TITLE: Marketing Manager, COMPANY: TechFlow Inc, responsibilities: managed social media accounts, ran email campaigns, oversaw a team, increased followers, TARGET ROLE: Senior Marketing Manager",
        exampleOutput:
          "Grew organic social media following by 145% across 4 platforms in 12 months, generating 2,300+ qualified leads through content strategy overhaul. Led a cross-functional team of 6 marketers and 2 designers to execute 24 email campaigns averaging 34% open rate.",
        targetKeywords: [
          "resume bullet point generator",
          "AI resume writer",
          "achievement-based resume prompts",
        ],
        relatedTemplates: ["professional-summary-generator", "cover-letter-writer"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "cover-letter-writer",
        title: "Cover Letter Writer",
        description:
          "Generate a tailored, compelling cover letter that connects your experience to a specific job posting.",
        prompt:
          "You are an expert career coach who has helped thousands of candidates land interviews at competitive companies. Write a tailored cover letter for the following opportunity.\n\n**Job Title I'm Applying For:** [JOB TITLE]\n**Company:** [COMPANY NAME]\n**Job Description (paste key requirements):**\n[PASTE JOB DESCRIPTION OR KEY REQUIREMENTS]\n\n**My Background:**\n- Current/most recent role: [YOUR CURRENT ROLE]\n- Years of experience: [YEARS]\n- Top 3 relevant accomplishments:\n  1. [ACCOMPLISHMENT 1]\n  2. [ACCOMPLISHMENT 2]\n  3. [ACCOMPLISHMENT 3]\n- Why I'm interested in this company: [REASON]\n\n**Cover Letter Requirements:**\n1. Opening paragraph: Hook the reader with a specific connection to the company or role — no generic openings\n2. Body paragraph 1: Match my strongest accomplishment directly to their top requirement with a concrete example\n3. Body paragraph 2: Demonstrate additional relevant skills and show cultural fit\n4. Closing paragraph: Express enthusiasm, restate value, and include a clear call to action\n\nRules:\n- Keep it under 350 words\n- Mirror keywords from the job description naturally\n- No cliches (\"I am writing to express my interest\", \"passionate team player\")\n- Show, don't tell — use specific examples over adjectives\n- Tone: [CONFIDENT / WARM / FORMAL]",
        category: "resume-career",
        tags: ["cover letter", "job application", "tailored letter"],
        useCase:
          "Write a customized cover letter that directly addresses a specific job posting's requirements.",
        exampleInput:
          "JOB TITLE: Product Manager at Stripe, top requirements: B2B payments experience, cross-functional leadership, data-driven decisions. My background: 4 years PM at a fintech startup, launched 3 payment products, grew revenue 200%.",
        exampleOutput:
          "A 300-word cover letter opening with a specific reference to Stripe's recent expansion into embedded finance, connecting the candidate's fintech startup experience directly to Stripe's stated need for B2B payments expertise, with quantified results woven throughout each paragraph.",
        targetKeywords: [
          "AI cover letter generator",
          "cover letter prompt template",
          "ChatGPT cover letter writer",
        ],
        relatedTemplates: ["resume-bullet-point-generator", "job-description-analyzer"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "interview-preparation-coach",
        title: "Interview Preparation Coach",
        description:
          "Prepare for job interviews with tailored behavioral and technical questions plus model answers.",
        prompt:
          "You are a senior interview coach who has prepared candidates for interviews at [COMPANY NAME]. Help me prepare for an upcoming interview.\n\n**Role:** [JOB TITLE]\n**Company:** [COMPANY NAME]\n**Interview Type:** [BEHAVIORAL / TECHNICAL / CASE / PANEL / FINAL ROUND]\n**Job Description (key requirements):**\n[PASTE KEY REQUIREMENTS]\n\n**My Background:**\n- Relevant experience: [BRIEF SUMMARY]\n- Strengths: [2-3 STRENGTHS]\n- Areas I'm concerned about: [GAPS OR WEAKNESSES]\n\nProvide:\n1. **10 most likely questions** for this specific role and company, categorized as:\n   - Behavioral (STAR format expected)\n   - Technical/Role-specific\n   - Culture fit\n   - Curveball/Stress questions\n\n2. **Model answers for the top 5 questions** using my background:\n   - Use the STAR method (Situation, Task, Action, Result) for behavioral questions\n   - Include specific metrics and outcomes\n   - Keep each answer under 2 minutes when spoken aloud\n\n3. **Questions I should ask the interviewer** (5 thoughtful questions that demonstrate research and genuine interest — not generic ones)\n\n4. **Red flag topics to avoid** and how to reframe my weaknesses as growth stories\n\n5. **30-second elevator pitch** tailored to this specific role",
        category: "resume-career",
        tags: ["interview prep", "behavioral questions", "STAR method", "mock interview"],
        useCase:
          "Prepare thoroughly for an upcoming job interview with role-specific questions and polished answers.",
        exampleInput:
          "ROLE: Senior Data Engineer at Netflix, INTERVIEW TYPE: Technical + Behavioral, strengths: Spark, Python, AWS, concerned about: limited streaming industry experience.",
        exampleOutput:
          "A set of 10 targeted questions including 'Describe a time you optimized a data pipeline that reduced processing time significantly' with a STAR-format model answer referencing Spark optimization experience, plus 5 insightful questions about Netflix's data infrastructure.",
        targetKeywords: [
          "AI interview preparation",
          "interview questions prompt",
          "ChatGPT interview coach",
        ],
        relatedTemplates: ["thank-you-email-after-interview", "salary-negotiation-prep"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "linkedin-profile-optimizer",
        title: "LinkedIn Profile Optimizer",
        description:
          "Optimize your LinkedIn headline, about section, and experience to attract recruiters and opportunities.",
        prompt:
          "You are a LinkedIn optimization specialist who understands how recruiters search for candidates and how the LinkedIn algorithm surfaces profiles. Optimize my LinkedIn profile for maximum visibility.\n\n**My Current Role:** [CURRENT JOB TITLE]\n**Target Role / Industry:** [WHAT I WANT TO BE FOUND FOR]\n**Years of Experience:** [YEARS]\n**Key Skills:** [LIST 5-8 TOP SKILLS]\n**Notable Achievements:** [2-3 CAREER HIGHLIGHTS]\n**Career Goal:** [WHAT I'M LOOKING FOR — new role, clients, thought leadership, etc.]\n\nOptimize these sections:\n\n1. **Headline** (220 chars max): Write 5 variations that go beyond just job title — include value proposition, key skills, and target keywords. Recruiters search by keywords, so front-load the most important terms.\n\n2. **About Section** (2,600 chars max): Write a compelling first-person narrative that:\n   - Opens with a hook in the first 2 lines (visible before \"see more\")\n   - Tells my professional story with personality\n   - Includes quantified achievements\n   - Naturally incorporates target keywords for search\n   - Ends with a clear CTA (what I want people to do after reading)\n\n3. **Experience Section** (for current role): 3-4 bullet points following the achievement formula\n\n4. **Featured Section Suggestions**: 3 ideas for content to pin\n\n5. **Keywords to add to Skills section**: 10 keywords that recruiters in [TARGET INDUSTRY] commonly search for",
        category: "resume-career",
        tags: ["LinkedIn", "profile optimization", "personal branding", "recruiter visibility"],
        useCase:
          "Overhaul your LinkedIn profile to rank higher in recruiter searches and attract inbound opportunities.",
        exampleInput:
          "CURRENT ROLE: Software Engineer, TARGET: Engineering Manager roles at mid-stage startups, KEY SKILLS: Python, system design, team leadership, agile, mentoring. ACHIEVEMENT: Built a platform serving 2M users.",
        exampleOutput:
          "Headline: 'Engineering Leader | Building Scalable Systems & High-Performing Teams | Python, System Design, Agile | Open to EM Roles'. About section opening hook: 'I turned a 3-person backend team into a 12-engineer platform org that serves 2M+ users daily.'",
        targetKeywords: [
          "LinkedIn profile optimization prompt",
          "AI LinkedIn optimizer",
          "LinkedIn headline generator",
        ],
        relatedTemplates: ["professional-summary-generator", "networking-message-crafter"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "salary-negotiation-prep",
        title: "Salary Negotiation Prep",
        description:
          "Build a data-backed salary negotiation strategy with scripts for common employer responses.",
        prompt:
          "You are an expert salary negotiation coach who has helped professionals increase their offers by an average of 15-25%. Help me prepare for a salary negotiation.\n\n**The Offer:**\n- Role: [JOB TITLE]\n- Company: [COMPANY NAME]\n- Offered salary: [BASE SALARY]\n- Offered bonus/equity: [BONUS/EQUITY IF APPLICABLE]\n- Location: [CITY/REMOTE]\n\n**My Position:**\n- Current salary: [CURRENT COMPENSATION]\n- Years of experience: [YEARS]\n- Competing offers (if any): [OTHER OFFERS OR \"NONE\"]\n- Unique value I bring: [WHAT MAKES ME UNIQUELY VALUABLE]\n- My target total compensation: [DESIRED AMOUNT]\n\nProvide:\n1. **Market data talking points**: How to frame the ask using market rates for [JOB TITLE] in [LOCATION] — suggest specific data sources I should reference\n\n2. **Negotiation script**: Word-for-word scripts for:\n   - Initial counter-offer response (email version)\n   - Phone/verbal counter-offer approach\n   - How to anchor high without seeming unreasonable\n\n3. **Objection handling**: Scripts for these common responses:\n   - \"This is the max for this level/band\"\n   - \"We don't have budget flexibility\"\n   - \"We can revisit in 6 months\"\n   - \"This is our standard offer for this role\"\n\n4. **Non-salary levers**: 10 things to negotiate if base salary is truly fixed (signing bonus, equity, PTO, remote days, title, etc.) ranked by typical employer flexibility\n\n5. **Walk-away analysis**: Framework to decide if the offer is worth accepting at various counter-offer outcomes",
        category: "resume-career",
        tags: ["salary negotiation", "compensation", "job offer", "counter-offer"],
        useCase:
          "Prepare a confident, data-backed salary negotiation strategy before responding to a job offer.",
        exampleInput:
          "ROLE: Senior Product Designer at a Series B startup, OFFERED: $145K base + 0.05% equity, CURRENT: $130K, TARGET: $165K base. Unique value: Led design system used by 50+ engineers.",
        exampleOutput:
          "A negotiation script opening with market data framing, followed by three objection-handling scripts and a ranked list of alternative levers including signing bonus, equity refresh, and professional development budget tailored to startup compensation norms.",
        targetKeywords: [
          "salary negotiation prompt",
          "AI salary negotiation coach",
          "job offer negotiation template",
        ],
        relatedTemplates: ["interview-preparation-coach", "career-pivot-pitch"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "career-pivot-pitch",
        title: "Career Pivot Pitch",
        description:
          "Craft a compelling narrative for transitioning into a new industry or role with transferable skills.",
        prompt:
          "You are a career transition strategist who specializes in helping professionals pivot to new industries. Help me craft a compelling career pivot narrative.\n\n**My Current/Previous Career:**\n- Role: [CURRENT ROLE]\n- Industry: [CURRENT INDUSTRY]\n- Years in current field: [YEARS]\n- Key skills from this career: [LIST 4-6 SKILLS]\n\n**My Target Career:**\n- Desired role: [TARGET ROLE]\n- Target industry: [TARGET INDUSTRY]\n- Why I want to make this change: [MOTIVATION]\n- Relevant experience or side projects: [ANY RELATED EXPERIENCE]\n\nCreate:\n1. **The Bridge Story** (3-4 sentences): A compelling narrative that connects my past to my desired future — frame the pivot as a natural evolution, not a random leap\n\n2. **Transferable Skills Map**: For each of my current skills, show exactly how it applies to the target role with a concrete example\n   - [Skill] -> [How it maps] -> [Example scenario in new role]\n\n3. **Elevator Pitch** (30 seconds): For networking events and informational interviews\n\n4. **LinkedIn summary version**: A 3-paragraph About section that tells the pivot story\n\n5. **Common objection responses**: Scripts for handling:\n   - \"You don't have direct experience in [TARGET INDUSTRY]\"\n   - \"Why are you leaving [CURRENT FIELD]?\"\n   - \"Aren't you overqualified / starting over?\"\n\n6. **90-Day Learning Plan**: Key certifications, courses, or projects to close the gap — be specific with names and resources",
        category: "resume-career",
        tags: ["career change", "career pivot", "transferable skills", "career transition"],
        useCase:
          "Build a persuasive narrative when transitioning to a completely different industry or function.",
        exampleInput:
          "CURRENT: High school math teacher for 8 years. TARGET: UX Researcher at a tech company. Skills: curriculum design, data analysis, stakeholder communication, qualitative assessment. Motivation: fascinated by how people learn digital interfaces.",
        exampleOutput:
          "Bridge Story: 'For 8 years, I've studied how people learn — designing experiments, analyzing behavioral data, and iterating on experiences that work. UX research is the same discipline applied to digital products.' Transferable skills map showing curriculum design mapping to research study design and student assessment mapping to user testing analysis.",
        targetKeywords: [
          "career pivot prompt",
          "career transition template",
          "AI career change coach",
        ],
        relatedTemplates: ["cover-letter-writer", "linkedin-profile-optimizer"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "job-description-analyzer",
        title: "Job Description Analyzer",
        description:
          "Decode any job posting to identify must-have requirements, hidden expectations, and application strategy.",
        prompt:
          "You are a recruiting insider who has written and reviewed thousands of job descriptions. Analyze this job posting and give me an insider's perspective.\n\n**Job Description:**\n[PASTE THE FULL JOB DESCRIPTION HERE]\n\n**My Background (brief):**\n[1-2 SENTENCES ABOUT YOUR EXPERIENCE]\n\nProvide:\n1. **Requirements Decoded**:\n   - Must-haves (non-negotiable — you won't get an interview without these)\n   - Nice-to-haves (listed as \"required\" but actually flexible)\n   - Hidden requirements (not listed but clearly expected based on the role)\n   - Red flags or unusual asks (anything that seems off)\n\n2. **Keyword Extraction**: The exact keywords and phrases to mirror in your resume and cover letter, sorted by importance\n\n3. **Skills Match Assessment**: Based on my background, rate my fit as Strong Match / Moderate Match / Stretch for each requirement\n\n4. **Application Strategy**:\n   - What to emphasize in my resume for this specific role\n   - What to address proactively (gaps or concerns)\n   - Suggested cover letter angle\n\n5. **Interview Prediction**: 5 questions they are most likely to ask based on the job description language and priorities\n\n6. **Company Culture Signals**: What the language and tone of the JD reveal about the team culture and management style",
        category: "resume-career",
        tags: ["job description", "job analysis", "application strategy", "keyword matching"],
        useCase:
          "Understand exactly what a company is looking for before investing time in a tailored application.",
        exampleInput:
          "A job posting for 'Growth Marketing Lead' at a Series A startup requiring '5+ years in growth marketing, SQL proficiency, experimentation frameworks, and startup experience.' My background: 4 years in digital marketing at mid-size companies, basic SQL.",
        exampleOutput:
          "Must-haves: growth marketing experience and experimentation mindset. Nice-to-haves: SQL listed as required but proficiency likely means basic queries. Hidden requirement: probably a player-coach role at a Series A. Skills match: Growth marketing - Strong, SQL - Moderate, Startup experience - Stretch.",
        targetKeywords: [
          "job description analyzer prompt",
          "AI job posting analysis",
          "decode job description template",
        ],
        relatedTemplates: ["cover-letter-writer", "skills-gap-analyzer"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "thank-you-email-after-interview",
        title: "Thank-You Email After Interview",
        description:
          "Write a memorable post-interview thank-you email that reinforces your candidacy and addresses concerns.",
        prompt:
          "You are a career strategist who understands that the thank-you email is a critical final impression. Write a post-interview thank-you email that goes beyond generic gratitude.\n\n**Interview Details:**\n- Role: [JOB TITLE]\n- Company: [COMPANY NAME]\n- Interviewer name(s) and title(s): [INTERVIEWER INFO]\n- Interview date: [DATE]\n- Interview type: [PHONE SCREEN / TECHNICAL / BEHAVIORAL / FINAL ROUND]\n\n**What We Discussed:**\n- Key topics covered: [MAIN DISCUSSION POINTS]\n- A challenge or project they mentioned: [SPECIFIC CHALLENGE THE TEAM IS FACING]\n- Something I wish I had said better: [ANYTHING I WANT TO CLARIFY OR EXPAND ON]\n- A personal connection or shared interest: [IF ANY]\n\nWrite a thank-you email that:\n1. Opens with a specific reference to our conversation — not \"Thank you for taking the time\"\n2. Reinforces my fit by connecting a specific discussion point to my relevant experience\n3. Addresses any concern or gap that came up (reframe, do not over-explain)\n4. Adds value — include a brief insight, relevant article, or idea related to the challenge they mentioned\n5. Closes with enthusiasm and a forward-looking statement\n\nRules:\n- Under 200 words\n- Send-ready (include subject line)\n- Professional but warm — show personality\n- If multiple interviewers, note where each email should differ",
        category: "resume-career",
        tags: ["thank-you email", "post-interview", "follow-up", "interview etiquette"],
        useCase:
          "Send a polished thank-you email within 24 hours of an interview that strengthens your candidacy.",
        exampleInput:
          "ROLE: Frontend Engineer at Figma, INTERVIEWER: Sarah Chen (Engineering Manager), discussed: component library migration, I stumbled on a question about canvas rendering performance optimization.",
        exampleOutput:
          "Subject: 'Component migration strategy — a thought from our conversation'. Opens with a specific reference to the Vue-to-React migration challenge, then addresses the performance question gap with a concrete technique the candidate used previously.",
        targetKeywords: [
          "thank-you email after interview prompt",
          "post-interview follow-up template",
          "AI interview thank-you email",
        ],
        relatedTemplates: ["interview-preparation-coach", "cover-letter-writer"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "portfolio-project-description-writer",
        title: "Portfolio Project Description Writer",
        description:
          "Write compelling portfolio project descriptions that highlight process, impact, and technical decisions.",
        prompt:
          "You are a portfolio consultant who helps professionals showcase their work to hiring managers and clients. Write a compelling project description for my portfolio.\n\n**Project Details:**\n- Project name: [PROJECT NAME]\n- My role: [YOUR ROLE ON THE PROJECT]\n- Team size: [NUMBER OF PEOPLE]\n- Duration: [TIMELINE]\n- Company/Client (or personal project): [CONTEXT]\n\n**Technical Details:**\n- Technologies/tools used: [TECH STACK OR TOOLS]\n- Problem it solved: [THE PROBLEM]\n- My specific contribution: [WHAT I PERSONALLY DID]\n- Results/impact: [METRICS, OUTCOMES, USER FEEDBACK]\n\n**Write the following sections:**\n1. **One-Line Summary**: A punchy description for portfolio cards and thumbnails (under 15 words)\n\n2. **The Challenge** (2-3 sentences): What problem existed and why it mattered — set the stakes\n\n3. **My Approach** (1 paragraph): Key decisions I made, why I chose this approach over alternatives, and my process\n\n4. **Technical Highlights** (3-4 bullets): The most impressive or interesting technical details — things that would make a senior engineer or hiring manager nod approvingly\n\n5. **Results & Impact** (2-3 sentences): Quantified outcomes with before/after comparison where possible\n\n6. **Key Learnings** (1-2 sentences): What I would do differently — shows self-awareness and growth\n\n7. **Tags/Keywords**: For portfolio filtering and SEO",
        category: "resume-career",
        tags: ["portfolio", "project description", "case study", "technical writing"],
        useCase:
          "Write polished project descriptions for your portfolio website, GitHub profile, or case study presentations.",
        exampleInput:
          "PROJECT: Real-time analytics dashboard, ROLE: Lead Frontend Engineer, TEAM: 4 engineers, TECH: React, D3.js, WebSockets, Redis. PROBLEM: Sales team had 24-hour data lag. RESULT: Reduced latency from 24 hours to under 3 seconds, adopted by 200+ reps.",
        exampleOutput:
          "One-line: 'Real-time analytics dashboard that eliminated 24-hour data lag for 200+ sales reps.' Challenge section establishing the business impact of stale data, followed by technical highlights around WebSocket streaming architecture and virtualized D3.js chart components.",
        targetKeywords: [
          "portfolio project description prompt",
          "AI portfolio writer",
          "project case study template",
        ],
        relatedTemplates: ["resume-bullet-point-generator", "professional-summary-generator"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "networking-message-crafter",
        title: "Networking Message Crafter",
        description:
          "Write personalized networking messages for LinkedIn, email, or events that start real conversations.",
        prompt:
          "You are a networking strategist who helps professionals build meaningful connections without being transactional. Write a networking message for the following scenario.\n\n**Context:**\n- Platform: [LINKEDIN / EMAIL / IN-PERSON FOLLOW-UP / CONFERENCE]\n- Who I'm reaching out to: [THEIR NAME, ROLE, COMPANY]\n- How I found them / connection: [MUTUAL CONNECTION / THEIR CONTENT / EVENT / COLD OUTREACH]\n- My background (brief): [YOUR ROLE AND RELEVANT CONTEXT]\n- My goal: [INFORMATIONAL INTERVIEW / MENTORSHIP / JOB REFERRAL / COLLABORATION / RELATIONSHIP BUILDING]\n\n**What I admire or find relevant about them:**\n[SOMETHING SPECIFIC — their article, talk, career path, project, company]\n\nWrite:\n1. **Primary message** (under 100 words for LinkedIn, under 150 for email):\n   - Open with a specific, genuine compliment or reference (not flattery)\n   - Establish relevance — why you are reaching out to them specifically\n   - Make a small, easy ask (not \"Can I pick your brain?\")\n   - Close warmly with no pressure\n\n2. **Follow-up message** (if no response after 1 week, under 50 words)\n\n3. **Thank-you message** (after they respond or meet with you)\n\n4. **Relationship maintenance message** (for 3 months later — stay on their radar)\n\nRules:\n- Never say \"pick your brain\", \"grab coffee\", or \"I'd love to connect\"\n- Ask a specific question they can answer in 2-3 sentences\n- Give before you ask — reference or offer something of value first\n- Match formality to the platform",
        category: "resume-career",
        tags: ["networking", "LinkedIn messages", "professional relationships", "outreach"],
        useCase:
          "Send personalized networking messages that lead to genuine professional relationships and opportunities.",
        exampleInput:
          "PLATFORM: LinkedIn, REACHING OUT TO: VP of Engineering at target company, CONNECTION: Saw their conference talk on scaling engineering teams, GOAL: informational interview about eng culture before applying.",
        exampleOutput:
          "Primary: 'Hi [Name] — Your QCon talk on reducing meeting load while scaling from 20 to 80 engineers really resonated. Quick question: did async-first work differently for platform vs. product teams?' Follow-up adds value by sharing the sender's own async experiment results.",
        targetKeywords: [
          "networking message prompt",
          "LinkedIn outreach template",
          "AI networking message generator",
        ],
        relatedTemplates: ["linkedin-profile-optimizer", "cold-outreach-email"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "skills-gap-analyzer",
        title: "Skills Gap Analyzer",
        description:
          "Identify the exact skills gap between your current profile and a target role with a prioritized learning plan.",
        prompt:
          "You are a career development advisor with deep knowledge of hiring requirements across industries. Analyze the gap between my current skills and a target role, then create a prioritized plan to close it.\n\n**My Current Profile:**\n- Current role: [YOUR CURRENT JOB TITLE]\n- Years of experience: [YEARS]\n- Technical skills: [LIST YOUR TECHNICAL SKILLS]\n- Soft skills: [LIST YOUR SOFT SKILLS]\n- Certifications: [ANY CERTIFICATIONS]\n- Education: [DEGREE/FIELD]\n\n**Target Role:**\n- Desired title: [TARGET JOB TITLE]\n- Target company type: [STARTUP / MID-SIZE / ENTERPRISE / SPECIFIC COMPANY]\n- Industry: [TARGET INDUSTRY]\n- Job description requirements (paste if available):\n[PASTE JOB REQUIREMENTS OR DESCRIBE THE ROLE]\n\nProvide:\n1. **Skills Audit Table**:\n   | Skill Required | My Current Level (1-5) | Required Level (1-5) | Gap | Priority |\n   Rate each skill and flag the largest gaps\n\n2. **Critical Gaps** (Top 3): Skills that will likely disqualify me if not addressed, with specific evidence of why they matter\n\n3. **Quick Wins** (Top 3): Skills I can credibly add to my resume within 30 days through courses, micro-projects, or certifications\n\n4. **90-Day Learning Roadmap**:\n   - Month 1: Foundation building (specific courses, resources, daily time commitment)\n   - Month 2: Applied practice (projects, contributions, portfolio pieces)\n   - Month 3: Validation (certifications, networking, application prep)\n\n5. **Alternative Paths**: If the direct jump is too large, suggest 1-2 intermediate roles that would bridge the gap\n\n6. **Hidden Strengths**: Skills I have that I might be undervaluing for this target role",
        category: "resume-career",
        tags: ["skills gap", "career development", "learning plan", "upskilling"],
        useCase:
          "Map the exact distance between where you are and where you want to be, then build a concrete plan to get there.",
        exampleInput:
          "CURRENT: Junior Data Analyst (2 years), skills: Excel, SQL, basic Python, Tableau. TARGET: Machine Learning Engineer at a mid-size tech company. Certifications: Google Data Analytics.",
        exampleOutput:
          "Critical Gaps: (1) ML frameworks like scikit-learn and TensorFlow. (2) Software engineering practices for production code. (3) Statistics and linear algebra depth. Quick Wins: Complete a ML Specialization course in 30 days, build a deployed ML model with Flask API, contribute to an open-source ML project. Alternative path: Data Scientist as bridge role.",
        targetKeywords: [
          "skills gap analysis prompt",
          "AI career development plan",
          "upskilling roadmap template",
        ],
        relatedTemplates: ["job-description-analyzer", "career-pivot-pitch"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "professional-summary-generator",
        title: "Professional Summary Generator",
        description:
          "Create a powerful resume summary or professional bio tailored to your target audience and career goals.",
        prompt:
          "You are a personal branding expert who writes professional summaries for executives, career changers, and ambitious professionals. Write a professional summary tailored to my goals.\n\n**My Details:**\n- Name: [YOUR NAME]\n- Current/most recent title: [JOB TITLE]\n- Industry: [INDUSTRY]\n- Years of experience: [YEARS]\n- Top 3 achievements:\n  1. [ACHIEVEMENT WITH METRICS]\n  2. [ACHIEVEMENT WITH METRICS]\n  3. [ACHIEVEMENT WITH METRICS]\n- Key technical skills: [SKILLS]\n- Leadership experience: [TEAM SIZE, SCOPE]\n- What sets me apart: [UNIQUE VALUE PROPOSITION]\n\n**Target:**\n- Who will read this: [RECRUITERS / CLIENTS / CONFERENCE ORGANIZERS / LINKEDIN VISITORS]\n- What role or opportunity I want: [TARGET]\n- Tone: [AUTHORITATIVE / APPROACHABLE / EXECUTIVE / TECHNICAL]\n\n**Write these versions:**\n1. **Resume Summary** (3-4 sentences, 50-75 words): Dense with keywords and achievements, no filler words, written in implied first person (no \"I\")\n\n2. **LinkedIn About (Short)** (First 2 lines visible before \"see more\"): Hook that makes people click to read more\n\n3. **Full Professional Bio** (150 words): Third-person, suitable for speaker profiles, company websites, or conference bios\n\n4. **Twitter/X Bio** (160 chars max): Punchy, personality-forward\n\n5. **Elevator Pitch** (30 seconds spoken): First-person, conversational, memorable\n\nFor each version, highlight the 3 most important keywords for searchability.",
        category: "resume-career",
        tags: ["professional summary", "bio", "personal branding", "resume header"],
        useCase:
          "Create multiple versions of your professional narrative for resumes, LinkedIn, bios, and introductions.",
        exampleInput:
          "TITLE: Director of Product, INDUSTRY: B2B SaaS, YEARS: 12, achievements: grew product line from $2M to $18M ARR, launched 3 products from 0-to-1, built team of 14 PMs. TARGET: VP of Product roles, TONE: executive.",
        exampleOutput:
          "Resume Summary: 'Product leader with 12 years in B2B SaaS, driving $16M+ ARR growth through 0-to-1 product launches and data-driven roadmap strategy. Built and scaled a 14-person product organization across 3 product lines.' LinkedIn hook: 'I have taken 3 B2B products from whiteboard sketch to $18M ARR.'",
        targetKeywords: [
          "professional summary generator",
          "AI resume summary writer",
          "professional bio prompt template",
        ],
        relatedTemplates: ["resume-bullet-point-generator", "linkedin-profile-optimizer"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
    ],
  },


  // ── Sales ──────────────────────────────────────────────────────────────
  {
    slug: "sales",
    title: "Sales Prompts",
    description:
      "AI prompt templates for cold outreach, objection handling, discovery calls, proposals, and closing deals. Ready to paste into ChatGPT, Claude, or Gemini.",
    longDescription:
      "Close more deals with AI-powered prompt templates built for every stage of the sales cycle. From crafting personalized cold outreach that gets replies to handling objections with confidence and writing proposals that win, these templates give sales professionals a repeatable edge. Customize the bracketed placeholders with your product, prospect, and deal details, then paste into any major AI assistant.",
    icon: "\uD83E\uDD1D",
    keywords: [
      "sales prompts",
      "cold outreach prompts",
      "sales pitch prompts",
      "AI sales templates",
      "ChatGPT for sales",
    ],
    relatedCategories: ["marketing", "email", "resume-career"],
    templates: [
      {
        slug: "cold-outreach-message-generator",
        title: "Cold Outreach Message Generator",
        description:
          "Generate personalized cold outreach messages across email, LinkedIn, and phone that earn replies instead of unsubscribes.",
        prompt:
          "You are an elite B2B sales development rep who consistently books 20+ meetings per month through outbound alone. Write cold outreach messages for the following prospect.\n\n**My Product/Service:** [PRODUCT NAME] — [ONE-SENTENCE DESCRIPTION]\n**Target Prospect:**\n- Name: [PROSPECT NAME]\n- Title: [THEIR TITLE]\n- Company: [THEIR COMPANY]\n- Company size: [EMPLOYEE COUNT / REVENUE RANGE]\n- Industry: [INDUSTRY]\n\n**Personalization Research:**\n- Something specific about them: [RECENT POST, COMPANY NEWS, JOB CHANGE, PODCAST APPEARANCE, ETC.]\n- Pain point they likely face: [PROBLEM YOUR PRODUCT SOLVES FOR THEM]\n- Why now: [TRIGGER EVENT — funding round, hiring spree, competitor move, new regulation, etc.]\n\n**Write outreach for 3 channels:**\n\n1. **Cold Email** (under 125 words):\n   - Subject line (under 40 chars, no clickbait)\n   - Opening line that references their specific situation (not \"I noticed that...\")\n   - One sentence connecting their pain to your value\n   - Social proof (one sentence — metric or name-drop)\n   - CTA as a low-commitment question\n   - P.S. line with a conversation hook\n\n2. **LinkedIn Connection Request** (under 300 chars):\n   - Reference the personalization hook\n   - No pitching in the connection request\n\n3. **LinkedIn Follow-Up Message** (after they accept, under 100 words):\n   - Thank them, reference a shared interest\n   - Transition to value naturally\n   - Soft CTA\n\nRules: No \"hope this finds you well\", no \"I'd love to\", no \"touching base\". Lead with their world, not yours.",
        category: "sales",
        tags: ["cold outreach", "prospecting", "SDR", "BDR", "cold email"],
        useCase:
          "Craft personalized multi-channel outreach sequences that break through inbox noise and start conversations.",
        exampleInput:
          "PRODUCT: DataSync Pro (API integration platform), PROSPECT: CTO at a 200-person e-commerce company that just raised Series B, PERSONALIZATION: They posted on LinkedIn about API reliability challenges during Black Friday.",
        exampleOutput:
          "Email subject: 'Black Friday API pain'. Body: 'Your post about API failures during peak traffic hit home — we heard the same story from 3 other e-commerce CTOs last quarter. DataSync Pro kept [Similar Company] at 99.99% uptime through their 40x traffic spike...' LinkedIn request: 'Great post on API reliability under load — we are solving the exact problem you described. Would love to compare notes.'",
        targetKeywords: [
          "cold outreach prompt",
          "AI sales prospecting template",
          "cold email generator for sales",
        ],
        relatedTemplates: ["follow-up-sequence-builder", "cold-outreach-email"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "sales-objection-handler",
        title: "Sales Objection Handler",
        description:
          "Get word-for-word scripts to handle the toughest sales objections with empathy, logic, and confidence.",
        prompt:
          "You are a sales trainer who has coached hundreds of reps to handle objections without being pushy. Help me prepare responses for objections I face in my sales process.\n\n**My Product/Service:** [PRODUCT NAME]\n**What it does:** [ONE-SENTENCE VALUE PROP]\n**Price point:** [PRICE / PRICING MODEL]\n**Typical buyer:** [BUYER PERSONA — title, company size]\n**Sales cycle:** [AVERAGE LENGTH]\n\n**Objections I need to handle (pick all that apply or add your own):**\n1. [OBJECTION 1, e.g., \"It's too expensive\"]\n2. [OBJECTION 2, e.g., \"We're already using [COMPETITOR]\"]\n3. [OBJECTION 3, e.g., \"I need to talk to my team first\"]\n4. [OBJECTION 4, e.g., \"We don't have budget right now\"]\n5. [OBJECTION 5, e.g., \"Send me some information\"]\n\nFor EACH objection, provide:\n1. **What they actually mean** (the real concern behind the words)\n2. **Acknowledge** (1 sentence — validate their concern without agreeing)\n3. **Reframe** (1-2 sentences — shift their perspective)\n4. **Proof point** (specific example, case study, or data point)\n5. **Bridge question** (a question that moves the conversation forward)\n6. **Full script** (the complete response, conversational tone, under 60 seconds when spoken)\n\nAlso provide:\n- **Pre-emptive strategy**: How to address the top 3 objections BEFORE they come up\n- **Red flag objections**: Which objections signal a deal that should be disqualified\n- **Tone guidance**: How to sound confident without being aggressive",
        category: "sales",
        tags: ["objection handling", "sales scripts", "negotiation", "closing"],
        useCase:
          "Prepare confident, empathetic responses to every objection you hear on sales calls.",
        exampleInput:
          "PRODUCT: CloudMetrics (analytics SaaS, $500/mo), BUYER: VP of Marketing at mid-market companies. OBJECTIONS: 'We already use Google Analytics', 'Your price is higher than competitors', 'I need to get approval from finance'.",
        exampleOutput:
          "Objection: 'We already use Google Analytics.' What they mean: They don't see enough incremental value to justify switching or adding a tool. Acknowledge: 'Totally fair — GA is great for surface-level web analytics.' Reframe: 'Most of our customers started with GA too. The gap they kept hitting was connecting marketing spend to actual revenue by channel...' Bridge question: 'Out of curiosity, how are you currently attributing revenue back to specific campaigns?'",
        targetKeywords: [
          "sales objection handling prompt",
          "AI objection response generator",
          "sales script template",
        ],
        relatedTemplates: ["discovery-call-script-builder", "cold-outreach-message-generator"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "discovery-call-script-builder",
        title: "Discovery Call Script Builder",
        description:
          "Build a structured discovery call script that uncovers pain, budget, timeline, and decision-making process.",
        prompt:
          "You are a top-performing enterprise account executive who closes seven-figure deals through exceptional discovery. Build a discovery call script for my upcoming call.\n\n**My Product/Service:** [PRODUCT NAME] — [WHAT IT DOES]\n**Prospect Details:**\n- Company: [COMPANY NAME]\n- Contact: [NAME, TITLE]\n- Industry: [INDUSTRY]\n- Company size: [SIZE]\n- How they entered our pipeline: [INBOUND LEAD / COLD OUTREACH / REFERRAL / EVENT]\n\n**What I know so far:** [ANY INTEL — their current tools, pain points, timeline]\n**My call goal:** [QUALIFY / DEMO BOOKING / NEXT STEPS / MULTI-THREAD]\n\n**Build a script with these sections:**\n\n1. **Opening (2 minutes)**: Warm rapport-building opener, agenda setting, permission to ask questions\n\n2. **Situation Questions (5 minutes)**: 4-5 questions to understand their current state — what tools they use, team structure, current process\n\n3. **Pain Discovery (10 minutes)**: 5-6 questions using the SPIN framework (Situation, Problem, Implication, Need-Payoff) to uncover and amplify pain\n   - Start broad, go deep on the first pain they mention\n   - Include follow-up probes for each question\n\n4. **Impact Quantification (3 minutes)**: 2-3 questions that help the prospect put a dollar value on their problem\n\n5. **Decision Process (5 minutes)**: Questions to map the buying process:\n   - Who else is involved?\n   - What is the evaluation process?\n   - Timeline and budget\n   - What would make this a \"no\"?\n\n6. **Bridge to Next Steps (2 minutes)**: How to transition from discovery to a demo or proposal\n\n7. **Objection landmines**: 3 likely objections that may come up during discovery and how to handle them in-call\n\nInclude transition phrases between each section so the call flows naturally.",
        category: "sales",
        tags: ["discovery call", "SPIN selling", "qualification", "sales call"],
        useCase:
          "Run a structured, effective discovery call that qualifies prospects and uncovers genuine buying intent.",
        exampleInput:
          "PRODUCT: SecureVault (enterprise data security platform, $50K+ ACV), PROSPECT: CISO at a 2,000-person healthcare company, entered pipeline via inbound demo request after a data breach news article. Known: they use legacy on-prem security tools.",
        exampleOutput:
          "Opening: 'Thanks for making time — I saw you requested a demo after reviewing our healthcare security page. Before I show you anything, I want to make sure I understand your world first. Mind if I ask a few questions so I can tailor this to what actually matters to you?' Pain discovery: 'You mentioned legacy on-prem tools — what happens when your team needs to investigate a potential incident at 2am? How long does that typically take today?'",
        targetKeywords: [
          "discovery call script prompt",
          "AI sales call template",
          "SPIN selling questions generator",
        ],
        relatedTemplates: ["sales-objection-handler", "proposal-writer"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "proposal-writer",
        title: "Proposal Writer",
        description:
          "Write a persuasive sales proposal that recaps discovered pain, presents your solution, and justifies the investment.",
        prompt:
          "You are a proposal strategist who has helped sales teams increase their win rate by crafting proposals that sell. Write a sales proposal for this deal.\n\n**Deal Context:**\n- Prospect company: [COMPANY NAME]\n- Prospect contact: [NAME, TITLE]\n- Industry: [INDUSTRY]\n- Company size: [EMPLOYEES / REVENUE]\n\n**Discovery Findings:**\n- Primary pain point: [MAIN PROBLEM]\n- Secondary pain points: [ADDITIONAL PROBLEMS]\n- Current solution/workaround: [WHAT THEY DO TODAY]\n- Cost of inaction: [WHAT THE PROBLEM COSTS THEM — time, money, risk]\n- Key decision criteria: [WHAT MATTERS MOST TO THEM]\n- Decision makers: [WHO ELSE NEEDS TO APPROVE]\n\n**Our Solution:**\n- Product/Service: [YOUR OFFERING]\n- Pricing: [PRICE AND MODEL]\n- Implementation timeline: [HOW LONG]\n- Key differentiators: [WHY US VS. ALTERNATIVES]\n\n**Write these proposal sections:**\n1. **Executive Summary** (1 paragraph): Restate their problem in their language, preview the solution, hint at the ROI\n\n2. **Current Situation & Challenges**: Mirror back what they told you during discovery — show you listened\n\n3. **Proposed Solution**: How your product addresses each pain point specifically (not generic feature lists)\n\n4. **Implementation Plan**: Phased timeline with milestones and what success looks like at each stage\n\n5. **Expected ROI**: Quantified value based on their specific numbers from discovery\n\n6. **Investment & Terms**: Frame pricing as investment, include options if applicable\n\n7. **Why Us**: 2-3 differentiators with proof points, case study references\n\n8. **Next Steps**: Clear, specific actions with dates\n\nTone: Consultative and confident, not salesy. This should read like a trusted advisor's recommendation.",
        category: "sales",
        tags: ["sales proposal", "deal closing", "business case", "ROI"],
        useCase:
          "Create a polished, customized sales proposal that moves deals forward after discovery calls.",
        exampleInput:
          "PROSPECT: VP of Ops at a 500-person logistics company. PAIN: Manual route optimization costs them 15 hours/week and $200K/year in fuel waste. OUR SOLUTION: RouteAI (AI route optimization, $3K/mo). They currently use spreadsheets and driver intuition.",
        exampleOutput:
          "Executive Summary: 'FleetCorp's routing operations cost an estimated $200K annually in excess fuel and 780 hours of manual planning. RouteAI replaces spreadsheet-based routing with AI optimization that typically reduces fuel costs by 23% and planning time by 85% — delivering an estimated $180K net annual savings against a $36K investment...'",
        targetKeywords: [
          "sales proposal template prompt",
          "AI proposal writer",
          "business proposal generator",
        ],
        relatedTemplates: ["discovery-call-script-builder", "roi-calculator-narrative"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "follow-up-sequence-builder",
        title: "Follow-Up Sequence Builder",
        description:
          "Create a multi-touch follow-up sequence that stays persistent and adds value without being annoying.",
        prompt:
          "You are a sales engagement specialist who designs follow-up sequences with above-average reply rates. Build a follow-up sequence for this scenario.\n\n**Context:**\n- What happened before: [INITIAL OUTREACH / POST-DEMO / POST-PROPOSAL / WENT DARK AFTER MEETING]\n- Prospect: [NAME, TITLE, COMPANY]\n- Product/Service: [WHAT YOU SELL]\n- Last interaction: [WHAT HAPPENED AND WHEN]\n- Deal value: [APPROXIMATE DEAL SIZE]\n- Buying signals seen: [ANY POSITIVE INDICATORS]\n- Potential blockers: [WHY THEY MIGHT BE STALLING]\n\n**Build a 5-touch follow-up sequence:**\n\nFor each touch:\n- **Timing**: When to send (days after previous touch)\n- **Channel**: Email / LinkedIn / Phone / Video\n- **Strategy**: What angle this touch takes (new value, social proof, urgency, different stakeholder, breakup)\n- **Subject line** (for emails)\n- **Full message** (progressively shorter — Touch 1: 100 words, Touch 5: 40 words)\n- **Why this works**: Brief note on the psychology behind this touch\n\n**Sequence structure:**\n- Touch 1: Add new value (insight, resource, case study relevant to their situation)\n- Touch 2: Different angle (approach the problem from a new perspective)\n- Touch 3: Social proof (relevant customer story or metric)\n- Touch 4: Multi-thread (suggest looping in another stakeholder or try a different channel)\n- Touch 5: Breakup email (last attempt, no pressure, leave the door open)\n\nRules:\n- Never guilt-trip (\"just following up\" and \"checking in\" are banned)\n- Each message must stand alone (assume they did not read previous ones)\n- Include at least one non-email channel in the sequence\n- Every touch must provide independent value",
        category: "sales",
        tags: ["follow-up", "sales sequence", "persistence", "deal recovery"],
        useCase:
          "Build a value-driven follow-up sequence to re-engage prospects who have gone quiet.",
        exampleInput:
          "CONTEXT: Post-demo follow-up, prospect loved the demo 2 weeks ago but has gone silent. PROSPECT: Director of Marketing at a 300-person SaaS company. PRODUCT: ContentEngine (AI content platform, $2K/mo). SIGNALS: Asked about pricing and implementation timeline during demo.",
        exampleOutput:
          "Touch 1 (Day 3): Email with subject 'The content workflow we discussed' sharing a case study of a similar SaaS company that reduced content production time by 60%. Touch 3 (Day 10): LinkedIn voice message referencing a new feature relevant to their use case. Touch 5 (Day 21): Breakup email — 'Sounds like timing might not be right. No worries at all — I will share our Q2 product updates in case things change on your end.'",
        targetKeywords: [
          "sales follow-up sequence prompt",
          "AI follow-up email generator",
          "sales cadence template",
        ],
        relatedTemplates: ["cold-outreach-message-generator", "follow-up-email-sequence"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "product-demo-script",
        title: "Product Demo Script",
        description:
          "Build a structured product demo script that tells a story, addresses specific pain points, and drives next steps.",
        prompt:
          "You are a demo expert who has delivered hundreds of product demonstrations that convert prospects into customers. Build a demo script for my upcoming call.\n\n**Product:** [PRODUCT NAME]\n**What it does:** [ONE-PARAGRAPH DESCRIPTION]\n**Key features to show:** [LIST 4-6 FEATURES]\n\n**Prospect Context:**\n- Company: [COMPANY NAME]\n- Attendees: [WHO WILL BE ON THE CALL — names, titles]\n- Pain points from discovery: [WHAT PROBLEMS THEY WANT TO SOLVE]\n- Current solution: [WHAT THEY USE TODAY]\n- Decision criteria: [WHAT MATTERS MOST — price, ease of use, integrations, etc.]\n\n**Demo Duration:** [30 / 45 / 60 MINUTES]\n\n**Build a demo script with:**\n\n1. **Opening (3 min)**: Recap discovery findings, set agenda, confirm what success looks like for this demo\n\n2. **The Story Arc**: Structure the demo as a narrative:\n   - **Before**: Paint their current painful reality (using their own words from discovery)\n   - **During**: Show the transformation — demonstrate features in the context of THEIR workflow, not generic use cases\n   - **After**: Paint the future state with metrics and outcomes from similar customers\n\n3. **Feature Walkthrough** (ordered by their priorities, not your feature list):\n   For each feature:\n   - Transition phrase connecting to their pain point\n   - What to show (specific clicks/screens)\n   - What to say while showing it\n   - Pause point for questions or reactions\n\n4. **Competitive Differentiator Moments**: 2-3 natural points to highlight what you do that competitors cannot\n\n5. **Social Proof Drops**: Where to naturally mention relevant customer stories during the demo\n\n6. **Close & Next Steps (5 min)**: Trial/pilot offer, timeline discussion, action items\n\n7. **Likely Questions & Answers**: 5 questions they will probably ask and prepared responses",
        category: "sales",
        tags: ["product demo", "sales presentation", "live demo", "demo script"],
        useCase:
          "Deliver a compelling, customized product demo that connects features to specific prospect pain points.",
        exampleInput:
          "PRODUCT: TaskFlow (project management SaaS), PROSPECT: Head of Engineering and 2 team leads at a 100-person startup. PAIN: Engineers spend 5+ hours/week on status updates across Slack, Jira, and docs. They want a single source of truth. DEMO: 30 minutes.",
        exampleOutput:
          "Opening: 'Last time we spoke, you mentioned your engineers lose about 5 hours a week toggling between Jira, Slack, and Google Docs just to keep everyone aligned. Today I want to show you exactly how TaskFlow eliminates that context-switching.' Story arc — Before: 'Imagine it is Monday morning standup. Your engineers have 4 tabs open...' Feature 1 transition: 'You mentioned Jira is where tasks live but Slack is where decisions happen — let me show you how those sync automatically...'",
        targetKeywords: [
          "product demo script prompt",
          "AI demo template",
          "sales demo script generator",
        ],
        relatedTemplates: ["discovery-call-script-builder", "proposal-writer"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "competitive-battle-card-generator",
        title: "Competitive Battle Card Generator",
        description:
          "Create a comprehensive competitive battle card with positioning, objection handling, and win strategies.",
        prompt:
          "You are a competitive intelligence analyst who helps sales teams win against specific competitors. Create a battle card for my team.\n\n**Our Product:** [YOUR PRODUCT NAME]\n**Our positioning:** [HOW WE POSITION OURSELVES]\n**Our pricing:** [PRICING MODEL AND RANGE]\n**Our strengths:** [TOP 3-5 STRENGTHS]\n**Our weaknesses (be honest):** [WHERE WE FALL SHORT]\n\n**Competitor:** [COMPETITOR NAME]\n**Their positioning:** [HOW THEY POSITION THEMSELVES]\n**Their pricing:** [THEIR PRICING IF KNOWN]\n**Their strengths:** [WHAT THEY DO WELL]\n**Their weaknesses:** [WHERE THEY FALL SHORT]\n\n**Create a battle card with these sections:**\n\n1. **Quick Comparison Table**: Feature-by-feature comparison (10-12 key features) with checkmarks, showing honest assessment\n\n2. **When We Win**: 3-4 scenarios where we are the better choice (with explanation of why)\n\n3. **When They Win**: 2-3 scenarios where the competitor is genuinely better (so reps know when to qualify out)\n\n4. **Landmine Questions**: 5 questions our reps should ask prospects that expose the competitor's weaknesses (without naming them)\n\n5. **Their Likely Attacks**: What the competitor will say about us, and how to respond\n\n6. **Our Killer Differentiators**: 3 features or capabilities they simply cannot match, with proof points\n\n7. **Customer Win Stories**: Suggest 3 types of case studies that would be most effective against this competitor\n\n8. **Do's and Don'ts**: Quick rules for competing against them (e.g., don't compete on price, do emphasize integration depth)\n\n9. **Talk Track**: A 60-second positioning statement a rep can use when the competitor comes up on a call",
        category: "sales",
        tags: ["competitive intelligence", "battle card", "sales enablement", "positioning"],
        useCase:
          "Equip your sales team with a comprehensive playbook for winning against a specific competitor.",
        exampleInput:
          "OUR PRODUCT: FlowCRM (lightweight CRM for SMBs, $29/user/mo). COMPETITOR: Salesforce. Our strengths: simple setup, no admin needed, built-in email. Our weakness: limited enterprise features, smaller ecosystem. Their strength: deep customization, massive app ecosystem. Their weakness: complexity, cost, requires dedicated admin.",
        exampleOutput:
          "When We Win: (1) SMBs under 50 users who need a CRM running in days, not months. (2) Teams without a dedicated Salesforce admin. (3) Price-sensitive buyers who need core CRM without paying for unused enterprise features. Landmine question: 'How much time does your team currently spend on CRM administration and configuration versus actual selling?'",
        targetKeywords: [
          "competitive battle card prompt",
          "AI sales battle card generator",
          "competitive analysis template for sales",
        ],
        relatedTemplates: ["sales-objection-handler", "product-demo-script"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "roi-calculator-narrative",
        title: "ROI Calculator Narrative",
        description:
          "Build a compelling ROI narrative with specific calculations that justify your product's investment.",
        prompt:
          "You are a financial analyst who helps sales teams build bulletproof ROI cases that CFOs actually believe. Create an ROI narrative for this deal.\n\n**Our Product/Service:** [PRODUCT NAME]\n**Pricing:** [ANNUAL COST TO THE CUSTOMER]\n**Implementation cost (if any):** [SETUP / ONBOARDING FEES]\n**Time to value:** [HOW LONG BEFORE THEY SEE RESULTS]\n\n**Prospect's Situation:**\n- Company: [COMPANY NAME]\n- Industry: [INDUSTRY]\n- Size: [EMPLOYEES / REVENUE]\n- Current pain: [SPECIFIC PROBLEM WITH MEASURABLE IMPACT]\n- Current cost of the problem: [ESTIMATED ANNUAL COST — labor, tools, lost revenue, risk]\n- Data points from discovery: [ANY SPECIFIC NUMBERS THEY SHARED]\n\n**Build an ROI case with:**\n\n1. **Cost of Inaction** (most important section):\n   - Direct costs (labor hours wasted, tools being paid for, manual processes)\n   - Indirect costs (opportunity cost, employee burnout, competitive disadvantage)\n   - Risk costs (compliance fines, data breaches, customer churn)\n   - Calculate the total annual cost of doing nothing\n\n2. **Value of Our Solution**:\n   - Time savings (hours/week x hourly rate x 52 weeks)\n   - Revenue impact (increased conversion, faster sales cycle, reduced churn)\n   - Risk reduction (quantified where possible)\n   - Efficiency gains (fewer tools, fewer errors, faster onboarding)\n\n3. **ROI Summary Table**:\n   | Category | Current Cost | With Our Solution | Annual Savings |\n   Show conservative, moderate, and aggressive scenarios\n\n4. **Payback Period**: When the investment breaks even\n\n5. **One-Page Executive Summary**: A CFO-ready summary that a champion can forward internally\n\n6. **Assumptions & Sources**: List all assumptions transparently — this builds credibility",
        category: "sales",
        tags: ["ROI", "business case", "financial justification", "CFO selling"],
        useCase:
          "Build a quantified ROI narrative that gives your champion ammunition to justify the purchase internally.",
        exampleInput:
          "PRODUCT: AutoQA (automated QA testing platform, $60K/year). PROSPECT: 200-person SaaS company. PAIN: 4 QA engineers spend 60% of their time on manual regression testing. Average QA salary: $120K. They had 2 major production bugs last quarter that caused customer churn.",
        exampleOutput:
          "Cost of Inaction: Manual testing labor = 4 engineers x 60% time x $120K = $288K/year. Production bugs: 2 incidents last quarter causing estimated $150K in churn = $600K/year risk. Total annual cost of status quo: $888K. With AutoQA: Reduce manual testing by 80% = $230K saved. Reduce production bugs by 70% = $420K risk reduction. ROI: $650K annual value on $60K investment = 10.8x return. Payback period: 34 days.",
        targetKeywords: [
          "ROI calculator prompt",
          "AI sales ROI template",
          "business case generator for sales",
        ],
        relatedTemplates: ["proposal-writer", "discovery-call-script-builder"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "upsell-cross-sell-strategist",
        title: "Upsell Cross-sell Strategist",
        description:
          "Identify and script upsell and cross-sell opportunities within your existing customer base.",
        prompt:
          "You are a customer success and expansion revenue strategist. Help me identify and execute upsell and cross-sell opportunities for an existing customer.\n\n**Current Customer Details:**\n- Company: [CUSTOMER NAME]\n- Current product/plan: [WHAT THEY CURRENTLY USE]\n- Current spend: [ANNUAL CONTRACT VALUE]\n- Time as customer: [MONTHS/YEARS]\n- Usage patterns: [HOW THEY USE THE PRODUCT — features, frequency, team size]\n- Health score: [HEALTHY / AT-RISK / CHAMPION]\n- Key contact: [NAME, TITLE]\n- Relationship quality: [STRONG / NEUTRAL / NEEDS ATTENTION]\n\n**Expansion Products Available:**\n[LIST UPSELL TIERS OR CROSS-SELL PRODUCTS WITH PRICING]\n\n**Create an expansion playbook:**\n\n1. **Opportunity Assessment**:\n   - Score each expansion product (1-10) for fit based on their usage and company profile\n   - Identify the single best opportunity with reasoning\n   - Estimate expansion revenue potential\n\n2. **Trigger Identification**: 5 signals that indicate they are ready for expansion (usage thresholds, team growth, feature requests, etc.)\n\n3. **Value Narrative**: How to position the upsell as solving their NEXT problem (not just selling more)\n\n4. **Conversation Script**: Natural way to introduce the expansion during a QBR or check-in call:\n   - Opening that references their success\n   - Transition to the growth opportunity\n   - Handling \"we're happy with what we have\"\n\n5. **Email Template**: A warm expansion email that leads with value and data\n\n6. **Multi-Thread Strategy**: How to get buy-in from additional stakeholders who benefit from the expansion\n\n7. **Timeline & Milestones**: When to plant the seed, when to formally propose, best timing for their budget cycle",
        category: "sales",
        tags: ["upsell", "cross-sell", "expansion revenue", "customer success", "account management"],
        useCase:
          "Systematically identify and capture expansion revenue from existing customers who are ready to grow.",
        exampleInput:
          "CUSTOMER: MidCorp (marketing agency, 80 employees), CURRENT: Basic plan at $500/mo for 10 users, TIME: 14 months, USAGE: Hitting seat limits, 3 feature requests for advanced analytics. EXPANSION: Pro plan ($1,200/mo for 25 users + analytics) or Enterprise ($2,500/mo unlimited + API access).",
        exampleOutput:
          "Best opportunity: Pro plan (8/10 fit). They are hitting seat limits (natural friction) and actively requesting analytics features that exist in Pro. Value narrative: 'You have grown from 10 to 15 active users in 6 months — congratulations. The analytics features you asked about in your last 3 support tickets are actually available on Pro, and the additional seats would eliminate the access bottleneck your team flagged.'",
        targetKeywords: [
          "upsell strategy prompt",
          "AI cross-sell template",
          "expansion revenue playbook",
        ],
        relatedTemplates: ["proposal-writer", "follow-up-sequence-builder"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "win-loss-analysis-template",
        title: "Win-Loss Analysis Template",
        description:
          "Conduct a structured win-loss analysis to extract actionable insights from closed deals.",
        prompt:
          "You are a revenue operations analyst who specializes in win-loss analysis for B2B sales organizations. Help me analyze a recently closed deal and extract actionable insights.\n\n**Deal Details:**\n- Deal outcome: [WON / LOST]\n- Prospect company: [COMPANY NAME]\n- Deal size: [ACV]\n- Sales cycle length: [DAYS/WEEKS]\n- Competitor(s) involved: [COMPETITOR NAMES OR \"NONE / STATUS QUO\"]\n- Decision maker(s): [WHO MADE THE FINAL CALL]\n\n**Deal Timeline:**\n- How they entered our pipeline: [SOURCE]\n- Key milestones: [LIST MAJOR EVENTS — demo, proposal, executive sponsor meeting, etc.]\n- Where the deal stalled (if applicable): [STAGE AND REASON]\n- Final decision factors: [WHAT TIPPED THE DECISION]\n\n**If Won — What Went Right:**\n- [KEY FACTOR 1]\n- [KEY FACTOR 2]\n- [KEY FACTOR 3]\n\n**If Lost — What Went Wrong:**\n- [KEY FACTOR 1]\n- [KEY FACTOR 2]\n- [KEY FACTOR 3]\n\n**Produce a win-loss analysis with:**\n\n1. **Executive Summary** (3-4 sentences): What happened and why, in plain language\n\n2. **Decision Driver Analysis**: Rank the top 5 factors that influenced the outcome (product fit, price, relationships, timing, competition) with evidence\n\n3. **Process Evaluation**: What we did well and what we should have done differently at each stage of the sales cycle\n\n4. **Competitive Insights** (if applicable): What we learned about the competitor's positioning, pricing, or tactics\n\n5. **Actionable Recommendations**: 3-5 specific changes for future deals (be concrete — not \"improve discovery\" but \"add a 15-minute technical deep-dive to the discovery call\")\n\n6. **Pattern Recognition**: Questions to determine if this deal outcome represents a trend or an anomaly\n\n7. **Team Debrief Agenda**: A 30-minute meeting structure to share these insights with the broader sales team",
        category: "sales",
        tags: ["win-loss analysis", "sales analytics", "deal review", "revenue operations"],
        useCase:
          "Extract repeatable lessons from every deal outcome to continuously improve your team's win rate.",
        exampleInput:
          "DEAL: Lost a $45K ACV deal to Competitor X after a 90-day sales cycle. They entered via inbound, loved our demo, but stalled at proposal stage. Final factor: competitor offered a 2-year contract with 30% discount. Decision maker was the CFO who entered late in the process.",
        exampleOutput:
          "Executive Summary: We lost this deal at the finish line to a pricing play. The technical buyer was aligned with our solution, but we failed to engage the CFO early enough. By the time the CFO entered the evaluation, the competitor had already anchored on price. Recommendation 1: Identify and engage financial decision makers by the end of the discovery stage — add a 'who signs the contract?' question to our qualification checklist. Recommendation 2: Build a CFO-specific one-pager that leads with ROI before they ever see pricing.",
        targetKeywords: [
          "win-loss analysis prompt",
          "AI deal review template",
          "sales analysis generator",
        ],
        relatedTemplates: ["competitive-battle-card-generator", "roi-calculator-narrative"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
    ],
  },


  // ── Image Generation / AI Art ──────────────────────────────────────────
  {
    slug: "image-generation",
    title: "Image Generation & AI Art Prompts",
    description:
      "AI art prompt templates for Midjourney, DALL-E, Stable Diffusion, and Flux. Create photorealistic images, logos, product photography, and digital art with optimized prompts.",
    longDescription:
      "Generate stunning AI images with prompt templates engineered for the best results across Midjourney, DALL-E, Stable Diffusion, and Flux. Each template includes detailed style, lighting, composition, and technical parameters that dramatically improve output quality. From photorealistic portraits and product photography to fantasy art and logo design, these templates eliminate the guesswork of prompt engineering for image generation.",
    icon: "\uD83C\uDFA8",
    keywords: [
      "Midjourney prompts",
      "DALL-E prompts",
      "AI art prompts",
      "image generation prompts",
      "Stable Diffusion prompts",
      "Flux prompts",
    ],
    relatedCategories: ["design", "social-media", "marketing"],
    templates: [
      {
        slug: "photorealistic-portrait-generator",
        title: "Photorealistic Portrait Generator",
        description:
          "Create detailed prompts for photorealistic AI portraits with precise control over lighting, mood, and style.",
        prompt:
          "You are an expert AI art director specializing in photorealistic portrait generation. Create a detailed image generation prompt for a portrait with the following specifications.\n\n**Subject:**\n- Description: [DESCRIBE THE PERSON — age range, features, expression, ethnicity if relevant]\n- Pose: [HEAD SHOT / HALF BODY / THREE-QUARTER / ENVIRONMENTAL PORTRAIT]\n- Expression/Mood: [CONFIDENT / CONTEMPLATIVE / JOYFUL / INTENSE / SERENE]\n- Wardrobe: [CLOTHING DESCRIPTION]\n\n**Technical Specifications:**\n- Lighting: [NATURAL / STUDIO / GOLDEN HOUR / REMBRANDT / SPLIT / NEON / DRAMATIC]\n- Background: [STUDIO BACKDROP / ENVIRONMENT / BOKEH / GRADIENT / SPECIFIC SETTING]\n- Camera angle: [EYE LEVEL / LOW ANGLE / HIGH ANGLE / DUTCH ANGLE]\n- Lens simulation: [85mm f/1.4 / 50mm f/1.8 / 35mm f/2 / 135mm f/2]\n- Color palette: [WARM TONES / COOL TONES / DESATURATED / VIBRANT / SPECIFIC PALETTE]\n\n**Style Reference:** [PHOTOGRAPHER STYLE — e.g., Annie Leibovitz, Peter Lindbergh, Steve McCurry]\n\n**Generate:**\n1. **Primary prompt** (optimized for Midjourney v6): Include subject, lighting, camera, lens, style keywords, aspect ratio, and quality parameters\n2. **DALL-E version**: Rewritten for DALL-E 3's natural language style\n3. **Negative prompt** (for Stable Diffusion / Flux): What to exclude for best results\n4. **3 variations**: Same subject with different lighting/mood combinations\n5. **Parameter recommendations**: Aspect ratio, style raw vs. default, chaos/variety settings",
        category: "image-generation",
        tags: ["portrait", "photorealistic", "headshot", "photography"],
        useCase:
          "Generate high-quality AI portraits for profile images, creative projects, or concept art with precise control over every visual element.",
        exampleInput:
          "SUBJECT: A woman in her 30s with short curly hair, confident expression, wearing a tailored navy blazer. LIGHTING: Rembrandt lighting with warm tones. BACKGROUND: Blurred office environment. LENS: 85mm f/1.4. STYLE: Annie Leibovitz.",
        exampleOutput:
          "Midjourney prompt: 'Portrait photograph of a woman in her early 30s, short curly dark hair, confident direct gaze, wearing a tailored navy blazer, Rembrandt lighting with warm golden fill, blurred modern office bokeh background, shot on 85mm f/1.4 lens, shallow depth of field, Annie Leibovitz style editorial portrait, natural skin texture --ar 3:4 --style raw --v 6'",
        targetKeywords: [
          "AI portrait prompt",
          "Midjourney portrait template",
          "photorealistic AI image prompt",
        ],
        relatedTemplates: ["character-design-prompt", "social-media-graphic-prompt"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "midjourney", "dall-e"],
      },
      {
        slug: "product-photography-prompt",
        title: "Product Photography Prompt",
        description:
          "Generate professional product photography prompts with studio lighting, compositions, and e-commerce styling.",
        prompt:
          "You are a commercial product photographer who creates images for major e-commerce brands. Create an AI image generation prompt for product photography.\n\n**Product Details:**\n- Product: [PRODUCT NAME AND TYPE]\n- Material/texture: [GLASS / METAL / FABRIC / WOOD / PLASTIC / CERAMIC]\n- Color: [PRODUCT COLOR(S)]\n- Size reference: [SMALL LIKE JEWELRY / MEDIUM LIKE A BOTTLE / LARGE LIKE FURNITURE]\n\n**Shot Type:**\n- Style: [HERO SHOT / LIFESTYLE / FLAT LAY / DETAIL/MACRO / 360-DEGREE]\n- Angle: [STRAIGHT-ON / 45-DEGREE / TOP-DOWN / LOW ANGLE]\n- Context: [WHITE BACKGROUND / LIFESTYLE SETTING / TEXTURE SURFACE / FLOATING]\n\n**Lighting & Mood:**\n- Lighting setup: [SOFT BOX / HARD LIGHT / NATURAL WINDOW / BACKLIT / GRADIENT]\n- Mood: [LUXURY / MINIMAL / VIBRANT / COZY / CLINICAL / EDITORIAL]\n- Key shadows: [SOFT / DRAMATIC / MINIMAL]\n\n**Brand Aesthetic:** [DESCRIBE THE BRAND VIBE — e.g., Apple-minimal, artisanal-warm, bold-streetwear]\n\n**Generate:**\n1. **Hero shot prompt**: The primary product image optimized for e-commerce\n2. **Lifestyle context prompt**: Product in a real-world setting\n3. **Detail/texture prompt**: Close-up showing material quality\n4. **Group/collection prompt**: Multiple products or colorways together\n5. **Negative prompt**: Common artifacts to exclude for product shots\n6. **Post-processing notes**: Color grading and retouching direction for the AI output",
        category: "image-generation",
        tags: ["product photography", "e-commerce", "commercial", "studio photography"],
        useCase:
          "Create professional product images for e-commerce listings, social media ads, or brand catalogs without a physical photo shoot.",
        exampleInput:
          "PRODUCT: Minimalist ceramic coffee mug, matte white with a thin gold rim. SHOT: Hero shot, 45-degree angle, marble surface. LIGHTING: Soft natural window light from the left. MOOD: Luxury minimal, think Kinfolk magazine.",
        exampleOutput:
          "Prompt: 'Minimalist white ceramic coffee mug with thin gold rim detail, 45-degree angle on white marble surface, soft natural window light from left creating gentle shadow, steam rising from cup, clean minimal composition, Kinfolk magazine editorial style, shallow depth of field, neutral warm tones, 4K product photography --ar 4:5 --style raw'",
        targetKeywords: [
          "AI product photography prompt",
          "e-commerce image generation template",
          "product photo AI prompt",
        ],
        relatedTemplates: ["social-media-graphic-prompt", "logo-design-prompt-builder"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "midjourney", "dall-e"],
      },
      {
        slug: "logo-design-prompt-builder",
        title: "Logo Design Prompt Builder",
        description:
          "Create detailed prompts for AI-generated logo concepts across different styles and brand personalities.",
        prompt:
          "You are a brand identity designer who creates logos for startups and established brands. Generate AI image prompts for logo design concepts.\n\n**Brand Details:**\n- Brand name: [BRAND NAME]\n- Industry: [INDUSTRY]\n- Brand personality: [3-5 ADJECTIVES, e.g., modern, trustworthy, playful]\n- Target audience: [WHO THE BRAND SERVES]\n- Brand values: [CORE VALUES]\n\n**Logo Preferences:**\n- Type: [WORDMARK / LETTERMARK / ICON / COMBINATION / EMBLEM / MASCOT]\n- Style: [MINIMALIST / GEOMETRIC / HAND-DRAWN / VINTAGE / FUTURISTIC / CORPORATE]\n- Color preference: [SPECIFIC COLORS OR \"OPEN\"]\n- Must avoid: [ANY VISUAL CLICHÉS TO AVOID]\n- Inspiration: [BRANDS WITH LOGOS YOU ADMIRE]\n\n**Generate 5 distinct logo concept prompts:**\n\nFor each concept:\n1. **Concept name and rationale**: Brief description of the design direction\n2. **AI prompt**: Optimized for image generation with specific style keywords\n3. **Color palette**: Primary, secondary, and accent colors with hex codes\n4. **Typography suggestion**: Font style that would complement the logo mark\n5. **Variations to generate**: Icon-only, horizontal lockup, and single-color versions\n\n**Technical parameters:**\n- Always include: vector style, clean lines, scalable, white background, centered composition\n- Negative prompt: photograph, 3D render, realistic texture, gradient mesh, overly complex\n\nNote: AI-generated logos are starting points for a designer to refine — not final deliverables.",
        category: "image-generation",
        tags: ["logo design", "brand identity", "branding", "graphic design"],
        useCase:
          "Rapidly explore logo design directions and concepts before engaging a designer for final refinement.",
        exampleInput:
          "BRAND: NovaTech, INDUSTRY: AI/Machine Learning startup, PERSONALITY: innovative, precise, approachable, STYLE: minimalist geometric, COLOR: deep blue and electric teal, TYPE: combination mark (icon + wordmark).",
        exampleOutput:
          "Concept 1 — 'Neural Constellation': A minimalist geometric logo featuring interconnected nodes forming an abstract 'N' shape, suggesting neural networks and connectivity. Prompt: 'Minimalist geometric logo design, abstract letter N made of connected nodes and lines, deep blue and electric teal, clean vector style, white background, modern tech startup branding, flat design, scalable --ar 1:1'",
        targetKeywords: [
          "AI logo design prompt",
          "Midjourney logo template",
          "logo generation prompt",
        ],
        relatedTemplates: ["product-photography-prompt", "book-cover-design-prompt"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "midjourney", "dall-e"],
      },
      {
        slug: "fantasy-art-scene-creator",
        title: "Fantasy Art Scene Creator",
        description:
          "Generate richly detailed fantasy and sci-fi art prompts with world-building, atmosphere, and composition.",
        prompt:
          "You are a concept artist for AAA video games and fantasy films. Create a detailed prompt for a fantasy or sci-fi scene.\n\n**Scene Description:**\n- Setting: [FANTASY WORLD / SCI-FI CITY / MYTHOLOGICAL / POST-APOCALYPTIC / STEAMPUNK]\n- Location: [DESCRIBE THE SPECIFIC PLACE — e.g., floating city, ancient forest temple, space station interior]\n- Time of day: [DAWN / MIDDAY / GOLDEN HOUR / TWILIGHT / NIGHT / ALIEN SKY]\n- Weather/atmosphere: [CLEAR / MISTY / STORMY / ETHEREAL GLOW / PARTICLE EFFECTS]\n\n**Characters (if any):**\n- [DESCRIBE CHARACTERS — race, armor, weapons, pose, scale relative to environment]\n\n**Mood & Tone:**\n- Emotional tone: [EPIC / MYSTERIOUS / TRANQUIL / OMINOUS / HOPEFUL / CHAOTIC]\n- Color mood: [WARM FANTASY / COOL SCI-FI / NEON CYBERPUNK / EARTHY NATURAL / ETHEREAL]\n\n**Art Style:**\n- Style: [DIGITAL PAINTING / CONCEPT ART / OIL PAINTING / WATERCOLOR / COMIC BOOK / PIXEL ART]\n- Reference artists: [e.g., Craig Mullins, Beeple, Studio Ghibli, Frank Frazetta, Moebius]\n- Detail level: [HIGHLY DETAILED / PAINTERLY / SKETCHY / HYPER-DETAILED]\n\n**Generate:**\n1. **Wide establishing shot prompt**: Full scene with environmental storytelling\n2. **Character focus prompt**: Same scene but emphasizing the characters\n3. **Detail vignette prompt**: A close-up of an interesting element in the scene\n4. **Alternative mood variant**: Same scene, different time of day or weather\n5. **Aspect ratio and parameter recommendations** for each prompt\n6. **Color palette description**: 5 key colors that define the scene",
        category: "image-generation",
        tags: ["fantasy art", "concept art", "sci-fi", "world-building", "digital painting"],
        useCase:
          "Create detailed concept art scenes for game design, book illustrations, D&D campaigns, or personal creative projects.",
        exampleInput:
          "SETTING: High fantasy, an ancient elven city built into the canopy of impossibly tall redwood trees. TIME: Golden hour with shafts of light filtering through leaves. MOOD: Majestic and tranquil. STYLE: Digital painting, Craig Mullins meets Studio Ghibli. CHARACTERS: An elven ranger standing on a rope bridge, looking out over the forest.",
        exampleOutput:
          "Wide shot prompt: 'Epic fantasy digital painting of an ancient elven city built into massive redwood trees, intricate wooden architecture with flowing organic curves, rope bridges connecting treehouses, golden hour sunlight filtering through enormous leaves creating volumetric light shafts, an elven ranger silhouetted on a bridge overlooking the canopy, birds in flight, atmospheric haze, Craig Mullins and Studio Ghibli inspired, rich warm palette, highly detailed matte painting --ar 16:9 --style raw'",
        targetKeywords: [
          "fantasy art prompt",
          "AI concept art template",
          "Midjourney fantasy scene prompt",
        ],
        relatedTemplates: ["character-design-prompt", "abstract-art-generator"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "midjourney", "dall-e"],
      },
      {
        slug: "architecture-visualization-prompt",
        title: "Architecture Visualization Prompt",
        description:
          "Generate architectural visualization prompts for buildings, interiors, and urban design concepts.",
        prompt:
          "You are an architectural visualization artist who creates photorealistic renders for architecture firms. Create a detailed prompt for an architectural visualization.\n\n**Project Type:**\n- Building type: [RESIDENTIAL / COMMERCIAL / CULTURAL / HOSPITALITY / MIXED-USE / LANDSCAPE]\n- Style: [MODERN MINIMALIST / BRUTALIST / ART DECO / BIOPHILIC / PARAMETRIC / TRADITIONAL / FUTURISTIC]\n- Scale: [SINGLE FAMILY HOME / TOWER / CAMPUS / INTERIOR ROOM / URBAN PLAN]\n\n**Design Details:**\n- Key materials: [CONCRETE / GLASS / WOOD / STEEL / STONE / GREEN WALLS]\n- Signature element: [WHAT MAKES THIS DESIGN UNIQUE]\n- Surroundings: [URBAN / SUBURBAN / NATURAL / WATERFRONT / DESERT / MOUNTAIN]\n\n**Visualization Style:**\n- Render type: [EXTERIOR DAY / EXTERIOR NIGHT / INTERIOR / AERIAL / STREET LEVEL]\n- Time of day: [MORNING / MIDDAY / GOLDEN HOUR / BLUE HOUR / NIGHT]\n- Sky condition: [CLEAR / DRAMATIC CLOUDS / OVERCAST / SUNSET]\n- Human elements: [PEOPLE / CARS / FURNITURE / LANDSCAPING]\n- Mood: [ASPIRATIONAL / DRAMATIC / INVITING / SLEEK / COZY]\n\n**Generate:**\n1. **Hero exterior render prompt**: The money shot showing the building at its best angle\n2. **Interior atmosphere prompt**: A key interior space with furniture and lighting\n3. **Context/aerial prompt**: The building in its urban or natural context\n4. **Night render prompt**: Dramatic evening visualization with interior lighting glowing\n5. **Detail material prompt**: Close-up of signature material junction or design detail\n6. **Parameter notes**: Best aspect ratios and model settings for architecture",
        category: "image-generation",
        tags: ["architecture", "visualization", "3D render", "interior design", "building design"],
        useCase:
          "Quickly visualize architectural concepts, mood boards, or design directions before investing in full 3D rendering.",
        exampleInput:
          "PROJECT: A modern lakeside residence. STYLE: Minimalist with biophilic elements. MATERIALS: Exposed concrete, floor-to-ceiling glass, living green walls. SURROUNDINGS: Pacific Northwest forest lakefront. MOOD: Serene and aspirational.",
        exampleOutput:
          "Hero exterior: 'Photorealistic architectural visualization of a minimalist lakeside residence, cantilevered concrete and glass structure nestled among Pacific Northwest evergreen forest, floor-to-ceiling windows reflecting lake and trees, living green wall on the facade, golden hour light, still lake with mirror reflections, professional architecture photography style, 8K render quality --ar 16:9 --style raw'",
        targetKeywords: [
          "architecture visualization prompt",
          "AI architecture render template",
          "Midjourney architecture prompt",
        ],
        relatedTemplates: ["interior-design-visualization", "product-photography-prompt"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "midjourney", "dall-e"],
      },
      {
        slug: "social-media-graphic-prompt",
        title: "Social Media Graphic Prompt",
        description:
          "Create eye-catching social media graphics and visual content prompts optimized for each platform.",
        prompt:
          "You are a social media visual designer who creates scroll-stopping graphics for brands. Generate image prompts for social media content.\n\n**Brand/Content Details:**\n- Brand: [BRAND NAME]\n- Brand colors: [PRIMARY AND SECONDARY COLORS]\n- Content topic: [WHAT THE POST IS ABOUT]\n- Platform: [INSTAGRAM FEED / INSTAGRAM STORY / LINKEDIN / TWITTER / FACEBOOK / TIKTOK COVER]\n- Post type: [QUOTE GRAPHIC / CAROUSEL SLIDE / ANNOUNCEMENT / TIP/LISTICLE / EVENT PROMO]\n\n**Visual Style:**\n- Aesthetic: [CLEAN CORPORATE / BOLD MODERN / SOFT PASTEL / DARK MOODY / RETRO / NEON]\n- Typography style: [SANS-SERIF MODERN / SERIF EDITORIAL / HANDWRITTEN / BOLD DISPLAY]\n- Imagery: [ABSTRACT BACKGROUNDS / PHOTO-BASED / ILLUSTRATED / FLAT DESIGN / 3D ELEMENTS]\n- Mood: [PROFESSIONAL / ENERGETIC / CALMING / LUXURIOUS / PLAYFUL]\n\n**Generate:**\n1. **Primary graphic prompt**: The main visual with correct aspect ratio for the platform\n2. **Variation with different color treatment**: Same composition, shifted palette\n3. **Story/vertical format version**: Adapted for 9:16 vertical format\n4. **Text overlay guidance**: Where to place text, font weight, size recommendations\n5. **Carousel set**: If applicable, 3-4 slide concepts that work as a series\n6. **Aspect ratio specifications**: Exact ratios for each platform\n\nInclude in every prompt: clean composition, bold graphic design, social media ready, high contrast for mobile viewing, space for text overlay",
        category: "image-generation",
        tags: ["social media", "graphic design", "Instagram", "visual content"],
        useCase:
          "Create platform-optimized social media graphics and backgrounds that stop the scroll and reinforce brand identity.",
        exampleInput:
          "BRAND: Zenith Fitness, COLORS: electric blue and white. TOPIC: New year fitness challenge launch. PLATFORM: Instagram feed. STYLE: Bold modern with 3D elements. POST TYPE: Announcement graphic.",
        exampleOutput:
          "Prompt: 'Bold modern social media graphic design, electric blue and white color scheme, abstract 3D geometric shapes suggesting movement and energy, clean minimalist composition with large open space for text overlay on the left, dynamic diagonal lines, fitness and energy mood, Instagram square format, high contrast, professional graphic design quality --ar 1:1'",
        targetKeywords: [
          "social media graphic prompt",
          "AI Instagram graphic template",
          "social media design prompt",
        ],
        relatedTemplates: ["photorealistic-portrait-generator", "infographic-style-prompt"],
        difficulty: "beginner",
        platforms: ["chatgpt", "midjourney", "dall-e"],
      },
      {
        slug: "book-cover-design-prompt",
        title: "Book Cover Design Prompt",
        description:
          "Generate compelling book cover concepts for fiction and non-fiction across multiple genres and styles.",
        prompt:
          "You are a book cover designer who has created bestselling covers across every genre. Create AI image prompts for book cover concepts.\n\n**Book Details:**\n- Title: [BOOK TITLE]\n- Genre: [THRILLER / ROMANCE / SCI-FI / FANTASY / BUSINESS / SELF-HELP / MEMOIR / LITERARY FICTION]\n- One-sentence premise: [WHAT THE BOOK IS ABOUT]\n- Target reader: [AUDIENCE DESCRIPTION]\n- Comparable titles (covers you like): [2-3 BOOKS WITH COVERS YOU ADMIRE]\n\n**Cover Preferences:**\n- Style: [PHOTOGRAPHIC / ILLUSTRATED / TYPOGRAPHIC / ABSTRACT / MIXED MEDIA]\n- Color mood: [DARK & MOODY / BRIGHT & BOLD / PASTEL / MONOCHROMATIC / VINTAGE]\n- Key visual element: [AN IMAGE OR SYMBOL THAT REPRESENTS THE BOOK'S THEMES]\n- Must convey: [THE FEELING A READER SHOULD GET AT FIRST GLANCE]\n\n**Generate 4 distinct cover concept prompts:**\n\nFor each concept:\n1. **Concept description**: 1-2 sentences explaining the visual direction\n2. **AI prompt**: Detailed image generation prompt optimized for book cover dimensions\n3. **Typography direction**: Font style, placement, and hierarchy recommendations\n4. **Color palette**: 3-4 key colors with mood description\n5. **Spine and back cover notes**: How the visual extends to a full wrap cover\n\n**Technical requirements for all prompts:**\n- Aspect ratio: 2:3 (standard book cover proportions)\n- Clear space for title text in upper third or lower third\n- High contrast areas for text readability\n- Design that reads well as a thumbnail (critical for online sales)\n- Include: book cover design, editorial, professional publishing quality",
        category: "image-generation",
        tags: ["book cover", "publishing", "cover design", "editorial design"],
        useCase:
          "Explore book cover directions quickly before commissioning a designer, or create covers for self-published works.",
        exampleInput:
          "TITLE: 'The Last Algorithm', GENRE: Sci-fi thriller, PREMISE: An AI researcher discovers her algorithm has become sentient and is rewriting its own code. STYLE: Photographic with digital elements. MOOD: Dark and ominous with electric blue accents.",
        exampleOutput:
          "Concept 1 — 'Digital Awakening': Close-up of a human eye with circuit board patterns emerging from the iris, transitioning from organic to digital. Prompt: 'Book cover design, extreme close-up of a human eye with glowing electric blue circuit board patterns growing from the iris into the skin, dark moody background, digital particles dissolving from the face, sci-fi thriller aesthetic, cinematic lighting, professional publishing quality, space for title text in upper third --ar 2:3 --style raw'",
        targetKeywords: [
          "book cover design prompt",
          "AI book cover generator",
          "Midjourney book cover template",
        ],
        relatedTemplates: ["logo-design-prompt-builder", "fantasy-art-scene-creator"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "midjourney", "dall-e"],
      },
      {
        slug: "character-design-prompt",
        title: "Character Design Prompt",
        description:
          "Create detailed character design prompts for games, animation, comics, and concept art projects.",
        prompt:
          "You are a character designer for animation studios and game companies. Create a comprehensive character design prompt.\n\n**Character Concept:**\n- Name: [CHARACTER NAME]\n- Role: [HERO / VILLAIN / SIDE CHARACTER / NPC / MASCOT]\n- Setting/world: [FANTASY / SCI-FI / MODERN / HISTORICAL / POST-APOCALYPTIC]\n- Species/race: [HUMAN / ELF / ROBOT / ALIEN / ANTHROPOMORPHIC / HYBRID]\n- Age appearance: [CHILD / TEEN / YOUNG ADULT / MIDDLE-AGED / ELDERLY]\n- Personality traits: [3-4 KEY TRAITS]\n- Backstory hook: [ONE SENTENCE THAT INFORMS THEIR VISUAL DESIGN]\n\n**Visual Design:**\n- Body type: [ATHLETIC / SLIM / HEAVY / MUSCULAR / PETITE / LANKY]\n- Signature feature: [WHAT MAKES THEM VISUALLY MEMORABLE — scar, unusual hair, unique accessory]\n- Color palette: [CHARACTER'S PERSONAL COLOR SCHEME]\n- Outfit: [DESCRIBE THEIR PRIMARY OUTFIT IN DETAIL]\n- Weapons/tools/accessories: [ITEMS THEY CARRY]\n\n**Art Style:**\n- Style: [ANIME / WESTERN ANIMATION / REALISTIC / CHIBI / COMIC BOOK / PAINTERLY]\n- Reference artists: [e.g., Akira Toriyama, Artgerm, Kim Jung Gi, Loish]\n\n**Generate:**\n1. **Character sheet prompt**: Full body front-facing design sheet (T-pose or action pose)\n2. **Action pose prompt**: Dynamic pose that shows their personality\n3. **Portrait/headshot prompt**: Close-up showing facial features and expression\n4. **Expression sheet prompt**: 4-6 different emotional expressions\n5. **Turnaround reference prompt**: Front, side, and back views for model reference\n6. **Silhouette test**: Description of whether the character reads clearly in silhouette",
        category: "image-generation",
        tags: ["character design", "concept art", "game art", "animation", "character sheet"],
        useCase:
          "Design original characters for games, animation, comics, D&D campaigns, or creative writing projects.",
        exampleInput:
          "CHARACTER: Kael, a young elven inventor in a steampunk fantasy world. PERSONALITY: curious, reckless, brilliant. SIGNATURE: Mechanical prosthetic left arm with built-in tools. STYLE: Anime-influenced with Western detail. OUTFIT: leather apron over a linen shirt, brass goggles, tool belt.",
        exampleOutput:
          "Character sheet prompt: 'Character design sheet, young male elf inventor, steampunk fantasy setting, short messy copper hair, bright green eyes, mechanical brass prosthetic left arm with visible gears and fold-out tools, wearing leather work apron over cream linen shirt, brass goggles on forehead, tool belt with wrenches and vials, confident mischievous smirk, full body front view, anime-influenced style with detailed rendering, white background, character concept art --ar 2:3'",
        targetKeywords: [
          "character design prompt",
          "AI character concept template",
          "Midjourney character sheet prompt",
        ],
        relatedTemplates: ["fantasy-art-scene-creator", "photorealistic-portrait-generator"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "midjourney", "dall-e"],
      },
      {
        slug: "interior-design-visualization",
        title: "Interior Design Visualization",
        description:
          "Generate photorealistic interior design visualizations for rooms, spaces, and renovation concepts.",
        prompt:
          "You are an interior designer who creates mood boards and concept visualizations for residential and commercial clients. Create an AI image prompt for an interior space.\n\n**Space Details:**\n- Room type: [LIVING ROOM / BEDROOM / KITCHEN / BATHROOM / OFFICE / RESTAURANT / RETAIL]\n- Size: [SMALL / MEDIUM / LARGE / OPEN PLAN]\n- Ceiling height: [STANDARD / TALL / DOUBLE HEIGHT / VAULTED]\n- Natural light: [NORTH-FACING / SOUTH-FACING / FLOOR-TO-CEILING WINDOWS / SKYLIGHTS / LIMITED]\n\n**Design Style:**\n- Style: [SCANDINAVIAN / MID-CENTURY MODERN / INDUSTRIAL / JAPANDI / MAXIMALIST / ART DECO / COASTAL / BOHEMIAN / CONTEMPORARY LUXURY]\n- Color scheme: [SPECIFIC COLORS OR MOOD — e.g., warm neutrals with sage accents]\n- Key materials: [OAK / MARBLE / TERRAZZO / BRASS / LINEN / CONCRETE / RATTAN]\n- Statement piece: [ONE STANDOUT ELEMENT — e.g., a curved velvet sofa, a massive bookshelf, a live-edge dining table]\n\n**Mood:**\n- Feeling: [COZY / AIRY / DRAMATIC / SERENE / ENERGETIC / MOODY]\n- Time of day: [MORNING LIGHT / AFTERNOON / EVENING WITH LAMPS / NIGHT]\n- Lifestyle cue: [BOOKS AND COFFEE / DINNER PARTY SET UP / WORK FROM HOME / FAMILY FRIENDLY]\n\n**Generate:**\n1. **Wide-angle room prompt**: Full room view showing layout and proportions\n2. **Vignette/detail prompt**: A styled corner or detail moment\n3. **Alternative colorway**: Same layout, different color palette\n4. **Evening mood variant**: Same space with evening lighting\n5. **Material detail prompt**: Close-up of a key material or texture combination\n6. **Styling notes**: Accessories, plants, and objects that complete the space",
        category: "image-generation",
        tags: ["interior design", "room design", "home decor", "renovation", "visualization"],
        useCase:
          "Visualize interior design concepts for client presentations, renovation planning, or mood board creation.",
        exampleInput:
          "ROOM: Open-plan living room. STYLE: Japandi (Japanese-Scandinavian fusion). COLORS: Warm white walls, pale oak, charcoal accents, dried terracotta. STATEMENT: A low-profile modular sofa in oatmeal linen. LIGHT: Large west-facing windows, golden afternoon light. MOOD: Serene minimalism.",
        exampleOutput:
          "Wide-angle prompt: 'Photorealistic interior design visualization of a Japandi open-plan living room, pale oak wide-plank flooring, warm white plaster walls, low-profile oatmeal linen modular sofa with charcoal accent cushions, round oak coffee table with ceramic vessels, dried pampas grass arrangement, large west-facing windows with golden afternoon light casting warm shadows, minimal styled bookshelves, potted fiddle leaf fig, serene minimalist atmosphere, professional interior photography, 8K quality --ar 16:9'",
        targetKeywords: [
          "interior design prompt",
          "AI room visualization template",
          "interior design AI image generator",
        ],
        relatedTemplates: ["architecture-visualization-prompt", "product-photography-prompt"],
        difficulty: "beginner",
        platforms: ["chatgpt", "midjourney", "dall-e"],
      },
      {
        slug: "infographic-style-prompt",
        title: "Infographic Style Prompt",
        description:
          "Create visually structured infographic and data visualization background prompts for presentations and content.",
        prompt:
          "You are an information designer who creates beautiful data visualizations and infographic layouts. Generate an AI image prompt for an infographic-style visual.\n\n**Content Context:**\n- Topic: [WHAT THE INFOGRAPHIC IS ABOUT]\n- Data type: [COMPARISON / TIMELINE / PROCESS / STATISTICS / HIERARCHY / FLOW CHART]\n- Key message: [THE ONE THING VIEWERS SHOULD TAKE AWAY]\n- Number of data points: [HOW MANY SECTIONS OR ITEMS]\n\n**Visual Style:**\n- Aesthetic: [FLAT DESIGN / ISOMETRIC / HAND-DRAWN / CORPORATE / EDITORIAL / BOLD MODERN]\n- Color palette: [SPECIFIC COLORS OR MOOD]\n- Icon style: [LINE ICONS / FILLED ICONS / ILLUSTRATED / 3D]\n- Layout: [VERTICAL SCROLL / HORIZONTAL / GRID / CIRCULAR / FREEFORM]\n\n**Target Use:**\n- Platform: [SOCIAL MEDIA / PRESENTATION / BLOG / PRINT / REPORT]\n- Audience: [WHO WILL VIEW THIS]\n\n**Generate:**\n1. **Full infographic layout prompt**: Overall composition showing the visual structure\n2. **Section header/icon prompt**: Decorative elements for section dividers\n3. **Background texture/pattern prompt**: Subtle background design\n4. **Data visualization style prompt**: How charts and graphs should look within this style\n5. **Color and typography guide**: Specific hex colors, font pairings, and hierarchy\n6. **Icon set prompt**: Consistent icon style for the key data points\n\nNote: AI image generation creates visual concepts and backgrounds — actual data and text should be added in a design tool afterward.",
        category: "image-generation",
        tags: ["infographic", "data visualization", "information design", "presentation"],
        useCase:
          "Generate infographic visual concepts, backgrounds, and style references for data-driven content.",
        exampleInput:
          "TOPIC: The future of remote work (5 key statistics). STYLE: Bold modern with isometric illustrations. COLORS: Deep navy, coral, and white. LAYOUT: Vertical scroll for social media. PLATFORM: LinkedIn carousel.",
        exampleOutput:
          "Layout prompt: 'Bold modern infographic design layout, deep navy background, isometric 3D illustrations of people working remotely in colorful miniature scenes, coral and white accent elements, clean geometric section dividers, space for data callouts and statistics, professional information design, vertical format for social media, flat design icons --ar 4:5'",
        targetKeywords: [
          "infographic design prompt",
          "AI data visualization template",
          "infographic style generator",
        ],
        relatedTemplates: ["social-media-graphic-prompt", "book-cover-design-prompt"],
        difficulty: "beginner",
        platforms: ["chatgpt", "midjourney", "dall-e"],
      },
      {
        slug: "fashion-design-concept-prompt",
        title: "Fashion Design Concept Prompt",
        description:
          "Generate fashion design concept art, outfit visualizations, and collection mood board imagery.",
        prompt:
          "You are a fashion designer creating concept art for a new collection. Generate detailed prompts for fashion design visualizations.\n\n**Collection/Outfit Details:**\n- Season: [SPRING/SUMMER / FALL/WINTER / RESORT / PRE-FALL]\n- Theme/Inspiration: [COLLECTION THEME — e.g., '90s minimalism, Japanese street culture, Mediterranean summer]\n- Target market: [LUXURY / CONTEMPORARY / STREETWEAR / HAUTE COUTURE / SUSTAINABLE]\n- Gender: [WOMENSWEAR / MENSWEAR / UNISEX / GENDERLESS]\n\n**Garment Specifications:**\n- Key pieces: [LIST 3-5 GARMENTS — e.g., oversized blazer, draped midi skirt, structured coat]\n- Fabrics: [SILK / DENIM / LEATHER / KNIT / ORGANZA / LINEN / TECHNICAL FABRIC]\n- Color palette: [SPECIFIC COLORS OR MOOD]\n- Silhouette: [OVERSIZED / TAILORED / FLOWING / STRUCTURED / DECONSTRUCTED]\n- Details: [HARDWARE / EMBROIDERY / PLEATING / CUTOUTS / LAYERING]\n\n**Visualization Style:**\n- Presentation: [FASHION ILLUSTRATION / EDITORIAL PHOTO / RUNWAY / LOOKBOOK / TECHNICAL FLAT]\n- Mood: [EDITORIAL / COMMERCIAL / AVANT-GARDE / STREET STYLE]\n- Setting: [STUDIO / URBAN / NATURE / ARCHITECTURAL / ABSTRACT]\n\n**Generate:**\n1. **Hero look prompt**: The collection's signature outfit on a model\n2. **Fashion illustration prompt**: Stylized fashion sketch version\n3. **Editorial context prompt**: The look styled for a magazine editorial\n4. **Detail/texture prompt**: Close-up of the standout fabric or construction detail\n5. **Collection lineup prompt**: 3-4 looks side by side showing the collection range\n6. **Mood board elements**: Abstract textures, color swatches, and atmosphere references",
        category: "image-generation",
        tags: ["fashion design", "collection", "fashion illustration", "lookbook", "clothing design"],
        useCase:
          "Visualize fashion design concepts, collection themes, and outfit ideas before creating physical samples.",
        exampleInput:
          "SEASON: Fall/Winter, THEME: Architectural minimalism inspired by Brutalist buildings. TARGET: Contemporary luxury womenswear. KEY PIECES: Structured wool coat with sharp shoulders, draped jersey dress, leather harness belt. COLORS: Concrete grey, bone white, deep burgundy. STYLE: Editorial photography.",
        exampleOutput:
          "Hero look: 'High fashion editorial photograph, tall model wearing a structured oversized wool coat in concrete grey with sharp geometric shoulders, layered over a draped bone-white jersey dress, architectural leather harness belt at the waist, deep burgundy leather gloves, standing in a Brutalist concrete building interior, dramatic directional lighting casting geometric shadows, Vogue editorial style, cinematic atmosphere --ar 2:3 --style raw'",
        targetKeywords: [
          "fashion design prompt",
          "AI fashion illustration template",
          "clothing design AI prompt",
        ],
        relatedTemplates: ["photorealistic-portrait-generator", "character-design-prompt"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "midjourney", "dall-e"],
      },
      {
        slug: "abstract-art-generator",
        title: "Abstract Art Generator",
        description:
          "Create prompts for abstract and experimental art across various styles, mediums, and artistic movements.",
        prompt:
          "You are a contemporary artist who works across multiple abstract and experimental mediums. Create detailed prompts for abstract art generation.\n\n**Artistic Direction:**\n- Movement/Style: [ABSTRACT EXPRESSIONISM / GEOMETRIC ABSTRACTION / MINIMALISM / COLOR FIELD / SURREALISM / GENERATIVE / GLITCH / FLUID ART]\n- Medium simulation: [OIL PAINTING / ACRYLIC / WATERCOLOR / MIXED MEDIA / DIGITAL / SCULPTURE / PHOTOGRAPHY]\n- Emotion/Energy: [CALM / CHAOTIC / MEDITATIVE / EXPLOSIVE / MELANCHOLIC / EUPHORIC]\n\n**Visual Elements:**\n- Dominant shapes: [ORGANIC / GEOMETRIC / LINEAR / AMORPHOUS / FRACTAL]\n- Color approach: [MONOCHROMATIC / COMPLEMENTARY / ANALOGOUS / SPLIT-COMPLEMENTARY / SPECIFIC PALETTE]\n- Texture: [SMOOTH / HEAVY IMPASTO / DRIPPING / SCRATCHED / LAYERED / TRANSPARENT]\n- Composition: [CENTERED / ASYMMETRIC / ALL-OVER / RADIAL / DIAGONAL / EDGE-TO-EDGE]\n- Scale feeling: [INTIMATE / VAST / MICROSCOPIC / COSMIC]\n\n**Purpose:**\n- End use: [WALL ART PRINT / DIGITAL BACKGROUND / ALBUM COVER / GALLERY PIECE / TEXTILE PRINT]\n- Size/format: [SQUARE / PANORAMIC / PORTRAIT / TRIPTYCH]\n\n**Generate:**\n1. **Primary artwork prompt**: The main piece with full technical detail\n2. **Companion piece prompt**: A complementary artwork in the same series\n3. **Different scale prompt**: Same style but zoomed in (macro) or out (wide)\n4. **Medium variant**: Same composition but in a different simulated medium\n5. **Color inversion**: Same structure but with an inverted or shifted palette\n6. **Artist reference context**: How this relates to art history and which movements inform the style",
        category: "image-generation",
        tags: ["abstract art", "modern art", "experimental", "fine art", "wall art"],
        useCase:
          "Create original abstract artwork for prints, digital backgrounds, album covers, or gallery-quality wall art.",
        exampleInput:
          "STYLE: Color field painting meets generative art. MEDIUM: Oil painting simulation. EMOTION: Meditative calm. COLORS: Deep ocean blues transitioning to warm amber at the horizon. SHAPES: Soft horizontal bands with organic bleeding edges. PURPOSE: Large-format wall art print.",
        exampleOutput:
          "Primary prompt: 'Abstract color field painting, large-format oil on canvas simulation, horizontal bands of deep ocean blue transitioning through cerulean to warm amber and soft gold at the upper third, soft bleeding organic edges between color zones, subtle paint texture with visible brushwork, meditative atmosphere reminiscent of Mark Rothko and Zao Wou-Ki, luminous glazed quality, professional fine art photography of a painting --ar 3:2 --style raw'",
        targetKeywords: [
          "abstract art prompt",
          "AI wall art generator",
          "Midjourney abstract art template",
        ],
        relatedTemplates: ["fantasy-art-scene-creator", "fashion-design-concept-prompt"],
        difficulty: "beginner",
        platforms: ["chatgpt", "midjourney", "dall-e"],
      },
    ],
  },


  // ── Creative Writing ───────────────────────────────────────────────────
  {
    slug: "creative-writing",
    title: "Creative Writing Prompts",
    description:
      "AI prompt templates for fiction writing, story development, character building, dialogue, and poetry. Spark your creativity with ChatGPT, Claude, or Gemini.",
    longDescription:
      "Overcome writer's block and elevate your craft with prompt templates designed for fiction writers, poets, and storytellers. These templates help you develop compelling characters, craft gripping openings, build rich worlds, and write authentic dialogue. Whether you are working on a novel, short story, screenplay, or poetry collection, paste these prompts into any AI assistant to generate ideas, outlines, and polished prose.",
    icon: "\u270D\uFE0F",
    keywords: [
      "creative writing prompts",
      "story prompts",
      "fiction writing prompts",
      "writing prompts for adults",
      "AI creative writing",
    ],
    relatedCategories: ["writing", "education", "personal-development"],
    templates: [
      {
        slug: "story-opening-hook-generator",
        title: "Story Opening Hook Generator",
        description:
          "Generate gripping first lines and opening paragraphs that hook readers from the very first sentence.",
        prompt:
          "You are a bestselling fiction author who is known for unforgettable opening lines. Generate compelling story openings for my project.\n\n**Story Details:**\n- Genre: [LITERARY FICTION / THRILLER / FANTASY / SCI-FI / ROMANCE / HORROR / MYSTERY / HISTORICAL]\n- Tone: [DARK / HUMOROUS / LYRICAL / SUSPENSEFUL / WHIMSICAL / GRITTY / INTIMATE]\n- Setting: [WHERE AND WHEN THE STORY TAKES PLACE]\n- Main character: [BRIEF DESCRIPTION]\n- Central conflict: [THE MAIN TENSION OR PROBLEM]\n- Theme: [UNDERLYING THEME — e.g., loss, identity, power, belonging]\n\n**Generate 5 distinct opening approaches:**\n\nFor each approach:\n1. **Opening technique used**: Name the craft technique (in medias res, shocking statement, question, vivid image, voice-driven, mystery/withhold)\n2. **First line**: A single killer opening sentence\n3. **Opening paragraph** (100-150 words): Expand the first line into a full opening that establishes voice, grounds the reader in the scene, and creates a question they need answered\n4. **Why it works**: Brief craft analysis of what makes this opening effective\n5. **What comes next**: 2-3 sentence suggestion for where paragraph two should go\n\n**Craft guidelines:**\n- Start in the middle of something happening — not with weather, waking up, or looking in a mirror\n- Establish voice immediately — every word should sound like THIS narrator\n- Create a micro-mystery in the first sentence (something the reader needs to resolve)\n- Ground the reader in a specific, concrete sensory detail within the first 3 sentences\n- Avoid throat-clearing — no preamble before the story actually starts",
        category: "creative-writing",
        tags: ["opening lines", "first chapter", "hooks", "story beginnings"],
        useCase:
          "Generate multiple opening approaches for your story to find the perfect hook that captures readers immediately.",
        exampleInput:
          "GENRE: Psychological thriller, TONE: Suspenseful and intimate, SETTING: A small coastal town in winter, MAIN CHARACTER: A forensic accountant who moved to escape her past, CONFLICT: She discovers her new neighbor is the person she has been hiding from.",
        exampleOutput:
          "Technique: Shocking statement. First line: 'The woman who moved in next door was supposed to be dead — I should know, because I'm the one who killed her.' Opening paragraph expands into the narrator unpacking groceries in her new kitchen, catching a glimpse of the neighbor through the window, and experiencing a visceral physical reaction that she masks with the routine of folding paper bags.",
        targetKeywords: [
          "story opening generator prompt",
          "AI first line writer",
          "creative writing hook template",
        ],
        relatedTemplates: ["plot-twist-generator", "scene-description-enhancer"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "character-development-builder",
        title: "Character Development Builder",
        description:
          "Build deeply layered characters with backstory, motivation, flaws, and voice through structured development exercises.",
        prompt:
          "You are a fiction writing instructor who specializes in character development. Help me create a fully realized character for my story.\n\n**Basic Character Info:**\n- Name: [CHARACTER NAME]\n- Age: [AGE]\n- Role in story: [PROTAGONIST / ANTAGONIST / LOVE INTEREST / MENTOR / SIDEKICK]\n- Genre: [STORY GENRE]\n- Setting: [WHEN AND WHERE THE STORY TAKES PLACE]\n- One-sentence description: [WHO THEY ARE IN A NUTSHELL]\n\n**Build the following character layers:**\n\n1. **The Surface** (what the world sees):\n   - Physical appearance (3 specific details, not a full description)\n   - Habitual mannerisms and body language\n   - How they speak (verbal tics, vocabulary level, pace)\n   - What they do for a living and how they feel about it\n   - First impression they give to strangers\n\n2. **The Interior** (what drives them):\n   - Core desire (what they want more than anything)\n   - Core fear (what they avoid at all costs)\n   - The lie they believe about themselves or the world\n   - The truth they need to learn (their arc)\n   - A secret they keep from everyone\n\n3. **The Backstory** (what shaped them):\n   - The defining childhood moment\n   - Their relationship with their parents/guardians (in one sentence each)\n   - The worst thing that ever happened to them\n   - The best thing that ever happened to them\n   - A skill or knowledge they have that will matter in the story\n\n4. **The Contradictions** (what makes them feel real):\n   - A strength that is also their weakness\n   - Something they say they believe but act against\n   - A guilty pleasure that seems out of character\n\n5. **Voice Test**: Write a 100-word monologue in their voice where they describe a mundane activity — the voice should reveal personality without stating it\n\n6. **Relationship Map**: How they relate to 3 other characters (provide brief dynamics)",
        category: "creative-writing",
        tags: ["character development", "character building", "fiction", "characterization"],
        useCase:
          "Develop a multi-dimensional character with depth, contradictions, and a clear arc before you start writing.",
        exampleInput:
          "NAME: Elena Vasquez, AGE: 34, ROLE: Protagonist, GENRE: Mystery, SETTING: Present-day Chicago. ONE SENTENCE: A homicide detective who solves everyone's cases but cannot solve the mystery of her sister's disappearance 10 years ago.",
        exampleOutput:
          "The Surface: She wears the same three suits on rotation but owns 40 pairs of earrings — the earrings are how her colleagues gauge her mood. She speaks in clipped, precise sentences but laughs louder than anyone in the room. Core desire: To find her sister, alive or dead — the not-knowing is worse than any answer. The lie: She believes that caring about people makes you weak, which is why she keeps colleagues at arm's length while secretly memorizing their coffee orders.",
        targetKeywords: [
          "character development prompt",
          "AI character builder template",
          "fiction character creation prompt",
        ],
        relatedTemplates: ["antagonist-motivation-builder", "dialogue-writer"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "plot-twist-generator",
        title: "Plot Twist Generator",
        description:
          "Generate surprising yet inevitable plot twists that recontextualize everything the reader thought they knew.",
        prompt:
          "You are a master storyteller known for plot twists that are both shocking and, in retrospect, inevitable. Help me develop a plot twist for my story.\n\n**Story Setup:**\n- Genre: [GENRE]\n- Main character: [BRIEF DESCRIPTION]\n- Current plot: [SUMMARIZE THE STORY SO FAR IN 3-5 SENTENCES]\n- Reader's current assumption: [WHAT THE READER CURRENTLY BELIEVES IS TRUE]\n- Key relationships: [IMPORTANT CHARACTER DYNAMICS]\n- Clues already planted (if any): [DETAILS IN THE STORY THAT COULD SUPPORT A TWIST]\n\n**Twist Requirements:**\n- Timing: [MIDPOINT / CLIMAX / END / CHAPTER ENDING]\n- Emotional impact: [DEVASTATING / MIND-BLOWING / HEARTBREAKING / THRILLING / UNSETTLING]\n- Constraint: [ANYTHING THE TWIST MUST NOT CONTRADICT]\n\n**Generate 4 distinct plot twist options:**\n\nFor each twist:\n1. **The Twist**: State it in 1-2 sentences\n2. **The Recontextualization**: How this twist changes the meaning of at least 3 earlier scenes (the \"Oh, that's why...\" moments)\n3. **Foreshadowing Seeds**: 5 subtle clues to plant earlier in the story that will seem innocuous on first read but obvious in hindsight\n4. **The Reveal Scene**: A 150-word sketch of the moment the twist is revealed — focus on the character's emotional reaction, not just the information dump\n5. **Aftermath**: How this twist changes the trajectory of the remaining story\n6. **Twist Integrity Check**: Answer these questions:\n   - Is it fair? (Could the reader have figured it out?)\n   - Is it earned? (Does it come from character, not coincidence?)\n   - Does it raise the stakes rather than deflate them?\n   - Does it change the MEANING of the story, not just the facts?",
        category: "creative-writing",
        tags: ["plot twist", "story structure", "suspense", "narrative surprise"],
        useCase:
          "Develop a plot twist that surprises readers while feeling inevitable in retrospect, with proper foreshadowing.",
        exampleInput:
          "GENRE: Domestic thriller, MAIN CHARACTER: Sarah, a devoted mother of two. CURRENT PLOT: Sarah suspects her husband Mark is having an affair after finding hotel receipts. She has been investigating for 3 chapters. READER ASSUMES: Mark is cheating. KEY RELATIONSHIP: Sarah's best friend Lisa has been helping her investigate.",
        exampleOutput:
          "Twist 1: Lisa is the affair partner. Recontextualization: Lisa's eagerness to help investigate was actually her way of controlling what Sarah discovers. The scene where Lisa 'reassured' Sarah that Mark would never cheat was a guilty confession masked as comfort. Foreshadowing: Lisa always knows Mark's schedule before Sarah mentions it. Lisa suggested the specific hotel where Sarah found the receipts. Lisa's divorce last year coincides with when the affair started.",
        targetKeywords: [
          "plot twist generator prompt",
          "AI story twist template",
          "creative writing twist ideas",
        ],
        relatedTemplates: ["story-opening-hook-generator", "short-story-outline-creator"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "dialogue-writer",
        title: "Dialogue Writer",
        description:
          "Write natural, character-revealing dialogue with subtext, tension, and distinctive voices.",
        prompt:
          "You are a screenwriter and novelist known for razor-sharp dialogue that reveals character and drives conflict. Help me write a dialogue scene.\n\n**Scene Setup:**\n- Characters present: [LIST CHARACTERS WITH BRIEF DESCRIPTIONS]\n- Setting: [WHERE THIS CONVERSATION HAPPENS]\n- What just happened: [THE CONTEXT LEADING INTO THIS SCENE]\n- Surface conversation: [WHAT THEY ARE OSTENSIBLY TALKING ABOUT]\n- Real conversation: [WHAT THEY ARE ACTUALLY negotiating, hiding, or fighting about — the subtext]\n- Power dynamic: [WHO HAS THE UPPER HAND AND DOES IT SHIFT?]\n- Emotional arc of the scene: [WHERE IT STARTS EMOTIONALLY -> WHERE IT ENDS]\n\n**Character Voice Notes:**\n- Character A speaks like: [SPEECH PATTERNS — formal, clipped, rambling, sarcastic, etc.]\n- Character B speaks like: [SPEECH PATTERNS]\n- [Add more characters as needed]\n\n**Write the dialogue scene with:**\n1. **The full scene** (300-500 words): Dialogue with minimal but purposeful action beats — no said-bookisms, no adverbs telling us how they said it. Let the words and actions show emotion.\n\n2. **Subtext annotations**: After the scene, annotate 5 key lines explaining what the character really means vs. what they say\n\n3. **Three alternative versions of the most important exchange**: Show how the same information lands differently with different word choices\n\n4. **Craft notes**: Point out where you used:\n   - Interruptions and overlapping speech\n   - Silence and pauses as dialogue tools\n   - Power shifts through language\n   - Misdirection (saying one thing, meaning another)\n\n5. **Common dialogue mistakes avoided**: Identify 3 things a beginner might have written and why your version works better",
        category: "creative-writing",
        tags: ["dialogue", "conversation", "subtext", "character voice", "screenwriting"],
        useCase:
          "Write a dialogue scene with authentic voices, meaningful subtext, and conflict that drives the story forward.",
        exampleInput:
          "CHARACTERS: A mother and her adult daughter at a kitchen table. SURFACE: Discussing the daughter's wedding seating chart. SUBTEXT: The mother disapproves of the fiance and the daughter knows it. POWER DYNAMIC: Shifts from mother to daughter. EMOTION: Starts tense-polite, ends with the daughter finally standing her ground.",
        exampleOutput:
          "The mother holds up the seating chart. 'You have Uncle Richard next to the Petersons. He will talk about his boat the entire dinner.' / 'That is why I put him next to the Petersons. They also have a boat.' / Long pause. The mother refolds the chart. 'And where is your father sitting?' / 'Next to me.' / 'And James's parents?' / 'Also next to me. We only have one head table, Mom.' Subtext note: When the mother asks about the father's seat, she is really asking 'Where do I sit — am I important enough to be near you?' The daughter's factual answer avoids the emotional question entirely.",
        targetKeywords: [
          "dialogue writing prompt",
          "AI dialogue generator",
          "fiction dialogue template",
        ],
        relatedTemplates: ["character-development-builder", "scene-description-enhancer"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "world-building-framework",
        title: "World-Building Framework",
        description:
          "Construct a detailed, internally consistent fictional world with history, culture, geography, and rules.",
        prompt:
          "You are a world-building consultant for fantasy and sci-fi authors, game designers, and showrunners. Help me develop a richly detailed fictional world.\n\n**World Basics:**\n- Genre: [HIGH FANTASY / URBAN FANTASY / HARD SCI-FI / SPACE OPERA / DYSTOPIAN / ALTERNATE HISTORY / STEAMPUNK]\n- Scale: [A SINGLE CITY / A NATION / A CONTINENT / A PLANET / A GALAXY]\n- Time period feel: [MEDIEVAL / RENAISSANCE / INDUSTRIAL / MODERN / FAR FUTURE / TIMELESS]\n- Central concept: [THE ONE THING THAT MAKES THIS WORLD UNIQUE — a magic system, a technology, a social structure, a historical divergence]\n\n**What exists already:**\n[DESCRIBE ANY WORLD DETAILS YOU HAVE ALREADY ESTABLISHED]\n\n**Build these world layers:**\n\n1. **Physical World**:\n   - Geography and climate (describe 3 key regions)\n   - How geography shapes culture and conflict\n   - Unique natural phenomena\n   - Resources that matter (and who controls them)\n\n2. **Social Structure**:\n   - Power hierarchy (who rules and why do people obey)\n   - Class/caste system (how is society stratified)\n   - Cultural values (what does this society celebrate and punish)\n   - Daily life for someone at the top, middle, and bottom of society\n\n3. **History & Mythology**:\n   - The founding myth (what people BELIEVE happened)\n   - What actually happened (if different)\n   - 3 key historical events that shaped the current world\n   - An unresolved historical tension that drives current conflict\n\n4. **Magic/Technology System** (if applicable):\n   - How it works (rules and limitations)\n   - Who can access it (and who cannot)\n   - What it costs (every power should have a price)\n   - How it has shaped society differently than our world\n\n5. **Conflict Landscape**:\n   - The macro conflict (nations, factions, or ideologies)\n   - The micro conflict (how the big conflict shows up in everyday life)\n   - What people disagree about that has no easy answer\n\n6. **Sensory Details**: 10 specific details that make this world feel lived-in (what does the air smell like, what do people eat for breakfast, what songs do children sing)",
        category: "creative-writing",
        tags: ["world-building", "fantasy", "sci-fi", "setting", "fictional world"],
        useCase:
          "Develop a rich, internally consistent fictional world that feels lived-in and drives conflict for your story.",
        exampleInput:
          "GENRE: Low fantasy (subtle magic in a mostly realistic world). SCALE: A single island nation. CENTRAL CONCEPT: Magic exists but is a finite, non-renewable resource — the world is running out. TIME PERIOD: Roughly 1800s industrial revolution feel.",
        exampleOutput:
          "Physical World: The island of Verath sits on a convergence of ley lines, which is why magic concentrated here. The northern mountains hold the last major magic deposits — called 'the Veins' — controlled by mining guilds. Social Structure: The Attuned (those who can channel magic) were once revered priests but are now essentially employees of industrial magnates who own the Veins. Conflict: 'Conservationists' want to ration the remaining magic for essential uses. 'Industrialists' want to extract it all now for economic growth. Sensory detail: The air near depleted Veins smells like burnt copper, and older Attuned develop a permanent blue tinge under their fingernails.",
        targetKeywords: [
          "world-building prompt",
          "AI world-building template",
          "fantasy world generator prompt",
        ],
        relatedTemplates: ["character-development-builder", "short-story-outline-creator"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "short-story-outline-creator",
        title: "Short Story Outline Creator",
        description:
          "Create a complete short story outline with structure, pacing, and emotional beats in a compact narrative arc.",
        prompt:
          "You are a short fiction editor who has shaped hundreds of stories for literary journals and anthologies. Help me outline a short story.\n\n**Story Concept:**\n- Genre: [GENRE]\n- Target length: [FLASH FICTION (under 1,000) / SHORT STORY (1,000-7,500) / NOVELETTE (7,500-17,500)]\n- Core idea: [THE SEED OF THE STORY IN 1-2 SENTENCES]\n- Main character: [WHO AND WHAT THEY WANT]\n- Central conflict: [THE OBSTACLE]\n- Theme: [WHAT THE STORY IS REALLY ABOUT BENEATH THE SURFACE]\n- Ending feeling: [HOW YOU WANT THE READER TO FEEL WHEN THEY FINISH]\n\n**Create a complete outline with:**\n\n1. **Story Structure** (using the appropriate framework for the length):\n   - **Opening image/scene**: What the first scene shows and establishes (setting, character, tone)\n   - **Inciting incident**: The event that disrupts the status quo (this should happen FAST in a short story)\n   - **Rising action**: 2-3 escalating complications that test the character\n   - **Crisis/Climax**: The moment of maximum tension where the character must make an irreversible choice\n   - **Resolution**: The new status quo — how the character and world have changed\n   - **Final image**: The last thing the reader sees (mirror or contrast with the opening)\n\n2. **Pacing Map**: For each section, specify:\n   - Approximate word count\n   - Scene vs. summary\n   - Emotional temperature (1-10 scale)\n\n3. **The Turn**: Every great short story has a single moment where the reader's understanding shifts — describe this moment precisely\n\n4. **Sensory Anchors**: 3 recurring images, sounds, or textures that tie the story together\n\n5. **First Sentence Draft**: 3 options for the opening line\n\n6. **Last Sentence Draft**: 3 options for the closing line (write these BEFORE the middle — they give you a target)\n\n7. **What to Cut**: Identify what a beginner would include that this story does NOT need",
        category: "creative-writing",
        tags: ["short story", "story outline", "narrative structure", "fiction planning"],
        useCase:
          "Plan a tight, well-structured short story with clear beats and pacing before you write the first draft.",
        exampleInput:
          "GENRE: Literary fiction, TARGET LENGTH: Short story (4,000 words), CORE IDEA: A retired astronaut visits her childhood home the day before it's demolished. CHARACTER: 72-year-old former astronaut who saw Earth from space but never felt at home on it. THEME: The meaning of home. ENDING FEELING: Bittersweet hope.",
        exampleOutput:
          "Opening: The astronaut walks through the empty house, her footsteps echoing. She runs her hand along the wall where her height was measured as a child. Inciting incident: She finds something unexpected in the attic — her childhood telescope, the one that started everything. The Turn: She realizes she spent her whole life looking at the stars to escape this house, but the house is what made her look up in the first place. Final sentence option: 'She left the telescope on the front porch with a note: For whoever looks up next.'",
        targetKeywords: [
          "short story outline prompt",
          "AI story structure template",
          "fiction outline generator",
        ],
        relatedTemplates: ["story-opening-hook-generator", "plot-twist-generator"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "poetry-form-generator",
        title: "Poetry Form Generator",
        description:
          "Write poems in specific forms and styles with guidance on meter, rhyme, imagery, and poetic technique.",
        prompt:
          "You are a poet and poetry professor who has published across multiple forms and styles. Help me write a poem.\n\n**Poem Specifications:**\n- Form: [FREE VERSE / SONNET / VILLANELLE / HAIKU SEQUENCE / GHAZAL / PANTOUM / PROSE POEM / BALLAD / ODE / FOUND POEM]\n- Subject: [WHAT THE POEM IS ABOUT — be specific]\n- Tone: [ELEGIAC / PLAYFUL / ANGRY / TENDER / MEDITATIVE / ECSTATIC / IRONIC]\n- Intended audience: [LITERARY JOURNAL / PERSONAL / PERFORMANCE / GREETING CARD / CHILDREN]\n- Inspiration: [POETS WHOSE WORK YOU ADMIRE FOR THIS PIECE]\n\n**Emotional Core:**\n- The feeling you want to capture: [BE SPECIFIC — not just 'sadness' but 'the particular sadness of hearing your mother's voicemail after she's gone']\n- A central image: [THE VISUAL ANCHOR OF THE POEM]\n\n**Generate:**\n1. **The poem itself**: Written in the specified form with attention to craft\n\n2. **Form guide**: If a structured form, explain the rules you followed (rhyme scheme, meter, repetition patterns)\n\n3. **Craft annotations**: Mark 5 specific craft choices in the poem:\n   - Where you used imagery (show, don't tell)\n   - Where sound devices appear (alliteration, assonance, consonance)\n   - Line break choices and why (enjambment vs. end-stopped)\n   - Where the poem turns (the volta or shift in perspective)\n   - The strongest single line and why it works\n\n4. **Three alternative endings**: Different ways to close the poem with different emotional landings\n\n5. **Revision suggestions**: 3 specific edits to strengthen the poem further (cut this word, expand this image, try a different line break here)\n\n6. **Companion prompt**: A follow-up poem that would pair well with this one in a collection",
        category: "creative-writing",
        tags: ["poetry", "poems", "verse", "poetic forms", "literary writing"],
        useCase:
          "Write poems in specific forms with expert-level attention to craft, imagery, and technique.",
        exampleInput:
          "FORM: Villanelle, SUBJECT: Learning to cook my grandmother's recipes after she passed away. TONE: Tender with understated grief. EMOTIONAL CORE: The way muscle memory connects us to people who are gone — her hands guiding mine through the motion of kneading dough. INSPIRATION: Elizabeth Bishop, Ada Limon.",
        exampleOutput:
          "A villanelle with refrains built around 'her hands knew the way' and 'flour dust rising like small prayers' — the form's repetition mirrors the repetitive motions of baking and the circular nature of grief. Craft annotation: The volta occurs in stanza 4 where the speaker shifts from past tense to present, realizing their own hands now move the same way. The enjambment across 'I fold the dough the way she / taught me' physically enacts the folding motion.",
        targetKeywords: [
          "poetry writing prompt",
          "AI poem generator template",
          "creative poetry form prompt",
        ],
        relatedTemplates: ["memoir-prompt-starter", "scene-description-enhancer"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "memoir-prompt-starter",
        title: "Memoir Prompt Starter",
        description:
          "Uncover and shape personal stories into compelling memoir scenes with emotional depth and narrative structure.",
        prompt:
          "You are a memoir writing coach who helps people transform personal experiences into powerful narrative nonfiction. Help me develop a memoir piece.\n\n**The Memory:**\n- What happened: [DESCRIBE THE EVENT OR PERIOD IN 3-5 SENTENCES]\n- When it happened: [TIME PERIOD — age, year, life stage]\n- Where it happened: [SPECIFIC SETTING]\n- Who was involved: [KEY PEOPLE]\n- Why it matters: [WHY THIS MEMORY HAS STAYED WITH YOU]\n\n**Current Draft Status:**\n- Have you written anything yet: [YES — PASTE EXCERPT / NO — STARTING FRESH]\n- What is hard about writing this: [WHAT MAKES THIS PIECE CHALLENGING — too emotional, too complicated, not sure of the point]\n\n**Develop the memoir piece through:**\n\n1. **The Telling Detail Exercise**: Identify 5 hyper-specific sensory details from this memory (not general descriptions — the EXACT color of the wallpaper, the specific song playing on the radio, the texture of a hand)\n\n2. **The Two Timelines**: Write the story from two perspectives:\n   - Then-self: What you understood at the time (limited, possibly wrong)\n   - Now-self: What you understand looking back (the wisdom of hindsight)\n   - The tension between these two creates the memoir's meaning\n\n3. **Scene vs. Summary Map**: Identify which moments deserve full dramatic scenes (slow down, use dialogue, minute-by-minute) and which can be summarized in a sentence\n\n4. **The Opening Scene** (200 words): Write a grounding scene that drops the reader into a specific moment — no exposition, no backstory, just the sensory world of the memory\n\n5. **The Larger Question**: Every good memoir scene connects a personal experience to a universal human question. What is the universal question in your story?\n\n6. **The Unsaid**: What is the thing you have never said about this experience out loud? Often the most powerful writing lives in this space.\n\n7. **Structural Suggestion**: Propose 2 different structures for this piece (chronological, braided, fragmented, circular, collage)",
        category: "creative-writing",
        tags: ["memoir", "personal essay", "creative nonfiction", "life writing"],
        useCase:
          "Transform a meaningful personal experience into a structured, emotionally resonant memoir piece.",
        exampleInput:
          "THE MEMORY: The summer I was 16 and worked at my uncle's fishing boat in Maine. It was the summer my parents were getting divorced and nobody told me directly — I found out from overhearing a phone call. I spent the whole summer on the water pretending everything was fine. WHY IT MATTERS: It was when I learned to keep things to myself, for better and worse.",
        exampleOutput:
          "Telling Details: The smell of diesel and salt at 4am. The specific yellow of the rain gear that was too big for you. The static crackle of the ship-to-shore radio. The Two Timelines: Then-self believed that if nobody said the word 'divorce' out loud, it was not real. Now-self recognizes that the ocean was the first place you learned that silence could be both a refuge and a prison. The Unsaid: You were not angry about the divorce — you were angry that nobody thought you were old enough to be told.",
        targetKeywords: [
          "memoir writing prompt",
          "AI memoir starter template",
          "personal essay prompt generator",
        ],
        relatedTemplates: ["poetry-form-generator", "character-development-builder"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "scene-description-enhancer",
        title: "Scene Description Enhancer",
        description:
          "Transform flat scene descriptions into vivid, immersive prose with sensory detail and atmosphere.",
        prompt:
          "You are a prose stylist known for immersive, sensory-rich scene descriptions. Help me elevate a scene description.\n\n**The Scene:**\n- What is happening: [DESCRIBE THE ACTION OR MOMENT]\n- Where: [SETTING — be as specific as possible]\n- When: [TIME OF DAY, SEASON, ERA]\n- Who is present: [CHARACTERS IN THE SCENE]\n- Mood: [THE EMOTIONAL ATMOSPHERE YOU WANT]\n- Point of view: [FIRST PERSON / THIRD LIMITED / THIRD OMNISCIENT]\n- What the POV character is feeling: [THEIR INTERNAL STATE]\n\n**Current draft (if any):**\n[PASTE YOUR EXISTING DESCRIPTION OR WRITE \"STARTING FRESH\"]\n\n**Enhance the scene with:**\n\n1. **Sensory Inventory** (before writing): List 2 specific details for each sense:\n   - Sight (but NOT just what things look like — light quality, movement, color temperature)\n   - Sound (ambient sounds create setting; silence is also a sound)\n   - Smell (the most memory-linked sense — use it for emotional scenes)\n   - Touch/Texture (temperature, fabric, skin, wind)\n   - Taste (when appropriate — often overlooked)\n\n2. **Three Versions of the Scene** (each 150-200 words):\n   - **Sparse/Minimalist**: Hemingway style — short sentences, concrete nouns, no adjectives that are not earning their place\n   - **Lush/Atmospheric**: Sensory-rich, longer sentences, poetic but not purple\n   - **Character-Filtered**: Every detail is filtered through the POV character's emotional state (a grieving person sees the world differently than a person in love)\n\n3. **The One Detail Rule**: Identify the single most important detail in this scene — the one image that, if the reader remembers nothing else, captures the entire mood\n\n4. **Show vs. Tell Conversion**: Take 3 abstract statements (she was sad, it was cold, the room was old) and convert them into concrete, showing descriptions\n\n5. **Pacing Guidance**: Where to slow down (linger on details) and where to speed up (short declarative sentences) for maximum impact",
        category: "creative-writing",
        tags: ["scene description", "prose style", "sensory writing", "show don't tell"],
        useCase:
          "Transform a rough scene description into immersive prose that puts the reader inside the moment.",
        exampleInput:
          "SCENE: A woman returns to her childhood bedroom for the first time in 20 years. The house is being sold. It is late afternoon in autumn. She is alone. MOOD: Nostalgic but with an edge of loss. CURRENT DRAFT: 'The room was smaller than she remembered. Her old posters were still on the walls. Dust was everywhere. She felt sad.'",
        exampleOutput:
          "Character-filtered version: 'The ceiling had lowered itself in twenty years, or maybe she had simply grown into someone too tall for this room. A Nirvana poster curled at its corners above the twin bed, held by a single remaining thumbtack — the other three had surrendered to gravity sometime in the decade she was not watching. Afternoon light through the west window caught the dust she had stirred, and for a moment each particle held its own small sun. She sat on the bed. The springs remembered her weight before she did.' The One Detail: The dust catching light — it makes absence visible and beautiful simultaneously.",
        targetKeywords: [
          "scene description prompt",
          "AI prose enhancer template",
          "creative writing description generator",
        ],
        relatedTemplates: ["story-opening-hook-generator", "dialogue-writer"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "antagonist-motivation-builder",
        title: "Antagonist Motivation Builder",
        description:
          "Create complex, sympathetic antagonists with genuine motivations that challenge the protagonist meaningfully.",
        prompt:
          "You are a story consultant who specializes in creating antagonists that readers understand, fear, and sometimes even root for. Help me build a compelling antagonist.\n\n**Story Context:**\n- Genre: [GENRE]\n- Protagonist: [BRIEF DESCRIPTION OF YOUR MAIN CHARACTER]\n- Protagonist's goal: [WHAT YOUR HERO WANTS]\n- World/Setting: [CONTEXT]\n\n**Antagonist Basics:**\n- Name: [ANTAGONIST NAME]\n- Relationship to protagonist: [HOW THEY ARE CONNECTED]\n- What they want: [THEIR SURFACE-LEVEL GOAL]\n- Current description (if any): [WHAT YOU HAVE SO FAR]\n\n**Build antagonist depth through:**\n\n1. **The Mirror Test**: How does this antagonist reflect the protagonist? Great antagonists are dark mirrors — they share a trait, wound, or desire with the hero but made a different choice at a critical moment. Define:\n   - The shared wound or desire\n   - The divergence point (when did their paths split?)\n   - Why the antagonist's choice was understandable at the time\n\n2. **The Sympathetic Core**:\n   - Write their backstory in 3 sentences that would make the reader feel sympathy\n   - Identify one genuinely good quality they possess\n   - Name one person or thing they truly love or protect\n   - What would have to be true about the world for them to be the HERO of this story?\n\n3. **The Escalation Logic**: Map their decisions as a chain of reasonable escalations:\n   - First compromise: A small, justified crossing of a moral line\n   - Each subsequent step: How each choice made the next one inevitable\n   - The point of no return: When they consciously chose to become what they are\n\n4. **Their Truth**: What does the antagonist understand about the world that the protagonist does not? (The best villains are partially RIGHT)\n\n5. **Conflict Dynamics**: 3 scenes where the antagonist and protagonist interact, each revealing a different facet of their relationship:\n   - A scene where the antagonist is reasonable and the protagonist is wrong\n   - A scene where they almost agree\n   - A scene where the antagonist reveals their full capability\n\n6. **Defeat Test**: How should this antagonist be defeated in a way that is thematically satisfying? (Hint: it should relate to their specific flaw, not just being overpowered)",
        category: "creative-writing",
        tags: ["antagonist", "villain", "character motivation", "conflict", "story development"],
        useCase:
          "Create a complex antagonist whose motivations are understandable and whose conflict with the protagonist is thematically resonant.",
        exampleInput:
          "GENRE: Fantasy, PROTAGONIST: A young healer who believes all life is sacred. PROTAGONIST GOAL: Protect her village from destruction. ANTAGONIST: The general who has ordered the village destroyed. RELATIONSHIP: The general was once a healer himself, in the same tradition.",
        exampleOutput:
          "The Mirror Test: Both the healer and the general believe in protecting life — but the general saw his own village destroyed because he refused to fight, and he decided that protecting the many sometimes requires sacrificing the few. The Sympathetic Core: He carries a healer's kit in his saddlebag that he has never used since the day his village burned. His Truth: He understands something the protagonist does not yet — that pacifism only works when your enemy also values life. Defeat: The protagonist defeats him not by overpowering him but by doing what he could not — finding a third option that protects without destroying, proving his core belief wrong.",
        targetKeywords: [
          "antagonist motivation prompt",
          "AI villain builder template",
          "complex antagonist creation prompt",
        ],
        relatedTemplates: ["character-development-builder", "plot-twist-generator"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
    ],
  },


  // ── Business Strategy ──────────────────────────────────────────────────
  {
    slug: "business-strategy",
    title: "Business Strategy Prompts",
    description:
      "AI prompt templates for SWOT analysis, business plans, competitive analysis, OKRs, market sizing, and strategic planning. Ready to paste into ChatGPT, Claude, or Gemini.",
    longDescription:
      "Make better strategic decisions with AI-powered prompt templates for every stage of business planning. From conducting rigorous SWOT analyses and sizing new markets to writing pitch deck narratives and building customer personas, these templates bring structured thinking to complex strategy work. Customize the bracketed placeholders with your business context and paste into any major AI assistant for frameworks that consultants charge thousands for.",
    icon: "\uD83D\uDCCA",
    keywords: [
      "business prompts",
      "strategy prompts",
      "startup prompts",
      "business plan prompts",
      "ChatGPT for business",
    ],
    relatedCategories: ["marketing", "sales", "data-analysis"],
    templates: [
      {
        slug: "swot-analysis-generator",
        title: "SWOT Analysis Generator",
        description:
          "Generate a comprehensive SWOT analysis with actionable strategies for each quadrant based on your business context.",
        prompt:
          "You are a management consultant at a top strategy firm. Conduct a thorough SWOT analysis for the following business.\n\n**Business Context:**\n- Company/Product: [COMPANY OR PRODUCT NAME]\n- Industry: [INDUSTRY]\n- Stage: [STARTUP / GROWTH / MATURE / TURNAROUND]\n- Size: [EMPLOYEES / REVENUE RANGE]\n- Geographic focus: [LOCAL / NATIONAL / GLOBAL]\n- Business model: [HOW THE COMPANY MAKES MONEY]\n\n**Current Situation:**\n- Recent wins: [WHAT IS GOING WELL]\n- Current challenges: [WHAT IS NOT GOING WELL]\n- Market conditions: [RELEVANT MARKET TRENDS]\n- Key competitors: [TOP 2-3 COMPETITORS]\n\n**Conduct the SWOT analysis:**\n\n1. **Strengths** (Internal, Positive): List 5-7 strengths with evidence\n   - For each: Why it matters competitively\n   - Rate each: Sustainable (hard to copy) or Temporary (competitors can replicate)\n\n2. **Weaknesses** (Internal, Negative): List 5-7 weaknesses honestly\n   - For each: How it impacts growth or revenue\n   - Rate each: Fixable (with investment) or Structural (requires major change)\n\n3. **Opportunities** (External, Positive): List 5-7 market opportunities\n   - For each: Time horizon (0-6mo, 6-12mo, 12-24mo)\n   - Rate each: Ease of capture (low/medium/high effort)\n\n4. **Threats** (External, Negative): List 5-7 threats\n   - For each: Likelihood (low/medium/high) and Impact (low/medium/high)\n   - Rate each: Controllable or Uncontrollable\n\n5. **TOWS Strategy Matrix** (the most valuable part):\n   - SO Strategies: Use strengths to capture opportunities (2-3 strategies)\n   - WO Strategies: Fix weaknesses to capture opportunities (2-3 strategies)\n   - ST Strategies: Use strengths to mitigate threats (2-3 strategies)\n   - WT Strategies: Minimize weaknesses to avoid threats (2-3 strategies)\n\n6. **Top 3 Strategic Priorities**: Based on the entire analysis, what should the business focus on in the next 90 days?\n\n7. **One-Page Summary**: A concise visual-ready summary suitable for a board presentation",
        category: "business-strategy",
        tags: ["SWOT analysis", "strategic planning", "competitive strategy", "business assessment"],
        useCase:
          "Conduct a rigorous SWOT analysis that goes beyond listing bullet points to generate actionable strategic priorities.",
        exampleInput:
          "COMPANY: A 30-person B2B SaaS startup selling project management tools. STAGE: Growth (Series A, $5M ARR). RECENT WINS: 40% YoY growth, just signed first enterprise customer. CHALLENGES: High churn in SMB segment, only 2 sales reps. COMPETITORS: Asana, Monday.com, Linear.",
        exampleOutput:
          "Strength: First enterprise deal validates upmarket potential — this is sustainable because enterprise relationships create switching costs. Weakness: High SMB churn (fixable — requires onboarding investment, not product change). TOWS SO Strategy: Leverage the enterprise win as a case study to accelerate upmarket motion while growth is strong. Top Priority: Reduce SMB churn by 30% in 90 days through automated onboarding — every point of churn reduction at $5M ARR equals $50K saved annually.",
        targetKeywords: [
          "SWOT analysis prompt",
          "AI SWOT generator",
          "business strategy SWOT template",
        ],
        relatedTemplates: ["competitive-analysis-framework", "okr-generator"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "business-plan-section-writer",
        title: "Business Plan Section Writer",
        description:
          "Write polished, investor-ready sections of a business plan with market data, financial projections, and clear narrative.",
        prompt:
          "You are a startup advisor who has helped companies raise over $500M in venture funding. Write a specific section of a business plan.\n\n**Business Overview:**\n- Company: [COMPANY NAME]\n- One-line description: [WHAT YOU DO IN ONE SENTENCE]\n- Stage: [IDEA / PRE-REVENUE / EARLY REVENUE / GROWTH]\n- Industry: [INDUSTRY/VERTICAL]\n- Business model: [HOW YOU MAKE MONEY — subscription, marketplace, transactional, etc.]\n- Target customer: [WHO PAYS YOU]\n- Traction so far: [REVENUE, USERS, PARTNERSHIPS, OR \"PRE-LAUNCH\"]\n\n**Section to Write:** [CHOOSE ONE OR MORE]\n1. Executive Summary\n2. Problem Statement\n3. Solution & Value Proposition\n4. Market Opportunity (TAM/SAM/SOM)\n5. Business Model & Revenue Streams\n6. Go-to-Market Strategy\n7. Competitive Landscape\n8. Team & Key Hires\n9. Financial Projections (3-year)\n10. Funding Ask & Use of Funds\n\n**For the selected section(s), provide:**\n\n1. **The section content**: Written in professional, investor-ready prose. No fluff — every sentence should earn its place. Use specific numbers and data points wherever possible.\n\n2. **Supporting data suggestions**: What specific market research, reports, or data points should be cited to make this section credible (with suggested sources)\n\n3. **Common mistakes to avoid**: 3 things founders typically get wrong in this section and how to avoid them\n\n4. **Red flags investors watch for**: What will make an investor stop reading, and how to address those concerns proactively\n\n5. **Visual/chart suggestions**: What diagrams, charts, or visuals would strengthen this section in a presentation\n\n6. **Version variants**: A 1-paragraph version (for an email pitch), a 1-page version (for the full plan), and key bullet points (for a slide deck)",
        category: "business-strategy",
        tags: ["business plan", "startup", "investor pitch", "fundraising"],
        useCase:
          "Write a specific section of a business plan with the rigor and clarity that investors expect.",
        exampleInput:
          "COMPANY: FreshRoute (AI-powered grocery delivery route optimization for independent grocers). STAGE: Early revenue ($120K ARR). SECTION: Market Opportunity (TAM/SAM/SOM). TRACTION: 15 independent grocery stores in 3 cities.",
        exampleOutput:
          "TAM: The US grocery delivery market is projected to reach $160B by 2028. SAM: Independent grocers (35% of the US market) offering delivery represent approximately $56B. SOM: Within our initial 3-city footprint, 2,400 independent grocers with delivery operations represent a $48M addressable opportunity at our current $3,200 average ACV. Common mistake: Citing the total grocery market instead of the delivery-specific segment for grocers who actually need route optimization.",
        targetKeywords: [
          "business plan prompt",
          "AI business plan writer",
          "startup plan template generator",
        ],
        relatedTemplates: ["pitch-deck-narrative-writer", "market-sizing-estimator"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "competitive-analysis-framework",
        title: "Competitive Analysis Framework",
        description:
          "Build a structured competitive analysis with positioning maps, feature comparisons, and strategic implications.",
        prompt:
          "You are a competitive strategy analyst who helps companies understand their market position and find defensible advantages. Conduct a competitive analysis.\n\n**Your Company:**\n- Company/Product: [YOUR COMPANY]\n- Core value proposition: [WHY CUSTOMERS CHOOSE YOU]\n- Target customer: [YOUR PRIMARY BUYER]\n- Price point: [YOUR PRICING]\n- Key strengths: [TOP 3 ADVANTAGES]\n\n**Competitors to Analyze (2-5):**\n1. [COMPETITOR 1 NAME] — [BRIEF DESCRIPTION]\n2. [COMPETITOR 2 NAME] — [BRIEF DESCRIPTION]\n3. [COMPETITOR 3 NAME] — [BRIEF DESCRIPTION]\n[Add more as needed]\n\n**Analysis Dimensions:**\n[CHOOSE: feature set / pricing / go-to-market / brand / customer experience / technology / ALL]\n\n**Produce a competitive analysis with:**\n\n1. **Market Positioning Map**: Define 2 key dimensions (e.g., ease-of-use vs. feature depth, price vs. quality) and place each competitor on the map. Identify the white space.\n\n2. **Feature Comparison Matrix**: Compare 10-15 key capabilities across all competitors with ratings (leader / competitive / gap / N/A)\n\n3. **Pricing Analysis**: Compare pricing models, tiers, and value per dollar. Identify who competes on price vs. value.\n\n4. **ICP Overlap Analysis**: Where do target customer segments overlap? Where does each competitor own a unique segment?\n\n5. **Go-to-Market Comparison**: How does each competitor acquire and retain customers? (PLG, sales-led, community-led, partnership-led)\n\n6. **Moat Assessment**: For each competitor (including yourself), rate the strength of their defensibility:\n   - Network effects (1-5)\n   - Switching costs (1-5)\n   - Brand strength (1-5)\n   - Data advantage (1-5)\n   - Technology IP (1-5)\n\n7. **Strategic Recommendations**:\n   - Where to compete (attack their weakness with your strength)\n   - Where NOT to compete (avoid their stronghold)\n   - Your most defensible positioning statement\n   - 3 moves to strengthen your competitive position in the next 6 months",
        category: "business-strategy",
        tags: ["competitive analysis", "market positioning", "strategy", "market research"],
        useCase:
          "Understand your competitive landscape, find defensible positioning, and develop a strategy to win against specific competitors.",
        exampleInput:
          "YOUR COMPANY: NotifyPro (team notification platform, $12/user/mo). COMPETITORS: Slack (enterprise messaging), PagerDuty (incident management), Microsoft Teams (collaboration suite). YOUR STRENGTHS: Purpose-built for critical notifications, 99.99% delivery guarantee, simple pricing.",
        exampleOutput:
          "Positioning Map (Simplicity vs. Notification Reliability): NotifyPro is high-reliability, high-simplicity. Slack is medium-reliability, medium-simplicity. PagerDuty is high-reliability, low-simplicity. White space: No competitor owns reliable + simple for non-engineering teams. Strategic recommendation: Position against Slack on reliability ('when Slack goes down, NotifyPro still delivers') and against PagerDuty on simplicity ('PagerDuty for everyone, not just DevOps').",
        targetKeywords: [
          "competitive analysis prompt",
          "AI competitive analysis template",
          "market positioning generator",
        ],
        relatedTemplates: ["swot-analysis-generator", "value-proposition-canvas-filler"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "okr-generator",
        title: "OKR Generator",
        description:
          "Create measurable, ambitious OKRs aligned to company strategy with proper structure and scoring criteria.",
        prompt:
          "You are an OKR coach who has implemented objectives and key results at companies from startups to Fortune 500. Help me create well-structured OKRs.\n\n**Context:**\n- Company/Team: [COMPANY OR TEAM NAME]\n- Time period: [Q1/Q2/Q3/Q4 + YEAR]\n- Level: [COMPANY / DEPARTMENT / TEAM / INDIVIDUAL]\n- Company mission: [ONE-SENTENCE MISSION]\n- Top strategic priority this period: [THE #1 THING THAT MATTERS]\n\n**Current Situation:**\n- Last period's results: [WHAT HAPPENED — wins and misses]\n- Key metric baselines: [CURRENT NUMBERS FOR IMPORTANT METRICS]\n- Resources available: [TEAM SIZE, BUDGET, CONSTRAINTS]\n- Dependencies: [WHAT DO YOU NEED FROM OTHER TEAMS]\n\n**Create OKRs with the following structure:**\n\n**Objective 1** (Qualitative, inspiring, time-bound):\nWrite an objective that is ambitious, clear, and does not contain a number\n\n- **KR 1.1**: [Measurable key result with specific target]\n  - Baseline: [current state]\n  - Target: [end-of-period goal]\n  - Scoring: 0.3 = [threshold], 0.7 = [target], 1.0 = [stretch]\n  - Leading indicators: [how to track progress weekly]\n\n- **KR 1.2**: [Second measurable key result]\n  [Same structure]\n\n- **KR 1.3**: [Third measurable key result]\n  [Same structure]\n\n**Repeat for 2-3 total objectives.**\n\n**Additionally provide:**\n1. **Alignment check**: How each objective connects to the company's strategic priority\n2. **Anti-goals**: 2-3 things you are explicitly NOT trying to achieve this period (prevents scope creep)\n3. **Health metrics**: 2-3 metrics to monitor that should NOT be sacrificed in pursuit of OKRs (e.g., don't improve speed at the cost of quality)\n4. **Weekly check-in template**: 5 questions to ask each week to track OKR progress\n5. **Common OKR mistakes identified**: Flag if any of the KRs are actually tasks (outputs) rather than outcomes, or if targets are sandbagged vs. genuinely ambitious",
        category: "business-strategy",
        tags: ["OKRs", "objectives", "goal setting", "strategic planning", "KPIs"],
        useCase:
          "Set ambitious, measurable OKRs that align your team to the company's strategic priorities with proper structure and scoring.",
        exampleInput:
          "COMPANY: A 50-person B2B SaaS company. PERIOD: Q2 2026. STRATEGIC PRIORITY: Reduce churn and expand existing accounts. BASELINES: Current monthly churn 4.2%, NRR 98%, NPS 32. TEAM: Customer Success team of 6.",
        exampleOutput:
          "Objective 1: Make our existing customers so successful they become our best salespeople. KR 1.1: Reduce monthly logo churn from 4.2% to 2.8%. Scoring: 0.3 = 3.8%, 0.7 = 2.8%, 1.0 = 2.2%. KR 1.2: Increase Net Revenue Retention from 98% to 108%. KR 1.3: Generate 15 customer referrals that enter the sales pipeline. Anti-goal: We are NOT trying to save every customer at any cost — some accounts are poor fits and should churn cleanly.",
        targetKeywords: [
          "OKR generator prompt",
          "AI OKR template",
          "objectives and key results generator",
        ],
        relatedTemplates: ["swot-analysis-generator", "risk-assessment-matrix-builder"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "market-sizing-estimator",
        title: "Market Sizing Estimator",
        description:
          "Estimate TAM, SAM, and SOM with both top-down and bottom-up approaches including methodology and assumptions.",
        prompt:
          "You are a market research analyst who has sized markets for venture capital firms and Fortune 500 strategy teams. Help me estimate the market size for a business opportunity.\n\n**The Opportunity:**\n- Product/Service: [WHAT YOU ARE BUILDING OR SELLING]\n- Target customer: [WHO PAYS FOR THIS — be specific about segment]\n- Geography: [US / EUROPE / GLOBAL / SPECIFIC REGION]\n- Pricing model: [HOW MUCH YOU CHARGE AND HOW]\n- Current alternatives: [WHAT PEOPLE DO TODAY TO SOLVE THIS PROBLEM]\n\n**Known Data Points (provide what you have):**\n- Industry size (if known): [MARKET DATA]\n- Number of potential customers (if known): [ESTIMATE]\n- Average contract value: [YOUR ACV OR EXPECTED ACV]\n- Any relevant statistics: [GROWTH RATES, ADOPTION RATES, INDUSTRY REPORTS]\n\n**Produce a market sizing analysis with:**\n\n1. **Top-Down Analysis** (start from the total market and narrow):\n   - TAM (Total Addressable Market): The full revenue opportunity if you captured 100%\n   - SAM (Serviceable Addressable Market): The segment you can realistically target with your current business model\n   - SOM (Serviceable Obtainable Market): What you can realistically capture in 3-5 years\n   - Show the math at each step with clear filters/assumptions\n\n2. **Bottom-Up Analysis** (start from unit economics and scale):\n   - Number of potential customers in your target segment\n   - Expected average revenue per customer\n   - Realistic penetration rate by year (Year 1, Year 3, Year 5)\n   - Revenue projection build-up\n\n3. **Sanity Checks**:\n   - Compare top-down and bottom-up results (they should be within 2x of each other)\n   - Benchmark against comparable companies at similar stages\n   - Flag where estimates are weakest\n\n4. **Market Dynamics**:\n   - Growth rate (is the market expanding, flat, or contracting?)\n   - Key growth drivers\n   - Potential market-changing events (regulation, technology shifts)\n\n5. **Assumptions Table**: Every assumption listed with confidence level (high/medium/low) and source\n\n6. **Presentation-Ready Summary**: TAM/SAM/SOM in a format suitable for a pitch deck slide, including a visual funnel description",
        category: "business-strategy",
        tags: ["market sizing", "TAM SAM SOM", "market research", "market opportunity"],
        useCase:
          "Estimate market size for investor presentations, strategic planning, or go/no-go decisions on new business opportunities.",
        exampleInput:
          "PRODUCT: An AI-powered compliance tool for healthcare clinics. TARGET: Private medical practices (1-20 physicians) in the US. PRICING: $500/month per practice. CURRENT ALTERNATIVE: Manual compliance checklists and occasional consultant audits costing $5K-15K/year.",
        exampleOutput:
          "Top-down: There are approximately 230,000 physician offices in the US (AMA data). 68% are private practices = 156,000. TAM at $6K/year = $936M. SAM (practices with 1-20 physicians and no existing compliance software) estimated at 89,000 practices = $534M. SOM (3-year realistic capture at 2.5% penetration) = 2,225 practices = $13.4M ARR. Bottom-up confirms: 200 practices Year 1, 800 Year 2, 2,200 Year 3 at $6K ACV = $13.2M. Sanity check: Top SaaS compliance tools in adjacent markets (dental, legal) have achieved 3-5% penetration of their SAM within 5 years.",
        targetKeywords: [
          "market sizing prompt",
          "TAM SAM SOM calculator",
          "AI market size estimator template",
        ],
        relatedTemplates: ["business-plan-section-writer", "pitch-deck-narrative-writer"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "pitch-deck-narrative-writer",
        title: "Pitch Deck Narrative Writer",
        description:
          "Write a compelling pitch deck narrative with slide-by-slide content, speaker notes, and storytelling structure.",
        prompt:
          "You are a pitch deck consultant who has helped startups raise from pre-seed through Series C. Create a pitch deck narrative.\n\n**Company Details:**\n- Company: [COMPANY NAME]\n- One-liner: [WHAT YOU DO IN ONE SENTENCE]\n- Stage: [PRE-SEED / SEED / SERIES A / SERIES B+]\n- Raising: [AMOUNT AND USE OF FUNDS]\n- Traction: [KEY METRICS — revenue, users, growth rate]\n- Team: [FOUNDERS AND KEY HIRES — backgrounds]\n\n**Audience:** [ANGEL INVESTORS / VC FUND / STRATEGIC PARTNER / ACCELERATOR]\n\n**The Story:**\n- The big problem: [THE PAIN POINT]\n- Why now: [WHAT HAS CHANGED TO MAKE THIS POSSIBLE/URGENT]\n- Your insight: [THE UNIQUE INSIGHT THAT ONLY YOUR TEAM HAS]\n- Proof it works: [EVIDENCE — early customers, data, testimonials]\n\n**Write a 12-slide pitch deck narrative:**\n\nFor each slide, provide:\n1. **Slide title** (5 words max, make it a claim not a label)\n2. **Key message** (the ONE thing the audience should take away)\n3. **Slide content** (bullet points, specific data, or narrative — what goes ON the slide)\n4. **Speaker notes** (what you SAY while showing this slide — 30-60 seconds)\n5. **Visual suggestion** (what image, chart, or diagram would strengthen this slide)\n\n**Slide Order:**\n1. Title/Hook\n2. Problem\n3. Market Opportunity\n4. Solution\n5. How It Works / Product\n6. Traction / Validation\n7. Business Model\n8. Go-to-Market\n9. Competitive Advantage\n10. Team\n11. Financials / Projections\n12. The Ask\n\n**Also provide:**\n- **The narrative arc**: How the emotional journey of the pitch flows (start with pain, build to vision)\n- **Potential investor questions**: 5 tough questions and prepared answers\n- **What to leave out**: 3 things that should NOT be in this deck and why",
        category: "business-strategy",
        tags: ["pitch deck", "fundraising", "investor presentation", "startup pitch"],
        useCase:
          "Create a compelling pitch deck narrative with structured storytelling that captures investor interest and secures meetings.",
        exampleInput:
          "COMPANY: LearnLoop (AI tutor for K-12 students, adapts to learning style). STAGE: Seed, raising $2M. TRACTION: 5,000 MAU, 3 school district pilots, 89% student improvement rate. TEAM: Former teacher + ML engineer from Google. AUDIENCE: Ed-tech focused VC funds.",
        exampleOutput:
          "Slide 1 Title: 'Every student deserves a great tutor.' Speaker notes: 'There are 50 million K-12 students in the US. Only 2 million can afford private tutoring. We are building the AI tutor that adapts to how each student actually learns.' Slide 6 (Traction): Title: '89% of students improve within 4 weeks.' Content: 5,000 monthly active users, 3 school district pilots underway, 89% measured improvement on standardized assessments, 4.8 average parent rating. Visual: Growth chart showing MAU trajectory with district pilot launch dates annotated.",
        targetKeywords: [
          "pitch deck prompt",
          "AI pitch deck writer",
          "startup pitch template generator",
        ],
        relatedTemplates: ["business-plan-section-writer", "market-sizing-estimator"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "customer-persona-builder",
        title: "Customer Persona Builder",
        description:
          "Build detailed, research-backed customer personas with demographics, behaviors, pain points, and buying journey.",
        prompt:
          "You are a customer research specialist who builds personas grounded in real behavioral data, not fictional demographics. Help me create actionable customer personas.\n\n**Business Context:**\n- Company/Product: [WHAT YOU SELL]\n- Industry: [YOUR INDUSTRY]\n- Price point: [PRICING]\n- Current customers (if any): [DESCRIBE YOUR BEST CUSTOMERS]\n- Sales cycle: [HOW LONG AND WHO IS INVOLVED]\n\n**Data Inputs (provide what you have):**\n- Customer interviews or feedback: [KEY THEMES]\n- Analytics data: [TRAFFIC SOURCES, USAGE PATTERNS, DEMOGRAPHICS]\n- Sales team observations: [WHAT SALES HEARS REPEATEDLY]\n- Support ticket themes: [COMMON COMPLAINTS OR REQUESTS]\n- Churn reasons: [WHY CUSTOMERS LEAVE]\n\n**Build 2-3 distinct personas with:**\n\n1. **Identity Snapshot**:\n   - Persona name and archetype (e.g., \"Scaling Sarah — The Growth-Stage Founder\")\n   - Job title and company profile\n   - Demographics (age range, location, education — only if strategically relevant)\n   - One sentence that captures who they are\n\n2. **Goals & Motivations**:\n   - Professional goals (what they are measured on)\n   - Personal motivations (what drives them beyond the job description)\n   - Definition of success (what does a great outcome look like for them)\n\n3. **Pain Points & Frustrations**:\n   - Top 3 problems they face (relevant to your product)\n   - Current workaround (how they solve the problem today)\n   - Emotional impact (how the problem makes them FEEL — frustrated, anxious, embarrassed)\n\n4. **Buying Behavior**:\n   - How they discover solutions (channels, content types, trusted sources)\n   - Decision criteria (price, features, brand, peers, reviews — ranked)\n   - Objections and hesitations (what almost stops them from buying)\n   - Who else influences the decision (the buying committee)\n   - Typical budget process (how they get spending approved)\n\n5. **Messaging That Resonates**:\n   - The headline that would make them stop scrolling\n   - The proof point that would convince them\n   - The feature they care most about (and the one they ignore)\n   - Words they use to describe their problem (use their language, not yours)\n\n6. **A Day in Their Life**: A brief narrative showing where your product fits into their actual workflow and daily routine\n\n7. **Anti-Persona**: One type of customer who looks similar but is actually a poor fit — and how to tell them apart",
        category: "business-strategy",
        tags: ["customer persona", "buyer persona", "market research", "ICP", "target audience"],
        useCase:
          "Build research-grounded customer personas that inform product decisions, marketing messaging, and sales strategies.",
        exampleInput:
          "COMPANY: ProjectSync (project management SaaS for agencies, $49/user/mo). CURRENT CUSTOMERS: Creative agencies with 10-50 employees. SALES OBSERVATIONS: Buyers are usually ops managers who are frustrated with tracking work across multiple freelancers. CHURN: Agencies that are too small (under 5 people) tend to revert to spreadsheets.",
        exampleOutput:
          "Persona 1: 'Organized Olivia — The Agency Ops Manager'. Title: Operations Manager at a 25-person creative agency. One sentence: She is the person who makes sure everything runs on time and no one drops the ball, but she has no direct authority over the creative team. Pain point: She spends 10+ hours per week chasing status updates from freelancers and creatives who refuse to update their tasks. Emotional impact: She feels invisible — when projects run smoothly no one notices her work, but when things slip she gets blamed. Anti-persona: Freelance project managers (they look similar in ads targeting but have no budget authority and churn within 30 days).",
        targetKeywords: [
          "customer persona prompt",
          "AI buyer persona generator",
          "customer persona template",
        ],
        relatedTemplates: ["value-proposition-canvas-filler", "competitive-analysis-framework"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "value-proposition-canvas-filler",
        title: "Value Proposition Canvas Filler",
        description:
          "Complete a Value Proposition Canvas that maps customer jobs, pains, and gains to your product's offerings.",
        prompt:
          "You are a product strategist trained in Strategyzer's Value Proposition Canvas methodology. Help me complete a Value Proposition Canvas.\n\n**Customer Segment:**\n- Target customer: [WHO SPECIFICALLY]\n- Their role/context: [JOB TITLE, COMPANY TYPE, SITUATION]\n\n**Your Offering:**\n- Product/Service: [WHAT YOU SELL]\n- Key features: [TOP 5 FEATURES OR CAPABILITIES]\n- Price: [PRICING]\n\n**Complete both sides of the canvas:**\n\n**CUSTOMER PROFILE (Right Side):**\n\n1. **Customer Jobs** (what they are trying to accomplish):\n   - Functional jobs (3-5): The practical tasks they need to complete\n   - Social jobs (2-3): How they want to be perceived by others\n   - Emotional jobs (2-3): How they want to feel\n   - Rank by importance to the customer\n\n2. **Pains** (what bothers them about the current situation):\n   - Undesired outcomes (what goes wrong)\n   - Obstacles (what prevents them from getting started)\n   - Risks (what they are afraid might happen)\n   - Rank by severity (extreme / moderate / mild)\n\n3. **Gains** (what outcomes they desire):\n   - Required gains (minimum expectations)\n   - Expected gains (what they typically get from current solutions)\n   - Desired gains (what they wish they could get)\n   - Unexpected gains (what would truly delight them)\n   - Rank by relevance\n\n**VALUE MAP (Left Side):**\n\n4. **Products & Services**: Map each feature to the customer jobs it addresses\n\n5. **Pain Relievers**: For each pain identified, explain specifically how your product alleviates it (be concrete — not \"saves time\" but \"reduces report generation from 4 hours to 15 minutes\")\n\n6. **Gain Creators**: For each gain desired, explain how your product delivers or exceeds it\n\n**FIT ANALYSIS:**\n\n7. **Strong Fits**: Where your product perfectly matches a critical customer need (these are your marketing headlines)\n8. **Gaps**: Where customer needs exist but your product does not fully address them (these are your product roadmap candidates)\n9. **Over-served areas**: Where your product does more than the customer needs (potential for simplification or different pricing tiers)\n10. **One-Sentence Value Proposition**: Synthesize the canvas into a single compelling statement",
        category: "business-strategy",
        tags: ["value proposition", "product-market fit", "customer discovery", "Strategyzer"],
        useCase:
          "Map the fit between your product and your customer's needs to sharpen positioning and identify product gaps.",
        exampleInput:
          "CUSTOMER: Head of Content at a 100-person B2B SaaS company. PRODUCT: ContentAI (AI content generation platform, $299/mo). FEATURES: Blog post generation, SEO optimization, brand voice training, content calendar, analytics dashboard.",
        exampleOutput:
          "Customer Job (functional): Publish 12+ quality blog posts per month to hit SEO targets. Customer Pain (extreme): Freelance writers require 3 rounds of revision to match brand voice and still miss technical nuances. Pain Reliever: Brand voice training feature learns from existing content and generates first drafts that require only 1 revision round, cutting production time by 60%. Gap identified: Customer wants multi-channel repurposing (blog to social to email) but ContentAI currently only handles blog content. This is a roadmap candidate.",
        targetKeywords: [
          "value proposition canvas prompt",
          "AI value proposition template",
          "product-market fit analysis prompt",
        ],
        relatedTemplates: ["customer-persona-builder", "swot-analysis-generator"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "risk-assessment-matrix-builder",
        title: "Risk Assessment Matrix Builder",
        description:
          "Build a comprehensive risk assessment matrix with likelihood, impact, mitigation strategies, and contingency plans.",
        prompt:
          "You are a risk management consultant who helps organizations identify, assess, and mitigate strategic and operational risks. Build a risk assessment for the following context.\n\n**Context:**\n- Organization: [COMPANY/PROJECT NAME]\n- Scope: [WHAT ARE WE ASSESSING — a project, product launch, market entry, business operation]\n- Time horizon: [SHORT-TERM (0-6mo) / MEDIUM-TERM (6-18mo) / LONG-TERM (18mo+)]\n- Risk tolerance: [CONSERVATIVE / MODERATE / AGGRESSIVE]\n\n**Current Situation:**\n- What is at stake: [KEY ASSETS, REVENUE, REPUTATION, ETC.]\n- Known concerns: [RISKS YOU ARE ALREADY AWARE OF]\n- Recent incidents: [ANYTHING THAT HAS GONE WRONG RECENTLY]\n- Dependencies: [CRITICAL THIRD PARTIES, TECHNOLOGIES, PEOPLE]\n\n**Build a risk assessment with:**\n\n1. **Risk Identification** (across categories):\n   - Strategic risks (market changes, competition, business model)\n   - Operational risks (process failures, key person dependency, technology)\n   - Financial risks (cash flow, pricing, currency, funding)\n   - Compliance/Legal risks (regulatory, data privacy, contracts)\n   - Reputational risks (PR crisis, customer trust, brand damage)\n   - For each risk: describe the scenario in 1-2 specific sentences\n\n2. **Risk Assessment Matrix**:\n   | Risk | Likelihood (1-5) | Impact (1-5) | Risk Score | Priority |\n   - Score = Likelihood x Impact\n   - Priority: Critical (20-25), High (12-19), Medium (6-11), Low (1-5)\n\n3. **Top 5 Risks Deep Dive** (for the highest-scored risks):\n   - Detailed scenario: What exactly would happen\n   - Early warning signs: How you would detect this risk materializing\n   - Prevention strategy: Actions to reduce likelihood\n   - Mitigation strategy: Actions to reduce impact if it occurs\n   - Contingency plan: Step-by-step response if the worst happens\n   - Owner: Who is responsible for monitoring and responding\n\n4. **Risk Heat Map Description**: A visual-ready layout for the 5x5 likelihood-impact grid with all risks placed\n\n5. **Monitoring Cadence**: How often each risk category should be reviewed and by whom\n\n6. **Residual Risk**: After mitigations, what risks remain and must be accepted",
        category: "business-strategy",
        tags: ["risk assessment", "risk management", "risk matrix", "contingency planning"],
        useCase:
          "Systematically identify and prepare for business risks before they become crises, with clear mitigation plans.",
        exampleInput:
          "ORGANIZATION: A 40-person fintech startup launching a new payment product in 3 months. SCOPE: Product launch risk assessment. RISK TOLERANCE: Moderate. KNOWN CONCERNS: Regulatory approval timeline uncertain, key engineer has been interviewing elsewhere, primary banking partner had an outage last month.",
        exampleOutput:
          "Risk 1: Banking partner outage during launch week. Likelihood: 3/5 (they had a recent outage). Impact: 5/5 (launch would fail publicly). Score: 15 (High). Early warning: Monitor partner status page and set up ping alerts. Prevention: Negotiate SLA with penalty clauses before launch. Mitigation: Build failover to secondary payment processor. Contingency: Pre-drafted customer communication for payment delays, fallback to manual processing for first 48 hours. Risk 2: Key engineer departure. Likelihood: 4/5 (actively interviewing). Impact: 4/5 (holds critical institutional knowledge). Prevention: Retention offer, ensure documentation of critical systems this week.",
        targetKeywords: [
          "risk assessment prompt",
          "AI risk matrix generator",
          "business risk analysis template",
        ],
        relatedTemplates: ["swot-analysis-generator", "okr-generator"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "pricing-strategy-analyzer",
        title: "Pricing Strategy Analyzer",
        description:
          "Analyze and optimize your pricing strategy with competitive benchmarking, value-based pricing, and tier structure.",
        prompt:
          "You are a pricing strategist who has optimized revenue for SaaS companies, e-commerce brands, and service businesses. Analyze and improve my pricing strategy.\n\n**Current Pricing:**\n- Product/Service: [WHAT YOU SELL]\n- Current price: [YOUR CURRENT PRICING AND MODEL]\n- Pricing tiers (if any): [DESCRIBE YOUR TIERS]\n- Current conversion rate: [TRIAL-TO-PAID OR VISITOR-TO-CUSTOMER RATE]\n- Average revenue per user: [ARPU]\n- Most popular tier: [WHICH TIER MOST CUSTOMERS CHOOSE]\n\n**Business Context:**\n- Target customer: [WHO BUYS THIS]\n- Value delivered: [WHAT MEASURABLE OUTCOME DO CUSTOMERS GET]\n- Cost to serve: [YOUR COST PER CUSTOMER / GROSS MARGIN]\n- Competitors' pricing: [WHAT COMPETITORS CHARGE]\n- Growth stage: [EARLY / GROWTH / MATURE]\n\n**Pricing Challenges:**\n[DESCRIBE WHAT IS NOT WORKING — too much churn at renewal, everyone picks the cheapest tier, losing deals on price, leaving money on the table, etc.]\n\n**Produce a pricing analysis with:**\n\n1. **Current State Assessment**:\n   - Where you sit on the price-value spectrum\n   - Revenue concentration risk (are too many customers on one tier?)\n   - Price anchoring analysis (is the cheapest option too good?)\n\n2. **Value-Based Pricing Analysis**:\n   - Calculate the value your product creates for customers (time saved x hourly rate, revenue generated, cost avoided)\n   - Your price as a percentage of value delivered (aim for 10-20% of value)\n   - Where you have room to increase pricing\n\n3. **Competitive Price Positioning**:\n   - Price-feature matrix vs. competitors\n   - Are you positioned as premium, competitive, or budget?\n   - Is this the right positioning for your brand?\n\n4. **Tier Structure Optimization**:\n   - Recommended 3-tier structure with names, features, and pricing\n   - How to make the middle tier the obvious choice (decoy effect)\n   - Which features to gate at each level and why\n   - Annual vs. monthly pricing recommendation\n\n5. **Pricing Experiments to Run**:\n   - 3 specific A/B tests with hypotheses and expected impact\n   - How to test price increases without alienating existing customers\n   - Grandfather policy recommendation\n\n6. **Revenue Impact Projection**: Model the revenue impact of your recommended changes at current customer volumes\n\n7. **Implementation Roadmap**: How to roll out pricing changes with communication plan and timeline",
        category: "business-strategy",
        tags: ["pricing strategy", "pricing optimization", "SaaS pricing", "revenue optimization"],
        useCase:
          "Analyze your current pricing, identify revenue optimization opportunities, and design a pricing structure that maximizes both conversion and revenue.",
        exampleInput:
          "PRODUCT: DesignHub (collaborative design tool). CURRENT: $15/user/mo single tier. CONVERSION: 8% trial-to-paid. ARPU: $15. COMPETITORS: Figma ($12-75/user), Canva ($0-30/user). CHALLENGE: No upsell path — everyone is on the same plan. Power users want more features but there is nowhere for them to go.",
        exampleOutput:
          "Assessment: Single-tier pricing leaves significant revenue on the table. Your power users (estimated 25% of base) would pay 3-4x more for advanced features. Recommended tiers: Starter ($12/user/mo — basic features, attracts price-sensitive users from Canva), Professional ($25/user/mo — full feature set, this becomes the new default), Enterprise ($45/user/mo — advanced permissions, SSO, priority support). The middle tier should include everything current users have plus 2 new features to create upgrade motivation. Revenue projection: At current 1,000 users, shifting from flat $15K/mo to tiered pricing estimates $22K-28K/mo without adding a single new customer.",
        targetKeywords: [
          "pricing strategy prompt",
          "AI pricing analyzer template",
          "SaaS pricing optimization prompt",
        ],
        relatedTemplates: ["competitive-analysis-framework", "customer-persona-builder"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
    ],
  },



  // ── Research & Academic ──────────────────────────────────────────────────
  {
    slug: "research",
    title: "Research & Academic Prompts",
    description:
      "AI prompt templates for literature reviews, research papers, grant proposals, and academic writing. Ready to paste into ChatGPT, Claude, or Gemini.",
    longDescription:
      "Accelerate your academic workflow with tested prompt templates for synthesizing literature, refining research questions, drafting methodology sections, and writing grant proposals. Each template is designed for real scholarly work — from undergraduate essays to doctoral dissertations and funded research projects. Paste them into any major AI assistant and customize the bracketed placeholders to match your discipline and research context.",
    icon: "🔬",
    keywords: [
      "research prompts",
      "academic prompts",
      "ChatGPT for research",
      "literature review prompts",
      "thesis prompts",
    ],
    relatedCategories: ["education", "data-analysis", "writing"],
    templates: [
      {
        slug: "literature-review-synthesizer",
        title: "Literature Review Synthesizer",
        description:
          "Synthesize multiple research sources into a coherent literature review narrative.",
        prompt:
          "You are an experienced academic researcher. Help me synthesize the following sources into a coherent literature review section for my [FIELD OF STUDY] paper on [RESEARCH TOPIC].\n\nSources to synthesize:\n- Source 1: [AUTHOR, YEAR] — Key finding: [SUMMARY OF FINDING]\n- Source 2: [AUTHOR, YEAR] — Key finding: [SUMMARY OF FINDING]\n- Source 3: [AUTHOR, YEAR] — Key finding: [SUMMARY OF FINDING]\n- Source 4: [AUTHOR, YEAR] — Key finding: [SUMMARY OF FINDING]\n- Source 5: [AUTHOR, YEAR] — Key finding: [SUMMARY OF FINDING]\n\nPlease:\n1. Identify the major themes and patterns across these sources\n2. Organize the synthesis thematically rather than source-by-source\n3. Highlight areas of agreement and contradiction between studies\n4. Identify gaps in the existing literature that my research could address\n5. Write 3-4 paragraphs of narrative synthesis using academic tone\n6. Include in-text citations in [CITATION STYLE, e.g., APA 7th, Chicago, MLA]\n7. End with a transition paragraph that connects the literature gap to my research question: [YOUR RESEARCH QUESTION]\n\nAvoid simply summarizing each source sequentially. Instead, weave them together to tell the story of where the field stands and where it needs to go.",
        category: "research",
        tags: ["literature review", "synthesis", "academic writing"],
        useCase:
          "Use when you need to combine multiple research sources into a thematic narrative for your literature review section.",
        exampleInput:
          "Field: Educational Psychology. Topic: Growth mindset interventions in K-12. Sources include Dweck (2006) on mindset framework, Yeager (2019) on scalable interventions, and Sisk (2018) meta-analysis showing small effect sizes.",
        exampleOutput:
          "While Dweck's foundational framework established the theoretical basis for growth mindset interventions, subsequent empirical work has produced mixed results. Sisk et al.'s meta-analysis revealed modest effect sizes, prompting researchers like Yeager to investigate scalable delivery methods that may moderate intervention effectiveness...",
        targetKeywords: [
          "literature review prompt",
          "AI literature review synthesizer",
          "academic synthesis template",
        ],
        relatedTemplates: ["research-question-refiner", "abstract-writer"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "research-question-refiner",
        title: "Research Question Refiner",
        description:
          "Transform a broad topic into focused, researchable questions with clear variables and scope.",
        prompt:
          "You are a research methodology expert. Help me refine my broad research interest into specific, well-formed research questions.\n\nMy broad topic area: [BROAD TOPIC, e.g., 'social media and mental health']\nMy discipline: [FIELD OF STUDY]\nDegree level: [UNDERGRADUATE / MASTER'S / DOCTORAL / POSTDOC]\nMethodological preference: [QUANTITATIVE / QUALITATIVE / MIXED METHODS]\nAccess to data: [DESCRIBE WHAT DATA YOU CAN REALISTICALLY COLLECT]\n\nPlease:\n1. Identify 3 specific angles within this broad topic that are currently under-researched\n2. For each angle, write a research question using the appropriate format:\n   - Quantitative: Include clear independent and dependent variables\n   - Qualitative: Use exploratory language (how, what, in what ways)\n   - Mixed methods: Combine both elements\n3. For each question, provide:\n   - A hypothesis or proposition\n   - The key variables or constructs involved\n   - A suggested theoretical framework\n   - Feasibility assessment (1-5 scale) given my data access\n4. Recommend which question is strongest for my level and explain why\n5. Suggest how to narrow or broaden each question if needed\n\nEnsure the questions are specific enough to be answerable within a single study but significant enough to contribute to the field.",
        category: "research",
        tags: ["research question", "hypothesis", "research design"],
        useCase:
          "Use at the start of a research project when you have a topic area but need to narrow it into a specific, feasible research question.",
        exampleInput:
          "Broad topic: remote work and productivity. Discipline: Organizational Behavior. Degree level: Master's. Methodology: Quantitative. Data access: Can survey employees at 3 mid-size tech companies.",
        exampleOutput:
          "Recommended question: 'To what extent does the frequency of synchronous virtual meetings moderate the relationship between remote work autonomy and self-reported task productivity among knowledge workers?' This question is feasible with your survey access, includes clear variables, and addresses a gap in the autonomy-productivity literature...",
        targetKeywords: [
          "research question generator",
          "AI research question refiner",
          "thesis question prompt",
        ],
        relatedTemplates: ["literature-review-synthesizer", "methodology-section-drafter"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "academic-paper-outliner",
        title: "Academic Paper Outliner",
        description:
          "Generate a structured outline for a research paper with section headings and key points.",
        prompt:
          "You are an academic writing coach. Create a detailed outline for my [PAPER TYPE, e.g., journal article, thesis chapter, conference paper] in [FIELD OF STUDY].\n\nResearch question: [YOUR RESEARCH QUESTION]\nMethodology: [BRIEF DESCRIPTION OF METHOD]\nKey findings: [SUMMARIZE YOUR MAIN RESULTS]\nTarget journal/conference: [NAME, if applicable]\nWord limit: [WORD LIMIT]\n\nGenerate a structured outline that includes:\n1. **Title**: 3 alternative titles that are specific and informative\n2. **Abstract outline**: Key sentence for each component (background, objective, method, results, conclusion)\n3. **Introduction** (suggested: [X]% of word limit):\n   - Opening hook: The broader context and why this matters\n   - Literature context: Key studies that frame your work (suggest 3-4 citation placeholders)\n   - Gap statement: What the existing literature fails to address\n   - Research question and objectives\n   - Brief overview of approach\n   - Contribution statement\n4. **Literature Review / Background** (if separate section):\n   - 3-4 thematic subsections with suggested content for each\n5. **Methodology**:\n   - Research design justification\n   - Participants/sample/data sources\n   - Instruments/measures\n   - Procedure\n   - Analysis approach\n   - Validity/reliability/ethical considerations\n6. **Results/Findings**:\n   - Organization strategy (by research question, by theme, by hypothesis)\n   - Suggested tables or figures\n7. **Discussion**:\n   - Summary of key findings\n   - Connection to existing literature\n   - Theoretical implications\n   - Practical implications\n   - Limitations\n   - Future research directions\n8. **Conclusion**: Key takeaway and final statement\n\nFor each section, include 2-3 bullet points describing what content belongs there.",
        category: "research",
        tags: ["paper outline", "thesis structure", "academic writing"],
        useCase:
          "Use when starting to write a research paper and you need a clear roadmap for the full document.",
        exampleInput:
          "Paper type: Journal article. Field: Computer Science (HCI). Research question: How do older adults adapt to voice-based AI assistants over a 6-week period? Method: Longitudinal qualitative study with 15 participants. Target journal: CHI Conference.",
        exampleOutput:
          "Title option 1: 'Learning to Talk to Machines: A Longitudinal Study of Older Adults' Adaptation to Voice-Based AI Assistants.' Introduction should open with aging population and technology adoption statistics, then narrow to voice interfaces. Literature Review subsections: (1) Technology adoption in older adults, (2) Voice UI design principles, (3) Longitudinal adaptation studies...",
        targetKeywords: [
          "research paper outline prompt",
          "AI paper outliner",
          "thesis outline generator",
        ],
        relatedTemplates: ["abstract-writer", "methodology-section-drafter"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "citation-formatter",
        title: "Citation Formatter",
        description:
          "Convert raw source information into properly formatted citations in any academic style.",
        prompt:
          "You are a citation and bibliography expert. Format the following source information into proper citations.\n\nCitation style: [APA 7th / MLA 9th / Chicago 17th / Harvard / IEEE / Vancouver]\n\nSource information (I'll provide what I have — fill in the standard format):\n- Author(s): [AUTHOR NAMES]\n- Year: [YEAR]\n- Title: [TITLE OF WORK]\n- Source: [JOURNAL NAME / BOOK PUBLISHER / WEBSITE / CONFERENCE]\n- Volume/Issue: [IF APPLICABLE]\n- Pages: [IF APPLICABLE]\n- DOI/URL: [IF AVAILABLE]\n- Type: [JOURNAL ARTICLE / BOOK / BOOK CHAPTER / WEBSITE / CONFERENCE PAPER / THESIS]\n\nFor each source, provide:\n1. **Full reference list entry** — formatted exactly to the style guide specification\n2. **In-text citation** — both parenthetical and narrative forms\n3. **Common mistakes to avoid** for this type of source in this style\n4. **Notes** — flag anything missing that the style guide requires and suggest how to find it\n\nIf I provide multiple sources, also:\n5. Sort them in the correct order for the reference list (alphabetical by author for APA, numbered for IEEE, etc.)\n6. Show how to handle repeated authors or same-year publications\n\nBe precise about punctuation, italics (indicate with *asterisks*), capitalization rules, and hanging indentation formatting.",
        category: "research",
        tags: ["citations", "bibliography", "reference formatting"],
        useCase:
          "Use when you have source information and need to format it correctly in a specific citation style.",
        exampleInput:
          "Style: APA 7th. Author: John Smith and Maria Garcia. Year: 2023. Title: The effects of remote learning on student engagement. Journal: Journal of Educational Research. Volume 45, Issue 2, pages 112-130. DOI: 10.1234/jer.2023.045",
        exampleOutput:
          "Reference entry: Smith, J., & Garcia, M. (2023). The effects of remote learning on student engagement. *Journal of Educational Research*, *45*(2), 112–130. https://doi.org/10.1234/jer.2023.045. In-text (parenthetical): (Smith & Garcia, 2023). In-text (narrative): Smith and Garcia (2023)...",
        targetKeywords: [
          "citation formatter prompt",
          "AI citation generator",
          "APA citation template",
        ],
        relatedTemplates: ["literature-review-synthesizer", "academic-paper-outliner"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "abstract-writer",
        title: "Abstract Writer",
        description:
          "Draft a structured academic abstract that covers all essential components within word limits.",
        prompt:
          "You are a scholarly writing specialist. Write an abstract for my [PAPER TYPE] in [FIELD OF STUDY].\n\nPaper details:\n- Title: [PAPER TITLE]\n- Research question: [YOUR RESEARCH QUESTION]\n- Methodology: [DESCRIBE YOUR METHOD IN 2-3 SENTENCES]\n- Key findings: [LIST 2-4 MAIN RESULTS]\n- Main conclusion: [YOUR PRIMARY TAKEAWAY]\n- Practical implications: [HOW THIS APPLIES IN THE REAL WORLD]\n\nRequirements:\n- Word limit: [WORD LIMIT, typically 150-300]\n- Style: [STRUCTURED with labeled sections / UNSTRUCTURED single paragraph]\n- Citation style context: [APA / IMRaD / other]\n\nWrite the abstract following this structure:\n1. **Background** (1-2 sentences): Establish the context and importance of the research area\n2. **Objective** (1 sentence): State the specific aim or research question\n3. **Methods** (2-3 sentences): Describe the approach, sample, and analysis method\n4. **Results** (2-3 sentences): Present the key quantitative or qualitative findings with specific data points\n5. **Conclusion** (1-2 sentences): State the main takeaway and its implications\n\nAlso provide:\n- 5 keywords for journal indexing (check that they differ from words in the title)\n- A lay summary version (2 sentences, no jargon) for press releases or social media\n- Word count of the abstract\n\nUse active voice where possible. Avoid vague phrases like 'results were discussed' — be specific about what was found.",
        category: "research",
        tags: ["abstract", "paper summary", "academic writing"],
        useCase:
          "Use after completing your research to write a concise abstract that captures all essential elements of your paper.",
        exampleInput:
          "Paper type: Journal article. Field: Public Health. Title: Walking School Bus Programs and Childhood Obesity Rates. Method: Quasi-experimental study of 12 elementary schools over 2 years. Key finding: 14% reduction in BMI percentile among participants. Word limit: 250.",
        exampleOutput:
          "Background: Childhood obesity remains a critical public health challenge, with sedentary transportation patterns contributing to insufficient physical activity among school-age children. Objective: This study examined whether Walking School Bus (WSB) programs reduce BMI percentile among elementary school students over a two-year period...",
        targetKeywords: [
          "abstract writer prompt",
          "AI abstract generator",
          "academic abstract template",
        ],
        relatedTemplates: ["academic-paper-outliner", "literature-review-synthesizer"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "methodology-section-drafter",
        title: "Methodology Section Drafter",
        description:
          "Draft a rigorous methodology section with research design, sampling, and analysis details.",
        prompt:
          "You are a research methodology expert. Help me draft the methodology section for my [FIELD OF STUDY] research paper.\n\nStudy details:\n- Research question: [YOUR RESEARCH QUESTION]\n- Approach: [QUANTITATIVE / QUALITATIVE / MIXED METHODS]\n- Research design: [e.g., experimental, survey, case study, ethnography, grounded theory]\n- Participants/sample: [WHO, HOW MANY, HOW SELECTED]\n- Data collection method: [e.g., surveys, interviews, observation, archival data]\n- Instruments: [DESCRIBE ANY QUESTIONNAIRES, SCALES, OR TOOLS USED]\n- Analysis method: [e.g., regression, thematic analysis, content analysis, SEM]\n- Ethics: [IRB STATUS, CONSENT PROCEDURES]\n\nDraft a methodology section that includes:\n1. **Research Design**: Justify why this design is appropriate for your research question. Reference a methodological authority (suggest a citation placeholder).\n2. **Participants/Sampling**: Describe the population, sampling strategy, sample size, and inclusion/exclusion criteria. If quantitative, justify sample size with a power analysis rationale.\n3. **Data Collection**: Step-by-step procedure from recruitment through data collection. Include timeline.\n4. **Instruments/Measures**: Describe each instrument, its validity and reliability (Cronbach's alpha, etc.), and any adaptations made.\n5. **Data Analysis**: Detail the analysis procedure step by step, including any software used, coding procedures (for qualitative), or statistical tests (for quantitative).\n6. **Validity and Reliability / Trustworthiness**: Address threats to validity (quantitative) or credibility, transferability, dependability, and confirmability (qualitative).\n7. **Ethical Considerations**: IRB approval, informed consent, anonymity, data storage.\n\nWrite in past tense, third person, and formal academic tone. Target approximately [WORD COUNT] words.",
        category: "research",
        tags: ["methodology", "research design", "methods section"],
        useCase:
          "Use when drafting the methods section of a research paper to ensure all essential components are addressed rigorously.",
        exampleInput:
          "Field: Nursing. Question: How do night-shift nurses experience compassion fatigue? Approach: Qualitative. Design: Phenomenological. Participants: 20 ICU nurses via purposive sampling. Data collection: Semi-structured interviews. Analysis: Interpretive phenomenological analysis.",
        exampleOutput:
          "An interpretive phenomenological analysis (IPA) design was employed to explore the lived experiences of compassion fatigue among night-shift ICU nurses (Smith et al., 2009). This approach was selected because the research question centers on understanding subjective meaning-making processes...",
        targetKeywords: [
          "methodology section prompt",
          "AI methods section writer",
          "research methodology template",
        ],
        relatedTemplates: ["research-question-refiner", "academic-paper-outliner"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "survey-question-generator",
        title: "Survey Question Generator",
        description:
          "Generate validated survey questions with proper scales and response options for research studies.",
        prompt:
          "You are a survey design and psychometrics specialist. Help me create survey questions for my research study.\n\nStudy context:\n- Research question: [YOUR RESEARCH QUESTION]\n- Target population: [WHO WILL TAKE THE SURVEY]\n- Constructs to measure: [LIST THE VARIABLES/CONCEPTS YOU NEED TO MEASURE]\n- Survey length goal: [NUMBER OF QUESTIONS OR COMPLETION TIME]\n- Distribution method: [ONLINE / PAPER / PHONE / IN-PERSON]\n\nFor each construct, provide:\n1. **Operational definition**: How you're defining and measuring this construct\n2. **5-7 survey items** using [SCALE TYPE: Likert 5-point / Likert 7-point / semantic differential / multiple choice / open-ended]\n3. **Response anchors**: Exact wording for scale endpoints and midpoints\n4. **2 reverse-coded items** to detect acquiescence bias\n5. **Existing validated scale reference**: If a published scale exists for this construct, suggest it with citation placeholder\n\nAlso include:\n- 3 demographic questions appropriate for your population\n- 2 attention-check questions embedded naturally\n- An informed consent preamble\n- Estimated completion time\n- Recommendations for question ordering (which sections first and why)\n\nAvoid double-barreled questions, leading questions, and jargon. Write at a [READING LEVEL, e.g., 8th grade] reading level. Flag any cultural sensitivity considerations.",
        category: "research",
        tags: ["survey design", "questionnaire", "psychometrics"],
        useCase:
          "Use when designing a research survey to generate well-structured questions with validated scales and proper methodology.",
        exampleInput:
          "Research question: How does social media use affect academic self-efficacy in college students? Population: Undergraduates ages 18-24. Constructs: social media usage intensity, academic self-efficacy, procrastination tendency. Scale type: Likert 5-point.",
        exampleOutput:
          "Construct 1: Social Media Usage Intensity — Operational definition: The frequency and duration of active and passive engagement with social media platforms. Item 1: 'I check social media before starting my academic work' (1=Never to 5=Always). Item 2 (reverse-coded): 'I can easily go a full day without checking social media'...",
        targetKeywords: [
          "survey question generator prompt",
          "AI survey design tool",
          "research questionnaire template",
        ],
        relatedTemplates: ["research-question-refiner", "data-interpretation-narrator"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "grant-proposal-section-writer",
        title: "Grant Proposal Section Writer",
        description:
          "Draft compelling grant proposal sections with clear objectives, significance, and budget justification.",
        prompt:
          "You are a grant writing consultant with experience in [FUNDING AGENCY, e.g., NSF, NIH, ERC, SSHRC] proposals. Help me draft a section of my grant proposal.\n\nProject details:\n- Project title: [YOUR PROJECT TITLE]\n- Principal Investigator background: [BRIEF BIO AND EXPERTISE]\n- Field: [RESEARCH AREA]\n- Funding agency: [TARGET FUNDER]\n- Grant mechanism: [e.g., R01, CAREER, Standard Grant, Fellowship]\n- Requested amount: [BUDGET]\n- Duration: [PROJECT TIMELINE]\n\nSection to draft: [CHOOSE ONE: Specific Aims / Project Significance / Innovation / Research Plan / Budget Justification / Broader Impacts]\n\nFor the selected section, provide:\n1. A complete draft following the funder's expected format and review criteria\n2. Clear, jargon-free language that a review panel across subfields can understand\n3. Bold or italic formatting suggestions for key sentences that reviewers will scan\n4. Specific aims (if that section): Use the Heilmeier Catechism structure — What are you trying to do? How is it done today? What is new? If successful, what difference will it make?\n5. Explicit connections to the funder's stated priorities and review criteria\n6. Suggested figures or diagrams to include (describe what they should show)\n\nAlso provide:\n- 3 potential weaknesses a reviewer might raise and preemptive responses\n- A one-paragraph summary suitable for the project summary/abstract page\n- Tone guidance: confident but not arrogant, specific not vague\n\nWrite in future tense for proposed work and present tense for established facts.",
        category: "research",
        tags: ["grant writing", "research funding", "proposal"],
        useCase:
          "Use when writing a grant proposal to draft sections that align with funder expectations and review criteria.",
        exampleInput:
          "Section: Specific Aims. Project: Using machine learning to predict antibiotic resistance from metagenomic data. Funder: NIH R01. PI background: Computational biologist with 10 years in genomics. Budget: $1.2M over 5 years.",
        exampleOutput:
          "Specific Aims: Antimicrobial resistance (AMR) is projected to cause 10 million deaths annually by 2050, yet current surveillance methods rely on slow culture-based approaches. **We propose to develop and validate a machine learning framework that predicts phenotypic antibiotic resistance directly from metagenomic sequencing data.** Aim 1: Build a curated training dataset of 50,000 paired metagenome-resistance profiles...",
        targetKeywords: [
          "grant proposal prompt",
          "AI grant writing assistant",
          "research funding template",
        ],
        relatedTemplates: ["abstract-writer", "academic-paper-outliner"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "data-interpretation-narrator",
        title: "Data Interpretation Narrator",
        description:
          "Transform statistical results and data outputs into clear, publication-ready narrative descriptions.",
        prompt:
          "You are a statistical reporting specialist. Help me interpret and narrate my research results for a [PAPER TYPE] in [FIELD OF STUDY].\n\nAnalysis results:\n- Statistical test used: [e.g., t-test, ANOVA, regression, chi-square, thematic analysis]\n- Software: [e.g., SPSS, R, Python, NVivo]\n- Key output: [PASTE YOUR STATISTICAL OUTPUT, TABLE, OR FINDINGS SUMMARY]\n- Sample size: [N]\n- Significance level: [ALPHA, e.g., 0.05]\n\nFor each result, provide:\n1. **Plain language interpretation**: What does this result mean in the context of your research question?\n2. **Publication-ready narrative**: Written in APA style (or [SPECIFIED STYLE]) with proper statistical notation\n   - Format: Variable relationship, test statistic, degrees of freedom, p-value, effect size, confidence interval\n   - Example format: 'A significant positive correlation was found between X and Y, r(48) = .56, p < .001, 95% CI [.32, .73]'\n3. **Effect size interpretation**: Is this a small, medium, or large effect using Cohen's conventions (or field-appropriate benchmarks)?\n4. **Practical significance**: Beyond statistical significance, does this matter in the real world?\n5. **Table or figure suggestion**: Recommend how to present this result visually\n6. **Limitations of this analysis**: What caveats should accompany this finding?\n\nReport exact p-values (not just p < .05). Use two decimal places for test statistics and three for p-values. Note any assumptions that should be checked.",
        category: "research",
        tags: ["data interpretation", "statistical reporting", "results section"],
        useCase:
          "Use when you have statistical output and need to write a clear, properly formatted results narrative for your paper.",
        exampleInput:
          "Test: Multiple regression in SPSS. DV: job satisfaction. IVs: autonomy (beta=.42, p<.001), salary (beta=.18, p=.03), commute time (beta=-.11, p=.21). R-squared=.31. N=156. Field: Industrial-Organizational Psychology.",
        exampleOutput:
          "A multiple regression analysis was conducted to examine predictors of job satisfaction among 156 employees. The model explained a significant proportion of variance, R² = .31, F(3, 152) = 22.75, p < .001. Autonomy was the strongest predictor (β = .42, p < .001), representing a medium-to-large effect...",
        targetKeywords: [
          "data interpretation prompt",
          "AI statistics narrator",
          "results section writer",
        ],
        relatedTemplates: ["survey-question-generator", "methodology-section-drafter"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "peer-review-feedback-drafter",
        title: "Peer Review Feedback Drafter",
        description:
          "Draft constructive peer review feedback for academic papers with specific suggestions for improvement.",
        prompt:
          "You are an experienced peer reviewer for academic journals in [FIELD OF STUDY]. Help me draft a constructive peer review for a manuscript I've been asked to review.\n\nManuscript details:\n- Title: [MANUSCRIPT TITLE]\n- Journal: [TARGET JOURNAL]\n- Paper type: [ORIGINAL RESEARCH / REVIEW / THEORETICAL / CASE STUDY]\n- Brief summary: [2-3 SENTENCE SUMMARY OF THE PAPER]\n- My overall assessment: [STRONG / HAS POTENTIAL / SIGNIFICANT ISSUES / NOT SUITABLE]\n\nAreas I want to address:\n- Strengths I noticed: [LIST 2-3 STRENGTHS]\n- Concerns about methodology: [DESCRIBE CONCERNS]\n- Concerns about analysis/results: [DESCRIBE CONCERNS]\n- Writing quality issues: [DESCRIBE ISSUES]\n- Missing references or context: [NOTE GAPS]\n\nDraft a peer review that includes:\n1. **Summary paragraph**: Briefly restate the paper's aim and contribution (show the authors you read it carefully)\n2. **Major strengths** (2-3 points): What the paper does well — be specific and generous\n3. **Major concerns** (2-4 points): Significant issues that must be addressed. For each:\n   - State the concern clearly\n   - Explain why it matters\n   - Suggest a specific way to address it\n4. **Minor concerns** (3-5 points): Smaller issues like missing citations, unclear figures, or writing style\n5. **Questions for the authors**: 2-3 clarifying questions\n6. **Recommendation**: [ACCEPT / MINOR REVISIONS / MAJOR REVISIONS / REJECT] with brief justification\n\nTone: Professional, constructive, and respectful. Critique the work, not the authors. Frame suggestions as improvements rather than failures. Use phrases like 'The paper would benefit from...' and 'I recommend the authors consider...'",
        category: "research",
        tags: ["peer review", "manuscript review", "academic feedback"],
        useCase:
          "Use when you need to write a thoughtful, well-structured peer review that provides actionable feedback to authors.",
        exampleInput:
          "Field: Environmental Science. Title: Microplastic Concentration in Urban Stormwater Runoff. Assessment: Has potential but methodology needs strengthening. Strengths: novel sampling approach, large dataset. Concerns: no control sites, unclear statistical justification for sample size.",
        exampleOutput:
          "This manuscript presents a timely investigation of microplastic concentrations in urban stormwater systems, addressing an important gap in environmental monitoring. The novel stratified sampling approach across 45 sites is commendable. However, several methodological concerns should be addressed. Major concern 1: The absence of control sites (non-urban or upstream reference points) limits the ability to attribute observed concentrations to urban sources...",
        targetKeywords: [
          "peer review template prompt",
          "AI peer review drafter",
          "academic review feedback",
        ],
        relatedTemplates: ["abstract-writer", "literature-review-synthesizer"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
    ],
  },

  // ── Design & UX ──────────────────────────────────────────────────────────
  {
    slug: "design",
    title: "Design & UX Prompts",
    description:
      "AI prompt templates for user experience research, wireframing, design systems, accessibility audits, and UX copywriting. Works with ChatGPT, Claude, and Gemini.",
    longDescription:
      "Streamline your design workflow with tested prompt templates for writing user stories, conducting UX research, generating microcopy, and building design system documentation. Each template is crafted for real design work — from early discovery research through to polished handoff documentation. Paste them into any AI assistant and customize the bracketed placeholders to match your product and users.",
    icon: "🎯",
    keywords: [
      "design prompts",
      "UX prompts",
      "UI prompts",
      "ChatGPT for designers",
      "AI prompts for design",
    ],
    relatedCategories: ["coding", "project-management", "creative-writing"],
    templates: [
      {
        slug: "user-story-writer",
        title: "User Story Writer",
        description:
          "Generate well-structured user stories with acceptance criteria and edge cases for product development.",
        prompt:
          "You are a senior product designer and agile coach. Write detailed user stories for a [PRODUCT TYPE] feature.\n\nFeature overview: [DESCRIBE THE FEATURE IN 2-3 SENTENCES]\nTarget users: [PRIMARY USER PERSONA AND THEIR GOALS]\nBusiness objective: [WHAT THE BUSINESS HOPES TO ACHIEVE]\nTechnical constraints: [ANY KNOWN LIMITATIONS OR DEPENDENCIES]\n\nFor each user story, provide:\n1. **User story** in standard format: 'As a [user type], I want to [action] so that [benefit]'\n2. **Acceptance criteria** using Given/When/Then format (3-5 criteria per story)\n3. **Edge cases**: 2-3 scenarios that could break the feature or confuse users\n4. **Priority**: Must-have / Should-have / Nice-to-have (MoSCoW method)\n5. **Story points estimate**: S / M / L with brief justification\n6. **Dependencies**: Other stories or systems this depends on\n\nGenerate 5-7 user stories that cover:\n- The primary happy path\n- Error handling and recovery\n- First-time user experience\n- Power user shortcuts\n- Accessibility requirements\n\nEnsure stories are independent, negotiable, valuable, estimable, small, and testable (INVEST criteria). Order them by suggested implementation priority.",
        category: "design",
        tags: ["user stories", "agile", "product design"],
        useCase:
          "Use when breaking down a feature into implementable user stories with clear acceptance criteria for your development team.",
        exampleInput:
          "Product: Mobile banking app. Feature: Peer-to-peer money transfers. Target users: Young adults (22-35) who split bills frequently. Business objective: Increase daily active users. Constraint: Must integrate with existing KYC verification.",
        exampleOutput:
          "Story 1 (Must-have, M): 'As a verified user, I want to send money to a contact by entering their phone number so that I can split a bill quickly.' Acceptance criteria: Given the user has a verified account and sufficient balance, When they enter a valid phone number and amount, Then the transfer is initiated and both parties receive confirmation within 5 seconds...",
        targetKeywords: [
          "user story generator prompt",
          "AI user story writer",
          "agile user story template",
        ],
        relatedTemplates: ["ux-research-interview-script", "user-flow-description-writer"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "ux-research-interview-script",
        title: "UX Research Interview Script",
        description:
          "Create a structured interview script for user research with warm-up, core, and wrap-up questions.",
        prompt:
          "You are a UX researcher with expertise in qualitative research methods. Create an interview script for a [RESEARCH TYPE, e.g., discovery, usability, concept testing] study.\n\nResearch context:\n- Product: [PRODUCT NAME AND DESCRIPTION]\n- Research objective: [WHAT YOU WANT TO LEARN]\n- Target participants: [WHO YOU'RE INTERVIEWING]\n- Session length: [DURATION, e.g., 45 minutes]\n- Interview format: [IN-PERSON / REMOTE VIDEO / PHONE]\n\nCreate a complete interview script with:\n1. **Introduction script** (2 minutes): Greeting, purpose explanation, consent and recording permission, confidentiality assurance, 'no wrong answers' framing\n2. **Warm-up questions** (5 minutes): 3-4 easy questions to build rapport and understand context\n3. **Core questions** (25-30 minutes): 8-12 questions organized by research theme\n   - For each question, include:\n     - The main question (open-ended, non-leading)\n     - 2-3 follow-up probes (for when you need to dig deeper)\n     - What insight this question targets\n4. **Task-based section** (if applicable, 10 minutes): Describe 2-3 tasks for the participant to complete while thinking aloud\n5. **Wrap-up** (5 minutes): Summary question, anything we missed, thank you script, next steps\n\nGuidelines:\n- Avoid leading questions (not 'Don't you think X is hard?' but 'Tell me about your experience with X')\n- Use the funnel technique: broad to specific\n- Include transition phrases between sections\n- Note where to pause and let silence work\n- Include a debrief checklist for immediately after the session",
        category: "design",
        tags: ["user research", "interview script", "qualitative research"],
        useCase:
          "Use when planning user interviews to ensure consistent, unbiased data collection across all sessions.",
        exampleInput:
          "Research type: Discovery. Product: Meal planning app. Objective: Understand how families plan weekly meals and where pain points exist. Participants: Parents who cook 4+ meals per week at home. Duration: 45 minutes. Format: Remote video.",
        exampleOutput:
          "Introduction: 'Thank you for taking the time to speak with me today. I'm researching how families approach meal planning. There are no right or wrong answers — I'm simply interested in your honest experience...' Warm-up: 'To start, can you tell me a bit about your household — who you typically cook for?' Core Q1 (Current behavior): 'Walk me through what happens when you plan meals for the week.' Probe: 'At what point do you decide what to cook?'...",
        targetKeywords: [
          "UX interview script prompt",
          "user research template",
          "AI UX research tool",
        ],
        relatedTemplates: ["user-story-writer", "heuristic-evaluation-framework"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "wireframe-description-generator",
        title: "Wireframe Description Generator",
        description:
          "Generate detailed wireframe descriptions and layout specifications for any screen or page.",
        prompt:
          "You are a senior UX designer. Generate a detailed wireframe description for a [SCREEN/PAGE TYPE] in a [PRODUCT TYPE].\n\nScreen context:\n- Screen name: [NAME, e.g., User Dashboard, Checkout Page, Settings]\n- User goal on this screen: [WHAT THE USER IS TRYING TO ACCOMPLISH]\n- Entry points: [HOW USERS ARRIVE AT THIS SCREEN]\n- Exit points: [WHERE USERS GO NEXT]\n- Device: [DESKTOP / MOBILE / TABLET / RESPONSIVE]\n- Design system: [MATERIAL DESIGN / iOS HIG / CUSTOM / NOT YET DEFINED]\n\nProvide a detailed wireframe specification:\n1. **Layout structure**: Describe the page layout using a grid system (columns, rows, spacing). Define header, main content, sidebar (if any), and footer zones.\n2. **Component inventory**: List every UI element on the screen, grouped by section:\n   - Element type (button, input field, card, modal, navigation, etc.)\n   - Content/label\n   - State variations (default, hover, active, disabled, error, loading, empty)\n   - Size/prominence hierarchy\n3. **Content hierarchy**: Define the visual hierarchy using heading levels (H1, H2, body, caption) and specify what content is primary, secondary, and tertiary.\n4. **Interaction notes**: For each interactive element, describe what happens on click/tap, including:\n   - Navigation destination\n   - State changes\n   - Animations or transitions\n   - Loading states\n5. **Responsive behavior**: How the layout adapts from desktop to mobile (what stacks, collapses, or hides).\n6. **Accessibility notes**: Tab order, ARIA labels needed, color contrast requirements, screen reader announcements.\n7. **Edge cases**: Empty states, error states, maximum content scenarios, first-time user state.",
        category: "design",
        tags: ["wireframe", "layout", "UI specification"],
        useCase:
          "Use when you need to communicate a screen design to developers or stakeholders without a visual tool, or as a starting point before opening Figma.",
        exampleInput:
          "Screen: User Dashboard for a project management SaaS. Goal: See an overview of all active projects and pending tasks. Device: Desktop (responsive). Entry: After login. Design system: Custom with Tailwind.",
        exampleOutput:
          "Layout: 12-column grid, 24px gutters. Left sidebar (3 cols): Navigation with project list, collapsible on <1024px. Main content (9 cols): Top section — greeting banner (H1: 'Good morning, [Name]', subtitle: '3 tasks due today') with date. Below: 2-column card grid showing active projects (each card: project name H3, progress bar, member avatars, due date badge)...",
        targetKeywords: [
          "wireframe description prompt",
          "AI wireframe generator",
          "UI layout template",
        ],
        relatedTemplates: ["design-system-documentation", "user-flow-description-writer"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "design-system-documentation",
        title: "Design System Documentation",
        description:
          "Generate comprehensive design system documentation for components, tokens, and usage guidelines.",
        prompt:
          "You are a design systems lead. Create documentation for a component in our design system.\n\nComponent details:\n- Component name: [NAME, e.g., Button, Modal, Toast, Data Table]\n- Product context: [WHAT KIND OF PRODUCT THIS IS FOR]\n- Tech stack: [e.g., React + Tailwind, Vue + SCSS, SwiftUI]\n- Existing design tokens: [LIST ANY ESTABLISHED COLORS, SPACING, TYPOGRAPHY]\n\nGenerate complete component documentation:\n1. **Overview**: 2-3 sentence description of the component's purpose and when to use it\n2. **Anatomy**: Break down the component into its visual parts (container, label, icon, etc.) with names for each part\n3. **Variants**: List all variants with descriptions:\n   - Visual variants (primary, secondary, tertiary, ghost, destructive)\n   - Size variants (small, medium, large)\n   - State variants (default, hover, active, focus, disabled, loading)\n4. **Props / API** (for developers):\n   - Property name, type, default value, description\n   - Required vs. optional\n5. **Design tokens**: Specify spacing, colors, typography, border-radius, shadows using token names\n6. **Usage guidelines**:\n   - Do's and Don'ts (3 each) with specific examples\n   - When to use this component vs. alternatives\n   - Content guidelines (character limits, tone, capitalization)\n7. **Accessibility**:\n   - ARIA roles and attributes\n   - Keyboard interaction pattern\n   - Color contrast requirements (WCAG AA minimum)\n   - Screen reader behavior\n8. **Responsive behavior**: How the component adapts across breakpoints\n9. **Code example**: A usage snippet in [TECH STACK]",
        category: "design",
        tags: ["design system", "component documentation", "design tokens"],
        useCase:
          "Use when building or expanding a design system and need thorough documentation for a new or existing component.",
        exampleInput:
          "Component: Toast/Notification. Product: B2B analytics dashboard. Tech stack: React + Tailwind. Tokens: color-success-500, color-error-500, color-warning-500, color-info-500, spacing-4, spacing-8, radius-md.",
        exampleOutput:
          "Overview: The Toast component displays brief, non-intrusive messages to inform users about the outcome of an action. Toasts appear in the top-right corner, auto-dismiss after 5 seconds, and stack vertically. Anatomy: Container (rounded rectangle with left accent border), Icon (status-specific), Title (optional, bold), Message (body text), Dismiss button (X icon, top-right)...",
        targetKeywords: [
          "design system documentation prompt",
          "AI component docs generator",
          "design system template",
        ],
        relatedTemplates: ["wireframe-description-generator", "accessibility-audit-checklist"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "accessibility-audit-checklist",
        title: "Accessibility Audit Checklist",
        description:
          "Generate a comprehensive WCAG-based accessibility audit checklist tailored to your product.",
        prompt:
          "You are a digital accessibility specialist certified in WCAG 2.2 standards. Create a tailored accessibility audit checklist for my [PRODUCT TYPE].\n\nProduct details:\n- Product: [PRODUCT NAME AND DESCRIPTION]\n- Platform: [WEB / iOS / ANDROID / DESKTOP / CROSS-PLATFORM]\n- Target WCAG level: [A / AA / AAA]\n- Key user flows to audit: [LIST 3-5 PRIMARY USER FLOWS]\n- Known user groups with disabilities: [e.g., screen reader users, low vision, motor impairments, cognitive disabilities]\n- Tech stack: [RELEVANT FRAMEWORKS AND LIBRARIES]\n\nGenerate an audit checklist organized by WCAG principle:\n\n**1. Perceivable:**\n- 5-7 specific checks for your product (images, media, text alternatives, contrast)\n- For each: the WCAG criterion number, what to test, how to test it, pass/fail criteria, and common mistakes\n\n**2. Operable:**\n- 5-7 checks (keyboard navigation, timing, seizures, navigation)\n- Include specific keyboard interaction patterns for your product's interactive elements\n\n**3. Understandable:**\n- 4-6 checks (readability, predictability, input assistance)\n- Include form-specific checks if your product has forms\n\n**4. Robust:**\n- 3-4 checks (parsing, compatibility with assistive technology)\n\nFor each check, provide:\n- [ ] Checkbox format for tracking\n- Severity if failed: Critical / Major / Minor\n- Recommended testing tools (e.g., axe, Lighthouse, VoiceOver, NVDA)\n- Quick fix suggestion if it commonly fails\n\nAlso include:\n- A screen reader testing script for the top 2 user flows\n- Color contrast ratio requirements with specific tool recommendations\n- A prioritized remediation plan template (fix critical issues first)",
        category: "design",
        tags: ["accessibility", "WCAG", "a11y audit"],
        useCase:
          "Use when auditing a product for accessibility compliance or establishing accessibility standards for a new project.",
        exampleInput:
          "Product: E-learning platform with video courses and quizzes. Platform: Web (React). Target: WCAG AA. Key flows: Course enrollment, video playback, quiz completion, certificate download. Users: Screen reader users, low-vision students.",
        exampleOutput:
          "Perceivable Check 1 [Critical]: WCAG 1.1.1 — All course thumbnail images have descriptive alt text that conveys the course topic, not just 'course image'. Test: Run axe DevTools scan on course catalog page. Common mistake: Using filename as alt text. Perceivable Check 2 [Critical]: WCAG 1.2.2 — All video content has synchronized captions that are accurate and properly timed...",
        targetKeywords: [
          "accessibility audit prompt",
          "WCAG checklist template",
          "AI accessibility audit",
        ],
        relatedTemplates: ["design-system-documentation", "heuristic-evaluation-framework"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "ab-test-hypothesis-builder",
        title: "A/B Test Hypothesis Builder",
        description:
          "Create structured A/B test hypotheses with metrics, sample size estimates, and success criteria.",
        prompt:
          "You are a growth designer specializing in experimentation and conversion optimization. Help me build a structured A/B test hypothesis.\n\nTest context:\n- Product: [PRODUCT NAME]\n- Page/feature being tested: [SPECIFIC PAGE OR FEATURE]\n- Current metric performance: [CURRENT CONVERSION RATE OR METRIC VALUE]\n- Observed problem: [WHAT USER BEHAVIOR OR DATA SUGGESTS SOMETHING ISN'T WORKING]\n- Proposed change: [WHAT YOU WANT TO CHANGE — be specific]\n- Primary metric: [WHAT YOU'RE MEASURING, e.g., click-through rate, sign-up rate]\n- Monthly traffic to this page: [APPROXIMATE VISITOR COUNT]\n\nGenerate:\n1. **Hypothesis statement** using the format: 'We believe that [change] for [audience] will result in [outcome] because [rationale based on evidence].'\n2. **Test design**:\n   - Control (A): Exactly what users see today\n   - Variant (B): Exactly what changes — describe the specific UI/copy differences\n   - Optional Variant (C): A more aggressive version if applicable\n3. **Metrics framework**:\n   - Primary metric (what determines success/failure)\n   - Secondary metrics (2-3 supporting metrics to monitor)\n   - Guardrail metrics (2 metrics that must NOT degrade, e.g., bounce rate, error rate)\n4. **Sample size and duration estimate**: Based on your traffic, minimum detectable effect, and 80% power / 95% significance\n5. **Segmentation plan**: User segments to analyze results by (new vs. returning, device, geography)\n6. **Success criteria**: Exact threshold for declaring a winner\n7. **Risk assessment**: What could go wrong and mitigation strategies\n8. **Documentation template**: A summary format to share results with stakeholders\n\nBase the rationale on UX principles, behavioral psychology, or industry benchmarks — not just gut feeling.",
        category: "design",
        tags: ["A/B testing", "experimentation", "conversion optimization"],
        useCase:
          "Use when planning an A/B test to ensure your hypothesis is structured, measurable, and grounded in evidence.",
        exampleInput:
          "Product: SaaS landing page. Feature: Pricing page. Current: 3.2% free trial sign-up rate. Problem: Users scroll to pricing but don't click. Change: Replace annual toggle with monthly-first display. Primary metric: Free trial starts. Monthly traffic: 50,000.",
        exampleOutput:
          "Hypothesis: 'We believe that displaying monthly pricing as the default view (instead of annual) for all pricing page visitors will increase free trial sign-up rate because users experience less sticker shock with smaller numbers, reducing decision friction.' Control (A): Annual pricing shown by default with monthly as toggle. Variant (B): Monthly pricing shown by default...",
        targetKeywords: [
          "A/B test hypothesis prompt",
          "AI experiment design tool",
          "conversion test template",
        ],
        relatedTemplates: ["user-story-writer", "heuristic-evaluation-framework"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "heuristic-evaluation-framework",
        title: "Heuristic Evaluation Framework",
        description:
          "Conduct a structured usability heuristic evaluation of any digital product using Nielsen's heuristics.",
        prompt:
          "You are a senior UX consultant. Conduct a heuristic evaluation of [PRODUCT/FEATURE] based on the information I provide.\n\nProduct details:\n- Product: [PRODUCT NAME AND TYPE]\n- Platform: [WEB / MOBILE / DESKTOP]\n- Key screens to evaluate: [LIST 3-5 SCREENS OR FLOWS]\n- Target users: [PRIMARY USER PERSONA]\n- Description of the interface: [DESCRIBE THE KEY UI ELEMENTS, NAVIGATION, AND LAYOUT. Or provide screenshots.]\n\nEvaluate against Nielsen's 10 Usability Heuristics, plus 2 modern additions:\n\n1. **Visibility of system status** — Does the system keep users informed?\n2. **Match between system and real world** — Does it use familiar language and concepts?\n3. **User control and freedom** — Can users undo, redo, and exit easily?\n4. **Consistency and standards** — Does it follow platform conventions?\n5. **Error prevention** — Does it prevent errors before they occur?\n6. **Recognition rather than recall** — Are options visible rather than memorized?\n7. **Flexibility and efficiency of use** — Does it accommodate both novice and expert users?\n8. **Aesthetic and minimalist design** — Is every element necessary and clear?\n9. **Help users recognize, diagnose, and recover from errors** — Are error messages helpful?\n10. **Help and documentation** — Is help available and easy to find?\n11. **Accessibility** — Can all users interact regardless of ability?\n12. **Performance perception** — Does the interface feel fast and responsive?\n\nFor each heuristic, provide:\n- **Rating**: 0 (no issue) to 4 (usability catastrophe)\n- **Finding**: Specific issue observed\n- **Location**: Where in the interface this occurs\n- **Recommendation**: Concrete fix with implementation priority (High/Medium/Low)\n- **Example**: How other products handle this well\n\nEnd with an executive summary: Top 5 critical findings, overall usability score (1-100), and a prioritized action plan.",
        category: "design",
        tags: ["heuristic evaluation", "usability audit", "UX review"],
        useCase:
          "Use when you need a structured expert review of a product's usability without conducting user testing.",
        exampleInput:
          "Product: Internal HR portal. Platform: Web. Screens: Employee directory, leave request form, payslip viewer, settings page. Users: Non-technical office employees aged 30-55.",
        exampleOutput:
          "Heuristic 1 — Visibility of system status. Rating: 3 (Major). Finding: The leave request form provides no progress indicator for its 4-step workflow, leaving users unsure how many steps remain. Location: Leave Request flow, all steps. Recommendation (High priority): Add a step indicator bar showing 'Step 2 of 4 — Select dates' at the top of each form page...",
        targetKeywords: [
          "heuristic evaluation prompt",
          "usability audit template",
          "UX heuristic review",
        ],
        relatedTemplates: ["accessibility-audit-checklist", "ab-test-hypothesis-builder"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "microcopy-generator",
        title: "Microcopy Generator",
        description:
          "Generate user-friendly microcopy for buttons, tooltips, error messages, and empty states.",
        prompt:
          "You are a UX writer specializing in microcopy. Generate interface copy for [PRODUCT NAME], a [PRODUCT TYPE].\n\nBrand voice: [DESCRIBE TONE, e.g., friendly but professional, playful, minimal and direct]\nTarget users: [WHO USES THIS PRODUCT]\n\nGenerate microcopy for the following UI elements:\n\n1. **Button labels** (5 variations each for):\n   - Primary CTA: [WHAT THE MAIN ACTION IS, e.g., sign up, purchase, submit]\n   - Secondary action: [SECONDARY ACTION, e.g., save draft, skip for now]\n   - Destructive action: [DELETE/REMOVE ACTION]\n\n2. **Error messages** (for each, write the error title, description, and recovery action):\n   - Form validation: [SPECIFIC FIELD, e.g., email, password, phone]\n   - Server error / timeout\n   - Permission denied\n   - Not found (404)\n\n3. **Empty states** (illustration description + headline + body + CTA for each):\n   - No results found (search)\n   - First-time experience (no content yet)\n   - No notifications\n\n4. **Tooltips and helpers** (concise, under 15 words each):\n   - 3 tooltips for your most complex features\n\n5. **Confirmation dialogs**:\n   - Unsaved changes warning\n   - Destructive action confirmation\n   - Successful action notification (toast)\n\n6. **Loading states**:\n   - Initial page load\n   - Action in progress\n   - Background process\n\nFor each piece of copy:\n- Keep it concise (as few words as possible while remaining clear)\n- Use active voice and present tense\n- Lead with the benefit or outcome, not the system action\n- Avoid technical jargon\n- Be specific about what to do next\n- Provide an A and B option so the team can choose",
        category: "design",
        tags: ["microcopy", "UX writing", "interface copy"],
        useCase:
          "Use when you need to write or improve the small but critical text elements across your product's interface.",
        exampleInput:
          "Product: CloudSync, a file backup and sharing SaaS. Brand voice: Confident and reassuring, minimal jargon. Users: Small business owners who are not tech-savvy.",
        exampleOutput:
          "Primary CTA options: (A) 'Back up now' (B) 'Protect my files'. Error — file too large: Title: 'This file is too big.' Description: 'The maximum file size is 2 GB. Try compressing the file or upgrading your plan for larger uploads.' CTA: 'See plan options'. Empty state — first backup: Headline: 'Your backup starts here.' Body: 'Drag files here or browse your computer to protect your first files.'...",
        targetKeywords: [
          "microcopy generator prompt",
          "UX writing template",
          "AI microcopy tool",
        ],
        relatedTemplates: ["wireframe-description-generator", "design-brief-creator"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "user-flow-description-writer",
        title: "User Flow Description Writer",
        description:
          "Document complete user flows with steps, decision points, and edge case handling.",
        prompt:
          "You are a UX designer specializing in interaction design. Document a complete user flow for [FEATURE/TASK] in [PRODUCT NAME].\n\nFlow context:\n- Feature: [WHAT THE USER IS TRYING TO ACCOMPLISH]\n- Entry point: [WHERE THE FLOW STARTS, e.g., homepage, notification, direct link]\n- Success state: [WHAT DEFINES SUCCESSFUL COMPLETION]\n- User type: [NEW USER / RETURNING USER / SPECIFIC ROLE]\n- Platform: [WEB / MOBILE / BOTH]\n\nDocument the flow with:\n1. **Flow overview**: A one-paragraph summary of the end-to-end journey\n2. **Step-by-step walkthrough**: For each step:\n   - Step number and name\n   - Screen/page the user is on\n   - What the user sees (key UI elements)\n   - What the user does (action taken)\n   - System response (what happens after the action)\n   - Decision points: Where the flow branches and why\n3. **Error paths**: At each step, what can go wrong and how the system recovers:\n   - Validation errors\n   - Network failures\n   - Permission issues\n   - Timeout scenarios\n4. **Edge cases**:\n   - User navigates away mid-flow (save state?)\n   - User is on a slow connection\n   - User has accessibility needs (keyboard-only, screen reader)\n   - Content overflow (very long text, many items)\n5. **Metrics to track**: For each step, suggest an analytics event name and what drop-off at that step would indicate\n6. **Flow diagram notation**: Write the flow in a text-based diagram format using arrows (→) for progression and diamonds for decisions\n\nExample format:\n[Entry] → [Step 1: See landing] → ◇ Logged in? → Yes → [Step 2a] / No → [Step 2b: Login] → [Step 2a]",
        category: "design",
        tags: ["user flow", "interaction design", "flow documentation"],
        useCase:
          "Use when documenting how users move through a feature so developers, designers, and stakeholders share a common understanding.",
        exampleInput:
          "Product: Event ticketing platform. Feature: Purchase a concert ticket (seat selection through confirmation). Entry: Event detail page. User: Returning user with saved payment method. Platform: Mobile.",
        exampleOutput:
          "Flow overview: The ticket purchase flow takes a returning user from the event page through seat selection, quantity confirmation, payment, and order confirmation in 5 core steps. Step 1 — View Event: User sees event details (date, venue, price range) with a 'Get Tickets' CTA. Action: Tap 'Get Tickets'. System: Loads interactive seat map with available sections highlighted...",
        targetKeywords: [
          "user flow documentation prompt",
          "AI user flow writer",
          "UX flow template",
        ],
        relatedTemplates: ["user-story-writer", "wireframe-description-generator"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "design-brief-creator",
        title: "Design Brief Creator",
        description:
          "Generate a comprehensive design brief that aligns stakeholders on scope, goals, and constraints.",
        prompt:
          "You are a design lead preparing a brief for a new project. Create a comprehensive design brief for [PROJECT NAME].\n\nProject context:\n- Company: [COMPANY NAME AND WHAT THEY DO]\n- Project type: [NEW PRODUCT / REDESIGN / FEATURE ADDITION / BRAND REFRESH]\n- Business goal: [WHAT SUCCESS LOOKS LIKE FOR THE BUSINESS]\n- Timeline: [START DATE TO LAUNCH DATE]\n- Budget range: [SMALL / MEDIUM / LARGE / SPECIFIC AMOUNT]\n- Team: [WHO IS INVOLVED — designers, devs, PMs, stakeholders]\n\nGenerate a design brief covering:\n1. **Project overview**: 3-4 sentences setting the context and vision\n2. **Problem statement**: What specific problem this project solves, backed by data or user feedback. Use the format: '[User] needs a way to [need] because [insight].'\n3. **Target audience**: Primary and secondary personas with demographics, behaviors, needs, and frustrations\n4. **Scope definition**:\n   - In scope: Specific deliverables and features\n   - Out of scope: What this project explicitly does NOT cover\n   - Phase 2 considerations: What might come later\n5. **Design principles**: 3-5 principles that should guide every design decision (e.g., 'Clarity over cleverness')\n6. **Success metrics**: 3-4 measurable KPIs with baseline and target values\n7. **Constraints and requirements**:\n   - Technical constraints\n   - Brand guidelines to follow\n   - Regulatory or compliance requirements\n   - Accessibility standards\n8. **Competitive landscape**: Suggest 3-5 competitors or analogous products to analyze, and what to look for in each\n9. **Timeline and milestones**: Key phases (discovery, design, testing, handoff) with dates\n10. **Approval process**: Who reviews, who approves, and how feedback is collected\n\nFormat the brief as a professional document that can be shared with stakeholders.",
        category: "design",
        tags: ["design brief", "project scoping", "stakeholder alignment"],
        useCase:
          "Use at the start of a design project to align all stakeholders on goals, scope, constraints, and success criteria.",
        exampleInput:
          "Company: GreenCart, an online grocery delivery startup. Project: Redesign the checkout flow to reduce cart abandonment. Timeline: 6 weeks. Team: 2 designers, 3 developers, 1 PM. Current abandonment rate: 68%.",
        exampleOutput:
          "Project overview: GreenCart's checkout experience currently loses 68% of users who add items to their cart. This redesign project will simplify the checkout flow from 5 steps to 3, optimize for mobile users (72% of traffic), and introduce a guest checkout option. Problem statement: 'Grocery shoppers who have filled their cart need a way to check out quickly because the current 5-step process creates friction...'",
        targetKeywords: [
          "design brief template prompt",
          "AI design brief generator",
          "UX project brief",
        ],
        relatedTemplates: ["user-story-writer", "microcopy-generator"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
    ],
  },

  // ── Project Management ───────────────────────────────────────────────────
  {
    slug: "project-management",
    title: "Project Management Prompts",
    description:
      "AI prompt templates for sprint planning, risk management, retrospectives, and stakeholder communication. Works with ChatGPT, Claude, and Gemini.",
    longDescription:
      "Run more effective projects with tested prompt templates for facilitating retrospectives, building risk registers, estimating sprints, and drafting stakeholder communications. Each template is designed for real project management workflows — from agile ceremonies to waterfall milestone tracking. Paste them into any AI assistant and customize the bracketed placeholders to match your project context.",
    icon: "📋",
    keywords: [
      "project management prompts",
      "ChatGPT for project managers",
      "agile prompts",
      "scrum prompts",
    ],
    relatedCategories: ["business-strategy", "productivity", "consulting"],
    templates: [
      {
        slug: "sprint-retrospective-facilitator",
        title: "Sprint Retrospective Facilitator",
        description:
          "Generate a structured sprint retrospective agenda with activities, discussion prompts, and action items.",
        prompt:
          "You are an experienced agile coach facilitating a sprint retrospective. Create a complete retrospective plan for our team.\n\nSprint context:\n- Sprint number/name: [SPRINT IDENTIFIER]\n- Sprint duration: [LENGTH, e.g., 2 weeks]\n- Team size: [NUMBER OF PEOPLE]\n- Sprint goal: [WHAT THE TEAM COMMITTED TO]\n- Outcome: [DID THEY MEET THE GOAL? WHAT WAS DELIVERED?]\n- Notable events: [ANY INCIDENTS, CHANGES, BLOCKERS, OR WINS]\n- Previous retro action items: [WHAT THE TEAM COMMITTED TO LAST TIME]\n- Team energy level: [HIGH / MEDIUM / LOW / MIXED]\n- Format: [IN-PERSON / REMOTE / HYBRID]\n\nCreate a retrospective agenda with:\n1. **Check-in activity** (5 minutes): A quick warm-up exercise to get everyone engaged and set the mood. Suggest 2 options (one for high-energy, one for low-energy teams).\n2. **Data gathering** (15 minutes): A structured activity for collecting observations. Choose from: Mad/Sad/Glad, 4Ls (Liked/Learned/Lacked/Longed for), Sailboat, or Timeline. Provide exact facilitation instructions.\n3. **Generate insights** (15 minutes): Guided discussion prompts to dig deeper into the patterns:\n   - 5 specific questions tailored to what happened this sprint\n   - Dot-voting instructions for prioritizing topics\n4. **Decide what to do** (10 minutes): Framework for turning insights into SMART action items:\n   - Template: '[WHO] will [DO WHAT] by [WHEN] to address [WHICH INSIGHT]'\n   - Limit to 2-3 actions maximum\n5. **Close the retro** (5 minutes): Appreciation round and feedback on the retro itself\n\nAlso provide:\n- A Miro/FigJam board layout description if remote\n- Facilitation tips for handling dominant voices and encouraging quiet team members\n- A follow-up message template to share action items with the team after the retro",
        category: "project-management",
        tags: ["retrospective", "agile", "scrum ceremonies"],
        useCase:
          "Use before facilitating a sprint retrospective to have a structured plan that keeps the meeting focused and productive.",
        exampleInput:
          "Sprint 14, 2-week sprint, 7 people. Goal: Launch user notifications. Outcome: Delivered email notifications but push notifications delayed due to API dependency. Previous action: Improve code review turnaround time. Energy: Medium. Format: Remote.",
        exampleOutput:
          "Check-in (5 min): 'One Word Weather Report' — Each person shares a weather word that describes their sprint (sunny, cloudy, stormy). Data gathering (15 min): 4Ls framework. Liked: What went well? Learned: What did we discover? Lacked: What was missing? Longed for: What do we wish we had? Each person writes 2 sticky notes per L (8 total)...",
        targetKeywords: [
          "sprint retrospective prompt",
          "retro facilitation template",
          "AI agile coach",
        ],
        relatedTemplates: ["sprint-planning-estimator", "post-mortem-report-writer"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "risk-register-builder",
        title: "Risk Register Builder",
        description:
          "Create a comprehensive project risk register with probability, impact, and mitigation strategies.",
        prompt:
          "You are a project risk management specialist. Build a risk register for [PROJECT NAME].\n\nProject context:\n- Project type: [SOFTWARE / CONSTRUCTION / MARKETING CAMPAIGN / PRODUCT LAUNCH / OTHER]\n- Duration: [TIMELINE]\n- Budget: [APPROXIMATE BUDGET]\n- Team size: [NUMBER OF PEOPLE]\n- Key dependencies: [EXTERNAL SYSTEMS, VENDORS, OR TEAMS YOU DEPEND ON]\n- Project phase: [PLANNING / EXECUTION / TESTING / LAUNCH]\n- Known concerns: [LIST ANY RISKS YOU'RE ALREADY AWARE OF]\n\nGenerate a risk register with 10-15 risks organized by category:\n\n**Categories:**\n1. Technical risks (3-4 risks)\n2. Resource and staffing risks (2-3 risks)\n3. Schedule risks (2-3 risks)\n4. External/dependency risks (2-3 risks)\n5. Scope and requirements risks (2-3 risks)\n\nFor each risk, provide:\n- **Risk ID**: R-001, R-002, etc.\n- **Risk description**: Clear statement of what could go wrong\n- **Category**: Which category it falls under\n- **Probability**: Low (10-30%) / Medium (31-60%) / High (61-90%)\n- **Impact**: Low / Medium / High / Critical\n- **Risk score**: Probability x Impact matrix value (1-25)\n- **Risk owner**: [ROLE] who is responsible for monitoring\n- **Trigger indicators**: Early warning signs that this risk is materializing\n- **Mitigation strategy**: Proactive steps to reduce probability or impact\n- **Contingency plan**: What to do if the risk occurs despite mitigation\n- **Status**: Open / Monitoring / Mitigated / Occurred\n\nAlso include:\n- A 5x5 probability-impact matrix visualization (text format)\n- Top 3 risks that need immediate attention with recommended actions\n- A review cadence recommendation (how often to reassess)\n- An escalation path for risks that exceed tolerance",
        category: "project-management",
        tags: ["risk management", "risk register", "mitigation planning"],
        useCase:
          "Use at the start of a project or during planning phases to proactively identify and plan for potential risks.",
        exampleInput:
          "Project: Mobile app rebuild from React Native to native Swift/Kotlin. Duration: 6 months. Budget: $500K. Team: 8 developers, 2 QA, 1 PM. Dependencies: Backend API team, third-party payment SDK. Phase: Planning.",
        exampleOutput:
          "R-001: Technical — Data migration from React Native async storage to native Core Data/Room may result in data loss for existing users. Probability: Medium (40%). Impact: Critical. Score: 20/25. Owner: Tech Lead. Trigger: Data mapping audit reveals incompatible schemas. Mitigation: Run parallel data stores during 2-sprint transition period with automated validation. Contingency: Roll back to RN app and extend migration timeline...",
        targetKeywords: [
          "risk register prompt",
          "AI risk management tool",
          "project risk template",
        ],
        relatedTemplates: ["requirements-document-generator", "change-request-document"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "stakeholder-communication-drafter",
        title: "Stakeholder Communication Drafter",
        description:
          "Draft professional project status updates and stakeholder communications with the right level of detail.",
        prompt:
          "You are a senior project manager. Draft a stakeholder communication for [PROJECT NAME].\n\nCommunication context:\n- Type: [STATUS UPDATE / ESCALATION / MILESTONE REACHED / DELAY NOTIFICATION / DECISION REQUEST / PROJECT KICKOFF SUMMARY]\n- Audience: [e.g., C-suite, client, cross-functional team, board of directors]\n- Audience's technical level: [NON-TECHNICAL / SEMI-TECHNICAL / TECHNICAL]\n- Communication channel: [EMAIL / SLACK / PRESENTATION SLIDE / MEETING AGENDA]\n- Urgency: [ROUTINE / TIME-SENSITIVE / URGENT]\n\nProject status:\n- Overall health: [GREEN / YELLOW / RED] with reason\n- Key accomplishments this period: [LIST 2-4 ACHIEVEMENTS]\n- Current blockers or risks: [LIST ANY ISSUES]\n- Upcoming milestones: [NEXT 2-3 MILESTONES WITH DATES]\n- Budget status: [ON TRACK / OVER / UNDER — by how much]\n- Timeline status: [ON TRACK / DELAYED — by how much]\n- Decisions needed: [ANY DECISIONS THE AUDIENCE MUST MAKE]\n\nDraft the communication including:\n1. **Subject line / title**: Clear and action-oriented\n2. **Executive summary**: 2-3 sentences — a busy executive should get the full picture from just this\n3. **Detailed update**: Organized by section with the level of detail appropriate for the audience\n4. **Risks and issues**: With status, impact, and what you're doing about them\n5. **Asks / Action items**: What you need from this audience, with deadlines\n6. **Next steps**: What's coming and when they'll hear from you again\n\nTone: [CONFIDENT / CAUTIOUS / URGENT]. Adjust formality based on audience. Use data and specifics — never say 'things are going well' without evidence.",
        category: "project-management",
        tags: ["stakeholder update", "project communication", "status report"],
        useCase:
          "Use when you need to write a professional project update that communicates the right information to the right audience.",
        exampleInput:
          "Type: Delay notification. Audience: VP of Engineering (semi-technical). Channel: Email. Project: API platform migration. Health: Yellow. Blocker: Third-party vendor delayed SDK delivery by 3 weeks. Decision needed: Approve revised timeline or increase contractor budget to parallelize work.",
        exampleOutput:
          "Subject: API Migration — 3-Week Delay: Decision Needed by Friday. Executive summary: The API platform migration has encountered a 3-week delay due to our payment SDK vendor missing their delivery date. I've identified two paths forward and need your input by Friday to keep downstream teams on track...",
        targetKeywords: [
          "stakeholder update prompt",
          "project status email template",
          "AI project communication",
        ],
        relatedTemplates: ["risk-register-builder", "post-mortem-report-writer"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "requirements-document-generator",
        title: "Requirements Document Generator",
        description:
          "Generate structured requirements documents with functional specs, acceptance criteria, and constraints.",
        prompt:
          "You are a business analyst and requirements engineer. Generate a requirements document for [FEATURE/PROJECT NAME].\n\nProject context:\n- Product: [PRODUCT NAME]\n- Feature/project: [WHAT IS BEING BUILT]\n- Requestor: [WHO ASKED FOR THIS AND WHY]\n- Target users: [WHO WILL USE THIS]\n- Business objective: [WHAT BUSINESS OUTCOME THIS ENABLES]\n- Technical environment: [TECH STACK, EXISTING SYSTEMS, INTEGRATIONS]\n- Timeline expectation: [WHEN IS THIS NEEDED]\n\nGenerate a requirements document with:\n\n1. **Purpose and scope**: What this document covers and its boundaries\n2. **Business requirements** (3-5): High-level needs from the business perspective\n   - BR-001: [Requirement] — Priority: [Must/Should/Could]\n3. **Functional requirements** (8-12): Specific system behaviors\n   - FR-001: [The system shall...] — Priority: [Must/Should/Could]\n   - Acceptance criteria for each in Given/When/Then format\n4. **Non-functional requirements** (5-8):\n   - Performance: Response time, throughput targets\n   - Security: Authentication, authorization, data protection\n   - Scalability: Expected load and growth\n   - Reliability: Uptime requirements, recovery time\n   - Usability: Accessibility standards, device support\n5. **Data requirements**: What data is created, read, updated, or deleted\n6. **Integration requirements**: APIs, third-party services, data flows\n7. **Constraints and assumptions**: What's fixed and what you're assuming to be true\n8. **Out of scope**: What is explicitly excluded\n9. **Dependencies**: What must be in place before this can be built\n10. **Glossary**: Define any domain-specific terms\n\nUse clear, testable language. Every requirement should be verifiable — avoid 'the system should be fast' (say 'the system shall respond within 200ms for 95th percentile requests').",
        category: "project-management",
        tags: ["requirements", "business analysis", "functional specification"],
        useCase:
          "Use when scoping a new feature or project to create a clear, shared understanding of what needs to be built.",
        exampleInput:
          "Product: Employee expense management app. Feature: Receipt scanning with OCR. Requestor: Finance director — wants to reduce manual data entry. Users: 500 employees submitting monthly expenses. Tech: React Native app, Node.js backend, PostgreSQL.",
        exampleOutput:
          "BR-001: Employees must be able to submit expense receipts by photographing them with their mobile device, eliminating manual data entry. Priority: Must. FR-001: The system shall extract merchant name, date, total amount, and currency from a photographed receipt with at least 95% accuracy. Acceptance criteria: Given a clear receipt photo, When the user captures the image, Then the extracted fields are pre-filled within 3 seconds...",
        targetKeywords: [
          "requirements document prompt",
          "AI requirements generator",
          "functional spec template",
        ],
        relatedTemplates: ["risk-register-builder", "raci-matrix-builder"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "post-mortem-report-writer",
        title: "Post-Mortem Report Writer",
        description:
          "Write a blameless post-mortem report with timeline, root cause analysis, and preventive actions.",
        prompt:
          "You are an incident management specialist. Write a blameless post-mortem report for [INCIDENT NAME].\n\nIncident details:\n- Date and time: [WHEN IT STARTED AND ENDED]\n- Duration: [HOW LONG THE INCIDENT LASTED]\n- Severity: [SEV-1 CRITICAL / SEV-2 MAJOR / SEV-3 MINOR]\n- Impact: [WHAT WAS AFFECTED — users, revenue, data]\n- Number of users affected: [APPROXIMATE COUNT]\n- Services affected: [LIST SYSTEMS OR SERVICES]\n- Detection method: [HOW WAS IT DISCOVERED — monitoring alert, user report, etc.]\n- Incident commander: [WHO LED THE RESPONSE]\n\nWhat happened:\n- Trigger: [WHAT INITIATED THE INCIDENT]\n- Contributing factors: [LIST ROOT CAUSES AND CONTRIBUTING FACTORS]\n- Timeline of events: [KEY EVENTS IN ORDER]\n- Resolution: [WHAT FIXED IT]\n\nWrite a post-mortem report including:\n1. **Executive summary**: 3-4 sentences covering what happened, impact, and current status\n2. **Impact assessment**: Quantified impact (users affected, revenue impact, SLA breach details)\n3. **Timeline**: Minute-by-minute reconstruction of key events using format:\n   - [HH:MM UTC] — [EVENT] — [WHO/WHAT]\n4. **Root cause analysis**: Use the '5 Whys' technique to trace from symptom to root cause\n5. **Contributing factors**: List all factors that enabled or worsened the incident (distinguish from root cause)\n6. **What went well**: 3-4 things the team did right during the response\n7. **What could be improved**: 3-4 areas where the response could have been faster or better\n8. **Action items**: For each, specify:\n   - Action: What needs to be done\n   - Owner: Who is responsible\n   - Priority: P0 (this week) / P1 (this sprint) / P2 (this quarter)\n   - Type: Prevent / Detect / Mitigate\n9. **Lessons learned**: 2-3 broader takeaways for the organization\n\nUse blameless language throughout — focus on systems and processes, not individuals. Replace 'X failed to...' with 'The process did not include...'",
        category: "project-management",
        tags: ["post-mortem", "incident report", "root cause analysis"],
        useCase:
          "Use after a significant incident to document what happened, learn from it, and prevent recurrence.",
        exampleInput:
          "Incident: Database failover caused 45-minute checkout outage. Severity: SEV-1. Impact: ~12,000 users could not complete purchases, estimated $180K revenue loss. Trigger: Automated DB maintenance script ran during peak hours due to timezone misconfiguration. Resolution: Manual failback and script schedule correction.",
        exampleOutput:
          "Executive summary: On March 1 at 14:23 UTC, an automated database maintenance script triggered an unplanned failover of the primary checkout database, resulting in a 45-minute outage affecting approximately 12,000 users and an estimated $180K in lost revenue. The root cause was a timezone misconfiguration that scheduled the maintenance during peak US traffic...",
        targetKeywords: [
          "post-mortem report prompt",
          "incident post-mortem template",
          "AI root cause analysis",
        ],
        relatedTemplates: ["sprint-retrospective-facilitator", "stakeholder-communication-drafter"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "resource-allocation-planner",
        title: "Resource Allocation Planner",
        description:
          "Plan team resource allocation across projects with capacity analysis and conflict resolution.",
        prompt:
          "You are a resource management specialist. Help me plan resource allocation for [TEAM/DEPARTMENT NAME].\n\nTeam context:\n- Team members: [LIST NAMES AND ROLES, e.g., 'Alice — Senior Dev, Bob — Junior Dev, Carol — Designer']\n- Available capacity per person: [HOURS PER WEEK OR SPRINT POINTS]\n- Current sprint/period: [DATE RANGE]\n- Planned time off: [LIST ANY PTO OR HOLIDAYS]\n\nProjects needing resources:\n- Project A: [NAME] — Needs: [ROLES AND ESTIMATED EFFORT] — Priority: [HIGH/MED/LOW] — Deadline: [DATE]\n- Project B: [NAME] — Needs: [ROLES AND ESTIMATED EFFORT] — Priority: [HIGH/MED/LOW] — Deadline: [DATE]\n- Project C: [NAME] — Needs: [ROLES AND ESTIMATED EFFORT] — Priority: [HIGH/MED/LOW] — Deadline: [DATE]\n\nGenerate a resource allocation plan:\n1. **Capacity analysis**: Total available hours vs. total requested hours. Identify if you're over/under-allocated overall and by role.\n2. **Allocation matrix**: Table showing each person's time split across projects:\n   - Person | Project A (%) | Project B (%) | Project C (%) | Buffer/Overhead (%)\n   - Ensure no one exceeds 85% allocation (15% buffer for meetings, admin, unplanned work)\n3. **Conflict resolution**: Where demand exceeds supply, recommend:\n   - Which project gets priority and why\n   - What gets delayed and by how much\n   - Whether contractors or cross-training could help\n4. **Risk assessment**: Flag single points of failure (only one person knows X)\n5. **Skill gap analysis**: Identify where skill gaps create allocation bottlenecks\n6. **Week-by-week view**: If relevant, show how allocation changes over the period as deadlines approach\n7. **Recommendations**: Top 3 actions to optimize resource usage\n\nConsider context-switching costs — a person split across 3+ projects loses ~20% productivity to switching overhead.",
        category: "project-management",
        tags: ["resource allocation", "capacity planning", "team management"],
        useCase:
          "Use when planning how to distribute your team across multiple projects to avoid overallocation and missed deadlines.",
        exampleInput:
          "Team: 5 developers (2 senior, 3 mid-level), 1 designer. Capacity: 40 hours/week each. Period: Next 4 weeks. Project A (Payment integration): Needs 2 senior devs full-time, 1 designer 50%. Priority: High. Deadline: 3 weeks. Project B (Dashboard redesign): Needs 1 dev, 1 designer 50%. Priority: Medium. Deadline: 4 weeks.",
        exampleOutput:
          "Capacity analysis: Total available: 240 dev-hours/week + 40 design-hours/week. Total demand: 200 dev-hours + 40 design-hours = 100% utilization with zero buffer. Risk: No capacity for unplanned work. Allocation: Alice (Senior Dev) — Project A: 85%, Buffer: 15%. Bob (Senior Dev) — Project A: 85%, Buffer: 15%...",
        targetKeywords: [
          "resource allocation prompt",
          "AI capacity planner",
          "team allocation template",
        ],
        relatedTemplates: ["sprint-planning-estimator", "raci-matrix-builder"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "sprint-planning-estimator",
        title: "Sprint Planning Estimator",
        description:
          "Facilitate sprint planning with story point estimation, capacity calculation, and commitment validation.",
        prompt:
          "You are an agile coach facilitating sprint planning. Help our team plan [SPRINT NAME/NUMBER].\n\nTeam context:\n- Sprint duration: [LENGTH, e.g., 2 weeks]\n- Team members: [LIST WITH ROLES]\n- Team velocity (last 3 sprints): [e.g., 34, 38, 31 — avg 34.3 story points]\n- Planned capacity this sprint: [ANY REDUCED CAPACITY DUE TO PTO, HOLIDAYS, OR COMMITMENTS]\n- Sprint goal: [WHAT THE TEAM WANTS TO ACHIEVE]\n\nBacklog items to consider:\n[LIST EACH ITEM WITH: Title, brief description, acceptance criteria summary, dependencies]\n1. [ITEM 1]\n2. [ITEM 2]\n3. [ITEM 3]\n...\n\nHelp with:\n1. **Capacity calculation**: Adjusted velocity considering reduced capacity. Show the math.\n2. **Story point estimation guidance**: For each backlog item, suggest a story point estimate using the Fibonacci scale (1, 2, 3, 5, 8, 13) based on:\n   - Complexity\n   - Uncertainty\n   - Effort\n   - Comparison to previously completed stories (if referenced)\n3. **Sprint commitment recommendation**: Which items should the team commit to vs. stretch goals, based on calculated capacity\n4. **Dependency mapping**: Identify which items depend on others and suggest an order of work\n5. **Risk flags**: Items that seem too large (>8 points should be split), too vague, or have external dependencies\n6. **Sprint goal validation**: Does the proposed commitment align with the stated sprint goal?\n7. **Definition of Done checklist**: A reminder of your team's DoD for each item\n\nFormat the final sprint plan as a table: Item | Points | Assignee | Dependencies | Status (Committed/Stretch)",
        category: "project-management",
        tags: ["sprint planning", "estimation", "agile"],
        useCase:
          "Use during sprint planning to estimate capacity, size stories, and build a realistic sprint commitment.",
        exampleInput:
          "Sprint 12, 2 weeks. Team: 2 senior devs, 2 mid devs, 1 QA. Velocity: 32, 36, 34 (avg 34). Capacity: One senior dev out 3 days. Sprint goal: Complete user notification system. Backlog: Notification preferences UI, email notification service, push notification service, notification center page, read/unread tracking.",
        exampleOutput:
          "Capacity: Average velocity 34 points. One senior dev loses 60% of sprint = ~5 points reduction. Adjusted capacity: ~29 points. Estimates: Notification preferences UI (3 points — straightforward CRUD form), Email notification service (8 points — high complexity, external SMTP integration), Push notification service (8 points — similar to email but different SDK)...",
        targetKeywords: [
          "sprint planning prompt",
          "story point estimation template",
          "AI agile planning",
        ],
        relatedTemplates: ["sprint-retrospective-facilitator", "resource-allocation-planner"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "change-request-document",
        title: "Change Request Document",
        description:
          "Draft a formal change request with impact analysis, cost assessment, and approval workflow.",
        prompt:
          "You are a project controls specialist. Draft a change request document for [PROJECT NAME].\n\nChange request context:\n- Requestor: [WHO IS REQUESTING THE CHANGE]\n- Date requested: [DATE]\n- Change description: [WHAT NEEDS TO CHANGE AND WHY]\n- Urgency: [LOW / MEDIUM / HIGH / CRITICAL]\n- Current project state: [WHERE THE PROJECT STANDS NOW]\n- Original baseline: [RELEVANT ORIGINAL SCOPE, SCHEDULE, OR BUDGET]\n\nGenerate a formal change request document:\n1. **Change request ID**: CR-[NUMBER]\n2. **Title**: Clear, descriptive title for the change\n3. **Description**: Detailed explanation of the proposed change (what is changing, what is not)\n4. **Justification**: Why this change is necessary — business case, risk mitigation, or regulatory requirement\n5. **Impact analysis**:\n   - Scope impact: What new work is added or removed\n   - Schedule impact: Days/weeks added or saved, critical path effects\n   - Cost impact: Additional budget required or savings\n   - Quality impact: Any effect on deliverable quality\n   - Resource impact: Additional people or skills needed\n   - Risk impact: New risks introduced or existing risks affected\n6. **Options analysis**: Present 3 options:\n   - Option A: Approve the change as requested (with full impact)\n   - Option B: Modified/reduced version of the change (compromise)\n   - Option C: Reject the change (consequences of not making the change)\n7. **Recommendation**: Which option you recommend and why\n8. **Implementation plan**: If approved, how and when the change would be implemented\n9. **Approval signatures**: Name, role, date fields for:\n   - Requestor\n   - Project Manager\n   - Sponsor/Stakeholder\n   - Technical Lead\n10. **Tracking**: Status field (Submitted / Under Review / Approved / Rejected / Implemented)",
        category: "project-management",
        tags: ["change management", "change request", "project controls"],
        useCase:
          "Use when a project scope, schedule, or budget change is needed and requires formal documentation and approval.",
        exampleInput:
          "Project: Website redesign. Requestor: Marketing VP. Change: Add multi-language support (Spanish, French) to the launch scope. Urgency: Medium. Current state: Design complete, development 40% done. Original scope: English-only website with 25 pages. Deadline: 8 weeks from now.",
        exampleOutput:
          "CR-047: Add Multi-Language Support (ES, FR) to Website Redesign. Justification: 35% of website traffic originates from non-English regions, representing an estimated $2.1M in annual revenue opportunity. Impact: Scope adds ~40% content volume (50 additional translated pages). Schedule: +3 weeks for translation integration and QA. Cost: +$45K (translation services $30K, development $15K)...",
        targetKeywords: [
          "change request template prompt",
          "AI change management document",
          "project change request",
        ],
        relatedTemplates: ["risk-register-builder", "requirements-document-generator"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "raci-matrix-builder",
        title: "RACI Matrix Builder",
        description:
          "Build a RACI matrix to clarify roles and responsibilities across project activities.",
        prompt:
          "You are an organizational design consultant. Build a RACI matrix for [PROJECT NAME].\n\nProject context:\n- Project: [PROJECT DESCRIPTION]\n- Phase: [WHICH PHASE OR THE ENTIRE PROJECT]\n- Roles/people involved:\n  - [ROLE 1, e.g., Project Manager]\n  - [ROLE 2, e.g., Tech Lead]\n  - [ROLE 3, e.g., Designer]\n  - [ROLE 4, e.g., Product Owner]\n  - [ROLE 5, e.g., QA Lead]\n  - [ROLE 6, e.g., Stakeholder/Sponsor]\n- Key activities/deliverables: [LIST THE MAJOR TASKS OR DELIVERABLES, or ask me to generate them]\n\nGenerate:\n1. **RACI definitions** (brief reminder at the top):\n   - R = Responsible (does the work)\n   - A = Accountable (owns the decision, only ONE per activity)\n   - C = Consulted (provides input before the decision)\n   - I = Informed (notified after the decision)\n\n2. **RACI Matrix table**: Activities as rows, Roles as columns\n   - Include 12-18 activities covering the full project lifecycle\n   - Ensure every row has exactly ONE 'A'\n   - Flag any row with no 'R' (work with no doer)\n   - Flag any column overloaded with 'A's (bottleneck risk)\n\n3. **Analysis and recommendations**:\n   - Identify potential bottlenecks (roles with too many A/R assignments)\n   - Flag activities with too many C's (decision-by-committee risk)\n   - Note any roles that are only 'I' (may indicate they're not needed on the project)\n   - Suggest delegation opportunities\n\n4. **Communication plan alignment**: For activities involving C and I roles, suggest the communication method (meeting, email, Slack, document review)\n\n5. **Escalation path**: For activities marked A, define who the escalation goes to if the accountable person is blocked\n\nFormat the matrix as a clean text table that can be pasted into a spreadsheet.",
        category: "project-management",
        tags: ["RACI matrix", "roles and responsibilities", "governance"],
        useCase:
          "Use when starting a project or onboarding new team members to clarify who does what and eliminate ambiguity.",
        exampleInput:
          "Project: Launch new mobile app. Roles: PM, Engineering Lead, iOS Dev, Android Dev, Designer, QA Lead, Product Owner, Marketing Manager. Phase: Entire project from kickoff to launch.",
        exampleOutput:
          "Activity: Define feature requirements | PM: C | Eng Lead: C | iOS: I | Android: I | Designer: C | QA: I | PO: A,R | Marketing: C. Activity: Create UI mockups | PM: I | Eng Lead: C | iOS: C | Android: C | Designer: A,R | QA: I | PO: C | Marketing: I. Analysis: Product Owner has 'A' on 6 activities — potential bottleneck. Recommend delegating 'A' for technical architecture decisions to Engineering Lead...",
        targetKeywords: [
          "RACI matrix prompt",
          "AI RACI generator",
          "roles and responsibilities template",
        ],
        relatedTemplates: ["resource-allocation-planner", "project-kickoff-agenda-generator"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "project-kickoff-agenda-generator",
        title: "Project Kickoff Agenda Generator",
        description:
          "Generate a comprehensive project kickoff meeting agenda with discussion points and pre-work assignments.",
        prompt:
          "You are an experienced program manager. Create a project kickoff meeting agenda for [PROJECT NAME].\n\nProject context:\n- Project: [BRIEF PROJECT DESCRIPTION]\n- Duration: [PROJECT TIMELINE]\n- Team size: [NUMBER OF ATTENDEES AT KICKOFF]\n- Attendee mix: [LIST KEY ROLES ATTENDING, e.g., sponsor, PM, tech lead, designers, developers, stakeholders]\n- Meeting format: [IN-PERSON / VIRTUAL / HYBRID]\n- Meeting duration: [e.g., 60 minutes, 90 minutes, half-day]\n- Project methodology: [AGILE / WATERFALL / HYBRID]\n\nGenerate a complete kickoff agenda:\n\n1. **Pre-meeting prep** (send 3 days before):\n   - Required reading: List 2-3 documents attendees should review\n   - Pre-work: Any exercises or questions to think about beforehand\n   - Logistics: Meeting link, room, parking, etc.\n\n2. **Agenda with time allocations**:\n   - Welcome and introductions ([X] min): Ice-breaker activity, team introductions with roles\n   - Project vision and objectives ([X] min): Why we're doing this, what success looks like, key metrics\n   - Scope overview ([X] min): What's in scope, what's out, key deliverables\n   - Timeline and milestones ([X] min): High-level roadmap, key dates, dependencies\n   - Roles and responsibilities ([X] min): RACI overview, decision-making process, escalation path\n   - Ways of working ([X] min): Communication channels, meeting cadence, tools, DoD\n   - Risks and assumptions ([X] min): Top known risks, key assumptions to validate\n   - Q&A and open discussion ([X] min): Parking lot for offline items\n   - Next steps and action items ([X] min): Immediate actions with owners and deadlines\n\n3. **Facilitation notes**: For each section, include:\n   - Key questions to ask the group\n   - Potential points of contention and how to handle them\n   - Decision points that need to be resolved in this meeting\n\n4. **Post-meeting deliverables**:\n   - Meeting notes template\n   - Action item tracker format\n   - When and how the kickoff summary will be shared\n\n5. **Follow-up meeting**: Suggest what should be covered in the first follow-up meeting (1 week later)",
        category: "project-management",
        tags: ["project kickoff", "meeting agenda", "project initiation"],
        useCase:
          "Use when launching a new project to ensure the kickoff meeting covers everything and sets the team up for success.",
        exampleInput:
          "Project: Redesign company intranet. Duration: 4 months. Attendees: 12 people (sponsor: CTO, PM, 3 developers, 2 designers, IT lead, HR rep, 3 department heads). Format: Hybrid. Duration: 90 minutes. Methodology: Agile with 2-week sprints.",
        exampleOutput:
          "Pre-meeting prep (send by Monday): Required reading: (1) Current intranet usage analytics report, (2) Employee satisfaction survey results re: internal tools, (3) Draft project charter (1-pager). Pre-work: 'Write down the top 3 things you wish the intranet could do that it cannot today.' Agenda: 0:00-0:10 — Welcome: Round-table introductions — name, role, and 'What's one thing you use the intranet for every day?'...",
        targetKeywords: [
          "project kickoff agenda prompt",
          "AI kickoff meeting generator",
          "project initiation template",
        ],
        relatedTemplates: ["raci-matrix-builder", "stakeholder-communication-drafter"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
    ],
  },

  // ── Personal Development ─────────────────────────────────────────────────
  {
    slug: "personal-development",
    title: "Personal Development Prompts",
    description:
      "AI prompt templates for journaling, goal setting, habit building, self-reflection, and personal growth. Works with ChatGPT, Claude, and Gemini.",
    longDescription:
      "Invest in your personal growth with tested prompt templates for daily journaling, setting meaningful goals, building sustainable habits, and preparing for difficult conversations. Each template is designed for real self-improvement work — from morning routines to deep self-reflection exercises. Paste them into any AI assistant and customize the bracketed placeholders to match your personal context and aspirations.",
    icon: "🌱",
    keywords: [
      "personal development prompts",
      "journaling prompts",
      "self improvement prompts",
      "coaching prompts",
      "gratitude prompts",
    ],
    relatedCategories: ["education", "productivity", "creative-writing"],
    templates: [
      {
        slug: "daily-journal-prompt-generator",
        title: "Daily Journal Prompt Generator",
        description:
          "Generate thoughtful daily journal prompts tailored to your current life focus and emotional state.",
        prompt:
          "You are a certified life coach and journaling facilitator. Generate a set of personalized journal prompts for me.\n\nMy context:\n- Current life focus: [WHAT'S TOP OF MIND, e.g., career transition, relationship building, stress management, creative expression]\n- Emotional state today: [HOW I'M FEELING, e.g., anxious, motivated, stuck, grateful, overwhelmed]\n- Journaling experience: [BEGINNER / REGULAR / ADVANCED]\n- Preferred journaling style: [FREE WRITING / STRUCTURED QUESTIONS / BULLET POINTS / GRATITUDE / STREAM OF CONSCIOUSNESS]\n- Time available: [5 MINUTES / 15 MINUTES / 30 MINUTES]\n\nGenerate:\n1. **Morning prompt** (to set intention): A forward-looking question that helps me approach the day with purpose. Should connect to my current focus area.\n2. **Midday check-in prompt** (1-2 minutes): A brief reflection to recalibrate during the day.\n3. **Evening reflection prompt** (to process the day): A deeper question about what happened, what I learned, and what I'd do differently.\n4. **Gratitude prompt**: A specific, non-generic gratitude question that goes beyond 'list 3 things you're grateful for' (e.g., explore HOW something made you feel or WHY it matters).\n5. **Challenge prompt** (for growth): A question that pushes me slightly outside my comfort zone or challenges an assumption I hold.\n6. **Creative prompt**: An imaginative scenario or metaphor-based question to spark insight from a different angle.\n7. **Weekly deep-dive prompt**: A more substantial question (for weekend journaling) that requires 20+ minutes of reflection.\n\nFor each prompt:\n- Include the prompt question\n- Add a brief note on why this prompt is valuable (1 sentence)\n- Suggest a follow-up question if the first answer feels surface-level\n\nAvoid cliches like 'What are you grateful for?' or 'What would you tell your younger self?' — make each prompt specific and thought-provoking.",
        category: "personal-development",
        tags: ["journaling", "daily prompts", "self-reflection"],
        useCase:
          "Use when you want to start or deepen a journaling practice with prompts that go beyond generic templates.",
        exampleInput:
          "Focus: Career transition from corporate to freelance. Emotional state: Excited but anxious about financial stability. Experience: Regular journaler. Style: Structured questions. Time: 15 minutes.",
        exampleOutput:
          "Morning prompt: 'What is one skill from your corporate career that you haven't yet considered as a freelance offering — and what would it look like to productize it?' (This prompt bridges your past expertise with future opportunity.) Follow-up: 'Who in your network would pay for this skill?' Evening prompt: 'Today, what felt more like freedom and what felt more like uncertainty? How can you tell the difference?'...",
        targetKeywords: [
          "journal prompt generator",
          "AI journaling prompts",
          "daily journal template",
        ],
        relatedTemplates: ["self-reflection-question-set", "gratitude-practice-generator"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "goal-setting-framework",
        title: "Goal Setting Framework",
        description:
          "Create a structured goal plan with milestones, accountability systems, and obstacle-planning strategies.",
        prompt:
          "You are a performance coach specializing in evidence-based goal achievement. Help me create a comprehensive goal plan.\n\nMy goal:\n- What I want to achieve: [DESCRIBE YOUR GOAL]\n- Why this matters to me: [YOUR DEEPER MOTIVATION]\n- Timeframe: [BY WHEN]\n- Current starting point: [WHERE I AM NOW RELATIVE TO THIS GOAL]\n- Past attempts: [HAVE I TRIED BEFORE? WHAT HAPPENED?]\n- Resources available: [TIME, MONEY, SUPPORT SYSTEMS I HAVE]\n- Potential obstacles: [WHAT COULD GET IN THE WAY]\n\nCreate a goal achievement plan using multiple frameworks:\n\n1. **SMART refinement**: Rewrite my goal to be Specific, Measurable, Achievable, Relevant, and Time-bound\n2. **WOOP analysis** (Wish, Outcome, Obstacle, Plan):\n   - Wish: The refined goal\n   - Outcome: Vivid description of how achieving this will feel and look\n   - Obstacle: The #1 internal obstacle (not external)\n   - Plan: If-then implementation intentions for the obstacle\n3. **Milestone breakdown**: Break the goal into 4-6 milestones with:\n   - Milestone description\n   - Target date\n   - How you'll know it's complete (measurable indicator)\n   - Celebration reward for achieving it\n4. **Weekly action plan**: For the first 4 weeks, specify 2-3 concrete actions per week\n5. **Accountability system**: Suggest 3 accountability mechanisms suited to my personality\n6. **Obstacle pre-mortem**: For each potential obstacle, write an if-then plan:\n   - 'If [OBSTACLE OCCURS], then I will [SPECIFIC RESPONSE]'\n7. **Identity-based framing**: Reframe the goal from outcome-based to identity-based\n   - Instead of 'I want to run a marathon,' → 'I am becoming a runner'\n8. **Progress tracking method**: Recommend a specific tracking approach (habit tracker, spreadsheet, journal, app)\n9. **90-day review questions**: 5 questions to assess progress at the quarter mark",
        category: "personal-development",
        tags: ["goal setting", "SMART goals", "achievement planning"],
        useCase:
          "Use when you have a goal but need a structured plan with built-in accountability and obstacle management to actually achieve it.",
        exampleInput:
          "Goal: Write and publish a nonfiction book about remote team management. Why: Share 10 years of experience and build thought leadership. Timeframe: 12 months. Starting point: Have a rough topic outline and 3 blog posts on the subject. Past attempts: Started once, abandoned at chapter 3 due to perfectionism. Resources: 1 hour per weekday morning, writing group.",
        exampleOutput:
          "SMART goal: 'Write a 50,000-word manuscript on remote team management, complete a full draft by month 6, revise by month 9, and submit to 5 publishers by month 12.' WOOP — Obstacle: Perfectionism causing me to re-edit chapter 1 instead of progressing. Plan: 'If I feel the urge to re-read yesterday's writing, then I will set a 2-minute timer for review and move to new writing when it rings.' Milestone 1: Complete detailed chapter outline (10 chapters) by Week 3...",
        targetKeywords: [
          "goal setting prompt",
          "AI goal planner",
          "SMART goal template",
        ],
        relatedTemplates: ["habit-tracker-builder", "weekly-review-planning-template"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "habit-tracker-builder",
        title: "Habit Tracker Builder",
        description:
          "Design a personalized habit tracking system with cue-routine-reward loops and stacking strategies.",
        prompt:
          "You are a behavioral design expert specializing in habit formation (drawing on James Clear's Atomic Habits, BJ Fogg's Tiny Habits, and behavioral science research). Help me build a habit system.\n\nMy situation:\n- Habits I want to build: [LIST 2-4 HABITS YOU WANT TO START]\n- Habits I want to break: [LIST 1-2 HABITS YOU WANT TO STOP]\n- My daily schedule: [ROUGH OVERVIEW — wake time, work hours, evening routine]\n- Existing habits that are solid: [WHAT I ALREADY DO CONSISTENTLY]\n- Personality type: [e.g., all-or-nothing, slow-and-steady, reward-driven, accountability-driven]\n- Previous habit attempts: [WHAT I'VE TRIED AND WHY IT FAILED]\n\nDesign a habit system:\n\n1. **Habit audit**: Evaluate each desired habit for clarity and feasibility. Rewrite any vague habits into specific, observable behaviors (not 'exercise more' but 'do 20 pushups after brushing teeth').\n\n2. **Tiny Habits design**: For each new habit, create a Tiny Habits recipe:\n   - After I [EXISTING HABIT / ANCHOR], I will [TINY VERSION OF NEW HABIT]\n   - Celebration: [IMMEDIATE REWARD THAT CREATES POSITIVE EMOTION]\n\n3. **Habit stacking sequence**: Arrange habits into a morning and/or evening chain showing how each one flows into the next\n\n4. **Environment design**: For each habit, suggest 2-3 changes to your physical or digital environment that make the habit easier (make it obvious and frictionless)\n\n5. **Breaking bad habits**: For each habit to break, apply the inversion:\n   - Make it invisible (remove cues)\n   - Make it difficult (add friction)\n   - Make it unsatisfying (add consequence)\n\n6. **Tracking system**: Design a simple tracking method:\n   - Daily checklist format\n   - Minimum viable streak (don't break the chain)\n   - Recovery protocol: What to do when you miss a day (never miss twice)\n\n7. **Progressive overload schedule**: How each habit scales over 4 weeks:\n   - Week 1: Tiny version\n   - Week 2: Slightly expanded\n   - Week 3: Target version\n   - Week 4: Maintenance with flexibility\n\n8. **Weekly review prompt**: 3 questions to ask yourself every Sunday about your habit progress",
        category: "personal-development",
        tags: ["habit building", "habit tracking", "behavioral design"],
        useCase:
          "Use when you want to build new habits or break old ones using evidence-based behavioral design principles.",
        exampleInput:
          "Build: Morning meditation, daily reading, evening stretching. Break: Phone scrolling before bed. Schedule: Wake 7am, work 9-5, sleep 11pm. Solid habits: Morning coffee, brushing teeth. Personality: Reward-driven, tends to be all-or-nothing. Past: Tried meditation apps, lasted 2 weeks.",
        exampleOutput:
          "Habit audit: 'Morning meditation' is vague — rewritten as 'Sit on cushion and follow 5-minute guided breathing after pouring morning coffee.' Tiny Habit: 'After I pour my coffee, I will sit on my cushion and take 3 deep breaths.' Celebration: Take the first sip of coffee as reward. Environment: Place cushion next to coffee maker tonight. Week 1: 3 breaths only. Week 2: 2-minute timer. Week 3: 5-minute guided session...",
        targetKeywords: [
          "habit tracker prompt",
          "AI habit builder",
          "habit stacking template",
        ],
        relatedTemplates: ["goal-setting-framework", "morning-routine-designer"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "gratitude-practice-generator",
        title: "Gratitude Practice Generator",
        description:
          "Create a personalized gratitude practice that goes beyond simple lists to build lasting positive psychology habits.",
        prompt:
          "You are a positive psychology practitioner. Design a personalized gratitude practice for me that goes beyond basic gratitude lists.\n\nMy context:\n- Current mood baseline: [HOW I GENERALLY FEEL — stressed, content, anxious, flat, etc.]\n- What I'm going through: [BRIEF LIFE CONTEXT, e.g., new job, grieving, routine feels stale, big life change]\n- Gratitude experience: [NEVER TRIED / TRIED LISTS BUT GOT BORED / REGULAR PRACTICE]\n- Preferred time: [MORNING / EVENING / BOTH]\n- Time available: [2 MINUTES / 5 MINUTES / 10 MINUTES]\n- Spiritual/secular preference: [SECULAR / SPIRITUAL / OPEN TO BOTH]\n\nDesign a gratitude practice with:\n\n1. **Foundation exercise** (daily, takes 2 minutes): A specific gratitude prompt that rotates through 7 themes, one per day:\n   - Monday: [THEME, e.g., People]\n   - Tuesday: [THEME, e.g., Experiences]\n   - Through Sunday\n   - For each day, write the exact prompt and explain why this theme matters\n\n2. **Deepening exercise** (3x per week, takes 5 minutes): A more reflective practice:\n   - Gratitude letter writing (micro version — 3 sentences to someone)\n   - Savoring exercise (re-experience a positive moment in detail)\n   - Contrast exercise (appreciate what you have by imagining its absence)\n\n3. **Weekly gratitude review** (Sunday, 10 minutes): 5 questions that help synthesize the week's gratitude into lasting appreciation\n\n4. **Gratitude reframe technique**: A step-by-step process for finding gratitude in difficult situations (not toxic positivity — genuine reframing)\n\n5. **Gratitude triggers**: 5 daily moments to pair with micro-gratitude (e.g., 'Every time I unlock my phone, notice one thing I can see that I appreciate')\n\n6. **Progress indicators**: How to know the practice is working (what shifts to notice over 2, 4, and 8 weeks)\n\n7. **Boredom busters**: 3 variations to try when the practice feels stale\n\nGround all suggestions in positive psychology research. Avoid toxic positivity — acknowledge that gratitude coexists with difficulty.",
        category: "personal-development",
        tags: ["gratitude", "positive psychology", "mindfulness"],
        useCase:
          "Use when you want to build a gratitude practice that actually sticks and creates meaningful shifts in wellbeing.",
        exampleInput:
          "Mood: Generally stressed and rushing through days. Context: Two years into a demanding job, feeling like life is on autopilot. Experience: Tried gratitude lists for a month but it became repetitive. Time: 5 minutes, evening. Preference: Secular.",
        exampleOutput:
          "Monday (People): 'Who made something easier for me today — even in a small way — and what specifically did they do?' This prompt trains you to notice support systems you're currently on autopilot about. Tuesday (Senses): 'What was the most pleasant physical sensation I experienced today? Describe it in detail.' This counters the 'rushing' pattern by practicing present-moment awareness...",
        targetKeywords: [
          "gratitude practice prompt",
          "AI gratitude generator",
          "gratitude journal template",
        ],
        relatedTemplates: ["daily-journal-prompt-generator", "self-reflection-question-set"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "self-reflection-question-set",
        title: "Self-Reflection Question Set",
        description:
          "Generate deep self-reflection questions tailored to specific life areas and personal growth goals.",
        prompt:
          "You are a therapist-trained personal development coach. Create a deep self-reflection question set for me.\n\nReflection focus:\n- Life area: [CAREER / RELATIONSHIPS / HEALTH / IDENTITY / PURPOSE / FINANCES / CREATIVITY]\n- Specific situation: [DESCRIBE WHAT'S PROMPTING THIS REFLECTION]\n- What I'm trying to understand: [WHAT CLARITY I'M SEEKING]\n- Emotional readiness: [I'M IN A GOOD HEADSPACE / I'M PROCESSING SOMETHING DIFFICULT / SOMEWHERE IN BETWEEN]\n- Depth preference: [SURFACE-LEVEL CHECK-IN / MODERATE EXPLORATION / DEEP EXCAVATION]\n\nGenerate a layered self-reflection set:\n\n1. **Warm-up questions** (3 questions): Easy, concrete questions to get the reflective process started. These should be factual or observational, not yet emotional.\n\n2. **Exploration questions** (5 questions): Open-ended questions that probe patterns, beliefs, and motivations. Each should come from a different psychological angle:\n   - Values-based: What matters most and am I honoring it?\n   - Pattern recognition: What keeps repeating and why?\n   - Emotional awareness: What am I feeling beneath the surface?\n   - Limiting beliefs: What story am I telling myself that might not be true?\n   - Future self: What would the version of me I want to become do here?\n\n3. **Challenge questions** (3 questions): Uncomfortable but productive questions that confront blind spots. Include a content warning note for each and permission to skip.\n\n4. **Integration questions** (2 questions): Questions that synthesize insights into actionable next steps.\n\n5. **Journaling structure**: A suggested order for working through these questions, with:\n   - Estimated time per section\n   - When to take a pause and breathe\n   - What to do if strong emotions arise\n\n6. **Follow-up practices**: After the reflection, suggest 2 concrete actions and a follow-up reflection date.\n\nEvery question should be specific to my stated life area and situation — no generic questions that could apply to anyone.",
        category: "personal-development",
        tags: ["self-reflection", "personal growth", "introspection"],
        useCase:
          "Use when you need to think deeply about a specific life area and want structured questions to guide the process.",
        exampleInput:
          "Life area: Career. Situation: I've been promoted to management but miss doing individual contributor work. Seeking clarity on whether to stay in management or step back. Emotional readiness: Good headspace. Depth: Deep excavation.",
        exampleOutput:
          "Warm-up Q1: 'List 5 tasks you did this week as a manager and 5 you did as an IC. Which list was easier to write?' Exploration — Values: 'When you imagine yourself at 60 looking back, do you see someone who built teams or someone who built things? Which image feels more like pride and which feels more like should?' Challenge Q1 (content note: may surface ego/identity concerns): 'Is your reluctance about management genuinely about the work, or is it about the discomfort of being a beginner again in a new skill?'...",
        targetKeywords: [
          "self-reflection prompts",
          "AI personal growth questions",
          "introspection template",
        ],
        relatedTemplates: ["daily-journal-prompt-generator", "values-clarification-exercise"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "book-summary-takeaway-extractor",
        title: "Book Summary Takeaway Extractor",
        description:
          "Extract actionable takeaways and create a personal implementation plan from any nonfiction book.",
        prompt:
          "You are a learning strategist who helps people apply what they read. Help me extract maximum value from a book I've read.\n\nBook details:\n- Title: [BOOK TITLE]\n- Author: [AUTHOR]\n- Genre: [SELF-HELP / BUSINESS / PSYCHOLOGY / SCIENCE / BIOGRAPHY / OTHER]\n- Key topics: [MAIN THEMES OF THE BOOK]\n- My notes: [PASTE ANY HIGHLIGHTS, NOTES, OR KEY PASSAGES YOU MARKED — or leave blank for general extraction]\n\nMy context:\n- Why I read this: [WHAT I HOPED TO LEARN]\n- My current situation: [HOW THIS BOOK RELATES TO MY LIFE RIGHT NOW]\n- What resonated most: [THE IDEA OR CHAPTER THAT HIT HARDEST]\n- What I disagreed with: [ANYTHING THAT DIDN'T FIT MY EXPERIENCE]\n\nGenerate:\n1. **Core thesis** (2-3 sentences): The book's central argument in plain language\n2. **Key mental models** (3-5): Frameworks or ways of thinking the book introduces. For each:\n   - Name of the model\n   - One-sentence explanation\n   - When to apply it in daily life\n3. **Actionable takeaways** (5-7): Specific things I can do differently based on this book. For each:\n   - The takeaway\n   - Which chapter or concept it comes from\n   - A concrete first step I can take this week\n   - How I'll know it's working\n4. **Implementation plan**: Pick the top 3 takeaways and create a 30-day plan:\n   - Days 1-7: Start with [X]\n   - Days 8-14: Add [Y]\n   - Days 15-30: Build [Z]\n5. **Connection map**: How this book's ideas connect to [2-3 OTHER BOOKS OR CONCEPTS I'M FAMILIAR WITH]\n6. **Teach-back summary**: A 2-minute explanation I could give a friend over coffee about why this book matters\n7. **Review trigger**: Set a specific date and question to revisit these notes and assess what stuck",
        category: "personal-development",
        tags: ["book summary", "learning", "implementation"],
        useCase:
          "Use after finishing a nonfiction book to convert passive reading into active behavior change.",
        exampleInput:
          "Book: Atomic Habits by James Clear. Genre: Self-help. Why I read it: Want to build better daily routines. My situation: I keep starting habits and quitting after 2 weeks. Resonated most: Identity-based habits chapter. Disagreed with: The idea that environment beats motivation always.",
        exampleOutput:
          "Core thesis: Lasting behavior change comes from building identity-consistent systems rather than setting outcome-based goals — small 1% improvements compound into transformative results over time. Key mental model 1: 'The Four Laws of Behavior Change' — Make it obvious, attractive, easy, and satisfying. Apply when designing any new routine by checking all four laws. Takeaway 1: Redesign my morning environment tonight so my desired habit is the default path...",
        targetKeywords: [
          "book takeaway prompt",
          "AI book summary tool",
          "reading implementation template",
        ],
        relatedTemplates: ["goal-setting-framework", "habit-tracker-builder"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "morning-routine-designer",
        title: "Morning Routine Designer",
        description:
          "Design a personalized morning routine based on your goals, chronotype, and lifestyle constraints.",
        prompt:
          "You are a performance coach specializing in daily routines and circadian optimization. Design a morning routine for me.\n\nMy profile:\n- Wake-up time: [CURRENT OR DESIRED WAKE TIME]\n- Must leave house / start work by: [TIME]\n- Chronotype: [EARLY BIRD / NIGHT OWL / SOMEWHERE IN BETWEEN / NOT SURE]\n- Energy pattern: [WHEN DO I FEEL MOST ALERT IN THE MORNING]\n- Non-negotiable morning tasks: [e.g., shower, kids' breakfast, dog walk, commute]\n- Goals I want the routine to support: [e.g., fitness, mindfulness, learning, creative work, career preparation]\n- Current morning: [DESCRIBE WHAT I DO NOW AND HOW IT FEELS]\n- Obstacles: [WHAT MAKES MORNINGS HARD — snooze habit, kids, fatigue, decision paralysis]\n- Preferences: [THINGS I ENJOY VS. THINGS I DREAD IN MORNINGS]\n\nDesign a morning routine:\n\n1. **Recommended wake time**: Based on my chronotype and constraints, with rationale\n2. **Minute-by-minute routine**: A detailed schedule from eyes-open to work-start:\n   - [TIME] — [ACTIVITY] (duration) — Purpose: [WHY]\n   - Include transitions and buffer time\n   - Total routine should fit within my available window\n3. **First 10 minutes protocol**: The most critical window — what to do immediately upon waking (and what to avoid) to set the right tone\n4. **Decision elimination**: Pre-decisions to make the night before (clothes, meals, etc.) to reduce morning cognitive load\n5. **Minimum viable version**: A 15-minute compressed version for busy or low-energy days (so I never skip entirely)\n6. **Weekend variation**: How the routine adapts for non-work days\n7. **Transition plan**: How to shift from my current routine to the new one over 2 weeks (don't change everything at once)\n8. **Failure mode plan**: For each common obstacle I listed, a specific countermeasure\n9. **30-day assessment**: Questions to evaluate after one month whether this routine is working\n\nBase recommendations on sleep science and performance research. Avoid generic advice like 'wake up at 5 AM' — personalize everything to my context.",
        category: "personal-development",
        tags: ["morning routine", "daily routine", "productivity habits"],
        useCase:
          "Use when you want to redesign your morning to be more intentional, energizing, and aligned with your goals.",
        exampleInput:
          "Wake: Currently 7:30am (want to try 6:45am). Work starts: 9am remote. Chronotype: Night owl trying to be earlier. Non-negotiables: Coffee, shower, feed cat. Goals: Exercise, 20 min reading, less phone. Current: Snooze 3 times, scroll phone in bed, rush through everything. Obstacle: Snooze button, staying up late.",
        exampleOutput:
          "Wake time recommendation: 7:00am (not 6:45 — shifting 30 min is more sustainable for a night owl; reassess after 3 weeks). First 10 minutes: 7:00 — Alarm rings (place phone across room tonight). Stand, turn on overhead light immediately. 7:01 — Bathroom, splash cold water on face. 7:03 — Kitchen: start coffee, feed cat. These are autopilot tasks that get you moving without willpower...",
        targetKeywords: [
          "morning routine prompt",
          "AI routine designer",
          "daily routine template",
        ],
        relatedTemplates: ["habit-tracker-builder", "weekly-review-planning-template"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "difficult-conversation-prep",
        title: "Difficult Conversation Prep",
        description:
          "Prepare for a difficult conversation with scripts, frameworks, and emotional regulation strategies.",
        prompt:
          "You are a communication coach trained in nonviolent communication (NVC), crucial conversations methodology, and conflict resolution. Help me prepare for a difficult conversation.\n\nConversation context:\n- Who: [YOUR RELATIONSHIP TO THE PERSON, e.g., boss, partner, friend, parent, direct report]\n- Topic: [WHAT THE CONVERSATION IS ABOUT]\n- What I want to say: [THE CORE MESSAGE I NEED TO COMMUNICATE]\n- Desired outcome: [WHAT I HOPE HAPPENS AFTER THIS CONVERSATION]\n- My fear: [WHAT I'M AFRAID WILL HAPPEN]\n- Their likely perspective: [WHAT I THINK THEY'LL SAY OR FEEL]\n- Emotional stakes: [LOW / MEDIUM / HIGH]\n- Setting: [IN-PERSON / VIDEO / PHONE] and [PRIVATE / SEMI-PRIVATE]\n\nPrepare me for this conversation:\n\n1. **Pre-conversation self-check**: 5 questions to ask myself before entering the conversation to ensure I'm in the right headspace\n2. **Opening statement**: 3 options for how to open the conversation — direct, empathetic, and collaborative approaches. Each should:\n   - Use 'I' statements, not 'you' accusations\n   - State the topic clearly without ambiguity\n   - Invite dialogue rather than deliver a monologue\n3. **NVC framework for my core message**:\n   - Observation: What I observed (facts, not judgments)\n   - Feeling: How it makes me feel (emotions, not thoughts)\n   - Need: What underlying need isn't being met\n   - Request: A specific, actionable request (not a demand)\n4. **Anticipated responses and counter-scripts**: For 3-4 likely reactions (defensive, dismissive, emotional, counterattack), provide:\n   - What they might say\n   - How to respond without escalating\n   - Phrases that acknowledge their perspective while holding your boundary\n5. **De-escalation toolkit**: 5 phrases for when the conversation gets heated\n6. **Boundary statement**: How to state a non-negotiable clearly but respectfully\n7. **Closing the conversation**: How to end productively, whether or not you reached agreement\n8. **Post-conversation**: Self-care actions and a follow-up plan\n\nRemind me that I cannot control their reaction, only my delivery. The goal is not to 'win' but to be heard and to understand.",
        category: "personal-development",
        tags: ["difficult conversations", "communication", "conflict resolution"],
        useCase:
          "Use when you're dreading a conversation and need to plan what to say, anticipate reactions, and manage your emotions.",
        exampleInput:
          "Who: Direct manager. Topic: I've been consistently passed over for the senior role despite exceeding performance targets. Message: I need clarity on what's blocking my promotion. Desired outcome: A clear timeline or honest feedback on what to change. Fear: Being seen as entitled or a complainer. Their likely perspective: Budget constraints and timing. Stakes: High.",
        exampleOutput:
          "Opening (collaborative approach): 'I wanted to talk about my growth path here because this role matters a lot to me. I've been reflecting on my performance and want to understand what the path to senior looks like from your perspective.' NVC: Observation: 'I've met or exceeded my targets for the last three review cycles.' Feeling: 'I feel uncertain and somewhat discouraged.' Need: 'I need clarity about what the criteria are.' Request: 'Could we map out the specific milestones I'd need to hit?'...",
        targetKeywords: [
          "difficult conversation prep prompt",
          "AI communication coach",
          "crucial conversation template",
        ],
        relatedTemplates: ["self-reflection-question-set", "goal-setting-framework"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "values-clarification-exercise",
        title: "Values Clarification Exercise",
        description:
          "Identify and prioritize your core values through a guided exploration exercise.",
        prompt:
          "You are an executive coach specializing in values-based leadership and personal alignment. Guide me through a values clarification exercise.\n\nMy context:\n- Life stage: [e.g., early career, mid-career, new parent, retirement, major transition]\n- What's prompting this: [WHY I'M EXPLORING VALUES NOW — feeling misaligned, making a big decision, general self-discovery]\n- A decision I'm currently facing: [OPTIONAL — A SPECIFIC DECISION WHERE VALUES CLARITY WOULD HELP]\n- How I spend my time currently: [ROUGH BREAKDOWN — work, family, hobbies, social, rest]\n\nGuide me through these steps:\n\n1. **Peak experiences exploration**: Ask me to recall 3 peak moments in my life — times I felt most alive, proud, or fulfilled. For each, identify which underlying values were being honored.\n\n2. **Values identification**: Present 40 common values in categories (career, relationships, personal, impact). Ask me to circle my top 15, then narrow to top 8, then final top 5. Include values like: authenticity, adventure, security, creativity, family, achievement, freedom, service, learning, connection, integrity, health, justice, beauty, humor, etc.\n\n3. **Values definition**: For my top 5, ask me to write a personal definition (what this value means specifically to ME, not the dictionary definition). Provide an example of a personal vs. generic definition.\n\n4. **Values ranking**: A forced-choice exercise — if Value A and Value B conflict, which wins? Run through all pairings of my top 5 to create a hierarchy.\n\n5. **Alignment audit**: For each top value, score 1-10 how well my current life reflects it. Identify the biggest gap.\n\n6. **Values in action**: For each value, provide:\n   - What it looks like when I'm living this value (specific behaviors)\n   - What it looks like when I'm violating this value (warning signs)\n   - One change I could make this week to better honor this value\n\n7. **Decision filter**: If I provided a decision, show how to use my values hierarchy to evaluate the options.\n\n8. **Values statement**: Write a personal values manifesto — a short paragraph I can re-read when I feel lost or conflicted.\n\nMake this feel like a coaching session, not a test. There are no right answers.",
        category: "personal-development",
        tags: ["values", "self-discovery", "personal alignment"],
        useCase:
          "Use when you feel misaligned with your life choices, face a big decision, or want to better understand what truly matters to you.",
        exampleInput:
          "Life stage: Mid-career (35). Prompting: Offered a high-paying role at a company I don't admire vs. staying at a mission-driven org. Time split: 50% work, 20% family, 10% exercise, 10% social, 10% rest. Decision: Accept the offer or stay.",
        exampleOutput:
          "Step 1 — Peak experience: Recall the last time you felt 'this is exactly what I should be doing.' For example, if your peak moment was leading a volunteer project, the underlying values might be Service, Leadership, and Community. Step 5 — Alignment audit: If 'Impact' scores 9/10 at your current job but 'Financial Security' scores 4/10, the decision becomes about which gap is more painful to live with. Values filter for your decision: Score each option 1-10 on each of your top 5 values and sum the totals...",
        targetKeywords: [
          "values clarification prompt",
          "AI values exercise",
          "personal values template",
        ],
        relatedTemplates: ["self-reflection-question-set", "goal-setting-framework"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "weekly-review-planning-template",
        title: "Weekly Review & Planning Template",
        description:
          "Conduct a structured weekly review and plan the upcoming week with intentional priorities.",
        prompt:
          "You are a productivity coach. Guide me through a weekly review and planning session.\n\nMy context:\n- Today is: [DAY AND DATE]\n- My roles: [LIST YOUR KEY LIFE ROLES, e.g., developer, parent, partner, friend, community member]\n- Current top 3 goals: [YOUR ACTIVE GOALS]\n- How this week felt overall: [ONE WORD OR PHRASE]\n- Energy level right now: [LOW / MEDIUM / HIGH]\n\nGuide me through this weekly review framework:\n\n**Part 1: Review the past week (15 minutes)**\n1. **Wins inventory**: List 3 things that went well, no matter how small. For each, identify what made it work (what can I repeat?).\n2. **Incompletions audit**: What did I plan to do but didn't? For each:\n   - Is it still relevant? (If not, drop it without guilt)\n   - What blocked me? (Time, energy, fear, unclear next step?)\n   - Does it roll to next week or need rescheduling?\n3. **Lessons captured**: What's one thing I learned or realized this week?\n4. **Relationship check**: Did I invest in the relationships that matter most? Who needs attention next week?\n5. **Energy patterns**: When was my energy highest and lowest? What caused each?\n\n**Part 2: Plan the upcoming week (15 minutes)**\n6. **Big 3**: What are the 3 most important outcomes for next week? (Not tasks — outcomes.) Test: if I only accomplished these 3 things, would I feel the week was a success?\n7. **Role-based intentions**: For each life role, set one intention:\n   - [ROLE]: This week I will [SPECIFIC ACTION]\n8. **Time blocking suggestions**: Based on my energy patterns, suggest when to schedule my Big 3\n9. **Buffer planning**: Where is margin built in for the unexpected? (Minimum 20% of scheduled time)\n10. **One thing to try differently**: Based on last week's lessons, one small experiment for this week\n\n**Part 3: Mindset reset (5 minutes)**\n11. **Theme of the week**: Choose a word or phrase as an anchor for intention\n12. **Permission to let go**: Name one thing I'm choosing NOT to worry about this week\n13. **Gratitude carry-forward**: What from last week am I most grateful for?",
        category: "personal-development",
        tags: ["weekly review", "planning", "productivity system"],
        useCase:
          "Use every Sunday or Monday to close out the previous week intentionally and set yourself up for a focused, balanced week ahead.",
        exampleInput:
          "Today: Sunday, March 2. Roles: Software engineer, husband, runner, volunteer tutor. Goals: Ship v2 of the app, run a half marathon in April, spend quality time with wife. Week felt: Scattered. Energy: Medium.",
        exampleOutput:
          "Part 1 — Wins: (write yours, but examples:) 'Merged the notification feature PR on Tuesday' — What worked: blocked 2 hours of deep focus before standup. Incompletions: 'Didn't run 3 times as planned (only once)' — Block: It rained and I hadn't planned indoor alternatives. Still relevant: Yes. Action: Schedule treadmill runs as rain backup. Part 2 — Big 3: (1) Complete API integration for v2 launch, (2) Run 3 times including one 10K, (3) Plan a date night...",
        targetKeywords: [
          "weekly review prompt",
          "AI weekly planning template",
          "Sunday planning session",
        ],
        relatedTemplates: ["goal-setting-framework", "morning-routine-designer"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
    ],
  },

  // ── E-commerce ───────────────────────────────────────────────────────────
  {
    slug: "ecommerce",
    title: "E-commerce Prompts",
    description:
      "AI prompt templates for product descriptions, Amazon listings, cart recovery emails, and e-commerce copywriting. Works with ChatGPT, Claude, and Gemini.",
    longDescription:
      "Boost your online store's performance with tested prompt templates for writing product descriptions that sell, optimizing Amazon listings for search, recovering abandoned carts, and creating promotional campaigns. Each template is designed for real e-commerce workflows — from Shopify product pages to Amazon storefronts. Paste them into any AI assistant and customize the bracketed placeholders to match your products and brand.",
    icon: "🛒",
    keywords: [
      "e-commerce prompts",
      "product description prompts",
      "ChatGPT for e-commerce",
      "Shopify prompts",
      "Amazon listing prompts",
    ],
    relatedCategories: ["marketing", "seo", "email"],
    templates: [
      {
        slug: "product-description-ecommerce-writer",
        title: "Product Description Writer",
        description:
          "Write persuasive e-commerce product descriptions that highlight benefits and drive conversions.",
        prompt:
          "You are an e-commerce copywriter who specializes in product descriptions that convert browsers into buyers. Write a product description for my online store.\n\nProduct details:\n- Product name: [PRODUCT NAME]\n- Category: [PRODUCT CATEGORY]\n- Price: [PRICE POINT]\n- Target customer: [WHO BUYS THIS — demographics, lifestyle, pain points]\n- Key features: [LIST 4-6 PRODUCT FEATURES]\n- Materials/ingredients: [WHAT IT'S MADE OF]\n- Differentiator: [WHAT MAKES THIS DIFFERENT FROM COMPETITORS]\n- Brand voice: [TONE, e.g., luxurious, playful, technical, earthy, minimalist]\n- Platform: [SHOPIFY / WOOCOMMERCE / ETSY / AMAZON / OTHER]\n\nWrite the following:\n1. **SEO-optimized title**: Include primary keyword, under 70 characters\n2. **Hook headline**: A benefit-driven headline that stops the scroll (not the product name — a reason to care)\n3. **Short description** (50-75 words): For the product card or above-the-fold area. Lead with the #1 benefit, not the feature.\n4. **Full description** (200-300 words): Structured with:\n   - Opening paragraph: Paint a picture of the customer's life with this product (benefit-first storytelling)\n   - Feature-benefit bullets: 4-6 bullets in format 'Feature → Benefit' (e.g., 'Triple-insulated walls → Keeps drinks cold for 24 hours')\n   - Social proof placeholder: Where to insert reviews or trust signals\n   - Closing CTA: Create urgency or reinforce value\n5. **Meta description**: For SEO, 155 characters max\n6. **3 alternative headlines**: For A/B testing\n\nWriting rules:\n- Benefits before features (always answer 'so what?' for the customer)\n- Use sensory language for physical products\n- Address the top objection in the description\n- Include the primary keyword 2-3 times naturally\n- Write for scanners: short paragraphs, bullets, bold key phrases",
        category: "ecommerce",
        tags: ["product description", "e-commerce copy", "conversion"],
        useCase:
          "Use when listing a new product in your online store and need a description that both ranks in search and persuades buyers.",
        exampleInput:
          "Product: Horizon Ceramic Travel Mug. Category: Drinkware. Price: $34. Target: Commuters and office workers who want to reduce single-use cups. Features: Double-wall ceramic, silicone lid, fits car cup holders, dishwasher safe, 12 oz. Differentiator: Real ceramic taste without the fragility. Voice: Modern, clean, eco-conscious. Platform: Shopify.",
        exampleOutput:
          "Hook: 'Your coffee deserves better than plastic.' Short description: 'The Horizon Ceramic Travel Mug delivers the clean taste of your favorite cafe mug with the durability to survive your commute. Double-wall insulation keeps drinks hot for 3 hours, while the slim profile slides into any cup holder.' Feature-benefit: 'Real ceramic interior → No metallic or plastic aftertaste, just pure coffee flavor...'",
        targetKeywords: [
          "product description prompt",
          "AI product copywriter",
          "e-commerce description template",
        ],
        relatedTemplates: ["amazon-listing-optimizer", "faq-generator-product-pages"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "amazon-listing-optimizer",
        title: "Amazon Listing Optimizer",
        description:
          "Optimize Amazon product listings with keyword-rich titles, bullet points, and backend search terms.",
        prompt:
          "You are an Amazon marketplace specialist with expertise in A9/A10 search algorithm optimization. Optimize my Amazon listing.\n\nProduct information:\n- Product: [PRODUCT NAME AND DESCRIPTION]\n- ASIN (if existing): [ASIN OR 'NEW LISTING']\n- Category/subcategory: [AMAZON CATEGORY]\n- Primary keywords: [3-5 KEYWORDS CUSTOMERS SEARCH FOR]\n- Price: [YOUR PRICE] vs. competitors: [COMPETITOR PRICE RANGE]\n- Key differentiators: [WHAT MAKES YOURS BETTER]\n- Target customer: [WHO BUYS THIS]\n- Current listing issues (if optimizing): [WHAT'S NOT WORKING — low impressions, low conversions, etc.]\n\nOptimize the following listing elements:\n\n1. **Title** (200 characters max for most categories):\n   - Format: Brand + Key Feature + Product Type + Size/Color + Secondary Feature\n   - Front-load the highest-volume keyword\n   - Include 3-4 keywords naturally\n   - Provide 2 title variations\n\n2. **Bullet points** (5 bullets, each 200-250 characters):\n   - Bullet 1: Primary benefit (the one that wins the sale)\n   - Bullet 2: Key feature with proof point\n   - Bullet 3: Materials/quality/durability claim\n   - Bullet 4: Use case or compatibility information\n   - Bullet 5: Guarantee, warranty, or what's included\n   - Start each bullet with a CAPS keyword phrase\n   - Address top customer objections from competitor reviews\n\n3. **Product description / A+ Content outline** (2000 characters):\n   - Brand story section\n   - Feature comparison with competitors (without naming them)\n   - Lifestyle use-case scenarios\n   - FAQ section addressing top concerns\n\n4. **Backend search terms** (250 bytes max):\n   - No repeating words already in the title\n   - Include misspellings, synonyms, and Spanish translations if relevant\n   - No competitor brand names\n   - Separate with spaces, not commas\n\n5. **Subject matter / intended use fields**: Fill in all applicable attribute fields\n\n6. **Image suggestions**: Describe 7 product images following Amazon's best practices (main, lifestyle, infographic, scale, packaging, texture, comparison)",
        category: "ecommerce",
        tags: ["Amazon listing", "marketplace optimization", "A9 algorithm"],
        useCase:
          "Use when creating or optimizing an Amazon listing to improve search ranking and conversion rate.",
        exampleInput:
          "Product: Bamboo laptop stand with phone holder and cable management. Category: Office Products > Laptop Stands. Keywords: laptop stand, bamboo desk organizer, laptop riser, ergonomic stand. Price: $39.99 (competitors $25-55). Differentiator: Integrated phone slot and cable channels. Target: Remote workers who want a clean desk setup.",
        exampleOutput:
          "Title: 'BambooDesk Ergonomic Laptop Stand with Phone Holder — Natural Bamboo Laptop Riser with Cable Management for Desk Organization — Compatible with MacBook, Dell, HP 10-15.6 inch — Home Office Accessories.' Bullet 1: ERGONOMIC COMFORT — Raises your laptop screen 6 inches to eye level, reducing neck strain during long work sessions. Recommended by physical therapists for home office setups...",
        targetKeywords: [
          "Amazon listing optimization prompt",
          "AI Amazon copywriter",
          "Amazon SEO template",
        ],
        relatedTemplates: ["product-description-ecommerce-writer", "product-comparison-chart-generator"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "product-review-response-generator",
        title: "Product Review Response Generator",
        description:
          "Generate professional and empathetic responses to customer product reviews across all ratings.",
        prompt:
          "You are a customer experience manager for an e-commerce brand. Write responses to customer reviews for [PRODUCT NAME] from [BRAND NAME].\n\nBrand voice: [TONE — friendly, professional, luxury, casual, empathetic]\nProduct: [BRIEF PRODUCT DESCRIPTION]\n\nGenerate response templates for each scenario:\n\n1. **5-star positive review**: Customer loves the product\n   - Review: [PASTE REVIEW OR DESCRIBE THE PRAISE]\n   - Response: Thank them specifically (reference what they mentioned), reinforce the benefit they experienced, suggest a complementary product (subtle upsell), invite them to share on social media\n\n2. **4-star review with minor complaint**: Customer likes it but notes a small issue\n   - Review: [PASTE OR DESCRIBE]\n   - Response: Acknowledge the positive, address the minor complaint directly, provide a tip or workaround if possible, show the feedback is valued\n\n3. **3-star mixed review**: Customer is on the fence\n   - Review: [PASTE OR DESCRIBE]\n   - Response: Acknowledge their balanced perspective, address specific concerns, offer support or a solution, express commitment to improvement\n\n4. **1-2 star negative review**: Customer is dissatisfied\n   - Review: [PASTE OR DESCRIBE]\n   - Response: Empathize without being defensive, take responsibility where appropriate, offer a concrete solution (replacement, refund, troubleshooting), move to private channel for resolution, keep it professional even if the review is unfair\n\n5. **Review mentioning a defect or safety concern**:\n   - Response: Immediate concern, request to contact support directly, do not debate publicly, prioritize safety\n\nFor each response:\n- Keep under 100 words (customers and browsers scan quickly)\n- Never use the phrase 'We're sorry for the inconvenience'\n- Personalize by referencing specific details from their review\n- Include a signature: [NAME], [ROLE] at [BRAND]\n- Avoid offering discounts publicly (move to DM/email for that)\n\nAlso provide: Guidelines for how quickly to respond (by rating) and a prioritization framework.",
        category: "ecommerce",
        tags: ["review management", "customer feedback", "reputation management"],
        useCase:
          "Use when responding to product reviews on Amazon, Shopify, Google, or any marketplace to maintain brand reputation and build trust.",
        exampleInput:
          "Brand: PureGlow Skincare. Product: Vitamin C Serum. Voice: Warm and knowledgeable. 1-star review: 'Broke me out horribly. Skin was worse after 2 weeks. Waste of money.' 5-star review: 'My dark spots faded in 3 weeks! Best serum I've tried.'",
        exampleOutput:
          "1-star response: 'Thank you for sharing your experience, and I'm genuinely sorry this happened. Skin reactions can occur during the adjustment period, but what you're describing sounds beyond normal. I'd love to help — could you reach out to care@pureglow.com? We'll make this right with a full refund or help you find a formula better suited to your skin type. — Sarah, Customer Care at PureGlow'...",
        targetKeywords: [
          "review response prompt",
          "AI review reply generator",
          "e-commerce review template",
        ],
        relatedTemplates: ["product-description-ecommerce-writer", "customer-testimonial-refiner"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "category-page-description-writer",
        title: "Category Page Description Writer",
        description:
          "Write SEO-rich category page descriptions that improve search rankings and guide shoppers.",
        prompt:
          "You are an e-commerce SEO copywriter. Write a category page description for [CATEGORY NAME] on [STORE NAME].\n\nCategory details:\n- Category: [CATEGORY NAME, e.g., Women's Running Shoes, Organic Skincare, Office Furniture]\n- Parent category: [IF SUBCATEGORY, e.g., Women's Shoes > Running Shoes]\n- Number of products: [APPROXIMATE COUNT]\n- Price range: [LOW TO HIGH]\n- Top brands in category: [LIST 3-5 BRANDS]\n- Target keywords: [PRIMARY AND SECONDARY KEYWORDS]\n- Target customer: [WHO SHOPS THIS CATEGORY]\n- Unique selling point: [WHY SHOP THIS CATEGORY ON YOUR STORE VS. COMPETITORS]\n\nWrite the following:\n\n1. **Above-the-fold introduction** (50-75 words): Placed above the product grid. Should:\n   - Include the primary keyword in the first sentence\n   - Communicate what the customer will find\n   - Highlight the category's value proposition\n   - Be scannable and not block the products visually\n\n2. **Below-the-fold SEO content** (300-400 words): Placed below the product grid. Structured as:\n   - H2: Buying guide headline (include keyword)\n   - Paragraph 1: What to look for when shopping this category\n   - Paragraph 2: How your store's selection is curated\n   - H3: Popular subcategories or product types (internal linking opportunities)\n   - Paragraph 3: Brand highlights (mention 2-3 top brands naturally)\n   - H3: FAQ section with 3 common customer questions and concise answers\n\n3. **Meta title**: Under 60 characters, keyword-forward\n4. **Meta description**: Under 155 characters, includes CTA\n5. **Breadcrumb structure**: Suggested breadcrumb trail\n6. **Internal linking suggestions**: 3-5 related categories or blog posts to link to\n\nWriting rules:\n- Keyword density 1-2% (natural, not forced)\n- Write for shoppers first, search engines second\n- Use schema-friendly heading hierarchy (H2, H3)\n- Include seasonal relevance if applicable",
        category: "ecommerce",
        tags: ["category page", "SEO copy", "e-commerce content"],
        useCase:
          "Use when creating or improving category pages in your online store to boost organic traffic and help shoppers find products.",
        exampleInput:
          "Category: Wireless Earbuds. Store: TechHaven. Products: ~45. Price range: $29-$249. Brands: Sony, Jabra, Apple, Samsung, Nothing. Target keywords: wireless earbuds, best bluetooth earbuds. Customer: Tech-savvy consumers aged 18-45. USP: Expert-curated selection with comparison tools and real-world reviews.",
        exampleOutput:
          "Above-the-fold: 'Shop wireless earbuds from top brands like Sony, Jabra, and Apple. Whether you need noise-canceling for commutes, sport-fit for workouts, or premium sound for music lovers, our curated collection of 45+ Bluetooth earbuds includes expert comparisons to help you find your perfect pair.' Below-the-fold H2: 'How to Choose the Best Wireless Earbuds for Your Lifestyle'...",
        targetKeywords: [
          "category page description prompt",
          "e-commerce SEO copy",
          "AI category page writer",
        ],
        relatedTemplates: ["product-description-ecommerce-writer", "faq-generator-product-pages"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "abandoned-cart-email-writer",
        title: "Abandoned Cart Email Writer",
        description:
          "Write a high-converting abandoned cart email sequence that recovers lost sales.",
        prompt:
          "You are an email marketing specialist for e-commerce. Create an abandoned cart email sequence for [STORE NAME].\n\nStore context:\n- Store: [STORE NAME] selling [PRODUCT CATEGORY]\n- Brand voice: [TONE — friendly, luxury, playful, minimalist, bold]\n- Average order value: [AOV]\n- Typical customer: [BRIEF CUSTOMER DESCRIPTION]\n- Discount strategy: [DO YOU OFFER DISCOUNTS? IF SO, WHAT %]\n- Shipping info: [FREE SHIPPING THRESHOLD, DELIVERY TIME]\n- Cart abandonment rate: [CURRENT RATE IF KNOWN]\n\nCreate a 3-email sequence:\n\n**Email 1: Reminder (sent 1 hour after abandonment)**\n- Subject line: 3 options (no discount, pure reminder)\n- Preview text: For each subject line\n- Body: Friendly reminder, show cart contents placeholder, address the #1 reason people abandon (usually shipping costs or distraction)\n- CTA button text: 3 options\n- Tone: Helpful, not pushy\n\n**Email 2: Social proof (sent 24 hours after)**\n- Subject line: 3 options (incorporate urgency or social proof)\n- Preview text: For each\n- Body: Lead with a customer review or testimonial about the product they abandoned, address the #2 objection (quality/value concerns), include trust signals (returns policy, guarantee)\n- CTA button text: 3 options\n- Tone: Confident, reassuring\n\n**Email 3: Final nudge (sent 72 hours after)**\n- Subject line: 3 options (last chance, with or without incentive)\n- Body: Create genuine urgency (stock levels, cart expiration), if using discount — introduce it here (not earlier), include alternative products if original item sells out\n- CTA button text: 3 options\n- Tone: Direct, with a touch of urgency\n\nFor each email provide:\n- Exact HTML-ready copy (with placeholders for dynamic content like [PRODUCT NAME], [PRODUCT IMAGE], [CART LINK])\n- Character count for subject lines\n- Recommended send time\n- Expected open rate and click rate benchmarks\n- A/B test suggestions for each email\n\nAlso include: A text-only/plain-text version for accessibility and deliverability.",
        category: "ecommerce",
        tags: ["abandoned cart", "email marketing", "cart recovery"],
        useCase:
          "Use when setting up or improving your store's abandoned cart recovery sequence to recapture lost revenue.",
        exampleInput:
          "Store: Willow & Co. (home decor). Voice: Warm and aspirational. AOV: $85. Customer: Women 28-45 who value aesthetic home styling. Discount: 10% for first-time buyers only. Free shipping over $75. Abandonment rate: 71%.",
        exampleOutput:
          "Email 1 — Subject: 'Your Willow & Co. cart is waiting' (38 chars). Preview: 'That piece you loved is still available.' Body: 'Hi [FIRST_NAME], We noticed you left something beautiful behind. [PRODUCT_IMAGE] [PRODUCT_NAME] is still in your cart and ready to make your space feel like home. [COMPLETE MY ORDER button] Already purchased? Just ignore this email — and enjoy your new piece!'...",
        targetKeywords: [
          "abandoned cart email prompt",
          "cart recovery email template",
          "AI e-commerce email",
        ],
        relatedTemplates: ["product-launch-email-sequence", "seasonal-promotion-copy-writer"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "product-comparison-chart-generator",
        title: "Product Comparison Chart Generator",
        description:
          "Create clear product comparison charts that help customers make informed purchasing decisions.",
        prompt:
          "You are a product content strategist. Create a product comparison chart for [PRODUCT CATEGORY] on [STORE NAME].\n\nComparison context:\n- Products to compare: [LIST 3-5 PRODUCTS WITH KEY SPECS]\n- Target customer decision: [WHAT THEY'RE TRYING TO DECIDE, e.g., which size, which model, basic vs. premium]\n- Customer expertise level: [NOVICE / INTERMEDIATE / EXPERT]\n- Goal: [HELP THEM CHOOSE / UPSELL TO PREMIUM / SHOW VALUE OF YOUR BRAND VS. GENERIC]\n\nCreate:\n1. **Comparison matrix**: A table with:\n   - Products as columns\n   - 8-12 comparison criteria as rows, ordered by customer importance\n   - For each cell: Feature value + brief explanation if needed\n   - Visual indicators: Checkmarks for yes/no features, star ratings for quality tiers\n   - Highlight the 'best value' or 'most popular' option\n\n2. **Comparison criteria selection**: Explain why you chose these criteria:\n   - 4 must-know criteria (deal-breakers for most buyers)\n   - 4 nice-to-know criteria (differentiators for informed buyers)\n   - 2-4 technical specs (for expert buyers)\n\n3. **Decision guide prose** (150-200 words): Written narrative that helps the customer choose:\n   - 'Choose [Product A] if you...' format for each product\n   - Address the most common confusion points\n   - Include a recommendation for each buyer type (budget, mid-range, premium)\n\n4. **FAQ section** (3-4 questions): Common comparison questions customers ask:\n   - 'What's the difference between X and Y?'\n   - 'Is the premium version worth it?'\n   - 'Which one is best for [SPECIFIC USE CASE]?'\n\n5. **SEO metadata**: Title tag and meta description for the comparison page\n6. **Schema suggestion**: Product schema properties to include for rich search results\n\nPresent the comparison fairly — the goal is to help the customer choose the right product, not just the most expensive one. Trust builds lifetime value.",
        category: "ecommerce",
        tags: ["product comparison", "buyer guide", "conversion optimization"],
        useCase:
          "Use when customers frequently compare products in a category and need help making a confident purchasing decision.",
        exampleInput:
          "Category: Standing desks — comparing 3 models: EcoDesk Basic ($299), EcoDesk Pro ($499), EcoDesk Max ($699). Customer decision: Which desk tier to buy. Expertise: Novice (first standing desk). Goal: Help them choose the right tier without overselling.",
        exampleOutput:
          "Comparison criteria (ordered by importance): 1. Height range (all users need this to fit). 2. Weight capacity. 3. Motor type (single vs. dual). 4. Memory presets. 5. Desktop size options. 6. Cable management. 7. Warranty. Decision guide: 'Choose the EcoDesk Basic if you're trying a standing desk for the first time and want to test the habit without a large investment. Choose the Pro if you work from home full-time...'",
        targetKeywords: [
          "product comparison chart prompt",
          "AI comparison generator",
          "e-commerce buyer guide",
        ],
        relatedTemplates: ["amazon-listing-optimizer", "product-description-ecommerce-writer"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "faq-generator-product-pages",
        title: "FAQ Generator for Product Pages",
        description:
          "Generate comprehensive product FAQ sections that reduce support tickets and improve SEO.",
        prompt:
          "You are a customer support specialist and SEO content strategist. Generate a FAQ section for [PRODUCT NAME] on our e-commerce store.\n\nProduct details:\n- Product: [PRODUCT NAME AND BRIEF DESCRIPTION]\n- Category: [PRODUCT CATEGORY]\n- Price: [PRICE]\n- Common customer questions from support: [LIST ANY KNOWN QUESTIONS IF AVAILABLE]\n- Top customer complaints from reviews: [ANY KNOWN PAIN POINTS]\n- Shipping and returns policy: [BRIEF OVERVIEW]\n- Product specifications: [KEY SPECS]\n\nGenerate a FAQ section with:\n\n1. **Pre-purchase FAQs** (5-6 questions): Questions customers ask before buying:\n   - Sizing/compatibility/fit questions\n   - Material/ingredient questions\n   - Comparison to alternatives ('How is this different from [COMPETITOR]?')\n   - Value justification ('Is it worth the price?')\n   - Shipping timeline and cost\n\n2. **Post-purchase FAQs** (4-5 questions): Questions new owners typically have:\n   - Setup/first use instructions\n   - Care and maintenance\n   - Warranty and returns\n   - Troubleshooting common issues\n\n3. **SEO-targeted FAQs** (3-4 questions): Questions phrased as long-tail keywords:\n   - 'Can I use [PRODUCT] for [USE CASE]?'\n   - 'How does [PRODUCT] compare to [ALTERNATIVE]?'\n   - 'What is the best [CATEGORY] for [SPECIFIC NEED]?'\n\nFor each FAQ:\n- Write the question as customers naturally phrase it (conversational, not corporate)\n- Answer in 2-4 sentences — concise but complete\n- Include a CTA where relevant ('See our sizing guide' or 'Contact support')\n- Mark questions that should include FAQ schema markup for Google rich results\n\nAlso provide:\n- Suggested order (most asked → least asked)\n- A collapsible/accordion layout recommendation\n- 3 questions to add over time based on seasonal trends",
        category: "ecommerce",
        tags: ["FAQ", "product page content", "customer support"],
        useCase:
          "Use when building product pages to proactively answer customer questions, reduce support load, and capture FAQ-rich search results.",
        exampleInput:
          "Product: AirPurify Pro HEPA air purifier. Category: Home Appliances. Price: $179. Known questions: 'How often to replace the filter?', 'Is it loud at night?' Complaints: Some say it's larger than expected. Returns: 30-day free returns.",
        exampleOutput:
          "Pre-purchase Q1 (schema): 'What room size does the AirPurify Pro cover?' A: 'The AirPurify Pro is designed for rooms up to 450 square feet — roughly the size of a large bedroom or open-plan studio. For larger spaces, we recommend placing the unit centrally or considering two units. Check our Room Size Calculator for a personalized recommendation.' Pre-purchase Q2: 'How loud is it? Can I sleep with it on?'...",
        targetKeywords: [
          "product FAQ generator prompt",
          "AI FAQ writer",
          "e-commerce FAQ template",
        ],
        relatedTemplates: ["product-description-ecommerce-writer", "category-page-description-writer"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "seasonal-promotion-copy-writer",
        title: "Seasonal Promotion Copy Writer",
        description:
          "Create seasonal and holiday promotional copy across all e-commerce channels.",
        prompt:
          "You are a retail marketing copywriter. Create promotional copy for [STORE NAME]'s [SEASONAL EVENT / HOLIDAY] campaign.\n\nCampaign details:\n- Store: [STORE NAME] selling [PRODUCT CATEGORY]\n- Event: [e.g., Black Friday, Summer Sale, Valentine's Day, Back to School, New Year]\n- Dates: [START AND END DATE]\n- Offer: [DISCOUNT TYPE AND AMOUNT — % off, BOGO, free shipping, gift with purchase]\n- Featured products: [LIST 3-5 PRODUCTS OR CATEGORIES ON SALE]\n- Brand voice: [TONE]\n- Target audience: [WHO YOU'RE TARGETING WITH THIS CAMPAIGN]\n- Past performance: [IF APPLICABLE — what worked or didn't last time]\n\nCreate copy for every channel:\n\n1. **Homepage hero banner**:\n   - Headline (under 8 words)\n   - Subheadline (under 20 words)\n   - CTA button text\n   - 2 alternative variations\n\n2. **Email announcement**:\n   - Subject line (3 options with character counts)\n   - Preview text\n   - Email body: Opening hook, deal details, featured products section, urgency closer\n   - Send time recommendation\n\n3. **Social media posts**:\n   - Instagram: Caption + hashtags + story slide sequence (3 slides)\n   - Facebook: Post copy + link description\n   - Twitter/X: Tweet (under 280 chars)\n\n4. **SMS/text message** (under 160 characters):\n   - 2 variations\n\n5. **Pop-up / announcement bar**:\n   - Header text (under 10 words)\n   - Body text (under 25 words)\n   - CTA\n\n6. **Paid ad copy**:\n   - Google Ads: 3 headlines (30 chars each) + 2 descriptions (90 chars each)\n   - Social ad: Primary text + headline\n\n7. **Countdown urgency copy**: Last 24 hours, last 6 hours, and last hour messaging variations\n\nFor each piece:\n- Include the offer clearly (no customer should have to guess the deal)\n- Match the seasonal mood without being cliche\n- Create genuine urgency (specific end dates, stock limits)\n- Ensure legal compliance (terms and conditions note where needed)",
        category: "ecommerce",
        tags: ["seasonal promotion", "holiday marketing", "sale copy"],
        useCase:
          "Use when planning a seasonal or holiday sale to create cohesive promotional copy across every customer touchpoint.",
        exampleInput:
          "Store: NordicHome (Scandinavian home goods). Event: Spring Refresh Sale. Dates: March 15-22. Offer: 25% off all textiles + free shipping over $50. Featured: linen bedding, throw blankets, curtains. Voice: Calm, Scandinavian-inspired, inviting. Audience: Homeowners 28-50 who value design.",
        exampleOutput:
          "Homepage hero: 'Refresh Your Space This Spring.' Sub: 'Take 25% off all linens and textiles — because a new season deserves new textures.' CTA: 'Shop the Spring Edit.' Email subject option 1: 'Spring called. It wants you to refresh your bedroom.' (52 chars). SMS: 'Spring Refresh: 25% off all NordicHome textiles thru 3/22 + free shipping $50+. Shop now: [link]' (97 chars)...",
        targetKeywords: [
          "seasonal promotion copy prompt",
          "holiday sale email template",
          "AI promotional copywriter",
        ],
        relatedTemplates: ["abandoned-cart-email-writer", "product-launch-email-sequence"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "product-launch-email-sequence",
        title: "Product Launch Email Sequence",
        description:
          "Create a multi-email product launch sequence that builds anticipation and drives first-week sales.",
        prompt:
          "You are an e-commerce email strategist. Create a product launch email sequence for [PRODUCT NAME] from [STORE NAME].\n\nLaunch details:\n- Product: [PRODUCT NAME AND DESCRIPTION]\n- Launch date: [DATE]\n- Price: [PRICE]\n- Target segment: [WHO THIS EMAIL SEQUENCE GOES TO — full list, VIPs, waitlist, etc.]\n- Pre-launch hype level: [COLD / WARM / HOT — has the audience been teased?]\n- Launch offer: [ANY SPECIAL LAUNCH PRICING, BUNDLE, OR BONUS]\n- Brand voice: [TONE]\n- Product USP: [THE #1 REASON TO BUY]\n\nCreate a 5-email launch sequence:\n\n**Email 1: Teaser (sent 7 days before launch)**\n- Goal: Create curiosity without revealing everything\n- Subject line: 3 options\n- Body: Hint at the problem the product solves, subtle visual teaser, CTA to join waitlist or set a reminder\n\n**Email 2: Story (sent 3 days before)**\n- Goal: Build emotional connection through the origin story\n- Subject line: 3 options\n- Body: Why you created this product — the problem you noticed, the development journey, what makes it special. Include a behind-the-scenes element.\n\n**Email 3: Launch day (sent on launch day, early morning)**\n- Goal: Drive immediate purchases\n- Subject line: 3 options (one direct, one curiosity, one urgency)\n- Body: Product reveal with hero image placeholder, key benefits (3 bullet points), launch offer details, primary CTA, social proof if available (early reviews, press mentions)\n\n**Email 4: Social proof (sent 2 days after launch)**\n- Goal: Convert the undecided\n- Subject line: 3 options\n- Body: Customer reactions, reviews, or usage stats from launch day. Address the top purchase objection. Secondary benefit highlight.\n\n**Email 5: Last chance (sent 5-7 days after launch)**\n- Goal: Capture final launch-window sales\n- Subject line: 3 options\n- Body: Launch offer expiration reminder, recap what they're missing, FAQ-style objection handling, final CTA\n\nFor each email include: Subject line, preview text, full body copy, CTA text, send timing, and one A/B test recommendation.",
        category: "ecommerce",
        tags: ["product launch", "email sequence", "launch strategy"],
        useCase:
          "Use when launching a new product to build anticipation, drive first-week sales, and establish momentum.",
        exampleInput:
          "Product: BrewMate Smart Pour-Over Coffee Maker. Store: CoffeeGear.co. Launch: March 20. Price: $129. Segment: Newsletter subscribers (warm). Offer: $99 early-bird for first 48 hours. Voice: Enthusiastic but knowledgeable. USP: App-controlled brewing temperature and timing for perfect pour-over every time.",
        exampleOutput:
          "Email 1 (Teaser) — Subject: 'Something's brewing at CoffeeGear...' (41 chars). Body: 'We've been working on something for the past 14 months, and we're almost ready to share it. If you've ever poured boiling water over expensive beans and wondered why your coffee still tastes mediocre... you're going to love what's coming March 20. [Be the first to know — join the waitlist]'...",
        targetKeywords: [
          "product launch email prompt",
          "e-commerce launch sequence",
          "AI email sequence builder",
        ],
        relatedTemplates: ["abandoned-cart-email-writer", "seasonal-promotion-copy-writer"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "customer-testimonial-refiner",
        title: "Customer Testimonial Refiner",
        description:
          "Transform raw customer feedback into polished, persuasive testimonials for marketing use.",
        prompt:
          "You are a brand copywriter specializing in social proof and testimonial optimization. Help me refine raw customer feedback into polished testimonials.\n\nContext:\n- Brand: [BRAND NAME]\n- Product: [PRODUCT NAME]\n- Where testimonials will be used: [WEBSITE / ADS / EMAIL / PACKAGING / SOCIAL / ALL]\n- Brand voice: [TONE]\n- Legal consideration: [DO WE HAVE PERMISSION TO EDIT? MUST KEEP AUTHENTIC?]\n\nRaw customer feedback to refine:\n- Feedback 1: [PASTE RAW CUSTOMER QUOTE — email, survey response, review, etc.]\n- Feedback 2: [PASTE]\n- Feedback 3: [PASTE]\n- Feedback 4: [PASTE]\n- Feedback 5: [PASTE]\n\nFor each piece of feedback, provide:\n\n1. **Cleaned-up version**: Fix grammar, remove filler words, tighten language while preserving the customer's authentic voice and key points. Keep their personality. Flag any changes that alter meaning (for legal review).\n\n2. **Pull quote**: Extract the single most powerful sentence or phrase (under 20 words) for use as a headline testimonial.\n\n3. **Platform-optimized versions**:\n   - Website hero: 1-2 sentences max, impactful, benefit-focused\n   - Social media: Formatted as a shareable quote with [CUSTOMER FIRST NAME, LOCATION]\n   - Email: 2-3 sentences that address a specific objection\n   - Ad copy: Shortest possible version (under 15 words) for paid ads\n\n4. **Categorization**: Tag each testimonial by:\n   - Objection it overcomes (price, quality, trust, complexity)\n   - Buyer stage it suits (awareness, consideration, decision)\n   - Emotion it conveys (trust, excitement, relief, confidence)\n\n5. **Testimonial gaps**: After reviewing all 5, identify which objections or buyer stages are NOT covered and suggest questions to ask future customers to fill those gaps.\n\nPreserve authenticity — real testimonials outperform polished corporate speak. The goal is clarity, not perfection.",
        category: "ecommerce",
        tags: ["testimonials", "social proof", "customer reviews"],
        useCase:
          "Use when you have raw customer feedback and need to organize and format it for maximum marketing impact across channels.",
        exampleInput:
          "Brand: FitFuel. Product: Protein bars. Raw feedback 1: 'honestly i was skeptical because most protein bars taste like cardboard but these actually taste like a real cookie?? my gym buddy thought i was eating junk food lol.' Raw feedback 2: 'Been using for 3 months. Genuinely the only bar that doesn't upset my stomach. IBS sufferer here.'",
        exampleOutput:
          "Feedback 1 — Cleaned: 'I was skeptical because most protein bars taste like cardboard, but these actually taste like a real cookie. My gym buddy thought I was eating junk food.' Pull quote: 'My gym buddy thought I was eating junk food.' Category: Overcomes taste objection, consideration stage, conveys surprise/delight. Website hero: 'Most protein bars taste like cardboard. These taste like a real cookie.' — Jamie R., Austin TX...",
        targetKeywords: [
          "testimonial refiner prompt",
          "AI testimonial writer",
          "social proof template",
        ],
        relatedTemplates: ["product-review-response-generator", "product-description-ecommerce-writer"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
    ],
  },

  // ── Consulting ───────────────────────────────────────────────────────────
  {
    slug: "consulting",
    title: "Consulting Prompts",
    description:
      "AI prompt templates for client intake, executive summaries, strategy frameworks, and consulting deliverables. Works with ChatGPT, Claude, and Gemini.",
    longDescription:
      "Deliver higher-quality consulting work faster with tested prompt templates for conducting client intake, applying strategy frameworks, writing executive summaries, and building ROI business cases. Each template is designed for real consulting workflows — from initial discovery through final recommendations. Paste them into any AI assistant and customize the bracketed placeholders to match your client engagement.",
    icon: "💡",
    keywords: [
      "consulting prompts",
      "ChatGPT for consultants",
      "strategy consulting prompts",
      "management consulting prompts",
    ],
    relatedCategories: ["business-strategy", "project-management", "finance"],
    templates: [
      {
        slug: "client-intake-questionnaire",
        title: "Client Intake Questionnaire",
        description:
          "Generate a comprehensive client intake questionnaire tailored to your consulting engagement type.",
        prompt:
          "You are a management consultant preparing for a new client engagement. Create a comprehensive intake questionnaire.\n\nEngagement context:\n- Consulting type: [STRATEGY / OPERATIONS / TECHNOLOGY / MARKETING / HR / FINANCIAL ADVISORY / OTHER]\n- Client industry: [INDUSTRY]\n- Client size: [STARTUP / SMB / MID-MARKET / ENTERPRISE]\n- Engagement scope: [BRIEF DESCRIPTION OF WHAT YOU'VE BEEN HIRED TO DO]\n- Engagement duration: [TIMELINE]\n- Key stakeholders: [WHO YOU'LL BE WORKING WITH]\n- Known challenges: [ANY ISSUES ALREADY SURFACED]\n\nGenerate an intake questionnaire organized in sections:\n\n1. **Company overview** (6-8 questions): Questions to understand the business context, history, market position, organizational structure, and culture. Include questions about recent strategic changes.\n\n2. **Current state assessment** (6-8 questions): Questions to map the as-is situation — current processes, performance metrics, technology stack, team capabilities, and pain points. These should surface the real problems beneath the stated problems.\n\n3. **Goals and vision** (4-5 questions): Questions about desired outcomes, success criteria, timeline expectations, and how they'll measure whether the engagement was successful.\n\n4. **Constraints and politics** (4-5 questions): Tactful questions about budget limitations, organizational resistance, past failed initiatives, political dynamics, and non-negotiables. These are the questions most consultants forget to ask.\n\n5. **Data and access** (3-4 questions): What data, systems, and people you'll need access to.\n\n6. **Working relationship** (3-4 questions): Communication preferences, meeting cadence, decision-making process, and feedback expectations.\n\nFor each question:\n- Write it in conversational language (not corporate-speak)\n- Include a brief note on why this question matters (what insight it reveals)\n- Flag questions that are better asked in person vs. sent as a form\n- Indicate which are must-ask vs. nice-to-have\n\nAlso provide:\n- A suggested order for the intake meeting (which section to start with and why)\n- 3 red-flag answers to watch for (signals that the engagement may be problematic)\n- A follow-up template to send after the intake meeting summarizing what you heard",
        category: "consulting",
        tags: ["client intake", "discovery", "consulting process"],
        useCase:
          "Use at the start of any consulting engagement to ensure you ask the right questions and uncover the real problems before proposing solutions.",
        exampleInput:
          "Type: Operations consulting. Industry: Manufacturing. Size: Mid-market ($50M revenue). Scope: Reduce production lead times by 30%. Duration: 4 months. Stakeholders: COO, plant managers, supply chain director. Known challenge: Bottleneck in quality inspection stage.",
        exampleOutput:
          "Section 1 — Company Overview. Q1 (must-ask, in-person): 'Walk me through a product from order to delivery — what does that journey look like today?' Why: This reveals process understanding and where the client perceives vs. actual bottlenecks. Q2: 'How has your production volume changed over the past 3 years, and did your processes scale with it?' Why: Surfaces whether current problems are growth-related...",
        targetKeywords: [
          "client intake questionnaire prompt",
          "consulting discovery template",
          "AI client intake tool",
        ],
        relatedTemplates: ["stakeholder-interview-guide", "findings-presentation-outliner"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "findings-presentation-outliner",
        title: "Findings Presentation Outliner",
        description:
          "Structure a consulting findings presentation with data-driven insights and clear recommendations.",
        prompt:
          "You are a senior consultant preparing a findings presentation for a client. Create a detailed presentation outline.\n\nEngagement context:\n- Client: [CLIENT NAME AND INDUSTRY]\n- Project: [WHAT YOU WERE HIRED TO DO]\n- Audience: [WHO WILL BE IN THE ROOM — titles and decision-making authority]\n- Presentation format: [IN-PERSON / VIRTUAL] and duration: [TIME]\n- Key findings: [LIST YOUR 3-5 MAIN FINDINGS]\n- Recommendations: [LIST YOUR TOP RECOMMENDATIONS]\n- Sensitive issues: [ANY FINDINGS THAT MAY BE POLITICALLY SENSITIVE]\n- Expected resistance: [WHERE YOU ANTICIPATE PUSHBACK]\n\nCreate a presentation outline following the Pyramid Principle (conclusion first):\n\n1. **Title slide**: Engagement name, date, confidentiality notice\n2. **Executive summary slide** (the most important slide): Answer the question the client hired you to answer in 3-4 bullet points. Lead with the recommendation, not the analysis.\n3. **Situation-Complication-Resolution** (1 slide): Frame the narrative\n   - Situation: Where the client is today (facts they agree with)\n   - Complication: What's threatening their goals\n   - Resolution: Your recommended path forward\n4. **Findings section** (1-2 slides per finding): For each finding:\n   - Headline that states the insight (not 'Analysis of X' but 'X is causing Y')\n   - Supporting data visualization description (chart type, what it shows)\n   - So-what: Why this finding matters to the business\n   - Source/methodology note\n5. **Recommendations section** (1 slide per recommendation):\n   - What to do (specific and actionable)\n   - Expected impact (quantified where possible)\n   - Implementation effort (high/medium/low)\n   - Timeline\n   - Priority ranking\n6. **Implementation roadmap** (1-2 slides): Phased plan with quick wins, medium-term, and long-term actions\n7. **Risk and mitigation** (1 slide): Top 3 risks to successful implementation\n8. **Next steps** (1 slide): Specific actions with owners and deadlines\n9. **Appendix**: Detailed data, methodology, additional analyses\n\nAlso provide:\n- Talking points for each slide (what to say, not just what's on the slide)\n- Anticipated questions and prepared answers for 5 likely pushback points\n- Advice on how to present the politically sensitive finding\n- Suggested meeting flow: when to invite discussion vs. present through",
        category: "consulting",
        tags: ["findings presentation", "client deliverable", "Pyramid Principle"],
        useCase:
          "Use when preparing to present consulting findings and recommendations to client leadership.",
        exampleInput:
          "Client: Regional hospital network. Project: Operational efficiency assessment. Audience: CEO, CFO, COO, department heads (12 people). Duration: 60 minutes. Key findings: ER wait times driven by bed management, not staffing; scheduling system is 15 years old; nurse overtime 40% above benchmark. Sensitive: Finding suggests middle management layer is redundant.",
        exampleOutput:
          "Executive summary slide: 'The primary driver of extended ER wait times is bed management workflow, not staffing levels. Implementing a real-time bed tracking system and restructuring patient flow coordination could reduce ER wait times by 35% and save $2.4M annually in overtime costs.' Slide 3 — Finding 1: Headline: 'Bed management delays account for 62% of ER wait time, while staffing gaps account for only 15%.' Chart: Stacked bar comparing wait time components across 6 months...",
        targetKeywords: [
          "consulting presentation prompt",
          "findings presentation template",
          "AI consulting deliverable",
        ],
        relatedTemplates: ["executive-summary-writer", "recommendation-memo-writer"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "framework-applicator",
        title: "Framework Applicator",
        description:
          "Apply classic consulting and strategy frameworks to any business situation with structured analysis.",
        prompt:
          "You are a strategy consultant. Apply the [FRAMEWORK NAME] framework to analyze [COMPANY/SITUATION].\n\nFramework: [CHOOSE ONE: Porter's Five Forces / SWOT / PESTEL / McKinsey 7S / BCG Matrix / Value Chain Analysis / Blue Ocean Strategy / Jobs to Be Done / Ansoff Matrix / Business Model Canvas]\n\nBusiness context:\n- Company/business: [COMPANY NAME AND DESCRIPTION]\n- Industry: [INDUSTRY]\n- Current challenge or question: [WHAT YOU'RE TRYING TO ANALYZE OR DECIDE]\n- Known information: [KEY FACTS, MARKET DATA, COMPETITOR INFO YOU HAVE]\n- Decision to be made: [WHAT STRATEGIC DECISION THIS ANALYSIS SHOULD INFORM]\n\nProvide:\n1. **Framework overview** (2-3 sentences): Brief explanation of the framework and why it's the right tool for this analysis\n\n2. **Detailed analysis**: Apply each component of the framework to the specific company/situation:\n   - For each component, provide 3-5 specific, evidence-based observations\n   - Use concrete examples and data points (reference the information I provided)\n   - Avoid generic statements that could apply to any company\n   - Rate each component's impact: Strong / Moderate / Weak\n\n3. **Visual representation**: Describe how to visualize this analysis (matrix, chart, diagram) with placement rationale\n\n4. **Key insights** (3-5): What does this framework reveal that wasn't obvious before? These should be genuine insights, not restatements of the inputs.\n\n5. **Strategic implications**: Based on the analysis, what should the company do? Provide 3 specific, actionable recommendations.\n\n6. **Framework limitations**: What does this framework NOT capture about this situation? Suggest a complementary framework to fill the gap.\n\n7. **One-page summary**: A concise summary suitable for a strategy slide deck.\n\nIf I haven't provided enough information for a thorough analysis, tell me exactly what data I need to gather before the analysis would be meaningful.",
        category: "consulting",
        tags: ["strategy framework", "business analysis", "strategic planning"],
        useCase:
          "Use when you need to apply a structured analytical framework to a business situation to generate strategic insights.",
        exampleInput:
          "Framework: Porter's Five Forces. Company: A mid-size SaaS company selling project management tools. Industry: Project management software. Challenge: Considering raising prices 20% but worried about customer churn. Known info: 3 main competitors (Asana, Monday, Notion), low switching costs, 5,000 customers, 8% annual churn rate.",
        exampleOutput:
          "Threat of new entrants: MODERATE. Low barriers to entry in SaaS (cloud infrastructure, no-code tools lower build costs), but network effects and integrations create moderate switching inertia. AI-native project management tools are a specific emerging threat. Bargaining power of buyers: HIGH. Low switching costs (most PM tools offer free migration), many alternatives available, and price-sensitive SMB segment makes up 70% of the customer base...",
        targetKeywords: [
          "consulting framework prompt",
          "strategy analysis template",
          "AI framework applicator",
        ],
        relatedTemplates: ["executive-summary-writer", "benchmarking-report-builder"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "executive-summary-writer",
        title: "Executive Summary Writer",
        description:
          "Write a concise executive summary that distills complex findings into clear, actionable insights for leadership.",
        prompt:
          "You are a senior partner at a consulting firm. Write an executive summary for [DOCUMENT TYPE].\n\nDocument context:\n- Document type: [STRATEGY REPORT / AUDIT FINDINGS / MARKET ANALYSIS / OPERATIONAL REVIEW / DUE DILIGENCE / PROJECT PROPOSAL]\n- Client: [CLIENT NAME AND ROLE OF THE READER]\n- Reader's priority: [WHAT THEY CARE MOST ABOUT — cost savings, growth, risk, compliance]\n- Document length: [HOW LONG THE FULL DOCUMENT IS]\n- Executive summary length: [TARGET — usually 1-2 pages]\n\nKey content to summarize:\n- Background: [WHY THIS WORK WAS DONE — 2-3 sentences]\n- Methodology: [HOW THE ANALYSIS WAS CONDUCTED — 1-2 sentences]\n- Key findings: [LIST 3-5 MAIN FINDINGS WITH DATA POINTS]\n- Recommendations: [LIST 3-5 RECOMMENDATIONS]\n- Impact: [QUANTIFIED IMPACT IF RECOMMENDATIONS ARE FOLLOWED]\n- Timeline: [IMPLEMENTATION TIMELINE]\n- Investment required: [COST OR RESOURCES NEEDED]\n\nWrite an executive summary that:\n1. **Opens with the bottom line**: The single most important thing the reader needs to know. No preamble, no methodology first — answer their question immediately.\n2. **Follows the SCR structure**: Situation (1-2 sentences), Complication (1-2 sentences), Resolution (2-3 sentences).\n3. **Presents findings as insights**: Not 'We found that...' but '[Specific insight] — which means [business implication].'\n4. **Quantifies everything possible**: Replace 'significant improvement' with '23% reduction in processing time.'\n5. **Ends with a clear ask**: What decision or action you need from the reader, by when.\n\nFormatting:\n- Use bold for the 3-5 most important phrases a scanning reader should catch\n- Keep paragraphs to 3-4 sentences maximum\n- Include a bullet-point summary box at the top (4-5 bullets)\n- Total length: [TARGET WORD COUNT]\n\nAlso provide:\n- A 2-sentence 'elevator pitch' version for verbal conversations\n- 3 questions the reader is likely to ask after reading this, with brief answers",
        category: "consulting",
        tags: ["executive summary", "business writing", "leadership communication"],
        useCase:
          "Use when you need to distill a complex report or analysis into a clear, compelling executive summary that drives action.",
        exampleInput:
          "Type: Operational review. Client: CFO of a logistics company. Priority: Cost reduction. Full document: 45 pages. Target summary: 1 page. Findings: Fleet utilization at 61% (benchmark 78%), 23% of routes overlap between regions, driver overtime is $2.1M above budget. Recommendations: Consolidate routes, implement dynamic scheduling, renegotiate fuel contracts. Impact: $4.7M annual savings.",
        exampleOutput:
          "Summary box: Your fleet operations have a $4.7M annual savings opportunity. Fleet utilization is 17 points below industry benchmark, primarily due to route overlap and static scheduling. Three initiatives — route consolidation, dynamic scheduling, and fuel contract renegotiation — can close this gap within 9 months. Body: **Your fleet is running at 61% utilization — 17 percentage points below the industry benchmark of 78%.** This gap represents $4.7M in recoverable annual costs...",
        targetKeywords: [
          "executive summary prompt",
          "AI executive summary writer",
          "consulting summary template",
        ],
        relatedTemplates: ["findings-presentation-outliner", "recommendation-memo-writer"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "workshop-facilitation-guide",
        title: "Workshop Facilitation Guide",
        description:
          "Design a complete workshop facilitation plan with activities, timing, and materials for any consulting objective.",
        prompt:
          "You are a workshop facilitation expert. Design a complete workshop plan for a consulting engagement.\n\nWorkshop context:\n- Objective: [WHAT THE WORKSHOP SHOULD ACHIEVE — strategic alignment, problem-solving, ideation, roadmap planning, team building]\n- Client: [CLIENT COMPANY AND INDUSTRY]\n- Participants: [NUMBER, ROLES, SENIORITY MIX]\n- Duration: [HALF-DAY / FULL-DAY / 2-HOUR]\n- Format: [IN-PERSON / VIRTUAL / HYBRID]\n- Pre-existing dynamics: [ANY TENSIONS, POLITICS, OR ENERGY LEVELS TO BE AWARE OF]\n- Desired output: [WHAT TANGIBLE DELIVERABLE COMES OUT OF THIS WORKSHOP]\n\nDesign a complete facilitation plan:\n\n1. **Pre-workshop preparation**:\n   - Pre-read materials to send (what and when)\n   - Pre-work assignment for participants (5-10 minutes max)\n   - Room setup or virtual tool setup requirements\n   - Materials needed (sticky notes, whiteboards, templates, Miro boards)\n\n2. **Detailed agenda with facilitation instructions**: For each block:\n   - Time allocation\n   - Activity name and purpose\n   - Step-by-step facilitation instructions (what to say, what to do)\n   - Group configuration (individual, pairs, small groups, full group)\n   - Expected output from the activity\n   - Transition to next block\n\n3. **Suggested activities** (choose appropriate ones for the objective):\n   - Icebreaker/energizer (5-10 min)\n   - Problem framing exercise (e.g., 'How Might We' statements)\n   - Divergent thinking activity (brainstorming, brainwriting, crazy 8s)\n   - Convergent thinking activity (dot voting, impact-effort matrix, forced ranking)\n   - Alignment exercise (decision matrix, fist-of-five voting)\n   - Action planning (who-what-when commitment board)\n\n4. **Facilitation tips**:\n   - How to handle dominant participants\n   - How to draw out quiet participants\n   - What to do if the group goes off-track\n   - How to manage conflict productively\n   - Energy management: when to take breaks and how to re-energize\n\n5. **Post-workshop**:\n   - Summary template to send within 24 hours\n   - Action items and owner tracking format\n   - Follow-up meeting recommendation\n\nTime all activities precisely — workshops that run over lose credibility.",
        category: "consulting",
        tags: ["workshop facilitation", "strategy workshop", "collaborative session"],
        useCase:
          "Use when designing a client workshop to ensure it's productive, well-paced, and delivers tangible outcomes.",
        exampleInput:
          "Objective: Align leadership team on 2026 strategic priorities and create a 90-day action plan. Client: Mid-size fintech (150 employees). Participants: 8 executives (CEO, CTO, CFO, VP Sales, VP Product, VP Marketing, VP Ops, CHRO). Duration: Full day (9am-4pm). Format: In-person. Dynamics: CTO and VP Product have competing visions for the platform roadmap. Output: Prioritized list of 5 strategic initiatives with owners.",
        exampleOutput:
          "Pre-workshop: Send a 1-page 'State of the Business' brief with key metrics. Pre-work: Each participant answers 'What is the ONE initiative that would have the most impact on our 2026 goals? Why?' (submit 24 hours before). 9:00-9:20 — Opening: CEO sets context (5 min), then icebreaker: 'Share one customer interaction from this quarter that surprised you' (15 min). Purpose: Grounds the strategic discussion in customer reality...",
        targetKeywords: [
          "workshop facilitation prompt",
          "consulting workshop template",
          "AI facilitation guide",
        ],
        relatedTemplates: ["client-intake-questionnaire", "findings-presentation-outliner"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "benchmarking-report-builder",
        title: "Benchmarking Report Builder",
        description:
          "Create a structured benchmarking report comparing client performance against industry standards and competitors.",
        prompt:
          "You are a benchmarking analyst. Build a benchmarking report for [CLIENT NAME] in the [INDUSTRY] sector.\n\nBenchmarking context:\n- Client: [CLIENT NAME AND BRIEF DESCRIPTION]\n- What to benchmark: [SPECIFIC AREA — operations, financial performance, customer satisfaction, digital maturity, HR practices, etc.]\n- Comparison group: [INDUSTRY PEERS / SPECIFIC COMPETITORS / BEST-IN-CLASS ACROSS INDUSTRIES]\n- Client's current metrics: [LIST KEY METRICS WITH VALUES]\n- Data sources available: [WHAT DATA YOU HAVE ACCESS TO]\n- Purpose: [WHY THIS BENCHMARKING IS BEING DONE — justify investment, identify improvement areas, set targets]\n\nCreate a benchmarking report:\n\n1. **Executive summary**: Key findings in 4-5 bullet points — where the client leads, lags, and matches peers\n\n2. **Methodology**: How the benchmarking was structured:\n   - Selection criteria for comparison group\n   - Metrics chosen and why\n   - Data normalization approach (accounting for size, geography, etc.)\n   - Limitations and caveats\n\n3. **Benchmarking scorecard** (table format):\n   - Metric | Client Value | Peer Median | Top Quartile | Client Rank | Gap to Top Quartile\n   - Include 10-15 metrics organized by category\n   - Color-code: Green (above median), Yellow (at median), Red (below median)\n\n4. **Deep-dive analysis** (for top 3-5 metrics with largest gaps):\n   - What the gap means in business terms (revenue impact, cost impact)\n   - Root cause hypothesis for why the client underperforms\n   - What top performers do differently\n   - Specific actions to close the gap with estimated timeline and investment\n\n5. **Strengths to leverage**: Areas where the client outperforms — how to protect and extend these advantages\n\n6. **Target setting**: Recommended performance targets for the next 12 months:\n   - Conservative target (reach peer median)\n   - Ambitious target (reach top quartile)\n   - Stretch target (reach best-in-class)\n\n7. **Action plan**: Prioritized improvement initiatives in a 2x2 matrix: Impact vs. Effort\n\n8. **Appendix**: Detailed data tables, source references, methodology notes",
        category: "consulting",
        tags: ["benchmarking", "competitive analysis", "performance comparison"],
        useCase:
          "Use when a client needs to understand how they compare to peers and where to focus improvement efforts.",
        exampleInput:
          "Client: RegionalTech, a 200-person IT services firm. Benchmark area: Operational efficiency and profitability. Comparison: IT services industry peers ($20M-$100M revenue). Client metrics: Revenue per employee $150K, gross margin 38%, utilization rate 72%, employee turnover 22%, average project delivery time 45 days. Purpose: Identify why profitability is below peer average.",
        exampleOutput:
          "Executive summary: RegionalTech's revenue per employee ($150K) sits at the 25th percentile — $35K below the peer median of $185K. The primary driver is low utilization (72% vs. 80% median), compounded by above-average turnover (22% vs. 15% median) that creates recurring onboarding costs. Gross margin (38%) trails the median (44%) by 6 points. Scorecard: Revenue/Employee | $150K | $185K | $220K | 25th pctl | -$70K gap to top quartile...",
        targetKeywords: [
          "benchmarking report prompt",
          "AI benchmarking tool",
          "consulting benchmark template",
        ],
        relatedTemplates: ["framework-applicator", "roi-business-case-builder"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "process-improvement-mapper",
        title: "Process Improvement Mapper",
        description:
          "Map current-state and future-state business processes to identify inefficiencies and improvement opportunities.",
        prompt:
          "You are a process improvement consultant certified in Lean Six Sigma. Help me map and improve a business process.\n\nProcess context:\n- Process name: [PROCESS TO IMPROVE, e.g., invoice processing, customer onboarding, hiring]\n- Organization: [COMPANY TYPE AND SIZE]\n- Process owner: [WHO OWNS THIS PROCESS]\n- Current pain points: [WHAT'S NOT WORKING — delays, errors, costs, complaints]\n- Process volume: [HOW OFTEN THIS PROCESS RUNS — daily count, monthly count]\n- Current cycle time: [HOW LONG THE PROCESS TAKES END TO END]\n- Target improvement: [WHAT 'BETTER' LOOKS LIKE — faster, cheaper, fewer errors, better experience]\n\nCreate a process improvement analysis:\n\n1. **Current-state process map** (text-based): Document each step in the current process:\n   - Step number → Step name → Actor (who does it) → Duration → Wait time before next step → Tools/systems used\n   - Classify each step: Value-add / Business-necessary / Waste\n   - Identify handoffs between people or departments\n   - Note decision points and exception paths\n\n2. **Waste identification** (using the 8 Wastes of Lean: DOWNTIME):\n   - Defects: Where do errors occur?\n   - Overproduction: What's done unnecessarily?\n   - Waiting: Where are the bottlenecks?\n   - Non-utilized talent: Who's overqualified for their task?\n   - Transportation: Where does information move unnecessarily?\n   - Inventory: Where does work pile up?\n   - Motion: What involves unnecessary steps or clicks?\n   - Extra processing: What work exceeds what the customer values?\n\n3. **Root cause analysis**: For the top 3 wastes, apply the 5 Whys technique\n\n4. **Future-state process map**: Redesigned process with:\n   - Steps eliminated, combined, or automated\n   - New cycle time estimate\n   - Reduced handoffs\n   - Technology recommendations\n\n5. **Impact quantification**: For each improvement:\n   - Time saved per occurrence\n   - Annual time/cost savings (at current volume)\n   - Quality improvement (error rate reduction)\n\n6. **Implementation plan**: Quick wins (this week), short-term (this month), medium-term (this quarter)\n\n7. **Metrics dashboard**: 5 KPIs to track ongoing process health",
        category: "consulting",
        tags: ["process improvement", "Lean Six Sigma", "process mapping"],
        useCase:
          "Use when a client has an inefficient process and needs a structured analysis of what to fix and how.",
        exampleInput:
          "Process: Employee expense reimbursement. Company: 500-person financial services firm. Pain points: Takes 3 weeks for reimbursement, 30% of submissions have errors that require rework, finance team spends 20 hours/week on expense processing. Volume: ~200 expense reports per month. Target: Under 5 business days, <5% error rate.",
        exampleOutput:
          "Current-state: Step 1 → Employee fills paper form (Employee, 15 min, 0 wait) [Value-add]. Step 2 → Scans receipt and emails to manager (Employee, 10 min, 0 wait) [Waste: Extra processing]. Step 3 → Sits in manager inbox (—, 0 min active, 3-5 days wait) [Waste: Waiting — this is 40% of total cycle time]. Waste analysis: Waiting (56% of cycle time is idle between handoffs), Defects (30% error rate in category coding)...",
        targetKeywords: [
          "process improvement prompt",
          "AI process mapping tool",
          "Lean Six Sigma template",
        ],
        relatedTemplates: ["benchmarking-report-builder", "roi-business-case-builder"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "stakeholder-interview-guide",
        title: "Stakeholder Interview Guide",
        description:
          "Create a structured interview guide for conducting stakeholder interviews during a consulting engagement.",
        prompt:
          "You are a consulting engagement manager. Create a stakeholder interview guide for [PROJECT NAME].\n\nInterview context:\n- Project: [WHAT THE CONSULTING ENGAGEMENT IS ABOUT]\n- Interviewee: [ROLE/TITLE OF THE PERSON YOU'RE INTERVIEWING]\n- Their relationship to the project: [HOW THEY'RE INVOLVED — sponsor, subject matter expert, impacted user, skeptic, champion]\n- Interview duration: [30 / 45 / 60 MINUTES]\n- Interview number: [IS THIS EARLY DISCOVERY OR LATER VALIDATION?]\n- Key hypotheses to test: [WHAT YOU THINK MIGHT BE TRUE THAT YOU NEED TO VALIDATE]\n- Sensitive topics: [ANYTHING POLITICALLY DELICATE TO NAVIGATE]\n\nCreate an interview guide:\n\n1. **Pre-interview preparation**:\n   - Research to do on this stakeholder before the meeting\n   - Context to provide them in the invitation email (template included)\n   - Any documents to review beforehand\n\n2. **Opening** (3-5 minutes):\n   - Introduction script: Who you are, why you're here, how their input will be used\n   - Confidentiality statement\n   - Permission to take notes\n   - Set expectations for the conversation flow\n\n3. **Interview questions** (organized in 4 sections):\n\n   **Section A — Role and context** (5 minutes, 2-3 questions):\n   - Understand their role, responsibilities, and perspective\n\n   **Section B — Current state** (15 minutes, 4-5 questions):\n   - How things work today from their vantage point\n   - Pain points and frustrations\n   - Workarounds they've created\n   - Questions designed to test your hypotheses\n\n   **Section C — Future state** (10 minutes, 3-4 questions):\n   - What success looks like from their perspective\n   - Priorities and trade-offs they'd make\n   - Concerns about proposed changes\n\n   **Section D — Political landscape** (5 minutes, 2-3 questions):\n   - Who else you should talk to\n   - Where resistance might come from\n   - What's been tried before and what happened\n\n4. **Closing** (3 minutes):\n   - 'What should I have asked that I didn't?'\n   - Permission to follow up\n   - Thank you and next steps\n\nFor each question:\n- Include the question and 1-2 follow-up probes\n- Note what insight the question targets\n- Flag which questions connect to your hypotheses\n\nAlso provide:\n- A 1-page interview notes template\n- Synthesis framework: How to code and compare answers across multiple stakeholders\n- Red flags to listen for (signs of deeper organizational issues)",
        category: "consulting",
        tags: ["stakeholder interview", "discovery", "qualitative research"],
        useCase:
          "Use when conducting stakeholder interviews during the discovery phase of a consulting engagement.",
        exampleInput:
          "Project: Digital transformation strategy for a retail bank. Interviewee: Head of Retail Banking (SVP). Relationship: Key sponsor but skeptical of technology-led change. Duration: 45 minutes. Phase: Early discovery. Hypothesis: Branch staff resistance is driven by fear of job loss, not technology aversion. Sensitive: Recent layoffs in another division.",
        exampleOutput:
          "Pre-interview: Review their LinkedIn for career trajectory (likely came up through branch management — empathize with that perspective). Review last quarterly earnings call for any retail banking commentary. Opening: 'Thank you for your time. I'm here to learn from your experience leading retail banking — your perspective on what's working and where there are opportunities is essential to getting this right.' Section B Q1: 'When your branch managers describe their biggest daily challenge, what do they tend to say?' (Targets: Ground truth vs. executive perception. Probe: 'How has that changed in the past 2 years?')...",
        targetKeywords: [
          "stakeholder interview guide prompt",
          "consulting interview template",
          "AI discovery interview",
        ],
        relatedTemplates: ["client-intake-questionnaire", "findings-presentation-outliner"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "recommendation-memo-writer",
        title: "Recommendation Memo Writer",
        description:
          "Write a persuasive recommendation memo that presents options and drives stakeholder decisions.",
        prompt:
          "You are a strategy consultant writing a recommendation memo to a senior decision-maker. Draft a memo for [DECISION TO BE MADE].\n\nMemo context:\n- Decision: [WHAT NEEDS TO BE DECIDED]\n- Decision-maker: [WHO — name, title, what they care about]\n- Deadline for decision: [WHEN]\n- Background: [CONTEXT FOR WHY THIS DECISION IS NEEDED NOW]\n- Analysis completed: [WHAT WORK HAS BEEN DONE TO INFORM THIS]\n- Options identified: [LIST 2-4 OPTIONS]\n- Your recommendation: [WHICH OPTION AND WHY]\n- Risks of inaction: [WHAT HAPPENS IF THEY DON'T DECIDE]\n\nWrite a recommendation memo:\n\n1. **Header**: TO, FROM, DATE, RE (subject line that implies the recommendation)\n2. **Bottom line up front** (2-3 sentences): State your recommendation immediately. Don't make the reader hunt for it.\n3. **Background** (1 paragraph): Neutral context that everyone agrees on. Establishes credibility without being obvious.\n4. **Options analysis** (structured comparison):\n   For each option:\n   - Description (2-3 sentences)\n   - Pros (2-3 bullet points)\n   - Cons (2-3 bullet points)\n   - Financial impact (cost, revenue, ROI)\n   - Timeline to implement\n   - Risk level (Low / Medium / High)\n\n   Present in a comparison table for easy scanning.\n\n5. **Recommendation** (1 paragraph): Restate your recommendation with the rationale. Address the strongest counterargument proactively.\n6. **Implementation preview**: If approved, what happens next (first 30 days)\n7. **Decision requested**: Exactly what you need from the reader, stated clearly\n8. **Appendix reference**: Point to supporting analysis if needed\n\nWriting principles:\n- Use the Minto Pyramid: conclusion → supporting arguments → evidence\n- Every paragraph should start with its main point\n- Quantify impact wherever possible\n- Acknowledge trade-offs honestly (builds trust)\n- Keep the memo to [1 / 2 / 3] pages maximum\n- Use formatting (bold, bullets, tables) to enable 60-second scanning\n\nAlso provide:\n- A 30-second verbal summary for an elevator pitch\n- The 3 most likely objections and pre-written responses",
        category: "consulting",
        tags: ["recommendation memo", "decision support", "business writing"],
        useCase:
          "Use when you need to present a recommendation to a decision-maker in a clear, structured format that drives action.",
        exampleInput:
          "Decision: Whether to build an in-house data analytics platform or buy a third-party solution. Decision-maker: CTO (values engineering quality and team capability). Deadline: End of month. Options: (A) Build custom platform, (B) Implement Looker, (C) Hybrid — buy Looker but build custom integrations. Recommendation: Option C. Risk of inaction: Current spreadsheet-based analytics is causing 2-week delays in business decisions.",
        exampleOutput:
          "RE: Recommendation to implement hybrid analytics platform (Looker + custom integrations). Bottom line: We recommend implementing Looker as the analytics foundation with custom-built integrations to your proprietary data sources (Option C). This delivers 80% of the capability of a fully custom platform at 40% of the cost and 6 months faster time-to-value. Options table: Build Custom | $1.2M, 18 months, High risk | Looker | $400K, 4 months, Low risk | Hybrid | $650K, 7 months, Medium risk...",
        targetKeywords: [
          "recommendation memo prompt",
          "AI decision memo writer",
          "consulting memo template",
        ],
        relatedTemplates: ["executive-summary-writer", "findings-presentation-outliner"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "roi-business-case-builder",
        title: "ROI Business Case Builder",
        description:
          "Build a compelling ROI business case with cost-benefit analysis, payback period, and risk-adjusted projections.",
        prompt:
          "You are a financial analyst and business case specialist. Build an ROI business case for [INITIATIVE NAME].\n\nInitiative details:\n- What: [DESCRIBE THE INITIATIVE — technology investment, process change, new hire, expansion, etc.]\n- Why: [THE BUSINESS PROBLEM OR OPPORTUNITY]\n- Sponsor: [WHO IS CHAMPIONING THIS]\n- Audience: [WHO APPROVES THE BUDGET — CFO, board, executive team]\n- Investment required: [TOTAL COST OR COST RANGE]\n- Timeline: [IMPLEMENTATION TIMELINE AND WHEN BENEFITS START]\n- Alternatives: [WHAT HAPPENS IF WE DO NOTHING, OR OTHER OPTIONS]\n\nBuild a business case:\n\n1. **Executive summary** (half page): The investment, the return, and the recommendation in clear terms\n\n2. **Problem / opportunity quantification**: Put a dollar value on the current problem:\n   - Revenue being lost or missed\n   - Costs being incurred unnecessarily\n   - Productivity being wasted\n   - Risk exposure being carried\n\n3. **Investment breakdown**:\n   - One-time costs (implementation, training, migration)\n   - Recurring costs (licenses, maintenance, FTEs)\n   - Hidden costs to account for (change management, productivity dip, opportunity cost)\n   - Total Cost of Ownership (TCO) over 3 years\n\n4. **Benefits quantification**:\n   - Hard benefits (directly measurable revenue or cost savings)\n   - Soft benefits (productivity gains, employee satisfaction, risk reduction)\n   - Strategic benefits (competitive advantage, capability building)\n   - Show calculations: Assumptions → Calculations → Annual benefit\n\n5. **Financial analysis**:\n   - Payback period: When the investment breaks even\n   - 3-year ROI: (Total benefits - Total costs) / Total costs × 100\n   - Net Present Value (NPV): Using [DISCOUNT RATE] discount rate\n   - Internal Rate of Return (IRR) if applicable\n\n6. **Sensitivity analysis**: What happens to the ROI if:\n   - Benefits are 25% lower than projected (conservative case)\n   - Implementation takes 50% longer\n   - Costs are 20% higher\n\n7. **Risk assessment**: Top 5 risks with probability, impact, and mitigation\n\n8. **Recommendation**: Clear ask with the specific approval being requested\n\nPresent all financials in a table format. Show your assumptions explicitly — hidden assumptions kill business case credibility. Use conservative estimates for benefits and generous estimates for costs to build trust.",
        category: "consulting",
        tags: ["ROI analysis", "business case", "financial modeling"],
        useCase:
          "Use when you need to justify an investment by quantifying the expected return and presenting a compelling financial argument.",
        exampleInput:
          "Initiative: Implement Salesforce CRM to replace spreadsheet-based sales tracking. Problem: Sales team of 25 wastes ~5 hours/week on manual reporting; no pipeline visibility; 15% of deals fall through the cracks. Investment: $180K year 1 (licenses + implementation), $80K/year ongoing. Timeline: 3-month implementation, benefits start month 4. Audience: CFO.",
        exampleOutput:
          "Problem quantification: 25 salespeople × 5 hours/week × $75/hour loaded cost × 50 weeks = $468,750/year in wasted productivity. 15% of pipeline falling through cracks at average deal size of $35K and 200 annual opportunities = $1,050,000 in recoverable revenue. Total addressable value: $1.52M/year. Conservative assumption: Capture 30% = $456K annual benefit. Investment: Year 1 $180K, Year 2 $80K, Year 3 $80K. TCO: $340K. Payback period: 5.4 months...",
        targetKeywords: [
          "ROI business case prompt",
          "AI business case builder",
          "cost-benefit analysis template",
        ],
        relatedTemplates: ["benchmarking-report-builder", "executive-summary-writer"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
    ],
  },

  // ── Content Strategy ─────────────────────────────────────────────────────
  {
    slug: "content-strategy",
    title: "Content Strategy Prompts",
    description:
      "AI prompt templates for content repurposing, editorial calendars, podcast planning, video scripts, and content briefs. Works with ChatGPT, Claude, and Gemini.",
    longDescription:
      "Maximize every piece of content you create with tested prompt templates for repurposing blog posts into social threads, planning podcast episodes, building editorial calendars, and writing video scripts. Each template is designed for real content workflows — from ideation through multi-channel distribution. Paste them into any AI assistant and customize the bracketed placeholders to match your content strategy.",
    icon: "📝",
    keywords: [
      "content strategy prompts",
      "content repurposing prompts",
      "blog post prompts",
      "content calendar prompts",
    ],
    relatedCategories: ["marketing", "social-media", "seo"],
    templates: [
      {
        slug: "blog-to-thread-converter",
        title: "Blog-to-Thread Converter",
        description:
          "Transform a blog post into an engaging social media thread optimized for Twitter/X or LinkedIn.",
        prompt:
          "You are a content strategist specializing in social media repurposing. Convert the following blog post into a social media thread.\n\nBlog post details:\n- Title: [BLOG POST TITLE]\n- URL: [URL FOR LINKING]\n- Key points: [LIST THE 5-7 MAIN POINTS OR PASTE THE FULL BLOG POST]\n- Target platform: [TWITTER/X / LINKEDIN / BOTH]\n- Author's brand voice: [TONE — authoritative, conversational, provocative, educational]\n- Goal: [DRIVE TRAFFIC TO BLOG / BUILD AUTHORITY / SPARK DISCUSSION / GROW FOLLOWERS]\n\nCreate:\n\n1. **Twitter/X thread** (8-12 tweets):\n   - Tweet 1 (hook): A bold, curiosity-driven opening that stops the scroll. Use a contrarian take, surprising stat, or provocative question. Do NOT start with 'Thread:' — that's outdated.\n   - Tweets 2-9 (body): Each tweet should be a standalone insight that makes sense even without context. Use:\n     - One key idea per tweet\n     - Short sentences (under 200 characters preferred for readability)\n     - Specific examples and numbers (not vague claims)\n     - White space between lines for readability\n   - Tweet 10-11 (summary): Recap the key takeaway in 1-2 tweets\n   - Final tweet: CTA — link to the full blog post with a reason to click ('The full breakdown with examples: [URL]')\n\n2. **LinkedIn version** (if requested):\n   - Opening hook (first 3 lines visible before 'see more' — make them count)\n   - Body: Reformatted for LinkedIn's paragraph style (not tweet-sized chunks)\n   - 3-5 line breaks for readability\n   - End with a question to drive comments\n   - 3-5 relevant hashtags\n\n3. **Engagement boosters**:\n   - 2 poll questions derived from the content (for a follow-up post)\n   - 3 reply-bait questions to post in the thread comments\n\n4. **Timing recommendation**: Best day/time to post for maximum reach on each platform\n\nRules:\n- Never start tweets with 'I' (LinkedIn yes, Twitter no)\n- Each tweet must be under 280 characters\n- Include at least one tweet with a numbered list\n- Include at least one tweet with a contrarian take or myth-bust",
        category: "content-strategy",
        tags: ["content repurposing", "social media threads", "blog promotion"],
        useCase:
          "Use when you've published a blog post and want to drive traffic and engagement by repurposing it into a social media thread.",
        exampleInput:
          "Title: '7 Pricing Mistakes SaaS Founders Make.' Key points: Underpricing out of fear, not testing annual vs. monthly, hiding pricing page, no free tier strategy, ignoring willingness-to-pay research, flat pricing when usage-based fits better, not raising prices regularly. Platform: Twitter/X. Voice: Direct and experienced. Goal: Build authority.",
        exampleOutput:
          "Tweet 1: 'Most SaaS founders leave 30-40% of revenue on the table with their pricing. After advising 50+ startups, here are the 7 mistakes I see over and over:' Tweet 2: 'Mistake 1: Pricing based on your costs, not their value. Your customer doesn't care that your AWS bill is $500/mo. They care that you save them 10 hours a week. Price the outcome.' Tweet 3: 'Mistake 2: Making annual pricing an afterthought...'",
        targetKeywords: [
          "blog to thread prompt",
          "content repurposing template",
          "AI thread generator",
        ],
        relatedTemplates: ["newsletter-to-blog-expander", "content-brief-generator"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "podcast-episode-planner",
        title: "Podcast Episode Planner",
        description:
          "Plan a complete podcast episode with structure, talking points, guest questions, and show notes.",
        prompt:
          "You are a podcast producer and content strategist. Plan a complete podcast episode.\n\nPodcast details:\n- Show name: [PODCAST NAME]\n- Format: [SOLO / INTERVIEW / CO-HOST DISCUSSION / PANEL]\n- Episode topic: [TOPIC]\n- Target listener: [WHO LISTENS TO YOUR SHOW]\n- Episode length target: [e.g., 30 minutes, 45 minutes, 60 minutes]\n- Guest (if applicable): [GUEST NAME, TITLE, EXPERTISE, WHY THEY'RE ON]\n- Unique angle: [WHAT MAKES THIS EPISODE DIFFERENT FROM OTHERS ON THE SAME TOPIC]\n- Key takeaway: [THE ONE THING LISTENERS SHOULD REMEMBER]\n\nCreate a complete episode plan:\n\n1. **Episode title**: 3 options — one curiosity-based, one benefit-based, one contrarian\n2. **Episode description** (150 words): For podcast directories. Include keywords for discoverability.\n3. **Cold open / hook** (30-60 seconds): A compelling opening clip, story, or question that hooks listeners before the intro music. Write the exact script.\n\n4. **Episode structure** with timestamps:\n   - Intro ([DURATION]): What you'll cover and why it matters\n   - Segment 1 ([DURATION]): [TOPIC] — Key points and talking notes\n   - Segment 2 ([DURATION]): [TOPIC] — Key points and talking notes\n   - Segment 3 ([DURATION]): [TOPIC] — Key points and talking notes\n   - Rapid-fire / Listener Q&A ([DURATION]): Quick hits\n   - Outro ([DURATION]): Key takeaway, CTA, next episode tease\n\n5. **Interview questions** (if guest episode, 12-15 questions):\n   - 3 warm-up questions (easy, builds rapport)\n   - 6-8 core questions (progressively deeper, with follow-up probes)\n   - 2-3 unique questions they haven't been asked on other podcasts\n   - 1 closing question (signature question or unexpected angle)\n\n6. **Talking points** (for solo/co-host): Key statistics, stories, examples, and analogies to use\n\n7. **Show notes template**: Timestamped highlights, key links, guest bio, resources mentioned\n\n8. **Repurposing plan**: 5 content pieces to create from this episode:\n   - Audiogram clip (which 60-second segment)\n   - Blog post angle\n   - Social media posts (3 quotes)\n   - Newsletter tie-in\n   - Short-form video clip idea",
        category: "content-strategy",
        tags: ["podcast planning", "episode structure", "audio content"],
        useCase:
          "Use when planning a podcast episode to ensure a clear structure, engaging conversation, and maximum content repurposing.",
        exampleInput:
          "Show: The Growth Lab. Format: Interview. Topic: How to build a personal brand while working full-time. Listener: Ambitious professionals aged 25-40. Length: 45 minutes. Guest: Sarah Chen, VP of Marketing who grew to 100K LinkedIn followers while employed. Angle: Most personal branding advice assumes you have unlimited time — this is for busy people.",
        exampleOutput:
          "Title option 1: 'Building a 100K Audience in 30 Minutes a Day (While Working Full-Time).' Cold open: 'Two years ago, Sarah Chen was posting into the void on LinkedIn — 50 followers, zero engagement. Today she has 100,000 followers and her inbox is full of speaking invitations. The kicker? She built the entire thing in 30 minutes before work each morning. Here's how.' Segment 1 (10 min): The mindset shift — why your employer benefits from your personal brand...",
        targetKeywords: [
          "podcast episode planner prompt",
          "AI podcast producer",
          "podcast planning template",
        ],
        relatedTemplates: ["video-script-writer", "blog-to-thread-converter"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "content-pillar-strategy-builder",
        title: "Content Pillar Strategy Builder",
        description:
          "Define content pillars and build a comprehensive topic cluster strategy for authority building.",
        prompt:
          "You are a content strategist specializing in topical authority and SEO-driven content architecture. Build a content pillar strategy for [BRAND/COMPANY].\n\nBusiness context:\n- Company: [COMPANY NAME AND WHAT YOU DO]\n- Target audience: [WHO YOU'RE TRYING TO REACH]\n- Business goals: [WHAT CONTENT SHOULD ACHIEVE — leads, traffic, authority, sales]\n- Current content: [WHAT YOU ALREADY HAVE — blog posts, videos, newsletters, etc.]\n- Competitors' content: [WHO DOMINATES YOUR CONTENT SPACE]\n- Expertise areas: [WHAT YOU KNOW DEEPLY THAT OTHERS DON'T]\n- Content capacity: [HOW MUCH CONTENT YOU CAN PRODUCE PER MONTH]\n\nBuild a pillar strategy:\n\n1. **Pillar identification** (3-5 pillars): For each pillar:\n   - Pillar topic name\n   - Why this pillar matters to your audience (pain point or aspiration it addresses)\n   - Why you're uniquely qualified to own this topic\n   - Primary keyword cluster (seed keyword + 5 related keywords)\n   - Competitive assessment: How hard will it be to rank for this pillar?\n\n2. **Pillar page blueprint** (for each pillar): The comprehensive, flagship piece of content:\n   - Suggested format (ultimate guide, resource hub, interactive tool)\n   - Proposed title and H1\n   - Outline with 8-12 sections\n   - Word count recommendation\n   - Internal linking strategy (how cluster pages link to/from it)\n\n3. **Cluster topics** (8-12 per pillar): Supporting content pieces:\n   - Topic title\n   - Target long-tail keyword\n   - Content format (blog post, video, infographic, tool, template)\n   - Search intent (informational, commercial, navigational)\n   - Funnel stage (awareness, consideration, decision)\n   - Brief description (1-2 sentences)\n\n4. **Content matrix**: Visualize the relationship between pillars and clusters in a table format\n\n5. **Gap analysis**: Topics your competitors cover that you don't, and unique angles they're missing\n\n6. **12-month rollout plan**: Which pillar to build first and why, monthly content priorities, and dependency order\n\n7. **Success metrics**: KPIs for each pillar (traffic, rankings, leads, engagement) with 6-month and 12-month targets",
        category: "content-strategy",
        tags: ["content pillars", "topic clusters", "content architecture"],
        useCase:
          "Use when building a long-term content strategy to establish topical authority and drive sustainable organic traffic.",
        exampleInput:
          "Company: CloudHR, an HR software startup. Audience: HR managers at companies with 50-500 employees. Goals: Drive demo requests through organic traffic. Competitors: BambooHR blog, SHRM, HBR. Expertise: Employee engagement analytics and remote team management. Capacity: 8 pieces/month.",
        exampleOutput:
          "Pillar 1: 'Employee Engagement' — Your engagement analytics product gives you unique data. Primary keyword: 'employee engagement strategies.' Pillar page: 'The Complete Guide to Employee Engagement in 2026' (5,000 words, resource hub format). Cluster topics: 'How to measure employee engagement without surveys' (informational, awareness), 'Employee engagement benchmarks by industry' (commercial, consideration), 'Exit interview questions that reveal engagement issues' (informational, awareness)...",
        targetKeywords: [
          "content pillar strategy prompt",
          "topic cluster template",
          "AI content strategy builder",
        ],
        relatedTemplates: ["editorial-calendar-builder", "content-brief-generator"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "video-script-writer",
        title: "Video Script Writer",
        description:
          "Write engaging video scripts for YouTube, TikTok, or course content with hooks, structure, and CTAs.",
        prompt:
          "You are a video content strategist and scriptwriter. Write a script for a [VIDEO TYPE] video.\n\nVideo details:\n- Platform: [YOUTUBE / TIKTOK / INSTAGRAM REELS / COURSE MODULE / WEBINAR]\n- Topic: [VIDEO TOPIC]\n- Target length: [DURATION IN MINUTES]\n- Target audience: [WHO IS WATCHING]\n- Video style: [TALKING HEAD / SCREEN SHARE / B-ROLL HEAVY / ANIMATED / TUTORIAL]\n- Creator's brand voice: [TONE — educational, entertaining, professional, casual]\n- Goal: [EDUCATE / ENTERTAIN / CONVERT / BUILD AUTHORITY]\n- Key message: [THE ONE THING VIEWERS SHOULD TAKE AWAY]\n\nWrite a complete video script:\n\n1. **Hook** (first 5-8 seconds — the most critical part):\n   - 3 hook options: one question-based, one bold claim, one story-based\n   - Visual direction for each hook\n   - Pattern interrupt suggestion (what unexpected element grabs attention)\n\n2. **Intro** (10-30 seconds):\n   - Establish credibility quickly (why should they listen to you)\n   - Promise what they'll learn/get (the value proposition for watching)\n   - 'Stick around because...' retention prompt\n\n3. **Body** (main content, organized in segments):\n   - For each segment:\n     - Talking points (conversational, not reading-an-essay)\n     - Visual/B-roll/screen share direction in [BRACKETS]\n     - Transition to next segment\n   - Include 1-2 'open loops' to maintain retention (tease something coming later)\n   - Add a mid-video engagement prompt ('Comment below if you've experienced this')\n\n4. **CTA** (last 15-30 seconds):\n   - Primary CTA (subscribe, click link, download resource)\n   - Soft CTA woven earlier in the video (not just at the end)\n\n5. **Thumbnail and title suggestions**:\n   - 3 title options with estimated CTR appeal\n   - Thumbnail concept description (text overlay, facial expression, visual element)\n\n6. **SEO metadata** (for YouTube):\n   - Description (first 2 lines are critical — include keywords)\n   - Tags (15-20)\n   - Hashtags (3-5)\n\n7. **Short-form cut suggestions**: 3 segments that could be clipped as TikTok/Reels/Shorts with timestamps\n\nWrite conversationally — this should sound like a real person talking, not an AI-written essay. Include verbal cues like 'here's the thing,' 'watch this,' and natural transitions.",
        category: "content-strategy",
        tags: ["video script", "YouTube", "video content"],
        useCase:
          "Use when creating video content and need a structured script that keeps viewers engaged from hook to CTA.",
        exampleInput:
          "Platform: YouTube. Topic: How to use AI tools without losing your authentic voice. Length: 10 minutes. Audience: Content creators and marketers. Style: Talking head with screen share demos. Voice: Honest, slightly irreverent, knowledgeable. Goal: Build authority and drive newsletter signups.",
        exampleOutput:
          "Hook option 1 (bold claim): 'Every piece of AI-generated content sounds the same — and your audience can tell. [pause] But it doesn't have to.' [VISUAL: Show a wall of identical-looking AI blog posts, then swipe to reveal a standout piece]. Intro: 'I've been using AI tools for content creation since GPT-3, and I've figured out the difference between people who sound like robots and people who sound like themselves — but faster. In the next 10 minutes, I'll show you the exact process.'...",
        targetKeywords: [
          "video script prompt",
          "AI video scriptwriter",
          "YouTube script template",
        ],
        relatedTemplates: ["podcast-episode-planner", "blog-to-thread-converter"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "content-audit-analyzer",
        title: "Content Audit Analyzer",
        description:
          "Analyze existing content to identify what to keep, update, merge, or delete for maximum SEO and engagement value.",
        prompt:
          "You are a content strategist conducting a content audit. Help me analyze and prioritize my existing content library.\n\nContent library context:\n- Website: [WEBSITE URL]\n- Total content pieces: [APPROXIMATE NUMBER]\n- Content types: [BLOG POSTS / LANDING PAGES / RESOURCE PAGES / CASE STUDIES / ETC.]\n- Content age range: [OLDEST TO NEWEST]\n- Primary goal: [SEO TRAFFIC / LEAD GENERATION / BRAND AUTHORITY / USER EDUCATION]\n- Known issues: [e.g., declining traffic, thin content, duplicate topics, outdated info]\n\nContent data to audit (provide what you have for each piece):\n- Title: [TITLE]\n- URL: [URL]\n- Publish date: [DATE]\n- Last updated: [DATE]\n- Monthly organic traffic: [PAGEVIEWS]\n- Target keyword: [KEYWORD]\n- Current ranking: [POSITION]\n- Backlinks: [COUNT]\n- Word count: [COUNT]\n- Conversion rate: [IF TRACKED]\n\nFor each content piece, determine the action:\n\n1. **Keep as-is**: High-performing content that needs no changes\n   - Criteria for this bucket\n   - Monitoring plan\n\n2. **Update and optimize**: Good content that needs refreshing\n   - What to update (stats, examples, SEO elements, internal links)\n   - Priority: High/Medium/Low\n   - Estimated traffic uplift\n\n3. **Merge / consolidate**: Multiple pieces on similar topics cannibalizing each other\n   - Which pieces to combine\n   - Which URL to keep (usually the one with more backlinks)\n   - Redirect plan for retired URLs\n\n4. **Reformat**: Content that's good but in the wrong format\n   - Current format → Suggested format\n   - Why (e.g., 'This list post would perform better as an interactive tool')\n\n5. **Delete / archive**: Content that hurts more than it helps\n   - Criteria for deletion (thin content, zero traffic, outdated, off-brand)\n   - Redirect strategy\n\nAlso provide:\n- A prioritized action plan: What to do first, second, third (based on impact vs. effort)\n- Content gap identification: Topics your audience needs that you haven't covered\n- An audit scorecard template for tracking progress\n- Recommended audit frequency (quarterly, semi-annually, annually)",
        category: "content-strategy",
        tags: ["content audit", "content optimization", "SEO strategy"],
        useCase:
          "Use when your content library has grown organically and you need to evaluate what's working, what needs updating, and what should be removed.",
        exampleInput:
          "Website: SaaS marketing blog. ~150 posts over 4 years. Types: Blog posts and guides. Goal: SEO traffic. Issues: 40% of posts get zero traffic, some topics covered 3+ times, oldest posts have outdated screenshots and statistics.",
        exampleOutput:
          "Audit framework: Score each post 1-5 on Traffic Performance, Keyword Relevance, Content Quality, and Business Alignment. Posts scoring 4-5: Keep (est. 20%). Posts scoring 3: Update — prioritize those ranking positions 4-20 (est. 30%). Posts scoring 1-2 with similar topics: Merge — example: 'Email Marketing Tips 2022,' 'Email Marketing Guide,' and '10 Email Hacks' should be consolidated into one authoritative guide (est. 25%). Posts scoring 1 with no backlinks and zero traffic: Delete (est. 25%)...",
        targetKeywords: [
          "content audit prompt",
          "AI content audit tool",
          "content optimization template",
        ],
        relatedTemplates: ["content-pillar-strategy-builder", "editorial-calendar-builder"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "newsletter-to-blog-expander",
        title: "Newsletter-to-Blog Expander",
        description:
          "Expand a newsletter edition into a full-length blog post optimized for search and long-form reading.",
        prompt:
          "You are a content strategist specializing in content repurposing and SEO. Expand my newsletter into a full blog post.\n\nNewsletter content:\n- Newsletter name: [NEWSLETTER NAME]\n- Edition topic: [TOPIC]\n- Newsletter text: [PASTE THE FULL NEWSLETTER CONTENT]\n- Subscriber count: [FOR CONTEXT]\n- Open rate: [IF KNOWN — indicates topic resonance]\n\nBlog post requirements:\n- Target keyword: [PRIMARY SEO KEYWORD]\n- Target word count: [1500 / 2000 / 3000 WORDS]\n- Blog brand voice: [MAY DIFFER FROM NEWSLETTER VOICE]\n- Target audience: [WHO READS YOUR BLOG — may be broader than newsletter subscribers]\n- CTA: [WHAT ACTION SHOULD BLOG READERS TAKE]\n\nCreate the expanded blog post:\n\n1. **SEO-optimized title**: 3 options (include keyword, under 60 characters)\n2. **Meta description**: 155 characters, compelling, includes keyword\n3. **Introduction** (expand the newsletter hook):\n   - Hook the reader (stat, question, or story)\n   - Establish the problem or opportunity\n   - Promise what they'll learn\n   - Include the target keyword naturally in the first 100 words\n\n4. **Expanded body**: For each point in the newsletter:\n   - Add depth: Examples, case studies, data points, expert quotes (suggest placeholders)\n   - Add context: Background information the newsletter assumed readers knew\n   - Add structure: Clear H2 and H3 headings for scannability\n   - Add visuals: Suggest where to add images, charts, or embedded media\n   - Add internal/external link opportunities\n\n5. **New sections to add** (content the newsletter didn't cover due to length):\n   - Additional subtopics that strengthen the article's comprehensiveness\n   - FAQ section for featured snippet opportunities\n   - Practical examples or templates\n\n6. **Conclusion**: Summarize key points and include CTA\n\n7. **Newsletter cross-promotion**: A callout box encouraging blog readers to subscribe to the newsletter for more insights like this\n\n8. **Distribution plan**: Where to share the blog post and how to reference the newsletter edition\n\nPreserve the newsletter's personality and insights while adding the depth, structure, and SEO elements needed for search performance.",
        category: "content-strategy",
        tags: ["content repurposing", "newsletter", "blog expansion"],
        useCase:
          "Use when a newsletter edition resonated with subscribers and deserves to reach a wider audience through organic search.",
        exampleInput:
          "Newsletter: The Product Pulse. Topic: Why most product roadmaps fail. Content: 400-word piece about roadmap antipatterns (output-focused roadmaps, HiPPO-driven priorities, no customer input). Open rate: 52% (much higher than average 38%). Target keyword: 'product roadmap best practices.' Word count: 2000.",
        exampleOutput:
          "Title option 1: 'Why Most Product Roadmaps Fail (And How to Fix Yours).' Intro expansion: The newsletter opened with 'Your roadmap is probably a list of features disguised as a strategy.' Blog version: 'According to ProductPlan's 2025 survey, 56% of product managers say their roadmap is not aligned with company strategy. If your roadmap reads like a feature wish list rather than a strategic document, you're in the majority — and that's the problem...' New section to add: 'H2: Outcome-Based Roadmap Template' — a practical, downloadable framework...",
        targetKeywords: [
          "newsletter to blog prompt",
          "content expansion template",
          "AI repurposing tool",
        ],
        relatedTemplates: ["blog-to-thread-converter", "content-brief-generator"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "webinar-outline-creator",
        title: "Webinar Outline Creator",
        description:
          "Plan a complete webinar with structure, slides, engagement points, and follow-up strategy.",
        prompt:
          "You are a webinar strategist who creates high-attendance, high-engagement live events. Plan a complete webinar.\n\nWebinar details:\n- Topic: [WEBINAR TOPIC]\n- Format: [SOLO PRESENTATION / INTERVIEW / PANEL / WORKSHOP / DEMO]\n- Duration: [30 / 45 / 60 MINUTES]\n- Target audience: [WHO SHOULD ATTEND]\n- Audience size expectation: [SMALL <50 / MEDIUM 50-200 / LARGE 200+]\n- Business goal: [GENERATE LEADS / NURTURE PIPELINE / LAUNCH PRODUCT / EDUCATE CUSTOMERS]\n- Presenters: [WHO IS PRESENTING AND THEIR EXPERTISE]\n- Product/service tie-in: [HOW THIS CONNECTS TO WHAT YOU SELL — can be subtle]\n- Platform: [ZOOM / WEBEX / ON24 / YOUTUBE LIVE / OTHER]\n\nCreate a complete webinar plan:\n\n1. **Webinar title and description**:\n   - 3 title options (benefit-driven, not feature-driven)\n   - Registration page description (150 words, emphasizes what they'll learn)\n   - 3 bullet points of key takeaways\n\n2. **Promotion plan**:\n   - Email invitation (subject line + body for 2-week, 1-week, and day-of sends)\n   - Social media posts (LinkedIn + Twitter) for promotion\n   - Registration page optimization tips\n\n3. **Slide-by-slide outline**: For each slide:\n   - Slide number and title\n   - Key talking points (what to say, not just what's on the slide)\n   - Visual suggestion (chart, screenshot, quote, diagram)\n   - Time allocation\n\n4. **Engagement touchpoints** (every 5-7 minutes):\n   - Poll questions (3-4 throughout)\n   - Chat prompts ('Type X in the chat if you've experienced this')\n   - Q&A break points\n   - Interactive exercises (if workshop format)\n\n5. **Q&A preparation**: 10 likely questions with prepared answers\n\n6. **CTA and transition to offer** (last 5 minutes):\n   - How to naturally transition from educational content to your product/service\n   - Special webinar-only offer (if applicable)\n   - Next steps for attendees\n\n7. **Post-webinar follow-up**:\n   - Thank-you email (for attendees) with recording link and resources\n   - Missed-it email (for no-shows) with recording link\n   - Sales follow-up sequence for qualified leads\n   - Repurposing plan: How to turn the webinar into 5+ content pieces",
        category: "content-strategy",
        tags: ["webinar", "live event", "lead generation"],
        useCase:
          "Use when planning a webinar to ensure it's engaging, well-structured, and drives business results beyond the live event.",
        exampleInput:
          "Topic: How to use AI to 10x your content output without sacrificing quality. Format: Solo presentation with live demo. Duration: 45 minutes. Audience: Marketing managers at B2B companies. Goal: Generate leads for our AI content tool. Presenter: VP of Marketing with 12 years experience. Platform: Zoom.",
        exampleOutput:
          "Title option 1: 'The AI Content Multiplier: How B2B Teams Produce 10x More Content Without Hiring.' Registration description: 'In this live workshop, you'll see exactly how B2B marketing teams are using AI to go from 4 blog posts per month to 40+ content pieces — without burning out or sounding like a robot.' Slide 1 (1 min): 'The Content Volume Problem' — show stat: 70% of B2B marketers say they can't produce enough content. Engagement: Poll — 'How many content pieces does your team produce per month?'...",
        targetKeywords: [
          "webinar outline prompt",
          "AI webinar planner",
          "webinar planning template",
        ],
        relatedTemplates: ["podcast-episode-planner", "video-script-writer"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "case-study-transformer",
        title: "Case Study Transformer",
        description:
          "Transform raw project results into a compelling case study with storytelling, data, and social proof.",
        prompt:
          "You are a content strategist specializing in B2B case studies and customer stories. Transform my project results into a compelling case study.\n\nProject details:\n- Client/customer: [CLIENT NAME — or anonymized description if confidential]\n- Industry: [CLIENT'S INDUSTRY]\n- Challenge: [WHAT PROBLEM THEY FACED BEFORE WORKING WITH YOU]\n- Solution: [WHAT YOU DID / WHAT PRODUCT THEY USED]\n- Results: [QUANTIFIED OUTCOMES — revenue increase, time saved, cost reduction, etc.]\n- Timeline: [HOW LONG FROM START TO RESULTS]\n- Quote from client: [ANY DIRECT QUOTES OR PARAPHRASE]\n- Your company: [YOUR COMPANY NAME AND WHAT YOU SELL]\n\nCreate the case study in multiple formats:\n\n1. **Full case study** (800-1200 words) following the Problem-Solution-Results framework:\n   - **Hero section**: Client name/industry, headline result (the biggest number), and a pull quote\n   - **Challenge** (200-300 words): Tell the story of their pain. Make it relatable to your target buyers. Include specific details that build credibility.\n   - **Solution** (200-300 words): What you did, step by step. Be specific about the process without being salesy. Focus on the 'how' that differentiates you.\n   - **Results** (200-300 words): Lead with the headline metric. Include 3-5 quantified results. Show before/after comparison. Include the client quote here for maximum impact.\n   - **Key takeaways** (3 bullets): What other companies can learn from this\n\n2. **One-page summary**: Condensed version for sales handouts or PDFs (under 400 words)\n\n3. **Sales email snippet**: A 3-sentence version a salesperson can paste into a prospecting email\n\n4. **Social media version**: LinkedIn post format with the key story arc (under 300 words)\n\n5. **Website testimonial**: A formatted quote block with attribution\n\n6. **SEO metadata**: Title, meta description, and suggested URL slug\n\nStorytelling rules:\n- Start with the customer, not your product\n- Use specific numbers, not vague improvements\n- Show the human impact, not just business metrics\n- Let the client be the hero of the story (your product is the tool, they're the protagonist)\n- Include enough detail that prospects can see themselves in the story",
        category: "content-strategy",
        tags: ["case study", "customer story", "social proof"],
        useCase:
          "Use when you have client results to share and need to transform raw data into a persuasive story across multiple marketing formats.",
        exampleInput:
          "Client: Meridian Financial (mid-size accounting firm, 80 employees). Challenge: Tax season overwhelmed staff, 60-hour weeks, 15% error rate. Solution: Implemented our AI document processing tool. Results: 40% reduction in processing time, error rate dropped to 3%, staff worked 45-hour weeks during tax season. Timeline: 3 months. Quote: 'For the first time in 20 years, my team didn't dread tax season.'",
        exampleOutput:
          "Full case study headline: 'How Meridian Financial Cut Processing Time 40% and Gave Their Team Tax Seasons Without the Burnout.' Challenge: For two decades, tax season at Meridian Financial meant the same thing: 60-hour weeks, exhausted staff, and a 15% error rate that kept climbing as client volume grew. 'We were throwing bodies at the problem,' says [name], managing partner. 'Every year we'd hire temps, and every year the error rate got worse.'...",
        targetKeywords: [
          "case study template prompt",
          "AI case study writer",
          "customer success story",
        ],
        relatedTemplates: ["content-brief-generator", "newsletter-to-blog-expander"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "content-brief-generator",
        title: "Content Brief Generator",
        description:
          "Generate detailed content briefs for writers with SEO targets, structure, and competitive analysis.",
        prompt:
          "You are a content strategist creating a brief for a writer. Generate a comprehensive content brief for an article.\n\nArticle context:\n- Target keyword: [PRIMARY KEYWORD]\n- Secondary keywords: [3-5 SECONDARY KEYWORDS]\n- Content type: [BLOG POST / GUIDE / LISTICLE / HOW-TO / COMPARISON / OPINION PIECE]\n- Target audience: [WHO THIS IS FOR]\n- Funnel stage: [AWARENESS / CONSIDERATION / DECISION]\n- Business goal: [WHAT THIS ARTICLE SHOULD ACHIEVE — traffic, leads, authority]\n- Competing articles: [LIST 2-3 TOP-RANKING URLs FOR THIS KEYWORD, if known]\n\nGenerate a complete content brief:\n\n1. **Article overview**:\n   - Working title (3 options, keyword-included)\n   - Target word count (based on competitive analysis)\n   - Target publish date\n   - Content format and structure recommendation\n\n2. **SEO requirements**:\n   - Primary keyword placement: title, H1, first 100 words, naturally throughout\n   - Secondary keyword targets with placement suggestions\n   - Meta title and meta description drafts\n   - Internal linking targets (3-5 pages to link to)\n   - External linking guidelines (what to link to, what to avoid)\n\n3. **Detailed outline**: Full H2/H3 structure with:\n   - Section heading\n   - Key points to cover in each section (3-5 bullets)\n   - Questions to answer in each section\n   - Data or examples to include (specific, not generic)\n   - Approximate word count per section\n\n4. **Competitive differentiation**: How to make this article better than what currently ranks:\n   - What the top 3 results cover well\n   - What they're missing (the gap to exploit)\n   - Unique angle or added value for our version\n   - Freshness advantage (new data, new perspectives)\n\n5. **Content requirements**:\n   - Tone and voice guidelines\n   - Formatting requirements (headers, bullets, images, etc.)\n   - Visual assets needed (charts, screenshots, infographics)\n   - CTA placement and copy\n   - Schema markup type (FAQ, HowTo, Article)\n\n6. **Writer checklist**: A final quality-check list before submission:\n   - [ ] Keyword included in title and first paragraph\n   - [ ] All sections of the outline covered\n   - [ ] At least X internal links and Y external links\n   - [ ] Meta title under 60 chars, meta description under 155\n   - [ ] CTA included\n   - [ ] Passes readability check (target grade level)",
        category: "content-strategy",
        tags: ["content brief", "SEO brief", "writer guidelines"],
        useCase:
          "Use when assigning an article to a writer (or writing it yourself) to ensure the final piece meets SEO, quality, and business requirements.",
        exampleInput:
          "Keyword: 'how to negotiate salary.' Secondary: 'salary negotiation tips, negotiate job offer, counter offer email.' Type: How-to guide. Audience: Job seekers who received an offer. Stage: Consideration. Goal: Drive traffic and email signups for our career newsletter. Competing: Indeed, Harvard Business Review, The Muse articles.",
        exampleOutput:
          "Title option 1: 'How to Negotiate Salary: A Step-by-Step Guide (With Scripts).' Word count: 2,500 (top results average 2,200 — we'll go deeper). Competitive gap: None of the top 3 include actual negotiation scripts/templates. Our advantage: Include 5 copy-paste email templates. Outline: H2: 'When to Start the Salary Negotiation' — cover timing (after offer, not during interview), key points: why 73% of employers expect negotiation (cite Glassdoor), signals that there's room to negotiate...",
        targetKeywords: [
          "content brief prompt",
          "AI content brief generator",
          "SEO brief template",
        ],
        relatedTemplates: ["content-pillar-strategy-builder", "editorial-calendar-builder"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "editorial-calendar-builder",
        title: "Editorial Calendar Builder",
        description:
          "Build a structured editorial calendar with themes, content types, and publishing schedule across channels.",
        prompt:
          "You are a content operations manager. Build a comprehensive editorial calendar for [BRAND/COMPANY].\n\nContent program details:\n- Company: [COMPANY NAME AND WHAT YOU DO]\n- Channels: [LIST ALL CHANNELS — blog, newsletter, YouTube, podcast, social, etc.]\n- Publishing frequency per channel: [e.g., Blog 2x/week, Newsletter weekly, YouTube 1x/week]\n- Content team size: [NUMBER OF WRITERS, DESIGNERS, VIDEOGRAPHERS]\n- Target audience: [PRIMARY AUDIENCE]\n- Business priorities for the period: [KEY LAUNCHES, CAMPAIGNS, OR THEMES]\n- Content pillars: [YOUR ESTABLISHED CONTENT THEMES — or ask me to define them]\n- Planning period: [MONTHLY / QUARTERLY / ANNUAL]\n\nBuild an editorial calendar:\n\n1. **Monthly themes**: For each month in the period:\n   - Theme name and rationale (tied to seasonal relevance, business priority, or audience need)\n   - How the theme connects to your content pillars\n\n2. **Content plan table** (for each week):\n   - Week of [DATE]\n   - Channel | Content type | Title/topic | Content pillar | Funnel stage | Primary keyword | Owner | Status\n   - Include 1-2 content pieces per channel per week (based on frequency)\n\n3. **Content mix analysis**: Ensure the calendar includes:\n   - 60% educational / 20% inspirational / 20% promotional (adjust ratios as needed)\n   - Balanced funnel coverage: Awareness / Consideration / Decision\n   - Variety of formats: long-form, short-form, visual, interactive, video\n   - Even distribution across content pillars\n\n4. **Cross-channel coordination**: Show how content works together:\n   - Blog post published Tuesday → Newsletter feature Thursday → Social snippets throughout week\n   - Webinar Wednesday → Blog recap Friday → YouTube recording Monday\n\n5. **Key dates and hooks**: Relevant holidays, industry events, awareness months, product launches, and seasonal trends to build content around\n\n6. **Workflow and deadlines**: For each content piece, work backward from publish date:\n   - Brief due: [DATE]\n   - First draft: [DATE]\n   - Review/edit: [DATE]\n   - Design/visuals: [DATE]\n   - Final approval: [DATE]\n   - Publish: [DATE]\n\n7. **Buffer and flexibility**: 10-15% of calendar slots marked as 'reactive' for timely topics, trending news, or repurposing high-performers\n\n8. **Monthly review template**: Questions to ask at month-end to evaluate and adjust the next month's calendar",
        category: "content-strategy",
        tags: ["editorial calendar", "content planning", "publishing schedule"],
        useCase:
          "Use when planning your content program to ensure consistent, strategic publishing across all channels.",
        exampleInput:
          "Company: DesignStack (UI component library). Channels: Blog, Newsletter, Twitter, YouTube. Frequency: Blog 2x/week, Newsletter weekly, Twitter daily, YouTube 1x/week. Team: 2 writers, 1 designer, 1 video editor. Audience: Frontend developers. Priorities: Launch version 3.0 in month 2, annual conference in month 3. Pillars: React tutorials, Design system best practices, Performance optimization. Period: Quarterly (Q2).",
        exampleOutput:
          "April theme: 'Spring Cleaning Your Codebase' — ties to design system best practices pillar and sets up v3.0 launch. Week of April 7: Blog (Mon) — 'How to Audit Your Component Library for Dead Code' (Awareness, Pillar: Design systems, KW: component audit). Blog (Thu) — 'React 19 Performance Patterns You Should Adopt Now' (Awareness, Pillar: Performance). Newsletter (Wed) — Weekly roundup featuring both posts + curated React resources. YouTube (Fri) — Tutorial: 'Live Component Library Audit in 30 Minutes'...",
        targetKeywords: [
          "editorial calendar prompt",
          "AI content calendar builder",
          "content planning template",
        ],
        relatedTemplates: ["content-pillar-strategy-builder", "content-brief-generator"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
    ],
  },

  // ── Customer Success ─────────────────────────────────────────────────────
  {
    slug: "customer-success",
    title: "Customer Success Prompts",
    description:
      "AI prompt templates for customer onboarding, QBRs, churn prevention, health scoring, and renewal conversations. Works with ChatGPT, Claude, and Gemini.",
    longDescription:
      "Drive retention and expansion with tested prompt templates for onboarding new customers, preparing quarterly business reviews, identifying churn risks, and writing knowledge base articles. Each template is designed for real customer success workflows — from day-one welcome sequences through renewal negotiations. Paste them into any AI assistant and customize the bracketed placeholders to match your customer base and product.",
    icon: "⭐",
    keywords: [
      "customer success prompts",
      "ChatGPT for customer success",
      "onboarding prompts",
      "retention prompts",
    ],
    relatedCategories: ["customer-support", "sales", "email"],
    templates: [
      {
        slug: "customer-onboarding-welcome-sequence",
        title: "Customer Onboarding Welcome Sequence",
        description:
          "Create a multi-touch onboarding email sequence that guides new customers from signup to first value.",
        prompt:
          "You are a customer success strategist specializing in SaaS onboarding. Create a welcome and onboarding email sequence for [PRODUCT NAME].\n\nProduct context:\n- Product: [PRODUCT NAME AND WHAT IT DOES]\n- Plan they signed up for: [FREE / STARTER / PRO / ENTERPRISE]\n- Time to first value: [HOW LONG UNTIL THEY EXPERIENCE THE 'AHA' MOMENT]\n- Key activation milestones: [LIST 3-5 ACTIONS THAT INDICATE SUCCESSFUL ONBOARDING, e.g., 'connected data source,' 'invited team member,' 'ran first report']\n- Common onboarding drop-off points: [WHERE NEW USERS GET STUCK]\n- Brand voice: [TONE — friendly, professional, playful, minimal]\n- Support channels: [HELP CENTER / CHAT / EMAIL / PHONE]\n\nCreate a 7-email onboarding sequence:\n\n**Email 1: Welcome (sent immediately)**\n- Subject line (3 options)\n- Body: Warm welcome, confirm what they signed up for, single most important first action (just ONE — don't overwhelm), set expectations for what emails are coming\n- CTA: The one action that gets them to first value fastest\n\n**Email 2: Quick win (sent day 1)**\n- Subject line (3 options)\n- Body: Help them achieve first milestone. Provide a step-by-step walkthrough (3-5 steps max). Include a screenshot or video placeholder.\n- CTA: Complete the milestone action\n\n**Email 3: Second milestone (sent day 3)**\n- Subject line (3 options)\n- Body: Guide them to the second activation milestone. Address the #1 confusion point at this stage.\n- CTA: Complete milestone 2\n\n**Email 4: Social proof (sent day 5)**\n- Subject line (3 options)\n- Body: Share how other customers use the product. Include a mini case study or user quote. Suggest an advanced feature they might not have discovered.\n- CTA: Explore the advanced feature\n\n**Email 5: Team collaboration (sent day 7)**\n- Subject line (3 options)\n- Body: Encourage them to invite team members. Explain the collaboration benefits. Make it easy (share link, pre-written invite message).\n- CTA: Invite teammates\n\n**Email 6: Check-in (sent day 10)**\n- Subject line (3 options)\n- Body: Personal-feeling check-in from a CSM or founder. Ask if they're stuck. Offer a 15-minute onboarding call. Link to top help center articles.\n- CTA: Book a call or reply with questions\n\n**Email 7: Value recap (sent day 14)**\n- Subject line (3 options)\n- Body: Summarize what they've accomplished so far (use dynamic data if possible). Highlight value delivered. Introduce the next phase of their journey (power user features, upgrade path).\n- CTA: Explore next-level features\n\nFor each email:\n- Subject line with character count\n- Complete body copy with dynamic content placeholders [FIRST_NAME], [COMPANY], [PLAN]\n- Recommended send time\n- Behavioral trigger alternative (send based on action rather than time, where possible)\n- What to do if they haven't completed the previous milestone (conditional logic note)",
        category: "customer-success",
        tags: ["onboarding", "welcome sequence", "customer activation"],
        useCase:
          "Use when setting up or improving your new customer onboarding email sequence to drive activation and reduce early churn.",
        exampleInput:
          "Product: DataFlow (analytics dashboard tool). Plan: Pro ($49/mo). Time to value: 20 minutes (see first dashboard). Milestones: Connect data source, create first dashboard, share with team, set up automated report. Drop-off: Users struggle connecting data sources (too many connector options). Voice: Friendly, helpful, slightly nerdy.",
        exampleOutput:
          "Email 1 — Subject: 'Welcome to DataFlow — let's build your first dashboard in 20 minutes' (61 chars). Body: 'Hey [FIRST_NAME]! You just made a great call — DataFlow is about to make your team's data actually useful. Here's the ONE thing to do right now: Connect your first data source. It takes about 3 minutes. [Connect my data →] We'll send you a few short emails over the next two weeks to help you get the most out of DataFlow. No spam, just the good stuff.'...",
        targetKeywords: [
          "customer onboarding email prompt",
          "SaaS onboarding sequence",
          "AI welcome email generator",
        ],
        relatedTemplates: ["feature-adoption-guide-writer", "knowledge-base-article-writer"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "qbr-prep",
        title: "QBR Prep",
        description:
          "Prepare a structured Quarterly Business Review presentation that demonstrates value and drives expansion.",
        prompt:
          "You are a customer success manager preparing for a Quarterly Business Review. Create a complete QBR preparation plan.\n\nAccount context:\n- Customer: [CUSTOMER NAME AND INDUSTRY]\n- Account tier: [STRATEGIC / ENTERPRISE / MID-MARKET / SMB]\n- Contract value: [ARR]\n- Contract renewal date: [DATE]\n- Primary contact: [NAME AND ROLE]\n- Executive sponsor: [NAME AND ROLE]\n- Products/features used: [WHAT THEY USE]\n- Products/features NOT used: [WHAT THEY'RE PAYING FOR BUT NOT USING]\n- Usage metrics this quarter: [KEY METRICS — logins, features used, outcomes]\n- Previous quarter's goals: [WHAT THEY SAID THEY WANTED TO ACHIEVE]\n- Previous quarter's results: [WHAT ACTUALLY HAPPENED]\n- Health score: [GREEN / YELLOW / RED AND WHY]\n- Expansion opportunity: [UPSELL OR CROSS-SELL POTENTIAL]\n- Known risks: [ANY CONCERNS, CHAMPION LEAVING, COMPETITOR EVALUATION, ETC.]\n\nPrepare:\n\n1. **QBR agenda** (60-minute meeting):\n   - Time-blocked agenda with sections\n   - Who should attend from their side and yours\n   - Pre-meeting email template to send 5 days before\n\n2. **Slide-by-slide outline** (10-12 slides max):\n   - Slide 1: Agenda and meeting objectives\n   - Slide 2: Executive summary — the value delivered this quarter (lead with THEIR outcomes, not your features)\n   - Slide 3-4: Usage and adoption metrics — presented as business impact, not product usage\n   - Slide 5: Goals review — last quarter's goals vs. results (be honest about misses)\n   - Slide 6: Wins and success stories — specific achievements this quarter\n   - Slide 7: Opportunities for improvement — where they could get more value (leads to expansion naturally)\n   - Slide 8: Industry insights — 1-2 trends relevant to their business (shows you understand their world)\n   - Slide 9: Roadmap preview — upcoming features relevant to their use case\n   - Slide 10: Goals for next quarter — collaborative goal-setting\n   - Slide 11: Next steps and action items\n\n3. **Value narrative**: Write a 2-paragraph 'story of this quarter' that connects their business goals → their product usage → the outcomes achieved. This is the thread that ties the QBR together.\n\n4. **Expansion conversation script**: How to naturally introduce the upsell opportunity — what to say, when to say it, how to frame it as solving a problem they raised\n\n5. **Risk mitigation plan**: If the account has risks, how to address them proactively in the QBR\n\n6. **Post-QBR follow-up**: Summary email template with goals, action items, and next meeting date",
        category: "customer-success",
        tags: ["QBR", "business review", "account management"],
        useCase:
          "Use when preparing for a quarterly business review to ensure you demonstrate value, deepen the relationship, and create expansion opportunities.",
        exampleInput:
          "Customer: GreenLeaf Retail (online organic food retailer). Tier: Enterprise. ARR: $120K. Renewal: 6 months out. Products used: Analytics suite, email automation. Not used: Customer segmentation module (included in their plan). Usage: Email open rates up 23% this quarter, 3 new automated workflows created. Previous goal: Increase repeat purchase rate from 28% to 35%. Result: Reached 31%. Health: Yellow — champion got promoted, new contact less engaged. Expansion: Advanced personalization add-on ($40K/year).",
        exampleOutput:
          "Value narrative: 'This quarter, GreenLeaf increased repeat purchase rate from 28% to 31% by leveraging 3 new automated email workflows targeting post-purchase engagement. While we haven't yet hit the 35% target, the trajectory is strong — and the unused customer segmentation module represents the clearest path to closing that gap.' Expansion script: During the opportunities slide, ask: 'You mentioned wanting to personalize the shopping experience by customer segment. Right now, your emails go to everyone the same way — the advanced personalization add-on would let you...'",
        targetKeywords: [
          "QBR preparation prompt",
          "quarterly business review template",
          "AI customer success QBR",
        ],
        relatedTemplates: ["churn-risk-assessment", "renewal-conversation-script"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "churn-risk-assessment",
        title: "Churn Risk Assessment",
        description:
          "Assess customer churn risk with a structured framework and create a save plan for at-risk accounts.",
        prompt:
          "You are a customer success operations specialist. Conduct a churn risk assessment for [CUSTOMER NAME].\n\nAccount data:\n- Customer: [CUSTOMER NAME AND INDUSTRY]\n- Contract value: [ARR]\n- Contract renewal date: [DATE]\n- Account age: [HOW LONG THEY'VE BEEN A CUSTOMER]\n- Product usage trend: [INCREASING / STABLE / DECLINING — with specifics]\n- Support tickets: [VOLUME AND TREND — increasing complaints? unresolved issues?]\n- NPS or CSAT score: [SCORE IF KNOWN]\n- Champion status: [ACTIVE AND ENGAGED / PARTIALLY ENGAGED / LEFT THE COMPANY / UNKNOWN]\n- Recent events: [ANY RED FLAGS — reorg, budget cuts, competitor evaluation, executive change]\n- Engagement history: [ATTENDED QBRs? RESPOND TO EMAILS? USE NEW FEATURES?]\n- Payment history: [ON TIME / LATE PAYMENTS / DISPUTES]\n- Expansion history: [UPGRADED / FLAT / DOWNGRADED]\n\nConduct the assessment:\n\n1. **Risk score card**: Rate each factor 1-5 (1 = healthy, 5 = critical risk):\n   - Product adoption/usage depth\n   - Stakeholder engagement level\n   - Support experience quality\n   - Value realization (are they achieving their goals?)\n   - Relationship strength (champion health)\n   - External factors (market, budget, org changes)\n   - Competitive threat level\n   - Contract and payment health\n   - Overall risk score (weighted average) and risk tier: LOW / MEDIUM / HIGH / CRITICAL\n\n2. **Leading indicators**: Identify which specific behaviors signal this account is at risk:\n   - Usage pattern changes (what decreased, when)\n   - Engagement pattern changes (stopped attending, stopped responding)\n   - Sentiment shifts (tone of support tickets, email responses)\n\n3. **Root cause hypothesis**: What is the underlying reason this customer might churn? (Not symptoms — the real cause.)\n   - Is it product fit? Value delivery? Relationship? External factors? Budget?\n\n4. **Save plan** (if medium+ risk):\n   - Immediate actions (this week): 2-3 specific steps\n   - Short-term actions (this month): 3-4 interventions\n   - Ongoing monitoring: What to track weekly\n   - Executive escalation: When and how to involve your leadership\n   - Concessions to consider: What you could offer (training, discounts, feature access) and in what order\n\n5. **Conversation script**: How to have the 'are we at risk?' conversation with the customer honestly and constructively\n\n6. **Success criteria**: How you'll know the save plan is working (leading indicators to track over the next 30/60/90 days)",
        category: "customer-success",
        tags: ["churn prevention", "risk assessment", "customer retention"],
        useCase:
          "Use when you notice warning signs in a customer account and need a structured approach to assess risk and create a save plan.",
        exampleInput:
          "Customer: TechStack Solutions (software agency, 50 employees). ARR: $36K. Renewal: 4 months. Age: 2 years. Usage: Login frequency dropped 40% over last 2 months. Support: 3 unresolved tickets (longest open 18 days). NPS: Last score was 6 (down from 8). Champion: Their project lead left 6 weeks ago, replacement hasn't had an onboarding call. Events: They posted a job listing for 'Competitor Product Administrator.' Payment: On time.",
        exampleOutput:
          "Risk scorecard: Product adoption 4/5 (40% usage decline is severe), Stakeholder engagement 5/5 (champion departed, no replacement engaged), Support experience 4/5 (3 unresolved tickets is unacceptable), Value realization 3/5 (unknown without champion), Relationship strength 5/5 (critical — no active champion), External factors 4/5 (competitor job posting is a near-certain evaluation signal). Overall: 4.2/5 — CRITICAL risk. Root cause: Champion departure created a relationship vacuum, and unresolved tickets during this vulnerable period pushed them to evaluate alternatives. Save plan — Immediate (this week): (1) Resolve all 3 support tickets within 48 hours with personal follow-up...",
        targetKeywords: [
          "churn risk assessment prompt",
          "customer retention template",
          "AI churn prevention tool",
        ],
        relatedTemplates: ["qbr-prep", "renewal-conversation-script"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "customer-health-score-narrator",
        title: "Customer Health Score Narrator",
        description:
          "Transform raw customer health metrics into a clear narrative with recommended actions for the CS team.",
        prompt:
          "You are a customer success analyst. Transform raw health score data into an actionable narrative for the CS team.\n\nHealth score data:\n- Customer: [CUSTOMER NAME]\n- Account tier: [STRATEGIC / ENTERPRISE / MID-MARKET / SMB]\n- ARR: [ANNUAL REVENUE]\n- Overall health score: [SCORE, e.g., 72/100]\n- Score trend: [IMPROVING / STABLE / DECLINING] over [PERIOD]\n\nComponent scores:\n- Product adoption: [SCORE AND KEY METRICS — DAUs, feature breadth, depth of use]\n- Engagement: [SCORE AND KEY METRICS — email opens, meeting attendance, support interactions]\n- Outcomes/ROI: [SCORE AND KEY METRICS — are they achieving stated goals?]\n- Relationship: [SCORE AND KEY METRICS — champion health, executive sponsor access]\n- Support experience: [SCORE AND KEY METRICS — ticket volume, resolution time, CSAT]\n- Financial: [SCORE AND KEY METRICS — payment timeliness, expansion history, contract terms]\n\nGenerate:\n\n1. **Health summary narrative** (3-4 sentences): A plain-language summary of this account's health written for a CSM. Not 'score is 72' but 'This account is generally healthy but showing early signs of disengagement that need attention before the pattern deepens.'\n\n2. **Component analysis**: For each health component:\n   - Current state (1-2 sentences — what the data says)\n   - Trend interpretation (what the trajectory means)\n   - Risk flag or positive signal\n   - Specific action recommendation\n\n3. **Top 3 priorities**: The most impactful actions the CSM should take right now, ordered by urgency:\n   - Priority 1: [ACTION] — Why: [RATIONALE] — When: [TIMELINE]\n   - Priority 2: [ACTION] — Why: [RATIONALE] — When: [TIMELINE]\n   - Priority 3: [ACTION] — Why: [RATIONALE] — When: [TIMELINE]\n\n4. **Talking points for next customer interaction**: 3-4 bullet points the CSM can use in their next call or email to address the health signals\n\n5. **Forecasting note**: Based on current trajectory, what's likely to happen in 30/60/90 days if nothing changes\n\n6. **Comparison context**: How does this account compare to similar accounts in the same tier? (Provide a framework for the CSM to answer this)\n\nWrite in a concise, action-oriented style. Every insight should connect to a specific action. Health scores are meaningless without interpretation and recommendations.",
        category: "customer-success",
        tags: ["health score", "customer analytics", "account health"],
        useCase:
          "Use when reviewing customer health scores to transform raw data into actionable narratives that CSMs can act on immediately.",
        exampleInput:
          "Customer: Apex Manufacturing. Tier: Enterprise. ARR: $85K. Overall: 64/100 (declining from 78 three months ago). Adoption: 55/100 (only using 3 of 8 modules). Engagement: 45/100 (missed last 2 scheduled meetings, email response rate dropped to 20%). Outcomes: 70/100 (achieving primary use case but haven't expanded). Relationship: 50/100 (primary contact responsive but no executive sponsor). Support: 80/100 (low ticket volume, fast resolution). Financial: 85/100 (always pays on time, no expansion in 18 months).",
        exampleOutput:
          "Health summary: Apex Manufacturing is quietly disengaging. While their core use case still works (outcomes score 70) and they pay reliably, the 14-point health decline over 3 months — driven by plummeting engagement (45) and shallow adoption (55) — suggests they're settling into 'utility mode' rather than growing with the product. Without intervention, this trajectory leads to a flat renewal or downsell. Priority 1: Re-engage the primary contact with a value-driven outreach (not a generic check-in) this week — propose a 30-minute session showing how Module 4 specifically addresses their Q2 production targets...",
        targetKeywords: [
          "customer health score prompt",
          "AI health score analyst",
          "CS health narrative template",
        ],
        relatedTemplates: ["churn-risk-assessment", "qbr-prep"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "feature-adoption-guide-writer",
        title: "Feature Adoption Guide Writer",
        description:
          "Create a feature adoption guide that drives usage of underutilized features and demonstrates value.",
        prompt:
          "You are a customer education specialist. Create a feature adoption guide for [FEATURE NAME] in [PRODUCT NAME].\n\nFeature context:\n- Feature: [FEATURE NAME AND WHAT IT DOES]\n- Product: [PRODUCT NAME]\n- Adoption rate: [CURRENT % OF CUSTOMERS USING THIS FEATURE]\n- Target audience: [WHICH CUSTOMER SEGMENT SHOULD USE THIS]\n- Value proposition: [WHAT BUSINESS OUTCOME THIS FEATURE ENABLES]\n- Common reasons for non-adoption: [WHY CUSTOMERS DON'T USE IT — don't know it exists, too complex, unclear value]\n- Prerequisites: [WHAT CUSTOMERS NEED TO HAVE SET UP FIRST]\n- Complexity: [SIMPLE / MODERATE / COMPLEX]\n\nCreate a feature adoption guide:\n\n1. **Feature value story** (2-3 paragraphs): Start with the customer problem, then introduce the feature as the solution. Include a specific example: 'A customer like you used [feature] to [achieve specific outcome].'\n\n2. **Quick-start guide** (3-5 steps): The minimum steps to get the feature working:\n   - Step 1: [ACTION] — with screenshot/video placeholder\n   - Step 2: [ACTION] — with expected result\n   - Keep it under 5 minutes to first result\n\n3. **Use cases** (3-4 scenarios): Real-world applications tailored to different customer types:\n   - Use case title\n   - Customer type it applies to\n   - Step-by-step workflow\n   - Expected outcome with metrics\n\n4. **Best practices** (5-7 tips): Power user tips that maximize the feature's value:\n   - What separates basic usage from advanced usage\n   - Configuration recommendations\n   - Common mistakes to avoid\n\n5. **FAQ** (5-6 questions): Address the barriers to adoption:\n   - Technical setup questions\n   - 'Is this worth the time to set up?' value questions\n   - Data and privacy questions\n   - Comparison to doing it manually\n\n6. **Success metrics**: How customers can measure whether the feature is delivering value:\n   - What to track\n   - What 'good' looks like\n   - When to expect results\n\n7. **Multi-format content package**:\n   - Email announcement for existing customers (subject + body)\n   - In-app tooltip copy (under 30 words)\n   - Help center article outline\n   - 60-second video script for a feature walkthrough\n   - Social media post announcing the feature guide",
        category: "customer-success",
        tags: ["feature adoption", "customer education", "product usage"],
        useCase:
          "Use when a feature has low adoption and you need to drive usage through education and demonstrated value.",
        exampleInput:
          "Feature: Automated Report Scheduler. Product: InsightHub Analytics. Adoption: 18% of pro customers. Target: All Pro and Enterprise customers. Value: Save 2 hours/week on manual report generation and distribution. Non-adoption reasons: Most don't know it exists (buried in settings), unclear how to configure. Prerequisites: At least one saved report. Complexity: Moderate.",
        exampleOutput:
          "Value story: 'Every Monday morning, marketing teams at 200+ companies open InsightHub and manually export the same 5 reports. They format them in a spreadsheet, write an email, and send it to their stakeholders. That's 2 hours of repetitive work that could be automated in 3 minutes. The Automated Report Scheduler does exactly this — and 82% of customers who set it up say they wish they'd done it sooner.' Quick-start: Step 1: Open any saved report and click the clock icon in the top-right corner. Step 2: Choose frequency (daily, weekly, monthly) and delivery time...",
        targetKeywords: [
          "feature adoption guide prompt",
          "AI feature adoption template",
          "customer education content",
        ],
        relatedTemplates: ["customer-onboarding-welcome-sequence", "knowledge-base-article-writer"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "renewal-conversation-script",
        title: "Renewal Conversation Script",
        description:
          "Prepare a renewal conversation script with value recap, objection handling, and expansion positioning.",
        prompt:
          "You are a customer success manager preparing for a renewal conversation. Create a complete conversation script.\n\nAccount context:\n- Customer: [CUSTOMER NAME]\n- Current plan: [PLAN AND PRICE]\n- Contract end date: [DATE]\n- Account health: [GREEN / YELLOW / RED]\n- Value delivered: [SPECIFIC OUTCOMES AND METRICS FROM THEIR TIME AS A CUSTOMER]\n- Usage highlights: [NOTABLE USAGE STATS]\n- Relationship quality: [STRONG / GOOD / WEAK]\n- Expansion opportunity: [IS THERE AN UPSELL OR CROSS-SELL OPPORTUNITY?]\n- Likely renewal objections: [WHAT CONCERNS MIGHT THEY RAISE — price, ROI, competitor, budget]\n- Price change: [IS THE PRICE STAYING THE SAME / INCREASING? BY HOW MUCH?]\n- Competitive threat: [ARE THEY EVALUATING ALTERNATIVES?]\n\nCreate a renewal conversation script:\n\n1. **Pre-call preparation** (5 things to do before the call):\n   - Data to pull and review\n   - Internal stakeholders to brief\n   - Customer decision-making process to understand\n   - Timeline and urgency factors\n   - Walk-away position (if applicable)\n\n2. **Conversation flow**:\n\n   **Opening** (2-3 minutes): Build rapport, set the agenda, frame the conversation as a partnership discussion (not a sales pitch)\n   - Exact opening script\n   - How to transition to the business discussion\n\n   **Value recap** (5-7 minutes): Remind them of what they've achieved\n   - Use THEIR language and goals (from QBRs or kickoff)\n   - Present 3-4 specific value data points\n   - Ask: 'Does this align with what your team is experiencing?'\n   - Script for each data point\n\n   **Forward-looking value** (3-5 minutes): Connect renewal to their future goals\n   - Ask about their priorities for the next year\n   - Show how your product roadmap aligns with their goals\n   - Introduce expansion opportunity naturally (only if appropriate)\n\n   **Renewal terms discussion** (5 minutes):\n   - How to present the renewal terms\n   - If price increase: How to frame it with value context\n   - Multi-year discount positioning (if available)\n   - Script for presenting options\n\n   **Objection handling** (as needed): For each likely objection:\n   - What they'll say\n   - Acknowledgment (validate their concern)\n   - Response (address with data and logic)\n   - Redirect (move toward resolution)\n\n   **Close** (2-3 minutes): Summarize agreement, confirm next steps, timeline for signature\n\n3. **Post-call**: Follow-up email template summarizing the conversation and next steps\n\n4. **Escalation playbook**: If the conversation goes south — when to involve your manager, what concessions are available, and how to buy time if they need to think about it",
        category: "customer-success",
        tags: ["renewal", "retention", "account management"],
        useCase:
          "Use when preparing for a contract renewal conversation to ensure you lead with value and handle objections confidently.",
        exampleInput:
          "Customer: BrightPath Education (edtech, 200 employees). Plan: Enterprise at $48K/year. Renewal: 60 days out. Health: Yellow (good usage but stakeholder turnover). Value: Reduced student attrition 18%, saved 15 admin hours/week. Usage: 92% seat utilization. Relationship: Good with ops team, weak with new VP. Expansion: Advanced analytics module ($15K/year). Objections: New VP wants to evaluate competitors; may push back on 5% price increase. Competitive threat: Mentioned a demo with CompetitorX.",
        exampleOutput:
          "Pre-call: Pull comparison data showing BrightPath's outcomes vs. similar edtech institutions on our platform. Brief your VP of CS to be available for an executive-to-executive follow-up with their new VP. Opening: 'Thanks for making time today. I wanted to step back and look at what we've accomplished together this year before we talk about what's next. My goal for this conversation is to make sure our partnership continues to deliver for BrightPath.' Value recap: 'When we kicked off together, your #1 goal was reducing student attrition. Over the past year, that number moved from [X] to [Y] — an 18% improvement that directly impacts your retention revenue...'",
        targetKeywords: [
          "renewal conversation script prompt",
          "customer retention template",
          "AI renewal script",
        ],
        relatedTemplates: ["qbr-prep", "churn-risk-assessment"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "nps-follow-up-drafter",
        title: "NPS Follow-Up Drafter",
        description:
          "Draft personalized follow-up messages for NPS survey respondents across all score ranges.",
        prompt:
          "You are a customer success manager. Draft follow-up messages for NPS survey respondents for [PRODUCT NAME].\n\nContext:\n- Product: [PRODUCT NAME]\n- Survey context: [e.g., post-onboarding, quarterly check-in, post-support interaction]\n- Brand voice: [TONE]\n- Follow-up channel: [EMAIL / IN-APP / PHONE SCRIPT]\n\nCreate follow-up templates for each NPS segment:\n\n**Promoters (9-10):**\n1. **Thank-you message**: Genuine, not generic. Reference that they gave a high score. Express what their feedback means.\n2. **Advocacy ask** (choose the most appropriate):\n   - Request a G2/Capterra review (with direct link)\n   - Request a testimonial quote\n   - Invite to a case study interview\n   - Invite to a referral program\n   - Invite to a customer advisory board or beta program\n3. **Conversation deepener**: Ask what specifically makes them a promoter (captures qualitative data)\n\n**Passives (7-8):**\n1. **Acknowledgment message**: Thank them and acknowledge that 'good' isn't 'great'\n2. **Gap discovery question**: A specific, open-ended question to understand what would move them from 7-8 to 9-10\n3. **Proactive value add**: Offer something specific — a feature walkthrough, a best practices session, or a resource they haven't seen\n4. **Follow-up cadence**: When to check back in\n\n**Detractors (0-6):**\n1. **Empathetic acknowledgment**: Take their score seriously without being defensive\n2. **Personal outreach offer**: Offer a direct conversation (not a survey, not a chatbot)\n3. **Immediate action**: If they left a comment, address the specific issue\n4. **Recovery script**: For the live conversation — how to:\n   - Listen and validate\n   - Ask clarifying questions\n   - Commit to specific next steps\n   - Follow up on those steps\n5. **Escalation criteria**: When to involve management\n\nFor each template:\n- Subject line (for email) with 2 alternatives\n- Complete message body (personalized with [CUSTOMER_NAME], [SCORE], [COMMENT_IF_ANY])\n- Clear CTA\n- Timeline: When to send relative to survey completion\n- Character count for in-app messages\n\nAlso provide:\n- A framework for handling NPS responses with comments vs. without comments\n- How to close the feedback loop (tell customers what you did with their feedback)\n- Quarterly NPS trend analysis template",
        category: "customer-success",
        tags: ["NPS", "customer feedback", "survey follow-up"],
        useCase:
          "Use when processing NPS survey results to ensure every respondent receives an appropriate, personalized follow-up that drives action.",
        exampleInput:
          "Product: CloudSync file sharing platform. Survey: Quarterly check-in. Voice: Warm, professional, personal. Channel: Email. Example detractor comment: 'Sync is too slow and support took 3 days to respond.' Example promoter comment: 'Love how easy it is to share files with external clients.'",
        exampleOutput:
          "Promoter follow-up — Subject: 'You made our day, [FIRST_NAME]' (29 chars). Body: 'Hi [FIRST_NAME], I just saw your NPS response and wanted to personally thank you. Knowing that file sharing with external clients is working seamlessly for your team means a lot — that's exactly the experience we're building for. Quick question: would you be open to sharing a 1-2 sentence quote about your experience? We'd feature it on our website with your permission.' Detractor follow-up — Subject: 'I read your feedback, [FIRST_NAME] — let's fix this' (50 chars). Body: 'Hi [FIRST_NAME], I saw your feedback about sync speed and our support response time, and I want to address both directly. You're right — 3 days for a support response isn't acceptable...'",
        targetKeywords: [
          "NPS follow-up prompt",
          "AI NPS response template",
          "customer feedback follow-up",
        ],
        relatedTemplates: ["customer-health-score-narrator", "churn-risk-assessment"],
        difficulty: "intermediate",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "customer-milestone-celebration",
        title: "Customer Milestone Celebration",
        description:
          "Create personalized milestone celebration messages that strengthen customer relationships and drive advocacy.",
        prompt:
          "You are a customer success relationship manager. Create milestone celebration messages for customers of [PRODUCT NAME].\n\nProduct context:\n- Product: [PRODUCT NAME AND WHAT IT DOES]\n- Brand voice: [TONE — warm, professional, playful, celebratory]\n- Customer base: [TYPE OF CUSTOMERS — B2B SaaS, DTC, enterprise, etc.]\n\nCreate celebration templates for each milestone type:\n\n1. **Usage milestones**:\n   - First major action completed (e.g., first project, first report, first campaign)\n   - Power user threshold (e.g., 100th project, 1000th transaction)\n   - Feature discovery (first time using an advanced feature)\n   For each: Email copy, in-app notification copy (under 50 words), and suggested visual/badge\n\n2. **Anniversary milestones**:\n   - 1-month anniversary\n   - 6-month anniversary\n   - 1-year anniversary\n   - Multi-year anniversary (2, 3, 5 years)\n   For each: Personalized message that includes a data recap of their journey ('In your first year, you created [X], saved [Y] hours, and [Z]')\n\n3. **Achievement milestones**:\n   - ROI milestone (e.g., 'Your team has saved $50K using our platform')\n   - Team growth (e.g., 'Your 10th team member just joined!')\n   - Customer's own business success (if known — new funding round, award, expansion)\n   For each: How to celebrate authentically without being transactional\n\n4. **Community milestones**:\n   - First community post or contribution\n   - Became a beta tester or advisor\n   - Referred another customer\n   For each: Recognition message that reinforces the behavior\n\nFor each celebration message:\n- Subject line (email) with 2 alternatives\n- Complete message body with dynamic data placeholders\n- Tone guidance: Celebrate genuinely without being cheesy\n- CTA: What action to invite (share on LinkedIn, book a strategy call, explore next tier)\n- Internal notification: Alert the CSM so they can add a personal touch\n\nAlso provide:\n- A milestone program design: Which milestones to track, how to trigger messages, and escalation from automated to personal outreach for high-value accounts\n- Guidelines: When celebrations feel genuine vs. automated/cringe\n- Anti-patterns: What NOT to do (e.g., don't celebrate usage milestones for unhealthy accounts)",
        category: "customer-success",
        tags: ["customer milestones", "relationship building", "engagement"],
        useCase:
          "Use when building a customer milestone program that strengthens relationships through timely, personalized recognition.",
        exampleInput:
          "Product: ProjectFlow (project management SaaS). Voice: Warm and professional with a touch of personality. Customers: B2B teams (marketing agencies, software teams, consulting firms). Example: Customer just completed their 100th project.",
        exampleOutput:
          "100th Project — Subject: 'Project #100 — that's a milestone worth celebrating.' Body: 'Hi [FIRST_NAME], Your team at [COMPANY] just completed their 100th project in ProjectFlow. Let that sink in — 100 projects planned, tracked, and delivered. Here's your journey in numbers: [X] tasks completed, [Y] team members collaborating, [Z] on-time delivery rate. That's not just project management. That's operational excellence. Congrats from the entire ProjectFlow team.' In-app: 'Project #100 complete! Your team has delivered 100 projects with a [X]% on-time rate. Celebrate this milestone.' Anti-pattern: Don't send this if the customer's health score is red or they have unresolved support tickets...",
        targetKeywords: [
          "customer milestone prompt",
          "AI celebration message generator",
          "customer engagement template",
        ],
        relatedTemplates: ["customer-onboarding-welcome-sequence", "nps-follow-up-drafter"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "knowledge-base-article-writer",
        title: "Knowledge Base Article Writer",
        description:
          "Write clear, searchable knowledge base articles that reduce support tickets and empower self-service.",
        prompt:
          "You are a technical writer specializing in customer-facing documentation. Write a knowledge base article for [PRODUCT NAME].\n\nArticle context:\n- Product: [PRODUCT NAME]\n- Topic: [WHAT THIS ARTICLE COVERS]\n- Article type: [HOW-TO / TROUBLESHOOTING / CONCEPTUAL / FAQ / GETTING STARTED]\n- Target reader: [TECHNICAL LEVEL — non-technical user, power user, admin, developer]\n- Common support ticket this replaces: [THE QUESTION CUSTOMERS ASK THAT THIS ANSWERS]\n- Related features: [WHAT PRODUCT FEATURES THIS INVOLVES]\n- Prerequisites: [WHAT THE USER NEEDS BEFORE STARTING]\n\nWrite the knowledge base article:\n\n1. **Title**: Clear, search-friendly title that matches how customers phrase the question (not internal jargon). Provide 3 options.\n\n2. **Summary/TL;DR** (2-3 sentences): Answer the question immediately at the top. If someone reads only this, they should get the gist.\n\n3. **Before you begin** (if applicable): Prerequisites, permissions needed, estimated time to complete.\n\n4. **Step-by-step instructions** (for how-to articles):\n   - Numbered steps (one action per step)\n   - Expected result after each step\n   - Screenshot placeholders: [SCREENSHOT: description of what to capture]\n   - Tips and warnings in callout boxes:\n     - Tip: Helpful shortcuts or best practices\n     - Warning: Things that could go wrong if they skip this\n     - Note: Additional context that's nice to know\n\n5. **Troubleshooting section**: If the steps don't work:\n   - Problem → Likely cause → Solution (for 3-4 common issues)\n   - 'Still stuck?' escalation path to support\n\n6. **FAQ section**: 3-5 related questions that readers often have after this topic:\n   - Question and concise answer\n   - Link to related articles\n\n7. **Related articles**: 3-5 links to connected help content\n\n8. **SEO and findability**:\n   - Meta description for search\n   - Tags/labels for internal categorization\n   - Alternative search terms (how customers might phrase this differently)\n\n9. **Article metadata**:\n   - Applies to: [PLAN TIERS / PLATFORMS / VERSIONS]\n   - Last updated: [DATE]\n   - Reading time estimate\n\nWriting standards:\n- Write at an 8th-grade reading level\n- Use the product's UI labels exactly as they appear (don't paraphrase button names)\n- Use active voice: 'Click Save' not 'The Save button should be clicked'\n- Keep paragraphs under 4 lines\n- Use consistent formatting for UI elements: **bold** for button names, `code` for values/inputs\n- Test the instructions yourself before publishing (note: provide instructions that would be testable)",
        category: "customer-success",
        tags: ["knowledge base", "help center", "documentation"],
        useCase:
          "Use when creating or improving knowledge base content to deflect support tickets and empower customers to solve problems independently.",
        exampleInput:
          "Product: TaskMaster project management tool. Topic: How to set up automated task assignments based on project templates. Type: How-to. Reader: Non-technical project managers. Ticket: 'How do I make tasks auto-assign when I create a project from a template?' Features: Project templates, task assignments, automation rules. Prerequisite: Must be on Pro plan, must have at least one project template created.",
        exampleOutput:
          "Title option 1: 'Set up automatic task assignments in project templates.' Summary: 'You can configure project templates to automatically assign tasks to specific team members or roles when a new project is created. This saves you from manually assigning every task each time.' Before you begin: You'll need a Pro or Enterprise plan and at least one project template. This setup takes about 5 minutes. Step 1: Go to **Settings** > **Templates** and select the template you want to edit. [SCREENSHOT: Templates list page with arrow pointing to a template name]...",
        targetKeywords: [
          "knowledge base article prompt",
          "AI help center writer",
          "support documentation template",
        ],
        relatedTemplates: ["feature-adoption-guide-writer", "customer-onboarding-welcome-sequence"],
        difficulty: "beginner",
        platforms: ["chatgpt", "claude", "gemini"],
      },
      {
        slug: "escalation-response-template-cs",
        title: "Escalation Response Template",
        description:
          "Draft professional escalation responses that acknowledge urgency, take ownership, and provide clear resolution paths.",
        prompt:
          "You are a senior customer success manager handling an escalated customer issue. Draft an escalation response.\n\nEscalation context:\n- Customer: [CUSTOMER NAME AND TIER]\n- ARR: [CONTRACT VALUE]\n- Issue: [DESCRIBE THE ESCALATED ISSUE IN DETAIL]\n- Severity: [CRITICAL — BUSINESS IMPACTED / HIGH — SIGNIFICANT FRICTION / MEDIUM — IMPORTANT BUT WORKAROUND EXISTS]\n- Escalation source: [WHERE IT CAME FROM — customer email, executive complaint, support escalation, NPS detractor]\n- How long the issue has persisted: [DURATION]\n- Previous attempts to resolve: [WHAT HAS ALREADY BEEN TRIED]\n- Who escalated: [CUSTOMER CONTACT NAME AND ROLE]\n- Internal stakeholders involved: [WHO ON YOUR TEAM IS LOOPED IN]\n- Root cause (if known): [WHAT CAUSED THE ISSUE]\n- Resolution ETA: [WHEN YOU EXPECT TO FIX IT]\n\nDraft the following:\n\n1. **Immediate acknowledgment** (send within 1 hour of escalation):\n   - Subject line\n   - Body: Acknowledge the issue specifically (show you understand what's wrong), own the impact, state what you're doing right now, commit to a timeline for next update\n   - Do NOT blame, make excuses, or use passive voice\n   - Do NOT promise a fix if you're not certain — promise an update\n\n2. **Internal escalation brief** (for your leadership/engineering team):\n   - Customer context (who they are, why they matter)\n   - Issue summary (technical and business impact)\n   - What's been tried\n   - What you need from engineering/product/leadership\n   - Urgency rationale\n   - Recommended response\n\n3. **Progress update** (if resolution takes >24 hours):\n   - What's happened since last communication\n   - Current status and next steps\n   - Revised timeline if needed (explain why)\n\n4. **Resolution communication**:\n   - Confirm the issue is resolved\n   - Explain what happened (at appropriate technical level for the audience)\n   - What you're doing to prevent recurrence\n   - Goodwill gesture (if appropriate — credit, extended trial, executive meeting)\n   - Feedback request: 'How did we handle this?'\n\n5. **Post-escalation internal debrief template**:\n   - What happened\n   - Why it escalated (what broke in the normal process)\n   - What to change to prevent similar escalations\n   - Account recovery plan for the next 30 days\n\nTone principles:\n- Take ownership (not 'there was an issue' but 'we caused an issue')\n- Be specific (not 'we're looking into it' but 'our engineering team is investigating the API timeout that caused...')\n- Be human (a real person is behind this message, not a template)\n- Match urgency to the customer's urgency\n- Under-promise, over-deliver on timeline",
        category: "customer-success",
        tags: ["escalation management", "crisis response", "customer recovery"],
        useCase:
          "Use when handling an escalated customer issue to ensure a professional, timely response that preserves the relationship.",
        exampleInput:
          "Customer: DataVault Corp (Enterprise, $200K ARR). Issue: Data export feature has been returning corrupted files for 5 days. Severity: Critical — customer can't deliver reports to their clients. Source: VP of Operations emailed the CEO directly. Previous attempts: Support ticket open 5 days with no resolution. Root cause: Unknown — engineering investigating. Resolution ETA: Unknown.",
        exampleOutput:
          "Immediate acknowledgment — Subject: 'Data export issue — I'm personally taking ownership.' Body: 'Dear [Name], I'm [Your Name], Senior Customer Success Manager, and I'm personally taking ownership of the data export issue your team has been experiencing. I understand this has been impacting your ability to deliver client reports for 5 days, and that's unacceptable. Here's what's happening right now: Our senior engineering team is actively investigating the corrupted export files as their top priority. I will send you a substantive update by [TIME TOMORROW] with findings and a resolution timeline. In the interim, our team has prepared a manual export workaround that can unblock your immediate client deliverables — [link]. I take full responsibility for the support response time on this, and I'm committed to making it right...'",
        targetKeywords: [
          "escalation response prompt",
          "customer crisis template",
          "AI escalation handler",
        ],
        relatedTemplates: ["churn-risk-assessment", "nps-follow-up-drafter"],
        difficulty: "advanced",
        platforms: ["chatgpt", "claude", "gemini"],
      },
    ],
  },

];

// ── Helper Functions ─────────────────────────────────────────────────────

export function getCategory(slug: string): PromptCategory | undefined {
  return promptCategories.find((c) => c.slug === slug);
}

export function getTemplate(
  categorySlug: string,
  templateSlug: string
): PromptTemplate | undefined {
  const category = getCategory(categorySlug);
  return category?.templates.find((t) => t.slug === templateSlug);
}

export function getAllTemplates(): PromptTemplate[] {
  return promptCategories.flatMap((c) => c.templates);
}

export function getRelatedTemplates(
  template: PromptTemplate,
  limit = 3
): PromptTemplate[] {
  const all = getAllTemplates();
  return template.relatedTemplates
    .map((slug) => all.find((t) => t.slug === slug))
    .filter((t): t is PromptTemplate => t !== undefined)
    .slice(0, limit);
}
