"use client";

import { useState } from "react";

interface PromptInputProps {
  onSubmit: (text: string) => void;
  isLoading: boolean;
  placeholder?: string;
  maxLength?: number;
  buttonText?: string;
  loadingText?: string;
}

export function PromptInput({
  onSubmit,
  isLoading,
  placeholder = "Paste your prompt here...",
  maxLength = 6000,
  buttonText = "Enhance Prompt",
  loadingText = "Processing...",
}: PromptInputProps) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    onSubmit(trimmed);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, maxLength))}
        placeholder={placeholder}
        rows={8}
        style={{
          width: "100%",
          padding: "1rem",
          backgroundColor: "var(--card, #18181b)",
          border: "1px solid var(--border, #27272a)",
          borderRadius: "8px",
          color: "var(--foreground, #ededed)",
          fontSize: "0.95rem",
          fontFamily: "inherit",
          lineHeight: 1.6,
          resize: "vertical",
          outline: "none",
          transition: "border-color 0.15s",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
        onBlur={(e) => (e.target.style.borderColor = "var(--border, #27272a)")}
        disabled={isLoading}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: "0.8rem",
            color: text.length > maxLength * 0.9 ? "#ef4444" : "var(--muted-foreground, #a1a1aa)",
          }}
        >
          {text.length.toLocaleString()} / {maxLength.toLocaleString()}
        </span>
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || isLoading}
          className="btn btn-primary"
          style={{
            padding: "0.6rem 1.5rem",
            fontSize: "0.95rem",
            opacity: !text.trim() || isLoading ? 0.5 : 1,
            cursor: !text.trim() || isLoading ? "not-allowed" : "pointer",
          }}
        >
          {isLoading ? loadingText : buttonText}
        </button>
      </div>
    </div>
  );
}
