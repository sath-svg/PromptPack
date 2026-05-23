"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import {
  Wallet,
  ShoppingBag,
  Package,
  Crown,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { useUser, useAuth } from "@/lib/auth-compat";
import { AutoTopupCard } from "./AutoTopupCard";

// Mirrors getCustomPackLimit() in the desktop app constants.
const PACK_LIMITS: Record<"free" | "pro" | "studio", number> = {
  free: 1,
  pro: 7,
  studio: 17,
};
const PROMPT_LIMITS: Record<"free" | "pro" | "studio", number> = {
  free: 5,
  pro: 56,
  studio: 200,
};

function planLabel(plan: string | undefined, variant?: string | null): string {
  if (!plan) return "Free";
  if (plan === "pro" && variant === "legacy_pro") return "Pro (Legacy)";
  return plan[0].toUpperCase() + plan.slice(1);
}

export default function AccountPage() {
  const { user, isLoaded } = useUser();
  const { isSignedIn, userId } = useAuth();
  const dbUser = useQuery(
    api.users.getByUserId,
    userId ? { userId } : "skip",
  );
  const myListings = useQuery(
    api.marketplace.listBySeller,
    userId ? { userId } : "skip",
  );
  const purchases = useQuery(
    api.marketplace.listMyPurchases,
    userId ? { userId } : "skip",
  );

  if (!isLoaded) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-zinc-500">
        Loading…
      </main>
    );
  }
  if (!isSignedIn || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">Sign in to view your account.</p>
          <Link
            href="/sign-in?return=/account"
            className="inline-flex items-center gap-2 rounded-full bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]"
          >
            Sign in <ArrowRight size={14} />
          </Link>
        </div>
      </main>
    );
  }

  const plan = (dbUser?.plan ?? "free") as "free" | "pro" | "studio";
  const planVariant = dbUser?.planVariant ?? null;
  const monthlyCredits = dbUser?.monthlyCredits ?? 0;
  const topupCredits = dbUser?.topupCredits ?? 0;
  const totalCredits = monthlyCredits + topupCredits;
  const packCap = PACK_LIMITS[plan];
  const promptCap = PROMPT_LIMITS[plan];
  const listingsCount = myListings?.length ?? 0;
  const purchasesCount = purchases?.length ?? 0;
  const totalEarnedCredits = (myListings ?? []).reduce(
    (sum, l) =>
      sum + Math.floor((l.price * 7000) / 10000) * (l.downloads ?? 0),
    0,
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100">
      <main className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[13px] text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            ← Skillset
          </Link>
          <h1 className="mt-6 text-[34px] font-semibold tracking-tight">
            Account
          </h1>
          <p
            className="mt-3 text-[13px] uppercase tracking-[0.18em] text-zinc-500"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            {user.primaryEmailAddress.emailAddress}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Plan */}
          <Card>
            <CardHeader icon={Crown} title="Plan" />
            <p className="text-[28px] font-medium tracking-tight text-zinc-50">
              {planLabel(plan, planVariant)}
            </p>
            <p className="mt-1 text-[13px] text-zinc-500">
              {plan === "free"
                ? "Limited packs and prompts."
                : `${packCap} custom packs · ${promptCap} prompts total`}
            </p>
            <div className="mt-5 flex gap-2">
              {plan === "free" ? (
                <Link
                  href="/pricing"
                  className="group inline-flex items-center gap-1.5 rounded-full bg-[#2563EB] px-4 py-1.5 text-[13px] font-medium text-white hover:bg-[#1d4ed8] transition-all"
                >
                  Upgrade
                  <ArrowRight
                    size={12}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              ) : (
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.02] px-4 py-1.5 text-[13px] text-zinc-200 hover:border-white/20 hover:bg-white/[0.05] transition-all"
                >
                  Manage <ExternalLink size={11} />
                </Link>
              )}
            </div>
          </Card>

          {/* Credits */}
          <Card>
            <CardHeader icon={Wallet} title="Credits" />
            <p className="text-[28px] font-medium tracking-tight text-zinc-50">
              {totalCredits.toLocaleString()}{" "}
              <span
                className="text-[13px] font-normal text-zinc-500"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              >
                credits
              </span>
            </p>
            <p className="mt-1 text-[13px] text-zinc-500">
              {monthlyCredits.toLocaleString()} monthly +{" "}
              {topupCredits.toLocaleString()} topup. 1 credit ≈ $0.02.
            </p>
            <div className="mt-5 flex gap-2">
              <Link
                href="/topup"
                className="group inline-flex items-center gap-1.5 rounded-full bg-[#2563EB] px-4 py-1.5 text-[13px] font-medium text-white hover:bg-[#1d4ed8] transition-all"
              >
                Top up
                <ArrowRight
                  size={12}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          </Card>

          {/* Pack limit */}
          <Card>
            <CardHeader icon={Package} title="Skillset limit" />
            <p className="text-[28px] font-medium tracking-tight text-zinc-50">
              {packCap === 0
                ? "—"
                : `${packCap} pack${packCap === 1 ? "" : "s"}`}
            </p>
            <p className="mt-1 text-[13px] text-zinc-500">
              {plan === "free"
                ? "Free plan can't create custom packs. Upgrade to unlock."
                : `Up to ${promptCap} prompts across all packs.`}
            </p>
          </Card>

          {/* Marketplace */}
          <Card>
            <CardHeader icon={ShoppingBag} title="Marketplace" />
            <p className="text-[28px] font-medium tracking-tight text-zinc-50">
              {listingsCount}
              <span
                className="text-[13px] font-normal text-zinc-500"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              >
                {" "}
                listing{listingsCount === 1 ? "" : "s"}
              </span>
            </p>
            <p className="mt-1 text-[13px] text-zinc-500">
              {purchasesCount} purchase{purchasesCount === 1 ? "" : "s"} ·{" "}
              {totalEarnedCredits.toLocaleString()} credits earned (lifetime)
            </p>
            <p className="mt-3 text-[12px] text-zinc-600">
              Open the desktop app's Marketplace tab to list, browse, or import
              packs.
            </p>
          </Card>

          {userId ? <AutoTopupCard userId={userId} /> : null}
        </div>

        <footer className="mt-10 text-[12px] text-zinc-600">
          Need help?{" "}
          <Link href="/feedback" className="underline hover:text-zinc-400">
            Send feedback
          </Link>
          .
        </footer>
      </main>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0f0f12] p-6 transition-all duration-200 hover:border-white/[0.14]">
      {children}
    </div>
  );
}

function CardHeader({
  icon: Icon,
  title,
}: {
  icon: typeof Wallet;
  title: string;
}) {
  return (
    <div
      className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-zinc-500"
      style={{ fontFamily: "var(--font-geist-mono), monospace" }}
    >
      <Icon size={13} />
      {title}
    </div>
  );
}
