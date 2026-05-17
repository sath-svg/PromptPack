import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Boxes } from "lucide-react";
import { SkillsetShell } from "@/components/skillset-shell";
import { MacOSDownload } from "@/components/macos-download";
import { WindowsDownload } from "@/components/windows-download";
import { SignedOut } from "@/lib/auth-compat";

const APP_VERSION = "1.2.0";

export const metadata: Metadata = {
  title: "Download Skillset — Mac & Windows desktop apps",
  description:
    "Download the Skillset desktop app for macOS and Windows. Native, offline-first, free forever plan.",
};

export default function DownloadsPage() {
  return (
    <SkillsetShell showHalo haloPosition="50% 0%">
      <DownloadsHero />
      <DesktopSection />
      <SignedOut>
        <DownloadsFooterCta />
      </SignedOut>
    </SkillsetShell>
  );
}

function DownloadsHero() {
  return (
    <section className="relative pt-20 pb-14 md:pt-24 md:pb-16">
      <div className="mx-auto max-w-[1400px] px-6 text-center">
        <div
          className="mx-auto mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] text-[12px] text-zinc-400"
          style={{ fontFamily: "var(--font-geist-mono), monospace", padding: "4px 10px" }}
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2563EB] opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#2563EB]" />
          </span>
          <span>v{APP_VERSION} &middot; released today</span>
        </div>

        <h1 className="mx-auto max-w-[24ch] text-[42px] font-medium leading-[1.04] tracking-[-0.025em] text-zinc-50 md:text-[60px] lg:text-[68px]">
          Get{" "}
          <span className="relative inline-block">
            <span className="relative z-10">Skillset</span>
            <span
              aria-hidden
              className="absolute bottom-[0.1em] left-0 right-0 -z-0 h-[0.18em] bg-[#2563EB]/40"
            />
          </span>{" "}
          for your desktop.
        </h1>

        <p className="mx-auto mt-7 max-w-[62ch] text-[16px] leading-[1.55] text-zinc-400">
          Native desktop apps for macOS and Windows. Offline-first, with menu bar and system tray
          integration. One library &mdash; synced across both.
        </p>

        <p
          className="mt-5 text-[12px] text-zinc-500"
          style={{ fontFamily: "var(--font-geist-mono), monospace" }}
        >
          free forever plan &middot; no credit card &middot; offline-first
        </p>
      </div>
    </section>
  );
}

function DesktopSection() {
  return (
    <section className="relative bg-[#0a0a0c] py-12 md:py-16">
      <div className="mx-auto max-w-[1400px] px-6">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p
              className="mb-3 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              01 &mdash; Desktop apps
            </p>
            <h2 className="text-[28px] font-medium leading-[1.1] tracking-[-0.015em] text-zinc-50 md:text-[36px]">
              Native, fast, offline-first.
            </h2>
          </div>
          <p
            className="hidden max-w-[40ch] text-[13.5px] text-zinc-500 md:block"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            v{APP_VERSION} &middot; updated 2026-05-17
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <MacOSDownload version={APP_VERSION} />
          <WindowsDownload version={APP_VERSION} />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-[1fr_1fr]">
          <ComingSoonCard
            name="Linux"
            note="AppImage and .deb packages for Ubuntu, Debian, Fedora."
          />
          <ComingSoonCard
            name="iOS &amp; Android"
            note="Mobile companion app for capture and sync."
          />
        </div>
      </div>
    </section>
  );
}

function ComingSoonCard({ name, note }: { name: string; note: string }) {
  return (
    <div className="relative flex items-center gap-5 overflow-hidden rounded-2xl border border-white/[0.04] bg-[#0c0c10] p-6 md:p-7">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-white/10 bg-white/[0.02] text-zinc-500">
        <Boxes className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-medium text-zinc-200" dangerouslySetInnerHTML={{ __html: name }} />
          <span
            className="rounded-full border border-white/10 px-2 py-0.5 text-[9.5px] uppercase tracking-[0.16em] text-zinc-500"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            coming soon
          </span>
        </div>
        <p className="mt-1 text-[12.5px] text-zinc-500">{note}</p>
      </div>
    </div>
  );
}

function DownloadsFooterCta() {
  return (
    <section className="relative border-t border-white/5 bg-[#0c0c10] py-16 md:py-20">
      <div className="mx-auto max-w-[1400px] px-6 text-center">
        <h2 className="text-[26px] font-medium leading-[1.1] tracking-[-0.015em] text-zinc-50 md:text-[32px]">
          Already installed? Sign in to start saving.
        </h2>
        <p className="mx-auto mt-3 max-w-[52ch] text-[14px] text-zinc-400">
          Your account syncs every skill, every preset, every workflow across the apps.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/sign-up"
            style={{ padding: "10px 22px" }}
            className="group inline-flex items-center gap-2 rounded-full bg-[#2563EB] text-sm font-medium text-white whitespace-nowrap shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition-all duration-200 hover:bg-[#1d4ed8] active:translate-y-[1px]"
          >
            Create free account
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
          </Link>
          <Link
            href="/sign-in"
            style={{ padding: "10px 22px" }}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.02] text-sm text-zinc-200 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.05] active:translate-y-[1px]"
          >
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}
