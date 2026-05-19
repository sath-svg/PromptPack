import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
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
import type { Metadata } from "next";
import { ChatVisual, PresetVisual, RouterVisual, WorkflowVisual, StepCaptureVisual, StepPackVisual, StepRunVisual } from "@/components/bento-visuals";
import { AppMockupTabbed } from "@/components/app-mockup-tabbed";
import { ScrollReveal } from "@/components/scroll-reveal";
import { SkillsetNav } from "@/components/skillset-nav";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "Skillset — AI is getting expensive. Spend less on it.",
  description:
    "Save your best prompts once, reuse them in every workflow. Skillset auto-picks the cheapest AI that nails each job — up to 80% off your AI bill. Works in ChatGPT, Claude, Gemini, and your IDE.",
};

export default function SkillsetLanding() {
  return (
    <div
      className={`landing-root ${geist.variable} ${geistMono.variable} relative min-h-[100dvh] w-full bg-[#0a0a0c] text-zinc-100`}
      style={{ fontFamily: "var(--font-geist), system-ui, sans-serif" }}
    >
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[60] opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.55'/></svg>\")",
        }}
      />

      <SkillsetNav />

      <Hero />

      <ScrollReveal>
        <Problem />
      </ScrollReveal>
      <ScrollReveal>
        <CoreFeatures />
      </ScrollReveal>
      <ScrollReveal>
        <Personas />
      </ScrollReveal>
      <ScrollReveal>
        <HowItWorks />
      </ScrollReveal>
      <ScrollReveal>
        <PowerFeatures />
      </ScrollReveal>
      <ScrollReveal>
        <Testimonials />
      </ScrollReveal>
      <ScrollReveal>
        <PricingCallout />
      </ScrollReveal>
      <ScrollReveal>
        <FaqSection />
      </ScrollReveal>
      <ScrollReveal>
        <SiteFooter />
      </ScrollReveal>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── HERO */

function Hero() {
  return (
    <section className="relative flex flex-col md:min-h-[calc(100dvh-57px)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[640px]"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 70% 20%, rgba(37,99,235,0.18), transparent 60%)",
        }}
      />

      <div className="flex-1 flex items-center">
      <div className="relative w-full mx-auto grid max-w-[1400px] grid-cols-1 gap-10 px-5 py-10 md:gap-16 md:px-6 md:py-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
        <div className="flex flex-col">
          <div
            className="mb-8 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] text-[12px] text-zinc-400"
            style={{ fontFamily: "var(--font-geist-mono), monospace", padding: "4px 9px" }}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2563EB] opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#2563EB]" />
            </span>
            <span>v1.2 — formerly PromptPack</span>
          </div>

          <h1 className="text-[38px] font-medium leading-[1.02] tracking-[-0.025em] text-zinc-50 sm:text-[44px] md:text-[60px] lg:text-[68px]">
            AI is getting expensive.
            <br />
            <span className="block mt-2 text-[24px] font-normal leading-[1.15] text-zinc-300 sm:text-[28px] md:text-[36px] lg:text-[40px]">
              Skillset helps you <span className="text-zinc-100 font-medium">spend less</span> on it.
            </span>
          </h1>

          <p className="mt-5 max-w-[56ch] text-[15.5px] leading-[1.55] text-zinc-400 md:mt-7 md:text-[17px]">
            Save your best prompts once, reuse them in every workflow. Get top-tier answers for{" "}
            <span className="font-medium text-emerald-400">up to 80% less</span> - Skillset auto-picks the right, cheapest AI for each job.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3 md:mt-10 md:gap-4">
            <Link
              href="/downloads"
              style={{ padding: "10px 22px" }}
              className="group inline-flex items-center gap-2 rounded-full bg-[#2563EB] text-sm font-medium text-white whitespace-nowrap shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_8px_24px_-12px_rgba(37,99,235,0.6)] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[#1d4ed8] active:translate-y-[1px]"
            >
              Save your first prompt
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
            </Link>
            <a
              href="#features"
              style={{ padding: "10px 22px" }}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.02] text-sm text-zinc-200 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.05] active:translate-y-[1px]"
            >
              Features
            </a>
          </div>

          <p
            className="mt-5 text-[12px] text-zinc-500"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            free forever plan · no credit card · works in ChatGPT, Claude, Gemini, your IDE
          </p>

          <dl className="mt-10 grid grid-cols-3 gap-3 border-t border-white/5 pt-5 text-left md:mt-14 md:gap-0 md:pt-6">
            <Stat value="1B+" label="weekly AI users" />
            <Stat value="10B+" label="prompts run daily" />
            <Stat value="50k+" label="public skills on GitHub" />
          </dl>
        </div>

        <div className="relative -mx-1 flex items-start justify-center pt-2 md:mx-0 md:justify-end md:pt-4">
          <AppMockupTabbed />
        </div>
      </div>
      </div>

      <SkillBeltMarquee />
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt
        className="text-[18px] font-medium tracking-tight text-zinc-100 md:text-[22px]"
        style={{ fontFamily: "var(--font-geist-mono), monospace" }}
      >
        {value}
      </dt>
      <dd className="text-[10.5px] uppercase tracking-[0.1em] text-zinc-500 md:text-[12px] md:tracking-[0.12em]">
        {label}
      </dd>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── PROBLEM */

