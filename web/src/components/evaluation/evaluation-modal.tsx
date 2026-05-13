"use client";

import { getScoreColor, getScoreBgColor } from "./score-badge";
import type {
  PromptEvaluation,
  EvalTierKey,
  EvalTierRow,
  EvalModelRow,
  EvalByokRow,
} from "./use-evaluation";

interface EvaluationModalProps {
  evaluation: PromptEvaluation;
  promptHeader?: string;
  onClose: () => void;
}

const TIER_ORDER: EvalTierKey[] = ["cheap", "mid", "frontier"];

const TIER_LABELS: Record<EvalTierKey, string> = {
  cheap: "Cheap",
  mid: "Mid",
  frontier: "Frontier",
};

const TIER_DOT_COLORS: Record<EvalTierKey, string> = {
  cheap: "rgb(34, 197, 94)",
  mid: "rgb(59, 130, 246)",
  frontier: "rgb(168, 85, 247)",
};

const TIER_RING_COLORS: Record<EvalTierKey, string> = {
  cheap: "rgba(34, 197, 94, 0.5)",
  mid: "rgba(59, 130, 246, 0.55)",
  frontier: "rgba(168, 85, 247, 0.55)",
};

const EFFORT_LABELS: Record<NonNullable<PromptEvaluation["recommendedEffort"]>, string> = {
  low: "Light",
  medium: "Standard",
  high: "Deep",
};

const BYOK_PROVIDER_LABELS: Record<EvalByokRow["provider"], string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  gemini: "Google",
  grok: "xAI",
  deepseek: "DeepSeek",
  perplexity: "Perplexity",
  kimi: "Moonshot",
};

