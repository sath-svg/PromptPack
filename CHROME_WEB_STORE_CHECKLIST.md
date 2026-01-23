# Chrome Web Store Submission Checklist

This document contains everything you need to submit PromptPack to the Chrome Web Store.

---

## ✅ Files Edited

### 1. [popup/manifest.config.ts](popup/manifest.config.ts)
**Status:** ✅ Updated

**Changes Made:**
- Added `description` field (132 characters max) ✅
- Updated `icons` to include 16x16, 48x48, 128x128 sizes ⚠️ (using placeholder)
- Added `default_title` to action
- Added keyboard `commands` (Ctrl+Alt+S / Cmd+Alt+S)
- Added `homepage_url` (https://pmtpk.com)
- Added `author` with email

**⚠️ IMPORTANT - Icon Files Needed:**
You currently only have `logo_no_text.png`. You need to create proper icon sizes:
- `img/icon-16.png` (16x16 pixels)
- `img/icon-48.png` (48x48 pixels)
- `img/icon-128.png` (128x128 pixels)

After creating these icons, update the manifest to use them.

---

## 📋 Chrome Web Store Requirements

### Required Assets

#### 1. Extension Icons ⚠️ **ACTION REQUIRED**
Create these icon files in `popup/img/`:
- [ ] **icon-16.png** - 16x16 pixels (toolbar icon)
- [ ] **icon-48.png** - 48x48 pixels (extensions page)
- [ ] **icon-128.png** - 128x128 pixels (Chrome Web Store listing)

**Recommendations:**
- Use PNG format with transparency
- Keep design simple and recognizable at small sizes
- Use your PromptPack logo/branding
- Test at all sizes to ensure clarity

#### 2. Store Listing Screenshots ✅ **COMPLETED**
Upload 1-5 screenshots showing your extension in action:
- [x] **Size:** 1280x800 or 640x400 pixels ✅
- [x] **Format:** 24-bit PNG (no alpha) ✅
- [x] **Quality:** High resolution, clear text ✅

**Screenshots Created:**
1. ✅ Extension popup - `popup/img/screenshots/promptpack-extension-1280x800.png`
2. ✅ ChatGPT integration - `popup/img/screenshots/chatgpt-1280x800.png`
3. ✅ Claude integration - `popup/img/screenshots/claude-1280x800.png`
4. ✅ Gemini integration - `popup/img/screenshots/gemini-1280x800.png`

All screenshots are also available in 640x400 format in the same directory.

#### 3. Promotional Images ✅ **COMPLETED**
- [x] **Small Tile:** 440x280 pixels ✅ `popup/img/promo-tile-440x280.jpg`
- [ ] **Large Tile:** 920x680 pixels (optional - not created)
- [x] **Marquee:** 1400x560 pixels ✅ `popup/img/marquee-promo-1400x560.jpg`

**Design Tips:**
- Include your logo and tagline: "Stop losing your best prompts"
- Show key features visually
- Use your brand colors
- Keep text minimal and readable

---

## 📝 Store Listing Content

### Short Description (132 chars max)
```
Save, enhance, and organize AI prompts across ChatGPT, Claude, and Gemini with one click.
```
**Character count:** 89

### Detailed Description (See below)

<details>
<summary>Click to expand full store description</summary>

```
Save, enhance, and reuse your best prompts.

PromptPack helps you capture, organize, and reuse your best AI prompts across ChatGPT, Claude, and Gemini.

KEY FEATURES
- One-click saving inside ChatGPT, Claude, and Gemini
- Prompt Enhancer with Structured, Clarity, Concise, and Strict modes
- AI-generated headers for faster scanning
- Inline save icon next to the platform copy button on your prompts
- Right-click context menu for quick actions in the prompt box
- Instant copy from the extension popup
- Keyboard shortcut: Alt+Shift+S (Option+Shift+S on Mac)
- Encrypted export to .pmtpk files (optional password)
- Save to your dashboard for access across devices (sign-in required)

WHAT IS A PROMPTPACK?
A PromptPack is a curated set of prompts grouped into a reusable workflow.

HOW IT WORKS
1. Install PromptPack
2. Visit ChatGPT, Claude, or Gemini
3. Save prompts with the inline button or shortcut
4. Open the extension popup to browse and copy
5. Export or save to your dashboard when needed

FREE TIER
- Save up to 10 prompts total
- Export .pmtpk files
- Local browser storage
- Basic encryption

PRO TIER
- Save up to 40 prompts total
- Import up to 2 PromptPacks
- Create custom packs from the web dashboard
- Access your prompts via the dashboard (sign-in required)
- AES-GCM encryption with password protection

SECURITY & PRIVACY
- AES-GCM authenticated encryption
- PBKDF2 key derivation (100,000 iterations)
- SHA-256 integrity verification
- Your prompts stay private (local or in your account)
- No ads, no tracking, no selling your data

SUPPORTED PLATFORMS
- ChatGPT (chatgpt.com)
- Claude (claude.ai)
- Google Gemini (gemini.google.com)
- PromptPack Dashboard (pmtpk.com)

NEW IN 2.0.0
- Prompt Enhance button
- AI-generated headers
- Inline save icon beside copy buttons
- Right-click prompt actions

LEARN MORE
Visit pmtpk.com for docs, pricing, and your dashboard.

SUPPORT
Questions or feedback? Email sathvik.work@gmail.com
```

</details>

### Category
**Recommended:** `Productivity`

**Alternative:** `Tools`

### Language
`English`

---

## 🔐 Privacy Policy ✅ **COMPLETED**

Chrome Web Store **requires** a privacy policy URL for extensions that handle user data.

**Privacy policy page created at:**
`https://pmtpk.com/privacy`

**Local file:** `web/src/app/privacy/page.tsx`

**What to include:**
1. **Data Collection**
   - What data you collect (prompts, user accounts, usage analytics)
   - How data is stored (local browser storage, cloud sync for Pro)
   - Third-party services (Clerk, Convex, Stripe)

2. **Data Usage**
   - How you use the data (provide service, sync across devices)
   - Who has access (only the user, no selling to third parties)

3. **Data Security**
   - Encryption methods (AES-GCM, PBKDF2)
   - Security measures

4. **User Rights**
   - How users can delete their data
   - How to export data
   - How to contact you

5. **Third-Party Services**
   - Clerk (authentication)
   - Convex (database)
   - Stripe (payments)
   - Cloudflare (hosting)

**Action Items:**
- [x] Create privacy policy page at `https://pmtpk.com/privacy` ✅ DONE
- [ ] Deploy web app to make privacy policy live
- [ ] Add privacy policy URL to Chrome Web Store listing
- [ ] Link privacy policy in extension popup (optional but recommended)

---

## 📊 Store Listing Information

### Basic Info
- **Extension Name:** PromptPack – Save & Organize AI Prompts
- **Version:** 1.0.0
- **Category:** Productivity
- **Language:** English
- **Website:** https://pmtpk.com
- **Support Email:** sathvik.work@gmail.com

### Pricing
- **Free Tier:** Yes (10 prompts per source)
- **Paid Tier:** Yes ($9/month via website, not in-extension purchase)
- **Payment Method:** External (Stripe on pmtpk.com)

**Note:** Since payments are handled on your website (not through Chrome Web Store), you don't need to implement Chrome Web Store payments.

---

## 🚀 Pre-Submission Checklist

### Code & Build
- [ ] Build extension: `cd popup && bun run build`
- [ ] Test built extension in Chrome (load unpacked from `dist/`)
- [ ] Verify all features work in production build
- [ ] Check console for errors
- [ ] Test on ChatGPT, Claude, and Gemini
- [ ] Verify save button appears correctly
- [ ] Test keyboard shortcut (Ctrl+Alt+S)
- [ ] Test import/export functionality
- [ ] Verify authentication flow works

### Assets
- [ ] Create icon-16.png (16x16)
- [ ] Create icon-48.png (48x48)
- [ ] Create icon-128.png (128x128)
- [ ] Update manifest to use new icons
- [ ] Take 3-5 high-quality screenshots (1280x800 or 640x400)
- [ ] Create promotional tile (440x280) - optional

### Documentation
- [ ] Create privacy policy at https://pmtpk.com/privacy
- [ ] Verify website (pmtpk.com) is live and accessible
- [ ] Prepare store description (copy from above)
- [ ] Have support email ready (sathvik.work@gmail.com)

### Testing
- [ ] Test all content scripts on all platforms
- [ ] Verify permissions are working correctly
- [ ] Test with fresh install (no existing data)
- [ ] Test upgrade flow (if updating)
- [ ] Check for console errors
- [ ] Verify popup UI on different screen sizes

---

## 📦 Creating the Submission Package

### 1. Build the Extension
```bash
cd popup
bun run build
```

### 2. Create ZIP file
```bash
cd dist
zip -r ../promptpack-v1.0.0.zip .
```

**Or manually:**
1. Navigate to `popup/dist/`
2. Select all files and folders inside `dist/`
3. Create a ZIP archive named `promptpack-v1.0.0.zip`

**Important:**
- DO NOT zip the `dist` folder itself
- Zip the CONTENTS of the `dist` folder
- The `manifest.json` should be at the root of the ZIP

### 3. Verify ZIP Contents
Your ZIP should contain:
```
manifest.json (at root level)
index.html
img/
  icon-16.png
  icon-48.png
  icon-128.png
assets/
content/
... (other built files)
```

---

## 🌐 Chrome Web Store Submission Process

### Step 1: Developer Account
1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Sign in with your Google account
3. Pay one-time $5 developer registration fee (if not already paid)

### Step 2: Create New Item
1. Click "New Item"
2. Upload your ZIP file (`promptpack-v1.0.0.zip`)
3. Accept Developer Agreement

### Step 3: Fill Store Listing
Navigate through tabs and fill in:

**Store Listing Tab:**
- Product icon (128x128 icon)
- Screenshots (1-5 images)
- Promotional images (optional)
- Short description (132 chars max)
- Detailed description (full description from above)
- Category: Productivity
- Language: English

**Privacy Tab:**
- Privacy policy URL: `https://pmtpk.com/privacy`
- Justify permissions (explain why you need each permission)

**Distribution Tab:**
- Visibility: Public
- Countries: All countries (or select specific ones)

**Pricing Tab:**
- Free or paid: Free (since you handle Pro payments externally)

### Step 4: Submit for Review
1. Review all information
2. Click "Submit for Review"
3. Wait for review (typically 1-3 business days)

---

## ⚠️ Common Rejection Reasons

### Permissions
**Issue:** Requesting unnecessary permissions
**Solution:** Be prepared to justify each permission:
- `storage` - Store saved prompts locally
- `unlimitedStorage` - Allow Pro users to save many prompts
- `tabs` - Detect current tab to show relevant prompts
- `identity` - OAuth authentication with web dashboard

### Privacy Policy
**Issue:** Missing or incomplete privacy policy
**Solution:** Create comprehensive privacy policy at https://pmtpk.com/privacy

### Screenshots
**Issue:** Poor quality or misleading screenshots
**Solution:** Use high-resolution screenshots showing actual functionality

### Description
**Issue:** Overly promotional or misleading
**Solution:** Be clear and factual about features

### Functionality
**Issue:** Extension doesn't work as described
**Solution:** Test thoroughly before submission

---

## 📈 Post-Launch Checklist

After approval:
- [ ] Announce launch on social media
- [ ] Update README.md with Chrome Web Store link
- [ ] Add Chrome Web Store badge to website
- [ ] Monitor reviews and respond promptly
- [ ] Track installation metrics
- [ ] Collect user feedback
- [ ] Plan first update based on feedback

---

## 🔗 Useful Links

- **Chrome Web Store Developer Dashboard:** https://chrome.google.com/webstore/devconsole
- **Chrome Extension Documentation:** https://developer.chrome.com/docs/extensions/
- **Best Practices:** https://developer.chrome.com/docs/extensions/mv3/quality_guidelines/
- **Store Review Policies:** https://developer.chrome.com/docs/webstore/program-policies/

---

## 📞 Support

If you encounter issues during submission:
- **Chrome Web Store Support:** https://support.google.com/chrome_webstore
- **Developer Forums:** https://groups.google.com/a/chromium.org/g/chromium-extensions

---

**Last Updated:** 2025-01-01
**Extension Version:** 1.0.0
**Status:** Ready for submission (pending icon creation and privacy policy)
