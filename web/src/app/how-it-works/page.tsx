import { Geist, Geist_Mono } from "next/font/google";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SkillsetNav } from "@/components/skillset-nav";
import { ScrollReveal } from "@/components/scroll-reveal";
import { LandingSkilly } from "@/components/landing-skilly";
import {
  CoreFeatures,
  HowItWorks,
  Personas,
  PowerFeatures,
} from "@/components/landing-sections";
import { auth } from "@/lib/auth-server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const metadata: Metadata = {
  title: "How Skillset works — features, flow, and skillsets.",
  description:
    "Walkthrough of the Skillset companion: bento features, how to build a skillset, role-based starter packs, and pro-grade tuning.",
};

export default async function HowItWorksPage() {
  // Paid-only marketing/info page. Free + signed-out visitors are funneled to
  // the trial instead of browsing it.
  const { userId } = await auth();
  let paid = false;
  if (userId) {
    try {
      const u = await convex.query(api.users.getByUserId, { userId });
      paid = !!u && (u.plan === "pro" || u.plan === "studio");
    } catch {
      /* treat as unpaid */
    }
  }
  if (!paid) redirect("/start-trial");

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

      <section className="relative border-b border-white/5 bg-[#0a0a0c] py-16 md:py-24">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-10 px-5 md:px-6 lg:grid-cols-[1fr_auto] lg:gap-16">
          <div>
            <p
              className="mb-4 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              How it works
            </p>
            <h1 className="text-[36px] font-medium leading-[1.05] tracking-[-0.02em] text-zinc-50 md:text-[56px]">
              Everything in one app.
              <br />
              Built for how you actually use AI.
            </h1>
            <p className="mt-6 max-w-[60ch] text-[16px] leading-[1.6] text-zinc-400 md:text-[17px]">
              The Skillset companion — features, building flow, role-based starter packs, and pro-grade tuning. All on one page.
            </p>
          </div>
          <div className="relative flex justify-center lg:justify-end lg:pr-4">
            <LandingSkilly size={220} tooltipSide="left" />
          </div>
        </div>
      </section>

      <ScrollReveal>
        <CoreFeatures />
      </ScrollReveal>
      <ScrollReveal>
        <HowItWorks />
      </ScrollReveal>
      <ScrollReveal>
        <Personas />
      </ScrollReveal>
      <ScrollReveal>
        <PowerFeatures />
      </ScrollReveal>
    </div>
  );
}
