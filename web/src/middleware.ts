import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

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
  "/sign-in",
  "/sign-up",
  "/sso-callback",
  "/forgot-password",
  "/pricing",
  "/privacy",
  "/downloads",
  "/marketplace",
  "/blog",
  "/tools",
  "/prompts",
  "/compare",
  "/manifest.json",
  "/sitemap.xml",
  "/robots.txt",
];

function isPublicRoute(pathname: string): boolean {
  return (
    publicRoutes.some(
      (route) => pathname === route || pathname.startsWith(route + "/")
    ) ||
    pathname.startsWith("/api/webhooks/") ||
    pathname.startsWith("/api/auth/") ||
    pathname === "/api/health" ||
    pathname === "/api/support"
  );
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
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
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
