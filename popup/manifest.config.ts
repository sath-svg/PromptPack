import type { ManifestV3Export } from "@crxjs/vite-plugin";

const manifest: ManifestV3Export = {
  manifest_version: 3,
  name: "PromptPack",
  version: "1.0.0",
  icons: {
    "16": "img/logo_no_text.png",
  },
  permissions: ["storage", "unlimitedStorage", "tabs", "identity"],
  host_permissions: [
    "https://chatgpt.com/*",
    "https://chat.openai.com/*",
    "https://claude.ai/*",
    "https://gemini.google.com/*",
    "https://pmtpk.com/*",
  ],
  action: {
    default_popup: "index.html",
    default_icon: {
      "16": "img/logo_no_text.png"
    }
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
