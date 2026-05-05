import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Bolt,
  Boxes,
  CircleDot,
  GitBranch,
  MessagesSquare,
  Palette,
  Sparkles,
  Workflow,
} from "lucide-react";
import type { Metadata } from "next";
import { ScrollReveal } from "@/components/scroll-reveal";
import { SkillsetNav } from "@/components/skillset-nav";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "Skillset — Turn your prompts into reusable skills",
  description:
    "Save your prompts as portable skills. Use them across ChatGPT, Claude, Gemini, Midjourney — any AI tool. No memory transfer. No copy-paste.",
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

      <SkillsetNav
        links={[
          { label: "Features", href: "#features" },
          { label: "How it works", href: "#how" },
          { label: "For teams", href: "#power" },
          { label: "Pricing", href: "/pricing" },
        ]}
      />

      <Hero />

      <ScrollReveal>
        <CoreFeatures />
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
    <section className="relative h-[calc(100dvh-57px)] flex flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[640px]"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 70% 20%, rgba(37,99,235,0.18), transparent 60%)",
        }}
      />

      <div className="flex-1 flex items-center">
      <div className="relative w-full mx-auto grid max-w-[1400px] grid-cols-1 gap-16 px-6 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
        <div className="flex flex-col">
          <div
            className="mb-8 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] text-[12px] text-zinc-400"
            style={{ fontFamily: "var(--font-geist-mono), monospace", padding: "4px 9px" }}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2563EB] opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#2563EB]" />
            </span>
            <span>v0.1 — formerly PromptPack</span>
          </div>

          <h1 className="text-[44px] font-medium leading-[1.02] tracking-[-0.025em] text-zinc-50 md:text-[64px] lg:text-[72px]">
            Turn your prompts
            <br />
            into{" "}
            <span className="relative inline-block">
              <span className="relative z-10">reusable skills.</span>
              <span
                aria-hidden
                className="absolute bottom-[0.1em] left-0 right-0 -z-0 h-[0.18em] bg-[#2563EB]/40"
              />
            </span>
          </h1>

          <p className="mt-7 max-w-[58ch] text-[17px] leading-[1.55] text-zinc-400">
            Your prompts, portable across every AI tool. No memory transfer. No
            copy-paste. Save once, use everywhere — ChatGPT, Claude, Gemini,
            Midjourney, your IDE.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/sign-up"
              style={{ padding: "10px 22px" }}
              className="group inline-flex items-center gap-2 rounded-full bg-[#2563EB] text-sm font-medium text-white whitespace-nowrap shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_8px_24px_-12px_rgba(37,99,235,0.6)] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[#1d4ed8] active:translate-y-[1px]"
            >
              Start Free
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
            </Link>
            <a
              href="#how"
              style={{ padding: "10px 22px" }}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.02] text-sm text-zinc-200 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.05] active:translate-y-[1px]"
            >
              See how it works
            </a>
          </div>

          <p
            className="mt-5 text-[12px] text-zinc-500"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            free forever plan · no credit card · works in any LLM
          </p>

          <dl className="mt-14 grid grid-cols-3 border-t border-white/5 pt-6 text-left">
            <Stat value="2.4M+" label="prompts saved" />
            <Stat value="187" label="public skills" />
            <Stat value="14k" label="active makers" />
          </dl>
        </div>

        <div className="relative flex items-start justify-end pt-4">
          <InstallTerminal />
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
        className="text-[22px] font-medium tracking-tight text-zinc-100"
        style={{ fontFamily: "var(--font-geist-mono), monospace" }}
      >
        {value}
      </dt>
      <dd className="text-[12px] uppercase tracking-[0.12em] text-zinc-500">
        {label}
      </dd>
    </div>
  );
}