function Problem() {
  const pains = [
    "You re-type the same prompt every day.",
    "Your best prompts are scattered across all conversations and documents.",
    "ChatGPT works better today, Claude tomorrow, but your prompts and conversations don't follow.",
    "One plan = one company's models. ChatGPT, Claude, Gemini each charges separately.",
  ];

  return (
    <section className="relative border-t border-white/5 bg-[#0a0a0c] py-16 md:py-24">
      <div className="mx-auto max-w-[1100px] px-5 md:px-6">
        <p
          className="mb-4 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
          style={{ fontFamily: "var(--font-geist-mono), monospace" }}
        >
          01 — The problem
        </p>
        <h2 className="text-[30px] font-medium leading-[1.05] tracking-[-0.02em] text-zinc-50 md:text-[48px]">
          Sound familiar?
        </h2>
        <ul className="mt-8 grid grid-cols-1 gap-3 md:mt-12 md:grid-cols-2 md:gap-4">
          {pains.map((p, i) => (
            <li
              key={i}
              className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.015] p-4 text-[15px] leading-[1.55] text-zinc-300 md:text-[17px] md:p-5"
            >
              <span
                className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.02] text-[10px] font-medium text-zinc-500"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────── PERSONAS */

type PersonaCard = {
  icon: React.ReactNode;
  role: string;
  outcome: string;
  skillsetTitle: string;
  skillCount: number;
  type: "workflow" | "folder";
  preview: string[];
  file: string;
};

function Personas() {
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
              03 — Built for how you actually use AI
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
      </div>
    </section>
  );
}

function PersonaCardView({ persona }: { persona: PersonaCard }) {
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0f0f12] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-all duration-300 hover:border-white/[0.14] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_20px_40px_-30px_rgba(37,99,235,0.4)]">
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-32 h-72 w-72 rounded-full opacity-50 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(circle, rgba(37,99,235,0.12), transparent 65%)",
        }}
      />

      <div className="relative z-10 flex h-full flex-col p-5 md:p-6">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-white/10 bg-white/[0.03] text-[#7BA7FF]">
            {persona.icon}
          </span>
          <span
            className="text-[11px] uppercase tracking-[0.18em] text-zinc-500"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            {persona.role}
          </span>
        </div>

        <h3 className="mt-5 text-[18px] font-medium leading-[1.2] tracking-[-0.01em] text-zinc-50 md:text-[20px]">
          {persona.skillsetTitle}
        </h3>
        <p className="mt-2 text-[13px] leading-[1.5] text-zinc-400">
          {persona.outcome}
        </p>

        <div className="mt-5 flex items-center gap-2 text-[11px]">
          <span
            className="rounded-full border border-white/10 bg-white/[0.02] px-2 py-0.5 text-zinc-400"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            {persona.skillCount} skills
          </span>
          <span
            className={`rounded-full px-2 py-0.5 ${
              persona.type === "workflow"
                ? "border border-[#2563EB]/40 bg-[#2563EB]/10 text-[#7BA7FF]"
                : "border border-white/10 bg-white/[0.02] text-zinc-400"
            }`}
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            {persona.type}
          </span>
          <span
            className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-emerald-300"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            free
          </span>
        </div>

        <div className="mt-5 flex flex-1 flex-col border-t border-white/5 pt-4">
          <p
            className="mb-3 text-[10px] uppercase tracking-[0.18em] text-zinc-500"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            What's inside
          </p>
          <ul className="space-y-1.5 text-[12.5px] leading-[1.45] text-zinc-300">
            {persona.preview.map((skill, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-zinc-600" />
                <span>{skill}</span>
              </li>
            ))}
            {persona.skillCount > persona.preview.length && (
              <li className="flex items-start gap-2 text-zinc-500">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-zinc-700" />
                <span>+ {persona.skillCount - persona.preview.length} more</span>
              </li>
            )}
          </ul>
        </div>

        <a
          href={persona.file}
          download
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 text-[13px] font-medium text-zinc-100 transition-all duration-200 hover:border-[#2563EB]/50 hover:bg-[#2563EB]/15 hover:text-white active:translate-y-[1px]"
        >
          <Download className="h-3.5 w-3.5" strokeWidth={2} />
          Download .skill
        </a>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── MARQUEE */

function SkillBeltMarquee() {
  const items = [
    "ChatGPT",
    "Claude",
    "Gemini",
    "Midjourney",
    "Cursor",
    "Codex",
    "Sora",
    "Perplexity",
    "Runway",
    "Replicate",
    "v0",
    "Bedrock API",
  ];
  const loop = [...items, ...items];

  return (
    <section
      aria-label="Compatible AI tools"
      className="relative border-t border-white/5 bg-[#0c0c10] pt-2 pb-4"
    >
      <p
        className="mb-2 w-full text-center text-[11px] uppercase tracking-[0.22em] text-zinc-500"
        style={{ fontFamily: "var(--font-geist-mono), monospace" }}
      >
        Works with every model you already use
      </p>
      <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_15%,#000_85%,transparent)]">
        <div className="flex w-max animate-[marquee_38s_linear_infinite] gap-12 px-6">
          {loop.map((label, i) => (
            <span
              key={`${label}-${i}`}
              className="whitespace-nowrap text-[15px] tracking-tight text-zinc-300"
            >
              {label}
            </span>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────── CORE FEATURES (bento) */

function CoreFeatures() {
  return (
    <section id="features" className="relative bg-[#0a0a0c] py-20 md:py-36">
      <div className="mx-auto max-w-[1400px] px-5 md:px-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_1fr] md:gap-16">
          <div>
            <p
              className="mb-4 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              02 — Save once. Use everywhere.
            </p>
            <h2 className="text-[30px] font-medium leading-[1.05] tracking-[-0.02em] text-zinc-50 md:text-[52px]">
              Stop re-explaining yourself
              <br />
              to every new chat.
            </h2>
          </div>
          <div className="flex items-end">
            <p className="max-w-[48ch] text-[16px] leading-[1.6] text-zinc-400">
              A skill is a prompt you save once and reuse anywhere. A skillset is a folder of them — your marketing toolkit, your research stack, your code-review playbook. Build once. Run it again and again, anywhere.
            </p>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:mt-16 md:grid-cols-12 md:gap-5">
          <BentoCard
            className="md:col-span-8"
            id="bento-chat"
            icon={<MessagesSquare strokeWidth={1.75} className="h-5 w-5" />}
            eyebrow="Skill Chat"
            title="One chat. Every model."
            body={
              <>
                Skills and chat in one place — no tab-switching. Ask a big question, and Skill Chat puts multiple AIs on it in parallel — each working on the part it&rsquo;s best at. Auto-picks the cheapest model per step (see{" "}
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
            title="Your style, licensed. Not stolen."
            body={
              <>
                Artists shouldn&rsquo;t lose to AI scraping their work for free. Pack your style — palette, voice, taste — into an encrypted skillset, set a price, sell access. <strong className="font-semibold text-zinc-100">Every use becomes a royalty</strong>, not theft.
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

function HowItWorks() {
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
              04 — How it works
            </p>
            <h2 className="text-[30px] font-medium leading-[1.05] tracking-[-0.02em] text-zinc-50 md:text-[52px]">
              From scratch to skill in
              <br />
              under a minute.
            </h2>
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

/* ────────────────────────────────────────────────────────────── POWER FEATURES */

function PowerFeatures() {
  const items = [
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
        <div className="mb-10 md:mb-16">
          <p
            className="mb-4 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            05 — For quality nerds
          </p>
          <h2 className="text-[30px] font-medium leading-[1.05] tracking-[-0.02em] text-zinc-50 md:text-[52px]">
            Tune your prompts
            <br />
            like a pro.
          </h2>
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

/* ────────────────────────────────────────────────────────────── TESTIMONIALS */

function Testimonials() {
  const quotes = [
    {
      q: "Stopped re-typing the same UI prompt into Claude. Now it's just `skills run @taste`.",
      n: "Marisol Echegaray",
      r: "Frontend Eng, indie",
    },
    {
      q: "Cut my Midjourney style-drift problem to zero. Presets > vibes.",
      n: "Bergen Bergwin",
      r: "Brand designer",
    },
    {
      q: "Finally — version control for the thing my whole product depends on.",
      n: "Ohene Asafo-Agyei",
      r: "Founder, AI agency",
    },
    {
      q: "I keep one library. ChatGPT, Cursor, Gemini all pull from it. That alone is worth Pro.",
      n: "Liesel Frankland",
      r: "Solo SaaS",
    },
  ];

  return (
    <section className="relative border-t border-white/5 bg-[#0c0c10] py-16 md:py-24">
      <div className="mx-auto mb-8 max-w-[1400px] px-5 md:mb-12 md:px-6">
        <p
          className="mb-4 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
          style={{ fontFamily: "var(--font-geist-mono), monospace" }}
        >
          06 — In the wild
        </p>
        <h2 className="max-w-[20ch] text-[28px] font-medium leading-[1.05] tracking-[-0.02em] text-zinc-50 md:text-[44px]">
          People who stopped losing prompts.
        </h2>
      </div>

      <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
        <div className="flex w-max animate-[marquee_60s_linear_infinite] gap-5 px-6">
          {[...quotes, ...quotes].map((t, i) => (
            <figure
              key={`${t.n}-${i}`}
              className="flex w-[300px] shrink-0 flex-col gap-4 rounded-2xl border border-white/[0.06] bg-[#0f0f12] p-5 md:w-[380px] md:gap-5 md:p-7"
            >
              <blockquote className="text-[16px] leading-[1.55] text-zinc-200">
                "{t.q}"
              </blockquote>
              <figcaption className="mt-auto flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[#1f2937] to-[#0b3b6f] text-[12px] font-medium text-zinc-200">
                  {t.n
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div className="leading-tight">
                  <div className="text-[13.5px] text-zinc-100">{t.n}</div>
                  <div
                    className="text-[11.5px] text-zinc-500"
                    style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                  >
                    {t.r}
                  </div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────── PRICING CALLOUT */

function PricingCallout() {
  return (
    <section id="pricing" className="relative bg-[#0a0a0c] py-16 md:py-28">
      <div className="mx-auto max-w-[1400px] px-5 md:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-[#0f0f12] p-6 md:p-16">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(37,99,235,0.22), transparent 60%)",
            }}
          />
          <div className="relative grid grid-cols-1 gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-end md:gap-16">
            <div>
              <p
                className="mb-4 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              >
                Pricing
              </p>
              <h2 className="text-[28px] font-medium leading-[1.05] tracking-[-0.02em] text-zinc-50 md:text-[48px]">
                Free forever, for personal libraries.
              </h2>
              <p className="mt-5 max-w-[56ch] text-[16px] leading-[1.6] text-zinc-400">
                Save up to 5 skills, run them anywhere — no card required. Pro and Studio unlock more skillsets based on your needs.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/downloads"
                  className="group inline-flex items-center gap-2 rounded-full bg-[#2563EB] px-6 py-2.5 text-sm overflow-hidden font-medium text-white whitespace-nowrap shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition-all duration-200 hover:bg-[#1d4ed8] active:translate-y-[1px]"
                >
                  Start Free
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.02] px-6 py-2.5 text-sm overflow-hidden text-zinc-200 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.05] active:translate-y-[1px]"
                >
                  See plans
                </Link>
              </div>
            </div>

            <ul className="space-y-3 border-l border-white/[0.06] pl-5 text-[14px] text-zinc-300 md:space-y-4 md:pl-10">
              {[
                "Up to 17 skillsets, unlimited runs",
                "AI Chat in app via Skill Chat",
                "Save up to 80% token usage",
                "Package and license your skillsets for profit",
              ].map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#2563EB]" />
                  <span className="text-zinc-300">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────── FAQ */

function FaqSection() {
  const faqs = [
    {
      q: "What exactly is a skillset?",
      a: "A skill is one reusable prompt (markdown format). A skillset bundles related skills you can version, encrypt, license, and sell — your prompts shipped as a product, not buried in a doc.",
    },
    {
      q: "Why not just save prompts in Notion or a doc?",
      a: "A doc holds prompts. Skillset runs them. Notion can't sync to your tools, version across model updates, or license them. Skillset wraps prompts into something you own — synced, private, and earning.",
    },
    {
      q: "Does this replace ChatGPT / Claude / Cursor?",
      a: "Complementary. Built to sit next to ChatGPT, Claude, and Cursor via a one-click export. Any Skillset converts to a skill.md file you can drop into ChatGPT, Claude, or Cursor directly — button lives on every skillset.",
    },
    {
      q: "I already have a folder of prompts. Can I import?",
      a: "Yes. Paste into Draft, run Skill Enhance to tune for the target model, save as a skillset. Messy notes to clean skillset in under a minute.",
    },
  ];

  return (
    <section className="relative border-t border-white/5 bg-[#0c0c10] py-16 md:py-28">
      <div className="mx-auto max-w-[1400px] px-5 md:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_1.4fr] md:gap-20">
          <div>
            <p
              className="mb-4 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              07 — FAQ
            </p>
            <h2 className="text-[28px] font-medium leading-[1.05] tracking-[-0.02em] text-zinc-50 md:text-[44px]">
              Questions makers ask before signing up.
            </h2>
            <p className="mt-5 max-w-[40ch] text-[15px] text-zinc-400">
              Don't see yours? Email{" "}
              <a className="text-zinc-100 underline decoration-white/20 underline-offset-4 hover:decoration-white/60" href="mailto:hello@skillset.so">
                hello@skillset.so
              </a>
              .
            </p>
          </div>

          <dl className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
            {faqs.map((f) => (
              <div key={f.q} className="grid grid-cols-1 gap-3 py-7 md:grid-cols-[1fr_1.4fr] md:gap-10">
                <dt className="text-[16px] font-medium text-zinc-50">{f.q}</dt>
                <dd className="text-[14.5px] leading-[1.6] text-zinc-400">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────── FOOTER */

function SiteFooter() {
  return (
    <footer className="relative border-t border-white/5 bg-[#0a0a0c] py-12 md:py-16">
      <div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-8 px-5 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:gap-10 md:px-6">
        <div className="col-span-2 md:col-span-1">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/img/skillset_logo.png"
              alt="Skillset"
              width={28}
              height={28}
              className="h-7 w-7 rounded-md object-cover"
            />
            <span className="text-[15px] font-medium tracking-tight text-zinc-50">
              Skillset
            </span>
          </Link>
          <p className="mt-4 max-w-[40ch] text-[13.5px] leading-[1.55] text-zinc-500">
            Cut AI costs up to 80%. Save prompts as skills, route to the cheapest model, own your work.
          </p>
          <p className="mt-6 text-[12px] text-zinc-600" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
            © {new Date().getFullYear()} Skillset · skillset.so
          </p>
          <a
            href="https://www.producthunt.com/products/skillset?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-skillset"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-block"
          >
            <img
              alt="Skillset - Skill Chat. Skill Router. Skill Preset. A skill ecosystem. | Product Hunt"
              width={250}
              height={54}
              src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1146726&theme=light&t=1779154539263"
            />
          </a>
        </div>

        <ProductTreeCol />
        <FooterCol
          title="For Teams"
          links={[
            { label: "Skill Control", href: "#power" },
            { label: "Skill Eval", href: "#power" },
            { label: "Skill Enhance", href: "#power" },
            { label: "Pricing", href: "/pricing" },
          ]}
        />
        <FooterCol
          title="Resources"
          links={[
            { label: "Prompt library", href: "/prompts" },
            { label: "Comparisons", href: "/compare" },
            { label: "Privacy", href: "/privacy" },
          ]}
        />
      </div>
    </footer>
  );
}

function ProductTreeCol() {
  const items = [
    { label: "Skill Chat", href: "#bento-chat" },
    { label: "Skill Flow", href: "#bento-workflow" },
    { label: "Skill Preset", href: "#bento-preset" },
    { label: "Skill Router", href: "#bento-router" },
  ];
  return (
    <div>
      <h4
        className="mb-4 text-[11px] uppercase tracking-[0.18em] text-zinc-500"
        style={{ fontFamily: "var(--font-geist-mono), monospace" }}
      >
        Product
      </h4>
      <div className="rounded-lg border border-white/10 bg-gradient-to-br from-white/[0.025] to-transparent p-2.5">
        <div className="mb-2 flex items-center gap-1.5">
          <Image
            src="/img/skillset_logo.png"
            alt=""
            width={14}
            height={14}
            className="h-3.5 w-3.5 shrink-0 rounded object-cover"
          />
          <span className="text-[11.5px] font-medium tracking-tight text-zinc-50">
            Skillset
          </span>
          <span
            className="ml-auto rounded-full border border-[#2563EB]/30 bg-[#2563EB]/10 px-1 py-0.5 text-[7.5px] uppercase tracking-[0.14em] text-[#7BA7FF]"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            one app
          </span>
        </div>
        <ul
          className="space-y-1 text-[11.5px] text-zinc-400"
          style={{ fontFamily: "var(--font-geist-mono), monospace" }}
        >
          {items.map((l, i) => (
            <li key={l.label}>
              <Link
                href={l.href}
                className="group flex items-center gap-2 transition-colors hover:text-zinc-50"
              >
                <span className="text-zinc-700 transition-colors group-hover:text-[#7BA7FF]">
                  {i === items.length - 1 ? "└─" : "├─"}
                </span>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4
        className="mb-4 text-[11px] uppercase tracking-[0.18em] text-zinc-500"
        style={{ fontFamily: "var(--font-geist-mono), monospace" }}
      >
        {title}
      </h4>
      <ul className="space-y-2.5 text-[13.5px] text-zinc-400">
        {links.map((l) => (
          <li key={l.label}>
            <Link href={l.href} className="transition-colors hover:text-zinc-50">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
