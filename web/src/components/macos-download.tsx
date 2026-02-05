"use client";

import { useState, useEffect } from "react";

export function MacOSDownload() {
  const [downloadUrl, setDownloadUrl] = useState("/downloads/PromptPack-Universal.dmg");
  const [platform, setPlatform] = useState<"universal" | "intel" | "silicon">("universal");

  useEffect(() => {
    // Detect macOS architecture if possible
    // Note: This is approximate, as browser APIs don't directly expose CPU architecture
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

    if (isMac) {
      // Try to detect Apple Silicon vs Intel
      // This is a heuristic - we default to Universal which works on both
      const isAppleSilicon = navigator.userAgent.includes('ARM') ||
                            navigator.userAgent.includes('aarch64');

      if (isAppleSilicon) {
        setPlatform("silicon");
        setDownloadUrl("/downloads/PromptPack-AppleSilicon.dmg");
      } else {
        // Default to Universal for compatibility
        setPlatform("universal");
        setDownloadUrl("/downloads/PromptPack-Universal.dmg");
      }
    }
  }, []);

  const handlePlatformChange = (newPlatform: "universal" | "intel" | "silicon") => {
    setPlatform(newPlatform);
    switch (newPlatform) {
      case "universal":
        setDownloadUrl("/downloads/PromptPack-Universal.dmg");
        break;
      case "intel":
        setDownloadUrl("/downloads/PromptPack-Intel.dmg");
        break;
      case "silicon":
        setDownloadUrl("/downloads/PromptPack-AppleSilicon.dmg");
        break;
    }
  };

  return (
    <div className="download-card desktop-card">
      <div className="download-card-header">
        <div className="browser-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" fill="#A2AAAD"/>
          </svg>
        </div>
        <h2>macOS</h2>
        <span className="download-badge download-badge-new">New</span>
      </div>
      <p className="download-description">
        Universal app for Intel and Apple Silicon Macs. Native performance with menu bar integration.
      </p>

      <div className="download-actions">
        <a
          href={downloadUrl}
          className="btn btn-primary download-btn"
          download
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Download for macOS
        </a>

        {/* Architecture Selection Dropdown styled as button */}
        <div>
          <select
            id="mac-arch-select"
            value={platform}
            onChange={(e) => handlePlatformChange(e.target.value as "universal" | "intel" | "silicon")}
            className="architecture-dropdown"
          >
            <option value="universal">Universal (Intel + Apple Silicon)</option>
            <option value="silicon">Apple Silicon (M1 / M2 / M3)</option>
            <option value="intel">Intel (x86_64)</option>
          </select>
        </div>
      </div>
      <details className="other-architectures">
        <summary className="other-architectures-summary">
          ▸ Other architectures
        </summary>
        <div className="other-architectures-content">
          <div className="other-architectures-info">
            <span>Version 0.1.0</span>
            <span className="download-meta-dot">•</span>
            <span>macOS 10.15+</span>
          </div>
          <div className="download-actions">
            <a
              href="/downloads/PromptPack-AppleSilicon.dmg"
              className="btn download-btn download-btn-secondary"
              download
            >
              Apple Silicon (.dmg)
            </a>
            <a
              href="/downloads/PromptPack-Intel.dmg"
              className="btn download-btn download-btn-secondary"
              download
            >
              Intel (.dmg)
            </a>
          </div>
        </div>
      </details>
      <div className="download-meta">
        <span>macOS 10.15+</span>
        <span className="download-meta-dot">•</span>
        <span>v0.1.0</span>
        <span className="download-meta-dot">•</span>
        <span className="download-meta-size">
          {platform === "universal" ? "~15 MB" : "~8 MB"}
        </span>
      </div>
    </div>
  );
}
