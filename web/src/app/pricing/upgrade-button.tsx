"use client";

import { SignedIn } from "@clerk/nextjs";
import { CheckoutButton } from "@clerk/nextjs/experimental";

const PRO_PLAN_ID = "cplan_37Cn3oopuz5AzG1NlC0clKTt0MQ";

export function UpgradeButton() {
  return (
    <SignedIn>
      <CheckoutButton planId={PRO_PLAN_ID} planPeriod="annual">
        <button className="btn btn-primary" style={{ width: "100%" }}>
          Upgrade to Pro
        </button>
      </CheckoutButton>
    </SignedIn>
  );
}
