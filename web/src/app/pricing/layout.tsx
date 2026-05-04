import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Skillset Free & Pro Plans",
  description: "Pick a Skillset plan. Free includes 5 saved prompts. Pro unlocks 40 prompts, PromptControl, and the cross-model skill router.",
  alternates: {
    canonical: "https://skillset.so/pricing",
  },
  openGraph: {
    title: "Pricing — Skillset Free & Pro Plans",
    description: "Pick a Skillset plan. Free includes 5 saved prompts. Pro unlocks 40 prompts and PromptControl.",
    url: "https://skillset.so/pricing",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
