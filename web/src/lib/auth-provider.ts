/**
 * Auth Provider Abstraction Layer
 * Switches between Clerk and BetterAuth via environment
 * Allows gradual migration without touching 35+ components
 */

// Determine active provider at runtime
const ACTIVE_PROVIDER = process.env.NEXT_PUBLIC_AUTH_PROVIDER || "clerk";

// ============ TYPE DEFINITIONS ============

export interface User {
  id: string;
  email: string;
  name?: string;
  imageUrl?: string;
  userId?: string;
  betterAuthId?: string;
}

export interface AuthState {
  isLoaded: boolean;
  isSignedIn: boolean;
  user: User | null;
  sessionId?: string;
}

// ============ PROVIDER-SPECIFIC EXPORTS ============

// Re-export appropriate provider based on env
export async function useAuth() {
  if (ACTIVE_PROVIDER === "betterauth") {
    return useBetterAuth();
  }
  return useClerkAuth();
}

export async function useUser() {
  if (ACTIVE_PROVIDER === "betterauth") {
    return useBetterAuthUser();
  }
  return useClerkUser();
}

// ============ CLERK IMPLEMENTATION ============

function useClerkAuth() {
  // Re-export from @clerk/nextjs
  const { useAuth: clerkUseAuth } = require("@clerk/nextjs");
  return clerkUseAuth();
}

function useClerkUser() {
  // Re-export from @clerk/nextjs
  const { useUser: clerkUseUser } = require("@clerk/nextjs");
  const { user: clerkUser } = clerkUseUser();

  return {
    user: clerkUser ? mapClerkUserToAuthUser(clerkUser) : null,
  };
}

function mapClerkUserToAuthUser(clerkUser: any): User {
  return {
    id: clerkUser.id,
    userId: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress || "",
    name: clerkUser.fullName || undefined,
    imageUrl: clerkUser.imageUrl || undefined,
  };
}

// ============ BETTERAUTH IMPLEMENTATION ============

function useBetterAuth() {
  // Placeholder for BetterAuth integration
  // Will be implemented after BetterAuth setup
  return {
    isLoaded: true,
    isSignedIn: false,
    sessionId: undefined,
    getToken: async () => null,
    signOut: async () => {
      // BetterAuth sign out
    },
  };
}

function useBetterAuthUser() {
  // Placeholder for BetterAuth user hook
  // Will be implemented after BetterAuth setup
  return {
    user: null,
  };
}

// ============ PROVIDER HELPERS ============

export function getActiveProvider(): string {
  return ACTIVE_PROVIDER;
}

export function isDualModeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_DUAL_AUTH === "true";
}

/**
 * Get auth token for API calls
 * During migration, accepts both Clerk and BetterAuth tokens
 */
export async function getAuthToken(): Promise<string | null> {
  if (ACTIVE_PROVIDER === "betterauth") {
    return getBetterAuthToken();
  }
  return getClerkToken();
}

async function getClerkToken(): Promise<string | null> {
  try {
    const { useAuth } = require("@clerk/nextjs");
    const { getToken } = useAuth();
    return await getToken({ template: "convex" });
  } catch {
    return null;
  }
}

async function getBetterAuthToken(): Promise<string | null> {
  // Placeholder - will implement after BetterAuth setup
  return null;
}

// ============ MIGRATION HELPERS ============

/**
 * Check if user has been migrated to BetterAuth
 * Used in dual-auth mode to route requests correctly
 */
export function shouldUseBetterAuth(user: User): boolean {
  return !!user.betterAuthId && ACTIVE_PROVIDER === "betterauth";
}

/**
 * Get user identifier for database lookups
 * Returns betterAuthId if available, falls back to userId
 */
export function getUserId(user: User): string | undefined {
  return user.betterAuthId || user.userId;
}
