import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Desktop sign-in — Skillset",
  robots: { index: false, follow: false },
};

export default function DesktopAuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
