import { create } from 'zustand';
import { tauriFetch } from '../lib/tauriFetch';
import {
  classifyTier,
  pickModel,
  PROVIDER_BASE_URLS,
  MODEL_PRESETS,
  type ModelPreset,
  type Provider,
} from '../lib/classifier';
import { useSettingsStore } from './settingsStore';
import { useAgentStore } from './agentStore';
import { AGENT_TOOLS, AGENT_SYSTEM_PROMPT, dispatchTool } from '../lib/agentTools';

// ---------------------------------------------------------------------------
// Message shape
// ---------------------------------------------------------------------------
//
// Each message carries either plain `content` (legacy, used by non-agent flow)
// or a sequence of structured `blocks` (used by agent flow so we can render
// tool calls + results inline). The UI renders `blocks` when present.

export type MessageBlock =
  | { kind: 'text'; text: string }
  | { kind: 'tool_use'; toolUseId: string; name: string; input: Record<string, unknown> }
  | {
      kind: 'tool_result';
      toolUseId: string;
      output: string;
      isError?: boolean;
      pendingEditId?: string;
    };

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  blocks?: MessageBlock[];
  preset?: ModelPreset;
  packName?: string;
  createdAt: number;
}

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  agentMode: boolean;
  setAgentMode: (on: boolean) => void;
  sendMessage: (text: string, packName?: string, systemPrompt?: string) => Promise<void>;
  clearMessages: () => void;
  clearError: () => void;
}

function makeId() {
  return Math.random().toString(36).slice(2);
}

// Cache loaded Ollama models for the session. /api/tags is cheap but
// hitting it on every message is still wasteful. Refresh on first send
// after a 60s TTL so newly-pulled models surface.
let ollamaCache: { at: number; models: string[] } | null = null;

async function fetchOllamaModels(): Promise<string[]> {
  if (ollamaCache && Date.now() - ollamaCache.at < 60_000) return ollamaCache.models;
  try {
    const res = await tauriFetch('http://localhost:11434/api/tags', { method: 'GET' });
    if (!res.ok) return ollamaCache?.models ?? [];
    const data = await res.json();
    const models = Array.isArray(data?.models)
      ? data.models.map((m: { name: string }) => m.name).filter(Boolean)
      : [];
    ollamaCache = { at: Date.now(), models };
    return models;
  } catch {
    return ollamaCache?.models ?? [];
  }
}

/// If preset targets Ollama but its modelId isn't loaded, swap to the
/// closest available local model. Falls back to first loaded model so
/// the user gets *something* usable instead of "model not found".
function reconcileOllamaPreset(preset: ModelPreset, loaded: string[]): ModelPreset | null {
  if (preset.provider !== 'ollama') return preset;
  if (loaded.length === 0) return null;
  if (loaded.includes(preset.modelId)) return preset;

  // Try a lenient match — same family, ignore tag (gemma3:4b vs gemma3:7b)
  const wantedBase = preset.modelId.split(':')[0];
  const sibling = loaded.find((m) => m.split(':')[0] === wantedBase);
  if (sibling) return { ...preset, modelId: sibling, label: `${sibling} (local)` };

  // Fall back to first loaded model — user clearly has something running
  const first = loaded[0];
  return { ...preset, modelId: first, label: `${first} (local)` };
}

function getAvailableProviders(apiKeys: Record<string, string | undefined>): Set<Provider> {
  const providers = new Set<Provider>();
  providers.add('server');
  providers.add('ollama');
  if (apiKeys.anthropic) providers.add('anthropic');
  if (apiKeys.openai) providers.add('openai');
  if (apiKeys.gemini) providers.add('gemini');
  if (apiKeys.grok) providers.add('grok');
  if (apiKeys.deepseek) providers.add('deepseek');
  if (apiKeys.perplexity) providers.add('perplexity');
  if (apiKeys.kimi) providers.add('kimi');
  if (apiKeys.groq) providers.add('groq');
  if (apiKeys.openrouter) providers.add('openrouter');
  return providers;
}

const TOOL_CAPABLE: Set<Provider> = new Set([
  'anthropic',
  'openai',
  'groq',
  'deepseek',
  'kimi',
  'openrouter',
  'ollama',
  'gemini',
]);

function pickToolCapableModel(
  tier: ReturnType<typeof classifyTier>,
  available: Set<Provider>,
): ModelPreset | null {
  return (
    MODEL_PRESETS.filter(
      (m) => m.tier === tier && available.has(m.provider) && TOOL_CAPABLE.has(m.provider),
    ).sort((a, b) => a.costPer1M - b.costPer1M)[0] ?? null
  );
}

// ---------------------------------------------------------------------------
// Plain chat (no tools)
// ---------------------------------------------------------------------------

