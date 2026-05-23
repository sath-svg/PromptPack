"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import {
  Wallet,
  ShoppingBag,
  Package,
  Crown,
  Mail,
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
      <main className="min-h-screen flex items-center justify-center bg-neutral-50 text-neutral-500">
        Loading…
      </main>
    );
  }
  if (!isSignedIn || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <p className="text-neutral-600 mb-4">Sign in to view your account.</p>
          <Link
            href="/sign-in?return=/account"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-700"
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
    <main className="min-h-screen bg-neutral-50 py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold text-neutral-900">Account</h1>
          <p className="text-neutral-600 mt-1 text-sm flex items-center gap-1.5">
            <Mail size={14} />
            {user.primaryEmailAddress.emailAddress}
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Plan */}
          <Card>
            <CardHeader icon={Crown} title="Plan" />
            <p className="text-2xl font-semibold text-neutral-900">
              {planLabel(plan, planVariant)}
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              {plan === "free"
                ? "Limited packs and prompts."
                : `${packCap} custom packs · ${promptCap} prompts total`}
            </p>
            <div className="flex gap-2 mt-4">
              {plan === "free" ? (
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-md bg-neutral-900 text-white hover:bg-neutral-700"
                >
                  Upgrade <ArrowRight size={12} />
                </Link>
              ) : (
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-md border border-neutral-200 text-neutral-700 hover:border-neutral-400"
                >
                  Manage <ExternalLink size={11} />
                </Link>
              )}
            </div>
          </Card>

          {/* Credits */}
          <Card>
            <CardHeader icon={Wallet} title="Credits" />
            <p className="text-2xl font-semibold text-neutral-900">
              {totalCredits.toLocaleString()}{" "}
              <span className="text-sm font-normal text-neutral-500">credits</span>
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              {monthlyCredits.toLocaleString()} monthly +{" "}
              {topupCredits.toLocaleString()} topup. 1 credit ≈ $0.02.
            </p>
            <div className="flex gap-2 mt-4">
              <Link
                href="/topup"
                className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Top up <ArrowRight size={12} />
              </Link>
            </div>
          </Card>

          {/* Pack limit */}
          <Card>
            <CardHeader icon={Package} title="Skillset limit" />
            <p className="text-2xl font-semibold text-neutral-900">
              {packCap === 0
                ? "—"
                : `${packCap} pack${packCap === 1 ? "" : "s"}`}
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              {plan === "free"
                ? "Free plan can't create custom packs. Upgrade to unlock."
                : `Up to ${promptCap} prompts across all packs.`}
            </p>
          </Card>

          {/* Marketplace */}
          <Card>
            <CardHeader icon={ShoppingBag} title="Marketplace" />
            <p className="text-2xl font-semibold text-neutral-900">
              {listingsCount}
              <span className="text-sm font-normal text-neutral-500">
                {" "}
                listing{listingsCount === 1 ? "" : "s"}
              </span>
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              {purchasesCount} purchase{purchasesCount === 1 ? "" : "s"} ·{" "}
              {totalEarnedCredits.toLocaleString()} credits earned (lifetime)
            </p>
            <p className="text-xs text-neutral-400 mt-2">
              Open the desktop app's Marketplace tab to list, browse, or import
              packs.
            </p>
          </Card>

          {userId ? <AutoTopupCard userId={userId} /> : null}
        </div>

        <footer className="mt-8 text-xs text-neutral-400">
          Need help? <Link href="/feedback" className="underline">Send feedback</Link>.
        </footer>
      </div>
    </main>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
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
    <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-[0.18em] text-neutral-500">
      <Icon size={13} />
      {title}
    </div>
  );
}
