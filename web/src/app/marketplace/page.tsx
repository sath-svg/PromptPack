import type { Metadata } from "next";
import { MarketplaceContent } from "./marketplace-content";

export const metadata: Metadata = {
  title: "PromptPack Marketplace - Discover & Share AI Prompts",
  description: "Browse and discover curated AI prompt packs and style presets from the community. Find prompts for ChatGPT, Claude, and Gemini to boost your productivity.",
  alternates: {
    canonical: "https://pmtpk.com/marketplace",
  },
  openGraph: {
    title: "PromptPack Marketplace - Discover & Share AI Prompts",
    description: "Browse and discover curated AI prompt packs and style presets from the community. Find prompts for ChatGPT, Claude, and Gemini.",
    url: "https://pmtpk.com/marketplace",
  },
};

export default function MarketplacePage() {
  return <MarketplaceContent />;
}
