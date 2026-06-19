import { Geist, Geist_Mono } from "next/font/google";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, Workflow, Database, CalendarCheck } from "lucide-react";
import { SkillsetNav } from "@/components/skillset-nav";
import { ScrollReveal } from "@/components/scroll-reveal";
import { LandingSkilly } from "@/components/landing-skilly";
import { TRIAL_CTA_HREF } from "@/lib/cta";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

// "Book a demo" routes to the team inbox. hello@skillset.so is the same address
// the landing footer + support flow already use.
const DEMO_MAILTO =
  "mailto:hello@skillset.so" +
  "?subject=" +
  encodeURIComponent("Skillset Enterprise demo request") +
  "&body=" +
  encodeURIComponent(
    "Hi Skillset team,\n\n" +
      "We'd like to see how Skillset Enterprise could work for our company.\n\n" +
      "Company:\nTeam size:\nWhat we want to build (AI adoption / agentic workflows / RAG):\n\n" +
      "Thanks!",
  );

export const metadata: Metadata = {
  title: "Skillset for Enterprise: AI adoption, agentic workflows, and RAG.",
  description:
    "Bring AI into your company with Skillset Enterprise: model adoption, agentic workflows, and RAG grounded in your own context, built on and extending the Skillset App.",
};

const FEATURES: { icon: React.ReactNode; eyebrow: string; title: string; body: string }[] = [
  {
    icon: <Building2 strokeWidth={1.75} className="h-5 w-5" />,
    eyebrow: "AI adoption",
    title: "Bring AI into how your teams already work.",
    body: "We help your org incorporate AI without a rip-and-replace. Models, prompts, and skillsets shaped around your processes, rolled out to the people who'll actually use them.",
  },
  {
    icon: <Workflow strokeWidth={1.75} className="h-5 w-5" />,
    eyebrow: "Agentic workflows",
    title: "Multi-step agents wired into your stack.",
    body: "Research → draft → review → ship, running in parallel and owned by your company. Build the workflow once, save the recipe, reuse it across every team.",
  },
  {
    icon: <Database strokeWidth={1.75} className="h-5 w-5" />,
    eyebrow: "RAG & context",
    title: "Answers grounded in your own knowledge.",
    body: "Retrieval over your docs, data, and tooling. Context catered to your business, not the public internet. Private, permissioned, and continuously up to date.",
  },
];

export default function EnterprisePage() {
  // Ungated: open to signed-out, free, and paid visitors alike.
  return (
    <div
      className={`landing-root ${geist.variable} ${geistMono.variable} relative min-h-[100dvh] w-full bg-[#0a0a0c] text-zinc-100`}
      style={{ fontFamily: "var(--font-geist), system-ui, sans-serif" }}
    >
      {/* grain overlay */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[60] opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.55'/></svg>\")",
        }}
      />

      {/* radial halo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[640px]"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 10%, rgba(37,99,235,0.18), transparent 60%)",
        }}
      />

      <SkillsetNav />

      {/* Hero */}
      <section className="relative border-b border-white/5 py-16 md:py-24">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-10 px-5 md:px-6 lg:grid-cols-[1fr_auto] lg:gap-16">
          <div>
            <p
              className="mb-4 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              Enterprise
            </p>
            <h1 className="text-[36px] font-medium leading-[1.05] tracking-[-0.02em] text-zinc-50 md:text-[56px]">
              AI, agentic workflows, and RAG.
              <br />
              Built for your company.
            </h1>
            <p className="mt-6 max-w-[60ch] text-[16px] leading-[1.6] text-zinc-400 md:text-[17px]">
              Skillset now offers enterprise solutions for companies that want to bring AI into
              how they work. We deliver agentic workflows and RAG with context catered to your
              business, all built on and extending the Skillset App your teams already know.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href={DEMO_MAILTO}
                style={{ padding: "12px 26px" }}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#2563EB] text-[15px] font-medium text-white whitespace-nowrap shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_8px_24px_-12px_rgba(37,99,235,0.6)] transition-all duration-200 hover:bg-[#1d4ed8] active:translate-y-[1px]"
              >
                <CalendarCheck className="h-4 w-4" strokeWidth={2} />
                Book a demo
              </a>
              <Link
                href={TRIAL_CTA_HREF}
                style={{ padding: "12px 26px" }}
                className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.02] text-[15px] font-medium text-zinc-200 whitespace-nowrap transition-all duration-200 hover:border-white/25 hover:text-zinc-50 active:translate-y-[1px]"
              >
                Just get the consumer version
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
              </Link>
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end lg:pr-4">
            <LandingSkilly size={220} tooltipSide="left" />
          </div>
        </div>
      </section>

      {/* What enterprise gets */}
      <ScrollReveal>
        <section className="relative bg-[#0a0a0c] py-20 md:py-28">
          <div className="mx-auto max-w-[1200px] px-5 md:px-6">
            <p
              className="mb-4 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              01 · What we build with you
            </p>
            <h2 className="max-w-[20ch] text-[30px] font-medium leading-[1.08] tracking-[-0.02em] text-zinc-50 md:text-[44px]">
              Skillset, extended for your whole organization.
            </h2>

            <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
              {FEATURES.map((f) => (
                <div
                  key={f.eyebrow}
                  className="flex flex-col rounded-2xl border border-white/[0.06] bg-white/[0.015] p-7 transition-colors hover:border-white/[0.14]"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#2563EB]/30 bg-[#2563EB]/10 text-[#7BA7FF]">
                    {f.icon}
                  </span>
                  <p
                    className="mt-5 text-[11px] uppercase tracking-[0.18em] text-zinc-500"
                    style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                  >
                    {f.eyebrow}
                  </p>
                  <h3 className="mt-2 text-[18px] font-medium leading-[1.25] tracking-[-0.01em] text-zinc-50">
                    {f.title}
                  </h3>
                  <p className="mt-3 text-[14px] leading-[1.6] text-zinc-400">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Closing CTA band */}
      <ScrollReveal>
        <section className="relative border-t border-white/5 py-20 md:py-28">
          <div className="mx-auto max-w-[820px] px-5 text-center md:px-6">
            <h2 className="text-[28px] font-medium leading-[1.1] tracking-[-0.02em] text-zinc-50 md:text-[40px]">
              Ready to bring Skillset to your company?
            </h2>
            <p className="mx-auto mt-5 max-w-[52ch] text-[16px] leading-[1.6] text-zinc-400">
              Book a demo and we'll map AI adoption, agentic workflows, and RAG to your stack. Just
              need it for yourself? Grab the consumer version instead.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href={DEMO_MAILTO}
                style={{ padding: "12px 26px" }}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#2563EB] text-[15px] font-medium text-white whitespace-nowrap shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_8px_24px_-12px_rgba(37,99,235,0.6)] transition-all duration-200 hover:bg-[#1d4ed8] active:translate-y-[1px]"
              >
                <CalendarCheck className="h-4 w-4" strokeWidth={2} />
                Book a demo
              </a>
              <Link
                href={TRIAL_CTA_HREF}
                style={{ padding: "12px 26px" }}
                className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.02] text-[15px] font-medium text-zinc-200 whitespace-nowrap transition-all duration-200 hover:border-white/25 hover:text-zinc-50 active:translate-y-[1px]"
              >
                Get the consumer version
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
              </Link>
            </div>
          </div>
        </section>
      </ScrollReveal>
    </div>
  );
}
