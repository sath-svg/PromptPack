import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Security headers to protect against common vulnerabilities
// Note: Some headers removed/relaxed for corporate proxy compatibility
const securityHeaders = {
  // Prevents clickjacking by disallowing framing
  "X-Frame-Options": "DENY",
  // Prevents MIME type sniffing
  "X-Content-Type-Options": "nosniff",
  // Controls referrer information sent with requests
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // Restricts browser features/APIs
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=()",
};

// Helper to add security headers to a response
function addSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/pricing",
  "/privacy", // Privacy policy must be public
  "/downloads", // Downloads page must be public
  "/marketplace",
  "/marketplace/(.*)",
  "/blog",
  "/blog/(.*)",
  "/privacy",
  "/manifest.json",
  "/sitemap.xml",
  "/robots.txt",
  "/api/webhooks/(.*)",
  "/api/auth/status", // Extension auth status check
  "/api/health", // Health check endpoint
  "/api/support", // Support form must be accessible to all users
]);

export default clerkMiddleware(async (auth, request) => {
  // Redirect www to non-www for SEO canonicalization
  const host = request.headers.get("host") || "";
  if (host.startsWith("www.")) {
    const url = new URL(request.url);
    // Build the redirect URL without the port
    const protocol = url.protocol;
    const newHost = host.replace(/^www\./, "");
    const pathname = url.pathname;
    const search = url.search;
    const redirectUrl = `${protocol}//${newHost}${pathname}${search}`;
    const redirectResponse = NextResponse.redirect(redirectUrl, 301);
    return addSecurityHeaders(redirectResponse);
  }

  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  // Add security headers to all responses
  const response = NextResponse.next();
  return addSecurityHeaders(response);
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
