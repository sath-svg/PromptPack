"use client";

import { useEffect, useState } from "react";
import { Download, ChevronDown, Cpu } from "lucide-react";
import { DownloadWarningDialog } from "@/components/download-warning-dialog";

type Arch = "x64" | "arm64";

// Filenames match the artifacts produced by .github/workflows/build-windows.yml
// (see "Collect artifacts" step). Upload them under /downloads/ on the web host.
const FILES: Record<Arch, { exe: string; msi: string; label: string; size: string }> = {
  x64: {
    exe: "/downloads/Skillset_1.2.0_x64-setup.exe",
    msi: "/downloads/Skillset_1.2.0_x64_en-US.msi",
    label: "x64 (64-bit Intel / AMD)",
    size: "~10 MB",
  },
  arm64: {
    exe: "/downloads/Skillset_1.2.0_arm64-setup.exe",
    msi: "/downloads/Skillset_1.2.0_arm64_en-US.msi",
    label: "ARM64 (Snapdragon X / Surface Pro 9 5G)",
    size: "~9 MB",
  },
};

export function WindowsDownload({ version }: { version: string }) {
  const [arch, setArch] = useState<Arch>("x64");
  const [autoDetected, setAutoDetected] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (!ua.includes("windows")) return;

    type UAData = {
      getHighEntropyValues?: (hints: string[]) => Promise<{ architecture?: string; bitness?: string }>;
    };
    const nav = navigator as unknown as { userAgentData?: UAData };
    const uaData = nav.userAgentData;

    if (uaData?.getHighEntropyValues) {
      uaData
        .getHighEntropyValues(["architecture", "bitness"])
        .then((v) => {
          if (v.architecture === "arm") setArch("arm64");
          else setArch("x64");
          setAutoDetected(true);
        })
        .catch(() => setAutoDetected(true));
      return;
    }

    if (/arm64|aarch64/i.test(ua)) setArch("arm64");
    else setArch("x64");
    setAutoDetected(true);
  }, []);

  const current = FILES[arch];

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
        className="pointer-events-none absolute -bottom-32 -left-32 h-72 w-72 rounded-full opacity-60 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: "radial-gradient(circle, rgba(37,99,235,0.12), transparent 65%)" }}
      />

      <div className="relative z-10 flex h-full flex-col p-7 md:p-9">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-white/10 bg-white/[0.03] text-[#7BA7FF]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 5.55l7.46-1.02v7.2H3V5.55zm0 13.06l7.46 1.02v-7.17H3v6.15zm8.3 1.13L21 21v-8.55h-9.7v7.29zm0-15.42v7.41H21V3l-9.7 1.32z" />
              </svg>
            </span>
            <div className="flex flex-col">
              <span
                className="text-[10.5px] uppercase tracking-[0.18em] text-zinc-500"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              >
                Windows &middot; 10 / 11
              </span>
              <span className="text-[18px] font-medium tracking-[-0.01em] text-zinc-50">
                Skillset for Windows
              </span>
            </div>
          </div>
          {autoDetected && (
            <span
              className="rounded-full border border-[#2563EB]/30 bg-[#2563EB]/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[#7BA7FF]"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              {arch} detected
            </span>
          )}
        </div>

        <p className="mt-5 text-[13.5px] leading-[1.6] text-zinc-400">
          Native Windows app with system tray integration and global hotkeys.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => requestDownload(current.exe)}
            className="group/btn inline-flex items-center gap-2 rounded-full bg-[#2563EB] px-5 py-2.5 text-[13.5px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_8px_24px_-12px_rgba(37,99,235,0.6)] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[#1d4ed8] active:translate-y-[1px]"
          >
            <Download className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-y-0.5" strokeWidth={2} />
            Download .exe
          </button>

          <button
            type="button"
            onClick={() => requestDownload(current.msi)}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-5 py-2.5 text-[13.5px] text-zinc-200 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.05] active:translate-y-[1px]"
          >
            .msi package
          </button>

          <div className="relative">
            <select
              value={arch}
              onChange={(e) => setArch(e.target.value as Arch)}
              className="appearance-none rounded-full border border-white/10 bg-white/[0.02] py-2.5 pl-4 pr-9 text-[12.5px] text-zinc-200 transition-all hover:border-white/20 hover:bg-white/[0.05] focus:border-[#2563EB]/50 focus:outline-none"
              style={{
                fontFamily: "var(--font-geist-mono), monospace",
                colorScheme: "dark",
              }}
            >
              <option value="x64" className="bg-zinc-900 text-zinc-100">x64</option>
              <option value="arm64" className="bg-zinc-900 text-zinc-100">ARM64</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500"
              strokeWidth={2}
            />
          </div>
        </div>

        <div className="mt-auto pt-7">
          <div className="flex items-center gap-2 border-t border-white/[0.05] pt-4 text-[11px] text-zinc-500">
            <Cpu className="h-3 w-3" strokeWidth={2} />
            <span style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
              v{version}
            </span>
            <span className="text-zinc-700">&middot;</span>
            <span style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
              {current.label}
            </span>
            <span className="text-zinc-700">&middot;</span>
            <span style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
              {current.size}
            </span>
          </div>
        </div>
      </div>

      <DownloadWarningDialog
        open={dialogOpen}
        kind="windows"
        url={pendingUrl}
        onCancel={cancel}
        onConfirm={confirmDownload}
      />
    </div>
  );
}
