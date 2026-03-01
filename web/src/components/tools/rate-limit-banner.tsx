"use client";

import { SignUpButton } from "@clerk/nextjs";
import Link from "next/link";

interface RateLimitBannerProps {
  variant: "signup" | "upgrade";
}

export function RateLimitBanner({ variant }: RateLimitBannerProps) {
  if (variant === "signup") {
    return (
      <div
        style={{
          padding: "1.5rem",
          borderRadius: "8px",
          border: "1px solid #6366f1",
          background: "rgba(99, 102, 241, 0.08)",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 0.5rem" }}>
          You&apos;ve used your free try for today
        </p>
        <p style={{ color: "var(--muted-foreground)", margin: "0 0 1rem", fontSize: "0.95rem" }}>
          Sign up free to get 10 uses per day — no credit card required.
        </p>
        <SignUpButton mode="modal">
          <button className="btn btn-primary" style={{ padding: "0.6rem 2rem" }}>
            Sign Up Free
          </button>
        </SignUpButton>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "1.5rem",
        borderRadius: "8px",
        border: "1px solid #6366f1",
        background: "rgba(99, 102, 241, 0.08)",
        textAlign: "center",
      }}
    >
      <p style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 0.5rem" }}>
        Daily limit reached
      </p>
      <p style={{ color: "var(--muted-foreground)", margin: "0 0 1rem", fontSize: "0.95rem" }}>
        Upgrade to Pro for up to 100 uses per day plus advanced features.
      </p>
      <Link href="/pricing" className="btn btn-primary" style={{ padding: "0.6rem 2rem" }}>
        View Pricing
      </Link>
    </div>
  );
}
