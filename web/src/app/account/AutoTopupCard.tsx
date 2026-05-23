"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Zap, CreditCard, AlertTriangle, Check, Loader2 } from "lucide-react";
import { api } from "../../../convex/_generated/api";

/**
 * Auto top-up card on /account. Dark theme matching the rest of skillset.so
 * (`#0a0a0a` bg, `#0f0f12` card, geist-mono eyebrow, #2563EB primary CTA).
 *
 * States:
 *   - No card on file → "Set up auto top-up" button → /api/stripe/auto-topup-setup
 *   - Card on file, disabled → toggle + threshold + pack pickers
 *   - Card on file, enabled → same controls + last-charge meta
 *   - Charge failed recently → amber banner with reason
 */

type PackKey = "small" | "medium" | "large" | "xl";

const PACKS: Array<{ key: PackKey; credits: number; priceCents: number; label: string }> = [
  { key: "small", credits: 200, priceCents: 500, label: "$5 · 200 credits" },
  { key: "medium", credits: 500, priceCents: 1000, label: "$10 · 500 credits" },
  { key: "large", credits: 1500, priceCents: 3000, label: "$30 · 1,500 credits" },
  { key: "xl", credits: 5000, priceCents: 10000, label: "$100 · 5,000 credits" },
];

const THRESHOLDS = [50, 100, 200, 500] as const;
type ThresholdPreset = (typeof THRESHOLDS)[number];

function isThreshold(n: number): n is ThresholdPreset {
  return (THRESHOLDS as readonly number[]).includes(n);
}

interface Props {
  userId: string;
}

