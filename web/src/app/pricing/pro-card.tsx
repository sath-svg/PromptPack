"use client";

import { useState } from "react";
import { SignedIn, SignedOut, SignUpButton, useUser } from "@clerk/nextjs";
import { CheckoutButton } from "@clerk/nextjs/experimental";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";

const PRO_PLAN_ID = "cplan_37Cn3oopuz5AzG1NlC0clKTt0MQ";

export function ProCard() {
  const [isAnnual, setIsAnnual] = useState(true);
  const { user } = useUser();
  const convexUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const isPro = convexUser?.plan === "pro";

  const monthlyPrice = 9;
  const annualMonthlyPrice = 8.33;
  const savePct = Math.ceil((monthlyPrice * 12 - annualMonthlyPrice * 12) / (monthlyPrice * 12) * 100);

  return (
    <div
      style={{
        padding: "2rem",
        borderRadius: "1rem",
        border: "2px solid var(--accent)",
        background: "rgba(99, 102, 241, 0.05)",
        textAlign: "left",
        position: "relative",
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
          marginBottom: "2rem",
          lineHeight: "2",
        }}
      >
        <li>✓ 40 saved prompts</li>
        <li>✓ 5 loaded packs</li>
        <li>✓ Cloud sync</li>
        <li>✓ Priority support</li>
        <li>✓ Early access to features</li>
      </ul>

      <SignedOut>
        <SignUpButton mode="modal">
          <button className="btn btn-primary" style={{ width: "100%" }}>
            Start 3-day free trial
          </button>
        </SignUpButton>
      </SignedOut>
      <SignedIn>
        {isPro ? (
          <Link href="/dashboard">
            <button className="btn btn-primary" style={{ width: "100%" }}>
              Dashboard
            </button>
          </Link>
        ) : (
          <CheckoutButton
            planId={PRO_PLAN_ID}
            planPeriod={isAnnual ? "annual" : "month"}
          >
            <button className="btn btn-primary" style={{ width: "100%" }}>
              Start 3-day free trial
            </button>
          </CheckoutButton>
        )}
      </SignedIn>
    </div>
  );
}
