"use client";

import { useState } from "react";

export function NpxInstall() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText("npx -y pmtpk");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="npx-install">
      <span className="npx-install-label">MCP Server</span>
      <div className="npx-install-box">
        <code className="npx-install-code">
          <span className="npx-muted">$</span> npx -y pmtpk
        </code>
        <button
          className="npx-install-copy"
          onClick={handleCopy}
          title="Copy to clipboard"
          aria-label="Copy command"
        >
          {copied ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
