import type { ManifestV3Export } from "@crxjs/vite-plugin";

/**
 * TODO [PRODUCTION]: Update host_permissions for production deployment
 *
 * Replace localhost URLs with production domains:
 * - "http://localhost:3001/*" -> "https://pmtpk.ai/*" (web app)
 * - Add "https://api.pmtpk.ai/*" (Cloudflare Workers API)
 *
 * Final production host_permissions should look like:
 * host_permissions: [
 *   "https://chatgpt.com/*",
 *   "https://chat.openai.com/*",
 *   "https://claude.ai/*",
 *   "https://gemini.google.com/*",
 *   "https://pmtpk.ai/*",
 *   "https://api.pmtpk.ai/*",
 * ],
 */
const manifest: ManifestV3Export = {
  manifest_version: 3,
  name: "PromptPack",
  version: "0.0.1",
  // TODO [PRODUCTION]: Add "identity" permission for chrome.identity.launchWebAuthFlow
  permissions: ["storage", "tabs"],
  host_permissions: [
    "https://chatgpt.com/*",
    "https://chat.openai.com/*",
    "https://claude.ai/*",
    "https://gemini.google.com/*",
    // TODO [PRODUCTION]: Replace with production URLs
    "http://localhost:3000/*", // Web app (dev)
    "http://localhost:8787/*", // Cloudflare Workers API (dev)
  ],
  action: {
    default_popup: "index.html",
  },
  content_scripts: [
    {
      matches: ["https://chatgpt.com/", "https://chatgpt.com/*", "https://chat.openai.com/*"],
      js: ["content/chatgpt.ts"],
      run_at: "document_idle",
    },
    {
      matches: ["https://claude.ai/*"],
      js: ["content/claude.ts"],
      run_at: "document_idle",
    },
    {
      matches: ["https://gemini.google.com/*"],
      js: ["content/gemini.ts"],
      run_at: "document_idle",
    },
    // TODO [PRODUCTION]: Update to production domain
    {
      matches: ["http://localhost:3000/extension-auth*"],
      js: ["content/auth-capture.ts"],
      run_at: "document_idle",
    },
  ],
};

export default manifest;
