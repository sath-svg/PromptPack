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
        <Link href="/">
          <Image
            src={assetUrl("/img/promptpack_logo_horizontal.png")}
            alt="PromptPack"
            width={400}
            height={92}
            priority
            className="downloads-logo"
          />
        </Link>
        <h1 className="downloads-title">Download PromptPack</h1>
        <p className="downloads-subtitle">
          Choose your browser and start saving your best AI prompts today.
        </p>
      </div>

      <div className="downloads-grid">
        {/* Chrome */}
        <div className="download-card">
          <div className="download-card-header">
            <div className="browser-icon browser-icon-chrome">
              <svg viewBox="0 0 24 24" width="48" height="48">
                <circle cx="12" cy="12" r="10" fill="#4285F4"/>
                <circle cx="12" cy="12" r="4" fill="#fff"/>
                <path d="M12 6a6 6 0 0 0-5.2 3h10.4A6 6 0 0 0 12 6z" fill="#EA4335"/>
                <path d="M6.8 9A6 6 0 0 0 9.4 17.6L12 12 6.8 9z" fill="#FBBC05"/>
                <path d="M14.6 17.6A6 6 0 0 0 17.2 9H12l2.6 8.6z" fill="#34A853"/>
              </svg>
            </div>
            <h2>Chrome</h2>
            <span className="download-badge download-badge-recommended">Recommended</span>
          </div>
          <p className="download-description">
            Install from the Chrome Web Store for automatic updates and seamless integration.
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
          </div>
          <div className="download-meta">
            <span>Version 2.2.0</span>
            <span className="download-meta-dot">•</span>
            <span>Manifest V3</span>
          </div>
        </div>

        {/* Firefox */}
        <div className="download-card">
          <div className="download-card-header">
            <div className="browser-icon browser-icon-firefox">
              <svg viewBox="0 0 24 24" width="48" height="48">
                <defs>
                  <linearGradient id="firefox-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FF9500"/>
                    <stop offset="100%" stopColor="#FF3D00"/>
                  </linearGradient>
                </defs>
                <circle cx="12" cy="12" r="10" fill="url(#firefox-grad)"/>
                <path d="M12 4c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8c0-.5 0-1-.1-1.5-.8 1.3-2 2-3.4 2-2.2 0-4-1.8-4-4 0-1.3.6-2.5 1.5-3.2C13.3 4.5 12.7 4 12 4z" fill="#FFE5B4" opacity="0.8"/>
              </svg>
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
          </div>
          <div className="download-meta">
            <span>Version 2.2.0</span>
            <span className="download-meta-dot">•</span>
            <span>Firefox 112+</span>
          </div>
        </div>

        {/* Safari */}
        <div className="download-card download-card-safari">
          <div className="download-card-header">
            <div className="browser-icon browser-icon-safari">
              <svg viewBox="0 0 24 24" width="48" height="48">
                <defs>
                  <linearGradient id="safari-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#5AC8FA"/>
                    <stop offset="100%" stopColor="#007AFF"/>
                  </linearGradient>
                </defs>
                <circle cx="12" cy="12" r="10" fill="url(#safari-grad)"/>
                <polygon points="12,5 14,11 12,19 10,13" fill="#fff"/>
                <polygon points="12,5 14,11 12,12 10,11" fill="#FF3B30"/>
              </svg>
            </div>
            <h2>Safari</h2>
            <span className="download-badge">macOS</span>
          </div>
          <p className="download-description">
            Self-hosted Safari extension for macOS. Build from source using Xcode (free, no Apple Developer account needed).
          </p>
          <div className="download-actions">
            <a
              href="/downloads/promptpack-safari-v2.2.0-source.zip"
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
          </div>
          <div className="download-meta">
            <span>Version 2.2.0</span>
            <span className="download-meta-dot">•</span>
            <span>macOS 11.0+</span>
          </div>
        </div>
      </div>

      {/* Safari Installation Instructions */}
      <div className="safari-instructions">
        <h2>Safari Installation Guide</h2>
        <p className="safari-instructions-subtitle">
          Build PromptPack for Safari using Xcode (free from Mac App Store)
        </p>

        <div className="safari-steps">
          <div className="safari-step">
            <div className="safari-step-number">1</div>
            <div className="safari-step-content">
              <h3>Download &amp; Extract</h3>
              <p>Download the source zip above and extract it to a folder on your Mac.</p>
            </div>
          </div>

          <div className="safari-step">
            <div className="safari-step-number">2</div>
            <div className="safari-step-content">
              <h3>Convert to Safari Extension</h3>
              <p>Open Terminal and run:</p>
              <code className="safari-code">
                xcrun safari-web-extension-converter popup-safari \<br/>
                &nbsp;&nbsp;--project-location PromptPack-Safari \<br/>
                &nbsp;&nbsp;--app-name &quot;PromptPack&quot; \<br/>
                &nbsp;&nbsp;--bundle-identifier com.pmtpk.promptpack \<br/>
                &nbsp;&nbsp;--swift --force
              </code>
            </div>
          </div>

          <div className="safari-step">
            <div className="safari-step-number">3</div>
            <div className="safari-step-content">
              <h3>Build in Xcode</h3>
              <p>Xcode will open automatically. Press <code>Cmd+R</code> to build and run.</p>
            </div>
          </div>

          <div className="safari-step">
            <div className="safari-step-number">4</div>
            <div className="safari-step-content">
              <h3>Enable in Safari</h3>
              <p>Go to <strong>Safari → Settings → Extensions</strong> and enable PromptPack.</p>
              <p className="safari-step-note">
                Note: You may need to allow unsigned extensions in Safari → Develop menu first.
              </p>
            </div>
          </div>
        </div>

        <div className="safari-requirements">
          <h4>Requirements</h4>
          <ul>
            <li>macOS Monterey 12.0 or later</li>
            <li>Xcode 14+ (free from Mac App Store)</li>
            <li>No Apple Developer account needed</li>
          </ul>
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
