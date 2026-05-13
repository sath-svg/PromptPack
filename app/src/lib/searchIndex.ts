// Global app search index — every destination the search bar can jump to.
// Keep keywords lowercase. Substring match runs over label + keywords + category.

export interface SearchItem {
  id: string;
  label: string;
  category: string;
  page: string;
  section?: string;
  /** Optional skillset to auto-select before navigating. */
  packId?: string;
  keywords: string[];
}

export const SEARCH_INDEX: SearchItem[] = [
  // Top-level pages
  { id: 'page-chat', label: 'Chat', category: 'Pages', page: 'chat', keywords: ['chat', 'skill chat', 'ai', 'assistant', 'router', 'one chat'] },
  { id: 'page-draft', label: 'Draft', category: 'Pages', page: 'draft', keywords: ['draft', 'drafts', 'write', 'compose', 'new prompt', 'enhance'] },
  { id: 'page-skill-preset', label: 'Skill Preset', category: 'Pages', page: 'skill-preset', keywords: ['preset', 'presets', 'skill preset', 'template', 'templates'] },
  { id: 'page-user-packs', label: 'Your Skillsets', category: 'Pages', page: 'user-packs', keywords: ['skillsets', 'skillset', 'packs', 'your skillsets', 'library', 'collection'] },
  { id: 'page-prompt-control', label: 'Skill Control', category: 'Pages', page: 'prompt-control', keywords: ['skill control', 'version history', 'versions', 'history', 'prompt control', 'rollback', 'diff'] },
  { id: 'page-import', label: 'Import', category: 'Pages', page: 'import', keywords: ['import', 'load pack', 'open pmtpk', 'restore'] },
  { id: 'page-export', label: 'Export', category: 'Pages', page: 'export', keywords: ['export', 'save pack', 'download pmtpk', 'backup', 'share'] },
  { id: 'page-settings', label: 'Settings', category: 'Pages', page: 'settings', keywords: ['settings', 'preferences', 'config', 'configuration', 'options'] },

  // Settings sections
  { id: 'settings-appearance', label: 'Appearance', category: 'Settings', page: 'settings', section: 'settings-appearance', keywords: ['appearance', 'theme', 'dark mode', 'light mode', 'system theme', 'colors', 'ui'] },
  { id: 'settings-theme', label: 'Theme', category: 'Settings · Appearance', page: 'settings', section: 'settings-appearance', keywords: ['theme', 'dark', 'light', 'system', 'color scheme'] },

  { id: 'settings-shortcuts', label: 'Shortcuts', category: 'Settings', page: 'settings', section: 'settings-shortcuts', keywords: ['shortcuts', 'keyboard', 'hotkeys', 'keybindings'] },
  { id: 'settings-search-shortcut', label: 'Search shortcut (Ctrl+K)', category: 'Settings · Shortcuts', page: 'settings', section: 'settings-shortcuts', keywords: ['search shortcut', 'ctrl k', 'cmd k', 'focus search'] },

  { id: 'settings-account', label: 'Account', category: 'Settings', page: 'settings', section: 'settings-account', keywords: ['account', 'profile', 'sign in', 'sign out', 'log out', 'logout', 'user', 'email', 'plan', 'tier', 'subscription', 'billing'] },
  { id: 'settings-plan', label: 'Plan & Limits', category: 'Settings · Account', page: 'settings', section: 'settings-account', keywords: ['plan', 'tier', 'free', 'pro', 'studio', 'limits', 'skill limit', 'skillset limit'] },

  { id: 'settings-credits', label: 'AI Credits', category: 'Settings', page: 'settings', section: 'settings-credits', keywords: ['credits', 'ai credits', 'balance', 'top up', 'topup', 'buy', 'purchase', 'managed mode', 'managed credits'] },
  { id: 'settings-managed-mode', label: 'Managed mode (Skillset credits)', category: 'Settings · AI Credits', page: 'settings', section: 'settings-credits', keywords: ['managed mode', 'skillset credits', 'managed', 'curated models', 'metered'] },
  { id: 'settings-auto-router', label: 'Auto-router models', category: 'Settings · AI Credits', page: 'settings', section: 'settings-credits', keywords: ['auto router', 'router', 'tier models', 'cheap', 'mid', 'frontier', 'model selection'] },
  { id: 'settings-token-usage', label: 'Token usage', category: 'Settings · AI Credits', page: 'settings', section: 'settings-credits', keywords: ['tokens', 'token usage', 'input tokens', 'output tokens', 'reasoning tokens', 'session tokens'] },

  { id: 'settings-downloads', label: 'Downloads', category: 'Settings', page: 'settings', section: 'settings-downloads', keywords: ['downloads', 'download folder', 'default folder', 'export folder', 'save location'] },
  { id: 'settings-skip-dialog', label: 'Skip folder picker dialog', category: 'Settings · Downloads', page: 'settings', section: 'settings-downloads', keywords: ['skip dialog', 'skip folder picker', 'silent download', 'auto save'] },

  { id: 'settings-developer-mode', label: 'Developer mode', category: 'Settings · Developer', page: 'settings', section: 'settings-developer', keywords: ['developer mode', 'dev mode', 'run trace', 'debug', 'verbose', 'planner internals', 'tool catalog'] },

  { id: 'settings-developer-keys', label: 'Developer keys (BYOK)', category: 'Settings · Advanced', page: 'settings', section: 'settings-developer-keys', keywords: ['developer keys', 'api keys', 'byok', 'bring your own key', 'advanced', 'unmetered', 'provider keys'] },
  { id: 'settings-key-anthropic', label: 'Anthropic API key', category: 'Settings · Developer keys', page: 'settings', section: 'settings-developer-keys', keywords: ['anthropic', 'claude', 'api key', 'claude key'] },
  { id: 'settings-key-openai', label: 'OpenAI API key', category: 'Settings · Developer keys', page: 'settings', section: 'settings-developer-keys', keywords: ['openai', 'gpt', 'chatgpt key', 'api key'] },
  { id: 'settings-key-gemini', label: 'Gemini API key', category: 'Settings · Developer keys', page: 'settings', section: 'settings-developer-keys', keywords: ['gemini', 'google', 'api key'] },
  { id: 'settings-key-grok', label: 'Grok API key', category: 'Settings · Developer keys', page: 'settings', section: 'settings-developer-keys', keywords: ['grok', 'xai', 'x.ai', 'api key'] },
  { id: 'settings-key-deepseek', label: 'DeepSeek API key', category: 'Settings · Developer keys', page: 'settings', section: 'settings-developer-keys', keywords: ['deepseek', 'api key'] },
  { id: 'settings-key-perplexity', label: 'Perplexity API key', category: 'Settings · Developer keys', page: 'settings', section: 'settings-developer-keys', keywords: ['perplexity', 'api key'] },
  { id: 'settings-key-kimi', label: 'Kimi API key', category: 'Settings · Developer keys', page: 'settings', section: 'settings-developer-keys', keywords: ['kimi', 'moonshot', 'api key'] },

  { id: 'settings-about', label: 'About', category: 'Settings', page: 'settings', section: 'settings-about', keywords: ['about', 'version', 'license', 'copyright'] },
];

