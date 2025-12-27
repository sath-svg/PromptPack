import type { ManifestV3Export } from "@crxjs/vite-plugin";

// ============================================================================
// TODO-PRODUCTION: Update host_permissions before deploying extension
// Remove localhost, add production domain
// ============================================================================

const manifest: ManifestV3Export = {
  manifest_version: 3,
  name: "PromptPack",
  version: "0.0.1",
  permissions: ["storage", "unlimitedStorage", "tabs", "identity"],
  host_permissions: [
    "https://chatgpt.com/*",
    "https://chat.openai.com/*",
    "https://claude.ai/*",
    "https://gemini.google.com/*",
    "http://localhost:3000/*", // REMOVE in production
    // PRODUCTION: Add "https://pmtpk.ai/*"
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
  ],
};

export default manifest;
