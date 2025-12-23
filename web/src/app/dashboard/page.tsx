import { currentUser, auth } from "@clerk/nextjs/server";
import { Protect } from "@clerk/nextjs";
import Link from "next/link";
import { ManageSubscriptionButton } from "./manage-subscription-button";

export default async function DashboardPage() {
  const user = await currentUser();
  const { has } = await auth();

  // Check if user has Pro plan
  const hasPro = await has({ plan: "pro" });

  // Set limits based on plan
  const promptLimit = hasPro ? 40 : 10;
  const packLimit = hasPro ? 5 : 2;

  return (
    <div className="dashboard">
      <h1>Welcome back, {user?.firstName || "there"}!</h1>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h2>Saved Prompts</h2>
          <p className="stat-value">0</p>
          <p>of {promptLimit} {hasPro ? "pro" : "free"} prompts used</p>
        </div>

        <div className="dashboard-card">
          <h2>Loaded Packs</h2>
          <p className="stat-value">0</p>
          <p>of {packLimit} {hasPro ? "pro" : "free"} pack slots used</p>
        </div>

        <div className="dashboard-card">
          <h2>Current Plan</h2>
          <Protect
            plan="pro"
            fallback={
              <>
                <p className="stat-value">Free</p>
                <p>
                  <Link
                    href="/pricing"
                    style={{ color: "var(--accent)", textDecoration: "underline" }}
                  >
                    Upgrade to Pro
                  </Link>
                </p>
              </>
            }
          >
            <p className="stat-value" style={{ color: "#8b5cf6" }}>Pro</p>
            <ManageSubscriptionButton />
          </Protect>
        </div>

        <div className="dashboard-card">
          <h2>Purchased Packs</h2>
          <p className="stat-value">0</p>
          <p>
            <Link
              href="/marketplace"
              style={{ color: "var(--accent)", textDecoration: "underline" }}
            >
              Browse marketplace
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
