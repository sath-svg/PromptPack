import type { Metadata } from "next";
import Script from "next/script";
import { AuthProvider } from "@/lib/auth-compat";
import { ConvexClientProvider } from "@/components/providers/convex-provider";
import { SupportButton } from "@/components/support-button";
import { PWARegister } from "@/components/pwa-register";
import { assetUrl } from "@/lib/constants";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://skillset.so'),
  title: "Skillset - Turn your prompts into reusable skills",
  description:
    "Save your prompts as portable skills. Use them across ChatGPT, Claude, Gemini, and your IDE — no memory transfers, no copy-paste. Free Chrome extension and desktop app.",
  keywords: [
    "Skillset",
    "AI skills",
    "AI prompts",
    "reusable prompts",
    "portable prompts",
    "ChatGPT prompts",
    "Claude prompts",
    "Gemini prompts",
    "prompt library",
    "prompt management",
    "save prompts",
    "AI prompt organizer",
    "prompt pack",
    "skill pack",
    "LLM prompts",
    "AI tools",
    "prompt sharing",
    "ChatGPT extension",
    "Claude extension",
    "Gemini extension",
    "PromptPack",
  ],
  authors: [{ name: "Skillset" }],
  creator: "Skillset",
  publisher: "Skillset",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Skillset - Turn your prompts into reusable skills",
    description: "Save your prompts as portable skills. Use them across ChatGPT, Claude, Gemini, and your IDE — no memory transfers, no copy-paste.",
    url: "https://skillset.so",
    siteName: "Skillset",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: assetUrl('/img/skillset_og.jpg'),
        width: 1200,
        height: 630,
        alt: "Skillset — Portable AI skills across every tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Skillset - Turn your prompts into reusable skills",
    description: "Save your prompts as portable skills. Use them across ChatGPT, Claude, Gemini, and your IDE — no memory transfers, no copy-paste.",
    images: [assetUrl('/img/skillset_og.jpg')],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
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
  alternates: {
    canonical: 'https://skillset.so',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <html lang="en">
        <head>
          <link rel="icon" type="image/png" sizes="16x16" href="/img/icon-16.png" />
          <link rel="icon" type="image/png" sizes="48x48" href="/img/icon-48.png" />
          <link rel="shortcut icon" href="/favicon.ico" />
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              alt=""
              src="https://px.ads.linkedin.com/collect/?pid=8748108&fmt=gif"
            />
          </noscript>
        </head>
        <body>
          <main className="main">
            <ConvexClientProvider>{children}</ConvexClientProvider>
          </main>
          <SupportButton />
          <PWARegister />
          <Script
            defer
            data-domain="skillset.so"
            src="https://analytics.skillset.so/js/script.file-downloads.hash.outbound-links.pageview-props.revenue.tagged-events.js"
          />
          <Script id="plausible-init">
            {`window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }`}
          </Script>
          <Script id="linkedin-insight" strategy="afterInteractive">
            {`window._linkedin_partner_id = "8748108";
window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
window._linkedin_data_partner_ids.push(window._linkedin_partner_id);`}
          </Script>
          <Script
            id="linkedin-insight-loader"
            strategy="afterInteractive"
            src="https://snap.licdn.com/li.lms-analytics/insight.min.js"
          />
        </body>
      </html>
    </AuthProvider>
  );
}
