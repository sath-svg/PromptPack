import type { PromptCategory, PromptTemplate } from "./types";

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
