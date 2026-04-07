"use client";

import { useState } from "react";
import { X, Download, ChevronRight } from "lucide-react";
import type { PromptPreset } from "./preset-data";

interface PresetDetailModalProps {
  preset: PromptPreset;
  relatedPresets: PromptPreset[];
  onClose: () => void;
  onSelectRelated: (id: string) => void;
}

function darkenColor(hex: string, amount: number): string {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - amount);
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - amount);
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - amount);
  return `rgb(${r}, ${g}, ${b})`;
}

function GradientPlaceholder({ color, size = "small" }: { color: string; size?: "large" | "small" }) {
  const dark = darkenColor(color, 80);
  return (
    <div
      style={{
        background: `radial-gradient(circle at 30% 30%, ${color}, ${dark})`,
        width: "100%",
        height: size === "large" ? "100%" : "80px",
        borderRadius: "0.5rem",
      }}
    />
  );
}

export function PresetDetailModal({
  preset,
  relatedPresets,
  onClose,
  onSelectRelated,
}: PresetDetailModalProps) {
  const [expandedPrompt, setExpandedPrompt] = useState<number | null>(null);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = `/presets/${preset.fileName}`;
    link.download = preset.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="modal-overlay"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        className="preset-detail-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--card)",
          borderRadius: "1rem",
          border: "1px solid var(--border)",
          maxWidth: "640px",
          width: "90vw",
          maxHeight: "85vh",
          overflowY: "auto",
          padding: "1.5rem",
          position: "relative",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            background: "none",
            border: "none",
            color: "var(--foreground)",
            cursor: "pointer",
            padding: "0.25rem",
            zIndex: 1,
          }}
        >
          <X size={20} />
        </button>

        {/* Image gallery: 4 images in 2x2 grid, 2:3 aspect ratio */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "1.5rem" }}>
          {(preset.images.length > 0 ? preset.images.slice(0, 4) : [null, null, null, null]).map((img, i) => (
            <div key={i} style={{ aspectRatio: "2/3", borderRadius: "0.5rem", overflow: "hidden" }}>
              {img ? (
                <img
                  src={img}
                  alt={`${preset.name} style ${i + 1}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              ) : (
                <GradientPlaceholder color={preset.colorAccent} size="large" />
              )}
            </div>
          ))}
        </div>

        {/* Header */}
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem" }}>
          {preset.name}
        </h2>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.75rem", fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
          <span>by <strong style={{ color: "var(--accent)" }}>{preset.owner}</strong></span>
          <span>·</span>
          <span style={{
            background: "var(--secondary)",
            padding: "0.125rem 0.5rem",
            borderRadius: "9999px",
            fontSize: "0.75rem",
            textTransform: "capitalize",
          }}>
            {preset.category}
          </span>
          <span>·</span>
          <span>{preset.prompts.length} prompts</span>
        </div>

        <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem", marginBottom: "1.25rem", lineHeight: 1.5 }}>
          {preset.description}
        </p>

        {/* Prompt accordion */}
        <div style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted-foreground)" }}>
            Style Definitions
          </h3>
          {preset.prompts.map((prompt, i) => (
            <div
              key={i}
              style={{
                borderBottom: "1px solid var(--border)",
              }}
            >
              <button
                onClick={() => setExpandedPrompt(expandedPrompt === i ? null : i)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.625rem 0",
                  background: "none",
                  border: "none",
                  color: "var(--foreground)",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  textAlign: "left",
                }}
              >
                {prompt.header}
                <ChevronRight
                  size={16}
                  style={{
                    transform: expandedPrompt === i ? "rotate(90deg)" : "rotate(0)",
                    transition: "transform 0.2s",
                    flexShrink: 0,
                    marginLeft: "0.5rem",
                  }}
                />
              </button>
              {expandedPrompt === i && (
                <p style={{
                  fontSize: "0.8125rem",
                  color: "var(--muted-foreground)",
                  lineHeight: 1.6,
                  padding: "0 0 0.75rem",
                }}>
                  {prompt.text}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Download button */}
        <button
          onClick={handleDownload}
          style={{
            width: "100%",
            padding: "0.75rem",
            background: "var(--accent)",
            color: "var(--accent-foreground)",
            border: "none",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            marginBottom: "1.5rem",
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "var(--accent-hover)")}
          onMouseOut={(e) => (e.currentTarget.style.background = "var(--accent)")}
        >
          <Download size={18} />
          Download Free
        </button>

        {/* Related styles */}
        {relatedPresets.length > 0 && (
          <>
            <h3 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted-foreground)" }}>
              Related Styles
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
              {relatedPresets.slice(0, 3).map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => onSelectRelated(rel.id)}
                  style={{
                    cursor: "pointer",
                    borderRadius: "0.5rem",
                    overflow: "hidden",
                    border: "1px solid var(--border)",
                    transition: "border-color 0.2s",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                  onMouseOut={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                >
                  {rel.images.length > 0 ? (
                    <img
                      src={rel.images[0]}
                      alt={rel.name}
                      style={{ width: "100%", height: "60px", objectFit: "cover", display: "block" }}
                    />
                  ) : (
                    <div
                      style={{
                        height: "60px",
                        background: `radial-gradient(circle at 30% 30%, ${rel.colorAccent}, ${darkenColor(rel.colorAccent, 80)})`,
                      }}
                    />
                  )}
                  <div style={{ padding: "0.375rem 0.5rem" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 600 }}>{rel.name}</div>
                    <div style={{ fontSize: "0.625rem", color: "var(--muted-foreground)", textTransform: "capitalize" }}>{rel.category}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
