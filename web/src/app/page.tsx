import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Bolt,
  Boxes,
  FileEdit,
  GitBranch,
  History,
  MessagesSquare,
  Package,
  Palette,
  Sparkles,
  Workflow,
} from "lucide-react";
import type { Metadata } from "next";
import { ChatVisual, PresetVisual, RouterVisual, WorkflowVisual } from "@/components/bento-visuals";
import { ScrollReveal } from "@/components/scroll-reveal";
import { SkillsetNav } from "@/components/skillset-nav";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "Skillset: Turn your prompts into reusable skills",
  description:
    "Save your prompts as portable skills. Use them across ChatGPT, Claude, Gemini — any AI tool. No memory transfers. No copy-paste.",
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
            <span>v1.1 — formerly PromptPack</span>
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
            Your prompts, portable across every AI tool. No memory transfers. No
            copy-paste. Save once, use everywhere — ChatGPT, Claude, Gemini, your IDE.
          </p>
          <p className="mt-4 max-w-[58ch] text-[13px] leading-[1.5] text-zinc-500">
            Stop burning tokens on prompts you've written ten times. Start
            earning the moment someone licenses one of yours.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/downloads"
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
          <AppMockup />
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

function AppMockup() {
  return (
    <div className="relative w-full max-w-[680px] md:mt-12 md:translate-x-28 md:scale-[1.15] md:origin-top-right">
      <div
        aria-hidden
        className="absolute -inset-3 rounded-3xl border border-white/[0.04]"
      />

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f12] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.04)]">
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
            Skillset Desktop
          </span>
          <span className="text-[11px] text-zinc-500">v1.1</span>
        </div>

        <div className="flex">
          <aside className="w-[150px] shrink-0 border-r border-white/5 bg-[#0a0a0c] p-2">
            <div className="mb-3 flex items-center gap-2 px-2 py-1.5">
              {/* Plain <img> — Next Image optimizer races on the 2048x2048 source PNG */}
              <img
                src="/img/skillset_logo.png"
                alt="Skillset"
                width={20}
                height={20}
                className="h-5 w-5 shrink-0 rounded-md object-cover"
              />
              <span className="whitespace-nowrap text-[12px] font-medium tracking-tight text-zinc-100">
                Skillset
              </span>
            </div>

            <NavRow
              icon={<MessagesSquare className="h-3.5 w-3.5" strokeWidth={1.75} />}
              label="Chat"
              tip="Skill Chat"
              href="#bento-chat"
              active
            />
            <NavRow
              icon={<FileEdit className="h-3.5 w-3.5" strokeWidth={1.75} />}
              label="Draft"
            />
            <NavRow
              icon={<Palette className="h-3.5 w-3.5" strokeWidth={1.75} />}
              label="Skill Preset"
              tip="Skill Preset"
              href="#bento-preset"
            />
            <NavRow
              icon={<Package className="h-3.5 w-3.5" strokeWidth={1.75} />}
              label="Your Skillsets"
            />

            <div className="my-2 border-t border-white/5" />

            <NavRow
              icon={<History className="h-3.5 w-3.5" strokeWidth={1.75} />}
              label="Skill Control"
              tip="Skill Control"
              href="#power"
            />
          </aside>

          <div className="flex-1 p-5">
            <div className="mb-3 flex items-center justify-between">
              <p
                className="text-[10px] uppercase tracking-[0.22em] text-zinc-500"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              >
                Skill Chat
              </p>
              <a
                href="#bento-router"
                className="group relative inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.02] px-2 py-0.5 text-[10px] text-zinc-300 transition-colors hover:border-[#2563EB]/50 hover:text-zinc-50"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#7BA7FF]" />
                <span style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
                  haiku 4.5 · 1c
                </span>
                <span className="pointer-events-none absolute -bottom-7 right-0 z-30 whitespace-nowrap rounded-md border border-white/10 bg-[#0a0a0c] px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-zinc-200 opacity-0 transition-opacity group-hover:opacity-100">
                  Skill Router
                </span>
              </a>
            </div>

            <div className="mb-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2563EB]/15 px-2 py-1 text-[11px] text-[#7BA7FF]">
                <Package className="h-3 w-3" strokeWidth={2} />
                Stock Analyzer
              </span>
              <span
                className="text-[10px] text-zinc-600"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              >
                13 prompts
              </span>
            </div>

            <a
              href="#bento-workflow"
              className="group relative mb-3 flex items-center gap-2 rounded-md border border-white/[0.06] bg-white/[0.015] px-3 py-2 transition-colors hover:border-[#2563EB]/40 hover:bg-white/[0.03]"
            >
              <Workflow className="h-3.5 w-3.5 text-[#7BA7FF]" strokeWidth={1.75} />
              <span className="text-[11px] text-zinc-300">
                Skill Flow · step 2 of 4
              </span>
              <span className="ml-auto inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#7BA7FF]" />
              <span className="pointer-events-none absolute -bottom-7 left-0 z-30 whitespace-nowrap rounded-md border border-white/10 bg-[#0a0a0c] px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-zinc-200 opacity-0 transition-opacity group-hover:opacity-100">
                Skill Flow
              </span>
            </a>

            <div className="space-y-2">
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-lg bg-[#2563EB]/15 px-3 py-2 text-[12px] leading-snug text-zinc-100">
                  Run on TSLA.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span
                  className="mt-1 shrink-0 rounded-full border border-white/10 bg-white/[0.02] px-1.5 py-0.5 text-[9px] uppercase tracking-[0.12em] text-zinc-400"
                  style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                >
                  Claude
                </span>
                <div className="max-w-[80%] rounded-lg bg-white/[0.03] px-3 py-2 text-[12px] leading-snug text-zinc-300">
                  Pulled 13 prompts. Running step 1: Executive summary…
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavRow({
  icon,
  label,
  tip,
  href,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  tip?: string;
  href?: string;
  active?: boolean;
}) {
  const inner = (
    <div
      className={`group relative flex items-center gap-2 rounded-md px-2 py-1.5 text-[11.5px] transition-colors ${
        active ? "bg-white/[0.05] text-zinc-50" : "text-zinc-400"
      } ${href ? "cursor-pointer hover:bg-white/[0.04] hover:text-zinc-50" : ""}`}
    >
      <span className={active ? "text-[#7BA7FF]" : "text-zinc-500"}>{icon}</span>
      <span className="truncate">{label}</span>
      {tip && (
        <span className="pointer-events-none absolute left-full top-1/2 z-30 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md border border-white/10 bg-[#0a0a0c] px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-zinc-200 opacity-0 transition-opacity group-hover:opacity-100">
          {tip}
        </span>
      )}
    </div>
  );
  return href ? (
    <a href={href} className="block">
      {inner}
    </a>
  ) : (
    <div>{inner}</div>
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

        <div className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-5">
          <BentoCard
            className="md:col-span-8"
            id="bento-chat"
            icon={<MessagesSquare strokeWidth={1.75} className="h-5 w-5" />}
            eyebrow="Skill Chat"
            title="One chat. Every model."
            body={
              <>
                Skills and chat in one place — no jumping between ChatGPT and Claude tabs. Handles normal chat, agentic work, and parallel orchestration like Codex and Claude. Plus auto-routing across models (see{" "}
                <a
                  href="#bento-router"
                  className="text-[#7BA7FF] underline decoration-[#7BA7FF]/40 underline-offset-2 transition-colors hover:text-zinc-50 hover:decoration-zinc-50"
                >
                  Skill Router
                </a>{" "}
                below) that <strong className="font-semibold text-zinc-100">top AI apps don&rsquo;t ship</strong>.
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
            title="Your style is yours. Encrypt it. License it."
            body={
              <>
                Built to protect artists from AI style theft. Verify your work, lock your signature look into an encrypted skillset, then set a price and sell it. <strong className="font-semibold text-zinc-100">Every license sold is a royalty in your pocket</strong> — the new standard for artist rights in generative AI.
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
            title="Multi-step prompts, chained."
            body="Output of step 1 feeds step 2. Run the whole sequence on demand."
            visual={<WorkflowVisual />}
            decor="right"
          />
          <BentoCard
            className="md:col-span-7"
            id="bento-router"
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
        <div className="relative mt-auto pt-6 pb-2">{visual}</div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── HOW IT WORKS */

function HowItWorks() {
  const steps: { n: string; t: string; d: React.ReactNode }[] = [
    {
      n: "01",
      t: "Capture in one click.",
      d: "Install the app and grab any prompt straight from ChatGPT, Claude, or Gemini — no copy-paste, no losing your best work in chat history.",
    },
    {
      n: "02",
      t: "Pack it into a skillset.",
      d: (
        <>
          Group related prompts, add variables, lock the model that works.{" "}
          <a
            href="#"
            className="text-[#7BA7FF] underline decoration-[#7BA7FF]/40 underline-offset-2 transition-colors hover:text-zinc-50 hover:decoration-zinc-50"
          >
            Skillset
          </a>{" "}
          bundles them into a portable, encrypted set you fully own.
        </>
      ),
    },
    {
      n: "03",
      t: "Run it — or sell it.",
      d: "Trigger from Skill Chat, then export and license your skillset. Sell your set to people who want to use it — every license sold is yours.",
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
                Save up to 5 skills and run them anywhere — no card required. Pro and
                Studio unlock more skillsets and features, catered based on your needs.
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

            <ul className="space-y-4 border-l border-white/[0.06] pl-6 text-[14px] text-zinc-300 md:pl-10">
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
      a: "A skill is one reusable prompt saved as markdown — the format Anthropic popularized. A skillset is a bundle of related skills you can rework, version, encrypt, license, and sell. Same prompts, except now they ship like a product, not sit dead in some document.",
    },
    {
      q: "Why not just save prompts in Notion or a doc?",
      a: "A document holds prompts. Skillset runs them. Notion can't sync your prompts into the tools you use, can't lock them when you share, can't re-version them when a model updates, and can't license them for you. Skillset wraps them into something you own — always synced, private by default, earning the moment someone pays.",
    },
    {
      q: "Does this replace ChatGPT / Claude / Cursor?",
      a: "Complementary, not a replacement. For repeat workflows, one-off runs, and jobs where token cost matters, Skillset usually carries it alone. But it's built to sit next to ChatGPT, Claude, and Cursor, on the same \"skills.md\" format those labs already use.",
    },
    {
      q: "I already have a folder of prompts. Can I import?",
      a: "Yes. Paste them into Draft, run Skill Enhance to tune each one for the model it'll run on, save the batch as a skillset. Messy notes to a clean skillset in under a minute.",
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
