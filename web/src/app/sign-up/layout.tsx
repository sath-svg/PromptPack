import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create your account — Skillset",
  robots: { index: false, follow: false },
};

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
