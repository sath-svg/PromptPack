"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import posthog from "posthog-js";
import { useSession } from "../../lib/auth-client";
import { setPostHogClient } from "@/lib/posthog";

// Logged-in routes where PostHog runs. Public/marketing pages stay on
// Plausible only so we don't double-instrument cookieless visitors.
const PRODUCT_PREFIXES = [
  "/skillset",
  "/prompts",
  "/feedback",
  "/subscribe",
  "/topup",
  "/mcp-auth",
  "/downloads",
];

function isProductRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return PRODUCT_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

let initialized = false;

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  useEffect(() => {
    if (initialized) return;
    if (typeof window === "undefined") return;
    if (!isProductRoute(pathname)) return;

    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
    if (!key) return;

    posthog.init(key, {
      api_host: host,
      capture_pageview: true,
      autocapture: true,
      person_profiles: "identified_only",
      capture_pageleave: true,
      // Session replay scoped to web logged-in surfaces only (PostHogProvider
      // gates this on PRODUCT_PREFIXES). Mask all inputs so passwords +
      // BYOK keys never make it into recordings. Fider iframe stays opaque.
      session_recording: {
        maskAllInputs: true,
        maskTextSelector: "[data-ph-no-capture]",
        recordCrossOriginIframes: false,
      },
      loaded: (ph) => {
        // Tag every event with surface = "web" so dashboards can split
        // web vs desktop without separate projects.
        ph.register({ surface: "web" });
      },
    });
    setPostHogClient(posthog);
    initialized = true;
  }, [pathname]);

  useEffect(() => {
    if (!initialized || !session?.user) return;
    posthog.identify(session.user.id, {
      email: session.user.email,
      name: session.user.name ?? undefined,
    });
  }, [session?.user?.id, session?.user?.email, session?.user?.name]);

  return <>{children}</>;
}
