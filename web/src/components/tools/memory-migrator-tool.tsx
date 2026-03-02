"use client";

import { useState, useRef, useCallback } from "react";
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

/**
 * Extract text content from a ChatGPT data export ZIP.
 * Looks for chat.html or conversations.json and extracts a representative sample.
 */
async function extractFromZip(file: File, maxChars: number): Promise<{ text: string; source: string }> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(file);

  // Look for conversations.json first (structured, easier to parse)
  const conversationsFile = zip.file("conversations.json");
  if (conversationsFile) {
    const raw = await conversationsFile.async("string");
    const conversations = JSON.parse(raw) as Array<{
      title?: string;
      mapping?: Record<string, {
        message?: {
          author?: { role?: string };
          content?: { parts?: string[] };
        };
      }>;
    }>;

    const lines: string[] = [];
    for (const convo of conversations) {
      if (lines.join("\n").length > maxChars) break;
      if (convo.title) lines.push(`\n--- ${convo.title} ---`);
      if (convo.mapping) {
        for (const node of Object.values(convo.mapping)) {
          if (!node.message?.content?.parts) continue;
          const role = node.message.author?.role || "unknown";
          if (role === "system") continue;
          const text = node.message.content.parts.filter(p => typeof p === "string").join(" ").trim();
          if (text) {
            const prefix = role === "user" ? "User:" : "Assistant:";
            lines.push(`${prefix} ${text}`);
          }
        }
      }
    }

    const extracted = lines.join("\n").slice(0, maxChars);
    return {
      text: extracted,
      source: `Extracted ${conversations.length} conversations from conversations.json`,
    };
  }

  // Fall back to chat.html
  const chatHtml = zip.file("chat.html");
  if (chatHtml) {
    const html = await chatHtml.async("string");
    // Parse HTML and extract text content from conversation elements
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const lines: string[] = [];

    // ChatGPT exports use various structures — try common patterns
    const messageEls = doc.querySelectorAll("[data-message-author-role], .message, .conversation-turn, p, li");
    if (messageEls.length > 0) {
      for (const el of messageEls) {
        if (lines.join("\n").length > maxChars) break;
        const role = el.getAttribute("data-message-author-role");
        const text = (el as HTMLElement).innerText?.trim() || el.textContent?.trim() || "";
        if (!text || text.length < 3) continue;
        if (role) {
          const prefix = role === "user" ? "User:" : "Assistant:";
          lines.push(`${prefix} ${text}`);
        } else {
          lines.push(text);
        }
      }
    }

    // If structured parsing got nothing, fall back to raw text extraction
    if (lines.length === 0) {
      const bodyText = doc.body?.textContent || "";
      lines.push(bodyText);
    }

    const extracted = lines.join("\n").slice(0, maxChars);
    return {
      text: extracted,
      source: `Extracted content from chat.html (${(html.length / 1024 / 1024).toFixed(1)} MB)`,
    };
  }

  // Last resort: try any .json or .txt file
  const textFiles = Object.keys(zip.files).filter(
    (name) => name.endsWith(".json") || name.endsWith(".txt") || name.endsWith(".md")
  );

  if (textFiles.length > 0) {
    const lines: string[] = [];
    for (const fname of textFiles) {
      if (lines.join("\n").length > maxChars) break;
      const content = await zip.file(fname)!.async("string");
      lines.push(`--- ${fname} ---\n${content}`);
    }
    const extracted = lines.join("\n").slice(0, maxChars);
    return {
      text: extracted,
      source: `Extracted ${textFiles.length} text file(s) from ZIP`,
    };
  }

  throw new Error("Could not find chat.html, conversations.json, or any text files in the ZIP.");
}

const exportSteps = [
  {
    number: "1",
    title: "Open ChatGPT Settings",
    desc: "Click your profile icon in the bottom-left corner of ChatGPT, then click Settings.",
  },
  {
    number: "2",
    title: "Go to Data Controls",
    desc: "In the settings sidebar, click Data Controls.",
  },
  {
    number: "3",
    title: "Export your data",
    desc: "Click Export Data, then confirm by clicking Export. ChatGPT will prepare your data and email you a download link.",
  },
  {
    number: "4",
    title: "Download the ZIP",
    desc: "Check your email (can take a few minutes to 24 hours). Click the download link to get your data.zip file.",
  },
  {
    number: "5",
    title: "Upload it here",
    desc: "Drop the ZIP file into the upload area above or click to browse. We\u2019ll extract your conversations client-side \u2014 nothing leaves your browser until you hit \u201CCreate My Profile\u201D.",
  },
];

