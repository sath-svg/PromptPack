import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Desktop callback — Skillset",
  robots: { index: false, follow: false },
};

export default function DesktopCallbackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
