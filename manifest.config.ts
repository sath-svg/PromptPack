import type { ManifestV3Export } from "@crxjs/vite-plugin";

const manifest: ManifestV3Export = {
  manifest_version: 3,
  name: "PromptPack",
  version: "0.0.1",
  permissions: ["storage", "tabs"],
  host_permissions: [
    "https://chatgpt.com/*",
    "https://chat.openai.com/*",
    "https://claude.ai/*",
    "https://gemini.google.com/*",
  ],
  action: {
    default_popup: "index.html", // uses your root index.html
  },
  content_scripts: [
    {
      matches: ["https://chatgpt.com/", "https://chatgpt.com/*", "https://chat.openai.com/*"],
      js: ["src/content/chatgpt.ts"],
      run_at: "document_idle",
    },
    {
      matches: ["https://claude.ai/*"],
      js: ["src/content/claude.ts"],
      run_at: "document_idle",
    },
    {
      matches: ["https://gemini.google.com/*"],
      js: ["src/content/gemini.ts"],
      run_at: "document_idle",
    },
  ],
};

export default manifest;
