import Link from "next/link";
import {
  ArrowRight,
  Bolt,
  Boxes,
  Briefcase,
  Code2,
  Download,
  GitBranch,
  GraduationCap,
  Megaphone,
  MessagesSquare,
  Palette,
  Sparkles,
  Workflow,
} from "lucide-react";
import {
  ChatVisual,
  PresetVisual,
  RouterVisual,
  WorkflowVisual,
  StepCaptureVisual,
  StepPackVisual,
  StepRunVisual,
} from "@/components/bento-visuals";
import { PersonaCardView, type PersonaCard } from "@/components/skillsets/persona-card";

/* ────────────────────────────────────────────────────────────── CORE FEATURES (bento) */

export function CoreFeatures() {
  return (
    <section id="features" className="relative bg-[#0a0a0c] py-20 md:py-36">
      <div className="mx-auto max-w-[1400px] px-5 md:px-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_1fr] md:gap-16">
          <div>
            <p
              className="mb-4 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              01 · A whole skill ecosystem
            </p>
            <h2 className="text-[30px] font-medium leading-[1.05] tracking-[-0.02em] text-zinc-50 md:text-[52px]">
              Main features in
              <br />
              your companion app.
            </h2>
          </div>
          <div className="flex items-end">
            <p className="max-w-[48ch] text-[16px] leading-[1.6] text-zinc-400">
              A whole skill ecosystem. Each tool curated to make your time with AI as valuable as possible. Sharper prompts, cheaper runs, work you can repeat and own.
            </p>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:mt-16 md:grid-cols-12 md:gap-5">
          <BentoCard
            className="md:col-span-8"
            id="bento-chat"
            icon={<MessagesSquare strokeWidth={1.75} className="h-5 w-5" />}
            eyebrow="Skill Chat"
            title="One chat. Every model. Now triple-threaded."
            body={
              <>
                Skills and chat in one place — no tab-switching. Run <strong className="font-semibold text-zinc-100">up to 3 conversations in true parallel</strong>, each on a different model. Auto-picks the cheapest model per step (see{" "}
                <a
                  href="#bento-router"
                  className="text-[#7BA7FF] underline decoration-[#7BA7FF]/40 underline-offset-2 transition-colors hover:text-zinc-50 hover:decoration-zinc-50"
                >
                  Skill Router
                </a>
                ) — <strong className="font-semibold text-zinc-100">a feature top AI apps don&rsquo;t ship</strong>.
              </>
            }
            visual={<ChatVisual />}
            decor="left"
          />
          <BentoCard
            className="md:col-span-4"
            id="bento-preset"
            icon={<Palette strokeWidth={1.75} className="h-5 w-5" />}
            eyebrow="Skill Preset"
            title="Royalties for artists. Not theft."
            body={
              <>
                AI gets trained on stolen art. Artists get nothing. Skill Preset fights back: pack your style (palette, voice, taste) into an encrypted preset, set a price, and earn royalties every time it generates images or video. <strong className="font-semibold text-zinc-100">Join our petition to ban training on stolen work.</strong>
              </>
            }
            visual={<PresetVisual />}
            decor="right"
          />
          <BentoCard
            className="md:col-span-5"
            id="bento-workflow"
            icon={<Workflow strokeWidth={1.75} className="h-5 w-5" />}
            eyebrow="Skill Flow"
            title="Multi-step jobs, in one click."
            body="Build a workflow: research → outline → draft → edit. Each step picks up where the last left off. Run all four in one click. Save the recipe, reuse forever."
            visual={<WorkflowVisual />}
            decor="right"
          />
          <BentoCard
            className="md:col-span-7"
            id="bento-router"
            icon={<Bolt strokeWidth={1.75} className="h-5 w-5" />}
            eyebrow="Skill Router"
            title="Picks the cheapest AI for each job, without dropping quality."
            body={
              <>
                Quick task → a cheap, fast AI. Tricky reasoning → a top-tier one. Image work → a vision specialist. Skillset auto-picks per prompt — <strong className="font-semibold text-zinc-100">cuts your AI bill up to 80%</strong>.
              </>
            }
            visual={<RouterVisual />}
            decor="left"
          />
        </div>
      </div>
    </section>
  );
}

