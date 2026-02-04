// ============================================================================
// CENTRALIZED CONFIGURATION FOR PROMPTPACK DESKTOP APP
// ============================================================================
// All configurable URLs and constants in one place.
// UPDATE THESE FOR PRODUCTION DEPLOYMENT.
// ============================================================================

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * Convex HTTP API URL
 * - Used for: fetching saved packs metadata, user data
 * - DEV: https://accurate-cardinal-55.convex.site (your dev Convex deployment)
 * - PROD: Same URL (Convex URL doesn't change between environments)
 */
export const CONVEX_URL = 'https://determined-lark-313.convex.site';

/**
 * Cloudflare Workers API URL (R2 storage, enhance, classify)
 * - Used for: fetching .pmtpk files from R2, prompt enhancement
 * - DEV: https://api.pmtpk.com
 * - PROD: https://api.pmtpk.com (same)
 */
export const WORKERS_API_URL = 'https://api.pmtpk.com';

/**
 * Grok API URL for prompt enhancement
 */
export const GROK_API_URL = 'https://grok.pmtpk.com';

/**
 * Enhance API endpoint
 */
export const ENHANCE_API_URL = `${GROK_API_URL}/api/enhance`;

/**
 * Web app URL for OAuth redirects
 * - Used for: desktop auth flow, sign-in redirects
 * - DEV: http://localhost:3000 (local Next.js dev server)
 * - PROD: https://pmtpk.com
 */
export const WEB_APP_URL = 'https://pmtpk.com';

/**
 * Desktop auth page URL
 * - This is where the OAuth popup opens for sign-in
 * - Constructed from WEB_APP_URL
 */
export const DESKTOP_AUTH_URL = `${WEB_APP_URL}/desktop-auth`;

// ============================================================================
// TAURI ORIGIN NOTES (for backend CORS configuration)
// ============================================================================
//
// The Tauri desktop app sends requests with these Origin headers:
// - Development: http://localhost:1420 (Vite dev server)
// - Production (macOS): tauri://localhost
// - Production (Windows): https://tauri.localhost
// - Production (Linux): tauri://localhost
//
// Make sure your backend CORS allows these origins:
//
// 1. Convex HTTP (web/convex/http.ts - corsHeaders function):
//    - Already allows: chrome-extension://, tauri://, moz-extension://, localhost
//
// 2. Cloudflare Workers (api/src/index.ts - isOriginAllowed function):
//    - Already allows: tauri://, http://tauri.localhost, https://tauri.localhost
//    - Also allows origins from ALLOWED_ORIGINS env var
//
// If you deploy to a custom domain, update ALLOWED_ORIGINS in wrangler.toml
// ============================================================================

// ============================================================================
// PASSWORD CONFIGURATION
// ============================================================================
export const PASSWORD_MIN_LENGTH = 1;
export const PASSWORD_MAX_LENGTH = 14;
export const PASSWORD_REGEX = /^[a-zA-Z0-9]+$/;

export function isValidPassword(password: string): boolean {
  return (
    password.length >= PASSWORD_MIN_LENGTH &&
    password.length <= PASSWORD_MAX_LENGTH &&
    PASSWORD_REGEX.test(password)
  );
}

// ============================================================================
// SYNC CONFIGURATION
// ============================================================================
export const SYNC_CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// ============================================================================
// PACK LIMITS BY TIER
// ============================================================================
// Custom packs are user-created packs (not platform-saved packs like ChatGPT, Claude, etc.)
// Free: 0 custom packs (can only save to platform packs)
// Pro: 2 custom packs
// Studio: 14 custom packs
export const FREE_CUSTOM_PACK_LIMIT = 0;
export const PRO_CUSTOM_PACK_LIMIT = 2;
export const STUDIO_CUSTOM_PACK_LIMIT = 14;

// Helper to get pack limit by tier
export function getCustomPackLimit(tier: 'free' | 'pro' | 'studio'): number {
  switch (tier) {
    case 'free':
      return FREE_CUSTOM_PACK_LIMIT;
    case 'pro':
      return PRO_CUSTOM_PACK_LIMIT;
    case 'studio':
      return STUDIO_CUSTOM_PACK_LIMIT;
    default:
      return FREE_CUSTOM_PACK_LIMIT;
  }
}

// ============================================================================
// PROMPT LIMITS BY TIER (total prompts across all packs)
// ============================================================================
export const FREE_PROMPT_LIMIT = 10;
export const PRO_PROMPT_LIMIT = 40;
export const STUDIO_PROMPT_LIMIT = 200;

// Helper to get prompt limit by tier
export function getPromptLimit(tier: 'free' | 'pro' | 'studio'): number {
  switch (tier) {
    case 'free':
      return FREE_PROMPT_LIMIT;
    case 'pro':
      return PRO_PROMPT_LIMIT;
    case 'studio':
      return STUDIO_PROMPT_LIMIT;
    default:
      return FREE_PROMPT_LIMIT;
  }
}
