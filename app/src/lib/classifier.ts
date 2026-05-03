export type ModelTier = 'fast' | 'balanced' | 'powerful';

export type Provider =
  | 'server'      // PromptPack-hosted Gemma 4 (free, no key needed)
  | 'anthropic'   // Claude
  | 'openai'      // ChatGPT
  | 'gemini'      // Google Gemini
  | 'grok'        // xAI Grok
  | 'deepseek'    // DeepSeek
  | 'perplexity'  // Perplexity
  | 'kimi'        // Moonshot Kimi
  | 'groq'        // Groq (fast inference)
  | 'openrouter'  // OpenRouter (200+ models)
  | 'ollama';     // Local models

export interface ModelPreset {
  provider: Provider;
  modelId: string;
  label: string;
  tier: ModelTier;
  /** Approximate cost per 1M input tokens in USD (0 = free/local) */
  costPer1M: number;
}

// Ordered cheapest-first within each tier so pickModel() selects the best deal
export const MODEL_PRESETS: ModelPreset[] = [
  // ── Fast tier ─────────────────────────────────────────────────────────────
  { provider: 'server',      modelId: 'llama-3.1-8b-instant',              label: 'Llama 3.1 8B', tier: 'fast',     costPer1M: 0.00  },
  { provider: 'ollama',      modelId: 'gemma3:4b',                    label: 'Gemma 3 4B (local)',    tier: 'fast',     costPer1M: 0.00  },
  { provider: 'groq',        modelId: 'llama-3.1-8b-instant',         label: 'Llama 3.1 8B',          tier: 'fast',     costPer1M: 0.05  },
  { provider: 'deepseek',    modelId: 'deepseek-chat',                label: 'DeepSeek V3',            tier: 'fast',     costPer1M: 0.07  },
  { provider: 'openrouter',  modelId: 'google/gemma-4-27b-it',        label: 'Gemma 4 27B',            tier: 'fast',     costPer1M: 0.10  },
  { provider: 'kimi',        modelId: 'moonshot-v1-8k',               label: 'Kimi 8K',                tier: 'fast',     costPer1M: 0.12  },
  { provider: 'openai',      modelId: 'gpt-4o-mini',                  label: 'GPT-4o Mini',            tier: 'fast',     costPer1M: 0.15  },
  { provider: 'gemini',      modelId: 'gemini-2.0-flash',             label: 'Gemini 2.0 Flash',       tier: 'fast',     costPer1M: 0.10  },
  { provider: 'grok',        modelId: 'grok-3-mini',                  label: 'Grok 3 Mini',            tier: 'fast',     costPer1M: 0.30  },
  { provider: 'perplexity',  modelId: 'sonar',                        label: 'Perplexity Sonar',       tier: 'fast',     costPer1M: 1.00  },
  { provider: 'anthropic',   modelId: 'claude-haiku-4-5-20251001',    label: 'Claude Haiku',           tier: 'fast',     costPer1M: 0.80  },

  // ── Balanced tier ─────────────────────────────────────────────────────────
  { provider: 'server',      modelId: 'llama-3.1-8b-instant',              label: 'Llama 3.1 8B', tier: 'balanced', costPer1M: 0.00  },
  { provider: 'ollama',      modelId: 'llama3.1:8b',                  label: 'Llama 3.1 8B (local)',  tier: 'balanced', costPer1M: 0.00  },
  { provider: 'deepseek',    modelId: 'deepseek-chat',                label: 'DeepSeek V3',            tier: 'balanced', costPer1M: 0.07  },
  { provider: 'openrouter',  modelId: 'google/gemma-4-27b-it',        label: 'Gemma 4 27B',            tier: 'balanced', costPer1M: 0.10  },
  { provider: 'gemini',      modelId: 'gemini-2.0-flash',             label: 'Gemini 2.0 Flash',       tier: 'balanced', costPer1M: 0.10  },
  { provider: 'kimi',        modelId: 'moonshot-v1-32k',              label: 'Kimi 32K',               tier: 'balanced', costPer1M: 0.24  },
  { provider: 'openai',      modelId: 'gpt-4o-mini',                  label: 'GPT-4o Mini',            tier: 'balanced', costPer1M: 0.15  },
  { provider: 'groq',        modelId: 'llama-3.3-70b-versatile',      label: 'Llama 3.3 70B',         tier: 'balanced', costPer1M: 0.59  },
  { provider: 'grok',        modelId: 'grok-3',                       label: 'Grok 3',                 tier: 'balanced', costPer1M: 3.00  },
  { provider: 'perplexity',  modelId: 'sonar-pro',                    label: 'Perplexity Sonar Pro',  tier: 'balanced', costPer1M: 3.00  },
  { provider: 'anthropic',   modelId: 'claude-sonnet-4-6',            label: 'Claude Sonnet',          tier: 'balanced', costPer1M: 3.00  },

  // ── Powerful tier ─────────────────────────────────────────────────────────
  { provider: 'ollama',      modelId: 'llama3.3:70b',                 label: 'Llama 3.3 70B (local)', tier: 'powerful', costPer1M: 0.00  },
  { provider: 'deepseek',    modelId: 'deepseek-reasoner',            label: 'DeepSeek R1',            tier: 'powerful', costPer1M: 0.55  },
  { provider: 'openrouter',  modelId: 'google/gemini-2.5-pro',        label: 'Gemini 2.5 Pro',         tier: 'powerful', costPer1M: 1.25  },
  { provider: 'gemini',      modelId: 'gemini-2.5-pro',               label: 'Gemini 2.5 Pro',         tier: 'powerful', costPer1M: 1.25  },
  { provider: 'kimi',        modelId: 'moonshot-v1-128k',             label: 'Kimi 128K',              tier: 'powerful', costPer1M: 0.60  },
  { provider: 'perplexity',  modelId: 'sonar-reasoning-pro',          label: 'Perplexity Reasoning',  tier: 'powerful', costPer1M: 8.00  },
  { provider: 'openai',      modelId: 'gpt-4o',                       label: 'GPT-4o',                 tier: 'powerful', costPer1M: 5.00  },
  { provider: 'grok',        modelId: 'grok-3',                       label: 'Grok 3',                 tier: 'powerful', costPer1M: 3.00  },
  { provider: 'anthropic',   modelId: 'claude-opus-4-6',              label: 'Claude Opus',            tier: 'powerful', costPer1M: 15.00 },
];

