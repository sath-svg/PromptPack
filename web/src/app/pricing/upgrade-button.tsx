"use client";

import { useState } from "react";
import { SignedIn } from "@/lib/auth-compat";
import { startStripeCheckout } from "@/lib/billing-client";
import { TRIAL_SUCCESS_PATH } from "@/lib/cta";

export function UpgradeButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await startStripeCheckout({
        interval: "annual",
        plan: "pro",
        trial: true,
        successPath: TRIAL_SUCCESS_PATH,
      });
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
