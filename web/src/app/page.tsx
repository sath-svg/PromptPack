import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { AppMockupTabbed } from "@/components/app-mockup-tabbed";
import { LandingSkilly } from "@/components/landing-skilly";
import { ScrollReveal } from "@/components/scroll-reveal";
import { SkillsetNav } from "@/components/skillset-nav";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "Skillset · The only AI companion you need.",
  description:
    "The only AI companion you need. Save your prompts as reusable skills, run any model, and ship faster in ChatGPT, Claude, Gemini, and Telegram. Free forever, no credit card.",
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
        <div className="relative flex flex-col">
          <div
            className="mb-8 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] text-[12px] text-zinc-400"
            style={{ fontFamily: "var(--font-geist-mono), monospace", padding: "4px 9px" }}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2563EB] opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#2563EB]" />
            </span>
            <span>v1.3 — formerly PromptPack</span>
          </div>

          <div className="relative">
            {/* Skilly overlay — desktop only. Behind headline, large + translucent.
                h1 is pointer-events-none on lg+ so hover/touch over text passes
                through to Skilly's button, triggering the "tap me" hint and
                tooltip from any area of the mascot. */}
            <LandingSkilly
              className="absolute left-[78%] top-1/2 hidden -translate-x-1/2 -translate-y-1/2 !z-0 opacity-[0.55] mix-blend-screen lg:block"
              size={420}
              tooltipSide="right"
              tooltipOffsetX={-260}
            />
            <h1 className="relative z-10 text-[38px] font-medium leading-[1.02] tracking-[-0.025em] text-zinc-50 sm:text-[44px] md:text-[60px] lg:pointer-events-none lg:text-[68px]">
              Skillset.
              <br />
              <span className="block mt-2 text-[24px] font-normal leading-[1.15] text-zinc-300 sm:text-[28px] md:text-[36px] lg:text-[40px]">
                The only <span className="text-zinc-100 font-medium">AI companion</span>
                <br />
                you need.
              </span>
            </h1>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3 md:mt-10 md:gap-4">
            <Link
              href="/downloads"
              style={{ padding: "10px 22px" }}
              className="group inline-flex items-center gap-2 rounded-full bg-[#2563EB] text-sm font-medium text-white whitespace-nowrap shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_8px_24px_-12px_rgba(37,99,235,0.6)] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[#1d4ed8] active:translate-y-[1px]"
            >
              Take a look
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
            </Link>
            <Link
              href="/how-it-works#features"
              style={{ padding: "10px 22px" }}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.02] text-sm text-zinc-200 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.05] active:translate-y-[1px]"
            >
              Features
            </Link>
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

          {/* Mobile/tablet Skilly mount — original placement below stats.
              Hidden on lg+ where the overlay variant takes over. */}
          <div className="relative mt-6 md:mt-8 lg:hidden">
            <LandingSkilly className="relative inline-block" size={96} tooltipSide="right" />
          </div>

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
  const pains: { saves: string; pain: string; fix: React.ReactNode }[] = [
    {
      saves: "saves time",
      pain: "Hand-running the same prompts every day, when they could run themselves.",
      fix: (
        <>
          <a
            href="/how-it-works#bento-workflow"
            className="font-medium text-[#7BA7FF] underline decoration-[#7BA7FF]/40 underline-offset-2 transition-colors hover:text-zinc-50 hover:decoration-zinc-50"
          >
            Skill Flow
          </a>{" "}
          runs your repeat tasks on autopilot.
        </>
      ),
    },
    {
      saves: "saves brainpower",
      pain: "You don't need to understand AI.",
      fix: (
        <>
          <a
            href="/how-it-works#bento-router"
            className="font-medium text-[#7BA7FF] underline decoration-[#7BA7FF]/40 underline-offset-2 transition-colors hover:text-zinc-50 hover:decoration-zinc-50"
          >
            Skill Router
          </a>{" "}
          picks the best and cheapest model for every task. Always.
        </>
      ),
    },
    {
      saves: "saves your IP",
      pain: "Conversations, memory, valuable prompts scattered everywhere.",
      fix: (
        <>
          Notion-style sets and folders, with version control (
          <a
            href="/how-it-works#power"
            className="font-medium text-[#7BA7FF] underline decoration-[#7BA7FF]/40 underline-offset-2 transition-colors hover:text-zinc-50 hover:decoration-zinc-50"
          >
            Skill Control
          </a>
          ) and built-in evals (
          <a
            href="/how-it-works#power"
            className="font-medium text-[#7BA7FF] underline decoration-[#7BA7FF]/40 underline-offset-2 transition-colors hover:text-zinc-50 hover:decoration-zinc-50"
          >
            Skill Eval
          </a>
          ).
        </>
      ),
    },
    {
      saves: "saves money",
      pain: "Four separate AI subscriptions?",
      fix: (
        <>
          One <strong className="font-medium text-zinc-100">Skillset membership</strong> covers them all.
        </>
      ),
    },
  ];

  return (
    <section className="relative border-t border-white/5 bg-[#0a0a0c] py-16 md:py-24">
      <div className="mx-auto max-w-[1100px] px-5 md:px-6">
        <p
          className="mb-4 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
          style={{ fontFamily: "var(--font-geist-mono), monospace" }}
        >
          01 · What an AI companion saves you
        </p>
        <h2 className="text-[30px] font-medium leading-[1.05] tracking-[-0.02em] text-zinc-50 md:text-[48px]">
          Sound familiar?
        </h2>
        <ul className="mt-8 grid grid-cols-1 gap-4 md:mt-12 md:grid-cols-2 md:gap-5">
          {pains.map((p, i) => (
            <li
              key={i}
              className="flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-white/[0.015] p-5 md:p-6"
            >
              <span
                className="inline-flex w-fit items-center rounded-full border border-[#2563EB]/25 bg-[#2563EB]/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[#7BA7FF]"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              >
                {p.saves}
              </span>
              <p className="text-[16px] leading-[1.45] text-zinc-200 md:text-[18px]">
                {p.pain}
              </p>
              <p className="mt-auto flex items-start gap-2 text-[13.5px] leading-[1.55] text-zinc-400 md:text-[14px]">
                <span className="mt-[7px] inline-block h-1 w-1 shrink-0 rounded-full bg-[#7BA7FF]" />
                <span>{p.fix}</span>
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
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
          02 · In the wild
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
      a: "Complementary. Sits next to them. New in v1.3: one-click \"Install Skill\" writes your skillset directly into Claude Code (SKILL.md), Cursor (.cursor/rules), or AGENTS.md for Codex — works with workflows, folders, and presets. Pick a project, click install, done.",
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
              03 · FAQ
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
          title="Content"
          links={[
            { label: "Skill Control", href: "/how-it-works#power" },
            { label: "Skill Eval", href: "/how-it-works#power" },
            { label: "Skill Enhance", href: "/how-it-works#power" },
            { label: "Pricing", href: "/pricing" },
          ]}
        />
        <FooterCol
          title="Resources"
          links={[
            { label: "Skillsets by role", href: "/skillsets" },
            { label: "Prompt library", href: "/prompts" },
            { label: "Comparisons", href: "/compare" },
            { label: "Feedback", href: "https://feedback.skillset.so" },
            { label: "Privacy", href: "/privacy" },
          ]}
        />
      </div>
    </footer>
  );
}

function ProductTreeCol() {
  const items = [
    { label: "Skill Chat", href: "/how-it-works#bento-chat" },
    { label: "Skill Flow", href: "/how-it-works#bento-workflow" },
    { label: "Skill Preset", href: "/how-it-works#bento-preset" },
    { label: "Skill Router", href: "/how-it-works#bento-router" },
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
