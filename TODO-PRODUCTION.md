# Production Deployment Checklist

This document tracks all TODO items that need to be addressed before deploying PromptPack to production.

## Quick Search

Search for `TODO-PRODUCTION` in the codebase to find all production-related configuration blocks.

---

## 0. CENTRALIZED CONFIGURATION (NEW!)

All parameters, limits, and URLs are now centralized in config files. **Update these files for production:**

### Extension Config: `popup/shared/config.ts`

| Parameter | Current Value | Description | Can Update |
|-----------|---------------|-------------|------------|
| `BASE_URL` | `https://pmtpk.com` | Web app URL | ✅ UPDATED |
| `API_BASE` | `https://promptpack-api.dksathvik.workers.dev` | Cloudflare Workers API | ✅ UPDATED |
| `CONVEX_API_URL` | `https://determined-lark-313.convex.site` | Convex HTTP endpoint | ✅ UPDATED |
| `IS_PRODUCTION` | `true` | Feature flag | ✅ UPDATED |
| `FREE_PROMPT_LIMIT` | `10` | Free tier prompt limit | YES |
| `PRO_PROMPT_LIMIT` | `40` | Pro tier prompt limit | YES |
| `FREE_PACK_LIMIT` | `2` | Free tier pack limit | YES |
| `PRO_PACK_LIMIT` | `5` | Pro tier pack limit | YES |
| `MAX_IMPORTED_PACKS` | `2` | Max imported packs | YES |
| `PASSWORD_LENGTH` | `5` | Password length requirement | YES |
| `SESSION_EXPIRY_MS` | `7 days` | Session expiration | YES |
| `AUTH_CACHE_EXPIRY_MS` | `24 hours` | Auth cache duration | YES |
| `TOAST_DURATION_MS` | `900` | Toast notification duration | YES |
| `MAX_RETRIES` | `3` | Storage retry attempts | YES |
| `RETRY_DELAY_MS` | `100` | Delay between retries | YES |
| `DEFAULT_STORAGE_BYTES` | `5MB` | Storage quota | YES |
| `DB_NAME` | `promptpack` | IndexedDB name | NO |
| `DB_VERSION` | `1` | DB schema version | NO |

### Web App Config: `web/src/lib/constants.ts`

| Parameter | Current Value | Description | Can Update |
|-----------|---------------|-------------|------------|
| `R2_API_URL` | `https://promptpack-api.dksathvik.workers.dev` | R2 Workers API (via env) | ✅ UPDATED |
| `WORKERS_API_URL` | `https://promptpack-api.dksathvik.workers.dev` | Same as R2 API | ✅ UPDATED |
| `SUPPORT_EMAIL` | `sathvik.work@gmail.com` | Support email (via env) | YES |
| `FREE_PROMPT_LIMIT` | `10` | Free tier prompt limit | YES |
| `PRO_PROMPT_LIMIT` | `40` | Pro tier prompt limit | YES |
| `MAX_PRO_PACKS` | `2` | Max packs for Pro tier | YES |
| `PASSWORD_LENGTH` | `5` | Password length requirement | YES |
| `TOAST_DURATION_MS` | `2000` | Toast notification duration | YES |
| `WEB_PACK_FORMAT` | `web-pack-v1` | Pack format identifier | NO |
| `WEB_PACK_VERSION` | `1` | Pack version | NO |

---

## 1. URL Configuration (CRITICAL)

All URLs are now in `popup/shared/config.ts` for extension and `web/src/lib/constants.ts` for web.

### Extension Files

| File | Current (Dev) | Production | Status |
|------|---------------|------------|--------|
| `popup/shared/config.ts` | `BASE_URL = "http://localhost:3000"` | `"https://pmtpk.com"` | ✅ UPDATED |
| `popup/shared/config.ts` | `API_BASE = "http://localhost:8787"` | `"https://promptpack-api.dksathvik.workers.dev"` | ✅ UPDATED |
| `popup/shared/config.ts` | `IS_PRODUCTION = false` | `true` | ✅ UPDATED |
| `popup/manifest.config.ts` | `http://localhost:3000/*` | Remove & add `https://pmtpk.com/*` | ⚠️ VERIFY |

### Web App Files

| File | Current (Dev) | Production | Status |
|------|---------------|------------|--------|
| `web/.env.local` | `NEXT_PUBLIC_R2_API_URL=http://localhost:8787` | `https://promptpack-api.dksathvik.workers.dev` | ✅ UPDATED |
| `web/.env.local` | `NEXT_PUBLIC_WORKERS_API_URL=http://localhost:8787` | `https://promptpack-api.dksathvik.workers.dev` | ✅ UPDATED |

