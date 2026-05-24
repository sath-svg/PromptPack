// Core types for PromptPack Desktop

export type PromptSource =
  | 'chatgpt'
  | 'claude'
  | 'gemini'
  | 'perplexity'
  | 'grok'
  | 'deepseek'
  | 'kimi';

export type SyncStatus = 'pending' | 'synced' | 'local-only';

export type UserTier = 'free' | 'pro' | 'studio';

export interface Prompt {
  id: string;
  text: string;
  header?: string;
  source: PromptSource;
  url?: string;
  folderId?: string;
  isFavorite: boolean;
  useCount: number;
  createdAt: number;
  updatedAt: number;
  syncStatus: SyncStatus;
  cloudId?: string;
  tags?: string[];
}

export interface Folder {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  parentId?: string;
  sortOrder: number;
  createdAt: number;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
}

export interface Pack {
  id: string;
  title: string;
  description?: string;
  promptCount: number;
  filePath?: string;
  importedAt?: number;
  createdAt: number;
}

export interface VariableMemory {
  variableName: string;
  lastValue: string;
  options?: string[];
  updatedAt: number;
}

export interface UserSession {
  userId?: string;
  email?: string;
  tier: UserTier;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  storageLocation: string;
  syncEnabled: boolean;
}

// Evaluation types (v2 — tier-based)
//
// Mirrors the chat router's three-tier model system. The overall headline
// shown on each saved prompt is the score of the recommended tier; the
// modal drills into per-tier scores plus a ranking of every model within
// the recommended tier and an optional BYOK section.

import type { EvalByokProvider } from './lib/managed-models';
export type { EvalByokProvider };

export type EvalTierKey = 'cheap' | 'mid' | 'frontier';
export type EvalEffort = 'low' | 'medium' | 'high' | null;

export interface EvalTierRow {
  tier: EvalTierKey;
  score: number;              // 0-100
  selectedModelId: string;    // from settings.selectedManagedModels[tier]
  selectedModelLabel: string;
}

export interface EvalModelRow {
  modelId: string;
  label: string;
  score: number;              // 0-100
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

// PromptControl: Version snapshot metadata (legacy pack-level)
export interface PackVersion {
  id: string;
  packId: string;
  versionNumber: number;
  r2Key: string;
  fileSize: number;
  promptCount: number;
  prompts?: { text: string; header?: string }[];
  message?: string;
  createdAt: number;
}

// PromptControl v2: Per-prompt version
export interface PromptVersion {
  _id: string;
  packId: string;
  promptCreatedAt: number;
  versionNumber: number;
  text: string;
  header?: string;
  savedAt: number;
}

// Skill Chat conversations (max 3 active, parallel runs).
// Each row in SQLite `conversations` table maps to one slice of
// chatStore/runStore/agentStore on the frontend.
export interface Conversation {
  id: string;
  title: string;
  workspace: string | null;
  selectedPackId: string | null;
  agentMode: boolean;
  autoAcceptEdits: boolean;
  lastActiveAt: number;
  createdAt: number;
}

// Source metadata for UI
export const SOURCE_META: Record<PromptSource, { label: string; color: string; icon: string }> = {
  chatgpt: { label: 'ChatGPT', color: '#10a37f', icon: '🤖' },
  claude: { label: 'Claude', color: '#d97706', icon: '🧠' },
  gemini: { label: 'Gemini', color: '#4285f4', icon: '✨' },
  perplexity: { label: 'Perplexity', color: '#20808d', icon: '🔍' },
  grok: { label: 'Grok', color: '#1d9bf0', icon: '⚡' },
  deepseek: { label: 'DeepSeek', color: '#4f46e5', icon: '🌊' },
  kimi: { label: 'Kimi', color: '#6366f1', icon: '🌙' },
};
