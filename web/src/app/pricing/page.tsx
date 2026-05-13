"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { Geist, Geist_Mono } from "next/font/google";
import { api } from "../../../convex/_generated/api";
import { FreeCard } from "./free-card";
import { ProCard, EARLY_BIRD_LIMIT, EARLY_BIRD_PRICE } from "./pro-card";
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

  const proUserCount = useQuery(api.users.countProUsers);
  const spotsLeft =
    proUserCount === undefined ? null : Math.max(0, EARLY_BIRD_LIMIT - proUserCount);

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
            Pricing
          </p>
          <h1 className="text-[40px] font-medium leading-[1.05] tracking-[-0.02em] text-zinc-50 md:text-[56px]">
            Choose a plan that fits.
          </h1>
          <p className="mx-auto mt-5 max-w-[52ch] text-[16px] leading-[1.6] text-zinc-400">
            Start free. Upgrade when your library outgrows it.
          </p>

          {spotsLeft !== null && spotsLeft > 0 && (
            <div
              className="mt-7 inline-flex items-center gap-2 rounded-full border border-orange-500/40 bg-orange-500/[0.08] text-[12px] text-orange-300"
              style={{ fontFamily: "var(--font-geist-mono), monospace", padding: "5px 12px" }}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-500 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-orange-500" />
              </span>
              <span>
                Only {spotsLeft} {spotsLeft === 1 ? "spot" : "spots"} left at{" "}
                <span className="text-orange-400 font-medium">${EARLY_BIRD_PRICE}/mo</span>
              </span>
            </div>
          )}
        </div>

        {/* Plan grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <FreeCard />
          <ProCard />
          <StudioCard />
        </div>
      </section>
    </div>
  );
}
