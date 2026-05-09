/**
 * Per-subtask confidence heuristic (Phase 6).
 *
 * The orchestrator runs each subtask once at its router-picked
 * (preset, effort) pair. After the call returns, we score the result
 * 0..1 with a cheap rule-based pass — no extra LLM call. When the
 * score is below `LOW_CONFIDENCE_THRESHOLD`, the executor escalates
 * along two axes (see `executor.ts`):
 *
 *   1. effort — bump `null` → `'medium'` first; reasoning models can
 *      often fix shallow output by thinking longer at the same tier.
 *   2. tier — if effort is already non-null, jump to the next tier
 *      (`fast` → `balanced` → `powerful`) at `effort = 'medium'`.
 *
 * Max one escalation per subtask. The previous attempt's text becomes
 * the next attempt's previous-attempt note so the model can avoid the
 * same failure mode.
 *
 * The scoring rules are intentionally cheap and high-precision: false
 * positives waste credits on retries; false negatives ship a weak
 * answer. We bias toward false negatives (don't retry).
 */

import type { PlannerSubtask } from './types';

export const LOW_CONFIDENCE_THRESHOLD = 0.55;

export interface ConfidenceInput {
  /** The planner-emitted subtask shape (`produces`, `instruction`, etc). */
  subtask: PlannerSubtask;
  /** The model's final text output (post tool-loop). */
  text: string;
}

export interface ConfidenceResult {
  /** Score in [0, 1]. ≥ 0.55 = ship; < 0.55 = escalate. */
  score: number;
  /** Human-readable reason — surfaced in the Run Trace tooltip + retry note. */
  reason: string;
}

export function evaluateConfidence(input: ConfidenceInput): ConfidenceResult {
  const text = (input.text ?? '').trim();

  if (text.length === 0) {
    return { score: 0.1, reason: 'empty output' };
  }

  // Pure refusal / clarification-ask phrasings — model bailed instead
  // of attempting the task. Match conservatively to avoid clobbering
  // legitimate answers that happen to contain "I can't" inside prose.
  const refusalPattern =
    /^(?:i\s+(?:can(?:not|'t)|am unable to|don'?t have)\b|sorry,?\s+i\s+|please (?:provide|clarify|share|specify))/i;
  if (refusalPattern.test(text)) {
    return { score: 0.25, reason: 'looks like a refusal / clarification ask' };
  }

  // Truncation indicator from the OpenAI-compat tool loop or an
  // unfinished sentence pattern. Truncated reasoning often improves
  // with more thinking budget.
  if (/\[\s*truncated\s*\]/i.test(text)) {
    return { score: 0.4, reason: 'output appears truncated' };
  }

  // `produces: 'json'` requires parseable JSON. Strip surrounding
  // markdown fences before parsing — many models still wrap.
  if (input.subtask.produces === 'json') {
    const stripped = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
    try {
      JSON.parse(stripped);
    } catch {
      return { score: 0.3, reason: 'declared produces=json but body did not parse' };
    }
  }

  // Length heuristic: instruction implies a substantial answer (200+
  // word write-up, full file, etc). If the response is much shorter
  // than the floor we'd expect, suspect it.
  const wantsSubstance =
    /(write|produce|generate|draft|compose|summarize|outline|analyze|create)\b/i.test(
      input.subtask.instruction,
    ) ||
    /\b(\d{2,5})\s*(?:word|words|paragraph|paragraphs|line|lines)\b/i.test(
      input.subtask.instruction,
    );
  if (wantsSubstance && text.length < 120) {
    return { score: 0.4, reason: 'output too short for the instruction' };
  }

  // `produces: 'file'` should mention a path / filename. Cheap regex.
  if (input.subtask.produces === 'file') {
    const mentionsFile = /\b[\w./\\-]+\.\w{1,6}\b/.test(text);
    if (!mentionsFile) {
      return {
        score: 0.45,
        reason: 'produces=file but no filename mentioned in output',
      };
    }
  }

  // Default — confident enough to ship.
  return { score: 0.85, reason: 'passes heuristic checks' };
}

/**
 * Compute the next escalation step for a subtask whose first attempt
 * scored low. Returns `null` when nothing reasonable is left to try
 * (already at top tier + high effort, or `produces: 'none'`).
 */
export function nextEscalation(args: {
  currentTier: 'fast' | 'balanced' | 'powerful';
  currentEffort: 'low' | 'medium' | 'high' | null;
  retries: number;
}): { tier: 'fast' | 'balanced' | 'powerful'; effort: 'low' | 'medium' | 'high' | null } | null {
  // Cap at one retry; a stuck subtask shouldn't burn unbounded credits.
  if (args.retries >= 1) return null;

  // Axis 1: bump effort within the same tier when no effort was used.
  if (args.currentEffort === null) {
    return { tier: args.currentTier, effort: 'medium' };
  }

  // Axis 2: tier up at medium effort.
  const next: Record<typeof args.currentTier, typeof args.currentTier | null> = {
    fast: 'balanced',
    balanced: 'powerful',
    powerful: null,
  };
  const upTier = next[args.currentTier];
  if (!upTier) return null;
  return { tier: upTier, effort: 'medium' };
}
