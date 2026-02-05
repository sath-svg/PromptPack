"use client";

import Image from "next/image";
import { assetUrl } from "@/lib/constants";
import { useState, useRef } from "react";

export function DownloadButtons() {
  const [pendingDownload, setPendingDownload] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const handleDownloadClick = (e: React.MouseEvent<HTMLAnchorElement>, url: string) => {
    e.preventDefault();
    setPendingDownload(url);
    dialogRef.current?.showModal();
  };

  const handleContinueDownload = () => {
    if (pendingDownload) {
      const link = document.createElement('a');
      link.href = pendingDownload;
      link.download = '';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    dialogRef.current?.close();
    setPendingDownload(null);
  };

  const handleCloseDialog = () => {
    dialogRef.current?.close();
    setPendingDownload(null);
  };

  return (
    <div className="download-buttons-section">
      {/* Desktop Apps Row */}
      <div className="download-buttons-row">
        <a
          href="/downloads"
          className="download-pill"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          <span>macOS</span>
        </a>
        <a
          href="/downloads/PromptPack_0.1.0_x64-setup.exe"
          className="download-pill"
          onClick={(e) => handleDownloadClick(e, "/downloads/PromptPack_0.1.0_x64-setup.exe")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 5.548l7.455-1.02v7.195H3V5.548zm0 13.054l7.455 1.02v-7.167H3v6.147zm8.295 1.132L21 21v-8.545h-9.705v7.279zm0-15.418v7.407H21V3l-9.705 1.316z"/>
          </svg>
          <span>Windows (x64)</span>
        </a>
        <a
          href="/downloads/PromptPack_0.1.0_arm64-setup.exe"
          className="download-pill"
          onClick={(e) => handleDownloadClick(e, "/downloads/PromptPack_0.1.0_arm64-setup.exe")}
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
          href="/downloads#browser-extensions"
          className="download-pill"
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

      <dialog ref={dialogRef} className="download-warning-dialog" onClick={(e) => { if (e.target === dialogRef.current) handleCloseDialog(); }}>
        <div className="download-warning-content">
          <div className="download-warning-header">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <h3>Windows SmartScreen Notice</h3>
            <button className="download-warning-close" onClick={handleCloseDialog} aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div className="download-warning-body">
            <p>
              Windows may show <strong>&quot;Windows protected your PC&quot;</strong> because this app isn&apos;t code-signed yet.
            </p>
            <div className="smartscreen-steps">
              <p><strong>To install:</strong></p>
              <ol>
                <li>Click <strong>&quot;More info&quot;</strong> on the SmartScreen popup</li>
                <li>Click <strong>&quot;Run anyway&quot;</strong></li>
              </ol>
            </div>
            <p className="smartscreen-safe">
              This app is safe &mdash; it&apos;s open source and you can verify the code yourself.
            </p>
          </div>
          <div className="download-warning-actions">
            <button className="btn" onClick={handleCloseDialog}>Cancel</button>
            <button className="btn btn-primary" onClick={handleContinueDownload}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download Anyway
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
