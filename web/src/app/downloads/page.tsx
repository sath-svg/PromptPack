import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Boxes, Chrome, Terminal } from "lucide-react";
import { SkillsetShell } from "@/components/skillset-shell";
import { MacOSDownload } from "@/components/macos-download";
import { WindowsDownload } from "@/components/windows-download";

const APP_VERSION = "1.1.0";
const EXT_VERSION = "2.4.0";

export const metadata: Metadata = {
  title: "Download Skillset — Mac, Windows, browser extensions",
  description:
    "Download the Skillset desktop app for macOS and Windows, or install the browser extension for Chrome, Firefox, and Safari.",
};

export default function DownloadsPage() {
  return (
    <SkillsetShell showHalo haloPosition="50% 0%">
      <DownloadsHero />
      <DesktopSection />
      <ExtensionsSection />
      <McpSection />
      <DownloadsFooterCta />
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
          on every device you use.
        </h1>

        <p className="mx-auto mt-7 max-w-[62ch] text-[16px] leading-[1.55] text-zinc-400">
          Native desktop apps for Mac and Windows. Browser extensions for Chrome, Firefox, and
          Safari. One library &mdash; synced across all of them.
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
            v{APP_VERSION} &middot; updated 2026-05-13
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

function ExtensionsSection() {
  const extensions = [
    {
      name: "Chrome",
      detail: "Manifest V3 &middot; Chromium, Edge, Brave, Opera, Arc",
      storeLabel: "Chrome Web Store",
      store: "https://chromewebstore.google.com/detail/ajfgnekiofhiblifmiimnlmcnfhibnbl",
      file: `/downloads/promptpack-chrome-v${EXT_VERSION}.zip`,
      accent: "#7BA7FF",
    },
    {
      name: "Firefox",
      detail: "Manifest V3 &middot; Firefox 109+",
      storeLabel: "Firefox Add-ons",
      store: "https://addons.mozilla.org/en-US/firefox/addon/promptpack/",
      file: `/downloads/promptpack-firefox-v${EXT_VERSION}.zip`,
      accent: "#FF7139",
    },
    {
      name: "Safari",
      detail: "Source build &middot; Safari 16+",
      storeLabel: null,
      store: null,
      file: `/downloads/promptpack-safari-v${EXT_VERSION}-source.zip`,
      accent: "#06B6D4",
    },
  ];

  return (
    <section className="relative border-t border-white/5 bg-[#0c0c10] py-16 md:py-20">
      <div className="mx-auto max-w-[1400px] px-6">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p
              className="mb-3 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              02 &mdash; Browser extensions
            </p>
            <h2 className="text-[28px] font-medium leading-[1.1] tracking-[-0.015em] text-zinc-50 md:text-[36px]">
              Capture from any AI tab.
            </h2>
          </div>
          <p
            className="hidden max-w-[40ch] text-[13.5px] text-zinc-500 md:block"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            v{EXT_VERSION}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {extensions.map((e) => (
            <div
              key={e.name}
              className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0f0f12] p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-all duration-300 hover:border-white/[0.14]"
            >
              <div className="flex items-center gap-3">
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-white/10 bg-white/[0.03]"
                  style={{ color: e.accent }}
                >
                  <Chrome className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <div className="flex flex-col">
                  <span className="text-[15px] font-medium tracking-[-0.01em] text-zinc-50">
                    {e.name}
                  </span>
                  <span
                    className="text-[10.5px] uppercase tracking-[0.16em] text-zinc-500"
                    dangerouslySetInnerHTML={{ __html: e.detail }}
                    style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                {e.store ? (
                  <a
                    href={e.store}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#2563EB] px-4 py-2 text-[12.5px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition-all duration-200 hover:bg-[#1d4ed8] active:translate-y-[1px]"
                  >
                    {e.storeLabel}
                  </a>
                ) : null}
                <a
                  href={e.file}
                  download
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 text-[12.5px] text-zinc-200 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.05] active:translate-y-[1px]"
                >
                  .zip
                </a>
              </div>

              <div className="mt-auto pt-6">
                <p
                  className="border-t border-white/[0.05] pt-3 text-[11px] text-zinc-500"
                  style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                >
                  v{EXT_VERSION}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function McpSection() {
  return (
    <section className="relative bg-[#0a0a0c] py-16 md:py-20">
      <div className="mx-auto max-w-[1400px] px-6">
        <div className="mb-10">
          <p
            className="mb-3 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            03 &mdash; MCP Server
          </p>
          <h2 className="text-[28px] font-medium leading-[1.1] tracking-[-0.015em] text-zinc-50 md:text-[36px]">
            Bring skillsets into Claude Code and Claude Desktop.
          </h2>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0f0f12] p-8 md:p-10">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-[auto_1fr_auto] md:items-center md:gap-10">
            <span className="grid h-12 w-12 place-items-center rounded-md border border-white/10 bg-white/[0.03] text-[#7BA7FF]">
              <Terminal className="h-6 w-6" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-[16px] font-medium text-zinc-50">@promptpack/mcp-server</p>
              <p className="mt-1.5 max-w-[64ch] text-[13.5px] leading-[1.55] text-zinc-400">
                Streamable HTTP bridge to your Skillset packs. Works with Claude Desktop, Claude
                Code, Cursor &mdash; any MCP client. Requires Node.js 18+.
              </p>
            </div>
            <div className="md:text-right">
              <pre
                className="overflow-x-auto rounded-lg border border-white/10 bg-[#0a0a0c] px-4 py-3 text-left text-[12.5px] text-zinc-200"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              >
                <span className="text-zinc-600">$</span> npx @promptpack/mcp-server
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
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
