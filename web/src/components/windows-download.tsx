"use client";

import { useEffect, useState } from "react";

type Architecture = "x64" | "arm64" | "unknown";

function detectArchitecture(): Architecture {
  if (typeof navigator === "undefined") return "unknown";

  const userAgent = navigator.userAgent.toLowerCase();
  const platform = (navigator.platform || "").toLowerCase();

  // Check for ARM64
  if (
    userAgent.includes("arm64") ||
    userAgent.includes("aarch64") ||
    platform.includes("arm")
  ) {
    return "arm64";
  }

  // Check userAgentData for more accurate detection (Chrome 90+)
  if ("userAgentData" in navigator) {
    const uaData = navigator.userAgentData as {
      getHighEntropyValues?: (hints: string[]) => Promise<{ architecture?: string }>;
    };
    // This is async, so we'll handle it separately
  }

  // Default to x64 for Windows
  if (userAgent.includes("win64") || userAgent.includes("x64") || userAgent.includes("amd64")) {
    return "x64";
  }

  // Assume x64 for modern Windows
  if (userAgent.includes("windows")) {
    return "x64";
  }

  return "unknown";
}

export function WindowsDownload() {
  const [arch, setArch] = useState<Architecture>("unknown");
  const [isWindows, setIsWindows] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    setIsWindows(userAgent.includes("windows"));

    // Try high entropy API first (most accurate)
    if ("userAgentData" in navigator) {
      const uaData = navigator.userAgentData as {
        getHighEntropyValues?: (hints: string[]) => Promise<{ architecture?: string }>;
      };
      if (uaData.getHighEntropyValues) {
        uaData.getHighEntropyValues(["architecture"]).then((values) => {
          if (values.architecture === "arm") {
            setArch("arm64");
          } else {
            setArch("x64");
          }
        }).catch(() => {
          setArch(detectArchitecture());
        });
        return;
      }
    }

    setArch(detectArchitecture());
  }, []);

  const isArm = arch === "arm64";

  return (
    <div className="download-card desktop-card desktop-card-windows">
      <div className="download-card-header">
        <div className="browser-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <path d="M3 5.548l7.455-1.02v7.195H3V5.548zm0 13.054l7.455 1.02v-7.167H3v6.147zm8.295 1.132L21 21v-8.545h-9.705v7.279zm0-15.418v7.407H21V3l-9.705 1.316z" fill="#0078D4"/>
          </svg>
        </div>
        <h2>Windows</h2>
        {isWindows && (
          <span className="download-badge download-badge-detected">
            {isArm ? "ARM64 detected" : "x64 detected"}
          </span>
        )}
        {!isWindows && (
          <span className="download-badge download-badge-recommended">Recommended</span>
        )}
      </div>
      <p className="download-description">
        Native Windows app with system tray integration and global hotkeys.
      </p>

      {isArm ? (
        <>
          <div className="download-actions">
            <a
              href="/downloads/PromptPack_0.1.0_arm64-setup.exe"
              className="btn btn-primary download-btn"
              download
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download ARM64 Installer
            </a>
            <a
              href="/downloads/PromptPack_0.1.0_arm64_en-US.msi"
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
          <details className="other-architectures">
            <summary className="other-architectures-summary">
              ▸ Other architectures
            </summary>
            <div className="other-architectures-content">
              <div className="other-architectures-info">
                <span>Version 0.1.0</span>
                <span className="download-meta-dot">•</span>
                <span>Windows 10/11</span>
                <span className="download-meta-dot">•</span>
                <span>x64 (x86 also available)</span>
              </div>
              <div className="download-actions">
                <a
                  href="/downloads/PromptPack_0.1.0_x64-setup.exe"
                  className="btn download-btn download-btn-secondary"
                  download
                >
                  x64 Installer
                </a>
                <a
                  href="/downloads/PromptPack_0.1.0_x86-setup.exe"
                  className="btn download-btn download-btn-secondary"
                  download
                >
                  x86 Installer
                </a>
              </div>
            </div>
          </details>
        </>
      ) : (
        <>
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
              Download x64 Installer
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
          <details className="other-architectures">
            <summary className="other-architectures-summary">
              ▸ Other architectures
            </summary>
            <div className="other-architectures-content">
              <div className="other-architectures-info">
                <span>Version 0.1.0</span>
                <span className="download-meta-dot">•</span>
                <span>Windows 10/11</span>
                <span className="download-meta-dot">•</span>
                <span>x64 (x86 also available)</span>
              </div>
              <div className="download-actions">
                <a
                  href="/downloads/PromptPack_0.1.0_arm64-setup.exe"
                  className="btn download-btn download-btn-secondary"
                  download
                >
                  ARM64 Installer
                </a>
                <a
                  href="/downloads/PromptPack_0.1.0_x86-setup.exe"
                  className="btn download-btn download-btn-secondary"
                  download
                >
                  x86 Installer
                </a>
              </div>
            </div>
          </details>
        </>
      )}

      <div className="download-meta">
        <span>Version 0.1.0</span>
        <span className="download-meta-dot">•</span>
        <span>Windows 10/11</span>
        <span className="download-meta-dot">•</span>
        <span>{isArm ? "ARM64" : "x64"} (x86 also available)</span>
      </div>
    </div>
  );
}
