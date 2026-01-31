import type { ManifestV3Export } from "@crxjs/vite-plugin";

const manifest: ManifestV3Export = {
  manifest_version: 3,
  name: "PromptPack – Save, Enhance & Organize AI Prompts",
  version: "2.1.0",
  description: "Save, enhance, and organize AI prompts across ChatGPT, Claude, and Gemini with one click.",

  // Icons - Chrome Web Store requires 16x16, 48x48, and 128x128
  icons: {
    "16": "img/icon-16.png",
    "48": "img/icon-48.png",
    "128": "img/icon-128.png",
  },

  // Permissions
  permissions: ["storage", "unlimitedStorage", "tabs"],

  // Host permissions for LLM websites and web app
  host_permissions: [
    "https://chatgpt.com/*",
    "https://chat.openai.com/*",
    "https://claude.ai/*",
    "https://gemini.google.com/*",
    // Pro-only LLMs
    "https://www.perplexity.ai/*",
    "https://perplexity.ai/*",
    "https://grok.com/*",
    "https://x.com/*",
    "https://chat.deepseek.com/*",
    "https://kimi.moonshot.cn/*",
    // API and web app
    "https://grok.pmtpk.com/*",
    "https://api.pmtpk.com/*",
    "https://*.pmtpk.com/*",
  ],

  // Extension action (popup)
  action: {
    default_popup: "index.html",
    default_title: "PromptPack",
    default_icon: {
      "16": "img/icon-16.png",
      "48": "img/icon-48.png",
      "128": "img/icon-128.png",
    }
  },

  // Content scripts for each LLM platform
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
    // Pro-only LLMs
    {
      matches: ["https://www.perplexity.ai/*", "https://perplexity.ai/*"],
      js: ["content/perplexity.ts"],
      run_at: "document_idle",
    },
    {
      matches: ["https://grok.com/*", "https://x.com/i/grok*"],
      js: ["content/grok.ts"],
      run_at: "document_idle",
    },
    {
      matches: ["https://chat.deepseek.com/*"],
      js: ["content/deepseek.ts"],
      run_at: "document_idle",
    },
    {
      matches: ["https://kimi.moonshot.cn/*"],
      js: ["content/kimi.ts"],
      run_at: "document_idle",
    },
  ],

  // Background service worker (auth proxy for classify)
  background: {
    service_worker: "background.ts",
    type: "module",
  },

  // Web accessible resources - icons need to be accessible from content scripts
  web_accessible_resources: [
    {
      resources: ["img/icon-16.png", "auth-callback.html"],
      matches: [
        "https://chatgpt.com/*",
        "https://chat.openai.com/*",
        "https://claude.ai/*",
        "https://gemini.google.com/*",
        // Pro-only LLMs
        "https://www.perplexity.ai/*",
        "https://perplexity.ai/*",
        "https://grok.com/*",
        "https://x.com/*",
        "https://chat.deepseek.com/*",
        "https://kimi.moonshot.cn/*",
        // Web app
        "https://pmtpk.com/*",
        "http://localhost:3000/*",
      ],
    },
  ],

  // Commands for keyboard shortcuts
  commands: {
    "save-prompt": {
      suggested_key: {
        default: "Alt+Shift+S",
        mac: "Alt+Shift+S", // Alt maps to Option on Mac
      },
      description: "Save current prompt to PromptPack",
    },
  },

  // Homepage and author info
  homepage_url: "https://pmtpk.com",
  author: {
    email: "sathvik.work@gmail.com",
  },
};

export default manifest;
