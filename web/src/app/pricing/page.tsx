"use client";

import { SignUpButton, SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import { ProCard } from "./pro-card";

export default function PricingPage() {
  const { user } = useUser();
  const convexUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const isPro = convexUser?.plan === "pro";

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
      <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
        Choose a plan that fits your needs.
      </h1>
      <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>
        Start free, upgrade for creative access.
      </p>

      <span
        style={{
          display: "inline-block",
          background: "linear-gradient(135deg, #f59e0b, #ef4444)",
          color: "white",
          padding: "0.4rem 1rem",
          borderRadius: "999px",
          fontSize: "0.85rem",
          fontWeight: "700",
          letterSpacing: "0.02em",
          marginBottom: "2.5rem",
          animation: "pulse-glow 2s ease-in-out infinite",
        }}
      >
        Only 9 spots left at $1.99/mo!
      </span>
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 8px rgba(245, 158, 11, 0.4); }
          50% { box-shadow: 0 0 20px rgba(245, 158, 11, 0.7); }
        }
      `}</style>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))",
          gap: "1.5rem",
        }}
      >
        {/* Free Plan */}
        <div
          style={{
            padding: "2rem",
            paddingBottom: "1.5rem",
            borderRadius: "1rem",
            border: "1px solid rgba(128,128,128,0.2)",
            textAlign: "left",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Free</h2>
          <div style={{ marginBottom: "0.5rem" }}>
            <p
              style={{
                fontSize: "2.5rem",
                fontWeight: "700",
                marginBottom: "0",
              }}
            >
              $0
              <span style={{ fontSize: "1rem", color: "var(--muted)" }}>
                /month
              </span>
            </p>
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--muted)",
                marginTop: "0.25rem",
                marginBottom: "0",
              }}
            >
              Forever free
            </p>
          </div>

          {/* Spacer to align with Pro billing toggle */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              height: "24px",
              marginBottom: "1.5rem",
              fontSize: "0.9rem",
              color: "var(--muted)",
            }}
          >
            <span style={{ position: "relative", top: "-2px" }}>💳</span>
            <span>No credit card required</span>
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
            <li>✓ 10 saved prompts</li>
            <li>✓ 3 loaded <span className="gradient-text">PromptPacks</span></li>
            <li>✓ 10 prompt enhances per day</li>
            <li>✓ 50 AI headers per day</li>
            <li>✓ Chrome, Firefox &amp; Safari extension</li>
            <li>✓ ChatGPT, Claude &amp; Gemini support</li>
            <li>✓ Local storage</li>
          </ul>

          <div style={{ marginTop: "auto" }}>
          <SignedOut>
            <SignUpButton mode="modal">
              <button className="btn btn-secondary" style={{ width: "100%" }}>
                Get Started
              </button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            {/* Show "Current Plan" only if user does NOT have pro plan */}
            {!isPro ? (
              <Link href="/dashboard">
                <button className="btn btn-secondary" style={{ width: "100%" }}>
                  Current Plan
                </button>
              </Link>
            ) : (
              <Link href="/dashboard">
                <button className="btn btn-secondary" style={{ width: "100%" }}>
                  View Dashboard
                </button>
              </Link>
            )}
          </SignedIn>
          </div>
        </div>

        {/* Pro Plan */}
        <ProCard />
      </div>
    </div>
  );
}
