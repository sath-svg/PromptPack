/**
 * BetterAuth server-side compatibility layer.
 * Replaces: import { auth, currentUser } from "@clerk/nextjs/server"
 * Usage:    import { auth, currentUser } from "@/lib/auth-server"
 */

import { headers } from "next/headers";
import { auth as betterAuth } from "../../lib/auth";

/**
 * Get current session from BetterAuth (server-side).
 * Returns same shape as Clerk's auth() for compatibility.
 */
export async function auth(): Promise<{
  userId: string | null;
  sessionId: string | null;
  protect: () => Promise<void>;
}> {
  try {
    const session = await betterAuth.api.getSession({
      headers: await headers(),
    });

    return {
      userId: session?.user?.id ?? null,
      sessionId: session?.session?.id ?? null,
      protect: async () => {
        if (!session?.user) {
          throw new Error("Unauthorized");
        }
      },
    };
  } catch {
    return {
      userId: null,
      sessionId: null,
      protect: async () => {
        throw new Error("Unauthorized");
      },
    };
  }
}

/**
 * Get current user from BetterAuth (server-side).
 * Returns same shape as Clerk's currentUser() for compatibility.
 */
export async function currentUser(): Promise<{
  id: string;
  emailAddresses: Array<{ emailAddress: string }>;
  primaryEmailAddress: { emailAddress: string } | null;
  fullName: string | null;
  imageUrl: string | null;
} | null> {
  try {
    const session = await betterAuth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) return null;

    return {
      id: session.user.id,
      emailAddresses: [{ emailAddress: session.user.email }],
      primaryEmailAddress: { emailAddress: session.user.email },
      fullName: session.user.name ?? null,
      imageUrl: session.user.image ?? null,
    };
  } catch {
    return null;
  }
}
