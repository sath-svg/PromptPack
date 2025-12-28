import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/pricing",
  "/marketplace",
  "/marketplace/(.*)",
  "/api/webhooks/(.*)",
  "/api/auth/status", // Extension auth status check
  "/api/health", // Health check endpoint
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
}, {
  // Get Clerk keys from Cloudflare runtime context
  // This is required because process.env is empty in Cloudflare Workers
  get secretKey() {
    try {
      const env = getRequestContext().env as Record<string, string>;
      return env.CLERK_SECRET_KEY;
    } catch {
      return process.env.CLERK_SECRET_KEY || "";
    }
  },
  get publishableKey() {
    try {
      const env = getRequestContext().env as Record<string, string>;
      return env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    } catch {
      return process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
    }
  },
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
