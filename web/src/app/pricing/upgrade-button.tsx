"use client";

import { useState } from "react";
import { SignedIn } from "@clerk/nextjs";
import { startStripeCheckout } from "@/lib/billing-client";

export function UpgradeButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await startStripeCheckout("annual");
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Checkout failed");
      setIsLoading(false);
    }
  };

  return (
    <SignedIn>
      <button
        className="btn btn-primary"
        style={{ width: "100%" }}
        onClick={handleUpgrade}
        disabled={isLoading}
      >
        {isLoading ? "Starting checkout..." : "Upgrade to Pro"}
      </button>
    </SignedIn>
  );
}
