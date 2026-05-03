"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
} from "@clerk/nextjs";
import { assetUrl } from "@/lib/constants";
import { MobileNav } from "@/components/mobile-nav";
import { UserButtonWithExtensionSync } from "@/components/user-button-with-extension-sync";

// Hide global PromptPack chrome on routes that supply their own page-level nav.
const HIDDEN_ON: ReadonlyArray<string | RegExp> = ["/", "/pricing"];

export function SiteHeader() {
  const pathname = usePathname();
  const hidden = HIDDEN_ON.some((p) =>
    typeof p === "string" ? p === pathname : p.test(pathname),
  );
  if (hidden) return null;

  return (
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
          style={{ display: "block", marginRight: "auto", marginLeft: "0" }}
        />
      </Link>
      <nav className="header-nav">
        <SignedIn>
          <Link href="/dashboard" className="header-link">
            Dashboard
          </Link>
        </SignedIn>
        <SignedOut>
          <SignInButton mode="modal">
            <span className="header-link" style={{ cursor: "pointer" }}>
              Dashboard
            </span>
          </SignInButton>
        </SignedOut>
        <Link href="/downloads" className="header-link">
          Downloads
        </Link>
        <Link href="/marketplace" className="header-link">
          Marketplace
        </Link>
        <Link href="/tools" className="header-link">
          Tools
        </Link>
        <Link href="/pricing" className="header-link">
          Pricing
        </Link>
        <Link href="/blog" className="header-link">
          Blog
        </Link>
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
  );
}
