import type { ManifestV3Export } from "@crxjs/vite-plugin";

const manifest: ManifestV3Export = {
  manifest_version: 3,
  name: "PromptPack – Save & Optimize AI Prompts",
  version: "1.0.0",
  description: "Stop losing your best prompts. Save and optimize your AI prompts across ChatGPT, Claude, and Gemini with one click.",
  key: "MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCrV/9UId9IgpvWiB0S2zgQo1Cs+vQMm2sTY5nvW7n/XwrwU7cMVmn7NMCff/XA85/xJvLCLmtlvv/6xxiLMfU7NHrpx8aDUSmAj75hdVnjT3WFzCc7NQSJGZaCp7yQkXFoyvt3gWxlhrHyY1p4Xh6h2bqXpJns9h4Ou4bgtwHXfBNXH8TTEcQsmwqsxDFZrQy1176iv50jskeglv5dYMvNcAv5xw+9EyqJfwfSBQ+3MzMiJR5JFwlNb1kTQjkrUP2oQJBlA/rcMqghB0+ZbRL7ow3RLvSrOvb83kQtp1YneelnV5fhLmuOnafp54lt2sAtEEBRi0IS6LRkMOo8aiqxAgMBAAECgf9yHalv3x9Wq6Yeu4ihhl9QtXSFwJ3Jx7kIsM1VHUJDUol2hkrjbKopJHklwZNrbtaXRdloeoIMwai63N771cn+JHW4PdV4oBWECjhBsGatfb5H3jBCvozGwsP7QLvVjQh7QrU4YnpPI+ZgCMu4XvcH1HrxhC8AIurh5QNvpnMTj/YY3K3mIRi/BNvHJBQfB+eqZAvafauhs8OY9RXGygls88YW8lLy6sBXXeCLgV7YFBEb/a3hJPJBTtf5WlAi0xdfXqiOJY1E4vNk1/q90yyF9KCvqCK//kvVKcSmPnKPHA8n1br1uT3HhFiUBoQcWPMXx4+oavisPpmeTTr9HEMCgYEA7b4JN+++lk79OUhUpMD8HWj7xGoqMXJ52ixhcJ0xFKcDxnITZ0FrAflp1pwWoJAPiBivzK4NKwvHXbyJeyM8ArWgnE55GG5E+ZjCpigfvcNCv2VK3GEkM1NsKRblABJNSLMZnOXCyiwSWwcn7NSt7j8putLUiuPb/TxKqHkyXEMCgYEAuICUQixu9n+Z6DgksP0gAQXYqAY6i8ovk0qWH8riq5ELIK5otudmi0WVPVrkzTh7oz9soKCPAnFSP/uWhz6tydqo6nDsUaoUY8nkAea1z9FU0ZZBdATT4TOkQOgyDM6FCWiTvDqNHIAvhcxrY1aQk7VAYM2SfH2Nbopkm2oep/sCgYEAz1mqYp335NKZqoc6Q8OJYAE7bLCHgj7speuFRJnkv7V25nKCF9GHid5FgAb8+ScMVM/rLCI1m/CW/ls8sSgm49oTbaBHn5Y1FFg2lIJ0RKZzpcirhRA4aYd900yDiA9uVlTWpvABdyD/FWNlX/qShDOUqrvM4iIfsXsPRmcGFE8CgYEAk2fnC5eEb9wykp2Icv9I+og5OMUBMX4v1HXayzvFLV2MjmfJsZffDZZiTcq40l02Ko8ZspuUplbzZ7sR4KvrHUJdgjEGHZjNAYzjZcF1sLuGEI0DbjYNMfeYW2Mn2aOGFqY+ojwFUaf4T+WqRot6pwhAjxau2ldVD+PxzVlTdNECgYEAxjf54p6dCITP+mCWoy2m0REDY4QEYTDrSiqQVJkTuIO5+pV00TgdcFmVj5W3xHnSvn5yyQ3ePIIXvkTs4qsRe2T0kPifqbZDFAeLxVJkiYPsh6ulECwobYH4hPIY8589QAVXP0ztHngdOkH5CYzbFTx8e259xBFuhuBNqNXEwI4=",

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
    "https://grok.pmtpk.com/*",
    "https://promptpack-api-marketplace-dev.dksathvik.workers.dev/*",
    "http://localhost:3000/*",
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
  homepage_url: "http://localhost:3000",
  author: {
    email: "sathvik.work@gmail.com",
  },
};

export default manifest;