export function AutoTopupCard({ userId }: Props) {
  const config = useQuery(api.autoTopup.getConfig, { userId });
  const setConfig = useMutation(api.autoTopup.setConfig);
  const disconnect = useMutation(api.autoTopup.disconnect);

  const [enabled, setEnabled] = useState(false);
  const [threshold, setThreshold] = useState<ThresholdPreset>(100);
  const [packKey, setPackKey] = useState<PackKey>("small");
  const [monthlyCap, setMonthlyCap] = useState<number>(50);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setupLoading, setSetupLoading] = useState(false);
  const [postSetupBanner, setPostSetupBanner] = useState<null | "saved" | "cancelled">(null);

  // Hydrate local state from server config once it loads
  useEffect(() => {
    if (!config) return;
    setEnabled(config.enabled);
    if (isThreshold(config.thresholdCredits)) setThreshold(config.thresholdCredits);
    setPackKey(config.packKey);
    if (typeof config.monthlyCapUsd === "number") setMonthlyCap(config.monthlyCapUsd);
  }, [config]);

  // Read ?autotopup=card-saved | cancelled banner from URL after Stripe redirect
  useEffect(() => {
    if (typeof window === "undefined") return;
    const v = new URLSearchParams(window.location.search).get("autotopup");
    if (v === "card-saved") setPostSetupBanner("saved");
    else if (v === "cancelled") setPostSetupBanner("cancelled");
    if (v) {
      // Strip the param so refreshes don't re-show the banner
      const url = new URL(window.location.href);
      url.searchParams.delete("autotopup");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const startSetup = async () => {
    if (setupLoading) return;
    setError(null);
    setSetupLoading(true);
    try {
      const res = await fetch("/api/stripe/auto-topup-setup", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `Setup failed (${res.status})`);
      }
      const { url } = (await res.json()) as { url?: string };
      if (!url) throw new Error("Setup URL missing");
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start card setup");
      setSetupLoading(false);
    }
  };

  const save = async () => {
    if (saving) return;
    setError(null);
    setSaving(true);
    try {
      await setConfig({
        userId,
        enabled,
        thresholdCredits: threshold,
        packKey,
        monthlyCapUsd: monthlyCap,
      });
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (saving) return;
    if (!confirm("Remove saved card and disable auto top-up?")) return;
    setError(null);
    setSaving(true);
    try {
      await disconnect({ userId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Disconnect failed");
    } finally {
      setSaving(false);
    }
  };

  if (config === undefined) {
    // Loading state
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-[#0f0f12] p-6 md:col-span-2">
        <CardHeader />
        <p className="text-[13px] text-zinc-600">Loading…</p>
      </div>
    );
  }

  const hasCard = config !== null && config.hasPaymentMethod;
  const recentlyFailed =
    config !== null &&
    (config.consecutiveFailures ?? 0) > 0 &&
    config.lastFailureReason;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0f0f12] p-6 transition-all duration-200 hover:border-white/[0.14] md:col-span-2">
      <CardHeader />

      {postSetupBanner === "saved" && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-300">
          <Check size={14} className="mt-0.5 shrink-0" strokeWidth={2.5} />
          <span>Card saved. Toggle auto top-up on below.</span>
        </div>
      )}
      {postSetupBanner === "cancelled" && (
        <div className="mb-4 text-[12px] text-zinc-500">
          Card setup cancelled.
        </div>
      )}

      {recentlyFailed && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-200">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Last charge failed</p>
            <p className="mt-0.5">
              Reason:{" "}
              <span
                className="font-mono text-amber-300"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              >
                {config?.lastFailureReason}
              </span>
              {(config?.consecutiveFailures ?? 0) >= 3
                ? " · Auto top-up has been disabled. Re-enable below after fixing your card."
                : ""}
            </p>
          </div>
        </div>
      )}

      {!hasCard ? (
        <div>
          <p className="text-[14px] leading-[1.6] text-zinc-400 mb-5 max-w-[60ch]">
            Save a card and we'll automatically top up your credits when your
            balance drops below your chosen threshold. Change the threshold or
            turn it off at any time.
          </p>
          <button
            onClick={startSetup}
            disabled={setupLoading}
            className="group inline-flex items-center gap-2 rounded-full bg-[#2563EB] px-5 py-2 text-[13px] font-medium text-white whitespace-nowrap transition-all duration-200 hover:bg-[#1d4ed8] active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {setupLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Starting…
              </>
            ) : (
              <>
                <CreditCard size={14} /> Set up auto top-up
              </>
            )}
          </button>
          {error && <p className="mt-3 text-[12px] text-red-400">{error}</p>}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Saved card row */}
          <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
            <div className="flex items-center gap-2 text-[13px] text-zinc-300">
              <CreditCard size={14} className="text-zinc-500" />
              <span className="capitalize">{config?.cardBrand ?? "card"}</span>
              <span
                className="font-mono text-zinc-500"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              >
                •••• {config?.cardLast4 ?? "????"}
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={startSetup}
                disabled={setupLoading || saving}
                className="text-[12px] text-zinc-400 underline-offset-2 hover:text-zinc-100 hover:underline disabled:opacity-50"
              >
                {setupLoading ? "…" : "Change card"}
              </button>
              <button
                onClick={handleDisconnect}
                disabled={saving}
                className="text-[12px] text-red-400 underline-offset-2 hover:text-red-300 hover:underline disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          </div>

          {/* Enable toggle */}
          <label className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 cursor-pointer hover:border-white/[0.12] transition-colors">
            <div>
              <p className="text-[13px] font-medium text-zinc-100">
                Enable auto top-up
              </p>
              <p className="text-[12px] text-zinc-500">
                Charges your card when balance dips below the threshold.
              </p>
            </div>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="h-5 w-5 accent-[#2563EB]"
            />
          </label>

          {/* Threshold + pack */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-zinc-500"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              >
                Top up when topup below
              </label>
              <select
                value={threshold}
                onChange={(e) =>
                  setThreshold(parseInt(e.target.value, 10) as ThresholdPreset)
                }
                disabled={!enabled}
                className="w-full rounded-xl border border-white/[0.08] bg-[#0a0a0a] px-3 py-2 text-[13px] text-zinc-100 focus:outline-none focus:border-white/[0.2] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {THRESHOLDS.map((t) => (
                  <option key={t} value={t} className="bg-[#0a0a0a]">
                    {t.toLocaleString()} credits
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-zinc-500"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              >
                Top up with
              </label>
              <select
                value={packKey}
                onChange={(e) => setPackKey(e.target.value as PackKey)}
                disabled={!enabled}
                className="w-full rounded-xl border border-white/[0.08] bg-[#0a0a0a] px-3 py-2 text-[13px] text-zinc-100 focus:outline-none focus:border-white/[0.2] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {PACKS.map((p) => (
                  <option key={p.key} value={p.key} className="bg-[#0a0a0a]">
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Monthly cap */}
          <div>
            <label
              className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-zinc-500"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              Monthly cap (USD) · safety limit
            </label>
            <div className="flex items-center gap-3">
              <div className="relative">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-zinc-500"
                  style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                >
                  $
                </span>
                <input
                  type="number"
                  min={5}
                  max={500}
                  step={5}
                  value={monthlyCap}
                  onChange={(e) => setMonthlyCap(parseInt(e.target.value, 10) || 0)}
                  disabled={!enabled}
                  className="w-32 rounded-xl border border-white/[0.08] bg-[#0a0a0a] py-2 pl-7 pr-3 text-[13px] text-zinc-100 focus:outline-none focus:border-white/[0.2] disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                />
              </div>
              <span
                className="text-[12px] text-zinc-500"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              >
                {config?.monthlySpentUsd
                  ? `$${config.monthlySpentUsd.toFixed(2)} spent this cycle`
                  : "$0.00 spent this cycle"}
              </span>
            </div>
          </div>

          {/* Last charge meta */}
          {config?.lastChargeAt ? (
            <p
              className="text-[12px] text-zinc-500"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              Last charged{" "}
              {new Date(config.lastChargeAt).toLocaleDateString()} at{" "}
              {new Date(config.lastChargeAt).toLocaleTimeString()}
            </p>
          ) : null}

          {/* Save button */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={save}
              disabled={saving}
              className="group inline-flex items-center gap-2 rounded-full bg-[#2563EB] px-5 py-2 text-[13px] font-medium text-white transition-all duration-200 hover:bg-[#1d4ed8] active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Saving…
                </>
              ) : (
                "Save changes"
              )}
            </button>
            {savedFlash && (
              <span className="inline-flex items-center gap-1 text-[12px] text-emerald-400">
                <Check size={13} strokeWidth={2.5} /> Saved
              </span>
            )}
          </div>

          {error && <p className="text-[12px] text-red-400">{error}</p>}
        </div>
      )}
    </div>
  );
}

function CardHeader() {
  return (
    <div
      className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-zinc-500"
      style={{ fontFamily: "var(--font-geist-mono), monospace" }}
    >
      <Zap size={13} />
      Auto top-up
    </div>
  );
}
