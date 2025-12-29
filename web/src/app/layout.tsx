import type { Metadata } from "next";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
} from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import Link from "next/link";
import { ConvexClientProvider } from "@/components/providers/convex-provider";
import { UserButtonWithExtensionSync } from "@/components/user-button-with-extension-sync";
import { SupportButton } from "@/components/support-button";
import "./globals.css";

export const metadata: Metadata = {
  title: "PromptPack - Save, Organize & Share AI Prompts",
  description:
    "Save your best prompts from ChatGPT, Claude, and Gemini. Organize them into packs and share with the community.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="en">
        <body>
          <header className="header">
            <Link href="/" className="header-logo">
              PromptPack
            </Link>

            <nav className="header-nav">
              <Link href="/marketplace" className="header-link">
                Marketplace
              </Link>
              <Link href="/pricing" className="header-link">
                Pricing
              </Link>
              <SignedIn>
                <Link href="/dashboard" className="header-link">
                  Dashboard
                </Link>
              </SignedIn>
            </nav>

            <div className="header-auth">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="btn btn-secondary">Sign In</button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="btn btn-primary">Get Started</button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <UserButtonWithExtensionSync />
              </SignedIn>
            </div>
          </header>

          <main className="main">
            <ConvexClientProvider>{children}</ConvexClientProvider>
          </main>
          <SupportButton />
        </body>
      </html>
    </ClerkProvider>
  );
}