export function EvaluationModal({ evaluation, promptHeader, onClose }: EvaluationModalProps) {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  const recommendedTier = evaluation.recommendedTier;
  const effortLabel = evaluation.recommendedEffort ? EFFORT_LABELS[evaluation.recommendedEffort] : null;

  return (
    <div
      className="modal-overlay"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        className="evaluation-modal"
        style={{
          position: "relative",
          backgroundColor: "var(--card-bg)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          width: "100%",
          maxWidth: "440px",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1rem",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--foreground)", margin: 0 }}>
              Prompt Evaluation
            </h2>
            {promptHeader && (
              <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginTop: "0.25rem", margin: 0 }}>
                {promptHeader}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              padding: "0.375rem",
              borderRadius: "4px",
              background: "transparent",
              border: "none",
              color: "var(--muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Per-tier scores */}
        <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Score by tier
          </div>
          {TIER_ORDER.map((tier) => (
            <TierRow key={tier} row={evaluation.tiers[tier]} isRecommended={tier === recommendedTier} />
          ))}
        </div>

        {/* Best-tier banner */}
        <div
          style={{
            padding: "0.75rem 1rem",
            borderTop: "1px solid var(--border)",
            backgroundColor: "var(--accent)",
            display: "flex",
            flexDirection: "column",
            gap: "0.375rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Best fit:
            </span>
            <span style={{ fontSize: "0.875rem", fontWeight: 600, color: TIER_DOT_COLORS[recommendedTier] }}>
              {TIER_LABELS[recommendedTier]}
            </span>
            {effortLabel && (
              <span
                style={{
                  fontSize: "0.6875rem",
                  padding: "0.125rem 0.375rem",
                  borderRadius: "4px",
                  backgroundColor: "rgba(120, 120, 120, 0.2)",
                  color: "var(--muted)",
                }}
              >
                {effortLabel} effort
              </span>
            )}
          </div>
          {evaluation.rationale && (
            <p style={{ fontSize: "0.75rem", color: "var(--muted)", fontStyle: "italic", margin: 0 }}>
              "{evaluation.rationale}"
            </p>
          )}
        </div>

        {/* Per-model breakdown within the best tier */}
        <div
          style={{
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            borderTop: "1px solid var(--border)",
          }}
        >
          <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Models in {TIER_LABELS[recommendedTier]} tier
          </div>
          {evaluation.bestTierModels.map((m) => (
            <ModelRow
              key={m.modelId}
              model={m}
              isRecommended={m.modelId === evaluation.recommendedModelId}
            />
          ))}
        </div>

        {/* BYOK section */}
        {evaluation.byok && evaluation.byok.length > 0 && (
          <div
            style={{
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              borderTop: "1px solid var(--border)",
            }}
          >
            <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Your API keys
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "180px", overflowY: "auto" }}>
              {evaluation.byok.map((row) => (
                <ByokRowDisplay key={row.provider} row={row} />
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            padding: "0.75rem",
            borderTop: "1px solid var(--border)",
            backgroundColor: "var(--accent)",
          }}
        >
          <p style={{ fontSize: "0.75rem", textAlign: "center", color: "var(--muted)", margin: 0 }}>
            Evaluated on{" "}
            {new Date(evaluation.evaluatedAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

function TierRow({ row, isRecommended }: { row: EvalTierRow; isRecommended: boolean }) {
  const color = getScoreColor(row.score);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.375rem 0.5rem",
        borderRadius: "6px",
        boxShadow: isRecommended ? `0 0 0 2px ${TIER_RING_COLORS[row.tier]}` : undefined,
      }}
    >
      <span
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: TIER_DOT_COLORS[row.tier],
          flexShrink: 0,
        }}
      />
      <div style={{ width: "72px", flexShrink: 0, fontSize: "0.875rem", fontWeight: 500, color: "var(--foreground)" }}>
        {TIER_LABELS[row.tier]}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "0.75rem",
            color: "var(--muted)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {row.selectedModelLabel}
        </div>
        <div
          style={{
            marginTop: "0.25rem",
            height: "6px",
            borderRadius: "3px",
            backgroundColor: "var(--accent)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              borderRadius: "3px",
              width: `${row.score}%`,
              backgroundColor: color,
              transition: "width 0.5s ease",
            }}
          />
        </div>
      </div>
      <div
        style={{
          width: "36px",
          textAlign: "right",
          fontSize: "0.875rem",
          fontWeight: 600,
          fontVariantNumeric: "tabular-nums",
          color,
        }}
      >
        {row.score}
      </div>
    </div>
  );
}

function ModelRow({ model, isRecommended }: { model: EvalModelRow; isRecommended: boolean }) {
  const color = getScoreColor(model.score);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: "0.375rem" }}>
        <span
          style={{
            fontSize: "0.875rem",
            color: "var(--foreground)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {model.label}
        </span>
        {isRecommended && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="1.5" aria-label="Recommended model">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        )}
      </div>
      <div style={{ width: "96px", height: "6px", borderRadius: "3px", backgroundColor: "var(--accent)", overflow: "hidden", flexShrink: 0 }}>
        <div
          style={{
            height: "100%",
            borderRadius: "3px",
            width: `${model.score}%`,
            backgroundColor: color,
            transition: "width 0.5s ease",
          }}
        />
      </div>
      <div
        style={{
          width: "36px",
          textAlign: "right",
          fontSize: "0.875rem",
          fontWeight: 600,
          fontVariantNumeric: "tabular-nums",
          color,
        }}
      >
        {model.score}
      </div>
    </div>
  );
}

function ByokRowDisplay({ row }: { row: EvalByokRow }) {
  const color = getScoreColor(row.score);
  const bgColor = getScoreBgColor(row.score);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      <span
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: TIER_DOT_COLORS[row.tier],
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0, fontSize: "0.875rem" }}>
        <span style={{ color: "var(--foreground)", fontWeight: 500 }}>{BYOK_PROVIDER_LABELS[row.provider]}</span>
        <span style={{ color: "var(--muted)" }}> · {row.modelLabel}</span>
      </div>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.75rem",
          fontWeight: 600,
          borderRadius: "4px",
          padding: "0.125rem 0.375rem",
          minWidth: "28px",
          fontVariantNumeric: "tabular-nums",
          backgroundColor: bgColor,
          color,
        }}
      >
        {row.score}
      </span>
    </div>
  );
}
