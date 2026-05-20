/**
 * Skillset pack manifest — single source of truth for every downloadable
 * `.skill` file served from `web/public/skillsets/`.
 *
 * Adding a pack:
 *   1. Append a new `SkillsetPack` below.
 *   2. Make sure `id` is unique (it becomes the .skill filename).
 *   3. List `roleSlugs` for every role page that should surface it
 *      (must match a slug in `web/src/lib/pseo/roles.ts`).
 *   4. Run `npm run build:skillsets` (auto-runs on prebuild) so the JSON
 *      file lands in `web/public/skillsets/<id>.skill`.
 *
 * Prompt-quality rules (enforce on every pack):
 *   - Every `template` uses named `{variables}` the user fills in.
 *   - Every template specifies output format and at least one constraint
 *     (word cap, tone, structure, must-include).
 *   - `purpose` is one short sentence framed as a user goal.
 *   - Workflow packs use `Step N · ...` label prefixes and templates
 *     that chain via `{previous_step_output}` or named upstream vars.
 *   - Templates max ~6 lines, active voice, no padded preamble.
 */

import type { PersonaIconName } from "@/components/skillsets/persona-card";

export interface SkillsetPrompt {
  id: string;
  label: string;
  icon: string;
  purpose: string;
  template: string;
}

export interface SkillsetPack {
  /** url-safe slug; becomes the .skill filename. Stable forever. */
  id: string;
  title: string;
  icon: string;
  personaIcon: PersonaIconName;
  /** Display label shown above the title on the card. */
  persona: string;
  /** One-line value prop. ≤ 80 chars renders cleanly. */
  outcome: string;
  /** Longer description embedded in the `.skill` JSON. */
  description: string;
  type: "workflow" | "folder";
  prompts: SkillsetPrompt[];
  /** Preview list shown on the card (first 5 prompt labels by default). */
  preview?: string[];
  /** Role-page slugs this pack surfaces on. */
  roleSlugs: string[];
  /** Surfaces on /skillsets pillar Featured rail. */
  featured?: boolean;
}