const POWERFUL_KEYWORDS =
  /\b(analy[sz]e|refactor|implement|architect|design|debug|optimi[sz]e|evaluate|critique|compare|contrast|explain why|step by step|in detail|comprehensive|thorough|review|audit|investigate|research|strategy|derive|prove|algorithm|complexity|tradeoff|security|scalab)\b/i;

const FAST_PATTERNS =
  /^(what is|define|list|translate|convert|how many|when (was|did|is)|who (is|was|wrote|invented)|what does|give me a (word|synonym|antonym)|name \d|spell|what time)\b/i;

export function classifyTier(prompt: string): ModelTier {
  const n = prompt.trim().split(/\s+/).length;
  const hasCode =
    prompt.includes('```') ||
    /\bdef |function |class |import |const |let |var \b/.test(prompt);

  if (hasCode || POWERFUL_KEYWORDS.test(prompt) || n > 150) return 'powerful';
  if (n < 20 && FAST_PATTERNS.test(prompt.trim())) return 'fast';
  if (n < 15) return 'fast';
  return 'balanced';
}

/** Return the cheapest preset for a tier given which providers have keys configured. */
export function pickModel(
  tier: ModelTier,
  availableProviders: Set<Provider>
): ModelPreset | null {
  return (
    MODEL_PRESETS
      .filter((m) => m.tier === tier && availableProviders.has(m.provider))
      .sort((a, b) => a.costPer1M - b.costPer1M)[0] ?? null
  );
}

export const TIER_COLORS: Record<ModelTier, string> = {
  fast:     'text-green-500 bg-green-500/10',
  balanced: 'text-blue-500 bg-blue-500/10',
  powerful: 'text-purple-500 bg-purple-500/10',
};

export const TIER_LABELS: Record<ModelTier, string> = {
  fast:     'Fast',
  balanced: 'Balanced',
  powerful: 'Powerful',
};

export const PROVIDER_LABELS: Record<Provider, string> = {
  server:     'Skillset',
  anthropic:  'Anthropic (Claude)',
  openai:     'OpenAI (ChatGPT)',
  gemini:     'Google (Gemini)',
  grok:       'xAI (Grok)',
  deepseek:   'DeepSeek',
  perplexity: 'Perplexity',
  kimi:       'Moonshot (Kimi)',
  groq:       'Groq',
  openrouter: 'OpenRouter',
  ollama:     'Ollama (local)',
};

export const PROVIDER_BASE_URLS: Record<Provider, string> = {
  server:     'https://api.pmtpk.com',
  anthropic:  'https://api.anthropic.com',
  openai:     'https://api.openai.com/v1',
  gemini:     'https://generativelanguage.googleapis.com/v1beta/openai',
  grok:       'https://api.x.ai/v1',
  deepseek:   'https://api.deepseek.com/v1',
  perplexity: 'https://api.perplexity.ai',
  kimi:       'https://api.moonshot.cn/v1',
  groq:       'https://api.groq.com/openai/v1',
  openrouter: 'https://openrouter.ai/api/v1',
  ollama:     'http://localhost:11434/v1',
};