function InstallTerminal() {
  return (
    <div className="relative w-full max-w-[560px]">
      <div
        aria-hidden
        className="absolute -inset-3 rounded-3xl border border-white/[0.04]"
      />

      <div className="relative rounded-2xl border border-white/10 bg-[#0f0f12] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#3b3b3f]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#3b3b3f]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#3b3b3f]" />
          </div>
          <span
            className="text-[11px] uppercase tracking-[0.16em] text-zinc-500"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            ~/skillset
          </span>
          <span className="text-[11px] text-zinc-500">install</span>
        </div>

        <div
          className="space-y-3 p-6 text-[13.5px] leading-[1.7]"
          style={{ fontFamily: "var(--font-geist-mono), monospace" }}
        >
          <div className="flex gap-3 text-zinc-500">
            <span className="text-[#2563EB]">$</span>
            <span className="text-zinc-200">
              npx -y <span className="text-[#7BA7FF]">pmtpk</span>
            </span>
          </div>

          <div className="text-zinc-500">↳ syncing your skill library…</div>

          <div className="flex gap-3">
            <span className="text-[#2563EB]">$</span>
            <span className="text-zinc-200">
              run <span className="text-[#7BA7FF]">"my style"</span> video generation skill
            </span>
          </div>

          <div className="flex items-center gap-2">
            <CircleDot className="h-3.5 w-3.5 text-emerald-400/80" strokeWidth={2} />
            <span className="text-emerald-400/90">ready in claude · 23ms</span>
          </div>

          <div className="flex gap-3">
            <span className="text-[#2563EB]">$</span>
            <span className="text-zinc-200">
              run <span className="text-[#7BA7FF]">stock analyzer</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <CircleDot className="h-3.5 w-3.5 text-emerald-400/80" strokeWidth={2} />
            <span className="text-emerald-400/90">ready in claude · 17ms</span>
            <span className="ml-1 inline-block h-3.5 w-[7px] animate-pulse bg-emerald-400/70" />
          </div>
        </div>
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
    <section id="features" className="relative bg-[#0a0a0c] py-28 md:py-36">
      <div className="mx-auto max-w-[1400px] px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_1fr] md:gap-16">
          <div>
            <p
              className="mb-4 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              01 — Save once. Use everywhere.
            </p>
            <h2 className="text-[36px] font-medium leading-[1.05] tracking-[-0.02em] text-zinc-50 md:text-[52px]">
              Stop re-explaining yourself
              <br />
              to every new chat.
            </h2>
          </div>
          <div className="flex items-end">
            <p className="max-w-[48ch] text-[16px] leading-[1.6] text-zinc-400">
              A skill is a reusable unit of prompt + context that travels with
              you across tools. Build a library once. Run it anywhere.
            </p>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-4 md:auto-rows-[480px] md:grid-cols-12 md:gap-5">
          <BentoCard
            className="md:col-span-8"
            icon={<MessagesSquare strokeWidth={1.75} className="h-5 w-5" />}
            eyebrow="Skill Chat"
            title="One chat. Every model."
            body="Run a skill in Claude. Switch to GPT-5 mid-thread. Keep the context. Pay for the model that fits the task — not the one your tab happens to be open on."
            visual={<ChatVisual />}
            decor="left"
          />
          <BentoCard
            className="md:col-span-4"
            icon={<Palette strokeWidth={1.75} className="h-5 w-5" />}
            eyebrow="Preset Skills"
            title="Image & video styles, locked."
            body="Save the exact Midjourney or Sora style that worked. Re-summon it six months from now."
            visual={<PresetVisual />}
            decor="right"
          />
          <BentoCard
            className="md:col-span-5"
            icon={<Workflow strokeWidth={1.75} className="h-5 w-5" />}
            eyebrow="Workflow Skills"
            title="Multi-step prompts, chained."
            body="Output of step 1 feeds step 2. Run the whole sequence on demand."
            visual={<WorkflowVisual />}
            decor="right"
          />
          <BentoCard
            className="md:col-span-7"
            icon={<Bolt strokeWidth={1.75} className="h-5 w-5" />}
            eyebrow="Skill Router"
            title="Route prompts to the cheapest capable model."
            body="Routine task? Haiku. Reasoning-heavy? Sonnet. Vision? Gemini. Skillset picks the right model per skill so your bill doesn't balloon."
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
  icon,
  eyebrow,
  title,
  body,
  visual,
  decor = "right",
}: {
  className?: string;
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  body: string;
  visual: React.ReactNode;
  decor?: "left" | "right";
}) {
  return (
    <div
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0f0f12] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-all duration-300 hover:border-white/[0.14] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_20px_40px_-30px_rgba(37,99,235,0.4)] ${className}`}
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

      <div className="relative z-10 flex h-full flex-col p-7 md:p-9">
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
        <div className="mt-auto pt-6 overflow-hidden pb-2">{visual}</div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── BENTO VISUALS */

function ChatVisual() {
  const turns = [
    { who: "you", model: null, text: "Rewrite this in @email-tone-pro voice." },
    { who: "ai", model: "Claude", text: "Done. Switching to GPT-5 for the code block." },
    { who: "ai", model: "GPT-5", text: "Refactored. Same skill, same context." },
  ];
  return (
    <div className="space-y-2">
      {turns.map((t, i) => (
        <div
          key={i}
          className={`flex items-start gap-2 ${t.who === "you" ? "justify-end" : ""}`}
        >
          {t.who === "ai" && (
            <span
              className="mt-1 shrink-0 rounded-full border border-white/10 bg-white/[0.02] px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-zinc-400"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              {t.model}
            </span>
          )}
          <div
            className={`max-w-[80%] rounded-lg px-3 py-2 text-[13px] leading-snug ${
              t.who === "you"
                ? "bg-[#2563EB]/15 text-zinc-100"
                : "bg-white/[0.03] text-zinc-300"
            }`}
          >
            {t.text}
          </div>
        </div>
      ))}
      <div className="flex items-center gap-2 pt-2 text-[11.5px] text-zinc-500">
        <Sparkles className="h-3.5 w-3.5 text-[#7BA7FF]" strokeWidth={2} />
        <span>
          using skill{" "}
          <span
            className="text-zinc-300"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            @email-tone-pro
          </span>
        </span>
      </div>
    </div>
  );
}

function PresetVisual() {
  const swatches = [
    { g: "from-[#1f2937] to-[#0b3b6f]", n: "Cinematic blue" },
    { g: "from-[#3a1c4d] to-[#0a0a0c]", n: "Dusk plum" },
    { g: "from-[#2f4d2c] to-[#0a0a0c]", n: "Forest matte" },
    { g: "from-[#5c2c1c] to-[#0a0a0c]", n: "Ember rust" },
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {swatches.map((s, i) => (
        <div
          key={i}
          className={`relative aspect-[4/3] overflow-hidden rounded-md bg-gradient-to-br ${s.g}`}
        >
          <span className="absolute bottom-1.5 left-2 text-[10.5px] text-white/85">
            {s.n}
          </span>
        </div>
      ))}
    </div>
  );
}

function WorkflowVisual() {
  const steps = [
    { n: "01", t: "Research brief", state: "done" },
    { n: "02", t: "Outline sections", state: "done" },
    { n: "03", t: "Draft each block", state: "running" },
    { n: "04", t: "Polish & cite", state: "queued" },
  ];
  return (
    <ol className="divide-y divide-white/[0.05] border-y border-white/[0.05]">
      {steps.map((s) => (
        <li key={s.n} className="flex items-center gap-3 py-2.5">
          <span
            className="w-7 text-[11px] text-zinc-500"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            {s.n}
          </span>
          <span className="text-[13px] text-zinc-200">{s.t}</span>
          <span
            className={`ml-auto inline-flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.12em] ${
              s.state === "done"
                ? "text-emerald-400/80"
                : s.state === "running"
                ? "text-[#7BA7FF]"
                : "text-zinc-500"
            }`}
          >
            {s.state === "running" && (
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#7BA7FF]" />
            )}
            {s.state}
          </span>
        </li>
      ))}
    </ol>
  );
}

function RouterVisual() {
  const rows = [
    { task: "summarize 80-page PDF", model: "Haiku 4.5", cost: "$0.0012" },
    { task: "refactor TypeScript module", model: "Sonnet 4.7", cost: "$0.0143" },
    { task: "extract chart from image", model: "Gemini 3", cost: "$0.0061" },
  ];
  return (
    <div>
      <div className="divide-y divide-white/[0.05] border-y border-white/[0.05]">
        {rows.map((r) => (
          <div
            key={r.task}
            className="grid grid-cols-[1.6fr_1fr_0.7fr] items-center gap-3 py-2.5"
          >
            <span className="truncate text-[13px] text-zinc-300">{r.task}</span>
            <span
              className="text-[12.5px] text-[#7BA7FF]"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              {r.model}
            </span>
            <span
              className="text-right text-[12.5px] tabular-nums text-zinc-400"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              {r.cost}
            </span>
          </div>
        ))}
      </div>
      <div
        className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-zinc-500"
        style={{ fontFamily: "var(--font-geist-mono), monospace" }}
      >
        <span>12,847 routed this month</span>
        <span className="text-emerald-400/80">−63% vs always-Sonnet</span>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── HOW IT WORKS */

function HowItWorks() {
  const steps = [
    {
      n: "01",
      t: "Save it once.",
      d: "Capture your best prompt right where you're chatting. Desktop app or paste it in.",
    },
    {
      n: "02",
      t: "Wrap it as a skill.",
      d: "Add variables, examples, the model it works best in. Skillset stores it as a portable SKILL.md.",
    },
    {
      n: "03",
      t: "Run it anywhere.",
      d: "Trigger from Skill Chat, install via npx into Cursor or Codex, or share publicly via a one-line URL.",
    },
  ];
  return (
    <section id="how" className="relative border-t border-white/5 bg-[#0c0c10] py-20 md:py-28">
      <div className="mx-auto max-w-[1400px] px-6">
        <div className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-[1fr_1fr] md:gap-16">
          <div>
            <p
              className="mb-4 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              02 — How it works
            </p>
            <h2 className="text-[36px] font-medium leading-[1.05] tracking-[-0.02em] text-zinc-50 md:text-[52px]">
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
              className="group grid grid-cols-1 gap-6 bg-[#0f0f12] px-6 py-8 transition-colors hover:bg-white/[0.015] md:grid-cols-[120px_1fr_auto] md:items-center md:px-10 md:py-10"
            >
              <span
                className="text-[34px] font-medium text-zinc-700 transition-colors group-hover:text-[#7BA7FF]"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              >
                {s.n}
              </span>
              <div>
                <h3 className="text-[22px] font-medium tracking-[-0.015em] text-zinc-50 md:text-[26px]">
                  {s.t}
                </h3>
                <p className="mt-2 max-w-[60ch] text-[15px] leading-[1.55] text-zinc-400">
                  {s.d}
                </p>
              </div>
              <ArrowUpRight
                className="hidden h-6 w-6 text-zinc-600 transition-all group-hover:text-zinc-100 md:block"
                strokeWidth={1.5}
              />
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
      title: "Version control for prompts.",
      body: "Diff prompts across model upgrades. Roll back when GPT-6 breaks the prompt that worked yesterday.",
    },
    {
      icon: <Boxes strokeWidth={1.75} className="h-5 w-5" />,
      eyebrow: "Skill Eval",
      title: "Test before you ship.",
      body: "Run a prompt against test cases. Compare outputs across models. Catch regressions before users do.",
    },
    {
      icon: <Sparkles strokeWidth={1.75} className="h-5 w-5" />,
      eyebrow: "Skill Enhance",
      title: "Auto-improve weak prompts.",
      body: "Paste a draft, get a structured rewrite. Skillset adds the scaffolding (role, format, examples) you forgot.",
    },
  ];

  return (
    <section id="power" className="relative bg-[#0a0a0c] py-20 md:py-28">
      <div className="mx-auto max-w-[1400px] px-6">
        <div className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-[1fr_1fr] md:gap-16">
          <div>
            <p
              className="mb-4 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              03 — For teams shipping AI
            </p>
            <h2 className="text-[36px] font-medium leading-[1.05] tracking-[-0.02em] text-zinc-50 md:text-[52px]">
              Built for the engineers
              <br />
              who own the prompts.
            </h2>
          </div>
          <div className="flex items-end">
            <p className="max-w-[48ch] text-[16px] leading-[1.6] text-zinc-400">
              When prompts move from "neat trick" to production dependency, you
              need versioning, evals, and safety nets. Skillset has all three.
            </p>
          </div>
        </div>

        <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
          {items.map((it) => (
            <div
              key={it.eyebrow}
              className="grid grid-cols-1 gap-6 py-10 md:grid-cols-[200px_1fr_1fr] md:items-start md:gap-12"
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
              <h3 className="text-[24px] font-medium leading-[1.15] tracking-[-0.015em] text-zinc-50 md:text-[28px]">
                {it.title}
              </h3>
              <p className="text-[15px] leading-[1.6] text-zinc-400">{it.body}</p>
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
    <section className="relative border-t border-white/5 bg-[#0c0c10] py-24">
      <div className="mx-auto mb-12 max-w-[1400px] px-6">
        <p
          className="mb-4 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
          style={{ fontFamily: "var(--font-geist-mono), monospace" }}
        >
          04 — In the wild
        </p>
        <h2 className="max-w-[20ch] text-[34px] font-medium leading-[1.05] tracking-[-0.02em] text-zinc-50 md:text-[44px]">
          People who stopped losing prompts.
        </h2>
      </div>

      <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
        <div className="flex w-max animate-[marquee_60s_linear_infinite] gap-5 px-6">
          {[...quotes, ...quotes].map((t, i) => (
            <figure
              key={`${t.n}-${i}`}
              className="flex w-[380px] shrink-0 flex-col gap-5 rounded-2xl border border-white/[0.06] bg-[#0f0f12] p-7"
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
    <section id="pricing" className="relative bg-[#0a0a0c] py-20 md:py-28">
      <div className="mx-auto max-w-[1400px] px-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-[#0f0f12] p-10 md:p-16">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(37,99,235,0.22), transparent 60%)",
            }}
          />
          <div className="relative grid grid-cols-1 gap-12 md:grid-cols-[1.2fr_0.8fr] md:items-end md:gap-16">
            <div>
              <p
                className="mb-4 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              >
                Pricing
              </p>
              <h2 className="text-[36px] font-medium leading-[1.05] tracking-[-0.02em] text-zinc-50 md:text-[48px]">
                Free forever, for personal libraries.
              </h2>
              <p className="mt-5 max-w-[56ch] text-[16px] leading-[1.6] text-zinc-400">
                Save up to 10 prompts and run them anywhere — no card. Pro and
                Studio unlock private packs, encrypted skill exports, eval runs,
                and team sync.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/sign-up"
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

            <ul className="space-y-4 border-l border-white/[0.06] pl-6 text-[14px] text-zinc-300 md:pl-10">
              {[
                "10 saved skills, unlimited runs",
                "Desktop app + cross-model sync",
                "Public skill sharing via URL",
                "MCP + npx skills install",
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
      q: "What exactly is a 'skill'?",
      a: "A skill is a structured prompt — instructions, variables, model preferences — saved as a portable file you can run in any LLM. Compatible with the SKILL.md format used by Vercel-style agent skill ecosystems.",
    },
    {
      q: "Why not just save prompts in Notion or a doc?",
      a: "Docs go stale and don't run. A skill in Skillset is one click to execute, version-controlled when models change, and routable to the cheapest model that can do the job.",
    },
    {
      q: "Does this replace ChatGPT / Claude / Cursor?",
      a: "No — it sits on top of them. Use Skillset to manage and trigger your skill library. Output happens in the model you choose.",
    },
    {
      q: "I already have a folder of prompts. Can I import?",
      a: "Yes. Drop a folder, paste a Notion export, or `npx skills add` from a GitHub repo. Skillset normalizes the format.",
    },
  ];

  return (
    <section className="relative border-t border-white/5 bg-[#0c0c10] py-28">
      <div className="mx-auto max-w-[1400px] px-6">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1fr_1.4fr] md:gap-20">
          <div>
            <p
              className="mb-4 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              05 — FAQ
            </p>
            <h2 className="text-[36px] font-medium leading-[1.05] tracking-[-0.02em] text-zinc-50 md:text-[44px]">
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
    <footer className="relative border-t border-white/5 bg-[#0a0a0c] py-16">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-10 px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <Image
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
            Turn your prompts into reusable skills. Portable across every AI
            tool you use.
          </p>
          <p className="mt-6 text-[12px] text-zinc-600" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
            © {new Date().getFullYear()} Skillset · skillset.so
          </p>
        </div>

        <FooterCol
          title="Product"
          links={[
            { label: "Skill Chat", href: "#features" },
            { label: "Workflow Skills", href: "#features" },
            { label: "Preset Skills", href: "#features" },
            { label: "Skill Router", href: "#features" },
          ]}
        />
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
