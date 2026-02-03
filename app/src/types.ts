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
  globalHotkey: string;
  storageLocation: string;
  syncEnabled: boolean;
}

// Evaluation score types
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
