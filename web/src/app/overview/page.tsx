import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LandingContent } from "@/components/landing/landing-content";
import { auth } from "@/lib/auth-server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// The "information page": the full Skillset story. Pro/Studio only — reached
// after the trial checkout. Gated (not crawlable), so noindex.
export const metadata: Metadata = {
  title: "Skillset · The only AI companion you need.",
  description:
    "Save your prompts as reusable skills, run any model, and ship faster in ChatGPT, Claude, Gemini, and Telegram.",
  robots: { index: false, follow: false },
};

export default async function OverviewPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?callback=/overview");

  let paid = false;
  try {
    const u = await convex.query(api.users.getByUserId, { userId });
    paid = !!u && (u.plan === "pro" || u.plan === "studio");
  } catch {
    /* ignore — treat as unpaid below */
  }
  if (!paid) redirect("/pricing");

  return <LandingContent />;
}
