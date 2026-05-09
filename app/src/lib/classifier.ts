export type ModelTier = 'fast' | 'balanced' | 'powerful';

export type Provider =
  | 'server'      // Skillset-hosted Groq proxy — built-in key, free-tier capped at 3 messages
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
  /**
   * Model exposes a reasoning-effort knob (Claude extended thinking,
   * OpenAI o-series + GPT-5, Gemini 2.5 thinking, xAI Grok). The actual
   * request-body field name varies per provider — see `reasoningParams.ts`.
   */
  supportsReasoning?: boolean;
  /**
   * Subset of `low|medium|high` the model accepts. Most accept all three;
   * Grok-3 only accepts `low` and `high`. When omitted defaults to all.
   */
  reasoningEfforts?: Array<'low' | 'medium' | 'high'>;
  /**
   * Multiplier applied to the model's base price when reasoning is enabled
   * at "medium" effort (rough — driven by typical thinking-token spend).
   * Used by the orchestrator router to cost-rank reasoning vs non-reasoning
   * presets in the same tier.
   */
  reasoningCostMult?: number;
  /**
   * Reasoning is on for every call and the effort knob is ignored
   * (DeepSeek R1, Perplexity sonar-reasoning-pro). The router still
   * counts these as "reasoning" presets when a non-`none` effort is
   * requested by the classifier.
   */
  alwaysReasons?: boolean;
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
  { provider: 'anthropic',   modelId: 'claude-haiku-4-5-20251001',    label: 'Claude Haiku',           tier: 'fast',     costPer1M: 0.80,  supportsReasoning: true, reasoningEfforts: ['low','medium','high'], reasoningCostMult: 2 },

  // ── Balanced tier ─────────────────────────────────────────────────────────
  { provider: 'server',      modelId: 'llama-3.1-8b-instant',              label: 'Llama 3.1 8B', tier: 'balanced', costPer1M: 0.00  },
  { provider: 'ollama',      modelId: 'llama3.1:8b',                  label: 'Llama 3.1 8B (local)',  tier: 'balanced', costPer1M: 0.00  },
  { provider: 'deepseek',    modelId: 'deepseek-chat',                label: 'DeepSeek V3',            tier: 'balanced', costPer1M: 0.07  },
  { provider: 'openrouter',  modelId: 'google/gemma-4-27b-it',        label: 'Gemma 4 27B',            tier: 'balanced', costPer1M: 0.10  },
  { provider: 'gemini',      modelId: 'gemini-2.0-flash',             label: 'Gemini 2.0 Flash',       tier: 'balanced', costPer1M: 0.10  },
  { provider: 'kimi',        modelId: 'moonshot-v1-32k',              label: 'Kimi 32K',               tier: 'balanced', costPer1M: 0.24  },
  { provider: 'openai',      modelId: 'gpt-4o-mini',                  label: 'GPT-4o Mini',            tier: 'balanced', costPer1M: 0.15  },
  { provider: 'groq',        modelId: 'llama-3.3-70b-versatile',      label: 'Llama 3.3 70B',         tier: 'balanced', costPer1M: 0.59  },
  { provider: 'grok',        modelId: 'grok-3',                       label: 'Grok 3',                 tier: 'balanced', costPer1M: 3.00,  supportsReasoning: true, reasoningEfforts: ['low','high'], reasoningCostMult: 3 },
  { provider: 'perplexity',  modelId: 'sonar-pro',                    label: 'Perplexity Sonar Pro',  tier: 'balanced', costPer1M: 3.00  },
  { provider: 'anthropic',   modelId: 'claude-sonnet-4-6',            label: 'Claude Sonnet',          tier: 'balanced', costPer1M: 3.00,  supportsReasoning: true, reasoningEfforts: ['low','medium','high'], reasoningCostMult: 3 },

  // ── Powerful tier ─────────────────────────────────────────────────────────
  { provider: 'ollama',      modelId: 'llama3.3:70b',                 label: 'Llama 3.3 70B (local)', tier: 'powerful', costPer1M: 0.00  },
  { provider: 'deepseek',    modelId: 'deepseek-reasoner',            label: 'DeepSeek R1',            tier: 'powerful', costPer1M: 0.55,  alwaysReasons: true, reasoningCostMult: 1 },
  { provider: 'openrouter',  modelId: 'google/gemini-2.5-pro',        label: 'Gemini 2.5 Pro',         tier: 'powerful', costPer1M: 1.25,  supportsReasoning: true, reasoningEfforts: ['low','medium','high'], reasoningCostMult: 3 },
  { provider: 'gemini',      modelId: 'gemini-2.5-pro',               label: 'Gemini 2.5 Pro',         tier: 'powerful', costPer1M: 1.25,  supportsReasoning: true, reasoningEfforts: ['low','medium','high'], reasoningCostMult: 3 },
  { provider: 'kimi',        modelId: 'moonshot-v1-128k',             label: 'Kimi 128K',              tier: 'powerful', costPer1M: 0.60  },
  { provider: 'perplexity',  modelId: 'sonar-reasoning-pro',          label: 'Perplexity Reasoning',  tier: 'powerful', costPer1M: 8.00,  alwaysReasons: true, reasoningCostMult: 1 },
  { provider: 'openai',      modelId: 'gpt-4o',                       label: 'GPT-4o',                 tier: 'powerful', costPer1M: 5.00  },
  { provider: 'grok',        modelId: 'grok-3',                       label: 'Grok 3',                 tier: 'powerful', costPer1M: 3.00,  supportsReasoning: true, reasoningEfforts: ['low','high'], reasoningCostMult: 3 },
  { provider: 'anthropic',   modelId: 'claude-opus-4-6',              label: 'Claude Opus',            tier: 'powerful', costPer1M: 15.00, supportsReasoning: true, reasoningEfforts: ['low','medium','high'], reasoningCostMult: 4 },
];

