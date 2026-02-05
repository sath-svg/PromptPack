"use client";

import Image from "next/image";
import { assetUrl } from "@/lib/constants";

export function DownloadButtons() {
  return (
    <div className="download-buttons-section">
      {/* Desktop Apps Row */}
      <div className="download-buttons-row">
        <a
          href="/downloads"
          className="download-pill download-pill-disabled"
          title="Coming Soon"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          <span>macOS</span>
        </a>
        <a
          href="/downloads/PromptPack_0.1.0_x64-setup.exe"
          className="download-pill"
          download
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 5.548l7.455-1.02v7.195H3V5.548zm0 13.054l7.455 1.02v-7.167H3v6.147zm8.295 1.132L21 21v-8.545h-9.705v7.279zm0-15.418v7.407H21V3l-9.705 1.316z"/>
          </svg>
          <span>Windows (x64)</span>
        </a>
        <a
          href="/downloads/PromptPack_0.1.0_arm64-setup.exe"
          className="download-pill"
          download
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 5.548l7.455-1.02v7.195H3V5.548zm0 13.054l7.455 1.02v-7.167H3v6.147zm8.295 1.132L21 21v-8.545h-9.705v7.279zm0-15.418v7.407H21V3l-9.705 1.316z"/>
          </svg>
          <span>Windows (ARM64)</span>
        </a>
      </div>

      {/* Browser Extensions Row */}
      <div className="download-buttons-row">
        <a
          href="https://chromewebstore.google.com/detail/ajfgnekiofhiblifmiimnlmcnfhibnbl"
          target="_blank"
          rel="noreferrer"
          className="download-pill"
        >
          <Image
            src={assetUrl("/img/chrome_logo.png")}
            alt="Chrome"
            width={16}
            height={16}
            className="download-pill-logo"
          />
          <span>Chrome</span>
        </a>
        <a
          href="/downloads"
          className="download-pill download-pill-disabled"
          title="Coming Soon"
        >
          <Image
            src={assetUrl("/img/safari_logo.png")}
            alt="Safari"
            width={16}
            height={16}
            className="download-pill-logo"
          />
          <span>Safari</span>
        </a>
        <a
          href="https://addons.mozilla.org/en-US/firefox/addon/promptpack/"
          target="_blank"
          rel="noreferrer"
          className="download-pill"
        >
          <Image
            src={assetUrl("/img/firefox_logo.png")}
            alt="Firefox"
            width={16}
            height={16}
            className="download-pill-logo"
          />
          <span>Firefox</span>
        </a>
      </div>
    </div>
  );
}
