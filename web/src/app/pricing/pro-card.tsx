"use client";

import { useState } from "react";
import { SignedIn, SignedOut, SignUpButton, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { ArrowRight } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import { startStripeCheckout } from "@/lib/billing-client";

const EARLY_BIRD_LIMIT = 9;
const EARLY_BIRD_PRICE = 1.99;

const FEATURES = [
  { t: "750 AI credits / month", hi: true },
  { t: "40 saved prompts", hi: true },
  { t: "100 prompt enhances per day", hi: true },
  { t: "500 AI headers per day", hi: true },
  { t: "Desktop app", hi: false },
  { t: "MCP server (500 calls/day)", hi: false },
  { t: "ChatGPT, Claude & Gemini support", hi: false },
  { t: "Local storage + Cloud sync", hi: false },
  { t: "Perplexity, Grok, DeepSeek, Kimi support", hi: true },
  { t: "PromptControl (1 pack)", hi: true },
  { t: "Priority support", hi: true },
];

export function ProCard() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const { user } = useUser();
  const convexUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const proUserCount = useQuery(api.users.countProUsers) ?? 0;

  const isPro = convexUser?.plan === "pro";
  const isEarlyBird = proUserCount < EARLY_BIRD_LIMIT;
  const spotsLeft = Math.max(0, EARLY_BIRD_LIMIT - proUserCount);

  const monthlyPrice = 15;
  const annualMonthlyPrice = 12.5;
  const savePct = Math.ceil(((monthlyPrice * 12 - annualMonthlyPrice * 12) / (monthlyPrice * 12)) * 100);

  const displayPrice = isEarlyBird ? EARLY_BIRD_PRICE : isAnnual ? annualMonthlyPrice : monthlyPrice;
  const showStrike = isEarlyBird || isAnnual;

  const handleCheckout = async () => {
    if (isCheckoutLoading) return;
    setIsCheckoutLoading(true);
    try {
      await startStripeCheckout(isAnnual ? "annual" : "month");
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Checkout failed");
      setIsCheckoutLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col rounded-2xl border-2 border-[#2563EB]/60 bg-[#0f0f12] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_20px_40px_-20px_rgba(37,99,235,0.35)] transition-all duration-300">
      {/* recommended badge */}
      <span
        className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#2563EB] text-[10px] font-medium uppercase tracking-[0.16em] text-white whitespace-nowrap shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
        style={{ padding: "4px 12px", fontFamily: "var(--font-geist-mono), monospace" }}
      >
        {isPro ? "Current Plan" : isEarlyBird ? `Early Bird · ${spotsLeft} left` : "Recommended"}
      </span>

      <div>
        <h2
          className="text-[24px] font-semibold tracking-tight text-[#2563EB]"
          style={{ textShadow: "0 0 20px rgba(37,99,235,0.5), 0 0 40px rgba(37,99,235,0.3)" }}
        >
          Pro
        </h2>
        <p
          className="mt-1 text-[12px] uppercase tracking-[0.16em] text-zinc-500"
          style={{ fontFamily: "var(--font-geist-mono), monospace" }}
        >
          For active makers
        </p>
      </div>

      <div className="mt-6">
        {/* annual + early-bird strike row */}
        {isEarlyBird && isAnnual && (
          <div className="mb-1 flex items-baseline gap-2 text-[14px]">
            <span className="text-zinc-500 line-through">${monthlyPrice}</span>
            <span className="text-zinc-500 line-through">${annualMonthlyPrice}</span>
          </div>
        )}
        <p className="flex items-baseline gap-1.5">
          {!isEarlyBird && showStrike && (
            <span className="text-[18px] text-zinc-500 line-through">${monthlyPrice}</span>
          )}
          <span
            className={`text-[44px] font-medium leading-none tracking-tight ${
              isEarlyBird && !isPro ? "text-emerald-400" : "text-zinc-50"
            }`}
          >
            ${displayPrice}
          </span>
          <span className="text-[14px] text-zinc-500">/ month</span>
        </p>
        {isEarlyBird && !isPro ? (
          <p
            className="mt-2 text-[12px] text-zinc-500"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            *first 6 months, then ${isAnnual ? `${annualMonthlyPrice}/mo` : `${monthlyPrice}/mo`}
          </p>
        ) : (
          <p
            className="mt-2 text-[12px] text-zinc-500"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            cancel anytime
          </p>
        )}
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
          {isPro ? (
            <Link href="/dashboard">
              <button
                style={{ padding: "10px 22px" }}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2563EB] text-[14px] font-medium text-white whitespace-nowrap shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_8px_24px_-12px_rgba(37,99,235,0.6)] transition-all duration-200 hover:bg-[#1d4ed8] active:translate-y-[1px]"
              >
                Dashboard
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
              </button>
            </Link>
          ) : (
            <button
              onClick={handleCheckout}
              disabled={isCheckoutLoading}
              style={{ padding: "10px 22px" }}
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2563EB] text-[14px] font-medium text-white whitespace-nowrap shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_8px_24px_-12px_rgba(37,99,235,0.6)] transition-all duration-200 hover:bg-[#1d4ed8] active:translate-y-[1px] disabled:opacity-60"
            >
              {isCheckoutLoading ? "Starting…" : "Start 3-day free trial"}
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
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2563EB] text-[14px] font-medium text-white whitespace-nowrap shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_8px_24px_-12px_rgba(37,99,235,0.6)] transition-all duration-200 hover:bg-[#1d4ed8] active:translate-y-[1px]"
            >
              Start 3-day free trial
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
            </button>
          </SignUpButton>
        </SignedOut>
      </div>
    </div>
  );
}
