import { PricingTable } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function SubscribePage() {
  const { userId } = await auth();

  // Redirect to sign-in if not authenticated
  if (!userId) {
    redirect("/sign-in?redirect_url=/subscribe");
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
        Upgrade to Pro
      </h1>
      <p style={{ color: "var(--muted)", marginBottom: "2rem" }}>
        Get more prompts, more packs, and cloud sync
      </p>

      <PricingTable />
    </div>
  );
}
