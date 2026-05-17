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
import { ChatVisual, PresetVisual, RouterVisual, WorkflowVisual, StepCaptureVisual, StepPackVisual, StepRunVisual } from "@/components/bento-visuals";
import { ScrollReveal } from "@/components/scroll-reveal";
import { SkillsetNav } from "@/components/skillset-nav";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "Skillset: cut your AI costs by up to 80%",
  description:
    "Cut AI costs up to 80% with smart prompt routing. Save your best prompts as portable skills, route each task to the cheapest capable model, and use them across ChatGPT, Claude, Gemini, and your IDE.",
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
            <span>v1.1 — formerly PromptPack</span>
          </div>

          <h1 className="text-[38px] font-medium leading-[1.02] tracking-[-0.025em] text-zinc-50 sm:text-[44px] md:text-[64px] lg:text-[72px]">
            Save up to{" "}
            <span className="text-emerald-400">80%</span>
            <br />
            on{" "}
            <span className="relative inline-block">
              <span className="relative z-10">AI costs.</span>
              <span
                aria-hidden
                className="absolute bottom-[0.1em] left-0 right-0 -z-0 h-[0.18em] bg-[#2563EB]/40"
              />
            </span>
          </h1>

          <p className="mt-5 max-w-[52ch] text-[15.5px] leading-[1.55] text-zinc-400 md:mt-7 md:text-[17px]">
            Save skills and prompts as skillsets. Route each skillset to the cheapest capable model. One library across every AI tool you use.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3 md:mt-10 md:gap-4">
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

          <dl className="mt-10 grid grid-cols-3 gap-3 border-t border-white/5 pt-5 text-left md:mt-14 md:gap-0 md:pt-6">
            <Stat value="2.4M+" label="prompts saved" />
            <Stat value="187" label="public skills" />
            <Stat value="14k" label="active makers" />
          </dl>
        </div>

        <div className="relative -mx-1 flex items-start justify-center pt-2 md:mx-0 md:justify-end md:pt-4">
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
          <aside className="w-[120px] shrink-0 border-r border-white/5 bg-[#0a0a0c] p-2 md:w-[150px]">
            <div className="mb-3 flex items-center gap-2 px-1.5 py-1.5 md:px-2">
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

          <div className="flex-1 p-3 md:p-5">
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
    <section id="features" className="relative bg-[#0a0a0c] py-20 md:py-36">
      <div className="mx-auto max-w-[1400px] px-5 md:px-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_1fr] md:gap-16">
          <div>
            <p
              className="mb-4 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              01 — Save once. Use everywhere.
            </p>
            <h2 className="text-[30px] font-medium leading-[1.05] tracking-[-0.02em] text-zinc-50 md:text-[52px]">
              Stop re-explaining yourself
              <br />
              to every new chat.
            </h2>
          </div>
          <div className="flex items-end">
            <p className="max-w-[48ch] text-[16px] leading-[1.6] text-zinc-400">
              A skill is a reusable prompt that travels with you across tools. Build once. Run anywhere.
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
                Skills and chat in one place — no tab-switching. Handles chat, agentic work, and multi-model orchestration. Auto-routes to the cheapest capable model (see{" "}
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
                In the new norm of AI, we care about who gets paid. Encrypt your signature look into a skillset and set a price. <strong className="font-semibold text-zinc-100">AI can only train on your style when they buy your skillset</strong> — every sale is a royalty, not theft.
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
            body="Output of step 1 feeds step 2. Run the whole sequence on demand. Save workflows. Save tokens."
            visual={<WorkflowVisual />}
            decor="right"
          />
          <BentoCard
            className="md:col-span-7"
            id="bento-router"
            icon={<Bolt strokeWidth={1.75} className="h-5 w-5" />}
            eyebrow="Skill Router"
            title="Route prompts to the cheapest capable model."
            body="Routine task? Haiku. Reasoning? Sonnet. Vision? Gemini. Skillset auto-picks the right model per skill — cuts your AI bill up to 80%."
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
      d: "Trigger from Skill Chat, export, and license. Every sale goes to you.",
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
              02 — How it works
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
    <section id="power" className="relative bg-[#0a0a0c] py-16 md:py-28">
      <div className="mx-auto max-w-[1400px] px-5 md:px-6">
        <div className="mb-10 grid grid-cols-1 gap-8 md:mb-16 md:grid-cols-[1fr_1fr] md:gap-16">
          <div>
            <p
              className="mb-4 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              03 — For teams shipping AI
            </p>
            <h2 className="text-[30px] font-medium leading-[1.05] tracking-[-0.02em] text-zinc-50 md:text-[52px]">
              Built for the engineers
              <br />
              who own the prompts.
            </h2>
          </div>
          <div className="flex items-end">
            <p className="max-w-[48ch] text-[16px] leading-[1.6] text-zinc-400">
              When prompts become production dependencies, you need versioning, evals, and safety nets. Skillset ships all three.
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
          04 — In the wild
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
      a: "Complementary. For repeat workflows and cost-sensitive runs, Skillset handles it. Built to sit next to ChatGPT, Claude, and Cursor — same skills.md format those labs use.",
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
              05 — FAQ
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
