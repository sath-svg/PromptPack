"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarCheck, Copy, Check, X, ArrowUpRight } from "lucide-react";

/**
 * "Book a demo" CTA with a graceful waterfall:
 *   1. mailto:  — open the visitor's default mail client.
 *   2. Gmail    — if no mail client took focus, try Gmail compose in a new tab.
 *   3. Modal    — if Gmail can't open (popup blocked / unavailable), show the
 *                 template so the visitor can copy it and email us manually.
 *
 * Note on tier 2: browsers only allow window.open() while a user gesture is
 * "active". After the ~900ms detection delay the gesture has usually expired,
 * so Chrome frequently blocks the auto-Gmail tab. That's expected — it falls
 * through to the modal, which exposes a gesture-safe "Open Gmail" button plus
 * copy, so the visitor still reaches Gmail in one click.
 */

const EMAIL = "hello@skillset.so";
const SUBJECT = "Skillset Enterprise demo request";
const BODY = [
  "Hi Skillset team,",
  "",
  "We'd like to see how Skillset Enterprise could work for our company.",
  "",
  "Company:",
  "Team size:",
  "What we want to build (AI adoption / agentic workflows / RAG):",
  "",
  "Thanks!",
].join("\n");

const enc = encodeURIComponent;
const MAILTO = `mailto:${EMAIL}?subject=${enc(SUBJECT)}&body=${enc(BODY)}`;
const GMAIL = `https://mail.google.com/mail/?view=cm&fs=1&to=${enc(EMAIL)}&su=${enc(SUBJECT)}&body=${enc(BODY)}`;
const PLAINTEXT = `To: ${EMAIL}\nSubject: ${SUBJECT}\n\n${BODY}`;

export function BookDemoButton({ className }: { className: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const book = useCallback(() => {
    let leftPage = false;
    const onBlur = () => {
      leftPage = true;
    };
    const onVis = () => {
      if (document.hidden) leftPage = true;
    };
    window.addEventListener("blur", onBlur, { once: true });
    document.addEventListener("visibilitychange", onVis);

    // Tier 1 — trigger mailto via a hidden iframe so the page itself never
    // navigates (avoids the "can't open page" interstitial when no handler).
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = MAILTO;
    document.body.appendChild(iframe);

    window.setTimeout(() => {
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVis);
      try {
        iframe.remove();
      } catch {
        /* already gone */
      }

      // A mail client opened (window lost focus / tab hidden) — done.
      if (leftPage || document.hidden) return;

      // Tier 2 — try Gmail. Often popup-blocked this late; null => fall through.
      const win = window.open(GMAIL, "_blank", "noopener,noreferrer");
      if (!win) setOpen(true); // Tier 3 — manual.
    }, 900);
  }, []);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(PLAINTEXT);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the text is selectable in the modal */
    }
  }, []);

  // Close on Escape while the modal is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button type="button" onClick={book} style={{ padding: "12px 26px" }} className={className}>
        <CalendarCheck className="h-4 w-4" strokeWidth={2} />
        Book a demo
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Book a demo by email"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[100] grid place-items-center bg-black/70 px-5 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[460px] rounded-2xl border border-white/10 bg-[#0f0f12] p-7 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8)]"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-full p-1.5 text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-200"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>

            <h3 className="text-[19px] font-medium tracking-tight text-zinc-50">Email us to book a demo</h3>
            <p className="mt-2 text-[14px] leading-[1.55] text-zinc-400">
              Send the note below to{" "}
              <span className="text-zinc-200">{EMAIL}</span> and we&rsquo;ll set up your Skillset
              Enterprise demo.
            </p>

            <pre
              className="mt-5 max-h-[220px] overflow-auto whitespace-pre-wrap rounded-xl border border-white/[0.07] bg-white/[0.025] p-4 text-[12.5px] leading-[1.55] text-zinc-300"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              {PLAINTEXT}
            </pre>

            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
              <a
                href={GMAIL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ padding: "11px 20px" }}
                className="group inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#2563EB] text-[14px] font-medium text-white transition-colors hover:bg-[#1d4ed8]"
              >
                Open Gmail
                <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
              </a>
              <button
                type="button"
                onClick={copy}
                style={{ padding: "11px 20px" }}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.02] text-[14px] font-medium text-zinc-200 transition-colors hover:border-white/25 hover:text-zinc-50"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" strokeWidth={2} />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" strokeWidth={2} />
                    Copy details
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
