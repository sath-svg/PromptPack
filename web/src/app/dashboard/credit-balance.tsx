"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useSearchParams, useRouter } from "next/navigation";

const TOPUP_PACKS = [
  { key: "small", credits: 200, price: 4 },
  { key: "medium", credits: 500, price: 10 },
  { key: "large", credits: 1500, price: 30 },
  { key: "xl", credits: 5000, price: 100 },
] as const;

type PackKey = (typeof TOPUP_PACKS)[number]["key"];

export function CreditBalanceCard() {
  const { user } = useUser();
  const balance = useQuery(
    api.credits.getBalance,
    user?.id ? { clerkId: user.id } : "skip",
  );
  const transactions = useQuery(
    api.credits.listTransactions,
    user?.id ? { clerkId: user.id, limit: 20 } : "skip",
  );

  const searchParams = useSearchParams();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Auto-open top-up modal when ?topup=open is in the URL (deep-link from desktop)
  useEffect(() => {
    if (searchParams.get("topup") === "open") {
      setShowModal(true);
      router.replace("/dashboard");
    }
  }, [searchParams, router]);

  if (!balance) return null;

  const total = balance.monthly + balance.topup;
  const monthlyResetDate = balance.monthlyResetAt
    ? new Date(balance.monthlyResetAt).toLocaleDateString()
    : null;

  return (
    <>
      <div className="dashboard-card">
        <h2>AI Credits</h2>
        <p className="stat-value">{total.toLocaleString()}</p>
        <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
          {balance.monthly.toLocaleString()} monthly · {balance.topup.toLocaleString()} top-up
        </p>
        {monthlyResetDate && (
          <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.25rem" }}>
            Monthly resets {monthlyResetDate}
          </p>
        )}
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
          <button
            className="btn btn-primary"
            style={{ fontSize: "0.85rem", padding: "0.4rem 0.85rem" }}
            onClick={() => setShowModal(true)}
          >
            Buy credits
          </button>
          <button
            className="btn btn-secondary"
            style={{ fontSize: "0.85rem", padding: "0.4rem 0.85rem" }}
            onClick={() => setShowHistory((v) => !v)}
          >
            {showHistory ? "Hide history" : "View history"}
          </button>
        </div>

        {showHistory && transactions && (
          <div style={{ marginTop: "0.75rem", maxHeight: "240px", overflowY: "auto", fontSize: "0.85rem" }}>
            {transactions.length === 0 ? (
              <p style={{ color: "var(--muted)" }}>No transactions yet.</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0 }}>
                {transactions.map((tx) => (
                  <li
                    key={tx._id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "0.4rem 0",
                      borderBottom: "1px solid rgba(128,128,128,0.15)",
                    }}
                  >
                    <span>{describeTx(tx)}</span>
                    <span style={{ color: txColor(tx), fontFamily: "monospace" }}>
                      {formatDelta(tx)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {showModal && <TopupModal onClose={() => setShowModal(false)} />}
    </>
  );
}

function TopupModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState<PackKey | null>(null);

  const handleBuy = async (pack: PackKey) => {
    if (loading) return;
    setLoading(pack);
    try {
      const res = await fetch("/api/stripe/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error ?? "Checkout failed");
        setLoading(null);
        return;
      }
      const { url } = (await res.json()) as { url?: string };
      if (url) {
        window.location.href = url;
      } else {
        alert("Checkout URL missing");
        setLoading(null);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Checkout failed");
      setLoading(null);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg)",
          border: "1px solid rgba(128,128,128,0.3)",
          padding: "1.5rem",
          borderRadius: "1rem",
          maxWidth: "440px",
          width: "92%",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Buy credits</h2>
        <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "1rem" }}>
          Top-up credits never expire. Used after monthly credits run out.
        </p>
        <div style={{ display: "grid", gap: "0.6rem" }}>
          {TOPUP_PACKS.map((pack) => (
            <button
              key={pack.key}
              className="btn btn-secondary"
              disabled={loading !== null}
              onClick={() => handleBuy(pack.key)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "0.85rem 1rem",
                fontSize: "0.95rem",
              }}
            >
              <span>
                <strong>{pack.credits.toLocaleString()}</strong> credits
              </span>
              <span style={{ fontWeight: 600 }}>
                {loading === pack.key ? "Loading..." : `$${pack.price}`}
              </span>
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="btn btn-secondary"
          style={{ marginTop: "1rem", width: "100%" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function describeTx(tx: { kind: string; modelId?: string; reason?: string }): string {
  switch (tx.kind) {
    case "grant_signup":
      return "Free signup credits";
    case "grant_monthly":
      return tx.reason === "backfill" ? "Plan backfill" : "Monthly refresh";
    case "grant_topup":
      return "Top-up purchase";
    case "debit_llm":
      return tx.modelId ? `Used ${tx.modelId}` : "AI usage";
    case "hold_llm":
      return tx.modelId ? `Reserved for ${tx.modelId}` : "Pending call";
    case "release_hold":
      return "Refund (call failed)";
    case "expire_monthly":
      return "Monthly cap";
    case "refund":
      return "Refund";
    default:
      return tx.kind;
  }
}

function formatDelta(tx: { monthlyDelta: number; topupDelta: number }): string {
  const total = tx.monthlyDelta + tx.topupDelta;
  if (total === 0) return "0";
  return total > 0 ? `+${total}` : `${total}`;
}

function txColor(tx: { monthlyDelta: number; topupDelta: number }): string {
  const total = tx.monthlyDelta + tx.topupDelta;
  if (total > 0) return "#10b981";
  if (total < 0) return "#ef4444";
  return "var(--muted)";
}