function BentoCard({
  className = "",
  id,
  icon,
  eyebrow,
  title,
  body,
  visual,
  decor = "right",
}: {
  className?: string;
  id?: string;
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  body: React.ReactNode;
  visual: React.ReactNode;
  decor?: "left" | "right";
}) {
  return (
    <div
      id={id}
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0f0f12] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] scroll-mt-24 transition-all duration-300 hover:border-white/[0.14] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_20px_40px_-30px_rgba(37,99,235,0.4)] ${className}`}
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute h-72 w-72 rounded-full opacity-60 transition-opacity duration-500 group-hover:opacity-100 ${
          decor === "left" ? "-bottom-32 -left-32" : "-bottom-32 -right-32"
        }`}
        style={{
          background:
            "radial-gradient(circle, rgba(37,99,235,0.12), transparent 65%)",
        }}
      />

      <div className="relative z-10 flex h-full flex-col p-5 md:p-9">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-white/10 bg-white/[0.03] text-[#7BA7FF]">
            {icon}
          </span>
          <span
            className="text-[11px] uppercase tracking-[0.18em] text-zinc-500"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            {eyebrow}
          </span>
        </div>
        <h3 className="mt-6 text-[20px] font-medium leading-[1.18] tracking-[-0.015em] text-zinc-50 md:text-[24px]">
          {title}
        </h3>
        <p className="mt-4 max-w-[44ch] text-[14px] leading-[1.6] text-zinc-400">
          {body}
        </p>
        <div className="relative mt-auto pt-6 pb-2">{visual}</div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── HOW IT WORKS */

export function HowItWorks() {
  const steps: { n: string; t: string; d: React.ReactNode; visual: React.ReactNode }[] = [
    {
      n: "01",
      t: "Capture in one click.",
      d: "Install and save any prompt from ChatGPT, Claude, or Gemini in one click — no copy-paste, no lost chat history.",
      visual: <StepCaptureVisual />,
    },
    {
      n: "02",
      t: "Pack it into a skillset.",
      d: (
        <>
          Group prompts, add variables, lock the model.{" "}
          <a
            href="#"
            className="text-[#7BA7FF] underline decoration-[#7BA7FF]/40 underline-offset-2 transition-colors hover:text-zinc-50 hover:decoration-zinc-50"
          >
            Skillset
          </a>{" "}
          bundles them into a portable encrypted set you own.
        </>
      ),
      visual: <StepPackVisual />,
    },
    {
      n: "03",
      t: "Run it — or sell it.",
      d: "Run it from Skill Chat. Share with your team. Or sell it — every sale goes to you.",
      visual: <StepRunVisual />,
    },
  ];
  return (
    <section id="how" className="relative border-t border-white/5 bg-[#0c0c10] py-16 md:py-28">
      <div className="mx-auto max-w-[1400px] px-5 md:px-6">
        <div className="mb-10 grid grid-cols-1 gap-8 md:mb-16 md:grid-cols-[1fr_1fr] md:gap-16">
          <div>
            <p
              className="mb-4 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              02 · How to create a skillset
            </p>
            <h2 className="text-[30px] font-medium leading-[1.05] tracking-[-0.02em] text-zinc-50 md:text-[52px]">
              From scratch to skill in
              <br />
              under a minute.
            </h2>
          </div>
          <div className="flex items-end">
            <p className="max-w-[48ch] text-[16px] leading-[1.6] text-zinc-400">
              Capture a prompt, pack it into a skillset, run it from anywhere. Ready in under a minute.
            </p>
          </div>
        </div>

        <ol className="space-y-px overflow-hidden rounded-2xl border border-white/[0.06]">
          {steps.map((s) => (
            <li
              key={s.n}
              className="grid grid-cols-1 gap-5 bg-[#0f0f12] px-5 py-7 md:grid-cols-[100px_1fr] md:gap-6 md:px-10 md:py-10 lg:grid-cols-[100px_1fr_300px] lg:items-center"
            >
              <div className="flex items-baseline gap-3 md:block">
                <span
                  className="text-[28px] font-medium text-zinc-700 md:text-[34px]"
                  style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                >
                  {s.n}
                </span>
                <h3 className="text-[20px] font-medium tracking-[-0.015em] text-zinc-50 md:hidden">
                  {s.t}
                </h3>
              </div>
              <div>
                <h3 className="hidden text-[22px] font-medium tracking-[-0.015em] text-zinc-50 md:block md:text-[26px]">
                  {s.t}
                </h3>
                <p className="max-w-[52ch] text-[14.5px] leading-[1.55] text-zinc-400 md:mt-2 md:text-[15px]">
                  {s.d}
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.05] bg-[#0a0a0c] p-4 lg:border-0 lg:bg-transparent lg:p-0">
                {s.visual}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────── PERSONAS */

export function Personas() {
  const personas: PersonaCard[] = [
    {
      icon: <Megaphone strokeWidth={1.75} className="h-5 w-5" />,
      role: "Marketer",
      outcome: "Draft 10 brand-voice posts in 2 minutes.",
      skillsetTitle: "Brand Voice Studio",
      skillCount: 12,
      type: "folder",
      preview: [
        "LinkedIn post in your voice",
        "Twitter/X thread from long doc",
        "Email subject lines (×5 variants)",
        "Ad copy: 3 headlines + 3 bodies",
        "Press release first draft",
      ],
      file: "/skillsets/brand-voice-studio.skill",
    },
    {
      icon: <GraduationCap strokeWidth={1.75} className="h-5 w-5" />,
      role: "Student",
      outcome: "Lecture notes → flashcards + study plan.",
      skillsetTitle: "Study Faster",
      skillCount: 5,
      type: "workflow",
      preview: [
        "Step 1 · Extract key concepts",
        "Step 2 · Generate flashcards",
        "Step 3 · Build practice quiz",
        "Step 4 · Make a mind map",
        "Step 5 · Spaced-repetition schedule",
      ],
      file: "/skillsets/study-faster.skill",
    },
    {
      icon: <Briefcase strokeWidth={1.75} className="h-5 w-5" />,
      role: "Solopreneur",
      outcome: "Your support playbook, every reply.",
      skillsetTitle: "Solo Ops Toolkit",
      skillCount: 14,
      type: "folder",
      preview: [
        "Customer support reply (in tone)",
        "Cold outreach + follow-up chain",
        "Invoice reminder (polite + firm)",
        "Onboarding email sequence",
        "Pricing objection handler",
      ],
      file: "/skillsets/solo-ops-toolkit.skill",
    },
    {
      icon: <Code2 strokeWidth={1.75} className="h-5 w-5" />,
      role: "Builder",
      outcome: "Codebase rules, lint prompts, design reviews.",
      skillsetTitle: "Code Review Co-pilot",
      skillCount: 5,
      type: "workflow",
      preview: [
        "Step 1 · Analyze the diff",
        "Step 2 · Style guide check",
        "Step 3 · Security audit",
        "Step 4 · Test coverage gaps",
        "Step 5 · Final review comment",
      ],
      file: "/skillsets/code-review-copilot.skill",
    },
  ];

  return (
    <section className="relative border-t border-white/5 bg-[#0a0a0c] py-16 md:py-28">
      <div className="mx-auto max-w-[1400px] px-5 md:px-6">
        <div className="mb-10 grid grid-cols-1 gap-6 md:mb-16 md:grid-cols-[1fr_1fr] md:gap-16">
          <div>
            <p
              className="mb-4 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              03 · Built for how you actually use AI
            </p>
            <h2 className="text-[30px] font-medium leading-[1.05] tracking-[-0.02em] text-zinc-50 md:text-[48px]">
              Pick the skillset that fits your life.
            </h2>
          </div>
          <div className="flex items-end">
            <p className="max-w-[48ch] text-[16px] leading-[1.6] text-zinc-400">
              Free skillsets, ready to import. Download one and see Skillset in action, no card required.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-4">
          {personas.map((p) => (
            <PersonaCardView key={p.role} persona={p} />
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 md:mt-14">
          <Link
            href="/skillsets"
            className="inline-flex items-center gap-2 rounded-full bg-[#2563EB] px-6 py-3 text-[14.5px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_10px_30px_-10px_rgba(37,99,235,0.6)] transition-all hover:bg-[#1d4ed8] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_14px_36px_-10px_rgba(37,99,235,0.75)] active:translate-y-[1px]"
          >
            Browse more skillsets
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
          <p className="text-[12px] text-zinc-500">
            47 packs across 24 roles — all free.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────── POWER FEATURES */

export function PowerFeatures() {
  const items = [
    {
      icon: <Download strokeWidth={1.75} className="h-5 w-5" />,
      eyebrow: "Skill Install · new in v1.3",
      title: "Install any skillset into Claude Code, Cursor, or AGENTS.md.",
      body: "One click writes your skillset straight into your project — SKILL.md for Claude Code, .cursor/rules for Cursor, or an AGENTS.md section for Codex. Workflows, folders, and presets all supported. Your skills become native files your coding agents already know how to read.",
    },
    {
      icon: <GitBranch strokeWidth={1.75} className="h-5 w-5" />,
      eyebrow: "Skill Control",
      title: "Save every version. Roll back anytime.",
      body: "Every edit to your prompt is saved automatically. Compare any two versions side-by-side. Roll back instantly when a new AI model breaks the prompt that worked last week.",
    },
    {
      icon: <Boxes strokeWidth={1.75} className="h-5 w-5" />,
      eyebrow: "Skill Eval",
      title: "Tells you the best AI and approach for any prompt.",
      body: "Built-in math benchmarks analyze your prompt and recommend the best model + reasoning approach. Get the right answer once, not after hours of trial and error.",
    },
    {
      icon: <Sparkles strokeWidth={1.75} className="h-5 w-5" />,
      eyebrow: "Skill Enhance",
      title: "Turn rough prompts into great ones.",
      body: "Paste a rough draft, get back a sharper one. Skillset fills in what's missing — who the AI plays, what format to return, what good examples look like.",
    },
  ];

  return (
    <section id="power" className="relative bg-[#0a0a0c] py-16 md:py-28">
      <div className="mx-auto max-w-[1400px] px-5 md:px-6">
        <div className="mb-10 grid grid-cols-1 gap-8 md:mb-16 md:grid-cols-[1fr_1fr] md:gap-16">
          <div>
            <p
              className="mb-4 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              04 · For quality nerds
            </p>
            <h2 className="text-[30px] font-medium leading-[1.05] tracking-[-0.02em] text-zinc-50 md:text-[52px]">
              Tune your prompts
              <br />
              like a pro.
            </h2>
          </div>
          <div className="flex items-end">
            <p className="max-w-[48ch] text-[16px] leading-[1.6] text-zinc-400">
              Every tool you need to make your skillsets valuable. These are your ideas, your IP. Don&rsquo;t give them away for free.
            </p>
          </div>
        </div>

        <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
          {items.map((it) => (
            <div
              key={it.eyebrow}
              className="grid grid-cols-1 gap-3 py-8 md:grid-cols-[200px_1fr_1fr] md:items-start md:gap-12 md:py-10"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-md border border-white/10 bg-white/[0.02] text-[#7BA7FF]">
                  {it.icon}
                </span>
                <span
                  className="text-[12px] uppercase tracking-[0.16em] text-zinc-400"
                  style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                >
                  {it.eyebrow}
                </span>
              </div>
              <h3 className="text-[22px] font-medium leading-[1.15] tracking-[-0.015em] text-zinc-50 md:text-[28px]">
                {it.title}
              </h3>
              <p className="text-[14.5px] leading-[1.6] text-zinc-400 md:text-[15px]">{it.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
