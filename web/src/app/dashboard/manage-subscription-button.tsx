"use client";

import { useClerk } from "@clerk/nextjs";

export function ManageSubscriptionButton() {
  const clerk = useClerk();

  const handleManage = async () => {
    // Open Clerk's subscription management portal
    await clerk.openUserProfile({
      appearance: {
        elements: {
          rootBox: {
            width: "100%",
          },
        },
      },
    });
  };

  return (
    <p>
      <button
        onClick={handleManage}
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
        Manage subscription
      </button>
    </p>
  );
}
