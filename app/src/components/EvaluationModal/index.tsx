import { createPortal } from 'react-dom';
import { X, Star } from 'lucide-react';
import type { PromptEvaluation, EvalTierKey, EvalTierRow } from '../../types';
import { getScoreColor, getScoreBgColor } from '../ScoreBadge';
import {
  MANAGED_TIER_LABELS,
  BYOK_PROVIDER_LABELS,
  type ManagedTier,
} from '../../lib/managed-models';
import { EFFORT_DISPLAY_LABELS } from '../../lib/classifier';

interface EvaluationModalProps {
  evaluation: PromptEvaluation;
  promptHeader?: string;
  onClose: () => void;
}

const TIER_ORDER: EvalTierKey[] = ['cheap', 'mid', 'frontier'];

// Tier accent colors — kept literal so Tailwind purge picks them up. Mirrors
// MANAGED_TIER_COLORS but split into ring + dot variants for the modal.
const TIER_RING_COLORS: Record<EvalTierKey, string> = {
  cheap: 'rgba(34, 197, 94, 0.5)',   // green-500
  mid: 'rgba(59, 130, 246, 0.55)',   // blue-500
  frontier: 'rgba(168, 85, 247, 0.55)', // purple-500
};

const TIER_DOT_COLORS: Record<EvalTierKey, string> = {
  cheap: 'rgb(34, 197, 94)',
  mid: 'rgb(59, 130, 246)',
  frontier: 'rgb(168, 85, 247)',
};

export function EvaluationModal({ evaluation, promptHeader, onClose }: EvaluationModalProps) {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  const recommendedTier = evaluation.recommendedTier;
  const effortLabel = evaluation.recommendedEffort
    ? EFFORT_DISPLAY_LABELS[evaluation.recommendedEffort]
    : null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div className="relative bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Prompt Evaluation
            </h2>
            {promptHeader && (
              <p className="text-sm text-[var(--muted-foreground)] mt-0.5 line-clamp-1">
                {promptHeader}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-[var(--accent)] text-[var(--muted-foreground)] transition-colors"
            aria-label="Close evaluation"
          >
            <X size={20} />
          </button>
        </div>

        {/* Per-tier scores */}
        <div className="p-4 space-y-2.5">
          <div className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
            Score by tier
          </div>
          {TIER_ORDER.map((tier) => (
            <TierRow
              key={tier}
              row={evaluation.tiers[tier]}
              isRecommended={tier === recommendedTier}
            />
          ))}
        </div>

        {/* Best-tier breakdown */}
        <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--accent)]/30 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
              Best fit:
            </span>
            <span
              className="text-sm font-semibold"
              style={{ color: TIER_DOT_COLORS[recommendedTier] }}
            >
              {MANAGED_TIER_LABELS[recommendedTier as ManagedTier]}
            </span>
            {effortLabel && (
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-[var(--muted)]/30 text-[var(--muted-foreground)]">
                {effortLabel} effort
              </span>
            )}
          </div>
          {evaluation.rationale && (
            <p className="text-xs text-[var(--muted-foreground)] italic">
              "{evaluation.rationale}"
            </p>
          )}
        </div>

        {/* Per-model breakdown within the best tier */}
        <div className="p-4 space-y-2 border-t border-[var(--border)]">
          <div className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
            Models in {MANAGED_TIER_LABELS[recommendedTier as ManagedTier]} tier
          </div>
          {evaluation.bestTierModels.map((m) => (
            <ModelRow
              key={m.modelId}
              label={m.label}
              score={m.score}
              isRecommended={m.modelId === evaluation.recommendedModelId}
            />
          ))}
        </div>

        {/* BYOK section */}
        {evaluation.byok && evaluation.byok.length > 0 && (
          <div className="p-4 space-y-2 border-t border-[var(--border)]">
            <div className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
              Your API keys
            </div>
            <div className="space-y-2 max-h-[180px] overflow-y-auto">
              {evaluation.byok.map((row) => (
                <ByokRow
                  key={row.provider}
                  providerLabel={BYOK_PROVIDER_LABELS[row.provider]}
                  modelLabel={row.modelLabel}
                  score={row.score}
                  tier={row.tier}
                />
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 border-t border-[var(--border)] bg-[var(--accent)]/30">
          <p className="text-xs text-center text-[var(--muted-foreground)]">
            Evaluated on{' '}
            {new Date(evaluation.evaluatedAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function TierRow({ row, isRecommended }: { row: EvalTierRow; isRecommended: boolean }) {
  const color = getScoreColor(row.score);
  const ringStyle = isRecommended
    ? { boxShadow: `0 0 0 2px ${TIER_RING_COLORS[row.tier]}` }
    : undefined;
  return (
    <div
      className="flex items-center gap-3 rounded-md px-2 py-1.5"
      style={ringStyle}
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: TIER_DOT_COLORS[row.tier] }}
      />
      <div className="w-20 flex-shrink-0 text-sm font-medium text-[var(--foreground)]">
        {MANAGED_TIER_LABELS[row.tier as ManagedTier]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-[var(--muted-foreground)] truncate">
          {row.selectedModelLabel}
        </div>
        <div className="mt-1 h-1.5 rounded-full bg-[var(--accent)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${row.score}%`, backgroundColor: color }}
          />
        </div>
      </div>
      <div
        className="w-9 text-right text-sm font-semibold tabular-nums"
        style={{ color }}
      >
        {row.score}
      </div>
    </div>
  );
}

function ModelRow({
  label,
  score,
  isRecommended,
}: {
  label: string;
  score: number;
  isRecommended: boolean;
}) {
  const color = getScoreColor(score);
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 min-w-0 flex items-center gap-1.5">
        <span className="text-sm text-[var(--foreground)] truncate">{label}</span>
        {isRecommended && (
          <Star
            size={12}
            fill="currentColor"
            style={{ color }}
            aria-label="Recommended model"
          />
        )}
      </div>
      <div className="w-24 h-1.5 rounded-full bg-[var(--accent)] overflow-hidden flex-shrink-0">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <div
        className="w-9 text-right text-sm font-semibold tabular-nums"
        style={{ color }}
      >
        {score}
      </div>
    </div>
  );
}

function ByokRow({
  providerLabel,
  modelLabel,
  score,
  tier,
}: {
  providerLabel: string;
  modelLabel: string;
  score: number;
  tier: EvalTierKey;
}) {
  const color = getScoreColor(score);
  const bgColor = getScoreBgColor(score);
  return (
    <div className="flex items-center gap-3">
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: TIER_DOT_COLORS[tier] }}
      />
      <div className="flex-1 min-w-0 text-sm">
        <span className="text-[var(--foreground)] font-medium">{providerLabel}</span>
        <span className="text-[var(--muted-foreground)]"> · {modelLabel}</span>
      </div>
      <span
        className="inline-flex items-center justify-center text-xs font-semibold rounded px-1.5 py-0.5 min-w-[28px] tabular-nums"
        style={{ backgroundColor: bgColor, color }}
      >
        {score}
      </span>
    </div>
  );
}
