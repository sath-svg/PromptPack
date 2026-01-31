import Image from "next/image";
import Link from "next/link";
import { assetUrl } from "@/lib/constants";

export const metadata = {
  title: "Download PromptPack - Browser Extensions for Chrome, Firefox & Safari",
  description: "Download PromptPack browser extension for Chrome, Firefox, or Safari. Save, enhance, and organize AI prompts across ChatGPT, Claude, and Gemini.",
};

export default function DownloadsPage() {
  return (
    <div className="downloads-page">
      <div className="downloads-hero">
        <h1 className="downloads-title">
          Download <span className="gradient-text">PromptPack</span>
        </h1>
        <p className="downloads-subtitle">
          Choose your browser and start saving your best AI prompts today.
        </p>
      </div>

      <div className="downloads-grid">
        {/* Chrome */}
        <div className="download-card">
          <div className="download-card-header">
            <div className="browser-icon">
              <Image
                src={assetUrl("/img/chrome_logo.png")}
                alt="Chrome"
                width={64}
                height={64}
                className="browser-logo"
              />
            </div>
            <h2>Chrome</h2>
            <span className="download-badge download-badge-recommended">Recommended</span>
          </div>
          <p className="download-description">
            Install from the Chrome Web Store for automatic updates. Also works with Edge, Brave, Opera, and other Chromium browsers.
          </p>
          <div className="download-actions">
            <a
              href="https://chromewebstore.google.com/detail/ajfgnekiofhiblifmiimnlmcnfhibnbl"
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary download-btn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              Chrome Web Store
            </a>
            <a
              href="/downloads/promptpack-chrome-v2.3.0.zip"
              className="btn download-btn download-btn-secondary"
              download
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Direct Download
            </a>
          </div>
          <div className="download-meta">
            <span>Version 2.3.0</span>
            <span className="download-meta-dot">•</span>
            <span>Manifest V3</span>
          </div>
        </div>

        {/* Firefox */}
        <div className="download-card">
          <div className="download-card-header">
            <div className="browser-icon">
              <Image
                src={assetUrl("/img/firefox_logo.png")}
                alt="Firefox"
                width={64}
                height={64}
                className="browser-logo"
              />
            </div>
            <h2>Firefox</h2>
            <span className="download-badge">New</span>
          </div>
          <p className="download-description">
            Install from Firefox Add-ons for automatic updates and privacy-focused browsing.
          </p>
          <div className="download-actions">
            <a
              href="https://addons.mozilla.org/en-US/firefox/addon/promptpack/"
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary download-btn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              Firefox Add-ons
            </a>
            <a
              href="/downloads/promptpack-firefox-v2.3.0.zip"
              className="btn download-btn download-btn-secondary"
              download
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Direct Download
            </a>
          </div>
          <div className="download-meta">
            <span>Version 2.3.0</span>
            <span className="download-meta-dot">•</span>
            <span>Firefox 112+</span>
          </div>
        </div>

        {/* Safari */}
        <div className="download-card download-card-safari">
          <div className="download-card-header">
            <div className="browser-icon">
              <Image
                src={assetUrl("/img/safari_logo.png")}
                alt="Safari"
                width={64}
                height={64}
                className="browser-logo"
              />
            </div>
            <h2>Safari</h2>
            <span className="download-badge">macOS</span>
          </div>
          <p className="download-description">
            Self-hosted Safari extension for macOS. Build from source using Xcode (free, no Apple Developer account needed).
          </p>
          <div className="download-actions">
            <a
              href="/downloads/promptpack-safari-v2.3.0-source.zip"
              className="btn btn-primary download-btn"
              download
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download Source
            </a>
            <a
              href="#install-guide"
              className="btn download-btn download-btn-secondary"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              See Instructions
            </a>
          </div>
          <div className="download-meta">
            <span>Version 2.3.0</span>
            <span className="download-meta-dot">•</span>
            <span>macOS 11.0+</span>
          </div>
        </div>
      </div>

      {/* Installation Instructions */}
      <div className="install-instructions" id="install-guide">
        <h2>Installation Guide</h2>
        <p className="install-instructions-subtitle">
          Follow these steps to install PromptPack using a direct download
        </p>

        <div className="install-tabs">
          {/* Chrome Instructions */}
          <div className="install-section">
            <h3 className="install-section-title">
              <Image
                src={assetUrl("/img/chrome_logo.png")}
                alt="Chrome"
                width={24}
                height={24}
                className="install-section-icon"
              />
              Chrome / Edge / Brave
            </h3>
            <div className="install-steps">
              <div className="install-step">
                <span className="install-step-num">1</span>
                <p>Download and extract the zip file</p>
              </div>
              <div className="install-step">
                <span className="install-step-num">2</span>
                <p>Go to <code>chrome://extensions</code> in your browser</p>
              </div>
              <div className="install-step">
                <span className="install-step-num">3</span>
                <p>Enable <strong>Developer mode</strong> (top right toggle)</p>
              </div>
              <div className="install-step">
                <span className="install-step-num">4</span>
                <p>Click <strong>Load unpacked</strong> and select the extracted folder</p>
              </div>
            </div>
          </div>

          {/* Firefox Instructions */}
          <div className="install-section">
            <h3 className="install-section-title">
              <Image
                src={assetUrl("/img/firefox_logo.png")}
                alt="Firefox"
                width={24}
                height={24}
                className="install-section-icon"
              />
              Firefox
            </h3>
            <div className="install-steps">
              <div className="install-step">
                <span className="install-step-num">1</span>
                <p>Download the zip file (do not extract)</p>
              </div>
              <div className="install-step">
                <span className="install-step-num">2</span>
                <p>Go to <code>about:debugging#/runtime/this-firefox</code></p>
              </div>
              <div className="install-step">
                <span className="install-step-num">3</span>
                <p>Click <strong>Load Temporary Add-on</strong></p>
              </div>
              <div className="install-step">
                <span className="install-step-num">4</span>
                <p>Select the zip file or any file inside the extracted folder</p>
              </div>
            </div>
          </div>

          {/* Safari Instructions */}
          <div className="install-section">
            <h3 className="install-section-title">
              <Image
                src={assetUrl("/img/safari_logo.png")}
                alt="Safari"
                width={24}
                height={24}
                className="install-section-icon"
              />
              Safari (macOS)
            </h3>
            <div className="install-steps">
              <div className="install-step">
                <span className="install-step-num">1</span>
                <p>Download and extract the source zip</p>
              </div>
              <div className="install-step">
                <span className="install-step-num">2</span>
                <p>Open Terminal and run: <code>xcrun safari-web-extension-converter</code> with the extracted folder</p>
              </div>
              <div className="install-step">
                <span className="install-step-num">3</span>
                <p>Build in Xcode with <code>Cmd+R</code></p>
              </div>
              <div className="install-step">
                <span className="install-step-num">4</span>
                <p>Enable in <strong>Safari → Settings → Extensions</strong></p>
              </div>
            </div>
            <div className="install-note">
              Requires Xcode (free from Mac App Store). No Apple Developer account needed.
            </div>
          </div>
        </div>
      </div>

      {/* Supported Platforms */}
      <div className="supported-platforms">
        <h2>Supported AI Platforms</h2>
        <p className="supported-platforms-subtitle">
          PromptPack works seamlessly with your favorite AI assistants
        </p>
        <div className="platforms-grid">
          <div className="platform-item">
            <span className="platform-icon">🤖</span>
            <span>ChatGPT</span>
          </div>
          <div className="platform-item">
            <span className="platform-icon">🟠</span>
            <span>Claude</span>
          </div>
          <div className="platform-item">
            <span className="platform-icon">💎</span>
            <span>Gemini</span>
          </div>
          <div className="platform-item platform-item-pro">
            <span className="platform-icon">🔮</span>
            <span>Perplexity</span>
            <span className="pro-badge">Pro</span>
          </div>
          <div className="platform-item platform-item-pro">
            <span className="platform-icon">🚀</span>
            <span>Grok</span>
            <span className="pro-badge">Pro</span>
          </div>
          <div className="platform-item platform-item-pro">
            <span className="platform-icon">🌊</span>
            <span>DeepSeek</span>
            <span className="pro-badge">Pro</span>
          </div>
          <div className="platform-item platform-item-pro">
            <span className="platform-icon">🌙</span>
            <span>Kimi</span>
            <span className="pro-badge">Pro</span>
          </div>
        </div>
      </div>

      <footer className="site-footer">
        <div className="footer-links">
          <Link href="/" className="footer-link">Home</Link>
          <span className="footer-separator">•</span>
          <Link href="/privacy" className="footer-link">Privacy Policy</Link>
        </div>
        <p className="footer-note">
          Powered by pmtpk.ai
        </p>
      </footer>
    </div>
  );
}
