// Workaround for Clerk environment variables on Cloudflare Pages
// See: https://github.com/clerk/javascript/issues/4877

import { getRequestContext } from "@cloudflare/next-on-pages";

export function getClerkEnv() {
  try {
    const ctx = getRequestContext();
    return {
      publishableKey: ctx.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY as string,
      secretKey: ctx.env.CLERK_SECRET_KEY as string,
    };
  } catch {
    // Fallback for local development
    return {
      publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "",
      secretKey: process.env.CLERK_SECRET_KEY || "",
    };
  }
}
