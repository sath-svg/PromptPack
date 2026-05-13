import type { Metadata } from "next";
import { SkillsetShell } from "@/components/skillset-shell";
import { Panel } from "@/components/brand-kit/panel";
import { ColorSwatch } from "@/components/brand-kit/color-swatch";
import { LogoConstruction } from "@/components/brand-kit/logo-construction";

export const metadata: Metadata = {
  title: "Skillset — Brand Kit",
  description:
    "Visual identity system for Skillset. Logo, color, typography, and application standards.",
};

export default function BrandKitPage() {
  return (
    <SkillsetShell showHalo haloPosition="50% 0%">
      <main className="relative mx-auto max-w-[1400px] px-6 pb-32 pt-16 md:pt-24">
        <BrandHeader />
        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          <LogoCover />
          <Panel label="Construction" index="BRAND / 02" contentClassName="">
            <LogoConstruction />
          </Panel>
          <ColorPanel />
          <TypographyPanel />
          <DigitalApplicationPanel />
          <SystemDetailPanel />
        </div>
        <Footer />
      </main>
    </SkillsetShell>
  );
}

function BrandHeader() {
  return (
    <header className="relative">
      <div className="flex items-center gap-3">
        <span
          className="text-[11px] uppercase tracking-[0.28em] text-zinc-500"
          style={{ fontFamily: "var(--font-geist-mono), monospace" }}
        >
          Identity System
        </span>
        <span className="h-px w-12 bg-white/10" />
        <span
          className="text-[11px] uppercase tracking-[0.28em] text-zinc-500"
          style={{ fontFamily: "var(--font-geist-mono), monospace" }}
        >
          v1.0 / 2026
        </span>
      </div>
      <h1 className="mt-6 max-w-3xl text-balance text-[44px] font-medium leading-[1.05] tracking-tight text-zinc-50 md:text-[64px]">
        The Skillset
        <br />
        <span className="text-zinc-400">brand kit.</span>
      </h1>
      <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-zinc-400">
        A portable identity for a portable product. Save once, use everywhere —
        the logo, color, and language that carry Skillset across every surface.
      </p>
    </header>
  );
}

function LogoCover() {
  return (
    <Panel label="Primary Mark" index="BRAND / 01" className="lg:col-span-1">
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 55% 45% at 50% 60%, rgba(37,99,235,0.20), transparent 65%)",
          }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-7 px-6">
          <img
            src="/img/skillset_logo.png"
            alt="Skillset logo"
            width={132}
            height={132}
            className="h-[132px] w-[132px] rounded-[28px] object-cover shadow-[0_30px_80px_-20px_rgba(37,99,235,0.6)]"
          />
          <div className="flex items-center gap-3">
            <span className="text-[34px] font-medium tracking-tight text-zinc-50">
              skillset
            </span>
            <span
              className="rounded-full border border-white/10 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.18em] text-zinc-400"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              Beta
            </span>
          </div>
        </div>
        <div
          className="absolute bottom-4 left-5 text-[10px] uppercase tracking-[0.22em] text-zinc-600"
          style={{ fontFamily: "var(--font-geist-mono), monospace" }}
        >
          A — portable. P — premium. I — intentional.
        </div>
      </div>
    </Panel>
  );
}

function ColorPanel() {
  return (
    <Panel label="Color System" index="BRAND / 03">
      <div className="grid grid-cols-2 gap-3 p-5 md:grid-cols-3">
        <ColorSwatch hex="#0a0a0c" role="Canvas" name="Void" />
        <ColorSwatch hex="#2563EB" role="Primary" name="Signal" />
        <ColorSwatch hex="#1d4ed8" role="Hover" name="Deep" />
        <ColorSwatch hex="#7BA7FF" role="Accent" name="Halo" light />
        <ColorSwatch hex="#0d0d10" role="Surface" name="Slate" />
        <ColorSwatch hex="#ededed" role="Foreground" name="Paper" light />
      </div>
    </Panel>
  );
}

