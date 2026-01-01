// ============================================================================
// CENTRALIZED CONFIGURATION FOR PROMPTPACK WEB APP
// ============================================================================
// All configurable parameters, limits, URLs, and constants in one place.
// Update these values when deploying to production.
// ============================================================================

// ============================================================================
// API CONFIGURATION
// ============================================================================

// R2 API URL (Cloudflare Workers)
export const R2_API_URL = process.env.NEXT_PUBLIC_R2_API_URL || "https://promptpack-api.dksathvik.workers.dev";

// Workers API URL (same as R2 for now)
export const WORKERS_API_URL = process.env.NEXT_PUBLIC_WORKERS_API_URL || "https://promptpack-api.dksathvik.workers.dev";

// Default support email
export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "sathvik.work@gmail.com";

// ============================================================================
// PROMPT & PACK LIMITS
// ============================================================================
export const FREE_PROMPT_LIMIT = 10;
export const PRO_PROMPT_LIMIT = 40;
export const FREE_PACK_LIMIT = 2;
export const PRO_PACK_LIMIT = 5;
export const MAX_PRO_PACKS = 2; // Maximum packs for Pro tier on web

// ============================================================================
// PACK FORMAT CONFIGURATION
// ============================================================================
export const WEB_PACK_FORMAT = "web-pack-v1";
export const WEB_PACK_VERSION = 1;

// ============================================================================
// PASSWORD REQUIREMENTS
// ============================================================================
export const PASSWORD_MIN_LENGTH = 1;
export const PASSWORD_MAX_LENGTH = 14;
export const PASSWORD_REGEX = /^[a-zA-Z0-9]+$/; // Only letters and numbers, case sensitive

// Helper function to validate password
export function isValidPassword(password: string): boolean {
  return (
    password.length >= PASSWORD_MIN_LENGTH &&
    password.length <= PASSWORD_MAX_LENGTH &&
    PASSWORD_REGEX.test(password)
  );
}

// Legacy constant for backwards compatibility
export const PASSWORD_LENGTH = PASSWORD_MAX_LENGTH;

// ============================================================================
// UI CONFIGURATION
// ============================================================================
export const TOAST_DURATION_MS = 2000;

// ============================================================================
// ASSET CONFIGURATION
// ============================================================================
export const ASSET_BASE_URL = process.env.NEXT_PUBLIC_ASSET_BASE_URL || "";

export const assetUrl = (path: string): string => {
  if (!ASSET_BASE_URL) {
    return path;
  }
  const base = ASSET_BASE_URL.endsWith("/") ? ASSET_BASE_URL.slice(0, -1) : ASSET_BASE_URL;
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
};
