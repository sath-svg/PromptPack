"use client";

import { useState } from "react";
import { SignedIn, SignedOut, SignUpButton, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import { startStripeCheckout } from "@/lib/billing-client";

const EARLY_BIRD_LIMIT = 9;
const EARLY_BIRD_PRICE = 1.99;

export function ProCard() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const { user } = useUser();
  const convexUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const proUserCount = useQuery(api.users.countProUsers) ?? 0;

  const isPro = convexUser?.plan === "pro";
  const isEarlyBird = proUserCount < EARLY_BIRD_LIMIT;
  const spotsLeft = Math.max(0, EARLY_BIRD_LIMIT - proUserCount);

  const monthlyPrice = 9;
  const annualMonthlyPrice = 8.33;
  const savePct = Math.ceil((monthlyPrice * 12 - annualMonthlyPrice * 12) / (monthlyPrice * 12) * 100);

  const displayPrice = isEarlyBird ? EARLY_BIRD_PRICE : (isAnnual ? annualMonthlyPrice : monthlyPrice);
  const originalPrice = isAnnual ? monthlyPrice : monthlyPrice;
  const showStrikethrough = isEarlyBird || isAnnual;

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
          background: isEarlyBird && !isPro ? "#f59e0b" : "var(--accent)",
          color: "white",
          padding: "0.25rem 0.75rem",
          borderRadius: "999px",
          fontSize: "0.75rem",
          fontWeight: "600",
        }}
      >
        {isPro ? "CURRENT PLAN" : isEarlyBird ? "EARLY BIRD — 9 spots left" : "POPULAR"}
      </span>

      <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Pro</h2>

      {/* Price display */}
      <div style={{ marginBottom: "0.5rem" }}>
        <p
          style={{
            fontSize: "2.5rem",
            fontWeight: "700",
            marginBottom: "0",
          }}
        >
          {isEarlyBird && isAnnual ? (
            <>
              <span
                style={{
                  textDecoration: "line-through",
                  color: "#9ca3af",
                  fontSize: "1.5rem",
                  marginRight: "0.35rem",
                }}
              >
                ${monthlyPrice}
              </span>
              <span
                style={{
                  textDecoration: "line-through",
                  color: "#b0b0b0",
                  fontSize: "1.5rem",
                  marginRight: "0.5rem",
                }}
              >
                ${annualMonthlyPrice}
              </span>
            </>
          ) : showStrikethrough ? (
            <span
              style={{
                textDecoration: "line-through",
                color: "#9ca3af",
                fontSize: "1.5rem",
                marginRight: "0.5rem",
              }}
            >
              ${originalPrice}
            </span>
          ) : null}
          <span
            style={isEarlyBird ? {
              background: "linear-gradient(135deg, #f59e0b, #ef4444)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 0 8px rgba(245, 158, 11, 0.5))",
            } : undefined}
          >
            ${displayPrice}
          </span>
          <span style={{ fontSize: "1rem", color: "var(--muted)" }}>
            /month
          </span>
        </p>
        {isEarlyBird && !isPro && (
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--muted)",
              marginTop: "0.25rem",
              marginBottom: "0",
            }}
          >
            *for the first 6 months, then ${isAnnual ? `${annualMonthlyPrice}/mo` : `${monthlyPrice}/mo`}
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
        {/* Aligned with Free plan */}
        <li>✓ <span className="faq-highlight">40</span> saved prompts</li>
        <li>✓ 3 loaded <span className="gradient-text">PromptPacks</span></li>
        <li>✓ <span className="faq-highlight">100</span> prompt enhances per day</li>
        <li>✓ <span className="faq-highlight">500</span> AI headers per day</li>
        <li>✓ Chrome, Firefox &amp; Safari extension</li>
        <li>✓ ChatGPT, Claude &amp; Gemini support</li>
        <li>✓ Local storage + <span className="faq-highlight">Cloud sync</span></li>
        {/* Pro-only features */}
        <li>✓ <span className="faq-highlight">2</span> custom <span className="gradient-text">PromptPacks</span></li>
        <li>✓ <span style={{ color: "#20B8CD" }}>Perplexity</span>, Grok, <span style={{ color: "#4D6BFE" }}>DeepSeek</span>, <span style={{ color: "#6B4FBB" }}>Kimi</span> support</li>
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