function ExportHelpDialog({ onClose }: { onClose: () => void }) {
  return (
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
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          backgroundColor: "var(--card, #18181b)",
          border: "1px solid var(--border, #27272a)",
          borderRadius: "12px",
          padding: "2rem",
          maxWidth: 520,
          width: "100%",
          position: "relative",
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        <button
          onClick={onClose}
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

        <h3 style={{ margin: "0 0 0.25rem", fontSize: "1.2rem", fontWeight: 700 }}>
          How to export your ChatGPT data
        </h3>
        <p style={{ color: "var(--muted-foreground)", margin: "0 0 1.25rem", fontSize: "0.85rem" }}>
          Follow these steps to download your ChatGPT history as a ZIP file.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {exportSteps.map((step) => (
            <div key={step.number} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  backgroundColor: "rgba(99, 102, 241, 0.15)",
                  color: "#818cf8",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {step.number}
              </span>
              <div>
                <h4 style={{ margin: "0 0 0.15rem", fontSize: "0.9rem", fontWeight: 600 }}>
                  {step.title}
                </h4>
                <p style={{ margin: 0, color: "var(--muted-foreground)", fontSize: "0.85rem", lineHeight: 1.5 }}>
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: "1.25rem",
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            backgroundColor: "rgba(99, 102, 241, 0.05)",
            border: "1px solid var(--border, #27272a)",
          }}
        >
          <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--muted-foreground)", lineHeight: 1.5 }}>
            <strong style={{ color: "var(--foreground, #ededed)" }}>Don&apos;t want to wait for the export?</strong>{" "}
            You can also copy your memories directly from ChatGPT Settings &gt; Personalization &gt; Manage Memories and paste them in the text area instead.
          </p>
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: "1.25rem",
            padding: "0.6rem 1.5rem",
            width: "100%",
            fontSize: "0.9rem",
            fontWeight: 600,
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#6366f1",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Got it
        </button>
      </div>
    </div>
  );
}

export function MemoryMigratorTool() {
  const { getToken, isSignedIn } = useAuth();
  const [format, setFormat] = useState<OutputFormat>("memory");
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState<"signup" | "upgrade" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showUpsell, setShowUpsell] = useState(false);
  const [showExportHelp, setShowExportHelp] = useState(false);
  const [fileStatus, setFileStatus] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxLength = 15000;

  const processFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".zip")) {
      setError("Please upload a .zip file (the ChatGPT data export).");
      return;
    }

    // 500MB max for client-side processing
    if (file.size > 500 * 1024 * 1024) {
      setError("File is too large (max 500 MB). Try exporting a smaller date range from ChatGPT, or copy-paste your memories directly.");
      return;
    }

    setIsProcessingFile(true);
    setError(null);
    setFileStatus(null);

    try {
      const result = await extractFromZip(file, maxLength);
      setText(result.text);
      setFileStatus(result.source);
      trackEvent("migrate-memory-zip-uploaded", { size: Math.round(file.size / 1024).toString() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process ZIP file.");
    } finally {
      setIsProcessingFile(false);
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [maxLength]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

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

      {/* ZIP file upload zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        style={{
          padding: "1.25rem",
          borderRadius: "8px",
          border: `2px dashed ${isDragOver ? "#6366f1" : "var(--border, #27272a)"}`,
          backgroundColor: isDragOver ? "rgba(99, 102, 241, 0.08)" : "transparent",
          textAlign: "center",
          cursor: isProcessingFile ? "wait" : "pointer",
          transition: "all 0.15s",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) processFile(file);
          }}
        />
        {isProcessingFile ? (
          <p style={{ margin: 0, color: "#818cf8", fontSize: "0.9rem" }}>
            Extracting conversations from ZIP...
          </p>
        ) : (
          <>
            <p style={{ margin: "0 0 0.25rem", fontSize: "0.95rem", fontWeight: 600 }}>
              Drop your ChatGPT data export ZIP here
            </p>
            <p style={{ margin: 0, color: "var(--muted-foreground)", fontSize: "0.8rem" }}>
              or click to browse &mdash; we&apos;ll extract your conversations client-side (nothing uploaded until you submit)
            </p>
          </>
        )}
      </div>

      {/* Help link */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: "-0.75rem" }}>
        <button
          onClick={(e) => { e.stopPropagation(); setShowExportHelp(true); }}
          style={{
            background: "none",
            border: "none",
            color: "#6366f1",
            cursor: "pointer",
            fontSize: "0.8rem",
            padding: 0,
            textDecoration: "underline",
            textUnderlineOffset: "2px",
          }}
        >
          How do I get the data export ZIP?
        </button>
      </div>

      {showExportHelp && <ExportHelpDialog onClose={() => setShowExportHelp(false)} />}

      {fileStatus && (
        <p style={{ margin: 0, fontSize: "0.8rem", color: "#22c55e" }}>
          &#10003; {fileStatus}
        </p>
      )}

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border, #27272a)" }} />
        <span style={{ fontSize: "0.8rem", color: "var(--muted-foreground)" }}>or paste manually</span>
        <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border, #27272a)" }} />
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
