"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

const WORKERS_API_URL = "https://api.pmtpk.com";

export interface EvaluationScores {
  chatgpt: number;
  claude: number;
  gemini: number;
  perplexity: number;
  grok: number;
  deepseek: number;
  kimi: number;
}

export interface PromptEvaluation {
  promptHash: string;
  overallScore: number;
  scores: EvaluationScores;
  evaluatedAt: number;
}

// Helper to compute SHA-256 hash of prompt text
async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Hook for managing prompt evaluations
 */
export function useEvaluation(clerkId: string | undefined, hasPro: boolean) {
  const [evaluations, setEvaluations] = useState<Record<string, PromptEvaluation>>({});
  const [loadingHash, setLoadingHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Get the hash for a prompt text
   */
  const getPromptHash = useCallback(async (promptText: string): Promise<string> => {
    return sha256(promptText);
  }, []);

  /**
   * Get an evaluation from the local cache
   */
  const getEvaluation = useCallback(
    (promptHash: string): PromptEvaluation | undefined => {
      return evaluations[promptHash];
    },
    [evaluations]
  );

  /**
   * Load evaluations from Convex for a list of prompt hashes
   */
  const loadEvaluations = useCallback(
    async (promptHashes: string[]) => {
      if (!clerkId || promptHashes.length === 0) return;

      try {
        const response = await fetch(
          "https://determined-lark-313.convex.site/api/desktop/get-evaluations",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              clerkId,
              promptHashes,
            }),
          }
        );

        if (response.ok) {
          const data = (await response.json()) as {
            success: boolean;
            evaluations: Record<
              string,
              {
                overallScore: number;
                scores: EvaluationScores;
                evaluatedAt: number;
              }
            >;
          };

          if (data.success && data.evaluations) {
            const evaluationsMap: Record<string, PromptEvaluation> = {};
            for (const [hash, eval_] of Object.entries(data.evaluations)) {
              if (eval_) {
                evaluationsMap[hash] = {
                  promptHash: hash,
                  overallScore: eval_.overallScore,
                  scores: eval_.scores,
                  evaluatedAt: eval_.evaluatedAt,
                };
              }
            }
            setEvaluations((prev) => ({ ...prev, ...evaluationsMap }));
          }
        }
      } catch (error) {
        console.error("Failed to load evaluations:", error);
      }
    },
    [clerkId]
  );

  /**
   * Evaluate a prompt by calling the Workers API
   */
  const evaluatePrompt = useCallback(
    async (promptText: string, sessionToken: string): Promise<PromptEvaluation | null> => {
      if (!hasPro) {
        setError("Upgrade to Pro to evaluate prompts");
        return null;
      }

      const promptHash = await sha256(promptText);

      // Check if already cached
      const cached = evaluations[promptHash];
      if (cached) {
        return cached;
      }

      setLoadingHash(promptHash);
      setError(null);

      try {
        const response = await fetch(`${WORKERS_API_URL}/api/evaluate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({ text: promptText }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({ error: "Evaluation failed" }));
          throw new Error(data.error || `Evaluation failed (${response.status})`);
        }

        const result = (await response.json()) as {
          overallScore: number;
          scores: EvaluationScores;
          promptHash: string;
          cached?: boolean;
        };

        const evaluation: PromptEvaluation = {
          promptHash: result.promptHash || promptHash,
          overallScore: result.overallScore,
          scores: result.scores,
          evaluatedAt: Date.now(),
        };

        setEvaluations((prev) => ({ ...prev, [promptHash]: evaluation }));
        setLoadingHash(null);

        return evaluation;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Evaluation failed";
        setError(message);
        setLoadingHash(null);
        return null;
      }
    },
    [hasPro, evaluations]
  );

  /**
   * Clear the error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Clear all cached evaluations
   */
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
