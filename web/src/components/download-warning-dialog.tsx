"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, X, Download, ShieldCheck } from "lucide-react";

export type WarningKind = "macos" | "windows";

export function DownloadWarningDialog({
  open,
  kind,
  url,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  kind: WarningKind;
  url: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open && !dlg.open) dlg.showModal();
    if (!open && dlg.open) dlg.close();
  }, [open]);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    const onCloseEvt = () => onCancel();
    dlg.addEventListener("close", onCloseEvt);
    return () => dlg.removeEventListener("close", onCloseEvt);
  }, [onCancel]);

  const title = kind === "macos" ? "macOS Gatekeeper Notice" : "Windows SmartScreen Notice";
  const headline =
    kind === "macos"
      ? "macOS may show “App can’t be opened because it is from an unidentified developer” because Skillset isn’t code-signed yet."
      : "Windows may show “Windows protected your PC” because Skillset isn’t code-signed yet.";

  const steps =
    kind === "macos" ? (
      <ol className="ml-4 list-decimal space-y-1.5 text-[13px] leading-[1.55] text-zinc-300 marker:text-[#7BA7FF]">
        <li>
          Right-click (or Control-click) the app in <strong className="text-zinc-100">Finder</strong>
        </li>
        <li>
          Select <strong className="text-zinc-100">&ldquo;Open&rdquo;</strong> from the menu
        </li>
        <li>
          Click <strong className="text-zinc-100">&ldquo;Open&rdquo;</strong> in the dialog that appears
        </li>
      </ol>
    ) : (
      <ol className="ml-4 list-decimal space-y-1.5 text-[13px] leading-[1.55] text-zinc-300 marker:text-[#7BA7FF]">
        <li>
          Click <strong className="text-zinc-100">&ldquo;More info&rdquo;</strong> on the SmartScreen popup
        </li>
        <li>
          Click <strong className="text-zinc-100">&ldquo;Run anyway&rdquo;</strong>
        </li>
      </ol>
    );

  const altLine =
    kind === "macos" ? (
      <p className="mt-3 text-[12px] leading-[1.55] text-zinc-500">
        Alternatively: open <strong className="text-zinc-300">System Settings &rarr; Privacy &amp; Security</strong> and
        click &ldquo;Open Anyway&rdquo;.
      </p>
    ) : null;

  return (
    <dialog
      ref={dialogRef}
      onClick={(e) => {
        if (e.target === dialogRef.current) onCancel();
      }}
      className="m-0 w-[92%] max-w-[500px] rounded-2xl border border-white/[0.08] bg-[#0f0f12] p-0 text-zinc-100 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop:bg-black/60 backdrop:backdrop-blur-md open:fixed open:left-1/2 open:top-1/2 open:-translate-x-1/2 open:-translate-y-1/2"
      style={{ fontFamily: "var(--font-geist), system-ui, sans-serif" }}
    >
      <div className="relative overflow-hidden rounded-2xl">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(251,191,36,0.18), transparent 65%)",
          }}
        />

        <div className="relative flex items-center gap-3 border-b border-white/5 px-6 py-5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-amber-400/30 bg-amber-400/[0.08] text-amber-300">
            <AlertTriangle className="h-4 w-4" strokeWidth={1.9} />
          </span>
          <h3 className="flex-1 text-[15px] font-medium tracking-[-0.01em] text-zinc-50">
            {title}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="grid h-7 w-7 place-items-center rounded-md text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        <div className="relative px-6 py-5">
          <p className="text-[13.5px] leading-[1.6] text-zinc-300">{headline}</p>

          <div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
            <p
              className="mb-2 text-[10.5px] uppercase tracking-[0.18em] text-zinc-500"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              To install
            </p>
            {steps}
            {altLine}
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-400/15 bg-emerald-400/[0.04] px-3 py-2.5">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" strokeWidth={2} />
            <p className="text-[12.5px] leading-[1.5] text-emerald-300/90">
              Safe to install &mdash; Skillset is open source and the code is publicly verifiable.
            </p>
          </div>
        </div>

        <div className="relative flex items-center justify-end gap-3 border-t border-white/5 bg-[#0c0c10]/60 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 text-[13px] text-zinc-200 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.06] active:translate-y-[1px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!url}
            className="group inline-flex items-center gap-2 rounded-full bg-[#2563EB] px-4 py-2 text-[13px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_8px_24px_-12px_rgba(37,99,235,0.6)] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[#1d4ed8] active:translate-y-[1px] disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5 transition-transform group-hover:translate-y-0.5" strokeWidth={2} />
            Download Anyway
          </button>
        </div>
      </div>
    </dialog>
  );
}
