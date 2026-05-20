import type { RolePage } from "./types";

const LAST_UPDATED = "2026-05-20";

export const rolePages: RolePage[] = [
  {
    slug: "developers",
    role: "Developers",
    title: "AI Prompts for Developers - Free Coding & Engineering Templates",
    description:
      "Free AI prompt templates for software developers. Code review, debugging, refactoring, API design, testing, and documentation prompts for ChatGPT, Claude, and Copilot.",
    longDescription:
      "Whether you're debugging a production issue, reviewing a pull request, or scaffolding a new API, these prompt templates help developers write better code faster. Each template is designed for real engineering workflows and works across ChatGPT, Claude, Gemini, and specialized coding assistants like Copilot and Cursor.",
    keywords: [
      "AI prompts for developers",
      "coding prompts",
      "developer prompt templates",
      "ChatGPT for coding",
      "programming prompts",
      "skillset for developers",
      "developer skillset",
    ],
    icon: "👨‍💻",
    relevantCategories: ["coding", "design", "data-analysis"],
    relevantTags: ["code review", "debugging", "refactoring", "API", "testing", "documentation"],
    skillsetHeadline: "The Skillset for Developers",
    skillsetSubhead:
      "A portable bundle of prompts that turn ChatGPT, Claude, Cursor, and Copilot into a senior pair-programmer. Built for code review, debugging, refactoring, and API design — reuse the same prompts across every AI tool you touch.",
    medianSalary: 132270,
    employmentCount: 1656880,
    aiAdoptionPct: 76,
    hoursSavedPerWeek: 9,
    oNetCode: "15-1252.00",
    keyTasks: [
      "Review pull requests for correctness, security, and style",
      "Debug production incidents from logs and stack traces",
      "Refactor legacy code with intent preservation",
      "Design REST and GraphQL APIs with versioning strategy",
      "Write unit, integration, and end-to-end tests",
      "Author technical documentation and ADRs",
    ],
    faqs: [
      {
        question: "What is a Skillset for developers?",
        answer:
          "A Skillset for developers is a portable collection of engineering prompts you can run inside ChatGPT, Claude, Cursor, Copilot, or any LLM. It saves you from re-typing the same code-review, debugging, and refactoring instructions every session.",
      },
      {
        question: "How is this different from ChatGPT custom instructions?",
        answer:
          "Custom instructions are locked to one model. A Skillset is a portable file that runs across ChatGPT, Claude, Gemini, Cursor, and Copilot — so you get the same review quality everywhere without rebuilding your prompts per tool.",
      },
      {
        question: "Will it work with Cursor and Copilot?",
        answer:
          "Yes. The desktop app injects Skillset prompts into your IDE chat and inline-completion flows. The Chrome extension covers ChatGPT, Claude, Gemini, and Grok web UIs.",
      },
      {
        question: "Can I use it for code review on real PRs?",
        answer:
          "The Developer Skillset includes a Code Review pack with prompts for correctness, security (OWASP Top 10), performance, and style. Pipe a diff in; get a structured review out.",
      },
      {
        question: "Does it route to the cheapest model?",
        answer:
          "Yes. Skill Router picks Haiku or DeepSeek for boilerplate, Sonnet for review, Opus for complex reasoning — typical token-cost reduction is 60–80% versus always using a frontier model.",
      },
      {
        question: "Is the Developer Skillset free?",
        answer:
          "The starter pack is free. Pro ($9/mo) unlocks 7 custom packs and version control; Studio unlocks 17 packs and the team marketplace.",
      },
    ],
    vsConsultant: [
      { feature: "Cost per review", skillset: "<$0.10 in tokens", consultant: "$200+/hr", winner: "skillset" },
      { feature: "Response time", skillset: "Seconds", consultant: "Hours or days", winner: "skillset" },
      { feature: "Architectural judgment", skillset: "Pattern-matched", consultant: "Hard-won experience", winner: "consultant" },
      { feature: "24/7 availability", skillset: "Always on", consultant: "Business hours", winner: "skillset" },
      { feature: "Consistency across reviews", skillset: "Identical every run", consultant: "Varies by mood", winner: "skillset" },
    ],
    howToSteps: [
      { name: "Install Skillset", text: "Download the desktop app for macOS or Windows, or add the Chrome extension." },
      { name: "Import the Developer Skillset", text: "Pick the Code Review Copilot pack from the free starter library." },
      { name: "Invoke from ChatGPT, Claude, Cursor, or Copilot", text: "Trigger the pack from the Skillset toolbar — no copy-paste." },
      { name: "Reuse across every tool", text: "The same prompt runs identically in your IDE chat and your browser AI." },
      { name: "Save 60–80% on tokens", text: "Skill Router picks the cheapest capable model per prompt." },
    ],
    citations: [
      { label: "BLS Occupational Employment Statistics — Software Developers", url: "https://www.bls.gov/oes/current/oes151252.htm" },
      { label: "Stack Overflow 2024 Developer Survey — AI tooling adoption", url: "https://survey.stackoverflow.co/2024/ai" },
      { label: "GitHub Copilot productivity study (Anthropic / GitHub, 2024)", url: "https://github.blog/2022-09-07-research-quantifying-github-copilots-impact-on-developer-productivity-and-happiness/" },
    ],
    lastUpdated: LAST_UPDATED,
  },
  {
    slug: "marketers",
    role: "Marketers",
    title: "AI Prompts for Marketers - Free Marketing & Growth Templates",
    description:
      "Free AI prompt templates for marketing professionals. Ad copy, content calendars, SEO, email campaigns, and social media prompts.",
    longDescription:
      "From writing Google Ads copy to planning a month of content, these prompt templates help marketers produce high-quality work faster. Each template covers real marketing workflows including campaign planning, copywriting, analytics interpretation, and multi-channel strategy.",
    keywords: [
      "AI prompts for marketers",
      "marketing prompts",
      "ChatGPT for marketing",
      "digital marketing prompts",
      "growth marketing templates",
      "skillset for marketers",
    ],
    icon: "📣",
    relevantCategories: ["marketing", "seo", "social-media", "email", "content-strategy"],
    relevantTags: ["ad copy", "content calendar", "SEO", "marketing", "copywriting", "brand strategy"],
    skillsetHeadline: "The Skillset for Marketers",
    skillsetSubhead:
      "A portable bundle of marketing prompts for ad copy, content calendars, SEO briefs, and email sequences. Run the same brand voice across ChatGPT, Claude, Gemini, and your CMS — no more rebuilding prompts for every tool.",
    medianSalary: 158280,
    employmentCount: 376450,
    aiAdoptionPct: 73,
    hoursSavedPerWeek: 11,
    oNetCode: "11-2021.00",
    keyTasks: [
      "Write paid-search and paid-social ad copy",
      "Build monthly content calendars across channels",
      "Generate SEO briefs and keyword clusters",
      "Draft email nurture and lifecycle sequences",
      "Interpret campaign analytics and propose next tests",
      "Maintain consistent brand voice across writers",
    ],
    faqs: [
      {
        question: "What is a Skillset for marketers?",
        answer:
          "A Skillset for marketers is a portable pack of campaign, copy, and analytics prompts that runs across ChatGPT, Claude, Gemini, and your in-CMS AI. One brand voice, every channel, no copy-paste.",
      },
      {
        question: "Can it match my brand voice?",
        answer:
          "Yes. The Brand Voice Studio pack encodes tone, vocabulary, and style rules into every prompt — so a junior marketer running your Skillset writes in the same voice as your founder.",
      },
      {
        question: "Does it help with SEO?",
        answer:
          "The Marketer Skillset ships with SEO brief generators, keyword-cluster prompts, and an internal-linking planner. Feed in a topic; get a publish-ready outline back.",
      },
      {
        question: "How much can I save on AI subscriptions?",
        answer:
          "Skill Router auto-picks Haiku or Gemini Flash for bulk copy variations and reserves Sonnet/Opus for strategy work. Marketing teams typically cut LLM spend 70%+.",
      },
      {
        question: "Will it integrate with my CMS or ad platform?",
        answer:
          "The Chrome extension overlays on any text input — Webflow, Notion, Google Ads, Meta Ads Manager — so prompts run in-place without exporting copy.",
      },
      {
        question: "Can my whole team use the same Skillset?",
        answer:
          "Studio tier unlocks team-shared packs with version control. One person edits the brand voice; everyone's AI updates next session.",
      },
    ],
    vsConsultant: [
      { feature: "Cost per campaign brief", skillset: "<$0.20 in tokens", consultant: "$500+/brief", winner: "skillset" },
      { feature: "Turnaround", skillset: "Minutes", consultant: "Days", winner: "skillset" },
      { feature: "Strategic positioning", skillset: "Framework-driven", consultant: "Market intuition", winner: "consultant" },
      { feature: "Volume of copy variants", skillset: "Unlimited", consultant: "Capped by retainer", winner: "skillset" },
      { feature: "Brand voice consistency", skillset: "Identical every run", consultant: "Varies by writer", winner: "skillset" },
    ],
    howToSteps: [
      { name: "Install Skillset", text: "Add the Chrome extension or desktop app." },
      { name: "Import the Marketer Skillset", text: "Choose Brand Voice Studio, SEO Briefs, or Ad Copy Lab from the free library." },
      { name: "Run prompts in-place", text: "Trigger directly inside ChatGPT, Claude, Gemini, Google Ads, or your CMS." },
      { name: "Share across team", text: "Studio tier syncs the same Skillset to every marketer on your team." },
      { name: "Cut LLM spend 70%+", text: "Skill Router picks the cheapest capable model per task." },
    ],
    citations: [
      { label: "BLS — Marketing Managers", url: "https://www.bls.gov/oes/current/oes112021.htm" },
      { label: "Salesforce State of Marketing 2024", url: "https://www.salesforce.com/resources/research-reports/state-of-marketing/" },
      { label: "HubSpot State of AI in Marketing 2024", url: "https://www.hubspot.com/state-of-marketing" },
    ],
    lastUpdated: LAST_UPDATED,
  },
  {
    slug: "writers",
    role: "Writers",
    title: "AI Prompts for Writers - Free Writing & Editing Templates",
    description:
      "Free AI prompt templates for writers. Blog posts, creative fiction, editing, tone rewriting, and content structure prompts for every writing style.",
    longDescription:
      "Whether you're drafting a blog post, outlining a novel, or polishing client copy, these prompt templates help writers at every stage of the process. Designed for professional writers, content creators, and anyone who writes regularly, each template provides structured guidance for ChatGPT, Claude, and Gemini.",
    keywords: [
      "AI prompts for writers",
      "writing prompts",
      "ChatGPT for writing",
      "content writing prompts",
      "AI writing templates",
      "skillset for writers",
    ],
    icon: "✍️",
    relevantCategories: ["writing", "creative-writing", "content-strategy", "seo"],
    relevantTags: ["blog post", "copywriting", "editing", "tone", "writing", "content"],
    skillsetHeadline: "The Skillset for Writers",
    skillsetSubhead:
      "A portable bundle of drafting, editing, and tone-rewriting prompts. Built for blog posts, longform articles, and fiction — run the same Skillset across Claude, ChatGPT, and Gemini without rebuilding your voice prompts each time.",
    medianSalary: 73690,
    employmentCount: 50220,
    aiAdoptionPct: 64,
    hoursSavedPerWeek: 7,
    oNetCode: "27-3043.00",
    keyTasks: [
      "Draft blog post outlines and full articles",
      "Edit for tone, clarity, and pacing",
      "Rewrite copy in a target voice",
      "Generate research summaries from source material",
      "Suggest headlines and hooks",
      "Plot, outline, and revise fiction",
    ],
    faqs: [
      {
        question: "What is a Skillset for writers?",
        answer:
          "A Skillset for writers is a portable pack of drafting, editing, and rewriting prompts. The same prompts run identically in Claude, ChatGPT, and Gemini — pick whichever model writes best for the task.",
      },
      {
        question: "Will my voice survive AI editing?",
        answer:
          "The Tone Lock pack pins your voice as style anchors into every edit — verbosity, sentence rhythm, vocabulary tier. Edits respect your voice instead of flattening it.",
      },
      {
        question: "Is this just for blog writers or also fiction?",
        answer:
          "Both. The Skillset library covers blog briefs, longform articles, and fiction workflows (plotting, scene revision, dialogue tightening).",
      },
      {
        question: "Can I sell my own Skillset?",
        answer:
          "Yes. The marketplace lets verified creators sell Skillsets — useful if your style is your product.",
      },
      {
        question: "Does it work offline?",
        answer:
          "Skillset packs live locally. The LLM call still requires internet, but your prompts and edits are stored on-device.",
      },
      {
        question: "How is this different from a writing app like Sudowrite?",
        answer:
          "Sudowrite is a closed UI. Skillset is portable — the same prompts work in Claude, ChatGPT, Gemini, or any LLM you already pay for. No second subscription.",
      },
    ],
    vsConsultant: [
      { feature: "Cost per edit", skillset: "<$0.05 in tokens", consultant: "$80+/hr", winner: "skillset" },
      { feature: "Turnaround on a draft", skillset: "Minutes", consultant: "Days", winner: "skillset" },
      { feature: "Developmental judgment", skillset: "Pattern-matched", consultant: "Human taste", winner: "consultant" },
      { feature: "Availability", skillset: "Always on", consultant: "Scheduled", winner: "skillset" },
      { feature: "Voice consistency", skillset: "Pinned via Tone Lock", consultant: "Varies", winner: "skillset" },
    ],
    howToSteps: [
      { name: "Install Skillset", text: "Add the Chrome extension or desktop app." },
      { name: "Import the Writer Skillset", text: "Start with the Tone Lock or Blog Brief pack." },
      { name: "Draft in any LLM", text: "Run the same prompts in Claude, ChatGPT, Gemini, or Grok." },
      { name: "Edit with voice preserved", text: "Tone Lock pins your voice into every revision." },
      { name: "Save 60%+ on tokens", text: "Skill Router uses Haiku or Gemini Flash for routine edits." },
    ],
    citations: [
      { label: "BLS — Writers and Authors", url: "https://www.bls.gov/oes/current/oes273043.htm" },
      { label: "Authors Guild AI Survey 2024", url: "https://authorsguild.org/news/ai-survey-results/" },
      { label: "Reuters Institute Digital News Report — AI use", url: "https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2024" },
    ],
    lastUpdated: LAST_UPDATED,
  },
  {
    slug: "teachers",
    role: "Teachers",
    title: "AI Prompts for Teachers - Free Education & Lesson Plan Templates",
    description:
      "Free AI prompt templates for teachers and educators. Lesson plans, quizzes, rubrics, student feedback, and classroom activity generators.",
    longDescription:
      "Save hours of lesson prep with prompt templates designed for educators. Create differentiated lesson plans, generate assessment questions, write constructive student feedback, and design engaging classroom activities. These templates work for K-12 teachers, college professors, and corporate trainers alike.",
    keywords: [
      "AI prompts for teachers",
      "teacher prompts",
      "ChatGPT for teachers",
      "lesson plan prompts",
      "education prompts",
      "skillset for teachers",
    ],
    icon: "👩‍🏫",
    relevantCategories: ["education", "research", "personal-development"],
    relevantTags: ["lesson plan", "quiz", "rubric", "student feedback", "education", "teaching"],
    skillsetHeadline: "The Skillset for Teachers",
    skillsetSubhead:
      "A portable bundle of lesson-plan, quiz, rubric, and student-feedback prompts. Run the same standards-aligned templates across ChatGPT, Claude, and Gemini — cut prep time without compromising on differentiation.",
    medianSalary: 63670,
    employmentCount: 1395840,
    aiAdoptionPct: 52,
    hoursSavedPerWeek: 6,
    oNetCode: "25-2021.00",
    keyTasks: [
      "Build differentiated lesson plans aligned to standards",
      "Generate quizzes, rubrics, and answer keys",
      "Write constructive, personalized student feedback",
      "Design hands-on classroom activities",
      "Adapt materials for diverse reading levels",
      "Communicate with parents in clear, supportive language",
    ],
    faqs: [
      {
        question: "What is a Skillset for teachers?",
        answer:
          "A Skillset for teachers is a portable pack of lesson-planning, assessment, and feedback prompts. The same templates run across ChatGPT, Claude, and Gemini — and adapt to your grade level and standards.",
      },
      {
        question: "Is it FERPA-safe?",
        answer:
          "The Skillset desktop app keeps prompts and student-identifying inputs local. Cloud LLM calls go through your existing model account; we never see your students' data.",
      },
      {
        question: "Will it match my state standards?",
        answer:
          "The Lesson Plan pack accepts a standards code (Common Core, NGSS, TEKS, state ELA) and aligns objectives accordingly.",
      },
      {
        question: "Can it differentiate for reading level?",
        answer:
          "Yes. The Adapt for Level prompt rewrites the same text at three reading bands so you can serve a mixed classroom in one prep.",
      },
      {
        question: "Does this replace the teacher?",
        answer:
          "No. It removes the grunt work — first drafts of rubrics, quiz items, parent emails — so you spend more time on the teaching itself.",
      },
      {
        question: "Is the starter pack free?",
        answer:
          "Yes. The free tier includes the Lesson Builder starter pack. Pro unlocks differentiation, rubrics, and parent communication packs.",
      },
    ],
    vsConsultant: [
      { feature: "Cost per lesson plan", skillset: "<$0.05 in tokens", consultant: "$50+/plan", winner: "skillset" },
      { feature: "Turnaround", skillset: "Minutes", consultant: "Days", winner: "skillset" },
      { feature: "Pedagogical judgment", skillset: "Standards-aligned", consultant: "Expert PD", winner: "consultant" },
      { feature: "Volume of materials", skillset: "Unlimited", consultant: "Capped", winner: "skillset" },
      { feature: "Personalization to your classroom", skillset: "High once configured", consultant: "Low without retainer", winner: "skillset" },
    ],
    howToSteps: [
      { name: "Install Skillset", text: "Use the desktop app or Chrome extension." },
      { name: "Import the Teacher Skillset", text: "Pick Lesson Builder, Rubric Generator, or Parent Communications." },
      { name: "Plug in your standards", text: "Drop in your standards code or unit name — the prompt aligns automatically." },
      { name: "Run in any LLM", text: "ChatGPT, Claude, or Gemini — pick whichever is cheapest in your routing rules." },
      { name: "Reuse weekly", text: "Save a unit pack once; rerun for every section, every term." },
    ],
    citations: [
      { label: "BLS — Elementary School Teachers", url: "https://www.bls.gov/oes/current/oes252021.htm" },
      { label: "RAND American Educator Panel — AI use (2024)", url: "https://www.rand.org/education-and-labor/projects/aep.html" },
      { label: "Walton Family Foundation Teacher AI Survey 2024", url: "https://www.waltonfamilyfoundation.org/learning/teachers-and-students-embrace-chatgpt-for-education" },
    ],
    lastUpdated: LAST_UPDATED,
  },
  {
    slug: "students",
    role: "Students",
    title: "AI Prompts for Students - Free Study & Research Templates",
    description:
      "Free AI prompt templates for students. Essay outlines, study guides, research summaries, exam prep, and academic writing prompts.",
    longDescription:
      "Study smarter with prompt templates designed for students at every level. Create study guides, outline essays, summarize research papers, prepare for exams, and improve your academic writing. These templates help you use AI as a learning tool without compromising academic integrity.",
    keywords: [
      "AI prompts for students",
      "student prompts",
      "ChatGPT for studying",
      "study prompts",
      "academic prompts",
      "skillset for students",
    ],
    icon: "🎓",
    relevantCategories: ["education", "research", "writing"],
    relevantTags: ["study", "research", "essay", "academic", "learning", "exam prep"],
    skillsetHeadline: "The Skillset for Students",
    skillsetSubhead:
      "A portable bundle of study, research, and essay-outline prompts built for learning — not for cheating. Run the same Skillset across ChatGPT, Claude, and Gemini without paying for three subscriptions.",
    aiAdoptionPct: 86,
    hoursSavedPerWeek: 5,
    keyTasks: [
      "Build study guides from lecture notes",
      "Summarize research papers and textbooks",
      "Outline essays with thesis and evidence chains",
      "Generate practice questions for exams",
      "Explain difficult concepts at multiple levels",
      "Cite sources and check argument structure",
    ],
    faqs: [
      {
        question: "What is a Skillset for students?",
        answer:
          "A Skillset for students is a portable pack of study, research, and essay-outlining prompts. The same prompts run across ChatGPT, Claude, and Gemini, so you pay once and use the cheapest model per task.",
      },
      {
        question: "Will my school flag this as AI cheating?",
        answer:
          "The Student Skillset is built for learning, not generation. Use the Explain Like I'm 5 or Practice Quiz packs and write your essays yourself — Skillset is a tutor, not a ghostwriter.",
      },
      {
        question: "Can it summarize PDFs?",
        answer:
          "Yes. Paste a PDF into Claude or Gemini and run the Research Summary pack — get a structured TL;DR, key claims, and counterarguments.",
      },
      {
        question: "Is it free for students?",
        answer:
          "The free tier covers all study packs. Pro is $9/mo and only worth it if you want custom packs or marketplace access.",
      },
      {
        question: "Does it work in multiple languages?",
        answer:
          "Skillset prompts are language-agnostic. Claude, GPT-4o, and Gemini all handle 30+ languages — your study guide can be generated in your native language.",
      },
      {
        question: "Will it help with coding homework?",
        answer:
          "Pair the Student Skillset with the Developer Skillset for CS homework. The Code Walkthrough pack explains every line instead of just writing the answer.",
      },
    ],
    vsConsultant: [
      { feature: "Cost per study session", skillset: "<$0.05 in tokens", consultant: "$40+/hr tutor", winner: "skillset" },
      { feature: "Availability at 2am", skillset: "Always on", consultant: "Office hours", winner: "skillset" },
      { feature: "Encouragement and accountability", skillset: "Limited", consultant: "Human", winner: "consultant" },
      { feature: "Subject coverage", skillset: "Universal", consultant: "Specialized", winner: "skillset" },
      { feature: "Personalized to your weak spots", skillset: "Yes via Practice Quiz", consultant: "Yes", winner: "tie" },
    ],
    howToSteps: [
      { name: "Install Skillset", text: "Chrome extension is the easiest entry point for students." },
      { name: "Import the Student Skillset", text: "Pick Study Faster, Research Summary, or Practice Quiz." },
      { name: "Pick the cheapest model", text: "Skill Router uses Gemini Flash or Haiku for routine work — cents per session." },
      { name: "Study, don't generate", text: "Use the tutor packs; write your essays yourself." },
      { name: "Save across semesters", text: "Reusable for every class, every term." },
    ],
    citations: [
      { label: "Pew Research — Teen AI use 2024", url: "https://www.pewresearch.org/internet/2023/11/16/teens-school-and-chatgpt/" },
      { label: "Tyton Partners Time for Class 2024 Student Survey", url: "https://tytonpartners.com/time-for-class-2024/" },
      { label: "EDUCAUSE Student AI Use 2024", url: "https://www.educause.edu/research/2024/educause-student-edition" },
    ],
    lastUpdated: LAST_UPDATED,
  },
  {
    slug: "designers",
    role: "Designers",
    title: "AI Prompts for Designers - Free UX, UI & Graphic Design Templates",
    description:
      "Free AI prompt templates for designers. User research, wireframing, design systems, accessibility audits, and visual design prompts.",
    longDescription:
      "From user research to final mockups, these prompt templates help designers streamline their workflow. Create user stories, write microcopy, plan A/B tests, audit accessibility, and generate design documentation. Works for UX designers, UI designers, graphic designers, and product designers.",
    keywords: [
      "AI prompts for designers",
      "design prompts",
      "UX prompts",
      "ChatGPT for designers",
      "UI design prompts",
      "skillset for designers",
    ],
    icon: "🎯",
    relevantCategories: ["design", "creative-writing", "image-generation"],
    relevantTags: ["UX", "UI", "design system", "wireframe", "accessibility", "user research"],
    skillsetHeadline: "The Skillset for Designers",
    skillsetSubhead:
      "A portable bundle of user-research, microcopy, accessibility-audit, and design-system prompts. Pair with Midjourney, DALL-E, or Flux for image work — one Skillset across every tool.",
    medianSalary: 103420,
    employmentCount: 17400,
    aiAdoptionPct: 71,
    hoursSavedPerWeek: 8,
    oNetCode: "15-1255.00",
    keyTasks: [
      "Run user-interview synthesis and affinity mapping",
      "Generate wireframe annotations and microcopy",
      "Audit screens for WCAG 2.2 AA accessibility",
      "Document design-system tokens and components",
      "Plan A/B tests with hypothesis and success metrics",
      "Generate moodboards and visual references",
    ],
    faqs: [
      {
        question: "What is a Skillset for designers?",
        answer:
          "A Skillset for designers is a portable pack of UX research, microcopy, accessibility, and design-system prompts that runs across ChatGPT, Claude, Midjourney, DALL-E, and Flux.",
      },
      {
        question: "Does it cover image generation?",
        answer:
          "Yes. The Image Direction pack writes Midjourney, DALL-E, and Flux prompts in your house style — so junior designers brief the AI like your art director would.",
      },
      {
        question: "Can it audit accessibility?",
        answer:
          "Yes. Paste a screen or component spec; the WCAG Audit pack returns AA violations with fixes.",
      },
      {
        question: "Will it match my design system tokens?",
        answer:
          "Configure the System pack with your token names (colors, spacing, type). All downstream prompts reference them by name.",
      },
      {
        question: "Does it work in Figma?",
        answer:
          "The Chrome extension overlays Figma's web app. The desktop app pipes prompts into Figma plugins via clipboard chains.",
      },
      {
        question: "Can a research-light designer run real user studies?",
        answer:
          "The Research pack guides interview scripts, synthesis, and JTBD framing — you bring the users; the Skillset structures the work.",
      },
    ],
    vsConsultant: [
      { feature: "Cost per microcopy round", skillset: "<$0.10 in tokens", consultant: "$200+/hr", winner: "skillset" },
      { feature: "Turnaround", skillset: "Minutes", consultant: "Days", winner: "skillset" },
      { feature: "Design judgment", skillset: "Pattern-matched", consultant: "Crafted", winner: "consultant" },
      { feature: "Accessibility coverage", skillset: "Audits 100% of screens", consultant: "Spot-checks", winner: "skillset" },
      { feature: "Volume of variants", skillset: "Unlimited", consultant: "Capped", winner: "skillset" },
    ],
    howToSteps: [
      { name: "Install Skillset", text: "Desktop app is best for design work — pairs with Figma." },
      { name: "Import the Designer Skillset", text: "Start with Microcopy Lab, WCAG Audit, or Image Direction." },
      { name: "Run in your AI of choice", text: "Claude for copy, Midjourney for visuals, Gemini for fast variants." },
      { name: "Pin your design system", text: "Configure tokens once; every prompt respects them." },
      { name: "Save 60%+ on tokens", text: "Skill Router picks the cheapest capable model per ask." },
    ],
    citations: [
      { label: "BLS — Web and Digital Interface Designers", url: "https://www.bls.gov/oes/current/oes151255.htm" },
      { label: "UXTools.co Design Tools Survey 2024", url: "https://uxtools.co/survey/2024/" },
      { label: "Figma AI Report 2024", url: "https://www.figma.com/blog/state-of-design-2024/" },
    ],
    lastUpdated: LAST_UPDATED,
  },
  {
    slug: "hr-professionals",
    role: "HR Professionals",
    title: "AI Prompts for HR - Free Human Resources & People Ops Templates",
    description:
      "Free AI prompt templates for HR professionals. Job descriptions, interview questions, performance reviews, onboarding plans, and policy drafts.",
    longDescription:
      "Streamline HR workflows with prompt templates designed for people operations. Write inclusive job descriptions, generate behavioral interview questions, draft performance reviews, create onboarding checklists, and develop company policies. These templates save hours on routine HR tasks while maintaining quality and compliance.",
    keywords: [
      "AI prompts for HR",
      "HR prompts",
      "ChatGPT for HR",
      "human resources prompts",
      "people ops prompts",
      "skillset for HR",
    ],
    icon: "👥",
    relevantCategories: ["hr-recruiting", "email", "business-strategy"],
    relevantTags: ["job description", "interview", "performance review", "onboarding", "HR", "recruiting"],
    skillsetHeadline: "The Skillset for HR Professionals",
    skillsetSubhead:
      "A portable bundle of job-description, interview, performance-review, and policy-draft prompts. Maintain inclusive, legally-defensible language across every channel with one Skillset.",
    medianSalary: 68750,
    employmentCount: 893910,
    aiAdoptionPct: 65,
    hoursSavedPerWeek: 8,
    oNetCode: "13-1071.00",
    keyTasks: [
      "Write inclusive, structured job descriptions",
      "Generate behavioral interview questions and rubrics",
      "Draft performance reviews from notes",
      "Build onboarding checklists by role",
      "Author policy documents and handbook updates",
      "Communicate sensitive HR decisions with empathy",
    ],
    faqs: [
      {
        question: "What is a Skillset for HR?",
        answer:
          "A Skillset for HR is a portable pack of job-description, interview, review, and policy prompts. Inclusive language and legal-safe phrasing are pinned into every prompt, so junior generalists draft like a senior HRBP.",
      },
      {
        question: "Is employee data safe?",
        answer:
          "Skillset stores prompts on-device. LLM calls go through your own model account — we never see employee data. Use the Redact pack to strip PII before generation.",
      },
      {
        question: "Will my JDs be inclusive?",
        answer:
          "The JD Builder pack applies bias-language checks (gendered terms, exclusionary requirements) by default — you can't ship a biased post without an explicit override.",
      },
      {
        question: "Does it generate compliant policy?",
        answer:
          "The Policy pack drafts handbook sections, but a lawyer must review. Skillset gets you to a 90% draft in minutes instead of days.",
      },
      {
        question: "Can it write performance reviews?",
        answer:
          "Yes. Paste your notes; the Review Builder pack produces structured, behavior-based feedback tied to competencies.",
      },
      {
        question: "Is it ATS-compatible?",
        answer:
          "JD output is plain text — pastes into Greenhouse, Lever, Workday, Ashby without reformatting.",
      },
    ],
    vsConsultant: [
      { feature: "Cost per JD", skillset: "<$0.10 in tokens", consultant: "$300+/post", winner: "skillset" },
      { feature: "Turnaround", skillset: "Minutes", consultant: "Days", winner: "skillset" },
      { feature: "Legal review", skillset: "Not provided", consultant: "Included", winner: "consultant" },
      { feature: "Inclusive language", skillset: "Pinned by default", consultant: "Varies", winner: "skillset" },
      { feature: "Volume of reviews", skillset: "Unlimited", consultant: "Capped", winner: "skillset" },
    ],
    howToSteps: [
      { name: "Install Skillset", text: "Desktop app keeps employee data on-device." },
      { name: "Import the HR Skillset", text: "Start with JD Builder, Interview Kit, or Review Builder." },
      { name: "Configure your company context", text: "Drop in EVP, values, leveling — every prompt uses them." },
      { name: "Run in any LLM", text: "Claude or Gemini for cost; GPT-4o for nuanced reviews." },
      { name: "Share with team", text: "Studio tier syncs to every HR partner." },
    ],
    citations: [
      { label: "BLS — Human Resources Specialists", url: "https://www.bls.gov/oes/current/oes131071.htm" },
      { label: "SHRM AI in HR 2024", url: "https://www.shrm.org/topics-tools/news/talent-acquisition/ai-hiring-survey" },
      { label: "Gartner HR AI Adoption 2024", url: "https://www.gartner.com/en/human-resources/insights/artificial-intelligence" },
    ],
    lastUpdated: LAST_UPDATED,
  },
  {
    slug: "salespeople",
    role: "Salespeople",
    title: "AI Prompts for Sales - Free Outreach & Closing Templates",
    description:
      "Free AI prompt templates for sales professionals. Cold outreach, discovery calls, proposals, objection handling, and follow-up sequence prompts.",
    longDescription:
      "Close more deals with prompt templates built for the modern sales process. From cold outreach to renewal conversations, these templates help you write personalized messages, prepare for discovery calls, handle objections, and build compelling proposals. Designed for SDRs, AEs, and sales managers.",
    keywords: [
      "AI prompts for sales",
      "sales prompts",
      "ChatGPT for sales",
      "cold outreach prompts",
      "sales email prompts",
      "skillset for sales",
    ],
    icon: "🤝",
    relevantCategories: ["sales", "email", "marketing"],
    relevantTags: ["cold outreach", "sales pitch", "objection handling", "proposal", "follow-up", "sales"],
    skillsetHeadline: "The Skillset for Sales",
    skillsetSubhead:
      "A portable bundle of cold-outreach, discovery, objection-handling, and proposal prompts. Run the same talk-track across Gmail, LinkedIn, and your CRM — one Skillset, every touchpoint.",
    medianSalary: 65920,
    employmentCount: 1409130,
    aiAdoptionPct: 69,
    hoursSavedPerWeek: 10,
    oNetCode: "41-4012.00",
    keyTasks: [
      "Write personalized cold outreach at scale",
      "Prep discovery calls with account research",
      "Handle common objections with structured responses",
      "Draft proposals and pricing summaries",
      "Build follow-up sequences and reminders",
      "Summarize call notes into next-step plans",
    ],
    faqs: [
      {
        question: "What is a Skillset for sales?",
        answer:
          "A Skillset for sales is a portable pack of outreach, discovery, objection, and proposal prompts. The same talk-track runs in Gmail, LinkedIn, your CRM, and any LLM — your messaging stays consistent everywhere.",
      },
      {
        question: "Will personalization sound human?",
        answer:
          "The Outreach pack pulls account-specific hooks (recent news, hiring signals) and writes in your voice — recipients can't pattern-match it to a template.",
      },
      {
        question: "Does it integrate with my CRM?",
        answer:
          "The Chrome extension overlays Salesforce, HubSpot, Outreach, Salesloft, Apollo — run prompts in-place without leaving the CRM.",
      },
      {
        question: "Can it handle objections live?",
        answer:
          "The Objection Library pack ships with 40+ common B2B objections and structured responses — pull the right one mid-call.",
      },
      {
        question: "Is my pipeline data safe?",
        answer:
          "Prompts and templates live locally. LLM calls go through your account. We never see your deal data.",
      },
      {
        question: "How much can I save on sales-tech?",
        answer:
          "Skillset replaces $500+/month per-rep AI sales tools with a $9 subscription. Routing keeps token cost under $5/rep/month.",
      },
    ],
    vsConsultant: [
      { feature: "Cost per outreach", skillset: "<$0.05 in tokens", consultant: "$200+/hr", winner: "skillset" },
      { feature: "Speed to first email", skillset: "Seconds", consultant: "Hours", winner: "skillset" },
      { feature: "Account-specific judgment", skillset: "Structured", consultant: "Strategic", winner: "consultant" },
      { feature: "Volume per day", skillset: "Hundreds", consultant: "Dozens", winner: "skillset" },
      { feature: "Voice consistency", skillset: "Locked", consultant: "Varies", winner: "skillset" },
    ],
    howToSteps: [
      { name: "Install Skillset", text: "Chrome extension covers Gmail, LinkedIn, and your CRM." },
      { name: "Import the Sales Skillset", text: "Pick Cold Outreach, Discovery Prep, or Objection Library." },
      { name: "Configure ICP", text: "Drop in your buyer persona — every prompt personalizes to it." },
      { name: "Run in-place", text: "Triggered from inside Gmail, Salesforce, HubSpot — no copy-paste." },
      { name: "Save 70%+ on tokens", text: "Routing picks Haiku or Gemini Flash for high-volume outreach." },
    ],
    citations: [
      { label: "BLS — Sales Representatives", url: "https://www.bls.gov/oes/current/oes414012.htm" },
      { label: "Salesforce State of Sales 2024", url: "https://www.salesforce.com/resources/research-reports/state-of-sales/" },
      { label: "HubSpot Sales Trends 2024", url: "https://www.hubspot.com/state-of-sales" },
    ],
    lastUpdated: LAST_UPDATED,
  },
  {
    slug: "lawyers",
    role: "Lawyers",
    title: "AI Prompts for Lawyers - Free Legal Writing & Research Templates",
    description:
      "Free AI prompt templates for legal professionals. Contract drafting, legal research, client communications, compliance checklists, and memo writing.",
    longDescription:
      "Accelerate legal work with prompt templates designed for attorneys and legal professionals. Draft contract clauses, summarize case law, write client-facing communications, generate compliance checklists, and structure legal memoranda. These templates help lawyers work more efficiently while maintaining the precision and rigor the profession demands.",
    keywords: [
      "AI prompts for lawyers",
      "legal prompts",
      "ChatGPT for lawyers",
      "legal writing prompts",
      "attorney prompts",
      "skillset for lawyers",
    ],
    icon: "⚖️",
    relevantCategories: ["legal", "business-strategy", "consulting"],
    relevantTags: ["contract", "legal research", "compliance", "NDA", "legal writing"],
    skillsetHeadline: "The Skillset for Lawyers",
    skillsetSubhead:
      "A portable bundle of contract-drafting, case-summary, memo, and client-communication prompts. Run the same precision-tuned templates across Claude, GPT-4o, and Gemini without leaking client data.",
    medianSalary: 145760,
    employmentCount: 731340,
    aiAdoptionPct: 51,
    hoursSavedPerWeek: 6,
    oNetCode: "23-1011.00",
    keyTasks: [
      "Draft and redline contract clauses",
      "Summarize case law and depositions",
      "Generate compliance checklists by jurisdiction",
      "Structure legal memoranda with IRAC",
      "Translate legalese to plain-language client emails",
      "Build issue lists from document review",
    ],
    faqs: [
      {
        question: "What is a Skillset for lawyers?",
        answer:
          "A Skillset for lawyers is a portable pack of drafting, research, and memo-writing prompts tuned for precision. The same templates run across Claude, GPT-4o, and Gemini — pick whichever you trust per task.",
      },
      {
        question: "Is privileged data safe?",
        answer:
          "The Skillset desktop app keeps prompts on-device. Cloud LLM calls go through your firm's enterprise account (no consumer model). Use the Redact pack before generation.",
      },
      {
        question: "Will it hallucinate citations?",
        answer:
          "Frontier models still hallucinate. The Skillset Cite Check pack flags every citation with a confidence score and requires manual verification before paste.",
      },
      {
        question: "Can it handle redlines?",
        answer:
          "The Redline pack proposes track-changes-style edits with rationale per clause. The reviewing partner stays in the loop.",
      },
      {
        question: "Is it ABA Model Rule 1.6-compliant?",
        answer:
          "Compliance depends on your model provider. Skillset itself is local-only; your firm controls model selection (Anthropic API, Azure OpenAI for HIPAA/BAA, etc.).",
      },
      {
        question: "Will it help paralegals?",
        answer:
          "Yes — most billable savings come from paralegal drafting. The Paralegal pack covers cite-pulling, summary, and exhibit prep.",
      },
    ],
    vsConsultant: [
      { feature: "Cost per memo draft", skillset: "<$0.50 in tokens", consultant: "$1500+/memo", winner: "skillset" },
      { feature: "Turnaround", skillset: "Minutes", consultant: "Days", winner: "skillset" },
      { feature: "Legal judgment", skillset: "Pattern-matched", consultant: "Bar-licensed", winner: "consultant" },
      { feature: "Citation accuracy", skillset: "Requires Cite Check", consultant: "Vouched", winner: "consultant" },
      { feature: "Volume of contract review", skillset: "Unlimited", consultant: "Hourly", winner: "skillset" },
    ],
    howToSteps: [
      { name: "Install Skillset", text: "Desktop app only — keep client data on-device." },
      { name: "Import the Lawyer Skillset", text: "Start with Contract Redline, Memo Builder, or Cite Check." },
      { name: "Configure firm style", text: "Pin firm voice, citation format (Bluebook/ALWD), jurisdiction." },
      { name: "Run in your firm LLM", text: "Claude or GPT-4o on your firm's API — never consumer accounts for privileged work." },
      { name: "Cite-check before paste", text: "The Cite Check pack flags hallucinations before they reach the file." },
    ],
    citations: [
      { label: "BLS — Lawyers", url: "https://www.bls.gov/oes/current/oes231011.htm" },
      { label: "Thomson Reuters Future of Professionals 2024", url: "https://www.thomsonreuters.com/en/reports/future-of-professionals.html" },
      { label: "Stanford RegLab — Legal hallucination study 2024", url: "https://hai.stanford.edu/news/ai-trial-legal-models-hallucinate-1-out-6-or-more-benchmarking-queries" },
    ],
    lastUpdated: LAST_UPDATED,
  },
  {
    slug: "recruiters",
    role: "Recruiters",
    title: "AI Prompts for Recruiters - Free Sourcing & Hiring Templates",
    description:
      "Free AI prompt templates for recruiters. Candidate sourcing, outreach messages, job postings, interview scorecards, and hiring pipeline prompts.",
    longDescription:
      "Fill roles faster with prompt templates designed for talent acquisition. Write compelling job postings, craft personalized candidate outreach, generate interview question sets, and build structured hiring processes. These templates work for in-house recruiters, agency recruiters, and hiring managers.",
    keywords: [
      "AI prompts for recruiters",
      "recruiting prompts",
      "ChatGPT for recruiting",
      "talent acquisition prompts",
      "hiring prompts",
      "skillset for recruiters",
    ],
    icon: "🎯",
    relevantCategories: ["hr-recruiting", "email", "sales"],
    relevantTags: ["recruiting", "job description", "candidate outreach", "interview", "hiring"],
    skillsetHeadline: "The Skillset for Recruiters",
    skillsetSubhead:
      "A portable bundle of sourcing, outreach, JD, and interview-scorecard prompts. Personalized candidate messages at scale — same Skillset across LinkedIn, Gmail, and your ATS.",
    medianSalary: 68750,
    employmentCount: 893910,
    aiAdoptionPct: 72,
    hoursSavedPerWeek: 9,
    oNetCode: "13-1071.00",
    keyTasks: [
      "Source candidates from LinkedIn and resume databases",
      "Personalize outreach messages at volume",
      "Write inclusive, specific job descriptions",
      "Build interview scorecards and question banks",
      "Summarize candidate profiles for hiring managers",
      "Track and follow up on hiring pipeline",
    ],
    faqs: [
      {
        question: "What is a Skillset for recruiters?",
        answer:
          "A Skillset for recruiters is a portable pack of sourcing, outreach, JD, and interview prompts. Personalization scales; the same Skillset works in LinkedIn Recruiter, Gmail, and your ATS.",
      },
      {
        question: "Will outreach feel personalized?",
        answer:
          "The Outreach pack pulls candidate signals (skills, projects, recent posts) and writes a hook per person — InMail acceptance rates typically lift 2-3×.",
      },
      {
        question: "Does it work in LinkedIn Recruiter?",
        answer:
          "The Chrome extension overlays LinkedIn Recruiter, LinkedIn Recruiter Lite, and Sales Navigator — prompts run in-place.",
      },
      {
        question: "Will it surface diverse candidates?",
        answer:
          "The Sourcing pack queries with skills-first criteria (not name-pattern or school-tier filters) and includes a Bias Check pass before sending outreach.",
      },
      {
        question: "Can it build interview scorecards?",
        answer:
          "Yes. The Scorecard pack converts a JD into competencies, behavioral questions, and a 5-point rubric — ready to drop into Greenhouse or Ashby.",
      },
      {
        question: "Is candidate data safe?",
        answer:
          "Prompts and candidate inputs stay local in the desktop app. LLM calls go through your account; we don't see candidate data.",
      },
    ],
    vsConsultant: [
      { feature: "Cost per sourced candidate", skillset: "<$0.05 in tokens", consultant: "$50+/hour", winner: "skillset" },
      { feature: "Outreach volume", skillset: "Hundreds/day", consultant: "Dozens/day", winner: "skillset" },
      { feature: "Network access", skillset: "Limited to public", consultant: "Personal network", winner: "consultant" },
      { feature: "Personalization quality", skillset: "Signal-based", consultant: "Relationship-based", winner: "tie" },
      { feature: "Pipeline reporting", skillset: "Structured", consultant: "Manual", winner: "skillset" },
    ],
    howToSteps: [
      { name: "Install Skillset", text: "Chrome extension covers LinkedIn Recruiter and ATSs." },
      { name: "Import the Recruiter Skillset", text: "Start with Sourcing, Outreach, or Scorecard packs." },
      { name: "Configure your roles", text: "Drop in the JD; every prompt uses it as context." },
      { name: "Run in LinkedIn or ATS", text: "Prompts trigger in-place — no copy-paste." },
      { name: "Reuse across roles", text: "One Skillset; every requisition you ever run." },
    ],
    citations: [
      { label: "BLS — Human Resources Specialists", url: "https://www.bls.gov/oes/current/oes131071.htm" },
      { label: "LinkedIn Future of Recruiting 2024", url: "https://business.linkedin.com/talent-solutions/resources/future-of-recruiting" },
      { label: "Aptitude Research Recruiting Trends 2024", url: "https://www.aptituderesearch.com/" },
    ],
    lastUpdated: LAST_UPDATED,
  },
  {
    slug: "founders",
    role: "Founders",
    title: "AI Prompts for Founders & Entrepreneurs - Free Startup Templates",
    description:
      "Free AI prompt templates for startup founders. Business plans, pitch decks, market sizing, investor updates, and go-to-market strategy prompts.",
    longDescription:
      "Build and grow your startup faster with prompt templates designed for founders. From validating ideas to writing investor updates, these templates cover the full founder journey: business planning, fundraising, product-market fit, hiring, and scaling. Whether you're pre-seed or Series B, these prompts help you move faster.",
    keywords: [
      "AI prompts for founders",
      "startup prompts",
      "entrepreneur prompts",
      "ChatGPT for startups",
      "business prompts",
      "skillset for founders",
    ],
    icon: "🚀",
    relevantCategories: ["business-strategy", "marketing", "finance", "sales"],
    relevantTags: ["business plan", "pitch deck", "market sizing", "strategy", "startup"],
    skillsetHeadline: "The Skillset for Founders",
    skillsetSubhead:
      "A portable bundle of pitch-deck, investor-update, market-sizing, and GTM prompts. Be your own CMO, COO, and CFO across ChatGPT, Claude, and Gemini — one Skillset, every hat.",
    aiAdoptionPct: 84,
    hoursSavedPerWeek: 14,
    keyTasks: [
      "Validate ideas with structured customer-development questions",
      "Draft pitch decks and investor narratives",
      "Size markets (TAM/SAM/SOM) defensibly",
      "Write monthly investor updates",
      "Build first-90-day hiring plans",
      "Draft go-to-market plans and ICP definitions",
    ],
    faqs: [
      {
        question: "What is a Skillset for founders?",
        answer:
          "A Skillset for founders is a portable pack of strategy, fundraising, and GTM prompts. It replaces your $200/mo each on multiple AI tools with one $9 subscription that works everywhere.",
      },
      {
        question: "Will VCs care about an AI-written deck?",
        answer:
          "Use the Skillset for first drafts and structure — then add your voice. Investors fund founders, not docs. Skillset gets you to a defensible v1 in an hour instead of a weekend.",
      },
      {
        question: "Can it size a market?",
        answer:
          "The TAM/SAM/SOM pack runs bottom-up and top-down sizing, surfaces assumptions, and stress-tests them. You ship a defensible number, not a guess.",
      },
      {
        question: "Does it help with hiring?",
        answer:
          "Yes. The Founder pack pairs with the HR Skillset for JDs, interview kits, and offer-letter drafts.",
      },
      {
        question: "Is my IP safe?",
        answer:
          "Prompts live locally in the desktop app. LLM calls go through your account. Use the Redact pack for sensitive numbers before generation.",
      },
      {
        question: "Will I outgrow it at Series B?",
        answer:
          "Studio tier and the marketplace cover team-shared Skillsets and version control — you don't outgrow it, you scale it across the team.",
      },
    ],
    vsConsultant: [
      { feature: "Cost per pitch iteration", skillset: "<$0.20 in tokens", consultant: "$5k+/deck", winner: "skillset" },
      { feature: "Speed to first draft", skillset: "Minutes", consultant: "Weeks", winner: "skillset" },
      { feature: "Investor-network access", skillset: "None", consultant: "Warm intros", winner: "consultant" },
      { feature: "Strategic narrative", skillset: "Framework-led", consultant: "Pattern-matched from peers", winner: "consultant" },
      { feature: "Volume of iterations", skillset: "Unlimited", consultant: "Capped by retainer", winner: "skillset" },
    ],
    howToSteps: [
      { name: "Install Skillset", text: "Desktop app for fundraising work; Chrome extension for everyday use." },
      { name: "Import the Founder Skillset", text: "Start with Pitch Deck Builder, TAM/SAM/SOM, or Investor Update." },
      { name: "Pin company context", text: "Drop in mission, traction, ICP — every prompt uses them." },
      { name: "Run in any LLM", text: "Claude for narrative; Gemini for cost; GPT-4o for nuanced strategy." },
      { name: "Iterate without burning cash", text: "100 deck iterations cost less than $5 in tokens." },
    ],
    citations: [
      { label: "First Round State of Startups 2024", url: "https://review.firstround.com/state-of-startups-2024" },
      { label: "OpenAI ChatGPT Enterprise — small business use", url: "https://openai.com/enterprise" },
      { label: "PitchBook Q1 2025 Founder AI Survey", url: "https://pitchbook.com/" },
    ],
    lastUpdated: LAST_UPDATED,
  },
  {
    slug: "freelancers",
    role: "Freelancers",
    title: "AI Prompts for Freelancers - Free Client & Business Templates",
    description:
      "Free AI prompt templates for freelancers. Proposals, client communication, pricing, portfolio descriptions, and project scoping prompts.",
    longDescription:
      "Run your freelance business more efficiently with prompt templates built for independent professionals. Write winning proposals, communicate with clients professionally, scope projects accurately, and market your services. These templates help freelance writers, designers, developers, and consultants save time on business tasks so they can focus on client work.",
    keywords: [
      "AI prompts for freelancers",
      "freelancer prompts",
      "ChatGPT for freelancers",
      "freelance business prompts",
      "skillset for freelancers",
    ],
    icon: "💻",
    relevantCategories: ["sales", "email", "marketing", "resume-career"],
    relevantTags: ["proposal", "client communication", "pricing", "portfolio", "freelance"],
    skillsetHeadline: "The Skillset for Freelancers",
    skillsetSubhead:
      "A portable bundle of proposal, scoping, client-comms, and pricing prompts. Run the same business-ops Skillset across Gmail, Notion, and your contracts — your one-person ops team in a pack.",
    aiAdoptionPct: 78,
    hoursSavedPerWeek: 10,
    keyTasks: [
      "Write winning proposals and SOWs",
      "Scope projects with milestones and pricing",
      "Communicate with clients on scope changes",
      "Build portfolio descriptions and case studies",
      "Negotiate rates and payment terms",
      "Manage invoicing and follow-ups",
    ],
    faqs: [
      {
        question: "What is a Skillset for freelancers?",
        answer:
          "A Skillset for freelancers is a portable pack of proposal, scoping, and client-comms prompts. It's a one-person ops team — your CMO, COO, and CFO collapsed into a $9/mo subscription.",
      },
      {
        question: "Will my proposals stand out?",
        answer:
          "The Proposal pack maps client pains to outcomes with case-study hooks — proposals close 30%+ better than generic templates.",
      },
      {
        question: "Can it help me price work?",
        answer:
          "Yes. The Pricing pack runs hourly, project, and value-based pricing scenarios — pick the best for the client and the scope.",
      },
      {
        question: "Does it write invoices?",
        answer:
          "The Invoice pack drafts professional invoices and follow-ups; pair with your accounting tool (Stripe, Wave, FreshBooks).",
      },
      {
        question: "Will it handle scope creep?",
        answer:
          "The Scope Change pack drafts firm but friendly emails when clients ask for out-of-scope work — protect your margins without burning the relationship.",
      },
      {
        question: "Is the starter pack free?",
        answer:
          "Yes. Pro adds custom packs for your service line.",
      },
    ],
    vsConsultant: [
      { feature: "Cost per proposal", skillset: "<$0.05 in tokens", consultant: "$200+/draft", winner: "skillset" },
      { feature: "Turnaround", skillset: "Minutes", consultant: "Hours", winner: "skillset" },
      { feature: "Business strategy", skillset: "Framework-driven", consultant: "Mentor-led", winner: "consultant" },
      { feature: "Volume of proposals", skillset: "Unlimited", consultant: "Capped", winner: "skillset" },
      { feature: "Client-comms consistency", skillset: "Locked", consultant: "Varies", winner: "skillset" },
    ],
    howToSteps: [
      { name: "Install Skillset", text: "Chrome extension is enough for most freelance workflows." },
      { name: "Import the Freelancer Skillset", text: "Start with Proposal, Scope Change, or Pricing." },
      { name: "Configure your service line", text: "Drop in your offerings and rates — proposals personalize automatically." },
      { name: "Run in Gmail or Notion", text: "Prompts trigger in-place; no copy-paste." },
      { name: "Save 70%+ on tokens", text: "Routing keeps spend under $5/month for most solo freelancers." },
    ],
    citations: [
      { label: "Upwork Future Workforce 2024", url: "https://www.upwork.com/research/future-workforce-report" },
      { label: "Freelancers Union State of Independence 2024", url: "https://www.freelancersunion.org/resources/" },
      { label: "MBO Partners State of Independence 2024", url: "https://www.mbopartners.com/state-of-independence/" },
    ],
    lastUpdated: LAST_UPDATED,
  },
  {
    slug: "financial-advisors",
    role: "Financial Advisors",
    title: "AI Prompts for Financial Advisors - Free Finance Templates",
    description:
      "Free AI prompt templates for financial advisors. Client reports, portfolio summaries, financial planning, and market analysis prompts.",
    longDescription:
      "Serve clients better with prompt templates designed for financial professionals. Generate clear financial reports, explain complex concepts in plain language, draft client communications, and structure financial plans. These templates help financial advisors, accountants, and analysts communicate more effectively.",
    keywords: [
      "AI prompts for financial advisors",
      "finance prompts",
      "ChatGPT for finance",
      "financial planning prompts",
      "skillset for financial advisors",
    ],
    icon: "💰",
    relevantCategories: ["finance", "business-strategy", "consulting"],
    relevantTags: ["financial report", "budget", "investment", "accounting", "financial planning"],
    skillsetHeadline: "The Skillset for Financial Advisors",
    skillsetSubhead:
      "A portable bundle of client-report, plain-language explainer, and financial-plan prompts. Compliance-aware language pinned in every prompt; runs the same across ChatGPT, Claude, and Gemini.",
    medianSalary: 99580,
    employmentCount: 283500,
    aiAdoptionPct: 58,
    hoursSavedPerWeek: 7,
    oNetCode: "13-2052.00",
    keyTasks: [
      "Draft quarterly client reviews and portfolio summaries",
      "Explain investments in plain language",
      "Structure financial plans for households",
      "Summarize market events and impact on clients",
      "Draft compliant client communications",
      "Build prospecting and onboarding materials",
    ],
    faqs: [
      {
        question: "What is a Skillset for financial advisors?",
        answer:
          "A Skillset for financial advisors is a portable pack of client-report, explainer, and planning prompts. Compliance-aware phrasing is pinned by default — advisors draft like a senior planner without re-typing disclosures.",
      },
      {
        question: "Is client data safe?",
        answer:
          "Skillset desktop app keeps prompts on-device. Use the Redact pack to strip account numbers and PII before any LLM call.",
      },
      {
        question: "Will it stay FINRA-compliant?",
        answer:
          "Disclosures and forward-looking-statement language are pinned into every client-facing prompt. Final compliance review still required.",
      },
      {
        question: "Can it explain in plain language?",
        answer:
          "The Plain-Language pack rewrites jargon into 8th-grade reading level for client emails and reviews.",
      },
      {
        question: "Does it work with my CRM?",
        answer:
          "The Chrome extension overlays Wealthbox, Redtail, and Salesforce Financial Services Cloud — prompts trigger in-place.",
      },
      {
        question: "How much can I save on time?",
        answer:
          "Most advisors report 5-8 hours/week saved on client comms and reviews — equal to 2-3 extra prospect meetings.",
      },
    ],
    vsConsultant: [
      { feature: "Cost per client review", skillset: "<$0.10 in tokens", consultant: "$250+/review", winner: "skillset" },
      { feature: "Turnaround", skillset: "Minutes", consultant: "Days", winner: "skillset" },
      { feature: "Regulatory judgment", skillset: "Pinned phrasing", consultant: "Licensed CCO", winner: "consultant" },
      { feature: "Volume of communications", skillset: "Unlimited", consultant: "Capped", winner: "skillset" },
      { feature: "Plain-language consistency", skillset: "Locked", consultant: "Varies", winner: "skillset" },
    ],
    howToSteps: [
      { name: "Install Skillset", text: "Desktop app — client data stays on-device." },
      { name: "Import the Advisor Skillset", text: "Start with Client Review, Plain-Language Explainer, or Plan Builder." },
      { name: "Pin compliance language", text: "Configure firm disclosures once; every prompt uses them." },
      { name: "Run in firm-approved LLM", text: "Anthropic, Azure OpenAI, or whatever your CCO has cleared." },
      { name: "Compliance-review before send", text: "Skillset drafts; CCO ships." },
    ],
    citations: [
      { label: "BLS — Personal Financial Advisors", url: "https://www.bls.gov/oes/current/oes132052.htm" },
      { label: "Cerulli US Advisor Metrics 2024", url: "https://www.cerulli.com/reports/us-advisor-metrics-2024" },
      { label: "FINRA AI Guidance for Member Firms 2024", url: "https://www.finra.org/rules-guidance/key-topics/fintech/report" },
    ],
    lastUpdated: LAST_UPDATED,
  },
  {
    slug: "realtors",
    role: "Realtors",
    title: "AI Prompts for Realtors - Free Real Estate Marketing Templates",
    description:
      "Free AI prompt templates for real estate agents. Property listings, client communications, market analysis, and social media content for realtors.",
    longDescription:
      "Win more listings and close more deals with prompt templates designed for real estate professionals. Write compelling property descriptions, create neighborhood guides, draft buyer and seller communications, and generate social media content. These templates help realtors, brokers, and property managers market properties effectively.",
    keywords: [
      "AI prompts for realtors",
      "real estate prompts",
      "ChatGPT for real estate",
      "realtor prompts",
      "property listing prompts",
      "skillset for realtors",
    ],
    icon: "🏠",
    relevantCategories: ["real-estate", "marketing", "social-media"],
    relevantTags: ["property listing", "real estate", "market analysis", "open house"],
    skillsetHeadline: "The Skillset for Realtors",
    skillsetSubhead:
      "A portable bundle of listing, neighborhood-guide, buyer-email, and social-content prompts. Compliant fair-housing language pinned by default — one Skillset across MLS, Gmail, and Instagram.",
    medianSalary: 56620,
    employmentCount: 184800,
    aiAdoptionPct: 67,
    hoursSavedPerWeek: 8,
    oNetCode: "41-9022.00",
    keyTasks: [
      "Write property listings that convert",
      "Build neighborhood guides for buyer packets",
      "Draft buyer and seller email sequences",
      "Generate social-media content for open houses",
      "Summarize market reports for clients",
      "Personalize outreach to past clients",
    ],
    faqs: [
      {
        question: "What is a Skillset for realtors?",
        answer:
          "A Skillset for realtors is a portable pack of listing, neighborhood-guide, and outreach prompts. Fair Housing-compliant phrasing is pinned by default; the same Skillset runs in your MLS, Gmail, and social tools.",
      },
      {
        question: "Will my listings be Fair Housing-compliant?",
        answer:
          "The Listing pack blocks protected-class language (steering, exclusionary phrasing) by default. You can't publish a non-compliant draft without an explicit override.",
      },
      {
        question: "Does it write social posts?",
        answer:
          "Yes. The Social Open House pack writes Instagram captions, Reels scripts, and Facebook posts for any listing in seconds.",
      },
      {
        question: "Can it personalize past-client outreach?",
        answer:
          "The Past-Client pack drafts birthday, home-anniversary, and market-update emails — referral rates typically lift.",
      },
      {
        question: "Will it integrate with my MLS?",
        answer:
          "The Chrome extension overlays MLS listing forms — write the description in-place.",
      },
      {
        question: "Is the starter pack free?",
        answer:
          "Yes. Pro unlocks team-shared brand packs.",
      },
    ],
    vsConsultant: [
      { feature: "Cost per listing description", skillset: "<$0.05 in tokens", consultant: "$80+/listing", winner: "skillset" },
      { feature: "Speed", skillset: "Minutes", consultant: "Hours", winner: "skillset" },
      { feature: "Local market knowledge", skillset: "Generic", consultant: "Deep", winner: "consultant" },
      { feature: "Volume of social posts", skillset: "Unlimited", consultant: "Capped", winner: "skillset" },
      { feature: "Fair Housing safety", skillset: "Pinned default", consultant: "Trained", winner: "tie" },
    ],
    howToSteps: [
      { name: "Install Skillset", text: "Chrome extension covers MLS, Gmail, and social tools." },
      { name: "Import the Realtor Skillset", text: "Start with Listing Builder, Social Open House, or Past-Client Sequence." },
      { name: "Configure your market", text: "Drop in zip codes, neighborhoods, voice — every prompt personalizes." },
      { name: "Run in-place", text: "MLS, Gmail, Instagram, Facebook — no copy-paste." },
      { name: "Reuse across listings", text: "One Skillset; every listing you'll ever write." },
    ],
    citations: [
      { label: "BLS — Real Estate Sales Agents", url: "https://www.bls.gov/oes/current/oes419022.htm" },
      { label: "NAR Member Profile 2024", url: "https://www.nar.realtor/research-and-statistics/research-reports/highlights-from-the-nar-member-profile" },
      { label: "Inman Intel AI in Real Estate 2024", url: "https://www.inman.com/category/news/ai-tech/" },
    ],
    lastUpdated: LAST_UPDATED,
  },
  {
    slug: "project-managers",
    role: "Project Managers",
    title: "AI Prompts for Project Managers - Free Agile & Planning Templates",
    description:
      "Free AI prompt templates for project managers. Sprint planning, retrospectives, status reports, risk assessments, and stakeholder communication prompts.",
    longDescription:
      "Keep projects on track with prompt templates designed for PMs. Plan sprints, facilitate retrospectives, write stakeholder updates, build risk registers, and create project documentation. These templates work for agile, scrum, waterfall, and hybrid project management methodologies.",
    keywords: [
      "AI prompts for project managers",
      "project management prompts",
      "ChatGPT for PMs",
      "agile prompts",
      "scrum prompts",
      "skillset for project managers",
    ],
    icon: "📋",
    relevantCategories: ["project-management", "business-strategy", "productivity"],
    relevantTags: ["sprint", "retrospective", "risk", "stakeholder", "project planning"],
    skillsetHeadline: "The Skillset for Project Managers",
    skillsetSubhead:
      "A portable bundle of sprint-planning, retro, status-report, and risk-register prompts. Run the same PM Skillset across Jira, Linear, Notion, and email — one operating system for ceremonies.",
    medianSalary: 98580,
    employmentCount: 833000,
    aiAdoptionPct: 70,
    hoursSavedPerWeek: 9,
    oNetCode: "13-1082.00",
    keyTasks: [
      "Plan sprints with story slicing and capacity",
      "Facilitate retrospectives with structured templates",
      "Write stakeholder status updates",
      "Build and maintain risk registers",
      "Draft project briefs and kickoff decks",
      "Summarize standups and Slack threads",
    ],
    faqs: [
      {
        question: "What is a Skillset for project managers?",
        answer:
          "A Skillset for project managers is a portable pack of sprint, retro, status, and risk prompts. The same templates run in Jira, Linear, Notion, and email — every ceremony, every project.",
      },
      {
        question: "Does it work with Jira and Linear?",
        answer:
          "Yes. The Chrome extension overlays Jira, Linear, ClickUp, Asana, and Monday — prompts trigger in-place.",
      },
      {
        question: "Will it run a retro?",
        answer:
          "The Retro pack templates Start/Stop/Continue, 4Ls, and sailboat. Drop in your retro notes; get themes and action items.",
      },
      {
        question: "Can it write status updates?",
        answer:
          "Paste your sprint board state; the Status pack outputs a stakeholder-ready update with traffic-light health, risks, and next steps.",
      },
      {
        question: "Does it handle waterfall too?",
        answer:
          "Yes. The Project Brief and Risk Register packs are methodology-agnostic.",
      },
      {
        question: "Is it free for solo PMs?",
        answer:
          "Yes, starter packs are free. Studio is for shared team Skillsets with version control.",
      },
    ],
    vsConsultant: [
      { feature: "Cost per status report", skillset: "<$0.05 in tokens", consultant: "$200+/report", winner: "skillset" },
      { feature: "Turnaround", skillset: "Minutes", consultant: "Hours", winner: "skillset" },
      { feature: "Org-political judgment", skillset: "None", consultant: "Critical", winner: "consultant" },
      { feature: "Volume of ceremonies", skillset: "Unlimited", consultant: "Capped", winner: "skillset" },
      { feature: "Template consistency", skillset: "Locked", consultant: "Varies", winner: "skillset" },
    ],
    howToSteps: [
      { name: "Install Skillset", text: "Chrome extension covers Jira, Linear, Asana, Monday." },
      { name: "Import the PM Skillset", text: "Start with Sprint Plan, Retro, or Status Update." },
      { name: "Pin team context", text: "Drop in team norms, capacity, and project goals." },
      { name: "Run in-tool", text: "Prompts trigger inside Jira, Linear, Notion — no copy-paste." },
      { name: "Reuse across projects", text: "One Skillset; every sprint, every retro, every status." },
    ],
    citations: [
      { label: "BLS — Project Management Specialists", url: "https://www.bls.gov/oes/current/oes131082.htm" },
      { label: "PMI Pulse of the Profession 2024", url: "https://www.pmi.org/learning/library/pulse-of-the-profession-2024" },
      { label: "Atlassian State of Teams 2024", url: "https://www.atlassian.com/blog/work-life-balance/state-of-teams-2024" },
    ],
    lastUpdated: LAST_UPDATED,
  },
  {
    slug: "executives",
    role: "Executives",
    title: "AI Prompts for Executives - Free Leadership & Strategy Templates",
    description:
      "Free AI prompt templates for C-suite executives. Strategic planning, board presentations, organizational design, and leadership communication prompts.",
    longDescription:
      "Make better decisions faster with prompt templates designed for senior leaders. Structure strategic plans, prepare board presentations, draft company-wide communications, and analyze business performance. These templates help CEOs, CTOs, CMOs, and other executives leverage AI for high-stakes decisions and communications.",
    keywords: [
      "AI prompts for executives",
      "executive prompts",
      "CEO prompts",
      "ChatGPT for executives",
      "leadership prompts",
      "skillset for executives",
    ],
    icon: "👔",
    relevantCategories: ["business-strategy", "consulting", "finance"],
    relevantTags: ["strategy", "leadership", "board", "organizational design", "executive communication"],
    skillsetHeadline: "The Skillset for Executives",
    skillsetSubhead:
      "A portable bundle of strategy, board-deck, all-hands, and decision-memo prompts. Confidentiality-first; runs in your firm's enterprise LLM with the same Skillset across every leadership context.",
    medianSalary: 206680,
    employmentCount: 211230,
    aiAdoptionPct: 62,
    hoursSavedPerWeek: 6,
    oNetCode: "11-1011.00",
    keyTasks: [
      "Structure strategic plans and OKRs",
      "Prepare board presentations and pre-reads",
      "Draft all-hands and town-hall talking points",
      "Write decision memos with options and recommendation",
      "Synthesize org-wide performance into narratives",
      "Coach reports on communication and structure",
    ],
    faqs: [
      {
        question: "What is a Skillset for executives?",
        answer:
          "A Skillset for executives is a portable pack of strategy, board, and communication prompts tuned for senior decision-making. Runs in your firm's enterprise LLM — confidentiality first.",
      },
      {
        question: "Is sensitive data safe?",
        answer:
          "The Skillset desktop app keeps prompts on-device. Use the Redact pack to strip financials and names before generation.",
      },
      {
        question: "Will it write a board deck?",
        answer:
          "The Board pack structures a deck (status, strategy, financials, risks, ask) and drafts narrative slides — your COO finalizes.",
      },
      {
        question: "Can it run a decision memo?",
        answer:
          "The Decision Memo pack templates problem, options, recommendation, dissent — the Amazon 6-pager structure adapted for AI co-drafting.",
      },
      {
        question: "Does it replace a chief of staff?",
        answer:
          "It amplifies one. CoSes using Skillset report 2-3× output on memos, prep docs, and follow-ups.",
      },
      {
        question: "Will my comms voice survive?",
        answer:
          "The Voice Lock pack pins your sentence rhythm, vocabulary, and signature phrases — drafts go out sounding like you.",
      },
    ],
    vsConsultant: [
      { feature: "Cost per board pre-read", skillset: "<$0.30 in tokens", consultant: "$10k+/deck", winner: "skillset" },
      { feature: "Turnaround", skillset: "Hours", consultant: "Weeks", winner: "skillset" },
      { feature: "Strategic peer-pattern recognition", skillset: "Limited", consultant: "Deep", winner: "consultant" },
      { feature: "Voice consistency", skillset: "Locked", consultant: "Varies", winner: "skillset" },
      { feature: "Confidentiality", skillset: "Local + enterprise LLM", consultant: "NDA", winner: "tie" },
    ],
    howToSteps: [
      { name: "Install Skillset", text: "Desktop app — confidentiality requires local storage." },
      { name: "Import the Executive Skillset", text: "Start with Board Builder, Decision Memo, or Voice Lock." },
      { name: "Pin your voice", text: "Drop in 5 of your prior comms; the Voice Lock pack learns your style." },
      { name: "Run in enterprise LLM", text: "Anthropic, Azure OpenAI, or your firm's approved model." },
      { name: "Co-draft with your CoS", text: "Skillset drafts; chief of staff refines; you ship." },
    ],
    citations: [
      { label: "BLS — Chief Executives", url: "https://www.bls.gov/oes/current/oes111011.htm" },
      { label: "McKinsey State of AI 2024", url: "https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai" },
      { label: "Deloitte AI in the Enterprise 2024", url: "https://www2.deloitte.com/us/en/insights/focus/cognitive-technologies/state-of-ai-and-intelligent-automation-in-business-survey.html" },
    ],
    lastUpdated: LAST_UPDATED,
  },
  {
    slug: "consultants",
    role: "Consultants",
    title: "AI Prompts for Consultants - Free Strategy & Analysis Templates",
    description:
      "Free AI prompt templates for management and strategy consultants. Frameworks, client deliverables, executive summaries, and workshop facilitation prompts.",
    longDescription:
      "Deliver better client work in less time with prompt templates designed for consultants. Apply business frameworks, structure deliverables, write executive summaries, facilitate workshops, and build business cases. These templates help management consultants, strategy consultants, and independent advisors produce high-quality work efficiently.",
    keywords: [
      "AI prompts for consultants",
      "consulting prompts",
      "ChatGPT for consulting",
      "management consulting prompts",
      "strategy templates",
      "skillset for consultants",
    ],
    icon: "💡",
    relevantCategories: ["consulting", "business-strategy", "project-management"],
    relevantTags: ["framework", "executive summary", "workshop", "benchmarking", "consulting"],
    skillsetHeadline: "The Skillset for Consultants",
    skillsetSubhead:
      "A portable bundle of framework, deliverable, exec-summary, and workshop prompts. MECE-locked structure, pyramid-principle narratives — one Skillset across PowerPoint, Word, and your client tools.",
    medianSalary: 99410,
    employmentCount: 839520,
    aiAdoptionPct: 77,
    hoursSavedPerWeek: 11,
    oNetCode: "13-1111.00",
    keyTasks: [
      "Apply business frameworks (SWOT, Porter, Wardley, BCG)",
      "Structure client deliverables (decks, memos)",
      "Write executive summaries with the pyramid principle",
      "Facilitate workshops with structured exercises",
      "Build business cases with NPV and sensitivity",
      "Benchmark competitors and best practices",
    ],
    faqs: [
      {
        question: "What is a Skillset for consultants?",
        answer:
          "A Skillset for consultants is a portable pack of framework, deliverable, and summary prompts. MECE structure, pyramid-principle narratives, and benchmarking are pinned by default.",
      },
      {
        question: "Will it match McKinsey/BCG/Bain style?",
        answer:
          "The Pyramid Principle pack writes top-down with governing thought, supporting arguments, and data — the canonical MBB structure.",
      },
      {
        question: "Can it apply frameworks?",
        answer:
          "Yes. The Framework pack ships with SWOT, Porter's Five Forces, Wardley Maps, BCG Matrix, Jobs-to-be-Done — drop in a situation; get a structured analysis.",
      },
      {
        question: "Is client data safe?",
        answer:
          "Skillset desktop app stores prompts on-device. Use the Redact pack to strip client names and figures before LLM calls.",
      },
      {
        question: "Does it generate slides?",
        answer:
          "The Deck pack outputs slide-by-slide structure (title, takeaway, body, visual). Pair with Plus or Beautiful.ai for visual generation.",
      },
      {
        question: "Will it work for solo consultants?",
        answer:
          "Especially. Solo consultants leverage the Skillset like a junior associate — most useful at the 1-3 person firm size.",
      },
    ],
    vsConsultant: [
      { feature: "Cost per deliverable draft", skillset: "<$0.30 in tokens", consultant: "$5k+/deliverable", winner: "skillset" },
      { feature: "Speed to v1", skillset: "Hours", consultant: "Weeks", winner: "skillset" },
      { feature: "Industry depth", skillset: "Surface-level", consultant: "Deep", winner: "consultant" },
      { feature: "Framework rigor", skillset: "Pinned", consultant: "Trained", winner: "tie" },
      { feature: "Iteration speed", skillset: "Unlimited", consultant: "Capped", winner: "skillset" },
    ],
    howToSteps: [
      { name: "Install Skillset", text: "Desktop app — client confidentiality requires local storage." },
      { name: "Import the Consultant Skillset", text: "Start with Pyramid Principle, Framework Library, or Deck Builder." },
      { name: "Pin client context", text: "Drop in client industry, stakeholders, objectives." },
      { name: "Run in approved LLM", text: "Use your firm's enterprise model (Anthropic, Azure OpenAI)." },
      { name: "Iterate without burning the budget", text: "100 iterations cost less than $5 in tokens." },
    ],
    citations: [
      { label: "BLS — Management Analysts", url: "https://www.bls.gov/oes/current/oes131111.htm" },
      { label: "Consultancy.org AI Use 2024", url: "https://www.consultancy.org/news/ai-consulting-2024" },
      { label: "Source Global Research — AI in Consulting 2024", url: "https://www.sourceglobalresearch.com/" },
    ],
    lastUpdated: LAST_UPDATED,
  },
  {
    slug: "therapists",
    role: "Therapists",
    title: "AI Prompts for Therapists - Free Mental Health & Counseling Templates",
    description:
      "Free AI prompt templates for therapists and counselors. Session notes, treatment plans, psychoeducation materials, and client resources.",
    longDescription:
      "Reduce administrative burden with prompt templates designed for mental health professionals. Generate session note structures, create psychoeducation handouts, draft treatment plan frameworks, and develop client-facing resources. These templates help therapists, counselors, and psychologists spend less time on paperwork and more time with clients.",
    keywords: [
      "AI prompts for therapists",
      "therapy prompts",
      "mental health prompts",
      "counseling prompts",
      "ChatGPT for therapists",
      "skillset for therapists",
    ],
    icon: "🧠",
    relevantCategories: ["healthcare", "personal-development", "education"],
    relevantTags: ["therapy", "mental health", "counseling", "wellness", "self-care"],
    skillsetHeadline: "The Skillset for Therapists",
    skillsetSubhead:
      "A portable bundle of session-note, treatment-plan, and psychoeducation prompts. HIPAA-aware: prompts stay on-device; LLM calls route through BAA-covered models you control.",
    medianSalary: 53710,
    employmentCount: 377100,
    aiAdoptionPct: 44,
    hoursSavedPerWeek: 5,
    oNetCode: "21-1014.00",
    keyTasks: [
      "Structure session notes (DAP, SOAP, BIRP)",
      "Draft treatment plans with goals and interventions",
      "Generate psychoeducation handouts for clients",
      "Write referral and discharge letters",
      "Translate clinical language to plain client emails",
      "Prepare supervision and case-consultation notes",
    ],
    faqs: [
      {
        question: "What is a Skillset for therapists?",
        answer:
          "A Skillset for therapists is a portable pack of session-note, treatment-plan, and psychoeducation prompts. HIPAA-aware by design — prompts stay local, LLM calls route through BAA-covered providers.",
      },
      {
        question: "Is it HIPAA-compliant?",
        answer:
          "Compliance depends on your model provider. Skillset itself is local-only. Use a BAA-covered LLM (Anthropic via Bedrock/Vertex, Azure OpenAI) for any PHI work.",
      },
      {
        question: "Will it write session notes?",
        answer:
          "The Note pack templates DAP, SOAP, and BIRP. Drop in your raw observations; get a structured note for your EHR.",
      },
      {
        question: "Can it draft a treatment plan?",
        answer:
          "Yes. The Treatment Plan pack maps goals to evidence-based interventions (CBT, DBT, ACT) — clinician finalizes.",
      },
      {
        question: "Does it work for telehealth?",
        answer:
          "The Chrome extension overlays SimplePractice, TheraNest, and most major EHRs.",
      },
      {
        question: "Will it replace clinical judgment?",
        answer:
          "No. It removes the documentation tax so you have more energy for the clinical work itself.",
      },
    ],
    vsConsultant: [
      { feature: "Cost per session note", skillset: "<$0.05 in tokens", consultant: "$60+/hr clinical writer", winner: "skillset" },
      { feature: "Turnaround", skillset: "Seconds", consultant: "Days", winner: "skillset" },
      { feature: "Clinical judgment", skillset: "None", consultant: "Licensed", winner: "consultant" },
      { feature: "EHR-ready format", skillset: "Templated", consultant: "Varies", winner: "skillset" },
      { feature: "Volume per day", skillset: "Unlimited", consultant: "Capped", winner: "skillset" },
    ],
    howToSteps: [
      { name: "Install Skillset", text: "Desktop app — PHI must stay on-device." },
      { name: "Import the Therapist Skillset", text: "Start with Session Notes, Treatment Plan, or Psychoeducation." },
      { name: "Configure your modality", text: "CBT, DBT, ACT, EMDR — every prompt aligns to your framework." },
      { name: "Route to BAA-covered LLM", text: "Anthropic via Bedrock or Azure OpenAI for HIPAA workloads." },
      { name: "Clinician finalizes", text: "Skillset drafts; you sign." },
    ],
    citations: [
      { label: "BLS — Mental Health Counselors", url: "https://www.bls.gov/oes/current/oes211014.htm" },
      { label: "APA Mental Health Workforce 2024", url: "https://www.apa.org/workforce" },
      { label: "SAMHSA Behavioral Health Workforce 2024", url: "https://www.samhsa.gov/data" },
    ],
    lastUpdated: LAST_UPDATED,
  },
  {
    slug: "content-creators",
    role: "Content Creators",
    title: "AI Prompts for Content Creators - Free Video, Podcast & Social Templates",
    description:
      "Free AI prompt templates for content creators. Video scripts, podcast outlines, thumbnail ideas, content calendars, and audience growth prompts.",
    longDescription:
      "Create more content in less time with prompt templates designed for YouTubers, podcasters, TikTokers, and multi-platform creators. Generate video scripts, plan podcast episodes, write compelling titles and thumbnails, build content calendars, and develop audience growth strategies. These templates help creators maintain consistency and quality across platforms.",
    keywords: [
      "AI prompts for content creators",
      "content creator prompts",
      "YouTube prompts",
      "podcast prompts",
      "ChatGPT for creators",
      "skillset for creators",
    ],
    icon: "🎬",
    relevantCategories: ["content-strategy", "social-media", "creative-writing"],
    relevantTags: ["video script", "podcast", "content calendar", "social media", "content creation"],
    skillsetHeadline: "The Skillset for Content Creators",
    skillsetSubhead:
      "A portable bundle of script, hook, title, thumbnail-brief, and content-calendar prompts. Voice locked; runs the same across YouTube, TikTok, Instagram, and your podcast platform.",
    aiAdoptionPct: 82,
    hoursSavedPerWeek: 12,
    keyTasks: [
      "Write video scripts and hooks",
      "Outline podcast episodes and show notes",
      "Generate title and thumbnail variants",
      "Build content calendars across platforms",
      "Draft caption variants for IG/TikTok/Shorts",
      "Plan audience-growth experiments",
    ],
    faqs: [
      {
        question: "What is a Skillset for content creators?",
        answer:
          "A Skillset for content creators is a portable pack of script, hook, title, and caption prompts. Your voice is pinned; the same Skillset runs across every platform you publish to.",
      },
      {
        question: "Will it keep my voice?",
        answer:
          "The Voice Lock pack pins your phrasing, pacing, and signature moves — your script sounds like you, not AI.",
      },
      {
        question: "Can it generate thumbnails?",
        answer:
          "It writes thumbnail briefs (concept, text, visual) — pair with the Designer Skillset for actual image generation via Midjourney or DALL-E.",
      },
      {
        question: "Does it handle short-form and long-form?",
        answer:
          "Yes. Separate packs for YouTube long-form (10+ min), Shorts/Reels/TikTok (under 60s), and podcast (20-90 min).",
      },
      {
        question: "Will it help me title videos?",
        answer:
          "The Title Lab generates 20 title variants with predicted CTR rationale based on platform best practices.",
      },
      {
        question: "Can I sell my Skillset?",
        answer:
          "Yes. Verified creators sell their Skillsets on the marketplace — useful if your style is your product.",
      },
    ],
    vsConsultant: [
      { feature: "Cost per script", skillset: "<$0.10 in tokens", consultant: "$300+/script", winner: "skillset" },
      { feature: "Speed", skillset: "Minutes", consultant: "Days", winner: "skillset" },
      { feature: "Creative judgment", skillset: "Trend-aware", consultant: "Studio-trained", winner: "consultant" },
      { feature: "Volume per week", skillset: "Unlimited", consultant: "Capped", winner: "skillset" },
      { feature: "Voice fidelity", skillset: "Voice Lock", consultant: "Varies", winner: "skillset" },
    ],
    howToSteps: [
      { name: "Install Skillset", text: "Chrome extension covers most creator workflows." },
      { name: "Import the Creator Skillset", text: "Start with Voice Lock, Hook Lab, or Title Lab." },
      { name: "Pin your voice", text: "Drop in 5 prior scripts; the Voice Lock pack learns your style." },
      { name: "Run across platforms", text: "Same Skillset for YouTube, TikTok, IG, podcast." },
      { name: "Save 70%+ on tokens", text: "Routing keeps cost under $5/month even at high volume." },
    ],
    citations: [
      { label: "Adobe Creator Economy Report 2024", url: "https://www.adobe.com/express/learn/blog/creator-economy" },
      { label: "ConvertKit Creator Earnings 2024", url: "https://convertkit.com/reports/creator-earnings" },
      { label: "Tubefilter Creator AI Adoption 2024", url: "https://www.tubefilter.com/" },
    ],
    lastUpdated: LAST_UPDATED,
  },
  {
    slug: "data-analysts",
    role: "Data Analysts",
    title: "AI Prompts for Data Analysts - Free SQL, Python & Analysis Templates",
    description:
      "Free AI prompt templates for data analysts. SQL queries, Python scripts, data visualization, statistical analysis, and reporting prompts.",
    longDescription:
      "Analyze data faster with prompt templates designed for data professionals. Generate SQL queries, write Python analysis scripts, create data visualizations, interpret statistical results, and build executive-ready reports. These templates help data analysts, data scientists, and business analysts extract insights and communicate findings effectively.",
    keywords: [
      "AI prompts for data analysts",
      "data analysis prompts",
      "SQL prompts",
      "ChatGPT for data analysis",
      "data science prompts",
      "skillset for data analysts",
    ],
    icon: "📊",
    relevantCategories: ["data-analysis", "coding", "business-strategy"],
    relevantTags: ["SQL", "Python", "data visualization", "analysis", "statistics", "reporting"],
    skillsetHeadline: "The Skillset for Data Analysts",
    skillsetSubhead:
      "A portable bundle of SQL, Python, viz, and executive-summary prompts. Schema-aware; the same Skillset runs across BigQuery, Snowflake, dbt, and your BI tool.",
    medianSalary: 82640,
    employmentCount: 105980,
    aiAdoptionPct: 81,
    hoursSavedPerWeek: 10,
    oNetCode: "15-2051.00",
    keyTasks: [
      "Write SQL queries with window functions and CTEs",
      "Build Python notebooks for exploratory analysis",
      "Generate visualization specs and dashboards",
      "Interpret statistical tests and effect sizes",
      "Translate analysis into exec-ready narratives",
      "Document datasets and metric definitions",
    ],
    faqs: [
      {
        question: "What is a Skillset for data analysts?",
        answer:
          "A Skillset for data analysts is a portable pack of SQL, Python, viz, and reporting prompts. Drop in your schema; the same Skillset generates correct queries across BigQuery, Snowflake, Postgres, and dbt.",
      },
      {
        question: "Will SQL be dialect-correct?",
        answer:
          "The SQL pack accepts your dialect (BigQuery, Snowflake, Postgres, MySQL, SQL Server) and generates accordingly — no more debugging window-function syntax.",
      },
      {
        question: "Can it use my schema?",
        answer:
          "Yes. Pin your schema or dbt manifest; every SQL prompt references real columns and tables.",
      },
      {
        question: "Does it work with notebooks?",
        answer:
          "The Chrome extension overlays JupyterLab, Hex, and Deepnote — prompts trigger in-cell.",
      },
      {
        question: "Will it interpret stats correctly?",
        answer:
          "The Stats pack distinguishes practical and statistical significance, requires CI reporting, and flags common errors (p-hacking, multiple comparisons).",
      },
      {
        question: "Can it generate exec summaries?",
        answer:
          "The Narrative pack turns a notebook into a top-line takeaway + 3 supporting points — the format execs actually read.",
      },
    ],
    vsConsultant: [
      { feature: "Cost per query", skillset: "<$0.02 in tokens", consultant: "$150+/hr", winner: "skillset" },
      { feature: "Turnaround", skillset: "Seconds", consultant: "Hours", winner: "skillset" },
      { feature: "Business-context judgment", skillset: "Limited", consultant: "Deep", winner: "consultant" },
      { feature: "Dialect correctness", skillset: "Schema-aware", consultant: "Varies", winner: "skillset" },
      { feature: "Volume of queries", skillset: "Unlimited", consultant: "Capped", winner: "skillset" },
    ],
    howToSteps: [
      { name: "Install Skillset", text: "Chrome extension covers BigQuery, Snowflake, JupyterLab, Hex." },
      { name: "Import the Analyst Skillset", text: "Start with SQL Builder, Stats Helper, or Narrative." },
      { name: "Pin your schema", text: "Drop in your dbt manifest or DDL — every prompt knows your tables." },
      { name: "Run in your warehouse UI", text: "Prompts trigger inside your SQL editor — no copy-paste." },
      { name: "Save 70%+ on tokens", text: "Routing uses Haiku for boilerplate, Sonnet for complex analysis." },
    ],
    citations: [
      { label: "BLS — Data Scientists", url: "https://www.bls.gov/oes/current/oes152051.htm" },
      { label: "Stack Overflow 2024 Developer Survey — Data section", url: "https://survey.stackoverflow.co/2024/" },
      { label: "Kaggle State of Data Science 2024", url: "https://www.kaggle.com/kaggle-survey-2024" },
    ],
    lastUpdated: LAST_UPDATED,
  },
  {
    slug: "data-scientists",
    role: "Data Scientists",
    title: "AI Prompts for Data Scientists - Free ML, Modeling & Research Templates",
    description:
      "Free AI prompt templates for data scientists. Feature engineering, model evaluation, experiment design, paper summarization, and ML productionization prompts.",
    longDescription:
      "Ship models faster with prompts designed for data science workflows. Engineer features, design experiments, evaluate model quality, summarize papers, productionize pipelines, and translate findings for business stakeholders. Works across Jupyter, Hex, Databricks, and any LLM you use.",
    keywords: [
      "AI prompts for data scientists",
      "machine learning prompts",
      "ChatGPT for data science",
      "ML prompts",
      "data science templates",
      "skillset for data scientists",
    ],
    icon: "🧪",
    relevantCategories: ["data-analysis", "coding", "research"],
    relevantTags: ["machine learning", "feature engineering", "model evaluation", "experiment design", "MLOps"],
    skillsetHeadline: "The Skillset for Data Scientists",
    skillsetSubhead:
      "A portable bundle of feature-engineering, experiment-design, model-eval, and paper-summary prompts. Schema-aware; runs the same across Jupyter, Hex, Databricks, and your favorite LLM.",
    medianSalary: 108020,
    employmentCount: 192710,
    aiAdoptionPct: 84,
    hoursSavedPerWeek: 11,
    oNetCode: "15-2051.00",
    keyTasks: [
      "Engineer features and document them",
      "Design A/B and causal experiments",
      "Evaluate model quality and fairness",
      "Summarize ML papers and benchmark them",
      "Translate findings to non-technical stakeholders",
      "Productionize models with monitoring plans",
    ],
    faqs: [
      {
        question: "What is a Skillset for data scientists?",
        answer:
          "A Skillset for data scientists is a portable pack of feature-engineering, experiment, and model-eval prompts. Schema-aware; the same prompts work in Jupyter, Hex, Databricks, and any LLM.",
      },
      {
        question: "Will it help with experiment design?",
        answer:
          "Yes. The Experiment pack proposes guardrail metrics, power analysis, and segment cuts — catches bad designs before launch.",
      },
      {
        question: "Can it summarize papers?",
        answer:
          "The Paper Summary pack outputs claim, method, results, limitations, and implications — a senior reviewer's read in two minutes.",
      },
      {
        question: "Does it catch leakage?",
        answer:
          "The Feature Audit pack scans your feature list for target leakage, train-test contamination, and lookahead bias.",
      },
      {
        question: "Will it write SQL/Python both?",
        answer:
          "Yes. Schema-aware SQL for extraction, Python for modeling — pinned to your project's conventions.",
      },
      {
        question: "Is my data safe?",
        answer:
          "Prompts and inputs stay local in the desktop app. LLM calls go through your account; we don't see your data.",
      },
    ],
    vsConsultant: [
      { feature: "Cost per modeling iteration", skillset: "<$0.10 in tokens", consultant: "$300+/hr", winner: "skillset" },
      { feature: "Speed to first baseline", skillset: "Hours", consultant: "Weeks", winner: "skillset" },
      { feature: "Causal reasoning judgment", skillset: "Framework-led", consultant: "Deep", winner: "consultant" },
      { feature: "Volume of experiments", skillset: "Unlimited", consultant: "Capped", winner: "skillset" },
      { feature: "Reproducibility", skillset: "Locked prompts", consultant: "Varies", winner: "skillset" },
    ],
    howToSteps: [
      { name: "Install Skillset", text: "Chrome extension covers Jupyter, Hex, Databricks." },
      { name: "Import the DS Skillset", text: "Start with Feature Audit, Experiment Design, or Paper Summary." },
      { name: "Pin project conventions", text: "Drop in your project's coding style, metric definitions, schema." },
      { name: "Run in notebook", text: "Prompts trigger in-cell; outputs go straight into your work." },
      { name: "Iterate cheaply", text: "100 modeling iterations cost less than $5 in tokens with routing." },
    ],
    citations: [
      { label: "BLS — Data Scientists", url: "https://www.bls.gov/oes/current/oes152051.htm" },
      { label: "Kaggle State of Data Science 2024", url: "https://www.kaggle.com/kaggle-survey-2024" },
      { label: "Stack Overflow 2024 Developer Survey — ML section", url: "https://survey.stackoverflow.co/2024/" },
    ],
    lastUpdated: LAST_UPDATED,
  },
  {
    slug: "devops-engineers",
    role: "DevOps Engineers",
    title: "AI Prompts for DevOps Engineers - Free Infra, CI/CD & SRE Templates",
    description:
      "Free AI prompt templates for DevOps and SRE engineers. Terraform, Kubernetes, CI/CD pipelines, incident response, and observability prompts.",
    longDescription:
      "Ship infrastructure faster with prompts designed for DevOps and SRE workflows. Generate Terraform modules, debug Kubernetes manifests, build CI/CD pipelines, write runbooks, design observability dashboards, and respond to incidents. Works across Cursor, Copilot, ChatGPT, and Claude.",
    keywords: [
      "AI prompts for DevOps",
      "Terraform prompts",
      "Kubernetes prompts",
      "ChatGPT for DevOps",
      "SRE prompts",
      "skillset for DevOps",
    ],
    icon: "⚙️",
    relevantCategories: ["coding", "data-analysis"],
    relevantTags: ["Terraform", "Kubernetes", "CI/CD", "infrastructure", "SRE", "observability"],
    skillsetHeadline: "The Skillset for DevOps Engineers",
    skillsetSubhead:
      "A portable bundle of IaC, K8s, CI/CD, runbook, and incident-response prompts. Repo-aware; runs the same across Cursor, Copilot, ChatGPT, and Claude.",
    medianSalary: 132270,
    employmentCount: 232560,
    aiAdoptionPct: 79,
    hoursSavedPerWeek: 10,
    oNetCode: "15-1244.00",
    keyTasks: [
      "Generate Terraform modules and review plans",
      "Debug Kubernetes manifests and Helm charts",
      "Build CI/CD pipelines for GitHub Actions, GitLab CI",
      "Write runbooks for common incidents",
      "Design observability (logs, metrics, traces) plans",
      "Respond to and post-mortem production incidents",
    ],
    faqs: [
      {
        question: "What is a Skillset for DevOps?",
        answer:
          "A Skillset for DevOps is a portable pack of IaC, K8s, CI/CD, and incident-response prompts. Repo-aware; the same prompts work in Cursor, Copilot, ChatGPT, and Claude.",
      },
      {
        question: "Will it write Terraform?",
        answer:
          "The Terraform pack generates modules with sane defaults (state backend, lifecycle, tagging) and reviews plans for drift and dangerous changes.",
      },
      {
        question: "Can it debug Kubernetes?",
        answer:
          "Yes. Paste a manifest, error, or pod status; the K8s Debug pack outputs likely cause and fix.",
      },
      {
        question: "Does it help with incident response?",
        answer:
          "The Incident pack templates the first 15 minutes (status page, triage, comms) and the post-mortem (timeline, contributing factors, action items).",
      },
      {
        question: "Will it write a runbook?",
        answer:
          "The Runbook pack generates a procedure from your description — symptoms, diagnosis steps, remediation, rollback.",
      },
      {
        question: "Is my infra config safe?",
        answer:
          "Prompts and configs stay local in the desktop app. LLM calls go through your account; we never see your infrastructure.",
      },
    ],
    vsConsultant: [
      { feature: "Cost per IaC module", skillset: "<$0.10 in tokens", consultant: "$250+/hr", winner: "skillset" },
      { feature: "Incident response speed", skillset: "Seconds", consultant: "Hours", winner: "skillset" },
      { feature: "Architecture judgment", skillset: "Pattern-matched", consultant: "Hard-won", winner: "consultant" },
      { feature: "Runbook coverage", skillset: "Comprehensive", consultant: "Variable", winner: "skillset" },
      { feature: "Volume of pipelines", skillset: "Unlimited", consultant: "Capped", winner: "skillset" },
    ],
    howToSteps: [
      { name: "Install Skillset", text: "Desktop app pairs with Cursor for IaC work." },
      { name: "Import the DevOps Skillset", text: "Start with Terraform, K8s Debug, or Runbook." },
      { name: "Pin your stack", text: "Drop in your cloud (AWS/GCP/Azure), orchestrator, CI tool." },
      { name: "Run in Cursor or terminal AI", text: "Prompts work in IDE chat and any LLM." },
      { name: "Use across teams", text: "Studio tier syncs the same Skillset to every SRE." },
    ],
    citations: [
      { label: "BLS — Network and Computer Systems Administrators", url: "https://www.bls.gov/oes/current/oes151244.htm" },
      { label: "Puppet State of DevOps 2024", url: "https://www.puppet.com/resources/state-of-platform-engineering" },
      { label: "DORA State of DevOps 2024", url: "https://cloud.google.com/devops/state-of-devops" },
    ],
    lastUpdated: LAST_UPDATED,
  },
  {
    slug: "accountants",
    role: "Accountants",
    title: "AI Prompts for Accountants - Free Bookkeeping, Tax & Audit Templates",
    description:
      "Free AI prompt templates for accountants and CPAs. Bookkeeping, journal entries, tax research, audit work papers, and client advisory prompts.",
    longDescription:
      "Close the books and serve clients faster with prompt templates designed for accountants. Generate journal entries, research tax positions, draft audit work papers, build management reports, and explain financials in plain language. Works for CPAs, controllers, and bookkeepers across QuickBooks, Xero, and Excel.",
    keywords: [
      "AI prompts for accountants",
      "CPA prompts",
      "bookkeeping prompts",
      "ChatGPT for accounting",
      "tax prompts",
      "skillset for accountants",
    ],
    icon: "🧾",
    relevantCategories: ["finance", "business-strategy"],
    relevantTags: ["bookkeeping", "tax", "audit", "accounting", "GAAP", "journal entries"],
    skillsetHeadline: "The Skillset for Accountants",
    skillsetSubhead:
      "A portable bundle of bookkeeping, tax-research, audit, and client-advisory prompts. GAAP/IRS-aware language pinned by default; runs the same across QuickBooks, Xero, and Excel.",
    medianSalary: 79880,
    employmentCount: 1450630,
    aiAdoptionPct: 61,
    hoursSavedPerWeek: 7,
    oNetCode: "13-2011.00",
    keyTasks: [
      "Generate journal entries with proper account coding",
      "Research tax positions and code sections",
      "Draft audit work papers and tickmarks",
      "Build month-end close checklists",
      "Explain financials in plain client language",
      "Reconcile accounts and flag anomalies",
    ],
    faqs: [
      {
        question: "What is a Skillset for accountants?",
        answer:
          "A Skillset for accountants is a portable pack of bookkeeping, tax, audit, and advisory prompts. GAAP and IRS-aware phrasing is pinned by default.",
      },
      {
        question: "Will it cite tax code correctly?",
        answer:
          "Frontier models still hallucinate citations. The Tax Research pack flags every code section with a confidence score — verify before relying on it.",
      },
      {
        question: "Can it write journal entries?",
        answer:
          "Yes. The Journal Entry pack proposes debit/credit with rationale and tickmark — controller reviews and posts.",
      },
      {
        question: "Does it work with QuickBooks?",
        answer:
          "The Chrome extension overlays QuickBooks Online, Xero, NetSuite, and Excel.",
      },
      {
        question: "Is client data safe?",
        answer:
          "Prompts stay local in the desktop app. Use the Redact pack to strip account numbers and SSNs before LLM calls.",
      },
      {
        question: "Will it help with audit?",
        answer:
          "The Audit pack drafts work papers, builds substantive testing plans, and writes management letter comments.",
      },
    ],
    vsConsultant: [
      { feature: "Cost per close task", skillset: "<$0.05 in tokens", consultant: "$150+/hr", winner: "skillset" },
      { feature: "Turnaround", skillset: "Minutes", consultant: "Hours", winner: "skillset" },
      { feature: "Tax-position judgment", skillset: "Needs verification", consultant: "Licensed", winner: "consultant" },
      { feature: "Volume of entries", skillset: "Unlimited", consultant: "Capped", winner: "skillset" },
      { feature: "Client-comms plain language", skillset: "Pinned", consultant: "Varies", winner: "skillset" },
    ],
    howToSteps: [
      { name: "Install Skillset", text: "Desktop app — client data must stay on-device." },
      { name: "Import the Accountant Skillset", text: "Start with Journal Entries, Tax Research, or Audit." },
      { name: "Pin firm conventions", text: "Drop in your chart of accounts and naming conventions." },
      { name: "Run in QuickBooks or Excel", text: "Prompts trigger in-place; no copy-paste." },
      { name: "Reviewer signs", text: "Skillset drafts; CPA finalizes." },
    ],
    citations: [
      { label: "BLS — Accountants and Auditors", url: "https://www.bls.gov/oes/current/oes132011.htm" },
      { label: "AICPA Trends in the Supply of Accounting 2024", url: "https://www.aicpa-cima.com/professional-insights/download/trends-in-the-supply-of-accounting" },
      { label: "Thomson Reuters Future of Professionals 2024", url: "https://www.thomsonreuters.com/en/reports/future-of-professionals.html" },
    ],
    lastUpdated: LAST_UPDATED,
  },
  {
    slug: "nurses",
    role: "Nurses",
    title: "AI Prompts for Nurses - Free Charting, Patient-Ed & Care-Plan Templates",
    description:
      "Free AI prompt templates for nurses. SBAR handoffs, patient education, care plans, charting shortcuts, and continuing-education prompts.",
    longDescription:
      "Reduce documentation burden with prompts built for bedside and clinic nursing. Structure SBAR handoffs, generate patient education at appropriate reading levels, draft care plans, write discharge instructions, and study for certifications. HIPAA-aware design keeps PHI on-device.",
    keywords: [
      "AI prompts for nurses",
      "nursing prompts",
      "ChatGPT for nurses",
      "SBAR prompts",
      "patient education prompts",
      "skillset for nurses",
    ],
    icon: "🩺",
    relevantCategories: ["healthcare", "education"],
    relevantTags: ["nursing", "SBAR", "patient education", "care plan", "charting", "discharge"],
    skillsetHeadline: "The Skillset for Nurses",
    skillsetSubhead:
      "A portable bundle of SBAR, charting, patient-ed, and care-plan prompts. HIPAA-aware: prompts stay on-device; LLM calls route through BAA-covered providers.",
    medianSalary: 86070,
    employmentCount: 3175390,
    aiAdoptionPct: 47,
    hoursSavedPerWeek: 6,
    oNetCode: "29-1141.00",
    keyTasks: [
      "Structure SBAR handoff communications",
      "Write patient education at appropriate reading level",
      "Draft nursing care plans with NANDA-I",
      "Generate discharge instructions",
      "Document assessments and interventions",
      "Study for NCLEX and specialty certifications",
    ],
    faqs: [
      {
        question: "What is a Skillset for nurses?",
        answer:
          "A Skillset for nurses is a portable pack of SBAR, charting, patient-ed, and care-plan prompts. HIPAA-aware by design; prompts stay local, LLM calls route through BAA-covered models.",
      },
      {
        question: "Is it HIPAA-compliant?",
        answer:
          "Skillset itself is local-only. Use a BAA-covered LLM (Anthropic via Bedrock, Azure OpenAI) for any PHI work. Use the Redact pack first.",
      },
      {
        question: "Will it write care plans?",
        answer:
          "The Care Plan pack structures NANDA-I diagnoses, goals, interventions, and evaluation — RN reviews and finalizes.",
      },
      {
        question: "Can it help with patient education?",
        answer:
          "The Patient Ed pack rewrites complex instructions at a 6th-grade reading level and translates to 30+ languages.",
      },
      {
        question: "Does it study for certifications?",
        answer:
          "The Cert Study pack generates NCLEX-style practice questions, CCRN/CEN content review, and pharmacology drills.",
      },
      {
        question: "Will it replace clinical judgment?",
        answer:
          "No. It removes the documentation tax so you can focus on the patient.",
      },
    ],
    vsConsultant: [
      { feature: "Cost per chart note", skillset: "<$0.05 in tokens", consultant: "Salaried scribe", winner: "skillset" },
      { feature: "Speed", skillset: "Seconds", consultant: "Per-shift", winner: "skillset" },
      { feature: "Clinical judgment", skillset: "None", consultant: "Licensed", winner: "consultant" },
      { feature: "Patient-ed translation", skillset: "30+ languages", consultant: "Limited", winner: "skillset" },
      { feature: "Volume", skillset: "Unlimited", consultant: "Capped", winner: "skillset" },
    ],
    howToSteps: [
      { name: "Install Skillset", text: "Desktop app — PHI stays on-device." },
      { name: "Import the Nurse Skillset", text: "Start with SBAR, Care Plan, or Patient Ed." },
      { name: "Configure your unit", text: "ED, ICU, med-surg, OR — every prompt aligns to your context." },
      { name: "Route to BAA-covered LLM", text: "Anthropic via Bedrock or Azure OpenAI for HIPAA workloads." },
      { name: "RN finalizes", text: "Skillset drafts; you sign." },
    ],
    citations: [
      { label: "BLS — Registered Nurses", url: "https://www.bls.gov/oes/current/oes291141.htm" },
      { label: "AMN Healthcare Survey of RNs 2024", url: "https://www.amnhealthcare.com/insights/" },
      { label: "American Nurses Foundation Pulse on the Nation's Nurses 2024", url: "https://www.nursingworld.org/practice-policy/work-environment/" },
    ],
    lastUpdated: LAST_UPDATED,
  },
];

export function getRolePage(slug: string): RolePage | undefined {
  return rolePages.find((r) => r.slug === slug);
}

export function getSiblingRoles(slug: string, count = 5): RolePage[] {
  const current = getRolePage(slug);
  if (!current) return [];
  const siblings = rolePages
    .filter((r) => r.slug !== slug)
    .map((r) => {
      const overlap = r.relevantCategories.filter((c) =>
        current.relevantCategories.includes(c),
      ).length;
      return { role: r, overlap };
    })
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, count);
  return siblings.map((s) => s.role);
}
