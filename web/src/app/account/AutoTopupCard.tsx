"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Zap, CreditCard, AlertTriangle, Check, Loader2 } from "lucide-react";
import { api } from "../../../convex/_generated/api";

/**
 * Auto top-up card on /account. Visible whenever a user is signed in.
 *
 * States:
 *   - No card on file → "Set up auto top-up" button → /api/stripe/auto-topup-setup
 *   - Card on file, disabled → toggle + threshold + pack pickers
 *   - Card on file, enabled → same controls + last-charge meta
 *   - Charge failed recently → red banner with reason
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
      <div className="rounded-2xl border border-neutral-200 bg-white p-5">
        <CardHeader />
        <p className="text-sm text-neutral-400">Loading…</p>
      </div>
    );
  }

  const hasCard = config !== null && config.hasPaymentMethod;
  const recentlyFailed =
    config !== null &&
    (config.consecutiveFailures ?? 0) > 0 &&
    config.lastFailureReason;

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 md:col-span-2">
      <CardHeader />

      {postSetupBanner === "saved" && (
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          <Check size={14} className="mt-0.5 shrink-0" />
          <span>Card saved. Toggle auto top-up on below.</span>
        </div>
      )}
      {postSetupBanner === "cancelled" && (
        <div className="mb-3 text-xs text-neutral-500">
          Card setup cancelled.
        </div>
      )}

      {recentlyFailed && (
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Last charge failed</p>
            <p className="mt-0.5">
              Reason: <span className="font-mono">{config?.lastFailureReason}</span>
              {(config?.consecutiveFailures ?? 0) >= 3
                ? " · Auto top-up has been disabled. Re-enable below after fixing your card."
                : ""}
            </p>
          </div>
        </div>
      )}

      {!hasCard ? (
        <div>
          <p className="text-sm text-neutral-600 mb-4">
            Save a card and we'll automatically top up your credits when your
            balance drops below your chosen threshold. You can change the
            threshold or turn it off at any time.
          </p>
          <button
            onClick={startSetup}
            disabled={setupLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
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
          {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Saved card row */}
          <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
            <div className="flex items-center gap-2 text-sm text-neutral-700">
              <CreditCard size={14} className="text-neutral-500" />
              <span className="capitalize">{config?.cardBrand ?? "card"}</span>
              <span className="font-mono text-neutral-500">
                •••• {config?.cardLast4 ?? "????"}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={startSetup}
                disabled={setupLoading || saving}
                className="text-xs text-neutral-600 underline hover:text-neutral-900 disabled:opacity-50"
              >
                {setupLoading ? "…" : "Change card"}
              </button>
              <button
                onClick={handleDisconnect}
                disabled={saving}
                className="text-xs text-red-600 underline hover:text-red-700 disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          </div>

          {/* Enable toggle */}
          <label className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 cursor-pointer">
            <div>
              <p className="text-sm font-medium text-neutral-900">
                Enable auto top-up
              </p>
              <p className="text-xs text-neutral-500">
                Charges your card when balance dips below the threshold.
              </p>
            </div>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-5 h-5 accent-emerald-600"
            />
          </label>

          {/* Threshold + pack */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">
                Top up when topup credits fall below
              </label>
              <select
                value={threshold}
                onChange={(e) =>
                  setThreshold(parseInt(e.target.value, 10) as ThresholdPreset)
                }
                disabled={!enabled}
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-900 disabled:opacity-50"
              >
                {THRESHOLDS.map((t) => (
                  <option key={t} value={t}>
                    {t.toLocaleString()} credits
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">
                Top up with
              </label>
              <select
                value={packKey}
                onChange={(e) => setPackKey(e.target.value as PackKey)}
                disabled={!enabled}
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-900 disabled:opacity-50"
              >
                {PACKS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Monthly cap */}
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">
              Monthly spend cap (USD) — safety limit
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={5}
                max={500}
                step={5}
                value={monthlyCap}
                onChange={(e) => setMonthlyCap(parseInt(e.target.value, 10) || 0)}
                disabled={!enabled}
                className="w-32 px-3 py-2 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-900 disabled:opacity-50"
              />
              <span className="text-xs text-neutral-500">
                {config?.monthlySpentUsd
                  ? `$${config.monthlySpentUsd.toFixed(2)} spent this cycle`
                  : "$0.00 spent this cycle"}
              </span>
            </div>
          </div>

          {/* Last charge meta */}
          {config?.lastChargeAt ? (
            <p className="text-xs text-neutral-500">
              Last charged{" "}
              {new Date(config.lastChargeAt).toLocaleDateString()} at{" "}
              {new Date(config.lastChargeAt).toLocaleTimeString()}.
            </p>
          ) : null}

          {/* Save button */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-700 disabled:opacity-50"
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
              <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                <Check size={13} /> Saved
              </span>
            )}
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}

function CardHeader() {
  return (
    <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-[0.18em] text-neutral-500">
      <Zap size={13} />
      Auto top-up
    </div>
  );
}
