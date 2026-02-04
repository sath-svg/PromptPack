import Image from "next/image";
import Link from "next/link";
import { assetUrl } from "@/lib/constants";

export const metadata = {
  title: "Download PromptPack - Desktop App & Browser Extensions",
  description: "Download PromptPack desktop app for Windows, macOS, and Linux. Or get the browser extension for Chrome, Firefox, or Safari. Save, enhance, and organize AI prompts.",
};

export default function DownloadsPage() {
  return (
    <div className="downloads-page">
      <div className="downloads-hero">
        <h1 className="downloads-title">
          Download <span className="gradient-text">PromptPack</span>
        </h1>
        <p className="downloads-subtitle">
          Get the desktop app or browser extension to start saving your best AI prompts.
        </p>
      </div>

      {/* Desktop App Section */}
      <div className="desktop-section">
        <h2 className="desktop-section-title">
          <span className="desktop-icon">💻</span>
          Desktop App
          <span className="desktop-badge-new">New</span>
        </h2>
        <p className="desktop-section-subtitle">
          Full-featured prompt manager with offline support, sync, and more.
        </p>

        <div className="desktop-grid">
          {/* Windows */}
          <div className="download-card desktop-card">
            <div className="download-card-header">
              <div className="browser-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <path d="M3 5.548l7.455-1.02v7.195H3V5.548zm0 13.054l7.455 1.02v-7.167H3v6.147zm8.295 1.132L21 21v-8.545h-9.705v7.279zm0-15.418v7.407H21V3l-9.705 1.316z" fill="#0078D4"/>
                </svg>
              </div>
              <h2>Windows</h2>
              <span className="download-badge download-badge-recommended">Recommended</span>
            </div>
            <p className="download-description">
              Native Windows app with system tray integration and global hotkeys.
            </p>
            <div className="download-actions">
              <a
                href="/downloads/PromptPack_0.1.0_x64-setup.exe"
                className="btn btn-primary download-btn"
                download
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download Installer
              </a>
              <a
                href="/downloads/PromptPack_0.1.0_x64_en-US.msi"
                className="btn download-btn download-btn-secondary"
                download
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                MSI Package
              </a>
            </div>
            <div className="download-meta">
              <span>Version 0.1.0</span>
              <span className="download-meta-dot">•</span>
              <span>Windows 10/11</span>
            </div>
          </div>

          {/* macOS */}
          <div className="download-card desktop-card desktop-card-coming">
            <div className="download-card-header">
              <div className="browser-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" fill="#A2AAAD"/>
                </svg>
              </div>
              <h2>macOS</h2>
              <span className="download-badge">Coming Soon</span>
            </div>
            <p className="download-description">
              Universal app for Intel and Apple Silicon Macs. Native performance with menu bar integration.
            </p>
            <div className="download-actions">
              <button className="btn download-btn download-btn-disabled" disabled>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                Coming Soon
              </button>
            </div>
            <div className="download-meta">
              <span>macOS 11.0+</span>
              <span className="download-meta-dot">•</span>
              <span>Universal Binary</span>
            </div>
          </div>

          {/* Linux */}
          <div className="download-card desktop-card desktop-card-coming">
            <div className="download-card-header">
              <div className="browser-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 00-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.132 1.884 1.071.771-.06 1.592-.536 2.257-1.306.631-.765 1.683-1.084 2.378-1.503.348-.199.629-.469.649-.853.023-.4-.2-.811-.714-1.376v-.097l-.003-.003c-.17-.2-.25-.535-.338-.926-.085-.401-.182-.786-.492-1.046h-.003c-.059-.054-.123-.067-.188-.135a.357.357 0 00-.19-.064c.431-1.278.264-2.55-.173-3.694-.533-1.41-1.465-2.638-2.175-3.483-.796-1.005-1.576-1.957-1.56-3.368.026-2.152.236-6.133-3.544-6.139zm.529 3.405h.013c.213 0 .396.062.584.198.19.135.33.332.438.533.105.259.158.459.166.724 0-.02.006-.04.006-.06v.105a.086.086 0 01-.004-.021l-.004-.024a1.807 1.807 0 01-.15.706.953.953 0 01-.213.335.71.71 0 00-.088-.042c-.104-.045-.198-.064-.284-.133a1.312 1.312 0 00-.22-.066c.05-.06.146-.133.183-.198.053-.128.082-.264.088-.402v-.02a1.21 1.21 0 00-.061-.4c-.045-.134-.101-.2-.183-.333-.084-.066-.167-.132-.267-.132h-.016c-.093 0-.176.03-.262.132a.8.8 0 00-.205.334 1.18 1.18 0 00-.09.468v.024c.016.165.042.289.105.4.063.134.155.267.275.333.004.003.025.019.042.028.032.024.058.03.058.03a.37.37 0 01-.095.1.87.87 0 01-.226.134.96.96 0 01-.243.067l-.014.001a1.63 1.63 0 01-.292-.033 2.201 2.201 0 01-.259-.073 1.17 1.17 0 01-.207-.107.93.93 0 01-.172-.152c-.06-.067-.103-.147-.127-.236-.024-.088-.033-.18-.033-.268v-.024l.004-.063c.008-.158.04-.301.096-.439.059-.134.123-.268.2-.4.075-.135.167-.267.259-.4.09-.132.2-.265.3-.332.125-.066.191-.133.292-.133h.022zm-1.163.587a.636.636 0 01-.091.102c-.098.066-.197.068-.3.068-.123 0-.23.065-.293.132a.79.79 0 00-.189.333c-.045.134-.068.269-.068.401 0 .068.005.137.02.2.015.063.04.12.074.175a.36.36 0 00.122.119c.05.029.104.045.16.054l.018.002h.025l.027-.003a.37.37 0 00.085-.023.47.47 0 00.148-.09.47.47 0 00.098-.132c.024-.047.04-.1.048-.158l.004-.033a.698.698 0 00-.01-.196.63.63 0 00-.054-.171.546.546 0 00-.096-.143.417.417 0 00-.126-.094.325.325 0 00-.142-.034h-.016a.27.27 0 00-.087.015.39.39 0 00-.075.035c-.022.015-.043.032-.06.05a.376.376 0 00-.046.054l-.004.006a.284.284 0 00-.028.054l-.003.01a.236.236 0 00-.015.06l-.001.013v.058l.003.028c.004.02.01.04.018.057.014.034.034.062.06.086.026.025.057.044.09.057a.282.282 0 00.102.023h.009c-.096.138-.114.133-.267.133-.054 0-.121-.026-.178-.061a.336.336 0 01-.115-.143.56.56 0 01-.043-.205v-.02c.003-.134.033-.268.106-.4a.79.79 0 01.26-.332c.106-.068.197-.135.317-.135a.42.42 0 01.142.03c.048.017.09.044.126.08.074.074.115.169.132.268a1.005 1.005 0 01-.02.295z" fill="#FCC624"/>
                </svg>
              </div>
              <h2>Linux</h2>
              <span className="download-badge">Coming Soon</span>
            </div>
            <p className="download-description">
              AppImage and .deb packages for Ubuntu, Debian, Fedora, and other distributions.
            </p>
            <div className="download-actions">
              <button className="btn download-btn download-btn-disabled" disabled>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                Coming Soon
              </button>
            </div>
            <div className="download-meta">
              <span>Ubuntu 20.04+</span>
              <span className="download-meta-dot">•</span>
              <span>AppImage / .deb</span>
            </div>
          </div>
        </div>
      </div>

      {/* Browser Extensions Section */}
      <div className="browser-section">
        <h2 className="browser-section-title">
          <span className="browser-section-icon">🌐</span>
          Browser Extensions
        </h2>
        <p className="browser-section-subtitle">
          Quick-access extension for saving prompts while you chat.
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
