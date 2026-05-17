import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Signing out — Skillset",
  robots: { index: false, follow: false },
};

export default function SignOutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