async function callAnthropicPlain(
  apiKey: string,
  modelId: string,
  messages: { role: string; content: string }[],
  system?: string,
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
  extraHeaders?: Record<string, string>,
): Promise<string> {
  const response = await tauriFetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
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
  messages: { role: string; content: string }[],
): Promise<string> {
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

async function callPlainPreset(
  preset: ModelPreset,
  apiKeys: Record<string, string | undefined>,
  messages: { role: string; content: string }[],
  systemPrompt?: string,
): Promise<string> {
  const { provider, modelId } = preset;
  if (provider === 'anthropic') {
    const chatMessages = messages.filter((m) => m.role !== 'system');
    const system = systemPrompt || messages.find((m) => m.role === 'system')?.content;
    return callAnthropicPlain(apiKeys.anthropic!, modelId, chatMessages, system);
  }
  const withSystem = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages.filter((m) => m.role !== 'system')]
    : messages;
  if (provider === 'server') return callServer(modelId, withSystem);
  const baseUrl = PROVIDER_BASE_URLS[provider];
  const apiKey = provider === 'ollama' ? 'ollama' : apiKeys[provider] ?? '';
  const extraHeaders: Record<string, string> = {};
  if (provider === 'openrouter') {
    extraHeaders['http-referer'] = 'https://pmtpk.com';
    extraHeaders['x-title'] = 'Skillset';
  }
  return callOpenAICompatible(baseUrl, apiKey, modelId, withSystem, extraHeaders);
}

// ---------------------------------------------------------------------------
// Agent (tool-use) flow
// ---------------------------------------------------------------------------

const MAX_TOOL_ROUNDS = 12;

interface AnthropicContentBlock {
  type: 'text' | 'tool_use';
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
}

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string | AnthropicContentBlock[] | Array<{
    type: 'tool_result';
    tool_use_id: string;
    content: string;
    is_error?: boolean;
  }>;
}