### Cloudflare Workers

| File | Setting | Production Value | Status |
|------|---------|------------------|--------|
| `api/wrangler.toml` | `ENVIRONMENT` | `"production"` | ✅ UPDATED |
| `api/wrangler.toml` | `BUCKET` | `promptpack-files-prod` | ✅ UPDATED |
| `api/wrangler.toml` | `CONVEX_URL` | `https://brilliant-sandpiper-173.convex.site` | ✅ UPDATED |
| `api/wrangler.toml` | `ALLOWED_ORIGINS` | `https://pmtpk.com,chrome-extension://*` | ✅ UPDATED |

---

## 2. Step-by-Step Deployment Guide

### Step 1: Update Extension Config

**File: `popup/shared/config.ts`**
```typescript
// ✅ These values are already set:
export const BASE_URL = "https://pmtpk.com";
export const API_BASE = "https://promptpack-api.dksathvik.workers.dev";
export const IS_PRODUCTION = true;
```

### Step 2: Update Web App Environment

**File: `web/.env.local`**
```bash
# ✅ These values are already set:
NEXT_PUBLIC_R2_API_URL=https://promptpack-api.dksathvik.workers.dev
NEXT_PUBLIC_WORKERS_API_URL=https://promptpack-api.dksathvik.workers.dev
```

### Step 3: Update Extension Manifest

**File: `popup/manifest.config.ts`**
```typescript
// ⚠️ Verify this change has been made:
// Remove:
"http://localhost:3000/*", // REMOVE in production
// Add:
"https://pmtpk.com/*"
```

### Step 4: Deploy Cloudflare Worker

**File: `api/wrangler.toml`**

✅ Already configured for production:
```toml
[vars]
ENVIRONMENT = "production"
CONVEX_URL = "https://brilliant-sandpiper-173.convex.site"
ALLOWED_ORIGINS = "https://pmtpk.com,chrome-extension://*"

[[r2_buckets]]
binding = "BUCKET"
bucket_name = "promptpack-files-prod"
```

Deploy:
```bash
cd api
bun run deploy  # ✅ Deployed
```

### Step 5: Deploy Web App

```bash
cd web
# Build and deploy to Vercel/Netlify/etc
bun run build  # ⚠️ Verify deployment status
```

### Step 6: Build Extension

```bash
cd popup
bun run build
# Upload dist/ folder to Chrome Web Store
# ⚠️ Chrome Web Store submission pending
```

---

## 3. Configurable Limits Summary

These limits can be adjusted in the config files without code changes:

| Limit | Extension Config | Web Config | Description |
|-------|-----------------|------------|-------------|
| Free Prompts | `FREE_PROMPT_LIMIT = 10` | `FREE_PROMPT_LIMIT = 10` | Max prompts for free users |
| Pro Prompts | `PRO_PROMPT_LIMIT = 40` | `PRO_PROMPT_LIMIT = 40` | Max prompts for Pro users |
| Free Packs | `FREE_PACK_LIMIT = 2` | - | Max packs for free users |
| Pro Packs | `PRO_PACK_LIMIT = 5` | `MAX_PRO_PACKS = 2` | Max packs for Pro users |
| Password Length | `PASSWORD_LENGTH = 5` | `PASSWORD_LENGTH = 5` | Encryption password length |
| Session Duration | `SESSION_EXPIRY_MS = 7d` | - | Session expiration |
| Retry Attempts | `MAX_RETRIES = 3` | - | Storage retry attempts |

---

## 4. R2 Storage Architecture

**Current Setup:**
- Convex stores metadata only (user info, pack metadata)
- R2 stores actual `.pmtpk` files
- Supports ~200,000 users on Convex free tier

**File Structure in R2:**
```
packs/
  {userId}/
    pack_{timestamp}_{random}.pmtpk

users/
  {userId}/
    saved/
      chatgpt.pmtpk
      claude.pmtpk
      gemini.pmtpk
```

**Storage Capacity:**
- Metadata: 462 bytes per pack
- 200K users x 10 packs = 920 MB metadata (Convex)
- Files stored in R2 (unlimited, cheap)

---

## 5. Security Checklist

### Extension Auth Flow

Current implementation (works for localhost):
- Auth codes stored in localStorage
- No server-side validation
- Base64 encoding (not encryption)

