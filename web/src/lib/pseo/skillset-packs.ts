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
