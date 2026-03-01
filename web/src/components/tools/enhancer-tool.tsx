"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { PromptInput } from "./prompt-input";
import { ToolResultCard } from "./tool-result-card";
import { RateLimitBanner } from "./rate-limit-banner";
import { WORKERS_API_URL } from "@/lib/constants";
import { trackEvent } from "@/lib/analytics";

type EnhanceMode = "clarity" | "structured" | "concise" | "strict";

const modes: { value: EnhanceMode; label: string; description: string }[] = [
  { value: "structured", label: "Structured", description: "Organized with clear sections" },
  { value: "clarity", label: "Clarity", description: "Clearer and less ambiguous" },
  { value: "concise", label: "Concise", description: "Shorter while keeping intent" },
  { value: "strict", label: "Strict", description: "Add constraints and edge cases" },
];

export function EnhancerTool() {
  const { getToken, isSignedIn } = useAuth();
  const [mode, setMode] = useState<EnhanceMode>("structured");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState<"signup" | "upgrade" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (text: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setRateLimited(null);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (isSignedIn) {
        const token = await getToken();
        if (token) headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${WORKERS_API_URL}/api/web/enhance`, {
        method: "POST",
        headers,
        body: JSON.stringify({ text, mode }),
      });

      const data = await response.json() as {
        enhanced?: string;
        error?: string;
        code?: string;
      };

      if (response.status === 429) {
        setRateLimited(isSignedIn ? "upgrade" : "signup");
        return;
      }

      if (!response.ok || !data.enhanced) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setResult(data.enhanced);
      trackEvent("enhance-tool-used", { mode, authenticated: isSignedIn ? "yes" : "no" });
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Mode selector */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {modes.map((m) => (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            title={m.description}
            style={{
              padding: "0.4rem 0.9rem",
              fontSize: "0.85rem",
              borderRadius: "6px",
              border: `1px solid ${mode === m.value ? "#6366f1" : "var(--border, #27272a)"}`,
              backgroundColor: mode === m.value ? "rgba(99, 102, 241, 0.15)" : "transparent",
              color: mode === m.value ? "#818cf8" : "var(--muted-foreground)",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      <PromptInput
        onSubmit={handleSubmit}
        isLoading={isLoading}
        placeholder="Paste your prompt here and we'll enhance it..."
        buttonText="Enhance Prompt"
        loadingText="Enhancing..."
      />

      {error && (
        <p style={{ color: "#ef4444", margin: 0, fontSize: "0.9rem" }}>{error}</p>
      )}

      {rateLimited && <RateLimitBanner variant={rateLimited} />}

      {result && (
        <ToolResultCard title="Enhanced Prompt" content={result} />
      )}
    </div>
  );
}
