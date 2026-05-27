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
 * - Used for: fetching .skill files from R2, prompt enhancement
 * - DEV: https://api.skillset.so
 * - PROD: https://api.skillset.so (same)
 */
// Worker DNS migrated — primary is skillset.so. Legacy pmtpk.com Worker
// routes stay live for old desktop installs (see api/wrangler.toml).
export const WORKERS_API_URL = 'https://api.skillset.so';
// export const WORKERS_API_URL = 'https://api.pmtpk.com'; // rollback only

/**
 * Grok API URL for prompt enhancement
 */
export const GROK_API_URL = 'https://grok.skillset.so';
// export const GROK_API_URL = 'https://grok.pmtpk.com'; // rollback only

/**
 * Enhance API endpoint
 */
export const ENHANCE_API_URL = `${GROK_API_URL}/api/enhance`;

/**
 * Web app URL for OAuth redirects
 * - Used for: desktop auth flow, sign-in redirects
 * - DEV: http://localhost:3000 (local Next.js dev server)
 * - PROD: https://skillset.so
 */
export const WEB_APP_URL = 'https://skillset.so';
// export const WEB_APP_URL = 'https://pmtpk.com'; // rollback only


/**
 * Desktop auth page URL
 * - This is where the OAuth popup opens for sign-in
 * - Constructed from WEB_APP_URL
 */
export const DESKTOP_AUTH_URL = `${WEB_APP_URL}/desktop-auth`;

/**
 * Public feedback board (self-hosted Fider). Opened in system browser
 * from Settings, never embedded in the Tauri webview.
 */
export const FEEDBACK_URL = 'https://feedback.skillset.so';

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
// Free: 1 custom pack
// Pro: 7 custom packs
// Studio: 17 custom packs
export const FREE_CUSTOM_PACK_LIMIT = 1;
export const PRO_CUSTOM_PACK_LIMIT = 7;
export const STUDIO_CUSTOM_PACK_LIMIT = 17;

// ============================================================================
// PROMPTCONTROL (VERSION CONTROL) LIMITS
// ============================================================================
// Pro: 3 packs can have version control enabled (user chooses which)
// Studio: all packs can have version control
export const PRO_VERSION_CONTROL_LIMIT = 3;
export const STUDIO_VERSION_CONTROL_LIMIT = 17;
export const MAX_VERSIONS_PER_PACK = 10;

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
export const FREE_PROMPT_LIMIT = 5;
export const PRO_PROMPT_LIMIT = 56;
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

// ============================================================================
// PROMPTS-PER-PACK CAP (per-skillset limit)
// ============================================================================
// Free: 5 prompts per set (binds tightly — only 1 set)
// Pro/Studio: not capped per set (total cap binds)
export const FREE_PROMPTS_PER_PACK = 5;

export function getPromptsPerPackLimit(tier: 'free' | 'pro' | 'studio'): number {
  if (tier === 'free') return FREE_PROMPTS_PER_PACK;
  return Number.POSITIVE_INFINITY;
}

// ============================================================================
// MARKETPLACE
// ============================================================================
// Marketplace prices are denominated in topup credits (the same balance
// users spend on LLM calls). 1 credit ≈ $0.02 USD per TOPUP_PACKS pricing.
// Skillset takes 30%, seller keeps 70% as credits added to their account.
// Example: 1000 credit sale → seller earns 700 credits (~$14 redemption).
export const MARKETPLACE_PLATFORM_FEE_BPS = 3000;        // 30%
export const MARKETPLACE_SELLER_PCT_BPS = 7000;          // 70%
export const MARKETPLACE_MIN_PRICE_CREDITS = 0;          // 0 = free
export const MARKETPLACE_MIN_PAID_PRICE_CREDITS = 50;    // ~$1.00 floor
export const MARKETPLACE_MAX_PRICE_CREDITS = 50000;      // ~$1000
// Legacy aliases — kept as 0 to avoid breaking previously imported code
// that may still reference these names. New code should use the *_CREDITS
// constants above.
export const MARKETPLACE_MIN_PRICE_CENTS = MARKETPLACE_MIN_PRICE_CREDITS;
export const MARKETPLACE_MAX_PRICE_CENTS = MARKETPLACE_MAX_PRICE_CREDITS;
export const MAX_ACTIVE_LISTINGS: Record<'free' | 'pro' | 'studio', number> = {
  free: 0,
  pro: 5,
  studio: 50,
};

export function getMaxActiveListings(tier: 'free' | 'pro' | 'studio'): number {
  return MAX_ACTIVE_LISTINGS[tier] ?? 0;
}
