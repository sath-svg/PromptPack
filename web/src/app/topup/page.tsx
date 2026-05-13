"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, CheckCircle2, XCircle } from "lucide-react";

// Mirror of TOPUP_PACKS in web/convex/credits.ts. Kept in sync manually —
// changing pricing requires updating both this file AND the Convex const.
type PackKey = "small" | "medium" | "large" | "xl";

interface Pack {
  key: PackKey;
  label: string;
  credits: number;
  priceCents: number;
  highlight?: string;
}

const PACKS: Pack[] = [
  { key: "small", label: "Small", credits: 200, priceCents: 500 },
  { key: "medium", label: "Medium", credits: 500, priceCents: 1000 },
  { key: "large", label: "Large", credits: 1500, priceCents: 3000, highlight: "Most popular" },
  { key: "xl", label: "XL", credits: 5000, priceCents: 10000, highlight: "Best value" },
];

function dollars(cents: number): string {
  return (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2);
}

function creditsPerDollar(pack: Pack): string {
  return ((pack.credits / pack.priceCents) * 100).toFixed(0);
}

export default function TopupPage() {
  const [loadingKey, setLoadingKey] = useState<PackKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"success" | "cancel" | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const s = new URLSearchParams(window.location.search).get("status");
    if (s === "success" || s === "cancel") setStatus(s);
  }, []);

  const buy = async (key: PackKey) => {
    if (loadingKey) return;
    setError(null);
    setLoadingKey(key);
    try {
      const res = await fetch("/api/stripe/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pack: key }),
      });
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = `/sign-in?return=${encodeURIComponent("/topup")}`;
          return;
        }
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `Checkout failed (${res.status})`);
      }
      const { url } = (await res.json()) as { url?: string };
      if (!url) throw new Error("Checkout URL missing");
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setLoadingKey(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100">
      <main className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[13px] text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            ← Skillset
          </Link>
          <h1 className="mt-6 text-[34px] font-semibold tracking-tight">Top up credits</h1>
          <p className="mt-3 max-w-xl text-[15px] leading-[1.6] text-zinc-400">
            One-time credit packs. Credits never expire. Pair with a subscription or use standalone — your call.
          </p>
        </div>

        {status === "success" && (
          <div className="mb-8 flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-[14px] text-emerald-300">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
            <div>
              <p className="font-medium">Payment received — credits applied.</p>
              <p className="mt-1 text-emerald-300/80">Open the desktop app to see your updated balance.</p>
            </div>
          </div>
        )}

        {status === "cancel" && (
          <div className="mb-8 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[14px] text-amber-200">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
            <p>Checkout canceled. No charge made.</p>
          </div>
        )}

        {error && (
          <div className="mb-8 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[14px] text-red-300">
            {error}
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PACKS.map((pack) => {
            const isLoading = loadingKey === pack.key;
            return (
              <div
                key={pack.key}
                className="relative flex flex-col rounded-2xl border border-white/[0.06] bg-[#0f0f12] p-6 transition-all duration-200 hover:border-white/[0.14]"
              >
                {pack.highlight && (
                  <span
                    className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#2563EB] text-[10px] font-medium uppercase tracking-[0.16em] text-white whitespace-nowrap"
                    style={{ padding: "4px 12px", fontFamily: "var(--font-geist-mono), monospace" }}
                  >
                    {pack.highlight}
                  </span>
                )}

                <div>
                  <h3 className="text-[18px] font-medium tracking-tight text-zinc-50">{pack.label}</h3>
                  <p
                    className="mt-1 text-[11px] uppercase tracking-[0.16em] text-zinc-500"
                    style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                  >
                    one-time
                  </p>
                </div>

                <div className="mt-6">
                  <p className="flex items-baseline gap-1.5">
                    <span className="text-[36px] font-medium leading-none tracking-tight text-zinc-50">
                      ${dollars(pack.priceCents)}
                    </span>
                  </p>
                  <p
                    className="mt-2 text-[12px] text-zinc-500"
                    style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                  >
                    {pack.credits.toLocaleString()} credits
                  </p>
                </div>

                <ul className="mt-6 flex flex-1 flex-col gap-2 text-[13px] text-zinc-300">
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" strokeWidth={2.5} />
                    <span>{creditsPerDollar(pack)} credits per $1</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" strokeWidth={2.5} />
                    <span>Credits never expire</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" strokeWidth={2.5} />
                    <span>Works with any plan</span>
                  </li>
                </ul>

                <button
                  onClick={() => buy(pack.key)}
                  disabled={isLoading || loadingKey !== null}
                  className="group mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2563EB] py-2.5 text-[13px] font-medium text-white whitespace-nowrap transition-all duration-200 hover:bg-[#1d4ed8] active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Starting…" : "Buy"}
                  {!isLoading && (
                    <ArrowRight
                      className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                      strokeWidth={2}
                    />
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-12 rounded-2xl border border-white/[0.06] bg-[#0f0f12] p-6">
          <h2 className="text-[15px] font-medium text-zinc-100">How credits work</h2>
          <ul className="mt-3 grid gap-2 text-[13px] leading-[1.6] text-zinc-400 sm:grid-cols-2">
            <li>• Chat turns burn 1–18 credits depending on model + length.</li>
            <li>• Premium Models (Opus / GPT-5 Pro / o3 Pro) require Pro or Studio.</li>
            <li>• Credits added immediately after checkout via Stripe webhook.</li>
            <li>• Monthly subscription credits used first; top-up credits second.</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