async function anthropicAgentTurn(
  apiKey: string,
  modelId: string,
  messages: AnthropicMessage[],
  system: string,
): Promise<{ content: AnthropicContentBlock[]; stop_reason: string }> {
  const response = await tauriFetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: 4096,
      system,
      tools: AGENT_TOOLS.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.input_schema,
      })),
      messages,
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Anthropic error ${response.status}`);
  }
  const data = await response.json();
  return { content: data.content ?? [], stop_reason: data.stop_reason ?? 'end_turn' };
}

interface OpenAIToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: OpenAIToolCall[];
  tool_call_id?: string;
  name?: string;
}

async function openaiAgentTurn(
  baseUrl: string,
  apiKey: string,
  modelId: string,
  messages: OpenAIMessage[],
  extraHeaders: Record<string, string>,
): Promise<OpenAIMessage> {
  const response = await tauriFetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
      ...extraHeaders,
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: 4096,
      messages,
      tools: AGENT_TOOLS.map((t) => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.input_schema,
        },
      })),
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `${baseUrl} error ${response.status}`);
  }
  const data = await response.json();
  return data?.choices?.[0]?.message ?? { role: 'assistant', content: '' };
}

async function runAnthropicAgent(
  apiKey: string,
  modelId: string,
  workspace: string,
  history: ChatMessage[],
  userText: string,
  pushAssistant: (msg: ChatMessage) => void,
  patchAssistant: (id: string, blocks: MessageBlock[]) => void,
): Promise<void> {
  const apiMessages: AnthropicMessage[] = [];

  // Replay history into Anthropic format
  for (const m of history) {
    if (m.role === 'user') {
      apiMessages.push({ role: 'user', content: m.content });
    } else if (m.blocks) {
      const blocks: AnthropicContentBlock[] = [];
      for (const b of m.blocks) {
        if (b.kind === 'text') blocks.push({ type: 'text', text: b.text });
        else if (b.kind === 'tool_use') {
          blocks.push({ type: 'tool_use', id: b.toolUseId, name: b.name, input: b.input });
        }
      }
      if (blocks.length) apiMessages.push({ role: 'assistant', content: blocks });

      const toolResults: Array<{ type: 'tool_result'; tool_use_id: string; content: string; is_error?: boolean }> = [];
      for (const b of m.blocks) {
        if (b.kind === 'tool_result') {
          toolResults.push({
            type: 'tool_result',
            tool_use_id: b.toolUseId,
            content: b.output,
            is_error: b.isError,
          });
        }
      }
      if (toolResults.length) apiMessages.push({ role: 'user', content: toolResults });
    } else if (m.content) {
      apiMessages.push({ role: 'assistant', content: m.content });
    }
  }
  apiMessages.push({ role: 'user', content: userText });

  const assistantId = makeId();
  const assistantBlocks: MessageBlock[] = [];
  pushAssistant({
    id: assistantId,
    role: 'assistant',
    content: '',
    blocks: assistantBlocks,
    createdAt: Date.now(),
  });

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const turn = await anthropicAgentTurn(apiKey, modelId, apiMessages, AGENT_SYSTEM_PROMPT);
    const apiContent: AnthropicContentBlock[] = [];

    for (const block of turn.content) {
      if (block.type === 'text' && block.text) {
        assistantBlocks.push({ kind: 'text', text: block.text });
        apiContent.push({ type: 'text', text: block.text });
      } else if (block.type === 'tool_use' && block.id && block.name) {
        const input = block.input ?? {};
        assistantBlocks.push({
          kind: 'tool_use',
          toolUseId: block.id,
          name: block.name,
          input,
        });
        apiContent.push({ type: 'tool_use', id: block.id, name: block.name, input });
      }
    }
    patchAssistant(assistantId, [...assistantBlocks]);

    if (turn.stop_reason !== 'tool_use' || apiContent.every((c) => c.type !== 'tool_use')) break;

    apiMessages.push({ role: 'assistant', content: apiContent });

    const toolResults: Array<{ type: 'tool_result'; tool_use_id: string; content: string; is_error?: boolean }> = [];
    for (const block of apiContent) {
      if (block.type !== 'tool_use' || !block.id || !block.name) continue;
      try {
        const res = await dispatchTool({ workspace }, block.name, block.input ?? {});
        assistantBlocks.push({
          kind: 'tool_result',
          toolUseId: block.id,
          output: res.output,
          pendingEditId: res.pendingEditId,
        });
        toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: res.output });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        assistantBlocks.push({
          kind: 'tool_result',
          toolUseId: block.id,
          output: message,
          isError: true,
        });
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: message,
          is_error: true,
        });
      }
    }
    patchAssistant(assistantId, [...assistantBlocks]);
    apiMessages.push({ role: 'user', content: toolResults });
  }
}

async function runOpenAIAgent(
  baseUrl: string,
  apiKey: string,
  modelId: string,
  workspace: string,
  history: ChatMessage[],
  userText: string,
  extraHeaders: Record<string, string>,
  pushAssistant: (msg: ChatMessage) => void,
  patchAssistant: (id: string, blocks: MessageBlock[]) => void,
): Promise<void> {
  const apiMessages: OpenAIMessage[] = [
    { role: 'system', content: AGENT_SYSTEM_PROMPT },
  ];

  for (const m of history) {
    if (m.role === 'user') {
      apiMessages.push({ role: 'user', content: m.content });
    } else if (m.blocks) {
      let textBuf = '';
      const toolCalls: OpenAIToolCall[] = [];
      const results: OpenAIMessage[] = [];
      for (const b of m.blocks) {
        if (b.kind === 'text') textBuf += b.text;
        else if (b.kind === 'tool_use') {
          toolCalls.push({
            id: b.toolUseId,
            type: 'function',
            function: { name: b.name, arguments: JSON.stringify(b.input) },
          });
        } else if (b.kind === 'tool_result') {
          results.push({ role: 'tool', tool_call_id: b.toolUseId, content: b.output });
        }
      }
      apiMessages.push({
        role: 'assistant',
        content: textBuf || null,
        tool_calls: toolCalls.length ? toolCalls : undefined,
      });
      apiMessages.push(...results);
    } else if (m.content) {
      apiMessages.push({ role: 'assistant', content: m.content });
    }
  }
  apiMessages.push({ role: 'user', content: userText });

  const assistantId = makeId();
  const assistantBlocks: MessageBlock[] = [];
  pushAssistant({
    id: assistantId,
    role: 'assistant',
    content: '',
    blocks: assistantBlocks,
    createdAt: Date.now(),
  });

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const reply = await openaiAgentTurn(baseUrl, apiKey, modelId, apiMessages, extraHeaders);
    if (reply.content) {
      assistantBlocks.push({ kind: 'text', text: reply.content });
    }
    if (reply.tool_calls?.length) {
      for (const tc of reply.tool_calls) {
        let parsed: Record<string, unknown> = {};
        try {
          parsed = JSON.parse(tc.function.arguments || '{}');
        } catch {
          parsed = { _raw: tc.function.arguments };
        }
        assistantBlocks.push({
          kind: 'tool_use',
          toolUseId: tc.id,
          name: tc.function.name,
          input: parsed,
        });
      }
    }
    patchAssistant(assistantId, [...assistantBlocks]);

    if (!reply.tool_calls?.length) break;

    apiMessages.push({
      role: 'assistant',
      content: reply.content ?? null,
      tool_calls: reply.tool_calls,
    });

    for (const tc of reply.tool_calls) {
      let parsed: Record<string, unknown> = {};
      try {
        parsed = JSON.parse(tc.function.arguments || '{}');
      } catch {
        parsed = {};
      }
      try {
        const res = await dispatchTool({ workspace }, tc.function.name, parsed);
        assistantBlocks.push({
          kind: 'tool_result',
          toolUseId: tc.id,
          output: res.output,
          pendingEditId: res.pendingEditId,
        });
        apiMessages.push({ role: 'tool', tool_call_id: tc.id, content: res.output });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        assistantBlocks.push({
          kind: 'tool_result',
          toolUseId: tc.id,
          output: message,
          isError: true,
        });
        apiMessages.push({ role: 'tool', tool_call_id: tc.id, content: `ERROR: ${message}` });
      }
    }
    patchAssistant(assistantId, [...assistantBlocks]);
  }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  agentMode: false,

  setAgentMode: (on) => set({ agentMode: on }),

  sendMessage: async (text, packName, systemPrompt) => {
    const { apiKeys, billingTier, serverChatCount, incrementServerChatCount } =
      useSettingsStore.getState();
    const available = getAvailableProviders(
      (apiKeys ?? {}) as Record<string, string | undefined>,
    );
    const tier = classifyTier(text);

    const agentMode = get().agentMode;
    const workspace = useAgentStore.getState().workspace;

    // Agent path: use tool-capable provider, ignore packs/system overrides
    if (agentMode && workspace) {
      let preset = pickToolCapableModel(tier, available);
      if (!preset) {
        set({
          error:
            'Agent mode needs a tool-capable provider. Add an Anthropic, OpenAI, Groq, DeepSeek, or OpenRouter key in Settings.',
        });
        return;
      }
      if (preset.provider === 'ollama') {
        const loaded = await fetchOllamaModels();
        const reconciled = reconcileOllamaPreset(preset, loaded);
        if (!reconciled) {
          set({
            error:
              'No Ollama models loaded. Pull one first, e.g. `ollama pull llama3.1:8b`.',
          });
          return;
        }
        preset = reconciled;
      }
      const userMsg: ChatMessage = {
        id: makeId(),
        role: 'user',
        content: text,
        createdAt: Date.now(),
      };
      set((state) => ({
        messages: [...state.messages, userMsg],
        isLoading: true,
        error: null,
      }));

      const history = get().messages.slice(0, -1); // exclude just-added user msg
      const pushAssistant = (msg: ChatMessage) =>
        set((state) => ({ messages: [...state.messages, msg] }));
      const patchAssistant = (id: string, blocks: MessageBlock[]) =>
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === id ? { ...m, blocks: [...blocks] } : m,
          ),
        }));

      try {
        if (preset.provider === 'anthropic') {
          await runAnthropicAgent(
            (apiKeys ?? {}).anthropic!,
            preset.modelId,
            workspace,
            history,
            text,
            pushAssistant,
            patchAssistant,
          );
        } else {
          const baseUrl = PROVIDER_BASE_URLS[preset.provider];
          const keyMap = (apiKeys ?? {}) as Record<string, string | undefined>;
          const apiKey =
            preset.provider === 'ollama' ? 'ollama' : keyMap[preset.provider] ?? '';
          const extra: Record<string, string> = {};
          if (preset.provider === 'openrouter') {
            extra['http-referer'] = 'https://pmtpk.com';
            extra['x-title'] = 'Skillset';
          }
          await runOpenAIAgent(
            baseUrl,
            apiKey,
            preset.modelId,
            workspace,
            history,
            text,
            extra,
            pushAssistant,
            patchAssistant,
          );
        }
        // Record preset on the last assistant message
        set((state) => {
          const msgs = [...state.messages];
          for (let i = msgs.length - 1; i >= 0; i--) {
            if (msgs[i].role === 'assistant' && !msgs[i].preset) {
              msgs[i] = { ...msgs[i], preset };
              break;
            }
          }
          return { messages: msgs, isLoading: false };
        });
      } catch (err) {
        set({
          error: err instanceof Error ? err.message : 'Something went wrong',
          isLoading: false,
        });
      }
      return;
    }

    // Plain chat path (existing behavior)
    let preset = pickModel(tier, available);
    if (!preset) {
      set({ error: 'Could not find a model to handle this request.' });
      return;
    }
    if (preset.provider === 'ollama') {
      const loaded = await fetchOllamaModels();
      const reconciled = reconcileOllamaPreset(preset, loaded);
      if (!reconciled) {
        set({
          error:
            'No Ollama models loaded. Pull one first, e.g. `ollama pull llama3.1:8b`.',
        });
        return;
      }
      preset = reconciled;
    }
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
      const content = await callPlainPreset(
        preset,
        (apiKeys ?? {}) as Record<string, string | undefined>,
        history,
        systemPrompt,
      );
      if (preset.provider === 'server') incrementServerChatCount();
      set((state) => ({
        messages: [
          ...state.messages,
          { id: makeId(), role: 'assistant', content, preset, createdAt: Date.now() },
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