import {
  predictTier,
  predictEffort,
  predictRoute,
  type EffortLevel,
  type RouteClass,
} from './classifierModel';

export type { EffortLevel, RouteClass };

/** Logistic-regression tier classifier (TF-IDF + sklearn weights, trained on
 *  ~20k Dolly/Alpaca/CodeAlpaca prompts: 80% non-coding, 20% coding). */
export function classifyTier(prompt: string): ModelTier {
  return predictTier(prompt);
}

/** Reasoning-effort classifier — only consumed when tier is `balanced` or
 *  `powerful`. Maps to the universal `reasoning_effort` knob across
 *  o1 / GPT-5 / DeepSeek R1 / Gemini Thinking / Claude extended thinking. */
export function classifyEffort(prompt: string): EffortLevel {
  return predictEffort(prompt);
}

/** Route classifier — picks `chat | agent | workflow`. */
export function classifyRoute(prompt: string): RouteClass {
  return predictRoute(prompt);
}

/** Combined classification — `effort` is null for fast tier (no thinking
 *  budget applies). */
export function classifyPrompt(prompt: string): {
  tier: ModelTier;
  effort: EffortLevel | null;
  route: RouteClass;
} {
  const tier = predictTier(prompt);
  const route = predictRoute(prompt);
  const effort =
    tier === 'balanced' || tier === 'powerful' ? predictEffort(prompt) : null;
  return { tier, effort, route };
}

// ────────────────────────────────────────────────────────────────────────
// "Is this a workflow task?" heuristic
//
// Cheap regex+length gate run BEFORE the orchestrator's planner LLM. The
// goal is to skip the planner round-trip when the user's prompt is
// obviously one self-contained task. The heuristic intentionally errs
// toward "single-task" — false negatives just mean the user pays for one
// extra planner call; false positives mean a multi-step goal silently
// degrades to single-shot, which is worse UX.
// ────────────────────────────────────────────────────────────────────────

/** Words / phrases that strongly suggest the user wants more than one
 *  step. Hand-picked to be specific enough to avoid false positives on
 *  ordinary prose. */
const MULTI_STEP_PATTERNS: RegExp[] = [
  /\b(?:then|after\s+that|next\s+step|finally)\b/i,
  /\b(?:step[- ]by[- ]step|multi[- ]?step|in\s+stages)\b/i,
  /\b(?:research(?:\s+\w+){0,3}\s+(?:and|then)\s+(?:write|summari[sz]e|compare|analy[sz]e))\b/i,
  /\b(?:first|1\.|step\s*1).*?(?:then|second|2\.|step\s*2)/is,
  /\b(?:plan(?:\s+(?:out|and))?|outline\s+(?:and|then))\b/i,
  /\b(?:draft|write).*?\b(?:and|then)\b.*?\b(?:edit|polish|refine|review|critique|expand)\b/is,
  /\b(?:fetch|scrape|download|read).*?\b(?:and|then)\b.*?\b(?:summari[sz]e|extract|format|email|send)\b/is,
  /\bcompare\s+(?:and\s+)?contrast\b/i,
  /\bend[- ]to[- ]end\b/i,
  /(?:^|\n)\s*(?:[-*•]|\d+[.)])\s+/m, // bullet or numbered list in the prompt itself
];

/**
 * Returns true when the goal looks like it needs more than one model
 * call — i.e. the orchestrator's planner should fire. Returns false for
 * goals that are obviously one self-contained task; the caller should
 * route those through the existing single-shot flow even when the
 * Workflow toggle is on.
 *
 * Rules:
 *  - Always treat short prompts (< 12 words) as single-task. Real
 *    workflow goals are essentially never that short.
 *  - Otherwise return true if any multi-step pattern matches.
 *  - Otherwise return false.
 */
export function looksMultiStep(prompt: string): boolean {
  const trimmed = prompt.trim();
  const wordCount = trimmed.split(/\s+/).length;
  if (wordCount < 12) return false;
  for (const rx of MULTI_STEP_PATTERNS) {
    if (rx.test(trimmed)) return true;
  }
  return false;
}

