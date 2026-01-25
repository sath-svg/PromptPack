import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing - PromptPack Free & Pro Plans",
  description: "Choose the right PromptPack plan for you. Free plan includes 10 saved prompts and Chrome extension. Pro unlocks unlimited prompts, PromptPack creation, and encryption.",
  alternates: {
    canonical: "https://pmtpk.com/pricing",
  },
  openGraph: {
    title: "Pricing - PromptPack Free & Pro Plans",
    description: "Choose the right PromptPack plan for you. Free plan includes 10 saved prompts. Pro unlocks unlimited prompts and PromptPack creation.",
    url: "https://pmtpk.com/pricing",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
