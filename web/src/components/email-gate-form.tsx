"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { TRIAL_CTA_HREF } from "@/lib/cta";
import { autoTrialSignUp } from "@/lib/auth-compat";

/**
 * Homepage gate. Visitor enters an email to go further (Outrank-style). We save
 * the lead, then hand off to sign-up with the email prefilled and a callback
 * that lands on /start-trial (the 3-day trial checkout).
 */
export function EmailGateForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const captureLead = useMutation(api.leads.capture);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) return;
    setSubmitting(true);

    // Fire-and-forget lead capture — never block the funnel on it.
    void captureLead({ email: trimmed, source: "homepage_gate" }).catch(() => {
      /* ignore */
    });

    // Create the account from just the email and log the user in, then go
    // straight to the trial checkout. No sign-up form in between.
    const res = await autoTrialSignUp(trimmed);

    if (res.ok) {
      window.location.assign(TRIAL_CTA_HREF);
      return;
    }

    const params = new URLSearchParams({ email: trimmed, callback: TRIAL_CTA_HREF });
    if (res.exists) {
      // Already a member — send them to sign in, then continue to checkout.
      window.location.assign(`/sign-in?${params.toString()}`);
      return;
    }
    // Signup failed for some other reason — fall back to the full sign-up form.
    window.location.assign(`/sign-up?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-3">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@company.com"
        autoComplete="email"
        className="w-full rounded-full border border-white/10 bg-white/[0.03] px-5 py-3.5 text-[15px] text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors focus:border-[#2563EB]/60"
      />
      <button
        type="submit"
        disabled={submitting}
        className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#2563EB] px-6 py-3.5 text-[15px] font-medium text-white whitespace-nowrap shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_8px_24px_-12px_rgba(37,99,235,0.6)] transition-all duration-200 hover:bg-[#1d4ed8] active:translate-y-[1px] disabled:opacity-60"
      >
        {submitting ? "Setting up your trial…" : "Start 3-day free trial"}
        {!submitting && (
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
        )}
      </button>
      <p
        className="text-[12px] text-zinc-600"
        style={{ fontFamily: "var(--font-geist-mono), monospace" }}
      >
        cancel anytime in the first 3 days · no long-term commitment
      </p>
    </form>
  );
}