export interface ScoredItem extends SearchItem {
  score: number;
}

export function searchItems(query: string, limit = 8, extra: SearchItem[] = []): ScoredItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const scored: ScoredItem[] = [];
  const pool = extra.length > 0 ? [...SEARCH_INDEX, ...extra] : SEARCH_INDEX;

  for (const item of pool) {
    const label = item.label.toLowerCase();
    const category = item.category.toLowerCase();

    let score = -1;

    // Exact label match → top
    if (label === q) {
      score = 1000;
    } else if (label.startsWith(q)) {
      score = 500 - label.length;
    } else if (label.includes(q)) {
      score = 300 - label.indexOf(q);
    } else {
      // Keyword match
      for (const kw of item.keywords) {
        const k = kw.toLowerCase();
        if (k === q) { score = Math.max(score, 400); }
        else if (k.startsWith(q)) { score = Math.max(score, 250 - k.length); }
        else if (k.includes(q)) { score = Math.max(score, 150 - k.indexOf(q)); }
      }

      // Category match (weakest)
      if (score < 0 && category.includes(q)) {
        score = 50;
      }

      // Subsequence match on label (fuzzy fallback)
      if (score < 0 && isSubsequence(q, label)) {
        score = 20;
      }
    }

    if (score >= 0) {
      scored.push({ ...item, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

function isSubsequence(needle: string, haystack: string): boolean {
  let i = 0;
  for (let j = 0; j < haystack.length && i < needle.length; j++) {
    if (haystack[j] === needle[i]) i++;
  }
  return i === needle.length;
}
