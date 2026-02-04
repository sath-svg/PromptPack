import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { PromptEvaluation, PromptSource } from '../../types';
import { SOURCE_META } from '../../types';
import { ScoreBadge, getScoreColor } from '../ScoreBadge';

interface EvaluationModalProps {
  evaluation: PromptEvaluation;
  promptHeader?: string;
  onClose: () => void;
}

// Order of LLMs to display
const LLM_ORDER: PromptSource[] = ['chatgpt', 'claude', 'gemini', 'perplexity', 'grok', 'deepseek', 'kimi'];

export function EvaluationModal({ evaluation, promptHeader, onClose }: EvaluationModalProps) {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Prompt Evaluation
            </h2>
            {promptHeader && (
              <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
                {promptHeader}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-[var(--accent)] text-[var(--muted-foreground)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Overall Score */}
        <div className="p-6 text-center border-b border-[var(--border)]">
          <div className="text-sm text-[var(--muted-foreground)] mb-2">
            Overall Score
          </div>
          <div
            className="inline-flex items-baseline gap-1 text-5xl font-bold"
            style={{ color: getScoreColor(evaluation.overallScore) }}
          >
            {evaluation.overallScore}
            <span className="text-xl font-normal opacity-60">/100</span>
          </div>
        </div>

        {/* Per-LLM Breakdown */}
        <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto">
          <div className="text-sm font-medium text-[var(--muted-foreground)] mb-3">
            Score by LLM
          </div>
          {LLM_ORDER.map((llm) => {
            const score = evaluation.scores[llm];
            const meta = SOURCE_META[llm];
            const color = getScoreColor(score);

            return (
              <div key={llm} className="flex items-center gap-3">
                {/* LLM Icon & Name */}
                <div className="flex items-center gap-2 w-28 flex-shrink-0">
                  <span
                    className="w-6 h-6 flex items-center justify-center rounded text-sm"
                    style={{ backgroundColor: `${meta.color}20` }}
                  >
                    {meta.icon}
                  </span>
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    {meta.label}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="flex-1 h-2 rounded-full bg-[var(--accent)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${score}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>

                {/* Score Badge */}
                <ScoreBadge score={score} size="sm" />
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[var(--border)] bg-[var(--accent)]/30">
          <p className="text-xs text-center text-[var(--muted-foreground)]">
            Evaluated on {new Date(evaluation.evaluatedAt).toLocaleDateString(undefined, {
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
    document.body
  );
}
