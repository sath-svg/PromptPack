import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Top up credits — Skillset",
  robots: { index: false, follow: false },
};

export default function TopupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
