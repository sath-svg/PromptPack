"use client";

import { useState } from "react";
import { openStripeCustomerPortal } from "@/lib/billing-client";

export function ManageSubscriptionButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleManage = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await openStripeCustomerPortal();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to open billing portal");
      setIsLoading(false);
    }
  };

  return (
    <p>
      <button
        onClick={handleManage}
        disabled={isLoading}
        style={{
          background: "none",
          border: "none",
          color: "var(--accent)",
          textDecoration: "underline",
          cursor: "pointer",
          padding: 0,
          font: "inherit",
        }}
      >
        {isLoading ? "Opening portal..." : "Manage subscription"}
      </button>
    </p>
  );
}
