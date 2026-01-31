"use client";

import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { useState } from "react";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className="mobile-nav-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle navigation menu"
        aria-expanded={isOpen}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {isOpen ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <>
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </>
          )}
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="mobile-nav-overlay"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <nav className="mobile-nav-menu">
            <Link
              href="/downloads"
              className="mobile-nav-link"
              onClick={() => setIsOpen(false)}
            >
              Downloads
            </Link>
            <Link
              href="/marketplace"
              className="mobile-nav-link"
              onClick={() => setIsOpen(false)}
            >
              Marketplace
            </Link>
            <Link
              href="/pricing"
              className="mobile-nav-link"
              onClick={() => setIsOpen(false)}
            >
              Pricing
            </Link>
            <SignedIn>
              <Link
                href="/dashboard"
                className="mobile-nav-link"
                onClick={() => setIsOpen(false)}
              >
                Dashboard
              </Link>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <span
                  className="mobile-nav-link"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard
                </span>
              </SignInButton>
            </SignedOut>
          </nav>
        </>
      )}
    </>
  );
}
