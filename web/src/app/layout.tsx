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
import Image from "next/image";
import { ConvexClientProvider } from "@/components/providers/convex-provider";
import { UserButtonWithExtensionSync } from "@/components/user-button-with-extension-sync";
import { SupportButton } from "@/components/support-button";
import { MobileNav } from "@/components/mobile-nav";
import { assetUrl } from "@/lib/constants";
import "./globals.css";

export const metadata: Metadata = {
  title: "PromptPack - Save, Organize & Share AI Prompts",
  description:
    "Save your best prompts from ChatGPT, Claude, and Gemini. Organize them into packs and share with the community.",
  icons: {
    icon: assetUrl('/img/icon-16.png'),
  },
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
            <MobileNav />

            <Link href="/" className="header-logo">
            <Image
              src={assetUrl("/img/logo_text.png")}
              alt="PromptPack"
              width={200}
              height={40}
              priority
              className="header-logo-image"
              style={{
                display: "block",
                marginRight: "auto",
                marginLeft: "0"
              }}
            />
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
