"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Geist, Geist_Mono } from "next/font/google";
import { FreeCard } from "./free-card";
import { ProCard } from "./pro-card";
import { StudioCard } from "./studio-card";
import { SkillsetNav } from "@/components/skillset-nav";
import { trackEvent, trackLinkedInConversion } from "@/lib/analytics";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

function CheckoutCancelTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("checkout") === "cancel") {
      trackEvent("checkout-cancelled");
      trackLinkedInConversion(24381844);
    }
  }, [searchParams]);

  return null;
}

export default function PricingPage() {
  useEffect(() => {
    trackEvent("upgrade-page-viewed");
  }, []);

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

      <Suspense>
        <CheckoutCancelTracker />
      </Suspense>

      <SkillsetNav />

      <section className="relative mx-auto max-w-[1200px] px-6 py-20 md:py-28">
        {/* Header */}
        <div className="mb-14 text-center">
          <p
            className="mb-4 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            01 · Pricing
          </p>
          <h1 className="text-[40px] font-medium leading-[1.05] tracking-[-0.02em] text-zinc-50 md:text-[56px]">
            Choose a plan that fits.
          </h1>
          <p className="mx-auto mt-5 max-w-[52ch] text-[16px] leading-[1.6] text-zinc-400">
            Start free. Upgrade when your library outgrows it.
          </p>
        </div>

        {/* Plan grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <FreeCard />
          <ProCard />
          <StudioCard />
        </div>

        {/* Glossary FAQ */}
        <Glossary />
      </section>
    </div>
  );
}

function Glossary() {
  const items = [
    {
      q: "What's BYOK?",
      a: "Short for \"Bring Your Own Key\". You add your own ChatGPT, Claude, or Gemini API key into Skillset. The AI lab bills you directly — Skillset doesn't take a cut. Best for power users who want full control of model costs.",
    },
    {
      q: "What's managed mode?",
      a: "Skillset covers the AI bills. You pay a flat monthly fee, get a credit pool, and we handle the model costs. Best if you don't want to set up API keys or watch usage.",
    },
    {
      q: "What are credits?",
      a: "Each AI call uses 1+ credits. Quick replies = cheap. Big multi-step jobs = more. Credits roll over month-to-month up to your plan cap.",
    },
    {
      q: "Which mode should I pick?",
      a: "Default to managed mode — it's the easiest. Switch to BYOK when you have your own API key and want to skip the credit pool entirely.",
    },
  ];

  return (
    <section className="mt-20 md:mt-28">
      <div className="mx-auto max-w-[900px]">
        <p
          className="mb-3 text-center text-[11px] uppercase tracking-[0.22em] text-zinc-500"
          style={{ fontFamily: "var(--font-geist-mono), monospace" }}
        >
          02 · Quick glossary
        </p>
        <h2 className="text-center text-[24px] font-medium leading-[1.15] tracking-[-0.015em] text-zinc-50 md:text-[32px]">
          New here? Some terms unpacked.
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
          {items.map((item) => (
            <div
              key={item.q}
              className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-5 transition-colors hover:border-white/[0.12]"
            >
              <h3 className="text-[15px] font-medium text-zinc-100">{item.q}</h3>
              <p className="mt-2 text-[14px] leading-[1.55] text-zinc-400">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
