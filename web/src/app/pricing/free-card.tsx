"use client";

import { SignedIn, SignedOut, SignUpButton, useUser } from "@/lib/auth-compat";
import { useQuery } from "convex/react";
import { Info } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";

const FEATURES: { t: string; hi: boolean; tip?: string }[] = [
  { t: "Skillset desktop app", hi: false },
  {
    t: "100 trial credits (one-time signup grant)",
    hi: true,
    tip: "Credits power Managed mode. Each AI call uses 1+ credits depending on the model + answer length.",
  },
  {
    t: "Managed mode cap: 30 credits / day",
    hi: false,
    tip: "Managed mode: Skillset covers the AI bills. You don't need an API key — just sign up and start. Daily cap resets at midnight UTC.",
  },
  { t: "1 cloud skillset (.skill) of 5 skills", hi: true },
  { t: "Skill Chat", hi: true },
  { t: "Skill Router", hi: true },
  { t: "3 Skill Enhances / day", hi: false },
  { t: "15 AI Headers / day", hi: false },
  { t: "3 Prompt Scores / day", hi: false },
  { t: "Fast + Balanced models only — No Opus or GPT-5 Pro in managed mode", hi: false },
  {
    t: "No Bring Your Own Key (managed mode only)",
    hi: false,
    tip: "BYOK = Bring Your Own Key. The Free plan uses Managed mode only (we cover the AI bills). Upgrade to Pro / Studio to plug in your own ChatGPT/Claude/Gemini API key.",
  },
];

export function FreeCard() {
  const { user } = useUser();
  const convexUser = useQuery(
    api.users.getByUserId,
    user?.id ? { userId: user.id } : "skip"
  );

  const isPaidPlan = convexUser?.plan === "pro" || convexUser?.plan === "studio";

  return (
    <div className="relative flex flex-col rounded-2xl border border-white/[0.06] bg-[#0f0f12] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-all duration-300 hover:border-white/[0.14]">
      <div>
        <h2 className="text-[20px] font-medium tracking-tight text-zinc-50">
          Free
        </h2>
        <p
          className="mt-1 text-[12px] uppercase tracking-[0.16em] text-zinc-500"
          style={{ fontFamily: "var(--font-geist-mono), monospace" }}
        >
          Forever free
        </p>
      </div>

      <div className="mt-6">
        <p className="flex items-baseline gap-1.5">
          <span className="text-[44px] font-medium leading-none tracking-tight text-zinc-50">
            $0
          </span>
          <span className="text-[14px] text-zinc-500">/ month</span>
        </p>
        <p
          className="mt-2 text-[12px] text-zinc-500"
          style={{ fontFamily: "var(--font-geist-mono), monospace" }}
        >
          no credit card required
        </p>
      </div>

      {/* spacer to align with Pro/Studio billing toggle */}
      <div className="mt-6 h-[40px]" />

      <ul className="mt-2 flex flex-1 flex-col gap-3 border-t border-white/[0.06] pt-6 text-[14px] leading-[1.5] text-zinc-300">
        {FEATURES.map((f) => (
          <li key={f.t} className="flex items-start gap-3">
            <span
              className={`mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
                f.hi ? "bg-[#2563EB]" : "bg-zinc-500"
              }`}
            />
            <span className={`flex items-start gap-1.5 ${f.hi ? "text-zinc-100" : "text-zinc-300"}`}>
              <span>{f.t}</span>
              {f.tip && (
                <span className="group/tip relative inline-flex shrink-0">
                  <Info
                    className="mt-0.5 h-3.5 w-3.5 cursor-help text-zinc-500 transition-colors hover:text-[#7BA7FF]"
                    strokeWidth={2}
                  />
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 hidden w-64 -translate-x-1/2 rounded-md border border-white/10 bg-[#0a0a0c] px-3 py-2 text-[12px] leading-[1.5] text-zinc-300 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.8)] group-hover/tip:block"
                  >
                    {f.tip}
                  </span>
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <SignedOut>
          <SignUpButton mode="modal">
            <button
              className="w-full rounded-full border border-white/10 bg-white/[0.02] py-2.5 text-[14px] text-zinc-200 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.05] active:translate-y-[1px]"
            >
              Get Started
            </button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <Link href="/">
            <button
              className="w-full rounded-full border border-white/10 bg-white/[0.02] py-2.5 text-[14px] text-zinc-200 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.05] active:translate-y-[1px]"
            >
              {isPaidPlan ? "Open Skillset" : "Current Plan"}
            </button>
          </Link>
        </SignedIn>
      </div>
    </div>
  );
}
