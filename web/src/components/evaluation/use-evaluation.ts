"use client";

import { useState, useCallback } from "react";

const WORKERS_API_URL = process.env.NEXT_PUBLIC_WORKERS_API_URL || "https://api.skillset.so";

// v2 tier-based evaluation types (mirrors app/src/types.ts).
export type EvalTierKey = "cheap" | "mid" | "frontier";
export type EvalEffort = "low" | "medium" | "high" | null;
export type EvalByokProvider =
  | "anthropic"
  | "openai"
  | "gemini"
  | "grok"
  | "deepseek"
  | "perplexity"
  | "kimi";

export interface EvalTierRow {
  tier: EvalTierKey;
  score: number;
  selectedModelId: string;
  selectedModelLabel: string;
}

export interface EvalModelRow {
  modelId: string;
  label: string;
  score: number;
}

export interface EvalByokRow {
  provider: EvalByokProvider;
  modelId: string;
  modelLabel: string;
  tier: EvalTierKey;
  score: number;
}

export interface PromptEvaluation {
  promptHash: string;
  schemaVersion: 2;
  tiers: { cheap: EvalTierRow; mid: EvalTierRow; frontier: EvalTierRow };
  recommendedTier: EvalTierKey;
  recommendedModelId: string;
  recommendedModelLabel: string;
  recommendedEffort: EvalEffort;
  bestTierModels: EvalModelRow[];
  byok?: EvalByokRow[];
  rationale?: string;
  evaluatedAt: number;
}

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Hook for managing prompt evaluations.
 *
 * The web client doesn't bundle the LR classifier or expose per-tier
 * model selections (those live in the desktop app). It passes empty
 * defaults; the worker falls back to recommended-for-tier and computes
 * the tier pick from Groq scores alone.
 *
 * @param trialsRemaining Number of free evaluation trials remaining
 *                        (for free users).
 * @param onTrialUsed Callback fired after a free user successfully uses
 *                    a trial evaluation.
 */
export function useEvaluation(
  userId: string | undefined,
  hasPro: boolean,
  trialsRemaining: number = 0,
  onTrialUsed?: () => void
) {
  const [evaluations, setEvaluations] = useState<Record<string, PromptEvaluation>>({});
  const [loadingHash, setLoadingHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getPromptHash = useCallback(async (promptText: string): Promise<string> => {
    return sha256(promptText);
  }, []);

  const getEvaluation = useCallback(
    (promptHash: string): PromptEvaluation | undefined => evaluations[promptHash],
    [evaluations]
  );

  const loadEvaluations = useCallback(
    async (promptHashes: string[]) => {
      if (!userId || promptHashes.length === 0) return;

      try {
        const response = await fetch(
          "https://determined-lark-313.convex.site/api/desktop/get-evaluations",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, promptHashes }),
          }
        );

        if (!response.ok) return;

        const data = (await response.json()) as {
          success: boolean;
          evaluations: Record<string, (PromptEvaluation & { _id?: string; _creationTime?: number }) | null>;
        };

        if (!data.success || !data.evaluations) return;

        const evaluationsMap: Record<string, PromptEvaluation> = {};
        for (const [hash, row] of Object.entries(data.evaluations)) {
          if (row && row.schemaVersion === 2 && row.tiers && row.recommendedTier) {
            evaluationsMap[hash] = {
              promptHash: hash,
              schemaVersion: 2,
              tiers: row.tiers,
              recommendedTier: row.recommendedTier,
              recommendedModelId: row.recommendedModelId,
              recommendedModelLabel: row.recommendedModelLabel,
              recommendedEffort: row.recommendedEffort,
              bestTierModels: row.bestTierModels,
              byok: row.byok,
              rationale: row.rationale,
              evaluatedAt: row.evaluatedAt,
            };
          }
        }
        setEvaluations((prev) => ({ ...prev, ...evaluationsMap }));
      } catch (err) {
        console.error("Failed to load evaluations:", err);
      }
    },
    [userId]
  );

  const evaluatePrompt = useCallback(
    async (promptText: string, sessionToken: string): Promise<PromptEvaluation | null> => {
      const canEvaluate = hasPro || trialsRemaining > 0;
      if (!canEvaluate) {
        setError("trial_exhausted");
        return null;
      }

      const promptHash = await sha256(promptText);

      const cached = evaluations[promptHash];
      if (cached) return cached;

      setLoadingHash(promptHash);
      setError(null);

      try {
        const response = await fetch(`${WORKERS_API_URL}/api/evaluate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({
            text: promptText,
            // Web has no settings store / no classifier — let the worker
            // resolve to recommended-for-tier and Groq pick the tier.
            selectedManagedModels: {},
            classifierTier: null,
            classifierEffort: null,
            byokProviders: [],
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({ error: "Evaluation failed" }));
          throw new Error(data.error || `Evaluation failed (${response.status})`);
        }

        const result = (await response.json()) as PromptEvaluation & { cached?: boolean };

        const evaluation: PromptEvaluation = {
          promptHash: result.promptHash || promptHash,
          schemaVersion: 2,
          tiers: result.tiers,
          recommendedTier: result.recommendedTier,
          recommendedModelId: result.recommendedModelId,
          recommendedModelLabel: result.recommendedModelLabel,
          recommendedEffort: result.recommendedEffort,
          bestTierModels: result.bestTierModels,
          byok: result.byok,
          rationale: result.rationale,
          evaluatedAt: result.evaluatedAt ?? Date.now(),
        };

        setEvaluations((prev) => ({ ...prev, [promptHash]: evaluation }));
        setLoadingHash(null);

        if (!hasPro && onTrialUsed) onTrialUsed();

        return evaluation;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Evaluation failed";
        setError(message);
        setLoadingHash(null);
        return null;
      }
    },
    [hasPro, trialsRemaining, evaluations, onTrialUsed]
  );

  const clearError = useCallback(() => setError(null), []);

  const clearCache = useCallback(() => {
    setEvaluations({});
    setLoadingHash(null);
    setError(null);
  }, []);

  return {
    evaluations,
    loadingHash,
    error,
    getPromptHash,
    getEvaluation,
    loadEvaluations,
    evaluatePrompt,
    clearError,
    clearCache,
  };
}
