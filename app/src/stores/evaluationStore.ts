import { create } from 'zustand';
import { WORKERS_API_URL, CONVEX_URL } from '../lib/constants';
import { tauriFetch } from '../lib/tauriFetch';
import { classifyPrompt, type EffortLevel } from '../lib/classifier';
import { useSettingsStore } from './settingsStore';
import { classifierTierToManagedTier, type EvalByokProvider } from '../lib/managed-models';
import type { PromptEvaluation } from '../types';
import { track as trackEvent } from '../lib/posthog-events';

// Helper to compute SHA-256 hash of prompt text
async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Providers eligible to participate in the evaluation BYOK section.
const BYOK_PROVIDERS: readonly EvalByokProvider[] = [
  'anthropic',
  'openai',
  'gemini',
  'grok',
  'deepseek',
  'perplexity',
  'kimi',
  'mistral',
  'cohere',
  'together',
  'fireworks',
  'cerebras',
  'bedrock',
];

function currentByokProviders(): EvalByokProvider[] {
  const apiKeys = useSettingsStore.getState().apiKeys;
  return BYOK_PROVIDERS.filter((p) => {
    const v = apiKeys[p];
    // Bedrock is an object — needs `region` plus either a bearer
    // `apiKey` OR IAM `accessKeyId`+`secretAccessKey`. Every other
    // provider is a bearer-string.
    if (p === 'bedrock') {
      if (!v || typeof v !== 'object' || !('region' in v) || !v.region) return false;
      const hasBearer = 'apiKey' in v && typeof v.apiKey === 'string' && v.apiKey.length > 0;
      const hasIam = 'accessKeyId' in v && 'secretAccessKey' in v && !!v.accessKeyId && !!v.secretAccessKey;
      return hasBearer || hasIam;
    }
    return typeof v === 'string' && v.length > 0;
  });
}

interface EvaluationState {
  evaluations: Record<string, PromptEvaluation>;
  loadingHash: string | null;
  error: string | null;

  evaluatePrompt: (
    promptText: string,
    sessionToken: string,
  ) => Promise<PromptEvaluation | null>;

  loadEvaluations: (userId: string, promptHashes: string[]) => Promise<void>;

  getEvaluation: (promptHash: string) => PromptEvaluation | undefined;

  getPromptHash: (promptText: string) => Promise<string>;

  clearError: () => void;

  clearCache: () => void;
}

interface WorkerEvaluateResponse extends PromptEvaluation {
  cached?: boolean;
}

export const useEvaluationStore = create<EvaluationState>((set, get) => ({
  evaluations: {},
  loadingHash: null,
  error: null,

  evaluatePrompt: async (promptText, sessionToken) => {
    const promptHash = await sha256(promptText);

    const cached = get().evaluations[promptHash];
    if (cached) return cached;

    set({ loadingHash: promptHash, error: null });
    trackEvent('eval_run', { trial_count: Object.keys(get().evaluations).length });

    try {
      const { tier: classifierTierRaw, effort: classifierEffort } = classifyPrompt(promptText);
      const classifierTier = classifierTierToManagedTier(classifierTierRaw);

      const settings = useSettingsStore.getState();

      const response = await tauriFetch(`${WORKERS_API_URL}/api/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          text: promptText,
          selectedManagedModels: settings.selectedManagedModels,
          classifierTier,
          classifierEffort: classifierEffort as EffortLevel | null,
          byokProviders: currentByokProviders(),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Evaluation failed' }));
        throw new Error(data.error || `Evaluation failed (${response.status})`);
      }

      const result = (await response.json()) as WorkerEvaluateResponse;

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

      set((state) => ({
        evaluations: { ...state.evaluations, [promptHash]: evaluation },
        loadingHash: null,
      }));

      return evaluation;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Evaluation failed';
      set({ loadingHash: null, error: message });
      return null;
    }
  },

  loadEvaluations: async (userId, promptHashes) => {
    if (promptHashes.length === 0) return;

    try {
      const response = await tauriFetch(`${CONVEX_URL}/api/desktop/get-evaluations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, promptHashes }),
      });

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
      set((state) => ({
        evaluations: { ...state.evaluations, ...evaluationsMap },
      }));
    } catch (error) {
      console.error('Failed to load evaluations:', error);
    }
  },

  getEvaluation: (promptHash) => get().evaluations[promptHash],

  getPromptHash: async (promptText) => sha256(promptText),

  clearError: () => set({ error: null }),

  clearCache: () => set({ evaluations: {}, loadingHash: null, error: null }),
}));
