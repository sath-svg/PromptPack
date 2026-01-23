"use client";

import { useState } from "react";
import { SignedIn, SignedOut, SignUpButton, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import { startStripeCheckout } from "@/lib/billing-client";

export function ProCard() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const { user } = useUser();
  const convexUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const isPro = convexUser?.plan === "pro";

  const monthlyPrice = 9;
  const annualMonthlyPrice = 8.33;
  const savePct = Math.ceil((monthlyPrice * 12 - annualMonthlyPrice * 12) / (monthlyPrice * 12) * 100);

  const handleCheckout = async () => {
    if (isCheckoutLoading) return;
    setIsCheckoutLoading(true);
    try {
      await startStripeCheckout(isAnnual ? "annual" : "month");
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Checkout failed");
      setIsCheckoutLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: "2rem",
        paddingBottom: "1.5rem",
        borderRadius: "1rem",
        border: "2px solid var(--accent)",
        background: "rgba(99, 102, 241, 0.05)",
        textAlign: "left",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: "-12px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "var(--accent)",
          color: "white",
          padding: "0.25rem 0.75rem",
          borderRadius: "999px",
          fontSize: "0.75rem",
          fontWeight: "600",
        }}
      >
        {isPro ? "CURRENT PLAN" : "POPULAR"}
      </span>

      <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Pro</h2>

      {/* Price display */}
      <div style={{ marginBottom: "0.5rem" }}>
        {isAnnual ? (
          <p
            style={{
              fontSize: "2.5rem",
              fontWeight: "700",
              marginBottom: "0",
            }}
          >
            <span
              style={{
                textDecoration: "line-through",
                color: "#9ca3af",
                fontSize: "1.5rem",
                marginRight: "0.5rem",
              }}
            >
              ${monthlyPrice}
            </span>
            ${annualMonthlyPrice}
            <span style={{ fontSize: "1rem", color: "var(--muted)" }}>
              /month
            </span>
          </p>
        ) : (
          <p
            style={{
              fontSize: "2.5rem",
              fontWeight: "700",
              marginBottom: "0",
            }}
          >
            ${monthlyPrice}
            <span style={{ fontSize: "1rem", color: "var(--muted)" }}>
              /month
            </span>
          </p>
        )}
      </div>

      {/* Billing toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <button
          onClick={() => setIsAnnual(!isAnnual)}
          style={{
            width: "44px",
            height: "24px",
            borderRadius: "12px",
            background: isAnnual ? "var(--accent)" : "rgba(128,128,128,0.3)",
            border: "none",
            cursor: "pointer",
            position: "relative",
            transition: "background 0.2s",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: "2px",
              left: isAnnual ? "22px" : "2px",
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              background: "white",
              transition: "left 0.2s",
            }}
          />
        </button>
          <span style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
              {isAnnual ? `Billed annually (Save ${savePct}%)` : "Billed monthly"}
          </span>
      </div>

      <ul
        style={{
          listStyle: "none",
          marginBottom: "1.5rem",
          lineHeight: "1.8",
          fontSize: "0.95rem",
          flex: "1",
        }}
      >
        <li>✓ 40 saved prompts</li>
        <li>✓ 3 loaded <span className="gradient-text">PromptPacks</span></li>
        <li>✓ <span className="faq-highlight">2</span> custom <span className="gradient-text">PromptPacks</span></li>
        <li>✓ <span className="faq-highlight">100</span> prompt enhances per day</li>
        <li>✓ <span className="faq-highlight">500</span> AI headers per day</li>
        <li>✓ Chrome extension</li>
        <li>✓ Local storage</li>
        <li>✓ Cloud sync</li>
        <li>✓ Priority support</li>
        <li>✓ Early access to features</li>
      </ul>

      <div style={{ marginTop: "auto" }}>
        <SignedIn>
          {isPro ? (
            <Link href="/dashboard">
              <button className="btn btn-primary" style={{ width: "100%" }}>
                Dashboard
              </button>
            </Link>
          ) : (
            <button
              className="btn btn-primary"
              style={{ width: "100%" }}
              onClick={handleCheckout}
              disabled={isCheckoutLoading}
            >
              {isCheckoutLoading ? "Starting checkout..." : "Start 3-day free trial"}
            </button>
          )}
        </SignedIn>
        <SignedOut>
          <SignUpButton mode="modal">
            <button className="btn btn-primary" style={{ width: "100%" }}>
              Start 3-day free trial
            </button>
          </SignUpButton>
        </SignedOut>
      </div>
    </div>
  );
}
