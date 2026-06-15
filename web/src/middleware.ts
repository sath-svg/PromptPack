import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Security headers
const securityHeaders = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

function addSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

const publicRoutes = [
  "/",
  "/overview",
  "/start-trial",
  "/how-it-works",
  "/pricing",
  "/privacy",
  "/downloads",
  "/marketplace",
  "/blog",
  "/tools",
  "/prompts",
  "/compare",
  "/skillset",
  "/skillsets",
  "/feedback",
  "/manifest.json",
  "/sitemap.xml",
  "/sitemap-skillsets.xml",
  "/sitemap-prompts.xml",
  "/sitemap-compare.xml",
  "/robots.txt",
  "/llms.txt",
  "/sign-in",
  "/sign-up",
  "/sign-out",
  "/auth",
  "/desktop-auth",
  "/extension-auth",
  "/updater",
];

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some((route) =>
    pathname === route || pathname.startsWith(route + "/")
  ) || pathname.startsWith("/api/webhooks/") || pathname.startsWith("/api/auth/") || pathname === "/api/health" || pathname === "/api/support";
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";

  // Permanent move from the old PromptPack domain to Skillset. Only the
  // apex + www variants are redirected — api.pmtpk.com still serves the
  // Cloudflare Worker that desktop app, popup extension, and MCP server
  // hit, and admin.pmtpk.com is the Coolify dashboard. Both are
  // intentionally left intact and never reach this middleware anyway
  // (different origins / Next.js never sees them).
  if (host === "pmtpk.com" || host === "www.pmtpk.com") {
    const url = new URL(request.url);
    const redirectUrl = `https://skillset.so${url.pathname}${url.search}`;
    return addSecurityHeaders(NextResponse.redirect(redirectUrl, 301));
  }

  if (host.startsWith("www.")) {
    const url = new URL(request.url);
    const protocol = url.protocol;
    const newHost = host.replace(/^www\./, "");
    const pathname = url.pathname;
    const search = url.search;
    const redirectUrl = `${protocol}//${newHost}${pathname}${search}`;
    const redirectResponse = NextResponse.redirect(redirectUrl, 301);
    return addSecurityHeaders(redirectResponse);
  }

  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  if (!sessionCookie && !isPublicRoute(pathname)) {
    return addSecurityHeaders(
      NextResponse.redirect(new URL("/sign-in", request.url))
    );
  }

  const response = NextResponse.next();
  return addSecurityHeaders(response);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|txt|xml|webmanifest|skill)).*)",
    "/(api|trpc)(.*)",
  ],
};
