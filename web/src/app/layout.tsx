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
  metadataBase: new URL('https://pmtpk.com'),
  title: "PromptPack - Save, Organize & Share AI Prompts for ChatGPT, Claude & Gemini",
  description:
    "Save and organize your best AI prompts from ChatGPT, Claude, and Gemini. Build reusable prompt libraries, create PromptPacks, and discover community prompts. Free Chrome extension.",
  keywords: [
    "PromptPack",
    "AI prompts",
    "ChatGPT prompts",
    "Claude prompts",
    "Gemini prompts",
    "prompt library",
    "prompt management",
    "save prompts",
    "AI prompt organizer",
    "prompt pack",
    "LLM prompts",
    "AI tools",
    "prompt sharing",
    "ChatGPT extension",
    "Claude extension",
    "Gemini extension"
  ],
  authors: [{ name: "PromptPack" }],
  creator: "PromptPack",
  publisher: "PromptPack",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "PromptPack - Save, Organize & Share AI Prompts for ChatGPT, Claude & Gemini",
    description: "Save and organize your best AI prompts from ChatGPT, Claude, and Gemini. Build reusable prompt libraries and discover community prompts.",
    url: "https://pmtpk.com",
    siteName: "PromptPack",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: assetUrl('/img/icon-512.png'),
        width: 512,
        height: 512,
        alt: "PromptPack - AI Prompt Management Tool",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "PromptPack - Save, Organize & Share AI Prompts for ChatGPT, Claude & Gemini",
    description: "Save and organize your best AI prompts from ChatGPT, Claude, and Gemini. Build reusable prompt libraries and discover community prompts.",
    images: [assetUrl('/img/icon-512.png')],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16', type: 'image/x-icon' },
      { url: '/img/icon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/img/icon-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/img/icon-128.png', sizes: '128x128', type: 'image/png' },
    ],
    shortcut: ['/favicon.ico'],
    apple: [
      { url: '/img/icon-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/img/icon-128.png', sizes: '128x128', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification codes here when you set up Google Search Console
    // google: 'your-google-verification-code',
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
        <head>
          <link rel="icon" type="image/png" sizes="16x16" href="/img/icon-16.png" />
          <link rel="icon" type="image/png" sizes="48x48" href="/img/icon-48.png" />
          <link rel="shortcut icon" href="/favicon.ico" />
        </head>
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
              <SignedOut>
                <SignInButton mode="modal">
                  <span className="header-link" style={{ cursor: 'pointer' }}>
                    Dashboard
                  </span>
                </SignInButton>
              </SignedOut>
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
