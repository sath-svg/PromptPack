"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { SignUpButton } from "@clerk/nextjs";
import Link from "next/link";
import { ToolResultCard } from "./tool-result-card";
import { RateLimitBanner } from "./rate-limit-banner";
import { WORKERS_API_URL } from "@/lib/constants";
import { trackEvent } from "@/lib/analytics";

type OutputFormat = "memory" | "claude-md";

const formats: { value: OutputFormat; label: string; description: string }[] = [
  { value: "memory", label: "Claude Memory", description: "For Claude Settings > Memory" },
  { value: "claude-md", label: "CLAUDE.md", description: "For Claude Code projects" },
];

export function MemoryMigratorTool() {
  const { getToken, isSignedIn } = useAuth();
  const [format, setFormat] = useState<OutputFormat>("memory");
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState<"signup" | "upgrade" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showUpsell, setShowUpsell] = useState(false);

  const maxLength = 15000;

  const handleSubmit = async () => {
    if (!text.trim() || isLoading) return;

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

      const response = await fetch(`${WORKERS_API_URL}/api/web/migrate-memory`, {
        method: "POST",
        headers,
        body: JSON.stringify({ text: text.trim(), format }),
      });

      const data = await response.json() as {
        organized?: string;
        error?: string;
        code?: string;
      };

      if (response.status === 429) {
        setRateLimited(isSignedIn ? "upgrade" : "signup");
        return;
      }

      if (!response.ok || !data.organized) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setResult(data.organized);
      trackEvent("migrate-memory-tool-used", { format, authenticated: isSignedIn ? "yes" : "no" });
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportToClaude = () => {
    setShowUpsell(true);
    trackEvent("migrate-memory-import-clicked");
  };

  const handleContinueToClaude = () => {
    setShowUpsell(false);
    window.open("https://claude.ai/settings", "_blank", "noopener,noreferrer");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Format selector */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {formats.map((f) => (
          <button
            key={f.value}
            onClick={() => setFormat(f.value)}
            title={f.description}
            style={{
              padding: "0.4rem 0.9rem",
              fontSize: "0.85rem",
              borderRadius: "6px",
              border: `1px solid ${format === f.value ? "#6366f1" : "var(--border, #27272a)"}`,
              backgroundColor: format === f.value ? "rgba(99, 102, 241, 0.15)" : "transparent",
              color: format === f.value ? "#818cf8" : "var(--muted-foreground)",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Input textarea */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, maxLength))}
          placeholder={"Paste your ChatGPT content here...\n\nYou can paste:\n\u2022 Memories from ChatGPT Settings > Personalization > Manage Memories\n\u2022 Conversation excerpts from your chat history\n\u2022 Text copied from your exported chat.html file\n\nThe more context you provide, the richer your profile will be."}
          rows={14}
          maxLength={maxLength}
          style={{
            width: "100%",
            padding: "0.75rem",
            fontSize: "0.95rem",
            lineHeight: 1.6,
            borderRadius: "8px",
            border: "1px solid var(--border, #27272a)",
            backgroundColor: "var(--card, #18181b)",
            color: "var(--foreground, #ededed)",
            resize: "vertical",
            outline: "none",
            fontFamily: "inherit",
            boxSizing: "border-box",
          }}
          onFocus={(e) => { e.target.style.borderColor = "#6366f1"; }}
          onBlur={(e) => { e.target.style.borderColor = "var(--border, #27272a)"; }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--muted-foreground)" }}>
            {text.length.toLocaleString()} / {maxLength.toLocaleString()}
          </span>
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || isLoading}
            style={{
              padding: "0.6rem 1.5rem",
              fontSize: "0.95rem",
              fontWeight: 600,
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#6366f1",
              color: "#fff",
              cursor: !text.trim() || isLoading ? "not-allowed" : "pointer",
              opacity: !text.trim() || isLoading ? 0.5 : 1,
              transition: "all 0.15s",
            }}
          >
            {isLoading ? "Analyzing..." : "Create My Profile"}
          </button>
        </div>
      </div>

      {error && (
        <p style={{ color: "#ef4444", margin: 0, fontSize: "0.9rem" }}>{error}</p>
      )}

      {rateLimited && <RateLimitBanner variant={rateLimited} />}

      {result && (
        <>
          <ToolResultCard title="Your Claude Profile" content={result}>
            <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <button
                onClick={handleImportToClaude}
                style={{
                  padding: "0.6rem 1.5rem",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#6366f1",
                  color: "#fff",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  width: "100%",
                }}
              >
                Import to Claude Memory &rarr;
              </button>
              <p style={{ fontSize: "0.8rem", color: "var(--muted-foreground)", margin: 0, textAlign: "center" }}>
                Copy the profile above, then paste it into Claude Settings &gt; Capabilities &gt; Memory
              </p>
            </div>
          </ToolResultCard>
        </>
      )}

      {/* PromptPack upsell popup */}
      {showUpsell && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowUpsell(false); }}
        >
          <div
            style={{
              backgroundColor: "var(--card, #18181b)",
              border: "1px solid var(--border, #27272a)",
              borderRadius: "12px",
              padding: "2rem",
              maxWidth: 480,
              width: "100%",
              position: "relative",
            }}
          >
            <button
              onClick={() => setShowUpsell(false)}
              style={{
                position: "absolute",
                top: "0.75rem",
                right: "0.75rem",
                background: "none",
                border: "none",
                color: "var(--muted-foreground)",
                cursor: "pointer",
                fontSize: "1.2rem",
                padding: "0.25rem",
              }}
            >
              &times;
            </button>

            <h3 style={{ margin: "0 0 0.75rem", fontSize: "1.2rem", fontWeight: 700 }}>
              Context is just the start
            </h3>
            <p style={{ color: "var(--muted-foreground)", margin: "0 0 1rem", fontSize: "0.95rem", lineHeight: 1.6 }}>
              Your profile gives Claude context about <em>who you are</em> — but your best prompts are what make Claude actually useful. Save and organize your top prompts with PromptPack so they work across ChatGPT, Claude, and Gemini.
            </p>

            <div
              style={{
                padding: "1rem",
                borderRadius: "8px",
                border: "1px solid var(--border, #27272a)",
                backgroundColor: "rgba(99, 102, 241, 0.05)",
                marginBottom: "1.25rem",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.9rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ color: "#22c55e" }}>&#10003;</span>
                  <span>Save prompts that work across all AI assistants</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ color: "#22c55e" }}>&#10003;</span>
                  <span>Create custom prompt packs with templates</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ color: "#22c55e" }}>&#10003;</span>
                  <span>Access your prompts directly inside ChatGPT &amp; Claude</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {isSignedIn ? (
                <Link
                  href="/pricing"
                  className="btn btn-primary"
                  style={{
                    padding: "0.6rem 1.5rem",
                    textAlign: "center",
                    display: "block",
                    fontSize: "0.95rem",
                    fontWeight: 600,
                  }}
                >
                  Go Pro &mdash; Create Prompt Packs
                </Link>
              ) : (
                <SignUpButton mode="modal">
                  <button
                    className="btn btn-primary"
                    style={{
                      padding: "0.6rem 1.5rem",
                      width: "100%",
                      fontSize: "0.95rem",
                      fontWeight: 600,
                    }}
                  >
                    Sign Up Free &mdash; Start Saving Prompts
                  </button>
                </SignUpButton>
              )}
              <button
                onClick={handleContinueToClaude}
                style={{
                  padding: "0.6rem 1.5rem",
                  fontSize: "0.9rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border, #27272a)",
                  backgroundColor: "transparent",
                  color: "var(--muted-foreground)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  width: "100%",
                }}
              >
                Continue to Claude Settings &rarr;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
