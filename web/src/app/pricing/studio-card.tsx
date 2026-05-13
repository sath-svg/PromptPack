"use client";

import { useState } from "react";
import { SignedIn, SignedOut, SignUpButton, useUser } from "@/lib/auth-compat";
import { useQuery } from "convex/react";
import { ArrowRight } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import { startStripeCheckout } from "@/lib/billing-client";

const FEATURES = [
  { t: "2,750 AI credits / month — managed mode", hi: true },
  { t: "Rolls over up to 5,500 credits", hi: false },
  { t: "Everything in Pro", hi: true },
  { t: "200 saved prompts · 17 cloud skillsets (.skill)", hi: true },
  { t: "Skill Control — versioning (all packs)", hi: true },
  { t: "Skill Eval — unlimited regression testing across models", hi: true },
  { t: "500 Skill Enhances / day", hi: false },
  { t: "500 Skill Eval runs / day", hi: false },
  { t: "2,000 AI Headers / day", hi: false },
  { t: "500 Prompt Scores / day", hi: false },
  { t: "BYOK - Bring your Own Key", hi: true },
  { t: "Priority support + first-class access to new features", hi: false },
];

export function StudioCard() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const { user } = useUser();
  const convexUser = useQuery(
    api.users.getByUserId,
    user?.id ? { userId: user.id } : "skip"
  );

  const isStudio = convexUser?.plan === "studio";
  const isPro = convexUser?.plan === "pro";

  const monthlyPrice = 49;
  const annualPrice = 399;
  const annualMonthlyPrice = (annualPrice / 12).toFixed(2);
  const savePct = Math.ceil(((monthlyPrice * 12 - annualPrice) / (monthlyPrice * 12)) * 100);

  const displayPrice = isAnnual ? annualMonthlyPrice : monthlyPrice;

  const handleCheckout = async () => {
    if (isCheckoutLoading) return;
    setIsCheckoutLoading(true);
    try {
      await startStripeCheckout(isAnnual ? "annual" : "month", "studio");
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Checkout failed");
      setIsCheckoutLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col rounded-2xl border border-white/[0.06] bg-[#0f0f12] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-all duration-300 hover:border-white/[0.14]">
      <span
        className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-pink-500 text-[10px] font-medium uppercase tracking-[0.16em] text-white whitespace-nowrap shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_0_20px_rgba(244,114,182,0.5)]"
        style={{ padding: "4px 12px", fontFamily: "var(--font-geist-mono), monospace" }}
      >
        {isStudio ? "Current Plan" : "Power User"}
      </span>

      <div>
        <h2
          className="text-[24px] font-semibold tracking-tight text-pink-400"
          style={{ textShadow: "0 0 20px rgba(244,114,182,0.5), 0 0 40px rgba(244,114,182,0.3)" }}
        >
          Studio
        </h2>
        <p
          className="mt-1 text-[12px] uppercase tracking-[0.16em] text-zinc-500"
          style={{ fontFamily: "var(--font-geist-mono), monospace" }}
        >
          For prompt engineers
        </p>
      </div>

      <div className="mt-6">
        <p className="flex items-baseline gap-1.5">
          {isAnnual && (
            <span className="text-[18px] text-zinc-500 line-through">${monthlyPrice}</span>
          )}
          <span
            className={`text-[44px] font-medium leading-none tracking-tight ${
              isAnnual ? "text-emerald-400" : "text-zinc-50"
            }`}
          >
            ${displayPrice}
          </span>
          <span className="text-[14px] text-zinc-500">/ month</span>
        </p>
        <p
          className="mt-2 text-[12px] text-zinc-500"
          style={{ fontFamily: "var(--font-geist-mono), monospace" }}
        >
          {isAnnual ? `billed $${annualPrice}/year` : "billed monthly"}
        </p>
      </div>

      {/* Billing toggle */}
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={() => setIsAnnual(!isAnnual)}
          className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
          style={{ background: isAnnual ? "#2563EB" : "rgba(255,255,255,0.12)" }}
          aria-label="Toggle annual billing"
        >
          <span
            className="absolute top-[2px] h-5 w-5 rounded-full bg-white transition-all"
            style={{ left: isAnnual ? "22px" : "2px" }}
          />
        </button>
        <span
          className="text-[12px] text-zinc-400"
          style={{ fontFamily: "var(--font-geist-mono), monospace" }}
        >
          {isAnnual ? `annual · save ${savePct}%` : "monthly"}
        </span>
      </div>

      <ul className="mt-7 flex flex-1 flex-col gap-3 border-t border-white/[0.06] pt-6 text-[14px] leading-[1.5] text-zinc-300">
        {FEATURES.map((f) => (
          <li key={f.t} className="flex items-start gap-3">
            <span
              className={`mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
                f.hi ? "bg-[#2563EB]" : "bg-zinc-500"
              }`}
            />
            <span className={f.hi ? "text-zinc-100" : "text-zinc-300"}>{f.t}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <SignedIn>
          {isStudio ? (
            <Link href="/">
              <button
                style={{ padding: "10px 22px" }}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.02] text-[14px] text-zinc-200 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.05] active:translate-y-[1px]"
              >
                Open Skillset
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
              </button>
            </Link>
          ) : (
            <button
              onClick={handleCheckout}
              disabled={isCheckoutLoading}
              style={{ padding: "10px 22px" }}
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.02] text-[14px] text-zinc-200 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.05] active:translate-y-[1px] disabled:opacity-60"
            >
              {isCheckoutLoading ? "Starting…" : isPro ? "Upgrade to Studio" : "Get Studio"}
              {!isCheckoutLoading && (
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
              )}
            </button>
          )}
        </SignedIn>
        <SignedOut>
          <SignUpButton mode="modal">
            <button
              style={{ padding: "10px 22px" }}
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.02] text-[14px] text-zinc-200 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.05] active:translate-y-[1px]"
            >
              Get Studio
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
            </button>
          </SignUpButton>
        </SignedOut>
      </div>
    </div>
  );
}
