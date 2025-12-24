# Production Deployment Checklist

This document tracks all TODO items that need to be addressed before deploying PromptPack to production.

## Quick Search

Search for `TODO [PRODUCTION]` in the codebase to find all production-related TODOs.

---

## 1. Domain & URL Configuration

### Extension (`popup/`)

| File | What to Update |
|------|----------------|
| `popup/shared/auth.ts` | Update `BASE_URL` from `http://localhost:3001` to `https://pmtpk.ai` |
| `popup/shared/api.ts` | Update `API_BASE` from `http://localhost:8787` to `https://api.pmtpk.ai` |
| `popup/manifest.config.ts` | Update `host_permissions` to include production domains |

### Web App (`web/`)

| File | What to Update |
|------|----------------|
| `.env.production` | Set production environment variables |
| Clerk Dashboard | Configure production redirect URLs |

---

## 2. Extension Manifest Updates

Update `popup/manifest.config.ts`:

### host_permissions
```typescript
host_permissions: [
  "https://chatgpt.com/*",
  "https://chat.openai.com/*",
  "https://claude.ai/*",
  "https://gemini.google.com/*",
  "https://pmtpk.ai/*",        // Web app
  "https://api.pmtpk.ai/*",    // Cloudflare Workers API
],
```

### content_scripts (auth-capture)
```typescript
// Update the auth-capture content script match pattern
{
  matches: ["https://pmtpk.ai/extension-auth*"],
  js: ["content/auth-capture.ts"],
  run_at: "document_idle",
},
```

### permissions
```typescript
// Add "identity" permission for chrome.identity.launchWebAuthFlow (optional, for better UX)
permissions: ["storage", "tabs", "identity"],
```

---

## 3. Clerk Configuration

1. **Production Instance**: Create a production Clerk instance
2. **Redirect URLs**: Add `chrome-extension://` URLs to allowed redirects
3. **API Keys**: Update environment variables with production keys
4. **Domain**: Configure custom domain if needed

---

## 4. Cloudflare Workers API

1. Deploy Worker to production
2. Configure custom domain (`api.pmtpk.ai`)
3. Set up CORS to allow extension origin
4. Configure environment variables/secrets

---

## 5. Security Improvements

### Extension Auth Flow (`web/src/app/extension-auth/page.tsx`)

- [ ] Store auth codes server-side with short TTL (Redis/KV)
- [ ] Validate extension ID against allowlist
- [ ] Use proper JWT signing instead of base64 encoding
- [ ] Add rate limiting to prevent abuse

---

## 6. Chrome Web Store Submission

1. Update `popup/manifest.config.ts`:
   - Set final `version` number
   - Add `description`
   - Add `icons` (16x16, 48x48, 128x128)
   - Add `key` for consistent extension ID

2. Create store assets:
   - Screenshots (1280x800 or 640x400)
   - Promotional images
   - Privacy policy URL

3. Submit for review

---

## 7. Testing Checklist

Before going live:

- [ ] Test auth flow end-to-end with production URLs
- [ ] Test prompt saving/loading on all platforms (ChatGPT, Claude, Gemini)
- [ ] Test export/import functionality
- [ ] Test billing/subscription flow
- [ ] Test on multiple browsers (Chrome, Edge, Brave)
- [ ] Verify CORS configuration
- [ ] Check CSP headers

---

## Files with Production TODOs

```
popup/shared/auth.ts          - BASE_URL, AUTH_URL, switch to chrome.identity.launchWebAuthFlow
popup/shared/api.ts           - API_BASE
popup/manifest.config.ts      - host_permissions, content_scripts, permissions
popup/content/auth-capture.ts - (update match pattern in manifest)
web/src/app/extension-auth/   - Security improvements, proper redirect flow
```

---

## 8. Auth Flow Upgrade (Production)

Currently using a workaround for localhost development:
1. Extension opens auth page in new tab
2. User signs in via Clerk
3. Web page stores auth data in localStorage
4. Content script captures data and stores in chrome.storage
5. Popup checks for pending auth on next open

**Production upgrade** (when using HTTPS domain):
1. Use `chrome.identity.launchWebAuthFlow()` for seamless OAuth
2. Redirect to `https://<extension-id>.chromiumapp.org/` callback
3. No need for content script workaround
4. Better UX - auth completes in popup automatically

See `popup/shared/auth.ts` for implementation notes.
