import type { Metadata } from "next";
import { LandingContent } from "@/components/landing/landing-content";

// The "information page": the full Skillset story. Reached after the trial
// checkout (Stripe success_url) and kept public so the detailed content stays
// crawlable even though the homepage (/) is now a gated teaser.
export const metadata: Metadata = {
  title: "Skillset · The only AI companion you need.",
  description:
    "Save your prompts as reusable skills, run any model, and ship faster in ChatGPT, Claude, Gemini, and Telegram. Start with a 3-day free trial.",
  alternates: { canonical: "https://skillset.so/overview" },
};

export default function OverviewPage() {
  return <LandingContent />;
}
