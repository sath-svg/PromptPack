# Production Deployment Checklist

This document tracks all TODO items that need to be addressed before deploying PromptPack to production.

## Quick Search

Search for `TODO-PRODUCTION` in the codebase to find all production-related configuration blocks.

---

## 1. URL Configuration (CRITICAL)

All URLs are clearly marked with `TODO-PRODUCTION` comments at the top of each file.

### Extension Files

| File | Current (Dev) | Production | Status |
|------|---------------|------------|--------|
| `popup/shared/api.ts` | `http://localhost:8787` | `https://your-worker.workers.dev` | ⚠️ UPDATE |
| `popup/shared/api.ts` | `https://brilliant-sandpiper-173.convex.site` | Update if using different deployment | ℹ️ OPTIONAL |
| `popup/shared/auth.ts` | `http://localhost:3000` | `https://pmtpk.ai` | ⚠️ UPDATE |
| `popup/manifest.config.ts` | `http://localhost:3000/*` | Remove & add `https://pmtpk.ai/*` | ⚠️ UPDATE |

### Web App Files

| File | Current (Dev) | Production | Status |
|------|---------------|------------|--------|
| `web/.env.local` | `R2_API_URL=http://localhost:8787` | `R2_API_URL=https://your-worker.workers.dev` | ⚠️ UPDATE |
| `web/src/app/api/packs/create/route.ts` | Uses `R2_API_URL` from env | Set in `.env.local` | ℹ️ AUTO |

### Cloudflare Workers

| File | Setting | Production Value | Status |
|------|---------|------------------|--------|
| `api/src/index.ts` | `ENVIRONMENT` | `"production"` | ⚠️ UPDATE wrangler.toml |
| `api/src/index.ts` | `BUCKET` | Your R2 bucket binding | ⚠️ UPDATE wrangler.toml |
| `api/src/index.ts` | `CONVEX_URL` | Your Convex site URL | ⚠️ UPDATE wrangler.toml |
| `api/src/index.ts` | `ALLOWED_ORIGINS` | `https://pmtpk.ai,chrome-extension://*` | ⚠️ UPDATE wrangler.toml |

---

## 2. Step-by-Step Deployment Guide

### Step 1: Update Environment Variables

**File: `web/.env.local`**
```bash
# Update this line:
R2_API_URL=http://localhost:8787
# To:
R2_API_URL=https://your-worker.workers.dev
```

### Step 2: Update Extension URLs

**File: `popup/shared/api.ts` (lines 7-8)**
```typescript
// Change from:
const API_BASE = "http://localhost:8787";
// To:
const API_BASE = "https://your-worker.workers.dev";
```

**File: `popup/shared/auth.ts` (line 7)**
```typescript
// Change from:
const BASE_URL = "http://localhost:3000";
// To:
const BASE_URL = "https://pmtpk.ai";
```

**File: `popup/manifest.config.ts` (line 18-19)**
```typescript
// Remove:
"http://localhost:3000/*", // REMOVE in production
// Add:
"https://pmtpk.ai/*"
```

### Step 3: Deploy Cloudflare Worker

**File: `api/wrangler.toml`**

Update the bindings section:
```toml
[vars]
ENVIRONMENT = "production"
CONVEX_URL = "https://your-project.convex.site"
ALLOWED_ORIGINS = "https://pmtpk.ai,chrome-extension://*"

[[r2_buckets]]
binding = "BUCKET"
bucket_name = "your-production-bucket"
```

Deploy:
```bash
cd api
npm run deploy
```

### Step 4: Deploy Web App

```bash
cd web
# Build and deploy to Vercel/Netlify/etc
npm run build
```

### Step 5: Build Extension

```bash
cd popup
npm run build
# Upload dist/ folder to Chrome Web Store
```

---

## 3. R2 Storage Architecture

**Current Setup:**
- ✅ Convex stores metadata only (user info, pack metadata)
- ✅ R2 stores actual `.pmtpk` files
- ✅ Supports ~200,000 users on Convex free tier

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
- 200K users × 10 packs = 920 MB metadata (Convex)
- Files stored in R2 (unlimited, cheap)

---

## 4. Security Checklist

### Extension Auth Flow

Current implementation (works for localhost):
- ❌ Auth codes stored in localStorage
- ❌ No server-side validation
- ❌ Base64 encoding (not encryption)

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

## 5. Clerk Configuration

1. **Production Instance**: Create separate Clerk instance for production
2. **Redirect URLs**: Add allowed redirects:
   - `https://pmtpk.ai/extension-auth`
   - `chrome-extension://<your-extension-id>/*`
3. **Billing Integration**: Configure Clerk Billing with Stripe
4. **Webhooks**: Update webhook endpoints to production URLs

---

## 6. Chrome Web Store Submission

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

## 7. Testing Checklist

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

## 8. Monitoring & Analytics

### Setup Required

- [ ] Cloudflare Workers Analytics
- [ ] Convex dashboard monitoring
- [ ] Error tracking (Sentry/Rollbar)
- [ ] Usage analytics
- [ ] Billing webhooks monitoring

---

## 9. Quick Reference: All TODO-PRODUCTION Locations

```
popup/shared/api.ts:4-12           → API URLs
popup/shared/auth.ts:4-10          → Auth URL
popup/manifest.config.ts:3-6       → Host permissions
web/.env.local:6-10                → R2 API URL
web/src/app/api/packs/create/route.ts:1-5  → R2 API URL reference
api/src/index.ts:10-19             → Cloudflare Workers config
```

Use global search for `TODO-PRODUCTION` to find all deployment-critical sections.

---

## 10. Deployment Order

1. ✅ **Cloudflare Worker** - Deploy R2 API first
2. ✅ **Web App** - Deploy Next.js app to Vercel
3. ✅ **Update Extension** - Update URLs in extension code
4. ✅ **Build Extension** - Create production build
5. ✅ **Submit to Chrome Store** - Upload and wait for review
6. ✅ **Configure Clerk** - Update production webhooks
7. ✅ **Test End-to-End** - Full integration test

---

## 11. Rollback Plan

If issues occur in production:

1. **Extension**: Submit hotfix version to Chrome Store (24-48hr review)
2. **Web App**: Revert Vercel deployment (instant)
3. **Cloudflare Worker**: Roll back to previous version (instant)
4. **Database**: Convex migrations are automatic, but backup data first

---

## Status: 🟡 Development

**Ready for Production:** 🔴 No

**Blockers:**
- Update all URLs marked with TODO-PRODUCTION
- Deploy Cloudflare Worker to production
- Configure production R2 bucket
- Set up production Clerk instance
- Create Chrome Web Store listing
