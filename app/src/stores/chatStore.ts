import { create } from 'zustand';
import { tauriFetch } from '../lib/tauriFetch';
import {
  classifyTier,
  pickModel,
  PROVIDER_BASE_URLS,
  type ModelPreset,
  type Provider,
} from '../lib/classifier';
import { useSettingsStore } from './settingsStore';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  preset?: ModelPreset;
  packName?: string;
  createdAt: number;
}

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (text: string, packName?: string, systemPrompt?: string) => Promise<void>;
  clearMessages: () => void;
  clearError: () => void;
}

function makeId() {
  return Math.random().toString(36).slice(2);
}

function getAvailableProviders(apiKeys: Record<string, string | undefined>): Set<Provider> {
  const providers = new Set<Provider>();
  providers.add('server');     // always available — PromptPack-hosted Gemma 4, no key needed
  providers.add('ollama');     // always available — local, no key needed
  if (apiKeys.anthropic)  providers.add('anthropic');
  if (apiKeys.openai)     providers.add('openai');
  if (apiKeys.gemini)     providers.add('gemini');
  if (apiKeys.grok)       providers.add('grok');
  if (apiKeys.deepseek)   providers.add('deepseek');
  if (apiKeys.perplexity) providers.add('perplexity');
  if (apiKeys.kimi)       providers.add('kimi');
  if (apiKeys.groq)       providers.add('groq');
  if (apiKeys.openrouter) providers.add('openrouter');
  return providers;
}

async function callAnthropic(
  apiKey: string,
  modelId: string,
  messages: { role: string; content: string }[],
  system?: string
): Promise<string> {
  const payload: Record<string, unknown> = { model: modelId, max_tokens: 4096, messages };
  if (system) payload.system = system;
  const response = await tauriFetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Anthropic error ${response.status}`);
  }
  const data = await response.json();
  return data?.content?.[0]?.text ?? '';
}

async function callOpenAICompatible(
  baseUrl: string,
  apiKey: string,
  modelId: string,
  messages: { role: string; content: string }[],
  extraHeaders?: Record<string, string>
): Promise<string> {
  const response = await tauriFetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'authorization': `Bearer ${apiKey}`,
      'content-type': 'application/json',
      ...extraHeaders,
    },
    body: JSON.stringify({ model: modelId, max_tokens: 4096, messages }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `${baseUrl} error ${response.status}`);
  }
  const data = await response.json();
  return data?.choices?.[0]?.message?.content ?? '';
}

async function callServer(
  modelId: string,
  messages: { role: string; content: string }[]
): Promise<string> {
  // Calls PromptPack's own API which proxies to the Coolify-hosted Ollama server
  const response = await tauriFetch('https://api.pmtpk.com/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: modelId, messages }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error || `Server error ${response.status}`);
  }
  const data = await response.json();
  return data?.content ?? '';
}

async function callPreset(
  preset: ModelPreset,
  apiKeys: Record<string, string | undefined>,
  messages: { role: string; content: string }[],
  systemPrompt?: string
): Promise<string> {
  const { provider, modelId } = preset;

  // Anthropic uses a separate `system` param — extract from messages array
  if (provider === 'anthropic') {
    const chatMessages = messages.filter((m) => m.role !== 'system');
    const system = systemPrompt || messages.find((m) => m.role === 'system')?.content;
    return callAnthropic(apiKeys.anthropic!, modelId, chatMessages, system);
  }

  // OpenAI-compatible providers: prepend system message if provided
  const withSystem = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages.filter((m) => m.role !== 'system')]
    : messages;

  if (provider === 'server') {
    return callServer(modelId, withSystem);
  }

  const baseUrl = PROVIDER_BASE_URLS[provider];
  const apiKey = provider === 'ollama' ? 'ollama' : (apiKeys[provider] ?? '');

  const extraHeaders: Record<string, string> = {};
  if (provider === 'openrouter') {
    extraHeaders['http-referer'] = 'https://pmtpk.com';
    extraHeaders['x-title'] = 'PromptPack';
  }

  return callOpenAICompatible(baseUrl, apiKey, modelId, withSystem, extraHeaders);
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,

  sendMessage: async (text: string, packName?: string, systemPrompt?: string) => {
    const { apiKeys, billingTier, serverChatCount, incrementServerChatCount } = useSettingsStore.getState();
    const available = getAvailableProviders((apiKeys ?? {}) as Record<string, string | undefined>);

    const tier = classifyTier(text);
    const preset = pickModel(tier, available);

    if (!preset) {
      set({ error: 'Could not find a model to handle this request.' });
      return;
    }

    // Free tier: 3 uses of PromptPack-hosted model
    const FREE_CHAT_LIMIT = 3;
    if (preset.provider === 'server' && billingTier === 'free' && serverChatCount >= FREE_CHAT_LIMIT) {
      set({ error: '__CHAT_LIMIT_REACHED__' });
      return;
    }

    const userMsg: ChatMessage = {
      id: makeId(),
      role: 'user',
      content: text,
      packName,
      createdAt: Date.now(),
    };

    set((state) => ({ messages: [...state.messages, userMsg], isLoading: true, error: null }));

    const history = get().messages.map((m) => ({ role: m.role, content: m.content }));

    try {
      const content = await callPreset(preset, (apiKeys ?? {}) as Record<string, string | undefined>, history, systemPrompt);

      // Track server usage for free tier
      if (preset.provider === 'server') incrementServerChatCount();

      set((state) => ({
        messages: [
          ...state.messages,
          { id: makeId(), role: 'assistant', content, preset, createdAt: Date.now() } satisfies ChatMessage,
        ],
        isLoading: false,
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Something went wrong',
        isLoading: false,
      });
    }
  },

  clearMessages: () => set({ messages: [], error: null }),
  clearError: () => set({ error: null }),
}));