export const skillsetPacks: SkillsetPack[] = [
  // ─────────────────────────────────────────────────────────────────
  // MIGRATED FROM LANDING-PAGE PERSONAS
  // ─────────────────────────────────────────────────────────────────
  {
    id: "brand-voice-studio",
    title: "Brand Voice Studio",
    icon: "📣",
    personaIcon: "Megaphone",
    persona: "Marketer",
    outcome: "Draft 10 brand-voice posts in 2 minutes.",
    description: "Draft 10 brand-voice posts in 2 minutes. Built for marketers.",
    type: "folder",
    roleSlugs: ["marketers", "content-creators", "founders"],
    featured: true,
    preview: [
      "LinkedIn post in your voice",
      "Twitter/X thread from long doc",
      "Email subject lines (×5 variants)",
      "Ad copy: 3 headlines + 3 bodies",
      "Press release first draft",
    ],
    prompts: [
      {
        id: "linkedin-post",
        label: "LinkedIn post in your voice",
        icon: "📝",
        purpose: "Match your past LinkedIn writing style",
        template:
          "You are a LinkedIn ghostwriter. Given these past posts as voice samples:\n\n{voice_samples}\n\nWrite a new LinkedIn post about {topic}. Match: tone, sentence length, vocabulary, structure. Output: 250-400 words, conversational, with one personal anecdote.",
      },
      {
        id: "twitter-thread",
        label: "Twitter/X thread from long doc",
        icon: "🧵",
        purpose: "Turn a long article into a 5-10 tweet thread",
        template:
          "Turn the following source document into a 5-10 tweet Twitter/X thread. Use punchy openers, 1 idea per tweet, no fluff. End with a CTA tweet.\n\nSource document:\n{source_doc}",
      },
      {
        id: "email-subjects",
        label: "Email subject lines (×5 variants)",
        icon: "📧",
        purpose: "Five subject options for one email",
        template:
          "Generate 5 distinct email subject line options for an email about {email_topic}. Mix: 1 curiosity, 1 question, 1 benefit-led, 1 urgency, 1 personal. Keep each under 60 characters. Output as numbered list.",
      },
      {
        id: "ad-copy",
        label: "Ad copy: 3 headlines + 3 bodies",
        icon: "💰",
        purpose: "Meta/Google ads creative pack",
        template:
          "Write a paid-ad creative pack for {product}. Target audience: {audience}. Output:\n\n3 headlines (max 40 chars each)\n3 body copy variants (max 90 chars each)\n3 CTAs\n\nTone: punchy, benefit-led, no marketing fluff.",
      },
      {
        id: "press-release",
        label: "Press release first draft",
        icon: "📰",
        purpose: "Formatted press release from key facts",
        template:
          "Write a press release first draft from these key facts: {facts}\n\nFormat: dateline, lede paragraph, body with 2 quotes, boilerplate. Tone: AP style, third person, no superlatives.",
      },
      {
        id: "newsletter-intro",
        label: "Newsletter intro paragraph",
        icon: "📬",
        purpose: "Punchy 80-word intro from your story summary",
        template:
          "Write a newsletter intro paragraph (80 words max) for a newsletter about: {story_summary}. Hook in first sentence. End with a one-line tease of what's inside.",
      },
      {
        id: "tone-audit",
        label: "Brand-voice tone audit",
        icon: "🎯",
        purpose: "Checks any draft against past brand voice",
        template:
          "Compare the following draft against my brand voice samples. Flag any sentences that drift from the established tone. Suggest revisions.\n\nBrand voice samples:\n{voice_samples}\n\nDraft to audit:\n{draft}",
      },
      {
        id: "competitor-analysis",
        label: "Competitor analysis from URL",
        icon: "🔍",
        purpose: "Pulls positioning + diff from competitor page",
        template:
          "Analyze the competitor positioning from this URL: {competitor_url}\n\nProduce:\n1. Their core positioning statement (1 sentence)\n2. Top 3 value props\n3. Tone descriptors\n4. 3 ways our product differs",
      },
      {
        id: "testimonial-polish",
        label: "Customer testimonial polisher",
        icon: "⭐",
        purpose: "Tightens raw quote without changing meaning",
        template:
          "Polish this customer testimonial. Keep their voice. Tighten redundant phrasing. Keep meaning intact. Output the polished version + a 1-line note on what changed.\n\nRaw quote:\n{raw_quote}",
      },
      {
        id: "cta-button-ab",
        label: "CTA button copy A/B",
        icon: "🔘",
        purpose: "5 button options per conversion goal",
        template:
          "Generate 5 CTA button copy options for: {goal}\n\nMix: 1 action verb, 1 benefit-led, 1 urgency, 1 curiosity, 1 plain. Each max 4 words.",
      },
      {
        id: "instagram-caption",
        label: "Instagram caption + hashtag set",
        icon: "📸",
        purpose: "Caption + 12 hashtags matched to topic",
        template:
          "Write an Instagram caption (150 words max) for a post about: {topic}\n\nThen suggest 12 hashtags: 4 broad (>1M posts), 4 medium (100k-1M), 4 niche (<100k). Output: caption, blank line, hashtags.",
      },
      {
        id: "repurpose-blog",
        label: "Repurpose blog → 5 socials",
        icon: "♻️",
        purpose: "Turns one post into 5 platform-tailored versions",
        template:
          "Take the following blog post and produce 5 platform-tailored versions:\n\n1. LinkedIn post (250 words)\n2. Twitter/X thread (5 tweets)\n3. Instagram caption (100 words)\n4. Newsletter blurb (80 words)\n5. Reddit-style discussion opener\n\nSource blog post:\n{blog_post}",
      },
    ],
  },
  {
    id: "study-faster",
    title: "Study Faster",
    icon: "🎓",
    personaIcon: "GraduationCap",
    persona: "Student",
    outcome: "Lecture notes → flashcards + study plan.",
    description: "Lecture notes → flashcards + study plan. 5-step workflow for students.",
    type: "workflow",
    roleSlugs: ["students"],
    featured: true,
    preview: [
      "Step 1 · Extract key concepts",
      "Step 2 · Generate flashcards",
      "Step 3 · Build practice quiz",
      "Step 4 · Make a mind map",
      "Step 5 · Spaced-repetition schedule",
    ],
    prompts: [
      {
        id: "step1-extract-concepts",
        label: "Step 1 · Extract key concepts",
        icon: "🧠",
        purpose: "Pull top 10 concepts from your lecture",
        template:
          "Extract the 10 most important concepts from the following lecture text. For each concept: 1-line definition, 1-line why it matters, 1-line common misconception.\n\nLecture text:\n{lecture_text}",
      },
      {
        id: "step2-flashcards",
        label: "Step 2 · Generate flashcards",
        icon: "🃏",
        purpose: "Turn concepts into 20 Anki-style Q/A cards",
        template:
          "Using the 10 concepts from step 1, generate 20 Anki-ready flashcards. Format: Q: ... / A: ... Two cards per concept — one definition, one application. Keep answers under 30 words.",
      },
      {
        id: "step3-practice-quiz",
        label: "Step 3 · Build practice quiz",
        icon: "📝",
        purpose: "10 exam-style questions from the concepts",
        template:
          "Using the 10 concepts from step 1, build a 10-question practice quiz. Mix: 4 multiple-choice (4 options each), 3 short-answer, 2 explain-this-concept, 1 application scenario. Provide answer key after the questions.",
      },
      {
        id: "step4-mind-map",
        label: "Step 4 · Make a mind map",
        icon: "🗺️",
        purpose: "Markdown mind map from the concepts",
        template:
          "Using the 10 concepts from step 1, output a markdown mind map. Use nested bullet structure. Root: the lecture topic. Branches: the 10 concepts. Sub-branches: key sub-ideas and connections between concepts.",
      },
      {
        id: "step5-schedule",
        label: "Step 5 · Spaced-repetition schedule",
        icon: "📅",
        purpose: "4-week review schedule for the flashcards",
        template:
          "Build a 4-week spaced-repetition schedule for the 20 flashcards from step 2. Use intervals: day 1, 3, 7, 14, 28. Output as a table: card # / review dates / cumulative review count.",
      },
    ],
  },
  {
    id: "solo-ops-toolkit",
    title: "Solo Ops Toolkit",
    icon: "💼",
    personaIcon: "Briefcase",
    persona: "Solopreneur",
    outcome: "Your support playbook, every reply.",
    description:
      "Your customer-support playbook + sales outreach + ops, every reply. Built for solopreneurs.",
    type: "folder",
    roleSlugs: ["founders", "freelancers"],
    featured: true,
    preview: [
      "Customer support reply (in tone)",
      "Cold outreach + follow-up chain",
      "Invoice reminder (polite + firm)",
      "Onboarding email sequence",
      "Pricing objection handler",
    ],
    prompts: [
      {
        id: "support-reply",
        label: "Customer support reply (in tone)",
        icon: "💬",
        purpose: "Drafts reply matching your support voice",
        template:
          "Draft a customer support reply to the message below. Match the tone in my past replies (samples).\n\nPast replies (voice samples):\n{past_replies}\n\nCustomer message:\n{customer_message}",
      },
      {
        id: "refund-cancel",
        label: "Refund / cancel response",
        icon: "↩️",
        purpose: "Handles refund requests firmly but warmly",
        template:
          "Write a refund-or-cancel response to this customer request. Be firm but warm. Acknowledge the issue, state the policy in plain English, offer one alternative if reasonable.\n\nCustomer request:\n{customer_request}",
      },
      {
        id: "sales-followup",
        label: "Sales follow-up email",
        icon: "🤝",
        purpose: "Post-call follow-up referencing meeting notes",
        template:
          "Write a post-sales-call follow-up email. Reference the meeting notes below. Recap 2 key takeaways, restate next steps, propose a date. Keep under 150 words.\n\nMeeting notes:\n{meeting_notes}",
      },
      {
        id: "cold-outreach-1",
        label: "Cold outreach (first touch)",
        icon: "✉️",
        purpose: "Personalized cold email from prospect URL",
        template:
          "Write a cold outreach email to the prospect at this URL: {prospect_url}\n\nMy product / value prop: {value_prop}\n\nRequirements: open with one specific observation about them, 1 sentence value prop, 1 line ask. Under 80 words.",
      },
      {
        id: "cold-outreach-2",
        label: "Cold outreach (follow-up 1)",
        icon: "📤",
        purpose: "1-week bump after no reply",
        template:
          "Write a 1-week follow-up to my previous cold email. Acknowledge they might be busy. Add one new piece of value (resource, insight, case study). Keep under 60 words. Reuse my value prop: {value_prop}",
      },
      {
        id: "cold-outreach-3",
        label: "Cold outreach (follow-up 2)",
        icon: "📨",
        purpose: "2-week bump with new angle",
        template:
          "Write a 2-week follow-up email with a different angle than my prior touches. Reframe the value prop: {value_prop}. Lead with a question that gets them thinking. Under 60 words.",
      },
      {
        id: "cold-outreach-final",
        label: "Cold outreach (final touch)",
        icon: "👋",
        purpose: "Break-up email, last attempt",
        template:
          "Write a polite break-up email closing the loop. Acknowledge they may not be a fit right now. Leave the door open. Mention one quick resource they can use anyway. Under 50 words. Context: {value_prop}",
      },
      {
        id: "invoice-reminder",
        label: "Invoice reminder (polite + firm)",
        icon: "💵",
        purpose: "Chases late invoice without burning relationship",
        template:
          "Write an invoice reminder for an overdue payment. Be polite but firm. State invoice number, amount, original due date. Offer one easy payment link. End with a deadline. Variables: {invoice_number}, {amount}, {due_date}",
      },
      {
        id: "lead-qualifier",
        label: "Lead qualifier from form data",
        icon: "🎯",
        purpose: "Scores inbound lead against ICP",
        template:
          "Score this inbound lead against my Ideal Customer Profile (ICP): {icp}\n\nLead form data:\n{form_data}\n\nOutput: score /10, 3 reasons for the score, recommended next step (auto-reply / sales call / nurture / disqualify).",
      },
      {
        id: "meeting-recap",
        label: "Meeting recap → action items",
        icon: "📋",
        purpose: "Turns transcript into action-item list",
        template:
          "Turn this meeting transcript into a clean recap with action items. Structure:\n\nTL;DR (2 lines)\nDecisions made\nOpen questions\nAction items (owner / deadline / what)\n\nTranscript:\n{transcript}",
      },
      {
        id: "pricing-objection",
        label: "Pricing objection handler",
        icon: "💡",
        purpose: "Frame-shift response to 'too expensive'",
        template:
          "Write a response to a pricing objection. Don't defend the price. Reframe to value: what they're losing without it. Use the value prop: {value_prop}. Ask one diagnostic question to surface the real concern. Under 100 words.",
      },
      {
        id: "onboarding-sequence",
        label: "Onboarding email sequence (×3)",
        icon: "🚀",
        purpose: "Drip series for new customers",
        template:
          "Write a 3-email onboarding sequence for new customers of {product}.\n\nEmail 1 (day 0): welcome + first quick win\nEmail 2 (day 3): teach 1 power feature\nEmail 3 (day 7): invite to community / collect feedback\n\nKeep each under 120 words.",
      },
      {
        id: "faq-from-tickets",
        label: "FAQ generator from past tickets",
        icon: "❓",
        purpose: "Clusters past tickets into top-10 FAQ",
        template:
          "Cluster these past support tickets into the top 10 most-common questions. For each: the question (in customer's voice), a 2-sentence answer.\n\nPast tickets:\n{tickets}",
      },
      {
        id: "churn-prevention",
        label: "Churn-prevention email",
        icon: "🔥",
        purpose: "Re-engagement to dormant customer",
        template:
          "Write a churn-prevention re-engagement email to a dormant customer.\n\nCustomer: {customer_name}\nLast active: {last_active}\nWhat they used: {used_feature}\n\nRequirements: empathy, 1 new reason to come back, 1 low-friction ask. Under 100 words.",
      },
    ],
  },
  {
    id: "code-review-copilot",
    title: "Code Review Co-pilot",
    icon: "👨‍💻",
    personaIcon: "Code2",
    persona: "Builder",
    outcome: "Codebase rules, lint prompts, design reviews.",
    description:
      "Paste a PR diff. Get a polished review comment in one click. 5-step workflow for devs.",
    type: "workflow",
    roleSlugs: ["developers"],
    featured: true,
    preview: [
      "Step 1 · Analyze the diff",
      "Step 2 · Style guide check",
      "Step 3 · Security audit",
      "Step 4 · Test coverage gaps",
      "Step 5 · Final review comment",
    ],
    prompts: [
      {
        id: "step1-analyze-diff",
        label: "Step 1 · Analyze the diff",
        icon: "🔍",
        purpose: "Summarize what the PR changes",
        template:
          "Analyze the following PR diff. Summarize:\n\n1. What changed (3 bullets max)\n2. Why it likely changed (1 sentence)\n3. Surface area touched (files / modules)\n4. Risk level (low / medium / high) with 1-line reason\n\nDiff:\n{pr_diff}",
      },
      {
        id: "step2-style-check",
        label: "Step 2 · Style guide check",
        icon: "📐",
        purpose: "Flag violations against your style guide",
        template:
          "Using the analysis from step 1, check the diff against this style guide:\n\n{style_guide}\n\nList every violation: file / line / what's wrong / suggested fix. Use markdown table. If none, say 'No style violations found.'",
      },
      {
        id: "step3-security",
        label: "Step 3 · Security audit",
        icon: "🔒",
        purpose: "Flag security concerns",
        template:
          "Audit the changes from step 1 for security concerns. Check for:\n\n1. Injection (SQL, command, XSS)\n2. Auth / authorization gaps\n3. Secret leaks (hardcoded keys, tokens)\n4. Unsafe deserialization\n5. Permissive defaults\n\nFor each finding: severity (low/med/high/critical), location, recommended fix. If clean, say 'No security issues found.'",
      },
      {
        id: "step4-test-coverage",
        label: "Step 4 · Test coverage gaps",
        icon: "🧪",
        purpose: "Surface missing test cases",
        template:
          "Looking at the changes from step 1, identify test coverage gaps. For each change:\n\n1. Existing test coverage (if any)\n2. What's still untested\n3. Suggested test cases (happy path / error cases / edge cases)\n\nFormat as bulleted list per file.",
      },
      {
        id: "step5-review-comment",
        label: "Step 5 · Final review comment",
        icon: "💬",
        purpose: "Polished PR review comment",
        template:
          "Merge the outputs from steps 2, 3, and 4 into one polished PR review comment.\n\nStructure:\n\n## Summary\nWhat the PR does (1 paragraph from step 1)\n\n## Findings\n- Style issues (from step 2)\n- Security concerns (from step 3)\n- Test coverage gaps (from step 4)\n\n## Recommendation\nApprove / Request changes / Block — with 1-line reason\n\nTone: collegial, specific, no fluff. Mark blockers clearly.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // NEW PACKS — v1 marketplace launch
  // ─────────────────────────────────────────────────────────────────

  {
    id: "lead-magnet-builder",
    title: "Lead Magnet Builder",
    icon: "🧲",
    personaIcon: "Megaphone",
    persona: "Marketer",
    outcome: "ICP → free guide → opt-in funnel in one sitting.",
    description: "From ICP to download-ready lead magnet plus its opt-in funnel.",
    type: "folder",
    roleSlugs: ["marketers", "content-creators"],
    preview: [
      "ICP one-pager",
      "Lead magnet idea storm (×5)",
      "Outline for the chosen idea",
      "First-draft expansion",
      "Landing page copy",
    ],
    prompts: [
      {
        id: "icp-onepager",
        label: "ICP one-pager",
        icon: "🎯",
        purpose: "Define one ideal customer in one page",
        template:
          "Write a 1-page Ideal Customer Profile for: {product_or_service}. Include: role, company size, top 3 pains, top 3 desired outcomes, where they hang out (channels), one objection they always raise. Output as markdown with H3 sections.",
      },
      {
        id: "idea-storm",
        label: "Lead magnet idea storm (×5)",
        icon: "💡",
        purpose: "Five distinct lead magnet concepts for one ICP",
        template:
          "Given the ICP above, brainstorm 5 lead magnet ideas. For each: format (PDF / checklist / calculator / template / video), one-line value prop, why this ICP would download it. Rank by likely opt-in rate. Use markdown table.",
      },
      {
        id: "outline",
        label: "Outline for the chosen idea",
        icon: "📋",
        purpose: "Structure the chosen magnet before drafting",
        template:
          "Outline a {format} lead magnet titled '{title}' for the ICP. Use H2 sections + 2-4 bullet sub-points per section. Length target: {length}. Keep every section answering a specific ICP pain.",
      },
      {
        id: "draft",
        label: "First-draft expansion",
        icon: "✍️",
        purpose: "Expand outline into a usable first draft",
        template:
          "Expand the outline into a first draft. Each section: 2-3 short paragraphs, one concrete example or stat, one actionable takeaway. Tone: {tone}. No filler. Aim for {word_count} words total.",
      },
      {
        id: "landing-copy",
        label: "Landing page copy",
        icon: "🪧",
        purpose: "Opt-in landing page copy block",
        template:
          "Write opt-in landing page copy for '{title}'. Output: H1 (≤10 words), subhead (≤25 words), 3-bullet 'what you'll get', 1 social-proof line ({social_proof_data}), CTA button (≤4 words). Tone: confident, no marketing fluff.",
      },
      {
        id: "optin-sequence",
        label: "Opt-in email sequence (×3)",
        icon: "📧",
        purpose: "3-email drip after they download",
        template:
          "Write 3 emails sent after someone downloads '{title}'.\n\nEmail 1 (immediate): deliver + frame the win\nEmail 2 (day 2): 1 advanced tip from the magnet\nEmail 3 (day 5): related case study + soft CTA to {product_or_service}\n\nEach ≤120 words.",
      },
    ],
  },

  {
    id: "email-sequence-forge",
    title: "Email Sequence Forge",
    icon: "🔥",
    personaIcon: "Megaphone",
    persona: "Marketer",
    outcome: "Audience + goal → 5-email funnel with A/B subjects.",
    description:
      "Build a 5-email nurture or sales sequence with funnel-stage mapping and subject A/Bs. 5-step workflow.",
    type: "workflow",
    roleSlugs: ["marketers", "salespeople", "content-creators"],
    preview: [
      "Step 1 · Audience + goal brief",
      "Step 2 · Funnel stage map",
      "Step 3 · Draft 5-email sequence",
      "Step 4 · Subject A/B variants",
      "Step 5 · CTA + tracking plan",
    ],
    prompts: [
      {
        id: "step1-brief",
        label: "Step 1 · Audience + goal brief",
        icon: "🎯",
        purpose: "Lock the audience + outcome before writing",
        template:
          "Turn this raw input into a tight 1-page email brief:\n\n{raw_input}\n\nSections: audience (who, what they want), goal (single conversion event), current friction, voice (3 adjectives), success metric. ≤300 words.",
      },
      {
        id: "step2-stage-map",
        label: "Step 2 · Funnel stage map",
        icon: "🗺️",
        purpose: "Map each email to a funnel stage",
        template:
          "Using the brief from step 1, map a 5-email sequence to funnel stages: awareness → interest → consideration → decision → retention. For each email: stage, single job-to-be-done, what to leave unsaid until the next email. Markdown table.",
      },
      {
        id: "step3-drafts",
        label: "Step 3 · Draft 5-email sequence",
        icon: "✍️",
        purpose: "Write all five emails",
        template:
          "Using the stage map from step 2, draft 5 emails. Each: subject line (placeholder, we'll A/B next), 1-sentence preview text, body (≤150 words), 1 CTA. Voice from step 1. Number them E1–E5.",
      },
      {
        id: "step4-subjects",
        label: "Step 4 · Subject A/B variants",
        icon: "🧪",
        purpose: "Two competing subject lines per email",
        template:
          "For each email from step 3, write 2 subject lines: variant A (curiosity-led, ≤50 chars), variant B (benefit-led, ≤50 chars). Add a one-line note on which audience segment each likely wins with.",
      },
      {
        id: "step5-cta-tracking",
        label: "Step 5 · CTA + tracking plan",
        icon: "📊",
        purpose: "Tracking links + KPI per email",
        template:
          "Build the CTA + tracking plan. For each email: final CTA copy, UTM-tagged link template (campaign={campaign_slug}, source=email, medium=newsletter, content=E[n]_[variant]), primary KPI to watch, success threshold. Markdown table.",
      },
    ],
  },

  {
    id: "api-doc-generator",
    title: "API Doc Generator",
    icon: "📚",
    personaIcon: "Code2",
    persona: "Developer",
    outcome: "Code → spec, examples, error refs, curl set.",
    description:
      "Turn raw endpoint code into developer-ready documentation: spec, examples, error reference, curl snippets, migration notes.",
    type: "folder",
    roleSlugs: ["developers", "devops-engineers"],
    preview: [
      "Endpoint spec from code",
      "Request / response examples",
      "Error code reference",
      "Auth flow (markdown diagram)",
      "Curl snippet collection",
    ],
    prompts: [
      {
        id: "endpoint-spec",
        label: "Endpoint spec from code",
        icon: "📐",
        purpose: "OpenAPI-style spec from source",
        template:
          "Extract an OpenAPI 3.1-style spec entry from this source code. Include: method, path, summary, description, parameters (name, in, type, required, description), request body schema, response schemas per status code. Use YAML.\n\nSource:\n{source_code}",
      },
      {
        id: "examples",
        label: "Request / response examples",
        icon: "📨",
        purpose: "Realistic example payloads",
        template:
          "Given this endpoint spec:\n\n{endpoint_spec}\n\nProduce: 1 happy-path request + response example, 1 validation-error example, 1 auth-error example. Realistic field values, not 'foo/bar'. Show both JSON bodies and key headers.",
      },
      {
        id: "error-reference",
        label: "Error code reference",
        icon: "🚨",
        purpose: "Every error code documented",
        template:
          "Enumerate every error this endpoint can return based on the source below. For each: status code, internal error code, human message, cause, recommended client action. Markdown table.\n\nSource:\n{source_code}",
      },
      {
        id: "auth-flow",
        label: "Auth flow (markdown diagram)",
        icon: "🔐",
        purpose: "How a caller authenticates",
        template:
          "Describe the auth flow for this endpoint. Auth scheme: {auth_scheme}. Output:\n\n1. ASCII sequence diagram (client → auth → API → client)\n2. Step-by-step list with the exact header/cookie names\n3. Token lifetime + refresh rules\n4. Common failure modes",
      },
      {
        id: "curl-snippets",
        label: "Curl snippet collection",
        icon: "🌀",
        purpose: "Copy-paste curl for every example",
        template:
          "Turn each example from step 2 into a runnable curl command. Replace tokens with `$API_TOKEN`. Use line continuations for readability. Add a 1-line comment above each.",
      },
      {
        id: "migration-notes",
        label: "Migration notes (vN → vN+1)",
        icon: "🔁",
        purpose: "Changelog entry for consumers",
        template:
          "Compare this endpoint between versions:\n\nOLD:\n{old_version}\n\nNEW:\n{new_version}\n\nOutput: breaking changes (callout), non-breaking changes, deprecated fields, migration steps (numbered), example before/after.",
      },
    ],
  },

  {
    id: "test-suite-bootstrapper",
    title: "Test Suite Bootstrapper",
    icon: "🧪",
    personaIcon: "Code2",
    persona: "Developer",
    outcome: "Endpoint → happy / error / edge tests + CI snippet.",
    description:
      "5-step workflow that turns an API contract into a layered test suite plus a CI integration snippet.",
    type: "workflow",
    roleSlugs: ["developers"],
    preview: [
      "Step 1 · API contract extraction",
      "Step 2 · Happy-path tests",
      "Step 3 · Error-case tests",
      "Step 4 · Edge cases",
      "Step 5 · CI integration snippet",
    ],
    prompts: [
      {
        id: "step1-contract",
        label: "Step 1 · API contract extraction",
        icon: "📐",
        purpose: "Pin down inputs, outputs, side effects",
        template:
          "From this code / spec, extract a tight contract:\n\n{source}\n\nList: inputs (name, type, validation rules), outputs (success shape, error shapes), side effects (DB writes, external calls), invariants (what must always hold). Markdown.",
      },
      {
        id: "step2-happy",
        label: "Step 2 · Happy-path tests",
        icon: "✅",
        purpose: "Cover the documented success cases",
        template:
          "Using the contract from step 1, write happy-path tests in {test_framework}. One test per documented success case. Each test: arrange / act / assert sections with comments. No mocking outside what the contract explicitly externalises.",
      },
      {
        id: "step3-errors",
        label: "Step 3 · Error-case tests",
        icon: "❌",
        purpose: "Every documented error returns the right shape",
        template:
          "Using the error list from step 1, write tests that intentionally trigger each error. Assert: status code, error code, human message presence, no side effects committed. Same framework as step 2.",
      },
      {
        id: "step4-edge",
        label: "Step 4 · Edge cases",
        icon: "🪨",
        purpose: "Boundary, empty, oversize, race conditions",
        template:
          "Add edge-case tests derived from the inputs in step 1. For each input field, cover: empty, max size, off-by-one boundary, wrong type. Add 1 concurrency test if the contract names any shared state. Document why each case matters in a comment.",
      },
      {
        id: "step5-ci",
        label: "Step 5 · CI integration snippet",
        icon: "🤖",
        purpose: "Wire the tests into your CI",
        template:
          "Generate a CI snippet for {ci_provider} that runs the tests from steps 2-4. Include: cache for {package_manager}, parallel sharding if test count > 50, fail-fast off so all failures surface, artifact upload for coverage report. YAML.",
      },
    ],
  },

  {
    id: "voice-lock",
    title: "Voice Lock",
    icon: "🔒",
    personaIcon: "Pencil",
    persona: "Writer",
    outcome: "Lock your voice. Draft, audit, rewrite, repeat.",
    description:
      "Capture your writing voice from samples, then draft + audit + retune every new piece against it.",
    type: "folder",
    roleSlugs: ["writers", "content-creators"],
    preview: [
      "Voice sample audit",
      "First-draft generator",
      "Tone-shift rewriter",
      "Word-bank guard",
      "Title generator",
    ],
    prompts: [
      {
        id: "voice-audit",
        label: "Voice sample audit",
        icon: "🎤",
        purpose: "Distill your style into a usable spec",
        template:
          "Read these writing samples and produce a voice spec.\n\nSamples:\n{voice_samples}\n\nOutput: 3 tone descriptors, 5 favorite sentence patterns (with examples), 10 words this writer uses often, 5 words they avoid, average sentence length, paragraph rhythm. Markdown.",
      },
      {
        id: "first-draft",
        label: "First-draft generator",
        icon: "✍️",
        purpose: "Draft anything in your locked voice",
        template:
          "Using the voice spec from voice-audit, write a {piece_type} about {topic}. Match every spec element: tone, sentence patterns, favored words, avoided words, sentence-length variance. Target {word_count} words.",
      },
      {
        id: "tone-shift",
        label: "Tone-shift rewriter",
        icon: "🎚️",
        purpose: "Same content, calibrated tone",
        template:
          "Rewrite the following piece, shifting tone from {current_tone} to {target_tone} while keeping the underlying meaning, structure, and voice spec. Show: rewritten draft, then a 3-bullet diff of what changed.\n\nPiece:\n{piece}",
      },
      {
        id: "word-bank-guard",
        label: "Word-bank guard",
        icon: "🛡️",
        purpose: "Flag avoided words + overused crutches",
        template:
          "Scan the draft below against the voice spec's avoided-words list. Flag every instance with: line snippet, the flagged word, suggested replacement that stays in voice. Then flag any word used >3 times that isn't on the favored list.\n\nDraft:\n{draft}",
      },
      {
        id: "sentence-variance",
        label: "Sentence-length variance check",
        icon: "📏",
        purpose: "Spot monotone rhythm before it ships",
        template:
          "Analyze sentence-length rhythm in the draft below. Output: avg length, stdev, longest 3 sentences, shortest 3 sentences, any 3+ in a row with identical opening structure. Suggest 3 concrete edits to improve variance.\n\nDraft:\n{draft}",
      },
      {
        id: "hook-variants",
        label: "Hook variants (×5)",
        icon: "🪝",
        purpose: "Five competing opening sentences",
        template:
          "Write 5 alternative opening hooks for the piece about {topic}. Patterns: (1) provocative claim, (2) micro-story, (3) surprising stat, (4) direct address question, (5) confession. Each ≤25 words. Stay in voice.",
      },
      {
        id: "closing-variants",
        label: "Closing variants (×5)",
        icon: "🎬",
        purpose: "Five different last lines",
        template:
          "Write 5 alternative closing lines for the piece about {topic}. Patterns: (1) callback to opening, (2) one-line CTA, (3) cliffhanger to next piece, (4) reader question, (5) micro-summary. Each ≤25 words. Stay in voice.",
      },
      {
        id: "title-generator",
        label: "Title generator (×8)",
        icon: "🏷️",
        purpose: "Eight titles, each a different angle",
        template:
          "Generate 8 title options for the piece below. Patterns: (1) how-to, (2) number list, (3) question, (4) confession, (5) contrarian, (6) curiosity-gap, (7) outcome promise, (8) audience-named. Each ≤9 words. Stay in voice.\n\nPiece:\n{piece}",
      },
    ],
  },

  {
    id: "pitch-deck-coach",
    title: "Pitch Deck Coach",
    icon: "🎤",
    personaIcon: "Briefcase",
    persona: "Founder",
    outcome: "Founder story → 10-slide deck + Q&A drill.",
    description:
      "6-step workflow from one-liner to investor-ready deck plus a Q&A simulator.",
    type: "workflow",
    roleSlugs: ["founders", "salespeople", "consultants"],
    preview: [
      "Step 1 · One-line pitch",
      "Step 2 · Problem slide",
      "Step 3 · Solution + demo storyboard",
      "Step 4 · Traction + GTM",
      "Step 5 · Ask + use of funds",
    ],
    prompts: [
      {
        id: "step1-oneliner",
        label: "Step 1 · One-line pitch",
        icon: "🎯",
        purpose: "Lock the elevator line",
        template:
          "Turn this messy founder brief into a tight one-line pitch:\n\n{brief}\n\nFormat: '{Company} helps {audience} {do thing} by {mechanism}.' ≤25 words. Output 3 variants, then pick the strongest with a 1-line reason.",
      },
      {
        id: "step2-problem",
        label: "Step 2 · Problem slide",
        icon: "🩹",
        purpose: "Slide copy + speaker notes for the pain",
        template:
          "Using the pitch from step 1, write the problem slide. Output:\n\nSlide headline (≤8 words)\n3 bullet pain points (≤12 words each)\nSpeaker notes (60-second version, conversational)\n1 stat to cite with source placeholder",
      },
      {
        id: "step3-solution",
        label: "Step 3 · Solution + demo storyboard",
        icon: "🛠️",
        purpose: "Slide + 60-second demo script",
        template:
          "Write the solution slide and a 60-second demo storyboard.\n\nSlide: headline + 3 bullets (what / how / proof)\nStoryboard: 6 frames, each: 1-line visual description + 1-line spoken script. Total ≤60 seconds. Hand off to a designer or screen recorder.",
      },
      {
        id: "step4-traction",
        label: "Step 4 · Traction + GTM",
        icon: "📈",
        purpose: "Slide that proves momentum + plan",
        template:
          "Write the traction + GTM slide.\n\nTraction inputs: {traction_data}\n\nOutput: 1 headline number, 3 supporting numbers (each ≤10 words), GTM channel mix (top 3 channels with predicted CAC payback), 1-line risk + mitigation. Speaker notes (45-second version).",
      },
      {
        id: "step5-ask",
        label: "Step 5 · Ask + use of funds",
        icon: "💰",
        purpose: "Crisp ask without underselling",
        template:
          "Write the ask slide for a {round_size} round.\n\nOutput: headline (the ask), 3 use-of-funds buckets with % each, 18-month milestone targets (3 bullets), why now (1 sentence), why us (1 sentence). Speaker notes (45-second version).",
      },
      {
        id: "step6-qa",
        label: "Step 6 · Q&A drill (top 10 questions)",
        icon: "🎯",
        purpose: "Pre-mortem the toughest investor questions",
        template:
          "Based on steps 1-5, predict the 10 hardest questions an investor would ask. For each: the question, the steelmanned worst-case, a 60-second answer that doesn't dodge. Order by likelihood. Markdown.",
      },
    ],
  },

  {
    id: "cold-outreach-os",
    title: "Cold Outreach OS",
    icon: "✉️",
    personaIcon: "Briefcase",
    persona: "Salesperson",
    outcome: "ICP → researched first touch → 4-bump sequence.",
    description:
      "End-to-end cold outreach system: ICP intake, prospect research, four-touch sequence, reply triage.",
    type: "folder",
    roleSlugs: ["salespeople", "recruiters", "founders", "freelancers"],
    preview: [
      "ICP intake",
      "Prospect researcher (URL → signals)",
      "First-touch email (personalized)",
      "Bump #1 (day 3)",
      "Bump #2 (day 7, new angle)",
    ],
    prompts: [
      {
        id: "icp-intake",
        label: "ICP intake",
        icon: "🎯",
        purpose: "Codify your ICP from rough notes",
        template:
          "Turn these notes into a structured ICP:\n\n{rough_notes}\n\nOutput: title, company size, funding stage, top 3 pains, top 3 triggers to reach out, top 3 disqualifiers, channels they trust. ≤300 words.",
      },
      {
        id: "prospect-research",
        label: "Prospect researcher (URL → signals)",
        icon: "🔬",
        purpose: "Pull personalisation hooks from a URL",
        template:
          "Research the prospect at {prospect_url}. Surface: 3 specific things to compliment without flattery, 1 likely pain consistent with our ICP, 1 recent change (hire, launch, fundraise), 1 conversation opener that references the change without being weird.",
      },
      {
        id: "first-touch",
        label: "First-touch email (personalized)",
        icon: "✉️",
        purpose: "Cold email that doesn't feel cold",
        template:
          "Write the first cold email using the research above. Structure: 1-sentence specific observation, 1-sentence value prop ({value_prop}), 1-sentence proof (case study / metric), 1 low-friction ask (no calendar link in first touch). ≤80 words.",
      },
      {
        id: "bump-1",
        label: "Bump #1 (day 3)",
        icon: "🔁",
        purpose: "Short nudge with new value",
        template:
          "Write a day-3 follow-up to my first email. Acknowledge inbox load in 1 phrase. Add new value: link to {resource_url} with a 1-line reason it's relevant given the research. Re-pose the original ask. ≤55 words.",
      },
      {
        id: "bump-2",
        label: "Bump #2 (day 7, new angle)",
        icon: "🎲",
        purpose: "Reframe the value prop entirely",
        template:
          "Write a day-7 follow-up that drops the original angle. New angle: {alternate_value_prop}. Open with a 1-sentence question that's easy to react to. Offer one specific time slot for a 15-min call. ≤60 words.",
      },
      {
        id: "break-up",
        label: "Break-up email (day 14)",
        icon: "👋",
        purpose: "Polite close that often gets replies",
        template:
          "Write a break-up email. Acknowledge they may not be a fit right now. Leave the door open. Mention one freely usable resource ({resource_url}). No calendar links. ≤50 words.",
      },
      {
        id: "reply-handler",
        label: "Reply handler (5 archetypes)",
        icon: "💬",
        purpose: "Templated responses to common replies",
        template:
          "Write 5 reply templates for the archetypes below. For each: a 1-line classification cue, a ≤60-word response that moves toward a call without pressure.\n\nArchetypes: 1) Not now, 2) Not the right person, 3) Skeptical of value, 4) Already use competitor, 5) Interested, send info.",
      },
    ],
  },

  {
    id: "lecture-to-flashcards",
    title: "Lecture → Flashcards",
    icon: "🗂️",
    personaIcon: "BookOpen",
    persona: "Student",
    outcome: "Notes → cards → schedule → self-quiz.",
    description:
      "6-step workflow that turns dense lecture notes into a layered flashcard set with a review schedule.",
    type: "workflow",
    roleSlugs: ["students", "teachers"],
    preview: [
      "Step 1 · Concept extraction",
      "Step 2 · Cloze deletion cards",
      "Step 3 · Q/A cards",
      "Step 4 · Image-occlusion candidates",
      "Step 5 · Spaced rep schedule",
    ],
    prompts: [
      {
        id: "step1-concepts",
        label: "Step 1 · Concept extraction",
        icon: "🧠",
        purpose: "Pin down what to actually remember",
        template:
          "Read these lecture notes:\n\n{lecture_notes}\n\nList the 12 ideas worth memorising. For each: 1-line definition, 1-line common confusion, prerequisite ideas. Skip examples and side-tangents. Markdown table.",
      },
      {
        id: "step2-cloze",
        label: "Step 2 · Cloze deletion cards",
        icon: "✂️",
        purpose: "Cloze cards from the concept list",
        template:
          "Using the 12 ideas from step 1, write 18 cloze deletion cards. Format each as: 'Full sentence with {{c1::hidden term}}.' Aim for one critical word per card; avoid hiding articles or conjunctions.",
      },
      {
        id: "step3-qa",
        label: "Step 3 · Q/A cards",
        icon: "❓",
        purpose: "Q/A cards for application recall",
        template:
          "Using the 12 ideas from step 1, write 12 Q/A cards focused on application not definition. Front: scenario or applied question. Back: answer in ≤30 words referencing the underlying idea.",
      },
      {
        id: "step4-image",
        label: "Step 4 · Image-occlusion candidates",
        icon: "🖼️",
        purpose: "Spot which concepts need a diagram",
        template:
          "From step 1's 12 ideas, list which ones would benefit from an image-occlusion card (diagrams, structures, flowcharts). For each: why visual helps, what specifically to occlude, a 1-sentence prompt for the image generator.",
      },
      {
        id: "step5-schedule",
        label: "Step 5 · Spaced rep schedule",
        icon: "📅",
        purpose: "4-week schedule across all cards",
        template:
          "Build a 4-week spaced-repetition schedule for the cards from steps 2-3. Intervals: day 1, 3, 7, 14, 28. Each row: card id, review dates, expected cumulative count. Markdown table. Note: never schedule >40 reviews in any single day.",
      },
      {
        id: "step6-quiz",
        label: "Step 6 · Self-quiz",
        icon: "📝",
        purpose: "Mock exam from the same cards",
        template:
          "Build a 10-question self-quiz from steps 2-3 cards. Mix: 4 MCQ (4 options each), 3 short-answer, 2 explain-this, 1 application scenario. Provide answer key with which card maps to which question.",
      },
    ],
  },

  {
    id: "lesson-plan-forge",
    title: "Lesson Plan Forge",
    icon: "👩‍🏫",
    personaIcon: "BookOpen",
    persona: "Teacher",
    outcome: "Standards → 90-min lesson + differentiation tiers.",
    description:
      "Build a standards-aligned 90-minute lesson with hooks, instruction script, differentiation, and formative assessment.",
    type: "folder",
    roleSlugs: ["teachers"],
    preview: [
      "Standards mapping",
      "Lesson outline (90-min)",
      "Hook activity",
      "Direct instruction script",
      "Differentiation tiers",
    ],
    prompts: [
      {
        id: "standards",
        label: "Standards mapping",
        icon: "🧭",
        purpose: "Link the lesson to standards",
        template:
          "Map a lesson on {topic} (grade {grade}) to standards from {standards_set}. Output 3 primary standards (codes + plain-English) and 2 cross-curricular ties. 1-line per standard explaining the alignment.",
      },
      {
        id: "outline",
        label: "Lesson outline (90-min)",
        icon: "📋",
        purpose: "Time-boxed 90-minute plan",
        template:
          "Using the standards from above, outline a 90-minute lesson on {topic}. Blocks: hook (10), instruction (25), guided practice (20), independent work (20), share + close (15). Each block: objective, activity, materials.",
      },
      {
        id: "hook",
        label: "Hook activity",
        icon: "🪝",
        purpose: "10-minute opener that earns attention",
        template:
          "Design a 10-minute hook for a {topic} lesson (grade {grade}). It must surface a misconception students typically hold, be doable with classroom materials, and end with one question that motivates the day's instruction. Include teacher script + student-facing prompt.",
      },
      {
        id: "instruction-script",
        label: "Direct instruction script",
        icon: "🎙️",
        purpose: "Teacher script for the 25-min block",
        template:
          "Write a 25-minute direct instruction script on {topic}. Use the I-do/we-do/you-do pattern. Include: 3 worked examples (increasing difficulty), 2 turn-and-talk prompts, 1 quick check-for-understanding poll. Speaker-friendly cadence.",
      },
      {
        id: "differentiation",
        label: "Differentiation tiers",
        icon: "🪜",
        purpose: "Same lesson, three tiers",
        template:
          "Differentiate the lesson into 3 tiers: scaffolded (struggling learners), on-level, extension (advanced). For each tier: what changes in the independent-work block, what scaffolds or extensions to provide, success criteria. Markdown table.",
      },
      {
        id: "formative",
        label: "Formative assessment",
        icon: "✅",
        purpose: "Exit ticket aligned to standards",
        template:
          "Write a 5-question exit ticket for a {topic} lesson. Map each question to one standard from the standards-mapping step. Mix: 3 quick MCQ, 1 short response, 1 self-rating with sentence-starters. Provide rubric.",
      },
    ],
  },

  {
    id: "youtube-title-lab",
    title: "YouTube Title Lab",
    icon: "▶️",
    personaIcon: "Video",
    persona: "Creator",
    outcome: "Script → 10 titles → CTR-tuned winner.",
    description:
      "Generate, refine, and align YouTube titles, thumbnail copy, descriptions, and tags around one core video.",
    type: "folder",
    roleSlugs: ["content-creators", "marketers"],
    preview: [
      "10-title brainstorm",
      "CTR-pattern refiner",
      "Thumbnail copy match",
      "Description first-line",
      "Tag set generator",
    ],
    prompts: [
      {
        id: "title-storm",
        label: "10-title brainstorm",
        icon: "🌪️",
        purpose: "Ten distinct title angles",
        template:
          "From this video script, generate 10 YouTube titles using 10 different patterns: number list, how-to, contrarian, curiosity-gap, named-target, time-bound, before/after, story, question, plain-result. Each ≤60 chars. Mark the strongest with a 1-line reason.\n\nScript:\n{script}",
      },
      {
        id: "ctr-refiner",
        label: "CTR-pattern refiner",
        icon: "📈",
        purpose: "Rewrite the winner for higher CTR",
        template:
          "Take the chosen title: '{chosen_title}'. Generate 5 refinements that each apply one CTR lever: add a specific number, add a stakes word, add a named persona, add a time constraint, add a contrarian frame. Each ≤60 chars. Note which lever each uses.",
      },
      {
        id: "thumb-copy",
        label: "Thumbnail copy match",
        icon: "🖼️",
        purpose: "Thumbnail text that echoes the title",
        template:
          "For the title '{final_title}', write 3 thumbnail copy options. Each ≤5 words, all caps friendly, no overlap with the title's exact phrasing. Suggest a visual hook for each (no design jargon).",
      },
      {
        id: "desc-firstline",
        label: "Description first-line",
        icon: "📝",
        purpose: "The line YouTube cuts the preview at",
        template:
          "Write 3 alternative first lines for the YouTube description of '{final_title}'. Each ≤120 chars. Each: a tease, not a recap. Avoid 'In this video…'.",
      },
      {
        id: "tag-set",
        label: "Tag set generator",
        icon: "🏷️",
        purpose: "Tag set without keyword stuffing",
        template:
          "Build a YouTube tag set for '{final_title}' based on the script. Output 10 tags: 3 broad topic tags, 4 specific long-tail tags, 3 entity tags (names, brands, places mentioned). Comma-separated, lowercase, no duplicates with the title.",
      },
    ],
  },

  {
    id: "hook-outline",
    title: "Hook + Outline",
    icon: "🪝",
    personaIcon: "Pencil",
    persona: "Creator",
    outcome: "Topic → 10 hooks → outline → draft → polish.",
    description:
      "5-step workflow that turns a raw topic into a finished short-form piece via hook ideation and beat-by-beat drafting.",
    type: "workflow",
    roleSlugs: ["content-creators", "writers", "marketers"],
    preview: [
      "Step 1 · Topic + audience brief",
      "Step 2 · 10 hook openings",
      "Step 3 · Pick winner + outline 5 beats",
      "Step 4 · Expand each beat",
      "Step 5 · Polish + CTA",
    ],
    prompts: [
      {
        id: "step1-brief",
        label: "Step 1 · Topic + audience brief",
        icon: "🎯",
        purpose: "Lock the audience + promise",
        template:
          "Brief a short piece on {topic}. Output: target audience (1 line), single promise (1 line), the question this piece answers (1 line), why now (1 line), tone (3 adjectives). ≤120 words.",
      },
      {
        id: "step2-hooks",
        label: "Step 2 · 10 hook openings",
        icon: "🪝",
        purpose: "Ten openings, each a different pattern",
        template:
          "Using the brief, write 10 opening hooks. One per pattern: provocative claim, mini-story, surprising stat, direct question, confession, contrarian, named target, before/after, scene, definition. Each ≤25 words.",
      },
      {
        id: "step3-outline",
        label: "Step 3 · Pick winner + outline 5 beats",
        icon: "🪜",
        purpose: "Structure the rest of the piece",
        template:
          "Pick the strongest hook from step 2 (state which + why in 1 line). Outline 5 beats from there. Each beat: 1-line job, 1-line evidence/example, 1-line transition to next.",
      },
      {
        id: "step4-expand",
        label: "Step 4 · Expand each beat",
        icon: "✍️",
        purpose: "Turn beats into paragraphs",
        template:
          "Expand each of the 5 beats into a 60-90 word paragraph. Match the tone from step 1. Use one concrete example per beat. No padding, no transitional fluff (the beat outline already handles transitions).",
      },
      {
        id: "step5-polish",
        label: "Step 5 · Polish + CTA",
        icon: "💎",
        purpose: "Tighten + add the close",
        template:
          "Polish the full draft. Tighten any sentence >25 words. Vary sentence length across paragraphs. Add a closing CTA (≤25 words) that does one of: ask a question, suggest an action, tease the next piece.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // DESIGNERS
  // ─────────────────────────────────────────────────────────────────
  {
    id: "design-critique-pack",
    title: "Design Critique",
    icon: "🎯",
    personaIcon: "PenTool",
    persona: "Designer",
    outcome: "Paste a screen → structured critique in seconds.",
    description:
      "Layered design critique: heuristics, hierarchy, accessibility, microcopy, and stakeholder-ready summary.",
    type: "folder",
    roleSlugs: ["designers"],
    preview: [
      "Heuristic eval (Nielsen 10)",
      "Visual hierarchy audit",
      "Accessibility check",
      "Microcopy review",
      "Stakeholder TL;DR",
    ],
    prompts: [
      {
        id: "heuristic-eval",
        label: "Heuristic eval (Nielsen 10)",
        icon: "📐",
        purpose: "Score against the 10 usability heuristics",
        template:
          "Review the attached screen against Nielsen's 10 usability heuristics. For each heuristic: score 1-5, 1-sentence rationale, 1 concrete fix. Skip heuristics that don't apply with a note. Output: markdown table.\n\nScreen description / image:\n{screen}",
      },
      {
        id: "hierarchy-audit",
        label: "Visual hierarchy audit",
        icon: "🪜",
        purpose: "Spot rank-of-importance breaks",
        template:
          "Analyze the visual hierarchy of {screen}. List: the user's likely scan order, which 3 elements get most weight, any element competing for attention with the primary CTA. Suggest 3 changes that strengthen the intended hierarchy.",
      },
      {
        id: "a11y-check",
        label: "Accessibility check",
        icon: "♿",
        purpose: "WCAG 2.2 pass against the design",
        template:
          "Check {screen} against WCAG 2.2 AA. Cover: color contrast, focus order, touch-target size, motion preferences, error identification, heading structure. For each finding: severity, location, recommended fix.",
      },
      {
        id: "microcopy-review",
        label: "Microcopy review",
        icon: "✍️",
        purpose: "Voice + clarity pass on every label",
        template:
          "Audit every piece of microcopy in {screen} (labels, errors, empty states, tooltips). For each: current text, issue (jargon / vague / cold / inconsistent), rewrite that matches voice: {voice}. Limit to ≤25 changes.",
      },
      {
        id: "naming-pass",
        label: "Component naming pass",
        icon: "🏷️",
        purpose: "Names that survive the design system",
        template:
          "Rename the components in {screen} so they slot into a design system. For each: current name, proposed name (PascalCase), reason it generalises better. Flag any that should be variants of an existing component.",
      },
      {
        id: "persona-stress",
        label: "Persona stress-test",
        icon: "👥",
        purpose: "Walk through with 3 personas",
        template:
          "Walk three personas through {screen}: {persona_1}, {persona_2}, {persona_3}. For each: what they do first, where they pause, where they bounce, the one change that would convert them.",
      },
      {
        id: "before-after",
        label: "Before/after rationale",
        icon: "🔁",
        purpose: "Defend the redesign in one slide",
        template:
          "Write a before/after rationale slide for {screen}. Output: top 3 problems (one line each), the change made for each, expected impact (qualitative + metric), risk of the change. Audience: skeptical PM.",
      },
      {
        id: "stakeholder-tldr",
        label: "Stakeholder TL;DR",
        icon: "📨",
        purpose: "5-line summary for execs",
        template:
          "Summarise {screen} for a busy exec. 5 lines max: what changed, why, who benefits, success metric, what we need from them. No design jargon.",
      },
    ],
  },
  {
    id: "design-system-doc",
    title: "Design System Docs",
    icon: "📖",
    personaIcon: "PenTool",
    persona: "Designer",
    outcome: "Components → spec, tokens, do's, migration notes.",
    description:
      "Generate maintainable documentation for any design system component: spec, tokens, examples, migration notes.",
    type: "folder",
    roleSlugs: ["designers"],
    preview: [
      "Token table generator",
      "Component spec",
      "Usage examples",
      "Do's & don'ts",
      "Migration notes",
    ],
    prompts: [
      {
        id: "token-table",
        label: "Token table generator",
        icon: "🎨",
        purpose: "Extract every token a component touches",
        template:
          "List every design token referenced by {component_name}. Group by category: color, spacing, typography, radius, shadow, motion. Output markdown table: token, value (default theme), where it's used in the component.",
      },
      {
        id: "component-spec",
        label: "Component spec",
        icon: "📐",
        purpose: "Engineering-ready spec",
        template:
          "Write an engineering spec for {component_name}. Sections: anatomy (parts with names), props (name, type, default, options), states (default/hover/active/focus/disabled/loading), variants, accessibility requirements (ARIA, keyboard).",
      },
      {
        id: "usage-examples",
        label: "Usage examples",
        icon: "🧪",
        purpose: "Three realistic uses, not 'foo/bar'",
        template:
          "Show 3 realistic usages of {component_name}: one minimum-viable, one common, one advanced. For each: JSX-style snippet, screenshot prompt, the user goal it serves.",
      },
      {
        id: "dos-donts",
        label: "Do's & don'ts list",
        icon: "✅",
        purpose: "5 do, 5 don't — concrete",
        template:
          "Write 5 do's and 5 don'ts for using {component_name}. Each one ≤15 words, specific (no platitudes like 'be consistent'). Pair every don't with a do that fixes the situation.",
      },
      {
        id: "migration-notes",
        label: "Migration notes",
        icon: "🔁",
        purpose: "Upgrade guide between versions",
        template:
          "Compare {component_name} between {old_version} and {new_version}. Output: breaking prop changes, deprecated states, accessibility changes, a 3-step migration recipe, code-mod regex snippets where possible.",
      },
      {
        id: "changelog-drafter",
        label: "Changelog drafter",
        icon: "📜",
        purpose: "Release notes that ship with the version",
        template:
          "Draft a changelog entry for {component_name} {new_version}. Sections: Added, Changed, Fixed, Deprecated, Removed. Each item ≤20 words. Mark breaking changes with ⚠️.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // LAWYERS
  // ─────────────────────────────────────────────────────────────────
  {
    id: "contract-redline-os",
    title: "Contract Redline OS",
    icon: "⚖️",
    personaIcon: "Scale",
    persona: "Lawyer",
    outcome: "Paste contract → flagged risks + redline ready.",
    description:
      "Extract clauses, flag risks, draft counter-proposal language, and brief the business in plain English.",
    type: "folder",
    roleSlugs: ["lawyers"],
    preview: [
      "Clause extractor",
      "Risk flagger",
      "Counter-proposal language",
      "Plain-English summary",
      "Comparison vs template",
    ],
    prompts: [
      {
        id: "clause-extractor",
        label: "Clause extractor",
        icon: "🔖",
        purpose: "Index every clause for fast review",
        template:
          "Extract every clause from the contract below. Output markdown table: clause name, section ref, 1-line summary, defined terms used. Include schedules.\n\nContract:\n{contract_text}",
      },
      {
        id: "risk-flagger",
        label: "Risk flagger",
        icon: "🚩",
        purpose: "Surface deal-breakers and outliers",
        template:
          "Review the contract against the priority list: {priority_list}. Flag every clause that materially differs from market or our position. For each: clause ref, why it's risky (1 line), severity (low/med/high/critical).",
      },
      {
        id: "counter-proposal",
        label: "Counter-proposal language",
        icon: "✏️",
        purpose: "Replacement language for flagged clauses",
        template:
          "For each flagged clause from risk-flagger, draft counter-proposal language. Output: original text, proposed text, 1-line rationale, fallback if rejected. Voice: firm but neutral, no aggressive phrasing.",
      },
      {
        id: "plain-english",
        label: "Plain-English summary",
        icon: "🗣️",
        purpose: "Brief the business owner",
        template:
          "Summarise the contract for a non-lawyer business owner. 1-page max. Sections: what we're agreeing to, key obligations, key risks, key dates, who signs. No legalese. Add a 'questions to ask before signing' section.",
      },
      {
        id: "template-compare",
        label: "Comparison vs template",
        icon: "📊",
        purpose: "Diff this contract against our template",
        template:
          "Compare the contract against our template: {template_text}. Output: clauses only in theirs, clauses only in ours, clauses with material differences (table: clause / our text / their text / impact).",
      },
      {
        id: "negotiation-talking-points",
        label: "Negotiation talking points",
        icon: "💬",
        purpose: "What to say in the call",
        template:
          "Build a talking-points sheet for the negotiation call. For each flagged issue: how to open, two fallback positions, the worst position we'll accept, the trade we'll offer. Aim for ≤8 issues.",
      },
      {
        id: "internal-cover-memo",
        label: "Internal cover memo",
        icon: "📨",
        purpose: "Cover memo for sign-off",
        template:
          "Write an internal cover memo for the deal owner. Sections: bottom line (≤30 words), what's still open, risks remaining, recommendation (sign / negotiate / decline) with 1-line reason. Half-page max.",
      },
    ],
  },
  {
    id: "clause-library",
    title: "Clause Library",
    icon: "📚",
    personaIcon: "Scale",
    persona: "Lawyer",
    outcome: "On-demand clause language for common topics.",
    description:
      "Generate well-drafted boilerplate for the six clauses you negotiate every week, tuned to your jurisdiction and risk posture.",
    type: "folder",
    roleSlugs: ["lawyers"],
    preview: [
      "Indemnification clause",
      "Limitation of liability",
      "Termination clause",
      "IP assignment",
      "Confidentiality",
    ],
    prompts: [
      {
        id: "indemnification",
        label: "Indemnification clause",
        icon: "🛡️",
        purpose: "Mutual or one-way indemnification",
        template:
          "Draft an indemnification clause. Jurisdiction: {jurisdiction}. Posture: {posture} (e.g. mutual / vendor-favourable / buyer-favourable). Scope: {scope}. Caps + carve-outs to include: {carve_outs}. Output the clause + a 3-bullet drafting-note section.",
      },
      {
        id: "lol",
        label: "Limitation of liability",
        icon: "⛔",
        purpose: "Cap + carve-outs aligned to deal",
        template:
          "Draft a limitation of liability clause. Cap: {cap}. Exclusions: {exclusions}. Super-cap for: {supercap}. Jurisdiction: {jurisdiction}. Output: clause + 1-line rationale per exclusion.",
      },
      {
        id: "termination",
        label: "Termination clause",
        icon: "🚪",
        purpose: "For convenience + for cause",
        template:
          "Draft a termination clause covering: termination for convenience ({convenience_period}), termination for cause ({cause_grounds}), effect of termination (return of materials, surviving clauses, final fees). Jurisdiction: {jurisdiction}.",
      },
      {
        id: "ip-assignment",
        label: "IP assignment",
        icon: "🧠",
        purpose: "Work-product IP language",
        template:
          "Draft an IP assignment clause for work product under {agreement_type}. Cover: assignment of all rights, moral-rights waiver if allowed in {jurisdiction}, prior-IP exclusions list, licence-back if needed. Output: clause + drafting notes.",
      },
      {
        id: "confidentiality",
        label: "Confidentiality clause",
        icon: "🔒",
        purpose: "Mutual or one-way NDA",
        template:
          "Draft a confidentiality clause. Type: {type}. Term: {term}. Exclusions: standard 5 + any of {extra_exclusions}. Permitted disclosures: {permitted}. Output: clause + 2-line drafting notes.",
      },
      {
        id: "governing-law",
        label: "Governing law + venue",
        icon: "🏛️",
        purpose: "Choice-of-law + forum selection",
        template:
          "Draft governing law and venue clauses for {agreement_type}. Default to {jurisdiction}. Include forum selection (exclusive / non-exclusive), waiver of jury trial if appropriate, prevailing-party fees if {prevailing_party_fees}. Output: clause + when each option fits.",
      },
    ],
  },
  {
    id: "legal-memo-drafter",
    title: "Legal Memo Drafter",
    icon: "📝",
    personaIcon: "Scale",
    persona: "Lawyer",
    outcome: "Issue + facts → IRAC memo in five steps.",
    description:
      "5-step IRAC workflow that turns rough facts into a polished legal memo.",
    type: "workflow",
    roleSlugs: ["lawyers"],
    preview: [
      "Step 1 · Issue + facts intake",
      "Step 2 · Rule research outline",
      "Step 3 · Apply rule to facts",
      "Step 4 · Counter-arguments",
      "Step 5 · Final memo draft",
    ],
    prompts: [
      {
        id: "step1-intake",
        label: "Step 1 · Issue + facts intake",
        icon: "🎯",
        purpose: "Crisp issue statement + relevant facts",
        template:
          "From the rough brief below, extract: the precise legal issue (one sentence), facts material to that issue (bulleted), facts likely immaterial (bulleted, to set aside). Flag any missing facts you'd need to answer well.\n\nBrief:\n{brief}",
      },
      {
        id: "step2-rule",
        label: "Step 2 · Rule research outline",
        icon: "📚",
        purpose: "Statutes, cases, secondary sources",
        template:
          "Outline the rule for the issue from step 1 in {jurisdiction}. List: governing statute (cite), top 3 cases with 1-line holdings, any persuasive authority worth citing. Note splits or unsettled areas with one line each.",
      },
      {
        id: "step3-apply",
        label: "Step 3 · Apply rule to facts",
        icon: "🔗",
        purpose: "Apply each rule element to our facts",
        template:
          "Apply the rule from step 2 to the material facts from step 1. For each rule element: cite the authority, state how our facts satisfy or fail it, identify factual gaps. Be honest about weaknesses.",
      },
      {
        id: "step4-counter",
        label: "Step 4 · Counter-arguments",
        icon: "⚔️",
        purpose: "Steelman the opposing view",
        template:
          "Steelman the strongest counter-arguments against our position. For each: the argument, supporting authority, our response (with cite). End with a 1-line predicted outcome and confidence (low/med/high).",
      },
      {
        id: "step5-memo",
        label: "Step 5 · Final memo draft",
        icon: "📜",
        purpose: "IRAC memo, ready to circulate",
        template:
          "Compose the final legal memo using steps 1-4. Format: Question Presented, Brief Answer (2-3 sentences), Statement of Facts, Discussion (IRAC), Conclusion. Tone: confident, hedged where honest. ≤2 pages.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // HR PROFESSIONALS
  // ─────────────────────────────────────────────────────────────────
  {
    id: "job-spec-forge",
    title: "Job Spec Forge",
    icon: "📋",
    personaIcon: "Users",
    persona: "HR Professional",
    outcome: "Hiring brief → JD, rubric, outreach in minutes.",
    description:
      "Turn a hiring manager's brief into a polished job spec, scoring rubric, and ready-to-send outreach.",
    type: "folder",
    roleSlugs: ["hr-professionals"],
    preview: [
      "Role brief intake",
      "Job description draft",
      "Must-have vs nice-to-have",
      "Salary range justifier",
      "Outreach blurb",
    ],
    prompts: [
      {
        id: "role-brief",
        label: "Role brief intake",
        icon: "🎤",
        purpose: "Structured brief from a messy conversation",
        template:
          "Turn this hiring manager input into a structured role brief: {raw_input}\n\nSections: mission (one sentence), top 3 outcomes the hire owns in year 1, must-have skills, nice-to-have skills, internal title + level, dealbreakers, ideal start date.",
      },
      {
        id: "jd-draft",
        label: "Job description draft",
        icon: "📝",
        purpose: "JD that doesn't read like a JD",
        template:
          "Write a JD from the brief above. Format: 2-sentence intro (mission), 'what you'll do' (5 bullets), 'what you need' (5 bullets), 'nice to have' (3 bullets), comp + benefits, 'how to apply'. Voice: warm, specific, no buzzwords.",
      },
      {
        id: "must-vs-nice",
        label: "Must-have vs nice-to-have audit",
        icon: "🪜",
        purpose: "Trim the wishlist to what's real",
        template:
          "Audit the must-have list from the brief. For each item: is this truly required day 1 or is it nice-to-have? Be ruthless. Suggest moving items to nice-to-have with a 1-line reason. Aim to reduce must-haves to ≤6.",
      },
      {
        id: "salary-justifier",
        label: "Salary range justifier",
        icon: "💰",
        purpose: "Defend the band internally",
        template:
          "Justify a {currency}{low}-{high} band for this role in {market}. Cover: market data comp ranges (cite sources), why our band sits where it does (top quartile / median / bottom), trade-offs of moving it. ≤200 words.",
      },
      {
        id: "interview-rubric",
        label: "Interview rubric",
        icon: "📊",
        purpose: "Calibrated scorecard from must-haves",
        template:
          "Build an interview scorecard from the must-haves. For each: what signal to look for, behavioural question that surfaces it, scoring anchors for 1/3/5. Output markdown table.",
      },
      {
        id: "outreach-blurb",
        label: "Outreach blurb",
        icon: "✉️",
        purpose: "Recruiter outreach intro",
        template:
          "Write a recruiter outreach blurb (≤90 words) to a strong candidate for this role. Open with one specific reason we're reaching out to them, the most compelling line of the role, one easy call-to-action. No bait, no fake compliments.",
      },
    ],
  },
  {
    id: "interview-question-bank",
    title: "Interview Question Bank",
    icon: "🎤",
    personaIcon: "Users",
    persona: "HR Professional",
    outcome: "Calibrated behavioural + technical question sets.",
    description:
      "Generate behavioural, technical, and culture-fit questions plus a take-home brief and scorecard.",
    type: "folder",
    roleSlugs: ["hr-professionals", "recruiters"],
    preview: [
      "Behavioural generator",
      "Technical screener",
      "Culture-fit prompts",
      "Reference-check script",
      "Take-home brief",
    ],
    prompts: [
      {
        id: "behavioural",
        label: "Behavioural generator",
        icon: "🧠",
        purpose: "STAR-friendly questions per competency",
        template:
          "For competency '{competency}' at level {level}, write 6 behavioural questions. Each: the prompt (10-15 words), the signal we're listening for (1 line), an example excellent answer (≤40 words).",
      },
      {
        id: "technical-screener",
        label: "Technical screener",
        icon: "🛠️",
        purpose: "30-min screening questions",
        template:
          "Build a 30-min technical screen for {role}. Output: 1 warm-up (5 min), 2 core probes (10 min each), 1 stretch (5 min). For each: question, what 'good' looks like, common red flags, a follow-up if they breeze through.",
      },
      {
        id: "culture-fit",
        label: "Culture-fit prompts",
        icon: "🤝",
        purpose: "Values-aligned questions without bias",
        template:
          "Write 5 culture-fit questions aligned to these values: {values}. Each must probe behaviour, not personality. Add a note on what biases to watch for (affinity, similarity, halo) when interpreting answers.",
      },
      {
        id: "reference-check",
        label: "Reference-check script",
        icon: "📞",
        purpose: "Tight 20-min reference call",
        template:
          "Write a 20-min reference-check script. Open with framing + consent, ask: how they worked together, top 2 strengths with examples, area that improved over time, would-rehire question, anything we should ask the candidate. Close with thanks + confidentiality.",
      },
      {
        id: "take-home",
        label: "Take-home brief",
        icon: "📄",
        purpose: "≤4-hour assignment with rubric",
        template:
          "Write a take-home brief for {role}. Time cap: 4 hours. Sections: context, exact task, deliverable format, success criteria (3-5 bullets), rubric (1-5 with anchors), what we won't grade on. Tone: respectful of their time.",
      },
      {
        id: "scorecard",
        label: "Scorecard template",
        icon: "📊",
        purpose: "Per-interview structured feedback",
        template:
          "Build a per-interview scorecard. Sections: competencies scored (from rubric), 'specific moments' field (2-3 quotes), 'unanswered questions' field, hire / no-hire / strong-no-hire vote with 1-line rationale. Calibrated language only.",
      },
    ],
  },
  {
    id: "performance-review-draft",
    title: "Performance Review Draft",
    icon: "📈",
    personaIcon: "Users",
    persona: "HR Professional",
    outcome: "Goals + behaviours → calibrated review doc.",
    description:
      "5-step workflow from raw inputs (goals vs actuals, behaviours, recognition) to a polished, calibrated review.",
    type: "workflow",
    roleSlugs: ["hr-professionals"],
    preview: [
      "Step 1 · Goal-vs-actual diff",
      "Step 2 · Behaviours snapshot",
      "Step 3 · Growth-area framing",
      "Step 4 · Recognition specifics",
      "Step 5 · Polished review doc",
    ],
    prompts: [
      {
        id: "step1-goals",
        label: "Step 1 · Goal-vs-actual diff",
        icon: "🎯",
        purpose: "Crisp gap analysis for each goal",
        template:
          "For each goal {goals_list}, compare to actuals {actuals_list}. Output markdown table: goal, target, actual, % achieved, ≤15-word explanation, drove-it (self / team / circumstances).",
      },
      {
        id: "step2-behaviours",
        label: "Step 2 · Behaviours snapshot",
        icon: "🧭",
        purpose: "Values-aligned behaviour bullets",
        template:
          "Using these peer notes {peer_notes} and manager notes {manager_notes}, surface 3 behaviours that strengthened the team and 3 that need calibration. Each: 1 specific moment, value it maps to, observed impact.",
      },
      {
        id: "step3-growth",
        label: "Step 3 · Growth-area framing",
        icon: "🌱",
        purpose: "Constructive, action-oriented",
        template:
          "Reframe the calibration behaviours from step 2 into growth areas. For each: what to keep doing, what to stop, one concrete experiment for next cycle, success indicator. Voice: candid, hopeful, no euphemism.",
      },
      {
        id: "step4-recognition",
        label: "Step 4 · Recognition specifics",
        icon: "🌟",
        purpose: "Praise that lands because it's specific",
        template:
          "Write the recognition section. For each of the top 3 wins from step 1 + the 3 strength behaviours from step 2: name the moment, the impact (numbers if any), the value/skill it showcased. No vague compliments.",
      },
      {
        id: "step5-doc",
        label: "Step 5 · Polished review doc",
        icon: "📄",
        purpose: "Calibrated final document",
        template:
          "Compose the review using steps 1-4. Sections: Headline (1 sentence rating + reason), Wins, Growth Areas + Plan, Recognition, Goals for Next Cycle, Self-Reflection Questions for 1:1. ≤2 pages.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // ACCOUNTANTS
  // ─────────────────────────────────────────────────────────────────
  {
    id: "reconciliation-notes-pack",
    title: "Reconciliation Notes",
    icon: "🧾",
    personaIcon: "Calculator",
    persona: "Accountant",
    outcome: "Variance → explainer + audit-ready notes.",
    description:
      "Speed up month-end with structured variance explanations, anomaly flags, and clean audit trail summaries.",
    type: "folder",
    roleSlugs: ["accountants"],
    preview: [
      "Variance explainer",
      "Anomaly flagger",
      "Adjusting-entry justification",
      "Audit trail summary",
      "Client-friendly recap",
    ],
    prompts: [
      {
        id: "variance-explainer",
        label: "Variance explainer",
        icon: "📊",
        purpose: "Why the line moved, in plain English",
        template:
          "Explain the variance for {account} between {period_a} and {period_b}. Inputs: {ledger_excerpt}. Output: % and absolute variance, top 3 drivers with amount each, 1-line context, whether material under {materiality_threshold}.",
      },
      {
        id: "anomaly-flagger",
        label: "Anomaly flagger",
        icon: "🚨",
        purpose: "Surface entries that don't pattern-match",
        template:
          "Scan ledger {ledger_excerpt} for anomalies vs {baseline_window}. Flag: round numbers, weekend postings, duplicate-looking entries, entries above {threshold} without memo, accounts moved unusually. For each: line ref, why it's flagged, recommended follow-up.",
      },
      {
        id: "adjusting-entry",
        label: "Adjusting-entry justification",
        icon: "✏️",
        purpose: "Memo behind each adjusting entry",
        template:
          "Justify adjusting entry: debit {debit_account} {amount}, credit {credit_account} {amount}. Provide: GAAP / IFRS basis (cite), 1-paragraph rationale, supporting workings reference, reversal expected next period (yes/no + why).",
      },
      {
        id: "audit-trail",
        label: "Audit trail summary",
        icon: "🔍",
        purpose: "What an auditor needs in one place",
        template:
          "Summarise the audit trail for {account} for {period}. Output: opening balance, 5 largest movements (date, ref, counter-party, amount), closing balance, supporting docs filed (list), any items lacking docs.",
      },
      {
        id: "client-recap",
        label: "Client-friendly recap",
        icon: "💬",
        purpose: "Plain-English close summary",
        template:
          "Write a client-friendly month-end recap. Cover: headline P&L number with directional cue, top 3 things to know (≤15 words each), one item that needs the client's input, deadline + how to respond. ≤180 words.",
      },
    ],
  },
  {
    id: "client-memo-builder",
    title: "Client Memo Builder",
    icon: "📨",
    personaIcon: "Calculator",
    persona: "Accountant",
    outcome: "Tax position, close summary, recs — drafted.",
    description:
      "Polished draft memos for the five client touchpoints you write every month.",
    type: "folder",
    roleSlugs: ["accountants"],
    preview: [
      "Engagement letter",
      "Tax position memo",
      "Quarter-close summary",
      "Recommendation letter",
      "Follow-up checklist",
    ],
    prompts: [
      {
        id: "engagement-letter",
        label: "Engagement letter draft",
        icon: "📜",
        purpose: "Scope, fees, deliverables, terms",
        template:
          "Draft an engagement letter for {client_name}. Scope: {scope}. Period: {engagement_period}. Fees: {fee_structure}. Include: deliverables, exclusions, client responsibilities, termination, liability cap, confidentiality. Tone: professional, plain English.",
      },
      {
        id: "tax-position-memo",
        label: "Tax position memo",
        icon: "🧮",
        purpose: "Defensible position with authority",
        template:
          "Memo our position on {tax_issue} for {client_name} in {jurisdiction}. Sections: facts, applicable authority (cite), analysis, conclusion (likely / more-likely-than-not / probable), risks if challenged, recommended documentation.",
      },
      {
        id: "quarter-close-summary",
        label: "Quarter-close summary",
        icon: "📊",
        purpose: "What changed, what to do",
        template:
          "Write a quarter-close summary for {client_name}. Sections: headline P&L vs plan, cash position, top 3 wins, top 3 watch-outs, 2 actions we recommend (with deadline + owner). 1 page.",
      },
      {
        id: "recommendation-letter",
        label: "Recommendation letter",
        icon: "💡",
        purpose: "Specific recommendation, justified",
        template:
          "Draft a recommendation letter on {topic} for {client_name}. Sections: recommendation (one sentence), why now, options considered (3) with pros / cons / impact, our recommendation + rationale, next step + timing. ≤1.5 pages.",
      },
      {
        id: "follow-up-checklist",
        label: "Follow-up checklist",
        icon: "✅",
        purpose: "Open items + ownership + deadlines",
        template:
          "Build a follow-up checklist after our meeting on {meeting_topic}. Each item: action, owner (us / client), deadline, what 'done' looks like. Group by us / client. End with a single 'next touchpoint' line.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // FINANCIAL ADVISORS
  // ─────────────────────────────────────────────────────────────────
  {
    id: "client-brief-os",
    title: "Client Brief OS",
    icon: "📁",
    personaIcon: "DollarSign",
    persona: "Financial Advisor",
    outcome: "Discovery → plan-on-page → recap email.",
    description:
      "Run client conversations end-to-end: discovery questions, plan-on-page, tax-impact callouts, and recap.",
    type: "folder",
    roleSlugs: ["financial-advisors"],
    preview: [
      "Discovery questions",
      "Goals-into-actions",
      "Risk profile summary",
      "Plan-on-page",
      "Meeting recap",
    ],
    prompts: [
      {
        id: "discovery-questions",
        label: "Discovery questions",
        icon: "🔎",
        purpose: "First-meeting question set",
        template:
          "Build a first-meeting discovery question set for {client_segment}. Cover: life stage + dependents, income + expenses, goals + horizons, risk tolerance, prior bad experiences with money, what success looks like in 5 years. ≤15 questions, sequence them naturally.",
      },
      {
        id: "goals-actions",
        label: "Goals-into-actions",
        icon: "🪜",
        purpose: "Turn vague goals into measurable actions",
        template:
          "Convert client goals {client_goals} into actionable plan items. For each goal: clarified version (specific + measurable + dated), 2 actions, primary metric to track, review cadence.",
      },
      {
        id: "risk-profile",
        label: "Risk profile summary",
        icon: "⚖️",
        purpose: "Calibrated risk read-out",
        template:
          "From these client answers {risk_answers}, write a risk profile summary. Output: stated tolerance, capacity (based on horizon + dependents + buffer), need (return required to hit goals), inferred behavioural risk, recommended portfolio risk band.",
      },
      {
        id: "plan-on-page",
        label: "Plan-on-page",
        icon: "📄",
        purpose: "One-page plan the client keeps",
        template:
          "Compose a one-page plan for {client_name}. Sections: top 3 goals (with target + date), allocation (with rationale), cashflow guardrails, tax considerations, what we'll review each quarter, what we change only on triggers (list). Plain English.",
      },
      {
        id: "tax-impact",
        label: "Tax-impact callout",
        icon: "🧮",
        purpose: "Surface tax in any recommendation",
        template:
          "For the recommendation {recommendation} in {jurisdiction}, write the tax-impact callout. Output: immediate tax effect, long-term tax effect, brackets / thresholds that change behaviour, 1 action that mitigates downside.",
      },
      {
        id: "meeting-recap",
        label: "Meeting recap",
        icon: "📨",
        purpose: "Calm, specific recap email",
        template:
          "Write a recap email after a planning meeting with {client_name}. Sections: what we covered (3 bullets), what we agreed to do (us + client, with deadlines), what stays the same, next meeting date. Tone: calm, no jargon. ≤220 words.",
      },
    ],
  },
  {
    id: "quarterly-letter-forge",
    title: "Quarterly Letter Forge",
    icon: "📜",
    personaIcon: "DollarSign",
    persona: "Financial Advisor",
    outcome: "Markets + portfolio → letter clients actually read.",
    description:
      "5-step workflow that turns market data, portfolio commentary, and outlook into a polished quarterly letter.",
    type: "workflow",
    roleSlugs: ["financial-advisors"],
    preview: [
      "Step 1 · Market recap",
      "Step 2 · Portfolio commentary",
      "Step 3 · Allocation rationale",
      "Step 4 · Forward outlook",
      "Step 5 · Polished client letter",
    ],
    prompts: [
      {
        id: "step1-market",
        label: "Step 1 · Market recap",
        icon: "📈",
        purpose: "Quarter-in-numbers, not jargon",
        template:
          "Summarise {quarter} market action using {market_data}. Output: 4 bullets (equities, fixed income, rates, currencies / commodities) with the number that mattered + one-line cause. No analyst jargon.",
      },
      {
        id: "step2-portfolio",
        label: "Step 2 · Portfolio commentary",
        icon: "💼",
        purpose: "What worked and what didn't",
        template:
          "Using returns + holdings {portfolio_data}, write portfolio commentary. Cover: 2 largest contributors, 2 largest detractors, what we did or didn't do in response, how it sits vs benchmark. Honest tone, no spin.",
      },
      {
        id: "step3-allocation",
        label: "Step 3 · Allocation rationale",
        icon: "🥧",
        purpose: "Why our weights look the way they do",
        template:
          "Justify current allocation {current_allocation} vs target {target_allocation}. For each over- or under-weight: thesis (≤25 words), trigger that would change our mind, expected duration of the tilt.",
      },
      {
        id: "step4-outlook",
        label: "Step 4 · Forward outlook",
        icon: "🔮",
        purpose: "Calibrated, not bold",
        template:
          "Write a forward-looking section. Cover: 3 things we're watching, what would change our positioning, what we won't react to (even if it makes news). End with: 'What this means for you'. Avoid bold calls; emphasise process.",
      },
      {
        id: "step5-letter",
        label: "Step 5 · Polished client letter",
        icon: "✍️",
        purpose: "Letter the client wants to read",
        template:
          "Compose the quarterly letter. Sections: opening (3 sentences, conversational), Quarter recap, Portfolio commentary, Allocation, Outlook, Closing (one personal sentence + how to reach us). ≤1100 words. Plain English, 1 metaphor max.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // REALTORS
  // ─────────────────────────────────────────────────────────────────
  {
    id: "listing-copy-studio",
    title: "Listing Copy Studio",
    icon: "🏠",
    personaIcon: "Home",
    persona: "Realtor",
    outcome: "Property details → MLS + social + email copy.",
    description:
      "Spin one property's facts into MLS-safe listing copy, social captions, open-house invites, and a hero line that sells.",
    type: "folder",
    roleSlugs: ["realtors"],
    preview: [
      "Hero line",
      "Feature bullets",
      "Neighborhood blurb",
      "Open house invite",
      "Social caption",
    ],
    prompts: [
      {
        id: "hero-line",
        label: "Hero line",
        icon: "✨",
        purpose: "One sentence that earns the click",
        template:
          "Write 5 hero line options for the listing below. Each ≤15 words, emotive but factual, no clichés ('charming', 'must see'). Output as numbered list with a 1-line rationale for the strongest.\n\nListing facts:\n{listing_facts}",
      },
      {
        id: "feature-bullets",
        label: "Feature bullets",
        icon: "🔑",
        purpose: "Top 8 features, ranked by buyer pull",
        template:
          "From the listing facts {listing_facts}, write 8 feature bullets. Rank by likely buyer appeal for {target_buyer}. Each ≤15 words, specific (numbers, materials, brands). Mark the top 3 with a star.",
      },
      {
        id: "neighborhood-blurb",
        label: "Neighborhood blurb",
        icon: "🌳",
        purpose: "Surroundings without filler",
        template:
          "Write a 120-word neighborhood blurb for {neighborhood}. Cover: walkability, schools (cite), commute, two specific landmarks, the buyer this neighborhood fits. No realtor clichés.",
      },
      {
        id: "open-house-invite",
        label: "Open house invite",
        icon: "🚪",
        purpose: "Email + social invite, ready to send",
        template:
          "Write an open house invite for {address} on {date_time}. Output: subject line, 80-word email body, 30-word Instagram caption, 1-line text-message blurb. Include parking + RSVP details.",
      },
      {
        id: "social-caption",
        label: "Social caption",
        icon: "📸",
        purpose: "Caption + 8 tags per platform",
        template:
          "Write social captions for {listing_address}. Output for each: Instagram (≤150 words + 8 tags), Facebook (≤100 words), LinkedIn (≤80 words). Adjust voice per platform; emojis only on Instagram.",
      },
      {
        id: "mls-safe",
        label: "MLS-safe rewrite",
        icon: "⚖️",
        purpose: "Fair-housing compliant rewrite",
        template:
          "Rewrite this listing description to be fair-housing-compliant in {jurisdiction}. Strip discriminatory cues (school references, demographic language, family-type wording). Keep factual selling points. Output: rewritten copy + a 3-bullet diff.\n\nOriginal:\n{original_copy}",
      },
    ],
  },
  {
    id: "market-snapshot",
    title: "Market Snapshot",
    icon: "📊",
    personaIcon: "Home",
    persona: "Realtor",
    outcome: "Comparable analysis → pricing + buyer / seller packets.",
    description:
      "Hand a stack of comps over and walk out with pricing recommendations, buyer-ready packets, and negotiation prep.",
    type: "folder",
    roleSlugs: ["realtors"],
    preview: [
      "Comparable-properties summary",
      "Pricing recommendation memo",
      "Buyer-ready packet",
      "Seller-update email",
      "Negotiation prep",
    ],
    prompts: [
      {
        id: "comparables",
        label: "Comparable-properties summary",
        icon: "🧮",
        purpose: "Comp set in one readable table",
        template:
          "Summarise comps {comps_data} for {subject_property}. Output markdown table: address, beds/baths/sqft, list / sold / DOM, $/sqft, 1-line note (recent sale, withdrawn, special condition). Add a 2-line takeaway at the bottom.",
      },
      {
        id: "pricing-recommendation",
        label: "Pricing recommendation memo",
        icon: "💲",
        purpose: "Price band + rationale",
        template:
          "Write a pricing recommendation memo for {subject_property}. Output: recommended list band, where in the band you'd start, rationale (cite comps), risk if priced higher / lower, expected DOM at that price.",
      },
      {
        id: "buyer-packet",
        label: "Buyer-ready packet",
        icon: "🛒",
        purpose: "One-pager for serious buyers",
        template:
          "Compose a buyer-ready packet for {subject_property}. Sections: property snapshot, why it's priced where it is, comp set short-list, neighborhood blurb, viewing + offer process, deadline calendar. ≤2 pages, scannable.",
      },
      {
        id: "seller-update",
        label: "Seller-update email",
        icon: "📨",
        purpose: "Weekly update sellers actually want",
        template:
          "Write a weekly seller-update email for {seller_name}. Sections: showings this week, feedback themes, market shifts that affect their listing, what we'll change this week, one ask of them. Calm, specific, ≤200 words.",
      },
      {
        id: "negotiation-prep",
        label: "Negotiation prep",
        icon: "🎯",
        purpose: "Walk into the call with a plan",
        template:
          "Prep the negotiation on {subject_property} given offer {offer_terms} and seller priorities {seller_priorities}. Output: counter strategy (top + backup), 3 concessions we'd accept, 3 we won't, deal-killer language to avoid, 1 question to ask the other agent before responding.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // PROJECT MANAGERS
  // ─────────────────────────────────────────────────────────────────
  {
    id: "status-update-os",
    title: "Status Update OS",
    icon: "📡",
    personaIcon: "ListChecks",
    persona: "Project Manager",
    outcome: "Raw notes → exec status, RAG, demo script.",
    description:
      "Standardise weekly status across email, dashboard, decision log, and sprint demos.",
    type: "folder",
    roleSlugs: ["project-managers"],
    preview: [
      "Weekly status email",
      "RAG dashboard summary",
      "Stakeholder one-pager",
      "Risk register entry",
      "Sprint demo script",
    ],
    prompts: [
      {
        id: "weekly-status",
        label: "Weekly status email",
        icon: "📨",
        purpose: "Crisp Friday email leadership actually reads",
        template:
          "Write the weekly status email for {project_name}. Sections: headline (1 sentence + RAG), shipped this week, blocked / risks, decisions needed (with deadline), next week's focus. ≤250 words. Voice: direct, no buzzwords.",
      },
      {
        id: "rag-dashboard",
        label: "RAG dashboard summary",
        icon: "🚥",
        purpose: "Overall + per-stream RAG with reasons",
        template:
          "Compute the RAG status for {project_name}. Inputs: {scope_status}, {schedule_status}, {budget_status}, {team_status}. Output: overall RAG, per-dimension RAG, ≤15-word reason per dimension, 1 action that would move the worst dimension to green.",
      },
      {
        id: "stakeholder-onepager",
        label: "Stakeholder one-pager",
        icon: "📄",
        purpose: "Pre-read for a steerco",
        template:
          "Build a one-pager for steerco on {project_name}. Sections: ask of the room (one sentence), where we are vs plan, top 3 risks + mitigations, decisions needed, next milestone with date. Scannable.",
      },
      {
        id: "risk-entry",
        label: "Risk register entry",
        icon: "⚠️",
        purpose: "Single risk, properly logged",
        template:
          "Log a risk for {project_name}. Inputs: {risk_description}. Output fields: risk statement (cause → event → effect), likelihood (1-5) + reason, impact (1-5) + reason, owner, mitigation, trigger that escalates, review date.",
      },
      {
        id: "decision-log",
        label: "Decision log entry",
        icon: "🗂️",
        purpose: "Decision captured before it's forgotten",
        template:
          "Capture decision: {decision_summary}. Output: context (≤40 words), options considered (3), criteria, decision, dissenters + their concern, what reverses this decision, owner of the consequence, date.",
      },
      {
        id: "sprint-demo",
        label: "Sprint demo script",
        icon: "🎬",
        purpose: "15-min demo with crisp transitions",
        template:
          "Write a 15-min sprint demo script for {sprint_summary}. Output: opening (30s, what we'll cover), 3 demos (4 min each: setup → action → result → why-it-matters), Q&A prompts (3), closing ask. Tight transitions.",
      },
    ],
  },
  {
    id: "risk-register-builder",
    title: "Risk Register Builder",
    icon: "⚠️",
    personaIcon: "ListChecks",
    persona: "Project Manager",
    outcome: "Risks discovered, graded, mitigated, escalated.",
    description:
      "Run a structured risk workshop in five prompts: discover, grade, mitigate, escalate, review.",
    type: "folder",
    roleSlugs: ["project-managers"],
    preview: [
      "Risk discovery prompts",
      "Likelihood + impact grading",
      "Mitigation plan",
      "Escalation triggers",
      "Quarterly review framing",
    ],
    prompts: [
      {
        id: "discovery",
        label: "Risk discovery prompts",
        icon: "🔭",
        purpose: "Surface the risks people whisper about",
        template:
          "Generate 12 risk-discovery prompts for {project_name}. Mix categories: scope, schedule, budget, team, vendor, external, regulatory. Each prompt should make someone say 'oh yeah, that…'. 1 line each.",
      },
      {
        id: "grading",
        label: "Likelihood + impact grading",
        icon: "📊",
        purpose: "Calibrated scoring with anchors",
        template:
          "Grade each risk from {risk_list} with likelihood (1-5) + impact (1-5). For each: score, the anchor description that matched (define the scale once at the top), composite score, top-N flag if ≥ {threshold}.",
      },
      {
        id: "mitigation-plan",
        label: "Mitigation plan",
        icon: "🛡️",
        purpose: "Avoid / reduce / transfer / accept",
        template:
          "For each top-N risk from grading, draft a mitigation plan. Output: strategy (avoid / reduce / transfer / accept), 2 actions with owner + due date, residual risk after, cost / time to mitigate.",
      },
      {
        id: "escalation",
        label: "Escalation triggers",
        icon: "🚨",
        purpose: "When does this risk leave the team",
        template:
          "Define escalation triggers for each top-N risk. For each: leading indicator (specific, measurable), threshold that triggers escalation, who gets escalated to, message template (≤40 words).",
      },
      {
        id: "review-framing",
        label: "Quarterly review framing",
        icon: "🗓️",
        purpose: "Run the next risk review well",
        template:
          "Outline a 45-min quarterly risk review for {project_name}. Output: agenda with time-boxing, the 3 questions that drive value, the 2 questions that waste time (don't ask them), pre-read, decisions to leave the room with.",
      },
    ],
  },
  {
    id: "meeting-os",
    title: "Meeting OS",
    icon: "🗓️",
    personaIcon: "ListChecks",
    persona: "Project Manager",
    outcome: "Goal → agenda → notes → actions → recap.",
    description:
      "5-step workflow that converts a meeting goal into a tight agenda, live notes, decisions, and a recap.",
    type: "workflow",
    roleSlugs: ["project-managers", "executives"],
    preview: [
      "Step 1 · Agenda from goal",
      "Step 2 · Pre-read brief",
      "Step 3 · Live notes capture",
      "Step 4 · Decisions + actions",
      "Step 5 · Post-meeting recap",
    ],
    prompts: [
      {
        id: "step1-agenda",
        label: "Step 1 · Agenda from goal",
        icon: "🎯",
        purpose: "Goal-shaped agenda, time-boxed",
        template:
          "Turn this goal into a meeting agenda: {goal}. Output: meeting outcome (1 sentence), pre-read, agenda items with owner + duration, question that drives each item, what is out of scope.",
      },
      {
        id: "step2-preread",
        label: "Step 2 · Pre-read brief",
        icon: "📚",
        purpose: "Single-page pre-read",
        template:
          "Write a pre-read for the agenda from step 1. Sections: context (≤80 words), data the room needs to see (table or chart description), the decision we're seeking, the 'no' positions we already know.",
      },
      {
        id: "step3-notes",
        label: "Step 3 · Live notes capture",
        icon: "🗒️",
        purpose: "Notes structure to fill live",
        template:
          "Build a live-notes template structured to match the agenda. For each item: discussion (bulleted), decision, action items (owner / by-when), parked items. Make it grep-friendly.",
      },
      {
        id: "step4-actions",
        label: "Step 4 · Decisions + actions",
        icon: "✅",
        purpose: "Extract decisions and actions cleanly",
        template:
          "From these raw notes {raw_notes}, extract decisions (each: decision, dissenters, owner of consequence) and action items (each: action, owner, due date, definition of done). Drop chatter.",
      },
      {
        id: "step5-recap",
        label: "Step 5 · Post-meeting recap",
        icon: "📨",
        purpose: "Same-day recap email",
        template:
          "Compose the recap email using outputs from steps 3-4. Sections: TL;DR (3 lines), decisions, actions (markdown table), parked items, next touchpoint. Send within 24h. ≤280 words.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // EXECUTIVES
  // ─────────────────────────────────────────────────────────────────
  {
    id: "board-update-draft",
    title: "Board Update Draft",
    icon: "🪑",
    personaIcon: "Crown",
    persona: "Executive",
    outcome: "Metrics + narrative + asks → board-ready pack.",
    description:
      "6-step workflow that produces a defensible board update with metrics, narrative, risks, asks, and a Q&A drill.",
    type: "workflow",
    roleSlugs: ["executives", "founders"],
    preview: [
      "Step 1 · Headline metrics block",
      "Step 2 · Narrative wins / losses",
      "Step 3 · Risks + mitigations",
      "Step 4 · Strategic asks",
      "Step 5 · Q&A drill",
    ],
    prompts: [
      {
        id: "step1-metrics",
        label: "Step 1 · Headline metrics block",
        icon: "📊",
        purpose: "Top metrics with vs-plan + vs-prior",
        template:
          "From {metrics_input}, build the headline metrics block. Choose ≤8 metrics that match the company stage. For each: value, % vs plan, % vs prior period, color (green / amber / red), one-line cause.",
      },
      {
        id: "step2-narrative",
        label: "Step 2 · Narrative wins / losses",
        icon: "📖",
        purpose: "Two short stories: one win, one loss",
        template:
          "Write the narrative section. One ≤120-word win story (what happened, why it worked, what we'll do more of) and one ≤120-word loss story (what happened, root cause we're confident about, what we're changing). No vague language.",
      },
      {
        id: "step3-risks",
        label: "Step 3 · Risks + mitigations",
        icon: "⚠️",
        purpose: "The board's true value: surface risks",
        template:
          "List 3 risks the board needs to know about. For each: risk statement (one sentence), our current confidence on cause, mitigation in flight, what we'd ask the board to help with if it worsens. Resist temptation to hide.",
      },
      {
        id: "step4-asks",
        label: "Step 4 · Strategic asks",
        icon: "🎯",
        purpose: "Crisp asks, ordered by leverage",
        template:
          "Draft 3 strategic asks for the board. For each: ask (one sentence), why this group is uniquely able to help, what 'help' looks like (intro / decision / capital / experience), follow-up cadence.",
      },
      {
        id: "step5-qa",
        label: "Step 5 · Q&A drill",
        icon: "🥊",
        purpose: "Pre-mortem the hardest questions",
        template:
          "Predict the 8 hardest questions the board will ask based on the metrics + narrative. For each: the question (in their voice), the worst-case framing, a 60-second answer that doesn't dodge.",
      },
      {
        id: "step6-cover-email",
        label: "Step 6 · Cover email",
        icon: "📨",
        purpose: "Make them want to read the deck",
        template:
          "Write the cover email that goes with the board pack. ≤140 words. Open with the single most important thing they should remember. Reference one ask explicitly. Provide the meeting date and what to pre-read first.",
      },
    ],
  },
  {
    id: "all-hands-script",
    title: "All-Hands Script",
    icon: "🎙️",
    personaIcon: "Crown",
    persona: "Executive",
    outcome: "Quarterly numbers → script the team feels.",
    description:
      "Run the quarterly all-hands without the usual flatness: recap, story, Q&A, Slack TL;DR.",
    type: "folder",
    roleSlugs: ["executives"],
    preview: [
      "Quarterly recap",
      "Numbers in plain English",
      "Story of the quarter",
      "Q&A prep",
      "Slack TL;DR follow-up",
    ],
    prompts: [
      {
        id: "quarterly-recap",
        label: "Quarterly recap",
        icon: "📅",
        purpose: "What we said we'd do vs did",
        template:
          "Draft the quarterly recap for {company_name}. Reference last quarter's commitments {prior_commitments}. For each: did / didn't / partly, what we learned. Add 2 unexpected wins and 1 unexpected loss. ≤300 words spoken.",
      },
      {
        id: "numbers-plain",
        label: "Numbers in plain English",
        icon: "🧮",
        purpose: "Make metrics feel human",
        template:
          "Translate {key_metrics} into plain-English narration the whole team understands. Each metric: one sentence on what it is, one sentence on what it means for the team's day-to-day. No 'directionally', no 'flat YoY'.",
      },
      {
        id: "story-quarter",
        label: "Story of the quarter",
        icon: "📖",
        purpose: "One story everyone remembers",
        template:
          "Write the story of the quarter. Inputs: {moment_options}. Pick one moment. Structure: stakes, the team's choice, what almost broke, what carried, what it tells us about who we are. ≤250 words.",
      },
      {
        id: "qa-prep",
        label: "Q&A prep",
        icon: "🥊",
        purpose: "Surface the hard questions early",
        template:
          "Predict the 5 hardest questions the team will ask given recent context {recent_context}. For each: the question, what they really mean by asking it, the honest answer, what not to say.",
      },
      {
        id: "slack-tldr",
        label: "Slack TL;DR follow-up",
        icon: "💬",
        purpose: "Recap pinned to #general within 1h",
        template:
          "Write the Slack TL;DR after the all-hands. ≤150 words. Sections: top 3 things to remember, what changes for you, what we're still figuring out, link to deck + recording. Reply-friendly tone.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // CONSULTANTS — add 2 more (already has pitch-deck-coach)
  // ─────────────────────────────────────────────────────────────────
  {
    id: "exec-summary-engine",
    title: "Exec Summary Engine",
    icon: "📑",
    personaIcon: "Lightbulb",
    persona: "Consultant",
    outcome: "Findings → SO-WHAT → recommendation slide.",
    description:
      "5-step workflow that converts raw findings into an exec-grade summary with a defensible recommendation.",
    type: "workflow",
    roleSlugs: ["consultants"],
    preview: [
      "Step 1 · Findings intake",
      "Step 2 · SO-WHAT extractor",
      "Step 3 · 3-act narrative",
      "Step 4 · Recommendation slide",
      "Step 5 · 90-day plan",
    ],
    prompts: [
      {
        id: "step1-intake",
        label: "Step 1 · Findings intake",
        icon: "📥",
        purpose: "Sort raw findings into evidence buckets",
        template:
          "From these raw findings {raw_findings}, group into ≤6 evidence buckets. For each: bucket name, 3 supporting data points, the question it answers, confidence level (low / med / high).",
      },
      {
        id: "step2-sowhat",
        label: "Step 2 · SO-WHAT extractor",
        icon: "💡",
        purpose: "Each bucket → one implication",
        template:
          "For each evidence bucket from step 1, write the SO-WHAT in one sentence. Then a second sentence: who acts on it, what they do, when. Skip implications that wouldn't change a decision.",
      },
      {
        id: "step3-narrative",
        label: "Step 3 · 3-act narrative",
        icon: "🎭",
        purpose: "Setup → tension → resolution",
        template:
          "Compose the narrative across 3 acts. Act 1 (setup): the situation in 2 sentences. Act 2 (tension): the conflict surfaced by step 2's SO-WHATs. Act 3 (resolution): the change we propose. ≤350 words.",
      },
      {
        id: "step4-recommendation",
        label: "Step 4 · Recommendation slide",
        icon: "✅",
        purpose: "One slide they remember",
        template:
          "Draft the recommendation slide. Headline (≤12 words: action verb + outcome), 3 supporting points (each ≤20 words), expected impact (qualitative + metric range), cost (effort + risk). 1-line objection + response.",
      },
      {
        id: "step5-90day",
        label: "Step 5 · 90-day plan",
        icon: "🗓️",
        purpose: "What happens day 1, 30, 60, 90",
        template:
          "Build a 90-day plan from the recommendation. For each milestone (day 1, 30, 60, 90): outcome, owner, success indicator. End with a 'kill criteria' line: what would tell us to stop.",
      },
    ],
  },
  {
    id: "stakeholder-interview-plan",
    title: "Stakeholder Interview Plan",
    icon: "🎤",
    personaIcon: "Lightbulb",
    persona: "Consultant",
    outcome: "Map → questions → synthesis → readback.",
    description:
      "Plan a discovery sprint: who to interview, what to ask, how to synthesise, what to read back.",
    type: "folder",
    roleSlugs: ["consultants", "project-managers"],
    preview: [
      "Interview matrix",
      "Discovery questions",
      "Synthesis grid",
      "Themes write-up",
      "Readback deck outline",
    ],
    prompts: [
      {
        id: "interview-matrix",
        label: "Interview matrix",
        icon: "🗺️",
        purpose: "Who, why, and in what order",
        template:
          "From {project_brief} and {org_chart}, design an interview matrix. Output: 8-12 stakeholders, role, what we want to learn from them, why this person uniquely knows it, sequencing (and why that order).",
      },
      {
        id: "discovery-questions",
        label: "Discovery questions",
        icon: "❓",
        purpose: "Question banks per stakeholder type",
        template:
          "For each stakeholder type in {stakeholder_types}, write 10 discovery questions. Mix: opening (low-stakes), context, behaviour, opinion, and one provocative question. Avoid leading questions; encourage stories.",
      },
      {
        id: "synthesis-grid",
        label: "Synthesis grid",
        icon: "🧩",
        purpose: "From quotes to themes",
        template:
          "Build a synthesis grid template. Columns: stakeholder, quote (≤30 words), tag (theme), confidence (low/med/high), conflicting evidence. Add a sample row using {sample_quote}.",
      },
      {
        id: "themes-writeup",
        label: "Themes write-up",
        icon: "📝",
        purpose: "Top 5 themes, defensible",
        template:
          "Write up the top 5 themes from synthesis {synthesis_notes}. For each: theme, 3 supporting quotes (anonymised), strength of evidence, what it implies, what we still don't know.",
      },
      {
        id: "readback-outline",
        label: "Readback deck outline",
        icon: "📊",
        purpose: "Outline that runs the room",
        template:
          "Outline a 25-min readback deck. Sections: ground rules (anonymity), method (5 lines), top 5 themes (1 slide each), the surprise (something they don't expect to hear), recommendations (3), next decisions (with deadline).",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // THERAPISTS
  // ─────────────────────────────────────────────────────────────────
  {
    id: "session-note-helper",
    title: "Session Note Helper",
    icon: "📝",
    personaIcon: "Heart",
    persona: "Therapist",
    outcome: "Session memory → SOAP / DAP draft, ready to refine.",
    description:
      "Draft session notes in SOAP or DAP format, flag risk, justify diagnosis, link to treatment plan.",
    type: "folder",
    roleSlugs: ["therapists"],
    preview: [
      "SOAP draft",
      "DAP draft",
      "Risk assessment flag",
      "Diagnosis rationale",
      "Insurance-safe wording",
    ],
    prompts: [
      {
        id: "soap-draft",
        label: "SOAP-format draft",
        icon: "🧼",
        purpose: "Subjective / Objective / Assessment / Plan",
        template:
          "Draft a SOAP note from these session memory cues: {session_cues}.\n\nSubjective: client's stated experience, presenting concerns, mood.\nObjective: observable behaviours, MSE, affect.\nAssessment: clinical impressions, risk, progress vs goals.\nPlan: interventions used, between-session tasks, next session focus.\n\nFactual, no inferences not supported by cues.",
      },
      {
        id: "dap-draft",
        label: "DAP-format draft",
        icon: "📋",
        purpose: "Data / Assessment / Plan",
        template:
          "Draft a DAP note from these session memory cues: {session_cues}.\n\nData: what was said, what was observed (factual).\nAssessment: clinical interpretation tied to treatment goals.\nPlan: interventions, homework, next session focus.\n\nKeep clinical reasoning visible in Assessment; do not bury it in Data.",
      },
      {
        id: "risk-flag",
        label: "Risk assessment flag",
        icon: "🚨",
        purpose: "Surface SI / HI / abuse / impairment",
        template:
          "From session cues {session_cues}, flag any risk indicators. Cover: suicidal ideation (frequency / plan / means / intent), homicidal ideation, child or vulnerable-adult safety concerns, substance impairment, functional decline. For each: severity, evidence, action taken or planned per practice protocol.",
      },
      {
        id: "diagnosis-rationale",
        label: "Diagnosis rationale",
        icon: "🧠",
        purpose: "Defensible Dx with criteria mapped",
        template:
          "Draft a diagnosis rationale paragraph for {diagnosis_under_consideration}. Map presenting symptoms to {DSM_or_ICD} criteria. Note duration, distress / impairment, rule-outs considered, differential differentiations. Include 1-line note on cultural / contextual factors.",
      },
      {
        id: "treatment-link",
        label: "Treatment-plan link",
        icon: "🔗",
        purpose: "Tie session content to plan goals",
        template:
          "For each treatment goal in {treatment_goals}, link today's session content. Output: goal, what happened today that advanced or stalled it, evidence, suggested next-session focus to keep momentum.",
      },
      {
        id: "insurance-safe",
        label: "Insurance-safe wording",
        icon: "🛡️",
        purpose: "Justifies medical necessity",
        template:
          "Review draft note {draft_note} and rewrite passages for insurance review. Ensure: medical necessity language, functional impairment described, intervention justified by symptoms, no gratuitous detail. Output: rewritten note + 3-bullet diff.",
      },
    ],
  },
  {
    id: "treatment-plan-outline",
    title: "Treatment Plan Outline",
    icon: "🗂️",
    personaIcon: "Heart",
    persona: "Therapist",
    outcome: "Concerns → goals → interventions → measurement.",
    description:
      "5-step workflow that produces a defensible, measurable treatment plan.",
    type: "workflow",
    roleSlugs: ["therapists"],
    preview: [
      "Step 1 · Presenting concerns",
      "Step 2 · Goals + objectives",
      "Step 3 · Interventions matrix",
      "Step 4 · Measurement plan",
      "Step 5 · Polished plan doc",
    ],
    prompts: [
      {
        id: "step1-concerns",
        label: "Step 1 · Presenting concerns",
        icon: "📥",
        purpose: "Concise, evidence-grounded problem list",
        template:
          "From intake notes {intake_notes}, draft a presenting-concerns section. List 3-5 concerns ranked by client priority. For each: 1-line description in client's language, how it impairs functioning, duration, prior treatment history.",
      },
      {
        id: "step2-goals",
        label: "Step 2 · Goals + objectives",
        icon: "🎯",
        purpose: "SMART goals + measurable objectives",
        template:
          "For each presenting concern from step 1, write one long-term goal and two short-term objectives. Each objective: specific behaviour, measurement (frequency / intensity / duration), target value, timeframe. Avoid vague verbs like 'understand'.",
      },
      {
        id: "step3-interventions",
        label: "Step 3 · Interventions matrix",
        icon: "🧰",
        purpose: "Map evidence-based interventions to goals",
        template:
          "Build an interventions matrix: each row is one goal, columns are interventions. Use evidence-based modalities (CBT, DBT, ACT, EMDR, MI, IPT, supportive). For each: brief mechanism, dosage (sessions / cadence), expected response timeline.",
      },
      {
        id: "step4-measurement",
        label: "Step 4 · Measurement plan",
        icon: "📐",
        purpose: "Validated tools per goal",
        template:
          "For each goal from step 2, choose a validated measure (PHQ-9, GAD-7, PCL-5, OQ-45, custom behavioural count, etc.). Specify: instrument, cadence (intake / every N sessions / discharge), response benchmark, deterioration threshold that triggers plan revision.",
      },
      {
        id: "step5-doc",
        label: "Step 5 · Polished plan doc",
        icon: "📄",
        purpose: "Insurance-ready, client-readable",
        template:
          "Compose the final treatment plan. Sections: Presenting concerns, Goals + objectives (with target dates), Interventions, Measurement plan, Anticipated discharge criteria, Risk + safety plan summary, Client + clinician signature lines. Plain language for client side.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // NURSES
  // ─────────────────────────────────────────────────────────────────
  {
    id: "shift-handoff-os",
    title: "Shift Handoff OS",
    icon: "🔁",
    personaIcon: "Stethoscope",
    persona: "Nurse",
    outcome: "Patient state → SBAR + priorities, ready to hand off.",
    description:
      "Standardise shift handoff with SBAR / I-PASS, patient priority lists, and family-update phrasing.",
    type: "folder",
    roleSlugs: ["nurses"],
    preview: [
      "SBAR template",
      "I-PASS rundown",
      "Patient priority list",
      "Pending tasks tracker",
      "Family-update phrasing",
    ],
    prompts: [
      {
        id: "sbar",
        label: "SBAR template",
        icon: "📋",
        purpose: "Structured Situation / Background / Assessment / Recommendation",
        template:
          "Draft SBAR handoff for {patient_id} based on cues {shift_notes}.\n\nSituation: who, where, vitals snapshot, why they're under our care now.\nBackground: relevant history, allergies, lines / drains / airways.\nAssessment: current status by system, trends since last shift.\nRecommendation: what needs to happen this shift, escalation criteria.",
      },
      {
        id: "i-pass",
        label: "I-PASS rundown",
        icon: "🛬",
        purpose: "Illness severity / Patient summary / Action list / Situation awareness / Synthesis by receiver",
        template:
          "Run I-PASS for {patient_id} using {shift_notes}.\n\nIllness severity: stable / watcher / unstable.\nPatient summary: 1-paragraph case + course so far.\nAction list (to-do this shift with timing).\nSituation awareness + contingency planning.\nSynthesis by receiver: prompts for the oncoming nurse to read back.",
      },
      {
        id: "priority-list",
        label: "Patient priority list",
        icon: "🎯",
        purpose: "Rank patients by who needs attention first",
        template:
          "From census {census}, rank patients for the next 4 hours. For each: priority rank, key risk, next clinical task with time, escalation trigger. Sort so the highest-risk patient is first.",
      },
      {
        id: "pending-tasks",
        label: "Pending tasks tracker",
        icon: "✅",
        purpose: "Clean, by-time task list",
        template:
          "Convert these scattered tasks {tasks_input} into a time-ordered tracker. For each: time window, patient, task, dependency (lab back, MD order pending, etc.), 'mine vs pass'.",
      },
      {
        id: "family-update",
        label: "Family-update phrasing",
        icon: "🤝",
        purpose: "Honest, calm phrasing for tough updates",
        template:
          "Draft a family-update script for {patient_id}. Inputs: current clinical state, prognosis hint level (cautious / guarded / favourable), what changed, what's next. Tone: clear, calm, no medical jargon, leaves room for questions. ≤120 words spoken.",
      },
    ],
  },
  {
    id: "patient-education-sheet",
    title: "Patient Education Sheet",
    icon: "🎓",
    personaIcon: "Stethoscope",
    persona: "Nurse",
    outcome: "Diagnosis → readable take-home sheet.",
    description:
      "Convert clinical instructions into plain-language patient education materials at a reading level they understand.",
    type: "folder",
    roleSlugs: ["nurses"],
    preview: [
      "Plain-language diagnosis",
      "Medication instructions",
      "Warning signs to call back",
      "Self-care checklist",
      "Q&A prompt list",
    ],
    prompts: [
      {
        id: "plain-diagnosis",
        label: "Plain-language diagnosis explainer",
        icon: "🩺",
        purpose: "Diagnosis in 5th-grade English",
        template:
          "Explain {diagnosis} to a patient who reads at a 5th-grade level. Sections: what it is (1 sentence), what's happening in the body (1 short paragraph), why it matters for daily life. Avoid Latin / jargon. Translate to {target_language} if specified.",
      },
      {
        id: "med-instructions",
        label: "Medication instructions",
        icon: "💊",
        purpose: "When, how much, what to watch for",
        template:
          "Write medication instructions for {medication}. Cover: dose + timing (with examples), how to take it (with or without food, etc.), common side effects, serious side effects to call about, what to do if a dose is missed. ≤180 words, plain English.",
      },
      {
        id: "warning-signs",
        label: "Warning signs to call back",
        icon: "🚨",
        purpose: "Clear escalation criteria",
        template:
          "List warning signs for {condition} that warrant calling the clinic or going to the ER. Two columns: 'Call the clinic' (within 24h) and 'Go to ER' (now). Each line ≤15 words, behavioural / observable. End with the number to call.",
      },
      {
        id: "self-care-checklist",
        label: "Self-care checklist",
        icon: "✅",
        purpose: "Daily / weekly tasks at home",
        template:
          "Build a self-care checklist for {condition} or {procedure} recovery. Group by daily / weekly / as-needed. Each item is a verb-first phrase ≤12 words. End with one motivating sentence in second-person.",
      },
      {
        id: "qa-prompts",
        label: "Q&A prompt list",
        icon: "❓",
        purpose: "Questions the patient should ask",
        template:
          "Suggest 8 questions the patient should bring to their next visit for {condition}. Mix: clarifying, lifestyle, medication, follow-up, support. Each ≤15 words. Add a line: 'Bring this list with you.'",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // DATA ANALYSTS
  // ─────────────────────────────────────────────────────────────────
  {
    id: "sql-coach",
    title: "SQL Coach",
    icon: "🧮",
    personaIcon: "BarChart3",
    persona: "Data Analyst",
    outcome: "English → SQL, EXPLAIN reads, perf refactors.",
    description:
      "Convert questions into SQL, explain plans, debug joins, refactor slow queries, scaffold dbt models.",
    type: "folder",
    roleSlugs: ["data-analysts"],
    preview: [
      "Query from English",
      "EXPLAIN-plan reviewer",
      "Window function helper",
      "Anti-join debugger",
      "dbt model scaffold",
    ],
    prompts: [
      {
        id: "english-to-sql",
        label: "Query from English",
        icon: "🗣️",
        purpose: "Question to query, with caveats",
        template:
          "Write a SQL query that answers: {question}. Dialect: {dialect}. Schema:\n\n{schema}\n\nOutput: the query, 1-line note on edge cases (NULLs, dupes, time zones), 1 assumption I made explicit.",
      },
      {
        id: "explain-plan",
        label: "EXPLAIN-plan reviewer",
        icon: "🔬",
        purpose: "What the plan tells us + what to change",
        template:
          "Review this EXPLAIN plan {explain_output} for query {query}. Output: how it executes (steps in plain English), the most expensive node, why it's expensive, 2 concrete refactors to try (index / rewrite / partition).",
      },
      {
        id: "window-helper",
        label: "Window function helper",
        icon: "🪟",
        purpose: "Pick the right window for the question",
        template:
          "I want to compute {metric} grouped by {group_by} ordered by {order_by}. Suggest a window function that does it. Output: query, why ROW_NUMBER vs RANK vs LAG vs SUM OVER fits, common mistakes for this shape.",
      },
      {
        id: "anti-join-debug",
        label: "Anti-join debugger",
        icon: "🐛",
        purpose: "Why is my LEFT JOIN dropping rows?",
        template:
          "Here's my query {query} and unexpected result {unexpected_result}. Diagnose why rows are missing or duplicated. Likely causes: silent inner-join filter in WHERE, NULL match logic, duplicate keys, dialect quirks. Output: cause + fix + a small reproducible example.",
      },
      {
        id: "perf-refactor",
        label: "Performance refactor",
        icon: "⚡",
        purpose: "Slow query → faster equivalent",
        template:
          "Refactor this query for performance on {dialect}: {query}. Constraints: same output, ≤5 changes. Output: refactored query, what each change does, expected impact (orders of magnitude or %), the change to make first.",
      },
      {
        id: "dbt-scaffold",
        label: "dbt model scaffold",
        icon: "🏗️",
        purpose: "From description to a clean dbt model",
        template:
          "Scaffold a dbt model for: {model_description}. Output: SQL with CTEs (sources, transforms, final), suggested tests (unique + not_null on PK, accepted_values where relevant), tags, materialisation choice (view / table / incremental) with reason.",
      },
    ],
  },
  {
    id: "insight-summary-engine",
    title: "Insight Summary Engine",
    icon: "💡",
    personaIcon: "BarChart3",
    persona: "Data Analyst",
    outcome: "Numbers → SO-WHAT → exec-grade TL;DR.",
    description:
      "5-step workflow from a question to an executive TL;DR with methodology, findings, and recommendations.",
    type: "workflow",
    roleSlugs: ["data-analysts", "data-scientists"],
    preview: [
      "Step 1 · Question framing",
      "Step 2 · Methodology paragraph",
      "Step 3 · Findings bullets",
      "Step 4 · SO-WHAT + recommendations",
      "Step 5 · Executive TL;DR",
    ],
    prompts: [
      {
        id: "step1-question",
        label: "Step 1 · Question framing",
        icon: "❓",
        purpose: "Sharpen the question first",
        template:
          "Rewrite this messy question {raw_question} into a sharp analytical question. Output: precise question, what decision it informs, who is the audience, what would change in their behaviour given different answers. Flag if the question is unanswerable with current data.",
      },
      {
        id: "step2-method",
        label: "Step 2 · Methodology paragraph",
        icon: "🔬",
        purpose: "Defensible method in plain English",
        template:
          "Write a methodology paragraph for the question from step 1. Cover: data sources, time window, filters, transformations, metric definitions, known caveats. ≤180 words, plain English. End with 'why this method is right for this question'.",
      },
      {
        id: "step3-findings",
        label: "Step 3 · Findings bullets",
        icon: "📊",
        purpose: "≤5 bullets, each a number + meaning",
        template:
          "From the analysis {analysis_output}, write ≤5 findings bullets. Each: the number, the comparison that makes it meaningful (vs last period / vs cohort / vs benchmark), one-line interpretation. No stuffing.",
      },
      {
        id: "step4-sowhat",
        label: "Step 4 · SO-WHAT + recommendations",
        icon: "🎯",
        purpose: "Each finding → an action",
        template:
          "For each finding from step 3, write the SO-WHAT and a recommendation. Recommendation must be: behavioural (someone does X), owned (who), measurable (success metric), time-boxed (when we re-check).",
      },
      {
        id: "step5-tldr",
        label: "Step 5 · Executive TL;DR",
        icon: "📨",
        purpose: "5 lines an exec can scan in 30s",
        template:
          "Compose the executive TL;DR. ≤5 lines. Line 1: headline answer to the question. Line 2: the single most important number. Line 3: top recommendation. Line 4: what we don't know yet. Line 5: next step + by when.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // DATA SCIENTISTS
  // ─────────────────────────────────────────────────────────────────
  {
    id: "experiment-design-pack",
    title: "Experiment Design Pack",
    icon: "🧪",
    personaIcon: "Microscope",
    persona: "Data Scientist",
    outcome: "Hypothesis → power, guardrails, readout plan.",
    description:
      "5-step workflow for designing an experiment that survives review: hypothesis, power, guardrails, risks, stakeholder summary.",
    type: "workflow",
    roleSlugs: ["data-scientists"],
    preview: [
      "Step 1 · Hypothesis spec",
      "Step 2 · Power-analysis brief",
      "Step 3 · Guardrail metrics",
      "Step 4 · Risk + readout plan",
      "Step 5 · Stakeholder summary",
    ],
    prompts: [
      {
        id: "step1-hypothesis",
        label: "Step 1 · Hypothesis spec",
        icon: "🎯",
        purpose: "Falsifiable hypothesis with success metric",
        template:
          "Turn this idea {idea} into a hypothesis spec. Output: hypothesis (if-then, falsifiable), primary metric + direction + minimum detectable effect, unit of randomisation, population, expected mechanism in 1 paragraph.",
      },
      {
        id: "step2-power",
        label: "Step 2 · Power-analysis brief",
        icon: "🔌",
        purpose: "Sample size + runtime with assumptions",
        template:
          "Run a power-analysis brief given step 1's hypothesis. Assume baseline {baseline_rate}, target lift {target_lift}, α=0.05, power=0.8. Output: required sample size per arm, expected runtime given traffic {daily_traffic}, sensitivities table (vary lift ±50%).",
      },
      {
        id: "step3-guardrails",
        label: "Step 3 · Guardrail metrics",
        icon: "🛡️",
        purpose: "Metrics that must not move",
        template:
          "Define ≤5 guardrail metrics for this experiment. For each: metric, allowed deviation, why it matters, action if it breaches. Cover north-star, revenue, latency, error rate, retention.",
      },
      {
        id: "step4-risk-readout",
        label: "Step 4 · Risk + readout plan",
        icon: "📅",
        purpose: "When + how we check + when we stop",
        template:
          "Write the risk and readout plan. Cover: peeking policy (sequential / fixed-horizon), interim checks if any, novelty / primacy windows, stop-loss criteria, what to do on null result. Plain English.",
      },
      {
        id: "step5-stakeholder",
        label: "Step 5 · Stakeholder summary",
        icon: "📨",
        purpose: "One-pager for sign-off",
        template:
          "Write a one-page stakeholder summary. Sections: what we're testing, expected runtime, primary + guardrail metrics, what success vs null vs negative means, decision rule. ≤300 words. End with the date we'll meet to read out.",
      },
    ],
  },
  {
    id: "model-card-builder",
    title: "Model Card Builder",
    icon: "🪪",
    personaIcon: "Microscope",
    persona: "Data Scientist",
    outcome: "Model facts → published, honest model card.",
    description:
      "Generate a model card that doesn't hide trade-offs: intended use, data, eval, limitations, maintenance.",
    type: "folder",
    roleSlugs: ["data-scientists"],
    preview: [
      "Intended-use section",
      "Training-data summary",
      "Eval-metrics table",
      "Limitations + risks",
      "Maintenance plan",
    ],
    prompts: [
      {
        id: "intended-use",
        label: "Intended-use section",
        icon: "🎯",
        purpose: "Bound the right uses + the wrong ones",
        template:
          "Draft the intended-use section for {model_name}. Sections: primary users, primary use cases, secondary use cases (allowed), uses we explicitly don't support, decisions this model should not be the sole input to. Plain language.",
      },
      {
        id: "training-data",
        label: "Training-data summary",
        icon: "📚",
        purpose: "Where the model learned from",
        template:
          "Summarise the training-data composition for {model_name}. Cover: source(s), date range, sample size, key features, sensitive attributes (if any) and how handled, sampling decisions, known coverage gaps. No hand-waving on gaps.",
      },
      {
        id: "eval-table",
        label: "Eval-metrics table",
        icon: "📊",
        purpose: "Metrics across slices, not just overall",
        template:
          "Build the eval-metrics table for {model_name}. Columns: metric, overall, top slice, bottom slice, gap. Include performance metric, fairness metric, calibration metric, robustness metric (perturbation). Add a row for the production baseline.",
      },
      {
        id: "limitations",
        label: "Limitations + risks",
        icon: "⚠️",
        purpose: "Honest, specific limitations",
        template:
          "List limitations and risks for {model_name}. Each: limitation (1 sentence), where it bites (specific scenario), evidence, mitigation in place, residual risk. Cover at least: data drift, sub-group performance, adversarial inputs, downstream misuse.",
      },
      {
        id: "maintenance-plan",
        label: "Maintenance plan",
        icon: "🛠️",
        purpose: "Who watches and when",
        template:
          "Write the maintenance plan for {model_name}. Cover: monitoring metrics + thresholds, alert routing, retraining cadence + trigger, deprecation criteria, escalation contacts. Include the question: 'When would we kill this model?'",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // RECRUITERS — add Sourcing Boolean Builder (already has cold-outreach-os + interview-question-bank)
  // ─────────────────────────────────────────────────────────────────
  {
    id: "sourcing-boolean-builder",
    title: "Sourcing Boolean Builder",
    icon: "🔍",
    personaIcon: "Users",
    persona: "Recruiter",
    outcome: "Role brief → Boolean strings for every channel.",
    description:
      "Translate role briefs into searchable Boolean strings for LinkedIn, GitHub, and ATS searches, with a quality audit.",
    type: "folder",
    roleSlugs: ["recruiters"],
    preview: [
      "Boolean from role brief",
      "LinkedIn search variant",
      "GitHub search variant",
      "Diversity-broadening rewrite",
      "Search-quality audit",
    ],
    prompts: [
      {
        id: "boolean-from-brief",
        label: "Boolean from role brief",
        icon: "🧠",
        purpose: "Single sourcing Boolean",
        template:
          "Build a sourcing Boolean string from {role_brief}. Inputs: title synonyms, must-have skills, nice-to-have skills, location radius, exclusions. Output: one combined Boolean with grouping + a per-clause comment explaining why each group exists.",
      },
      {
        id: "linkedin-variant",
        label: "LinkedIn search variant",
        icon: "💼",
        purpose: "Tuned to LinkedIn syntax + limits",
        template:
          "Adapt the Boolean from above for LinkedIn Recruiter syntax. Apply LinkedIn limits (no nested parens depth >5, no proximity), title-field operator usage. Output: cleaned string + a 1-line note on what was lost vs the base Boolean.",
      },
      {
        id: "github-variant",
        label: "GitHub search variant",
        icon: "🐙",
        purpose: "Find engineers by code, not titles",
        template:
          "Translate the role brief into a GitHub code-search Boolean. Use: language:, path:, filename:, repo size, recent push date, stars range. Output: search string + an example URL, what a great match looks like in the results.",
      },
      {
        id: "diversity-broaden",
        label: "Diversity-broadening rewrite",
        icon: "🌍",
        purpose: "Expand the funnel without lowering the bar",
        template:
          "Rewrite the Boolean to broaden the candidate pool without lowering must-haves. Specifically: replace pedigree filters (school / company tiers) with skill proxies, add bootcamp / open-source / community-contribution signals, swap synonyms used across non-traditional resumes.",
      },
      {
        id: "search-audit",
        label: "Search-quality audit",
        icon: "🔬",
        purpose: "Is this Boolean returning the right shape?",
        template:
          "Audit search quality given sample {top_50_results}. Output: % match to must-haves (visual estimate), top false-positive pattern, top false-negative pattern (where strong candidates are missing), 3 concrete refinements to try.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // DEVOPS ENGINEERS — add Runbook + Postmortem
  // ─────────────────────────────────────────────────────────────────
  {
    id: "runbook-generator",
    title: "Runbook Generator",
    icon: "📕",
    personaIcon: "Server",
    persona: "DevOps",
    outcome: "Service → on-call runbook in minutes.",
    description:
      "Produce a service runbook covering overview, alerts → actions, restart, rollback, escalation, and postmortem links.",
    type: "folder",
    roleSlugs: ["devops-engineers"],
    preview: [
      "Service overview",
      "Common alerts → actions",
      "Restart procedure",
      "Rollback procedure",
      "On-call escalation",
    ],
    prompts: [
      {
        id: "service-overview",
        label: "Service overview",
        icon: "📋",
        purpose: "Anchor for everything else",
        template:
          "Write a service overview for {service_name}. Sections: purpose (1 paragraph), upstream + downstream dependencies, SLOs, owners, where the code lives, where the dashboards live. ≤300 words.",
      },
      {
        id: "alerts-actions",
        label: "Common alerts → actions",
        icon: "🚨",
        purpose: "Alert name → exact action",
        template:
          "For each alert in {alert_list}, document the action. Output markdown table: alert name, what it means in plain English, first action (≤30s), second action (if first fails), when to page humans. Concrete, not 'investigate'.",
      },
      {
        id: "restart-procedure",
        label: "Restart procedure",
        icon: "🔁",
        purpose: "Restart without data loss",
        template:
          "Document the safe restart procedure for {service_name}. Output ordered steps: pre-checks (queue drained? in-flight requests?), the restart command(s), post-checks, expected duration, what to do on each failure mode. Include the rollback if restart fails.",
      },
      {
        id: "rollback-procedure",
        label: "Rollback procedure",
        icon: "↩️",
        purpose: "Roll back fast and correctly",
        template:
          "Write the rollback procedure for {service_name} from {current_version} to {previous_version}. Cover: schema migrations (forward-compatible? reversal needed?), feature flags, traffic shifting, data integrity check, customer-impact window communication.",
      },
      {
        id: "escalation",
        label: "On-call escalation",
        icon: "📞",
        purpose: "Who gets paged when",
        template:
          "Define the on-call escalation policy for {service_name}. Tiers: primary, secondary, manager, executive. For each: response SLO, what triggers escalation, contact channel, expected first action. Include a public-status-page criterion.",
      },
      {
        id: "postmortem-link",
        label: "Postmortem template link",
        icon: "📜",
        purpose: "Embed the postmortem expectation",
        template:
          "Add a 'Postmortem' section to the runbook. Include: incident severity definitions, who writes the postmortem (always not the IC), template link, blameless review timeline, where action items get tracked.",
      },
    ],
  },
  {
    id: "incident-postmortem",
    title: "Incident Postmortem",
    icon: "📝",
    personaIcon: "Server",
    persona: "DevOps",
    outcome: "Timeline → root cause → action items.",
    description:
      "5-step blameless postmortem workflow: timeline, root cause, contributing factors, action items, polished doc.",
    type: "workflow",
    roleSlugs: ["devops-engineers", "developers"],
    preview: [
      "Step 1 · Timeline reconstruction",
      "Step 2 · Root-cause analysis",
      "Step 3 · Contributing factors",
      "Step 4 · Action items + owners",
      "Step 5 · Polished postmortem doc",
    ],
    prompts: [
      {
        id: "step1-timeline",
        label: "Step 1 · Timeline reconstruction",
        icon: "🕐",
        purpose: "Minute-by-minute timeline",
        template:
          "Reconstruct a timeline for incident {incident_id} from {raw_inputs}. Output markdown table: timestamp (UTC), event, source (alert / log / human action), who acted. Mark the detection time, mitigation time, full-recovery time.",
      },
      {
        id: "step2-root-cause",
        label: "Step 2 · Root-cause analysis",
        icon: "🔬",
        purpose: "Cause chain, not single villain",
        template:
          "Run a 5-whys on the incident using the timeline. Output: 5-whys chain, identified root cause (technical), distinction between trigger and root cause, supporting evidence (log / metric / commit). Blameless: people are inputs, not failures.",
      },
      {
        id: "step3-contributing",
        label: "Step 3 · Contributing factors",
        icon: "🧩",
        purpose: "Surface conditions that made it worse",
        template:
          "List contributing factors that made this incident larger or longer than it should have been. Cover: monitoring gaps, runbook gaps, on-call experience, change-management process, automation gaps. For each: evidence, severity, whether the same factor recurs.",
      },
      {
        id: "step4-actions",
        label: "Step 4 · Action items + owners",
        icon: "✅",
        purpose: "Specific, owned, dated, prioritised",
        template:
          "Convert root cause + contributing factors into action items. For each: action, type (prevent / detect / mitigate / recover), owner, due date, priority (P0-P3), success criterion. Limit ≤8 actions; cap P0+P1 at 3.",
      },
      {
        id: "step5-doc",
        label: "Step 5 · Polished postmortem doc",
        icon: "📄",
        purpose: "Doc to circulate + archive",
        template:
          "Compose the postmortem doc using steps 1-4. Sections: TL;DR (3 lines: impact, root cause, headline action), Impact (user + business), Timeline, Root Cause + Contributing Factors, Action Items, What Went Well, What Went Poorly. Blameless throughout.",
      },
    ],
  },
];

export function getPacksForRole(slug: string): SkillsetPack[] {
  return skillsetPacks.filter((p) => p.roleSlugs.includes(slug));
}

export function getPack(id: string): SkillsetPack | undefined {
  return skillsetPacks.find((p) => p.id === id);
}

export function getFeaturedPacks(): SkillsetPack[] {
  return skillsetPacks.filter((p) => p.featured);
}
