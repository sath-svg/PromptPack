import { create } from 'zustand';
import { WORKERS_API_URL, CONVEX_URL } from '../lib/constants';
import { tauriFetch } from '../lib/tauriFetch';
import type { PromptEvaluation, EvaluationScores } from '../types';

// Helper to compute SHA-256 hash of prompt text
async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

interface EvaluationState {
  // Cache of evaluations by promptHash
  evaluations: Record<string, PromptEvaluation>;
  // Currently evaluating prompt hash
  loadingHash: string | null;
  // Error message
  error: string | null;

  // Actions
  evaluatePrompt: (
    promptText: string,
    sessionToken: string
  ) => Promise<PromptEvaluation | null>;

  loadEvaluations: (
    clerkId: string,
    promptHashes: string[]
  ) => Promise<void>;

  getEvaluation: (promptHash: string) => PromptEvaluation | undefined;

  getPromptHash: (promptText: string) => Promise<string>;

  clearError: () => void;

  clearCache: () => void;
}

export const useEvaluationStore = create<EvaluationState>((set, get) => ({
  evaluations: {},
  loadingHash: null,
  error: null,

  evaluatePrompt: async (promptText, sessionToken) => {
    const promptHash = await sha256(promptText);

    // Check if already cached
    const cached = get().evaluations[promptHash];
    if (cached) {
      return cached;
    }

    set({ loadingHash: promptHash, error: null });

    try {
      // Build auth token from session token
      const authToken = sessionToken;

      // Call the evaluation endpoint
      const response = await tauriFetch(`${WORKERS_API_URL}/api/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ text: promptText }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Evaluation failed' }));
        throw new Error(data.error || `Evaluation failed (${response.status})`);
      }

      const result = await response.json() as {
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

      set((state) => ({
        evaluations: { ...state.evaluations, [promptHash]: evaluation },
        loadingHash: null,
      }));

      return evaluation;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Evaluation failed';
      set({
        loadingHash: null,
        error: message,
      });
      return null;
    }
  },

  loadEvaluations: async (clerkId, promptHashes) => {
    if (promptHashes.length === 0) return;

    try {
      const response = await tauriFetch(`${CONVEX_URL}/api/desktop/get-evaluations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkId,
          promptHashes,
        }),
      });

      if (response.ok) {
        const data = await response.json() as {
          success: boolean;
          evaluations: Record<string, {
            overallScore: number;
            scores: EvaluationScores;
            evaluatedAt: number;
          }>;
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
          set((state) => ({
            evaluations: { ...state.evaluations, ...evaluationsMap },
          }));
        }
      }
    } catch (error) {
      console.error('Failed to load evaluations:', error);
    }
  },

  getEvaluation: (promptHash) => {
    return get().evaluations[promptHash];
  },

  getPromptHash: async (promptText) => {
    return sha256(promptText);
  },

  clearError: () => set({ error: null }),

  clearCache: () => set({ evaluations: {}, loadingHash: null, error: null }),
}));
