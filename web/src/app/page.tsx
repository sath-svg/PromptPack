import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import type { Metadata } from "next";
import { EmailGateForm } from "@/components/email-gate-form";
import { LandingSkilly } from "@/components/landing-skilly";
import { TRIAL_CTA_HREF } from "@/lib/cta";
import { auth } from "@/lib/auth-server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const metadata: Metadata = {
  title: "Skillset · Replace Claude & Codex, save up to 80% on tokens.",
  description:
    "Use Skillset instead of separate Claude, Codex, and ChatGPT plans. Auto-route every task to the cheapest capable model and cut your token spend up to 80%. Start a 3-day free trial.",
};

const BULLETS = [
  "Every model in one place: ChatGPT, Claude, Codex, Gemini",
  "All your skills in one place, reusable across every tool",
  "Auto-routes each task to the cheapest capable model and saves tokens",
  "One membership instead of five separate subscriptions",
];

export default async function HomeGate() {
  // No signed-in user sees the gate. Paid -> the full info page; everyone else
  // (free / no subscription) -> straight to the trial checkout. Only signed-out
  // visitors get the email gate below.
  const { userId } = await auth();
  if (userId) {
    let paid = false;
    try {
      const u = await convex.query(api.users.getByUserId, { userId });
      paid = !!u && (u.plan === "pro" || u.plan === "studio");
    } catch {
      /* ignore — fall through to the gate */
    }
    redirect(paid ? "/overview" : "/start-trial");
  }

  return (
    <div
      className={`landing-root ${geist.variable} ${geistMono.variable} relative flex min-h-[100dvh] w-full flex-col bg-[#0a0a0c] text-zinc-100`}
      style={{ fontFamily: "var(--font-geist), system-ui, sans-serif" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[640px]"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 70% 15%, rgba(37,99,235,0.18), transparent 60%)",
        }}
      />

      {/* Minimal header — logo + single trial CTA */}
      <header className="relative z-10 mx-auto flex w-full max-w-[1100px] items-center justify-between px-5 py-5 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <img
            src="/img/skillset_logo.png"
            alt="Skillset"
            width={28}
            height={28}
            className="h-7 w-7 rounded-md object-cover"
          />
          <span className="text-[15px] font-medium tracking-tight text-zinc-50">Skillset</span>
        </Link>
        <Link
          href={TRIAL_CTA_HREF}
          style={{ padding: "8px 18px" }}
          className="group inline-flex items-center gap-2 rounded-full bg-[#2563EB] text-sm font-medium text-white whitespace-nowrap shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition-all duration-200 hover:bg-[#1d4ed8] active:translate-y-[1px]"
        >
          Start 3-day trial
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
        </Link>
      </header>

      {/* Hero gate */}
      <main className="relative z-10 flex flex-1 items-center">
        <div className="mx-auto grid w-full max-w-[1100px] grid-cols-1 items-center gap-12 px-5 py-12 md:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div className="flex flex-col">
            <span
              className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 text-[12px] text-zinc-400"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#2563EB]" />
              Your new AI companion - version 1.3.2
            </span>

            <h1 className="text-[34px] font-medium leading-[1.05] tracking-[-0.025em] text-zinc-50 sm:text-[42px] md:text-[52px]">
              All the AI tools you need.
              One bill.
            </h1>

            <p className="mt-6 max-w-[52ch] text-[16px] leading-[1.6] text-zinc-400 md:text-[17px]">
              Stop paying for Claude, Codex, and a stack of separate model subscriptions. Save
              tokens and boost your productivity.
            </p>

            <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {BULLETS.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-[14px] leading-[1.45] text-zinc-300">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#7BA7FF]" strokeWidth={2.5} />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Email capture card — Skilly peeks out from behind it */}
          <div className="relative">
            <LandingSkilly
              className="absolute -top-[78px] right-8 hidden -z-10 opacity-90 lg:block"
              size={150}
              tooltipSide="left"
            />
            <div className="relative z-10 flex flex-col rounded-3xl border border-white/[0.08] bg-[#0f0f12] p-7 md:p-9">
            <h2 className="text-[20px] font-medium tracking-tight text-zinc-50">
              See how it works
            </h2>
            <p className="mt-2 text-[14px] leading-[1.55] text-zinc-400">
              Enter your email to start a 3-day free trial and unlock the full tour, your library, and
              every model inside Skillset.
            </p>
            <div className="mt-6">
              <EmailGateForm />
            </div>

            <p className="mt-6 border-t border-white/[0.06] pt-5 text-[13px] leading-[1.55] text-zinc-500">
              Already a member?{" "}
              <Link href="/sign-in" className="text-zinc-200 underline-offset-4 hover:underline">
                Sign in
              </Link>
            </p>
            </div>
          </div>
        </div>
      </main>

      {/* Slim footer — keeps key pages crawlable for SEO */}
      <footer className="relative z-10 border-t border-white/5">
        <div className="mx-auto flex w-full max-w-[1100px] flex-wrap items-center justify-between gap-3 px-5 py-6 text-[13px] text-zinc-500 md:px-6">
          <span style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
            © {new Date().getFullYear()} Skillset · skillset.so
          </span>
          <nav className="flex flex-wrap items-center gap-5">
            <Link href="/prompts" className="transition-colors hover:text-zinc-200">
              Prompts
            </Link>
            <Link href="/skillsets" className="transition-colors hover:text-zinc-200">
              Skillsets
            </Link>
            <Link href="/pricing" className="transition-colors hover:text-zinc-200">
              Pricing
            </Link>
            <Link href="/enterprise" className="transition-colors hover:text-zinc-200">
              Enterprise
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
