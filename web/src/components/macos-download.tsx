"use client";

import { useState } from "react";
import { Download, Cpu, Apple } from "lucide-react";
import { DownloadWarningDialog } from "@/components/download-warning-dialog";

// Single universal binary — matches the artifact produced by
// .github/workflows/build-macos.yml (build-universal job). Tauri builds
// x86_64 + aarch64 and lipo's them into one fat dmg that runs on both
// Apple Silicon and Intel Macs. Upload under /downloads/ on the web host.
const FILE = {
  href: "/downloads/Skillset-Universal.dmg",
  label: "Universal (Apple Silicon + Intel)",
  size: "~27 MB",
};

export function MacOSDownload({ version }: { version: string }) {
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const requestDownload = (url: string) => {
    setPendingUrl(url);
    setDialogOpen(true);
  };

  const confirmDownload = () => {
    if (pendingUrl) {
      const a = document.createElement("a");
      a.href = pendingUrl;
      a.download = "";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    setDialogOpen(false);
    setPendingUrl(null);
  };

  const cancel = () => {
    setDialogOpen(false);
    setPendingUrl(null);
  };

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0f0f12] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] scroll-mt-24 transition-all duration-300 hover:border-white/[0.14] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_20px_40px_-30px_rgba(37,99,235,0.4)]">
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-32 h-72 w-72 rounded-full opacity-60 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: "radial-gradient(circle, rgba(37,99,235,0.12), transparent 65%)" }}
      />

      <div className="relative z-10 flex h-full flex-col p-7 md:p-9">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-white/10 bg-white/[0.03] text-zinc-200">
              <Apple className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div className="flex flex-col">
              <span
                className="text-[10.5px] uppercase tracking-[0.18em] text-zinc-500"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              >
                macOS &middot; 10.15+
              </span>
              <span className="text-[18px] font-medium tracking-[-0.01em] text-zinc-50">
                Skillset for Mac
              </span>
            </div>
          </div>
        </div>

        <p className="mt-5 text-[13.5px] leading-[1.6] text-zinc-400">
          Native Mac app with menu bar integration. One universal binary runs on both Apple Silicon and Intel — no need to pick.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => requestDownload(FILE.href)}
            className="group/btn inline-flex items-center gap-2 rounded-full bg-[#2563EB] px-5 py-2.5 text-[13.5px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_8px_24px_-12px_rgba(37,99,235,0.6)] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[#1d4ed8] active:translate-y-[1px]"
          >
            <Download className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-y-0.5" strokeWidth={2} />
            Download for Mac
          </button>
        </div>

        <div className="mt-auto pt-7">
          <div className="flex items-center gap-2 border-t border-white/[0.05] pt-4 text-[11px] text-zinc-500">
            <Cpu className="h-3 w-3" strokeWidth={2} />
            <span style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
              v{version}
            </span>
            <span className="text-zinc-700">&middot;</span>
            <span style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
              {FILE.label}
            </span>
            <span className="text-zinc-700">&middot;</span>
            <span style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
              {FILE.size}
            </span>
          </div>
        </div>
      </div>

      <DownloadWarningDialog
        open={dialogOpen}
        kind="macos"
        url={pendingUrl}
        onCancel={cancel}
        onConfirm={confirmDownload}
      />
    </div>
  );
}