// ────────────────────────────────────────────────────────────────────────
// "Does this prompt want the agent (file/shell tools)?" heuristic
//
// Workspace presence alone isn't enough to justify the agent tool loop —
// "hi" with a workspace connected shouldn't go fishing for SKILLSET.md.
// This heuristic returns true only when the prompt actually references
// file work, code, or shell-ish action verbs. Conservative — false
// negatives just mean a missed tool opportunity (user can rephrase),
// false positives waste a tool round on a chat-style message.
// ────────────────────────────────────────────────────────────────────────

const AGENT_INTENT_PATTERNS: RegExp[] = [
  // File paths or recognizable extensions
  /[\w./\\-]+\.(?:md|py|ts|tsx|js|jsx|json|ya?ml|sh|bash|rs|go|java|cpp|hpp|c|h|cs|rb|php|sql|toml|html|css|scss|sass|svelte|vue|astro|kt|swift|dart|lua|zig)\b/i,
  // Action verb + object that implies file/shell work
  /\b(?:read|open|edit|modify|refactor|fix|debug|run|test|check|inspect|review|search|grep|find|list|show|cat|tail|head|diff|patch|build|compile|deploy|install)\s+(?:the\s+|my\s+|this\s+|these\s+|all\s+)?[\w./\\-]+/i,
  // File-system / repo nouns
  /\b(?:file|folder|directory|path|repo(?:sitory)?|codebase|workspace|module|package|script|test\s+suite)\b/i,
  // Imperative create / add to artifact-like things
  /\b(?:write|create|generate|implement|add|delete|remove|rename)\s+(?:a\s+|an\s+|the\s+)?(?:function|class|module|component|test|file|script|interface|type|hook|endpoint|route|migration|model)/i,
  // Shell / command primitives
  /\b(?:npm|yarn|pnpm|cargo|pip|go\s+(?:build|run|test)|git\s+\w+|docker\s+\w+|kubectl|make|tsc|eslint|prettier)\b/i,
  // Direct tool mentions
  /\b(?:read_file|write_file|edit_file|grep|glob|bash|lsp_diagnostics)\b/i,
];

/**
 * Returns true when the prompt suggests the model should reach for the
 * file / shell / search tool catalog. Used to decide whether a workspace-
 * connected message should run through the agent loop or stay on the
 * cheaper single-shot managed path.
 */
export function looksLikeAgentTask(prompt: string): boolean {
  const t = prompt.trim();
  if (t.length === 0) return false;
  for (const rx of AGENT_INTENT_PATTERNS) {
    if (rx.test(t)) return true;
  }
  return false;
}

const LOCAL_PROVIDERS: ReadonlySet<Provider> = new Set(['ollama', 'server']);

/** Return the cheapest preset for a tier. Resolution order:
 *
 *  1. Cheapest BYOK cloud provider in the requested tier — paid keys win.
 *  2. Inbuilt Skillset server (Groq Llama 3.1 8B). Server has no
 *     "powerful" preset, so a powerful prompt with no BYOK key resolves
 *     down to the server's fast 8B preset. Cost on server stays bounded
 *     (margins assume 8B pricing) and the user gets a real response
 *     instead of timing out on a flaky local Ollama install.
 *  3. Any remaining available provider (e.g. Ollama) as last resort.
 *
 *  Server is preferred over Ollama because Ollama may be running with a
 *  hallucination-prone tag the picker didn't anticipate, or not running
 *  at all. The hosted server is the reliable default for casuals. */
export function pickModel(
  tier: ModelTier,
  availableProviders: Set<Provider>
): ModelPreset | null {
  const byCost = (a: ModelPreset, b: ModelPreset) => a.costPer1M - b.costPer1M;

  const cloud = MODEL_PRESETS
    .filter((m) => m.tier === tier && availableProviders.has(m.provider) && !LOCAL_PROVIDERS.has(m.provider))
    .sort(byCost)[0];
  if (cloud) return cloud;

  // Server fallback — pin to server's fast 8B preset (Llama 3.1 8B via
  // Groq) regardless of requested tier so margins stay predictable.
  if (availableProviders.has('server')) {
    const s = MODEL_PRESETS.find(
      (m) => m.provider === 'server' && m.modelId === 'llama-3.1-8b-instant',
    );
    // Don't override the server preset's tier on fallback. UI should
    // show the model's actual tier (Llama 8B = `fast`), not the tier
    // the LR classifier originally requested.
    if (s) return s;
  }

  return (
    MODEL_PRESETS
      .filter((m) => m.tier === tier && availableProviders.has(m.provider))
      .sort(byCost)[0] ?? null
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

/**
 * User-facing effort labels. Internal LR head still emits
 * `low | medium | high` — those names mirror sklearn class ids and
 * OpenRouter's `reasoning_effort` field. The UI uses these prettier
 * synonyms so the word "medium" doesn't collide with the managed
 * model tier `Mid`.
 */
export const EFFORT_DISPLAY_LABELS: Record<EffortLevel, string> = {
  low:    'Light',
  medium: 'Standard',
  high:   'Deep',
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
  // TODO: switch back to api.skillset.so once worker DNS transfer is complete.
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