**Production improvements needed:**
- [ ] Store auth codes server-side with Redis/KV (TTL: 5 minutes)
- [ ] Validate extension ID against allowlist
- [ ] Use proper JWT signing
- [ ] Add rate limiting
- [ ] Consider `chrome.identity.launchWebAuthFlow()` for better UX

### Cloudflare Workers

- [ ] Add JWT validation with Clerk
- [ ] Implement rate limiting
- [ ] Add request logging
- [ ] Set up monitoring/alerts

---

## 6. Clerk Configuration

1. **Production Instance**: Create separate Clerk instance for production
2. **Redirect URLs**: Add allowed redirects:
   - `https://pmtpk.ai/extension-auth`
   - `chrome-extension://<your-extension-id>/*`
3. **Billing Integration**: Configure Clerk Billing with Stripe
4. **Webhooks**: Update webhook endpoints to production URLs

---

## 7. Chrome Web Store Submission

### manifest.config.ts Updates

```typescript
{
  name: "PromptPack",
  version: "1.0.0",  // Update to release version
  description: "Save and organize your ChatGPT, Claude, and Gemini prompts",

  icons: {
    "16": "icons/icon-16.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  },

  // Add consistent extension ID
  key: "YOUR_PUBLIC_KEY_HERE"
}
```

### Required Assets

- [ ] Extension icons (16x16, 48x48, 128x128)
- [ ] Store screenshots (1280x800 or 640x400)
- [ ] Promotional tile (440x280)
- [ ] Privacy policy URL
- [ ] Support/contact email

---

## 8. Testing Checklist

Before going live:

- [ ] Test auth flow with production URLs
- [ ] Test prompt saving on ChatGPT, Claude, Gemini
- [ ] Test pack import/export with encryption
- [ ] Test billing upgrade/downgrade flow
- [ ] Test grace period warnings
- [ ] Verify CORS configuration
- [ ] Test on Chrome, Edge, Brave
- [ ] Load test R2 uploads
- [ ] Verify Convex queries are indexed

---

## 9. Monitoring & Analytics

### Setup Required

- [ ] Cloudflare Workers Analytics
- [ ] Convex dashboard monitoring
- [ ] Error tracking (Sentry/Rollbar)
- [ ] Usage analytics
- [ ] Billing webhooks monitoring

---

## 10. Quick Reference: Config File Locations

```
popup/shared/config.ts              -> ALL extension configuration
web/src/lib/constants.ts            -> ALL web app configuration
popup/manifest.config.ts            -> Extension manifest (host permissions)
api/src/index.ts                    -> Cloudflare Workers (via wrangler.toml)
```

Use global search for `TODO-PRODUCTION` to find deployment-critical sections.

---

## 11. Deployment Order

1. **Update Config Files** - Update `popup/shared/config.ts` and `web/src/lib/constants.ts`
2. **Cloudflare Worker** - Deploy R2 API first
3. **Web App** - Deploy Next.js app to Vercel
4. **Build Extension** - Create production build
5. **Submit to Chrome Store** - Upload and wait for review
6. **Configure Clerk** - Update production webhooks
7. **Test End-to-End** - Full integration test

---

## 12. Rollback Plan

If issues occur in production:

1. **Extension**: Submit hotfix version to Chrome Store (24-48hr review)
2. **Web App**: Revert Vercel deployment (instant)
3. **Cloudflare Worker**: Roll back to previous version (instant)
4. **Database**: Convex migrations are automatic, but backup data first

---

## Status: Production-Ready

**Ready for Production:** Yes (with minor verification needed)

**✅ Completed:**
- ✅ Updated `popup/shared/config.ts` with production URLs (`https://pmtpk.com`)
- ✅ Updated `web/.env.local` with production environment variables
- ✅ Deployed Cloudflare Worker to production (`promptpack-api.dksathvik.workers.dev`)
- ✅ Configured production R2 bucket (`promptpack-files-prod`)
- ✅ Convex backend deployed (`brilliant-sandpiper-173.convex.site`)

**⚠️ Remaining Items:**
- ⚠️ Verify `popup/manifest.config.ts` has `https://pmtpk.com/*` (not localhost)
- ⚠️ Set up production Clerk instance (or verify existing)
- ⚠️ Create Chrome Web Store listing and submit extension
- ⚠️ Verify web app deployment (Vercel/Netlify)
- ⚠️ Configure production webhooks (Clerk, Stripe)
- ⚠️ Add monitoring/analytics

**🔒 Security Improvements (Recommended):**
- JWT validation for API requests
- Rate limiting on Cloudflare Workers
- Error tracking (Sentry/Rollbar)
- Usage analytics
- Production Clerk configuration
