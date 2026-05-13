"use client";

import { Check } from "lucide-react";
import { SkillsetShell } from "@/components/skillset-shell";

/**
 * Desktop Callback page
 *
 * This page should never actually be shown - the Tauri desktop app
 * intercepts the navigation to this URL and extracts the token.
 *
 * If this page is displayed, it means something went wrong with the
 * interception (e.g., user opened the link in a regular browser).
 */
export default function DesktopCallbackPage() {
  return (
    <SkillsetShell showNav={false}>
      <section className="flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
          <Check strokeWidth={2} className="h-6 w-6" />
        </div>
        <h1 className="mt-6 text-[20px] font-medium text-zinc-50">
          Authentication complete
        </h1>
        <p className="mt-2 max-w-[44ch] text-[14px] text-zinc-400">
          You can close this window and return to the Skillset desktop app.
        </p>
        <p className="mt-3 max-w-[44ch] text-[12px] text-zinc-500">
          If you&apos;re seeing this in a regular browser, please open the link in the Skillset app.
        </p>
      </section>
    </SkillsetShell>
  );
}
