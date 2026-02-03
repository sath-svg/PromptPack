"use client";

import { ScoreBadge, getScoreColor, getScoreBgColor } from "./score-badge";

type PromptSource = 'chatgpt' | 'claude' | 'gemini' | 'perplexity' | 'grok' | 'deepseek' | 'kimi';

interface EvaluationScores {
  chatgpt: number;
  claude: number;
  gemini: number;
  perplexity: number;
  grok: number;
  deepseek: number;
  kimi: number;
}

interface PromptEvaluation {
  promptHash: string;
  overallScore: number;
  scores: EvaluationScores;
  evaluatedAt: number;
}

interface EvaluationModalProps {
  evaluation: PromptEvaluation;
  promptHeader?: string;
  onClose: () => void;
}

// Source metadata for UI
const SOURCE_META: Record<PromptSource, { label: string; color: string; icon: string }> = {
  chatgpt: { label: 'ChatGPT', color: '#10a37f', icon: '🤖' },
  claude: { label: 'Claude', color: '#d97706', icon: '🧠' },
  gemini: { label: 'Gemini', color: '#4285f4', icon: '✨' },
  perplexity: { label: 'Perplexity', color: '#20808d', icon: '🔍' },
  grok: { label: 'Grok', color: '#1d9bf0', icon: '⚡' },
  deepseek: { label: 'DeepSeek', color: '#4f46e5', icon: '🌊' },
  kimi: { label: 'Kimi', color: '#6366f1', icon: '🌙' },
};

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

  return (
    <div
      className="modal-overlay"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
      }}
    >
      {/* Modal */}
      <div
        className="evaluation-modal"
        style={{
          position: 'relative',
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          width: '100%',
          maxWidth: '400px',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--foreground)', margin: 0 }}>
              Prompt Evaluation
            </h2>
            {promptHeader && (
              <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                {promptHeader}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '0.375rem',
              borderRadius: '4px',
              background: 'transparent',
              border: 'none',
              color: 'var(--muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Overall Score */}
        <div
          style={{
            padding: '1.5rem',
            textAlign: 'center',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
            Overall Score
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'baseline',
              gap: '0.25rem',
              fontSize: '3rem',
              fontWeight: 700,
              color: getScoreColor(evaluation.overallScore),
            }}
          >
            {evaluation.overallScore}
            <span style={{ fontSize: '1.25rem', fontWeight: 'normal', opacity: 0.6 }}>/100</span>
          </div>
        </div>

        {/* Per-LLM Breakdown */}
        <div style={{ padding: '1rem', maxHeight: '300px', overflowY: 'auto' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted)', marginBottom: '0.75rem' }}>
            Score by LLM
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {LLM_ORDER.map((llm) => {
              const score = evaluation.scores[llm];
              const meta = SOURCE_META[llm];
              const color = getScoreColor(score);

              return (
                <div key={llm} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {/* LLM Icon & Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100px', flexShrink: 0 }}>
                    <span
                      style={{
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        backgroundColor: `${meta.color}20`,
                      }}
                    >
                      {meta.icon}
                    </span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--foreground)' }}>
                      {meta.label}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div
                    style={{
                      flex: 1,
                      height: '8px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--accent)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        borderRadius: '4px',
                        width: `${score}%`,
                        backgroundColor: color,
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>

                  {/* Score Badge */}
                  <ScoreBadge score={score} size="sm" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '0.75rem',
            borderTop: '1px solid var(--border)',
            backgroundColor: 'var(--accent)',
          }}
        >
          <p style={{ fontSize: '0.75rem', textAlign: 'center', color: 'var(--muted)', margin: 0 }}>
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
    </div>
  );
}