function TypographyPanel() {
  return (
    <Panel label="Typography" index="BRAND / 04">
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <div className="absolute inset-0 flex flex-col justify-between p-8">
          <div className="flex items-end gap-6">
            <span className="text-[180px] font-medium leading-[0.85] tracking-tight text-zinc-50">
              Aa
            </span>
            <div className="mb-4 space-y-1">
              <div
                className="text-[10px] uppercase tracking-[0.22em] text-zinc-500"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              >
                Display
              </div>
              <div className="text-[16px] text-zinc-200">Geist</div>
              <div
                className="text-[10px] uppercase tracking-[0.22em] text-zinc-500 pt-2"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              >
                Mono
              </div>
              <div
                className="text-[14px] text-zinc-200"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              >
                Geist Mono
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="text-[15px] tracking-tight text-zinc-300">
              ABCDEFGHIJKLMNOPQRSTUVWXYZ
            </div>
            <div
              className="text-[13px] tracking-[0.04em] text-zinc-500"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              0 1 2 3 4 5 6 7 8 9 — / . , : ; { } [ ] &lt; &gt;
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function DigitalApplicationPanel() {
  return (
    <Panel label="Digital Application" index="BRAND / 05">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#0a0a0c] p-6">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 110%, rgba(37,99,235,0.18), transparent 60%)",
          }}
        />
        <div className="relative mx-auto mt-6 max-w-md overflow-hidden rounded-xl border border-white/10 bg-[#111114] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]">
          <div className="flex items-center gap-2 border-b border-white/5 bg-[#0d0d10] px-3 py-2.5">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
            </div>
            <div
              className="ml-3 flex flex-1 items-center gap-2 rounded-md border border-white/5 bg-black/40 px-3 py-1 text-[11px] text-zinc-500"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#2563EB]" />
              skillset.so
            </div>
          </div>
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-2">
              <img
                src="/img/skillset_logo.png"
                alt=""
                width={18}
                height={18}
                className="h-[18px] w-[18px] rounded-[5px] object-cover"
              />
              <span className="text-[12px] text-zinc-100">skillset</span>
            </div>
            <span className="rounded-full bg-[#2563EB] px-2.5 py-0.5 text-[10px] font-medium text-white">
              Start Free
            </span>
          </div>
          <div className="border-t border-white/5 px-4 pb-5 pt-3">
            <p className="text-[13px] leading-snug tracking-tight text-zinc-100">
              Turn your prompts into reusable skills.
            </p>
            <p className="mt-2 text-[11px] text-zinc-500">
              Works in ChatGPT, Claude, Gemini, and any LLM.
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {["ChatGPT", "Claude", "Gemini", "IDE", "Browser"].map((p) => (
            <span
              key={p}
              className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 text-[11px] text-zinc-400"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function SystemDetailPanel() {
  return (
    <Panel label="System & Promise" index="BRAND / 06">
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 20% 110%, rgba(37,99,235,0.16), transparent 60%)",
          }}
        />
        <div className="absolute inset-0 flex flex-col justify-between p-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span
                className="rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-zinc-400"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              >
                prompt.txt
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="#7BA7FF"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span
                className="inline-flex items-center gap-1.5 rounded-md bg-[#2563EB] px-2.5 py-1 text-[11px] font-medium text-white"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                .skill
              </span>
            </div>
            <p className="max-w-xs text-[12px] leading-relaxed text-zinc-500">
              One file. Any model. Portable across every assistant your team
              already uses.
            </p>
          </div>

          <div>
            <h2 className="text-[44px] font-medium leading-[1] tracking-tight text-zinc-50">
              Save once.
              <br />
              <span className="text-[#7BA7FF]">Use everywhere.</span>
            </h2>
            <div className="mt-4 flex items-center gap-2">
              <span className="h-px w-8 bg-white/15" />
              <span
                className="text-[10px] uppercase tracking-[0.22em] text-zinc-500"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              >
                skillset.so
              </span>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function Footer() {
  return (
    <footer className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-white/5 pt-6 md:flex-row md:items-center">
      <div
        className="text-[11px] uppercase tracking-[0.22em] text-zinc-600"
        style={{ fontFamily: "var(--font-geist-mono), monospace" }}
      >
        Skillset — Brand Identity Guidelines
      </div>
      <div
        className="text-[11px] tracking-[0.18em] text-zinc-600"
        style={{ fontFamily: "var(--font-geist-mono), monospace" }}
      >
        © 2026 — 06 / 06
      </div>
    </footer>
  );
}
