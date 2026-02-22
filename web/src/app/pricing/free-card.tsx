"use client";

import { SignedIn, SignedOut, SignUpButton, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";

export function FreeCard() {
  const { user } = useUser();
  const convexUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const isPaidPlan = convexUser?.plan === "pro" || convexUser?.plan === "studio";

  return (
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

      {/* Spacer to align with Pro/Studio billing toggle */}
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
        <li>✓ Desktop app</li>
        <li>✓ MCP server <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>(50 calls/day)</span></li>
        <li>✓ Chrome, Firefox &amp; Safari extension</li>
        <li>✓ ChatGPT, Claude &amp; Gemini support</li>
        <li>✓ Local storage + <span className="faq-highlight">Cloud sync</span></li>
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
          {!isPaidPlan ? (
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
  );
}
