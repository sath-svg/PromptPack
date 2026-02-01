"use client";

import { useState } from "react";
import { SignedIn, SignedOut, SignUpButton, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import { startStripeCheckout } from "@/lib/billing-client";

export function StudioCard() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const { user } = useUser();
  const convexUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const isStudio = convexUser?.plan === "studio";
  const isPro = convexUser?.plan === "pro";

  const monthlyPrice = 49;
  const annualPrice = 399;
  const annualMonthlyPrice = (annualPrice / 12).toFixed(2);
  const savePct = Math.ceil((monthlyPrice * 12 - annualPrice) / (monthlyPrice * 12) * 100);

  const displayPrice = isAnnual ? annualMonthlyPrice : monthlyPrice;

  const handleCheckout = async () => {
    if (isCheckoutLoading) return;
    setIsCheckoutLoading(true);
    try {
      await startStripeCheckout(isAnnual ? "annual" : "month", "studio");
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
        border: "2px solid #8b5cf6",
        background: "rgba(139, 92, 246, 0.05)",
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
          background: isStudio ? "#8b5cf6" : "linear-gradient(135deg, #8b5cf6, #d946ef)",
          color: "white",
          padding: "0.25rem 0.75rem",
          borderRadius: "999px",
          fontSize: "0.75rem",
          fontWeight: "600",
        }}
      >
        {isStudio ? "CURRENT PLAN" : "POWER USER"}
      </span>

      <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Studio</h2>

      {/* Price display */}
      <div style={{ marginBottom: "0.5rem" }}>
        <p
          style={{
            fontSize: "2.5rem",
            fontWeight: "700",
            marginBottom: "0",
          }}
        >
          {isAnnual && (
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
          )}
          <span
            style={{
              background: "linear-gradient(135deg, #8b5cf6, #d946ef)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            ${displayPrice}
          </span>
          <span style={{ fontSize: "1rem", color: "var(--muted)" }}>
            /month
          </span>
        </p>
        {isAnnual && (
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--muted)",
              marginTop: "0.25rem",
              marginBottom: "0",
            }}
          >
            Billed ${annualPrice}/year
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
            background: isAnnual ? "#8b5cf6" : "rgba(128,128,128,0.3)",
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
        <li>✓ Everything in Pro</li>
        <li>✓ <span style={{ background: "linear-gradient(135deg, #8b5cf6, #d946ef)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: "600" }}>Unlimited</span> custom <span className="gradient-text">PromptPacks</span></li>
        <li>✓ <span className="faq-highlight">200</span> saved prompts</li>
        <li>✓ <span className="faq-highlight">500</span> prompt enhances per day</li>
        <li>✓ <span className="faq-highlight">2000</span> AI headers per day</li>
        <li>✓ <span style={{ background: "linear-gradient(135deg, #8b5cf6, #d946ef)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: "600" }}>MCP server</span> <span style={{ fontSize: "0.7rem", background: "#8b5cf6", color: "white", padding: "0.1rem 0.3rem", borderRadius: "4px", marginLeft: "0.25rem" }}>SOON</span></li>
        <li>✓ <span style={{ background: "linear-gradient(135deg, #8b5cf6, #d946ef)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: "600" }}>API key</span> <span style={{ fontSize: "0.7rem", background: "#8b5cf6", color: "white", padding: "0.1rem 0.3rem", borderRadius: "4px", marginLeft: "0.25rem" }}>SOON</span></li>
        <li>✓ <span style={{ background: "linear-gradient(135deg, #8b5cf6, #d946ef)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: "600" }}>Claude Skill</span> <span style={{ fontSize: "0.7rem", background: "#8b5cf6", color: "white", padding: "0.1rem 0.3rem", borderRadius: "4px", marginLeft: "0.25rem" }}>SOON</span></li>
        <li>✓ <span style={{ background: "linear-gradient(135deg, #8b5cf6, #d946ef)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: "600" }}>GPT Action</span> <span style={{ fontSize: "0.7rem", background: "#8b5cf6", color: "white", padding: "0.1rem 0.3rem", borderRadius: "4px", marginLeft: "0.25rem" }}>SOON</span></li>
        <li>✓ <span style={{ background: "linear-gradient(135deg, #8b5cf6, #d946ef)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: "600" }}>Priority app access</span></li>
        <li>✓ Priority support + beta features</li>
      </ul>

      <div style={{ marginTop: "auto" }}>
        <SignedIn>
          {isStudio ? (
            <Link href="/dashboard">
              <button
                className="btn"
                style={{
                  width: "100%",
                  background: "linear-gradient(135deg, #8b5cf6, #d946ef)",
                  color: "white",
                  border: "none",
                }}
              >
                Dashboard
              </button>
            </Link>
          ) : (
            <button
              className="btn"
              style={{
                width: "100%",
                background: "linear-gradient(135deg, #8b5cf6, #d946ef)",
                color: "white",
                border: "none",
              }}
              onClick={handleCheckout}
              disabled={isCheckoutLoading}
            >
              {isCheckoutLoading ? "Starting checkout..." : (isPro ? "Upgrade to Studio" : "Get Studio")}
            </button>
          )}
        </SignedIn>
        <SignedOut>
          <SignUpButton mode="modal">
            <button
              className="btn"
              style={{
                width: "100%",
                background: "linear-gradient(135deg, #8b5cf6, #d946ef)",
                color: "white",
                border: "none",
              }}
            >
              Get Studio
            </button>
          </SignUpButton>
        </SignedOut>
      </div>
    </div>
  );
}
