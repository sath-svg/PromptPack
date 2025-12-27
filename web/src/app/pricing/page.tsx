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
        Simple Pricing
      </h1>
      <p style={{ color: "var(--muted)", marginBottom: "3rem" }}>
        Start free, upgrade when you need more
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {/* Free Plan */}
        <div
          style={{
            padding: "2rem",
            borderRadius: "1rem",
            border: "1px solid rgba(128,128,128,0.2)",
            textAlign: "left",
          }}
        >
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Free</h2>
          <p
            style={{
              fontSize: "2.5rem",
              fontWeight: "700",
              marginBottom: "1rem",
            }}
          >
            $0
            <span style={{ fontSize: "1rem", color: "var(--muted)" }}>
              /month
            </span>
          </p>

          <ul
            style={{
              listStyle: "none",
              marginBottom: "2rem",
              lineHeight: "2",
            }}
          >
            <li>✓ 10 saved prompts</li>
            <li>✓ 2 loaded packs</li>
            <li>✓ Chrome extension</li>
            <li>✓ Local storage</li>
          </ul>

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

        {/* Pro Plan */}
        <ProCard />
      </div>
    </div>
  );
}
