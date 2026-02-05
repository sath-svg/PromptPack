"use client";

import { useEffect, useState } from "react";

type Architecture = "x64" | "arm64" | "x86" | "unknown";

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

  // Check for x86 (32-bit)
  if (userAgent.includes("wow64") || userAgent.includes("win32")) {
    // WOW64 means 32-bit app on 64-bit Windows
    if (userAgent.includes("x64") || userAgent.includes("win64")) {
      return "x64";
    }
    return "x86";
  }

  // Check for x64
  if (userAgent.includes("win64") || userAgent.includes("x64") || userAgent.includes("amd64")) {
    return "x64";
  }

  // Default to x64 for modern Windows
  if (userAgent.includes("windows")) {
    return "x64";
  }

  return "unknown";
}

async function detectArchitectureAsync(): Promise<Architecture> {
  // Try high entropy API first (most accurate)
  if ("userAgentData" in navigator) {
    const uaData = navigator.userAgentData as {
      getHighEntropyValues?: (hints: string[]) => Promise<{
        architecture?: string;
        bitness?: string;
      }>;
    };

    if (uaData.getHighEntropyValues) {
      try {
        const values = await uaData.getHighEntropyValues(["architecture", "bitness"]);
        if (values.architecture === "arm") {
          return "arm64";
        }
        if (values.bitness === "64") {
          return "x64";
        }
        if (values.bitness === "32") {
          return "x86";
        }
      } catch (e) {
        // Fall through to basic detection
      }
    }
  }

  return detectArchitecture();
}

export function InstallAppButton() {
  const [arch, setArch] = useState<Architecture>("unknown");
  const [isWindows, setIsWindows] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    setIsWindows(userAgent.includes("windows"));

    detectArchitectureAsync().then(setArch);
  }, []);

  if (!isWindows) {
    return null; // Don't show on non-Windows systems
  }

  const getDownloadUrl = () => {
    switch (arch) {
      case "arm64":
        return "/downloads/PromptPack_0.1.0_arm64-setup.exe";
      case "x86":
        return "/downloads/PromptPack_0.1.0_x86-setup.exe";
      case "x64":
      default:
        return "/downloads/PromptPack_0.1.0_x64-setup.exe";
    }
  };

  const getArchLabel = () => {
    switch (arch) {
      case "arm64":
        return "ARM64";
      case "x86":
        return "32-bit";
      case "x64":
        return "64-bit";
      default:
        return "";
    }
  };

  return (
    <a
      href={getDownloadUrl()}
      className="btn btn-primary"
      download
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      <span>
        Install Desktop App
        {arch !== "unknown" && (
          <span style={{ fontSize: "0.75rem", opacity: 0.8, marginLeft: "0.25rem" }}>
            ({getArchLabel()})
          </span>
        )}
      </span>
    </a>
  );
}
