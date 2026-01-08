// ============================================================================
// CENTRALIZED CONFIGURATION FOR PROMPTPACK EXTENSION
// ============================================================================
// All configurable parameters, limits, URLs, and constants in one place.
// Update these values when deploying to production.
// ============================================================================

// ============================================================================
// DEVELOPMENT CONFIGURATION
// ============================================================================

// Base URLs
export const BASE_URL = "http://localhost:3000"; // Web app URL
// PRODUCTION: export const BASE_URL = "https://pmtpk.com";

export const API_BASE = "http://localhost:8787"; // Cloudflare Workers R2 API
// PRODUCTION: export const API_BASE = "https://api.pmtpk.com";

export const CONVEX_API_URL = "https://brilliant-sandpiper-173.convex.site"; // Convex HTTP endpoint
// PRODUCTION: export const CONVEX_API_URL = "https://determined-lark-313.convex.site";

// Feature flag for production mode
export const IS_PRODUCTION = false;
// PRODUCTION: export const IS_PRODUCTION = true;

// ============================================================================
// URL Endpoints (derived from base URLs)
// ============================================================================
export const AUTH_URL = `${BASE_URL}/extension-auth`;
export const DASHBOARD_URL = `${BASE_URL}/dashboard`;
export const PRICING_URL = `${BASE_URL}/pricing`;
export const SIGN_IN_URL = `${BASE_URL}/sign-in`;
export const MARKETPLACE_URL = IS_PRODUCTION ? "https://pmtpk.ai/marketplace" : `${BASE_URL}/marketplace`;
export const PACKS_CREATE_API = `${BASE_URL}/api/packs/create`;

// ============================================================================
// PROMPT & PACK LIMITS
// ============================================================================
export const FREE_PROMPT_LIMIT = 10;
export const PRO_PROMPT_LIMIT = 40;
export const FREE_PACK_LIMIT = 2;
export const PRO_PACK_LIMIT = 5;

// Legacy constants for backwards compatibility
export const MAX_PROMPTS = FREE_PROMPT_LIMIT;
export const MAX_IMPORTED_PACKS = 2;

// ============================================================================
// SESSION & CACHE CONFIGURATION
// ============================================================================
export const SESSION_EXPIRY_MS = 3 * 24 * 60 * 60 * 1000; // 3 days
export const AUTH_CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
export const AUTH_CACHE_KEY = "pp_auth_cache";
export const PRO_STATUS_KEY = "pp_last_pro_status";

// ============================================================================
// STORAGE CONFIGURATION
// ============================================================================
export const MAX_RETRIES = 3;
export const RETRY_DELAY_MS = 100;
export const BACKUP_PREFIX = "_backup_";
export const STORAGE_LOW_THRESHOLD_PERCENT = 80;
export const DEFAULT_STORAGE_BYTES = 5 * 1024 * 1024; // 5MB default quota

// ============================================================================
// DATABASE CONFIGURATION
// ============================================================================
export const DB_NAME = "promptpack";
export const DB_VERSION = 1;
export const PROMPTS_STORAGE_KEY = "promptpack_prompts";

// ============================================================================
// PASSWORD & ENCRYPTION REQUIREMENTS
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
export const TOAST_DURATION_MS = 900;
export const LONG_PROMPT_THRESHOLD = 180; // Characters before collapsing
export const PROMPT_PREVIEW_LENGTH = 160; // Characters to show in preview
export const AUTH_TAB_TIMEOUT_MS = 10000; // Timeout for auth tab listener

// ============================================================================
// PRO USER CONFIGURATION
// ============================================================================
export const UNLIMITED_PACK_LIMIT = 2; // 2 loaded packs for pro users

// ============================================================================
// FALLBACK VALUES
// ============================================================================
export const FALLBACK_PROMPT_LIMIT = 40; // Used when API check fails
export const FALLBACK_LOADED_PACK_LIMIT = 2; // Free tier default
