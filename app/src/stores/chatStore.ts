import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { tauriFetch } from '../lib/tauriFetch';
import {
  classifyTier,
  classifyPrompt,
  pickModel,
  MODEL_PRESETS,
  PROVIDER_BASE_URLS,
  type EffortLevel,
  type ModelPreset,
  type Provider,
  type RouteClass,
} from '../lib/classifier';
import { predictRouteWithConfidence } from '../lib/classifierModel';
import { llmRouteFallback, FALLBACK_THRESHOLD } from '../lib/routeFallback';
import { logRoute, settleRoute } from '../lib/telemetry';
import { applyReasoning, capEffortForAgentLoop, managedProxyReasoning } from '../lib/reasoningParams';
import { useSettingsStore, SERVER_DAILY_CAPS } from './settingsStore';
import { useAgentStore } from './agentStore';
import { useAuthStore } from './authStore';
import { useNotificationStore } from './notificationStore';
import { AGENT_TOOLS, AGENT_SYSTEM_PROMPT, dispatchTool, detectWriteFileIntent } from '../lib/agentTools';
import { pickFromSelections, getManagedModel, estimateCreditsForCall } from '../lib/managed-models';
import { syncCreditsFromHeaders } from '../lib/creditSync';
import { friendlyApiError, safeParseErrorBody } from '../lib/apiErrors';

// ---------------------------------------------------------------------------
// Managed-mode (credit-metered OpenRouter via Cloudflare Workers proxy)
// ---------------------------------------------------------------------------

const MANAGED_API_URL = 'https://api.skillset.so/api/llm/chat';
// const MANAGED_API_URL = 'https://api.pmtpk.com/api/llm/chat'; // rollback only

class InsufficientCreditsError extends Error {
  constructor() {
    super('insufficient_credits');
    this.name = 'InsufficientCreditsError';
  }
}

class SessionExpiredError extends Error {
  constructor() {
    super('session_expired');
    this.name = 'SessionExpiredError';
  }
}

class SkillFlowLockedError extends Error {
  constructor() {
    super('SkillFlow workflows are a Pro / Studio feature. Upgrade to run multi-step AI workflows.');
    this.name = 'SkillFlowLockedError';
  }
}

class FrontierLockedError extends Error {
  constructor() {
    super('Premium Models (Opus, GPT-5 Pro, o3 Pro) are a Pro / Studio feature. Pick a Standard model or upgrade.');
    this.name = 'FrontierLockedError';
  }
}

class DailyLimitError extends Error {
  constructor() {
    super('Daily free-trial limit reached. Resets at midnight UTC, or upgrade for the full monthly allowance.');
    this.name = 'DailyLimitError';
  }
}

async function callManagedProxy(
  jwt: string,
  modelId: string,
  messages: { role: string; content: string }[],
  systemPrompt?: string,
  effort?: EffortLevel | null,
): Promise<string> {
  const fullMessages = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;
  const body: Record<string, unknown> = {
    model: modelId,
    messages: fullMessages,
    ...managedProxyReasoning(modelId, effort ?? null),
  };
  const res = await tauriFetch(MANAGED_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify(body),
  });

  if (res.status === 401) {
    throw new SessionExpiredError();
  }
  if (res.status === 402) {
    // Log JWT sub + balance hint so insufficient_credits w/ a populated balance
    // can be cross-checked against Convex (clerkId mismatch is a common cause).
    try {
      const sub = JSON.parse(atob(jwt.split('.')[1]))?.sub;
      console.warn('[managed-proxy] 402 insufficient_credits — jwt.sub =', sub);
    } catch { /* ignore decode failure */ }
    throw new InsufficientCreditsError();
  }
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { code?: string; message?: string };
    if (res.status === 403 && err.code === 'SKILLFLOW_REQUIRES_PAID') {
      throw new SkillFlowLockedError();
    }
    if (res.status === 403 && err.code === 'FRONTIER_NOT_ALLOWED') {
      throw new FrontierLockedError();
    }
    if (res.status === 429 && err.code === 'DAILY_FREE_LIMIT_REACHED') {
      throw new DailyLimitError();
    }
    // Friendly fallback. Raw status + JSON only goes to console for debugging.
    console.error('[managed-proxy]', res.status, err);
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      throw new Error('Connection to the AI provider failed. Please try again in a moment.');
    }
    if (res.status >= 500) {
      throw new Error('Something went wrong on our end. Please try again in a moment.');
    }
    throw new Error(err.message || "Couldn't send this message. Please try again.");
  }

  // Sync balance from response headers
  syncCreditsFromHeaders(res);

  const data = await res.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content ?? '';
}

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
    }
  | {
      // Orchestrator-only: header rendered above each subtask's output text
      // so the chat shows the same tier / model / effort chips used by the
      // single-shot path. Patched in-place from `pending` → `done` / `failed`.
      kind: 'subtask_header';
      subtaskId: string;
      title: string;
      tier?: import('../lib/classifier').ModelTier;
      modelId?: string;          // Managed-mode OpenRouter model id
      modelLabel?: string;       // Pretty label for the chip
      effort?: import('../lib/classifier').EffortLevel | null;
      status: 'running' | 'done' | 'failed';
      reasoningTokens?: number;
      error?: string;
    }
  | {
      // Orchestrator-only: tiny "Planned by X" caption above the subtask
      // stream. Pushed once on `onPlan` so users see who decomposed their
      // goal without opening the Run Trace panel.
      kind: 'planner_hint';
      label: string;
      isFree: boolean;
    };

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  blocks?: MessageBlock[];
  preset?: ModelPreset;
  packName?: string;
  // Managed-mode model that produced this assistant message
  // (OpenRouter id, e.g. "anthropic/claude-haiku-4-5"). Used to render
  // a small model chip below the message.
  modelId?: string;
  /**
   * Classifier tier the LR head emitted for the user's prompt. Used to
   * render the same Fast / Balanced / Powerful chip the BYOK path shows
   * via `preset.tier`. Set on managed-mode messages so the UI is
   * consistent regardless of which call path served the response.
   */
  tier?: import('../lib/classifier').ModelTier;
  /**
   * Reasoning effort the runtime applied (`low | medium | high | null`).
   * `null` = no thinking budget (fast tier OR non-reasoning model).
   * Used to render the effort chip alongside the tier chip.
   */
  effort?: import('../lib/classifier').EffortLevel | null;
  // Workspace-relative paths of files copied into the workspace
  // when this user message was sent. Used to render an inline tooltip
  // reminding the user the files are persisted and reusable.
  attachments?: string[];
  /**
   * True when the user had the Workflow toggle on but the LR classifier
   * determined the goal was a fast-tier lookup, so the orchestrator was
   * skipped in favor of a single-shot call. Renders a tiny note next to
   * the model chip so the user understands why no subtask chips / Run
   * Trace activity appeared.
   */
  orchestratorSkipped?: boolean;
  /**
   * Up-front routing decision shown in the placeholder bubble *before*
   * any LLM call lands, so the user sees which path the cost-aware
   * router picked the moment they hit send. Cleared once the assistant
   * response is materialised — at that point the model chip carries
   * the same info more permanently.
   */
  routeLabel?: string;
  /**
   * Routing-telemetry row id (Phase 2). Set on the assistant message so
   * the UI can settle the row with thumbs-up / thumbs-down on click and
   * so a follow-up user message can record reprompt-within seconds for
   * the prior assistant turn.
   */
  telemetryId?: string;
  /** Sticky thumbs vote — once set, the toolbar highlights it. */
  userSignal?: 'thumbs_up' | 'thumbs_down';
  createdAt: number;
}

/** A single pack prompt — already filled with variable values. */
export interface PackStep {
  /** Optional short label rendered above the prompt (e.g. `Stock Analysis Plan`). */
  header?: string;
  /** Filled prompt text sent to the model. */
  text: string;
}

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  agentMode: boolean;
  /**
   * One-line routing decision rendered immediately after the user
   * hits send and BEFORE any LLM call. Lets users confirm the
   * cost-aware router picked the right path (single-shot / agent /
   * SkillFlow) without waiting for tokens to land. Cleared once the
   * response is materialised — by then the per-message model chip
   * carries the same info long-term.
   */
  pendingRouteLabel: string | null;
  setAgentMode: (on: boolean) => void;
  /**
   * FIFO of prompts the user typed while a previous message was still
   * running. Drained one-at-a-time after each `sendMessage` resolves —
   * the user can keep adding follow-ups instead of waiting for the
   * current generation to finish.
   */
  messageQueue: { text: string; packName?: string; systemPrompt?: string; attachments?: string[] }[];
  enqueueMessage: (entry: { text: string; packName?: string; systemPrompt?: string; attachments?: string[] }) => void;
  removeQueuedMessage: (index: number) => void;
  clearQueue: () => void;
  /**
   * Cancel the in-flight assistant turn. Aborts the orchestrator's
   * AbortController + flips `isLoading` off so the input + send button
   * become responsive again. The queue is preserved so users can clear
   * it explicitly via `clearQueue` if they want to drop pending sends.
   */
  stopGeneration: () => void;
  sendMessage: (text: string, packName?: string, systemPrompt?: string, attachments?: string[]) => Promise<void>;
  /**
   * Run an entire pack as ONE orchestrator run. Each pack step becomes
   * a subtask whose `depends_on` chains to the previous step, so step N
   * automatically inherits step N-1's output via shared TaskState. The
   * orchestrator's planner LLM is skipped — pack prompts ARE the plan.
   * Run Trace panel auto-opens with one chip per pack step.
   */
  /**
   * Phase 5 — resume an orchestrator run that hit a mid-flow 402.
   * Re-runs the orchestrator with the cached `runStore.taskState`; the
   * executor's done-skip short-circuit means subtasks that already
   * succeeded don't burn credits a second time. The user is expected
   * to top up first; this just replays the rest of the plan.
   */
  resumeOrchestratorRun: () => Promise<void>;
  runPack: (
    packTitle: string,
    steps: PackStep[],
    attachments?: string[],
    /**
     * Free-form per-run instructions to layer on top of the pack.
     * Threaded into `TaskState.summaries.rolling` so every subtask
     * sees them under "CONTEXT SO FAR". Used for both the workspace
     * `skillset.md` file (auto-detected here) and the chat-input text
     * the user types while a pack tag is selected (passed in by the
     * SkillChat handler).
     */
    extraInstructions?: string,
  ) => Promise<void>;
  clearMessages: () => void;
  clearError: () => void;
  voteOnMessage: (messageId: string, signal: 'thumbs_up' | 'thumbs_down') => void;
  /**
   * Re-run the user message that produced `assistantId`. Drops the
   * existing assistant message + any error sentinel and dispatches
   * `sendMessage` again with the original args. Used by the manual
   * "Retry" button on failed/empty assistant bubbles.
   */
  retryFromAssistant: (assistantId: string) => Promise<void>;
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
  // ollama is added later only after a reachability probe — installed but
  // not running is the common case and we don't want to pick it blindly
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

/// Fresh reachability probe — uncached. Picker uses this each send so a
/// stopped Ollama server is dropped from the available set immediately.
async function probeOllama(): Promise<boolean> {
  try {
    const res = await tauriFetch('http://localhost:11434/api/tags', { method: 'GET' });
    if (!res.ok) return false;
    const data = await res.json();
    const models = Array.isArray(data?.models) ? data.models : [];
    if (models.length === 0) return false;
    // Refresh the model-list cache while we're here
    ollamaCache = {
      at: Date.now(),
      models: models.map((m: { name: string }) => m.name).filter(Boolean),
    };
    return true;
  } catch {
    return false;
  }
}

async function getAvailableProvidersAsync(
  apiKeys: Record<string, string | undefined>,
): Promise<Set<Provider>> {
  const sync = getAvailableProviders(apiKeys);
  if (await probeOllama()) sync.add('ollama');
  return sync;
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
  'server',  // Skillset-hosted Groq proxy supports tools via openai-compat
]);

// Inbuilt server is pinned to fast/balanced (8B Llama via Groq). Powerful
// tier requires a BYOK cloud key — runaway agent costs at 70B+ would blow
// the $9 plan's compute budget (see margin math).
const SERVER_BANNED_TIERS: Set<ReturnType<typeof classifyTier>> = new Set(['powerful']);

// (Tier-forcing now handled by always pinning server preset to the
// llama-3.1-8b-instant 8B model in pickToolCapableModel; no per-billing
// override needed — every server call is the same 8B regardless.)

// Cap conversation history sent upstream so a long thread doesn't
// snowball server costs. Tail of the most recent 14 turns is enough
// context for chat-style coding tasks.
const HISTORY_MAX_MESSAGES = 14;

// Server-side openai-compat endpoint for inbuilt Groq agent flow. Plain
// chat keeps the legacy /chat shape via callServer().
const SERVER_OPENAI_COMPAT_BASE = 'https://api.skillset.so/v1';
// const SERVER_OPENAI_COMPAT_BASE = 'https://api.pmtpk.com/v1'; // rollback only

// Local providers we treat as last-resort. If user configured a cloud key
// (BYOK), they explicitly opted in to that provider — using a free local
// model instead would feel broken even when it's "cheaper".
const LOCAL_PROVIDERS: Set<Provider> = new Set(['ollama', 'server']);

function byokSet(available: Set<Provider>): Set<Provider> {
  const byok = new Set<Provider>();
  for (const p of available) if (!LOCAL_PROVIDERS.has(p)) byok.add(p);
  return byok;
}

function pickToolCapableModel(
  tier: ReturnType<typeof classifyTier>,
  available: Set<Provider>,
  _billingTier: 'free' | 'pro' | 'studio',
): ModelPreset | null {
  const byok = byokSet(available);
  // 1. Cheapest BYOK cloud provider in this tier — they paid for it
  const cloud = MODEL_PRESETS.filter(
    (m) => m.tier === tier && byok.has(m.provider) && TOOL_CAPABLE.has(m.provider),
  ).sort((a, b) => a.costPer1M - b.costPer1M)[0];
  if (cloud) return cloud;

  // 2. Inbuilt server pinned to llama-3.1-8b-instant. Tier label preserved
  //    on the returned preset so UI tags still read correctly. Backend
  //    enforces 200/day cap and routes through Groq with tools support.
  if (available.has('server') && TOOL_CAPABLE.has('server')) {
    const s = MODEL_PRESETS.find(
      (m) => m.provider === 'server' && m.modelId === 'llama-3.1-8b-instant',
    );
    // Don't override the server preset's tier when falling back. The
    // chip label should reflect what's *actually* running (Llama 3.1
    // 8B = `fast` tier), not the tier the user wished for. Misleading
    // to label an 8B model "Powerful" just because the prompt was
    // classified powerful.
    if (s) return s;
  }

  // 3. Anything else tool-capable (e.g. Ollama) as last resort
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
  preset: ModelPreset,
  messages: { role: string; content: string }[],
  system?: string,
  effort?: EffortLevel | null,
): Promise<string> {
  let payload: Record<string, unknown> = {
    model: preset.modelId,
    max_tokens: 4096,
    messages,
  };
  if (system) payload.system = system;
  payload = applyReasoning(preset, effort ?? null, payload);
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
  preset: ModelPreset,
  messages: { role: string; content: string }[],
  extraHeaders?: Record<string, string>,
  effort?: EffortLevel | null,
): Promise<string> {
  const body = applyReasoning(preset, effort ?? null, {
    model: preset.modelId,
    max_tokens: 4096,
    messages,
  });
  const response = await tauriFetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
      ...extraHeaders,
    },
    body: JSON.stringify(body),
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
  const session = useAuthStore.getState().session;
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (session?.session_token) {
    headers['authorization'] = `Bearer ${session.session_token}`;
  }
  const response = await tauriFetch('https://api.skillset.so/chat', {
    method: 'POST',
    headers,
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
  effort?: EffortLevel | null,
): Promise<string> {
  const { provider, modelId } = preset;
  if (provider === 'anthropic') {
    const chatMessages = messages.filter((m) => m.role !== 'system');
    const system = systemPrompt || messages.find((m) => m.role === 'system')?.content;
    return callAnthropicPlain(apiKeys.anthropic!, preset, chatMessages, system, effort);
  }
  const withSystem = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages.filter((m) => m.role !== 'system')]
    : messages;
  // Server (Skillset Groq proxy) is pinned to Llama 3.1 8B which doesn't
  // reason — drop the effort knob silently.
  if (provider === 'server') return callServer(modelId, withSystem);
  const baseUrl = PROVIDER_BASE_URLS[provider];
  const apiKey = provider === 'ollama' ? 'ollama' : apiKeys[provider] ?? '';
  const extraHeaders: Record<string, string> = {};
  if (provider === 'openrouter') {
    extraHeaders['http-referer'] = 'https://skillset.so';
    extraHeaders['x-title'] = 'Skillset';
  }
  return callOpenAICompatible(baseUrl, apiKey, preset, withSystem, extraHeaders, effort);
}

// ---------------------------------------------------------------------------
// Agent (tool-use) flow
// ---------------------------------------------------------------------------

// Agent-loop round cap. Each round is one full LLM call + tool dispatch.
// Tighter caps protect against runaway loops on stubborn models that
// keep tool-fishing without converging. Lowered from 8 to 5 after a
// Tesla / Rivian / Lucid run on GPT-5 Pro burned $8 / 1,000 credits in
// one prompt — the model was looping on `web_fetch` calls that kept
// returning empty pages, with each round resending the full
// accumulating tool history. Rare cases that need more rounds should
// be split into multiple user messages.
const MAX_TOOL_ROUNDS = 5;

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
  preset: ModelPreset,
  messages: AnthropicMessage[],
  system: string,
  effort?: EffortLevel | null,
  forceToolName?: string,
): Promise<{ content: AnthropicContentBlock[]; stop_reason: string }> {
  const baseBody: Record<string, unknown> = {
    model: preset.modelId,
    max_tokens: 4096,
    system,
    tools: AGENT_TOOLS.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.input_schema,
    })),
    messages,
  };
  // Anthropic forces a specific tool with: tool_choice = { type: 'tool', name: '...' }
  // Used on the first round when the user explicitly asked to save a file.
  if (forceToolName) {
    baseBody.tool_choice = { type: 'tool', name: forceToolName };
  }
  const body = applyReasoning(preset, effort ?? null, baseBody);
  const response = await tauriFetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
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
  preset: ModelPreset,
  messages: OpenAIMessage[],
  extraHeaders: Record<string, string>,
  effort?: EffortLevel | null,
  forceToolName?: string,
): Promise<OpenAIMessage> {
  const baseBody: Record<string, unknown> = {
    model: preset.modelId,
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
  };
  // OpenAI / OpenAI-compat: tool_choice = { type: 'function', function: { name: '...' } }
  if (forceToolName) {
    baseBody.tool_choice = { type: 'function', function: { name: forceToolName } };
  }
  const body = applyReasoning(preset, effort ?? null, baseBody);
  const response = await tauriFetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `${baseUrl} error ${response.status}`);
  }
  // Worker emits X-Credits-* on the managed-proxy alias only; helper
  // no-ops on direct provider URLs (api.openai.com, etc).
  syncCreditsFromHeaders(response);
  const data = await response.json();
  return data?.choices?.[0]?.message ?? { role: 'assistant', content: '' };
}

async function runAnthropicAgent(
  apiKey: string,
  preset: ModelPreset,
  workspace: string,
  history: ChatMessage[],
  userText: string,
  pushAssistant: (msg: ChatMessage) => void,
  patchAssistant: (id: string, blocks: MessageBlock[]) => void,
  onBeforeRound?: () => void,
  effort?: EffortLevel | null,
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

  // First-round tool-choice nudge: when the user explicitly asks to
  // save a file ("save as foo.md", "output it as plan.md", etc.), force
  // the model to call write_file on the first round. Cheaper and more
  // reliable than hoping the system prompt convinces the model.
  const forceWritePath = detectWriteFileIntent(userText);

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    onBeforeRound?.();
    const forceTool = round === 0 && forceWritePath ? 'write_file' : undefined;
    const turn = await anthropicAgentTurn(
      apiKey,
      preset,
      apiMessages,
      AGENT_SYSTEM_PROMPT,
      effort ?? null,
      forceTool,
    );
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
  preset: ModelPreset,
  workspace: string,
  history: ChatMessage[],
  userText: string,
  extraHeaders: Record<string, string>,
  pushAssistant: (msg: ChatMessage) => void,
  patchAssistant: (id: string, blocks: MessageBlock[]) => void,
  onBeforeRound?: () => void,
  effort?: EffortLevel | null,
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
        // Force empty-string content (never null) — OpenRouter's
        // adapter for Anthropic models iterates `msg.content` even
        // when null, throwing `TypeError: msg.content is not iterable`
        // on tool-only assistant turns. Empty string passes the
        // iteration safely.
        content: textBuf || '',
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

  // First-round tool-choice nudge — see anthropicAgent above.
  const forceWritePath = detectWriteFileIntent(userText);

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    onBeforeRound?.();
    const forceTool = round === 0 && forceWritePath ? 'write_file' : undefined;
    const reply = await openaiAgentTurn(
      baseUrl,
      apiKey,
      preset,
      apiMessages,
      extraHeaders,
      effort ?? null,
      forceTool,
    );
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
      content: reply.content ?? '',
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
// Orchestrator path (managed-mode + orchestratorEnabled flag)
// ---------------------------------------------------------------------------

import { Orchestrator } from '../lib/orchestrator/orchestrator';
import type { SubtaskRunner } from '../lib/orchestrator/executor';
import { runAgentSubtask } from '../lib/orchestrator/agentSubtask';
import { emptyTaskState } from '../lib/orchestrator/types';
import { runCreate } from '../lib/orchestrator/persist';
import { classifyExecutionMode } from '../lib/orchestrator/executionMode';

/**
 * Convert a raw run-failure message into a user-readable sentence.
 * Catches the `HTTP NNN` shape that `fetchWithRetry` throws and routes
 * through `friendlyApiError` so the chat bubble doesn't surface raw
 * status codes. Falls through to the original message when no HTTP
 * pattern is found.
 */
function humanizeRunFailure(raw: string): string {
  const m = raw.match(/HTTP\s+(\d{3})/);
  if (!m) return raw;
  const status = parseInt(m[1], 10);
  if (!Number.isFinite(status)) return raw;
  return friendlyApiError(status, null, 'agent');
}
import { useRunStore } from './runStore';
import type { ManagedTier } from '../lib/managed-models';

// `patchSubtaskHeader` removed — orchestrator no longer pushes
// subtask_header blocks to chat. Per-subtask routing/status renders
// from runStore in the Run Trace panel only. The block type is kept
// in the MessageBlock union so historical sessions still render.

interface OrchestratorMessageDeps {
  text: string;
  packName?: string;
  attachments?: string[];
  jwt: string;
  selections: Record<ManagedTier, string>;
  /** BYOK keys, used by the per-subtask BYOK runner closure. */
  apiKeys: Record<string, string | undefined>;
  /** Available providers (BYOK + server + ollama if reachable). */
  available: Set<Provider>;
  /** Workspace path; required for tool-using subtasks. Null disables tools. */
  workspace: string | null;
  /** Managed mode flag — controls whether no-BYOK + workspace subtasks
   *  redirect through the managed-proxy agent loop instead of falling
   *  to the free Llama 8B (which hallucinates tool calls). */
  managedModeEnabled: boolean;
  billingTier: 'free' | 'pro' | 'studio';
  /** Routing telemetry row id; settle on done/fail/cancel. */
  telemetryId: string | null;
  /**
   * When set, skip the orchestrator's planner LLM and run this user-
   * authored plan instead. Pack runs use this — pack prompts ARE the
   * subtask list, no need to re-decompose. Each subtask's instruction
   * is the corresponding pack prompt.
   */
  predefinedPlan?: import('../lib/orchestrator/types').PlannerOutput;
  /** Override label for the planner_hint chip when predefinedPlan is set. */
  predefinedPlanLabel?: string;
  /**
   * Phase 5 resume support. When set, `runOrchestratorMessage` seeds
   * `runStore.taskState` with this snapshot before kicking off the
   * orchestrator. The executor's done-skip path then short-circuits
   * subtasks that already completed in the prior run.
   */
  resumeTaskState?: import('../lib/orchestrator/types').TaskState;
  /**
   * Free-form extra context (e.g. user-typed per-run extras) pre-loaded
   * into `TaskState.summaries.rolling` so every subtask sees it under
   * "CONTEXT SO FAR". Use {@link projectInstructions} for the raw
   * `skillset.md` contents — those get directive-grade placement in the
   * agent's system prompt instead of rolling-summary framing.
   */
  extraContext?: string;
  /**
   * Raw contents of the workspace's `skillset.md` file (no wrapping
   * headers). Stamped onto `TaskState.projectInstructions` so every
   * subtask's agent loop injects it as a "# Project Skill (MUST FOLLOW)"
   * system-prompt suffix. Cheap-tier models (Haiku 4.5, Gemini 2.5 Flash)
   * ignore rules buried in user-message context but obey system-prompt
   * directives — this field is the registration fix.
   */
  projectInstructions?: string;
  set: (partial: Partial<ChatState> | ((s: ChatState) => Partial<ChatState>)) => void;
}

async function runOrchestratorMessage(deps: OrchestratorMessageDeps): Promise<void> {
  const {
    text,
    packName,
    attachments,
    selections,
    apiKeys,
    available,
    workspace,
    managedModeEnabled,
    billingTier,
    telemetryId,
    predefinedPlan,
    predefinedPlanLabel,
    extraContext,
    projectInstructions,
    resumeTaskState,
    set,
  } = deps;

  // Auto-enable Skill Flow ONLY for Set runs (packs with predefinedPlan).
  // Set runs are inherently a Skill Flow chain regardless of toggle; the
  // indicator must reflect that. Normal typed prompts respect the user's
  // toggle preference — we don't flip it for them. Idempotent.
  if (predefinedPlan && !useSettingsStore.getState().orchestratorEnabled) {
    useSettingsStore.getState().setOrchestratorEnabled(true);
  }

  // Auto-accept edits for the duration of a Set Run. Set runs are a
  // curated chain the user explicitly clicked "Run" on — they have
  // already consented to the whole batch. Pausing the executor between
  // steps for per-edit clicks defeats the point AND (worse) causes the
  // next step to read stale file content because the executor doesn't
  // block on pending-edit acceptance. Save the prior value so we can
  // restore in the finally — but only un-flip our own change. If the
  // user manually toggled mid-run, respect their choice.
  let autoAcceptRestore: (() => void) | null = null;
  if (predefinedPlan) {
    const agentStore = useAgentStore.getState();
    agentStore.setSetRunActive(true);
    if (!agentStore.autoAcceptEdits) {
      agentStore.setAutoAcceptEdits(true);
      autoAcceptRestore = () => {
        if (useAgentStore.getState().autoAcceptEdits === true) {
          useAgentStore.getState().setAutoAcceptEdits(false);
        }
      };
    }
  }
  // `deps.jwt` is intentionally ignored — refresh-aware tokens are
  // resolved via `useAuthStore.getValidAccessToken()` in `getJwt`
  // below + at every managed-proxy call site that follows.
  // Push the user message + a streaming assistant placeholder. The
  // orchestrator updates `useRunStore` for the Run Trace panel and
  // appends per-subtask text blocks to the assistant message so the
  // chat itself shows live progress.
  const userMsg: ChatMessage = {
    id: makeId(),
    role: 'user',
    content: text,
    packName,
    attachments: attachments && attachments.length > 0 ? [...attachments] : undefined,
    createdAt: Date.now(),
  };
  const assistantId = makeId();
  const blocks: MessageBlock[] = [];
  const assistantMsg: ChatMessage = {
    id: assistantId,
    role: 'assistant',
    content: '',
    blocks,
    telemetryId: telemetryId ?? undefined,
    createdAt: Date.now(),
  };

  set((state) => ({
    messages: [...state.messages, userMsg, assistantMsg],
    isLoading: true,
    error: null,
  }));

  // `patchBlocks` removed — orchestrator no longer streams chips into
  // the chat bubble during execution. Final answer is set once in
  // `onFinal`; intermediate state lives in runStore for the Run Trace
  // panel.

  // Create the Run row + bootstrap the run store.
  let runId: string | null = null;
  try {
    const run = await runCreate({ goal: text });
    runId = run.id;
    const abort = useRunStore.getState().startRun(run);

    // Phase 5 — resume: skip emptyTaskState and reuse the snapshot the
    // caller passed in. Done subtasks short-circuit in the executor;
    // pending/failed ones run fresh.
    const taskState = resumeTaskState ?? emptyTaskState(text);
    if (!resumeTaskState && extraContext?.trim()) {
      // Seed the rolling summary with user-supplied per-run extras so
      // every subtask sees them under "CONTEXT SO FAR". The rebuild
      // job in memory.ts later overwrites this slot — the user-instructions
      // header is preserved by including it inside the cap budget.
      taskState.summaries.rolling = extraContext.trim();
    }
    if (!resumeTaskState && projectInstructions?.trim()) {
      // skillset.md goes on a dedicated TaskState field so the executor
      // can route it to each subtask's system prompt (directive weight)
      // instead of letting it ride in rolling-summary framing (which
      // cheap-tier models treat as informational). See agentSubtask.ts
      // buildSystemPrompt() for the placement strategy.
      taskState.projectInstructions = projectInstructions.trim();
    }
    await useRunStore.getState().setTaskState(taskState);

    // Per-subtask runner. Three paths in priority order:
    //   1. workspace connected → agent tool loop (BYOK or server-Llama).
    //      Runs *every* subtask through the agent regardless of whether
    //      the planner declared `needs_tools` — the planner has no way
    //      to know what files exist locally, so we always enable tools
    //      and let the model decide whether to call them.
    //   2. BYOK key + no workspace → BYOK plain (callPlainPreset).
    //   3. Otherwise → managed proxy (executor's default, when undefined).
    const byok = byokSet(available);
    const hasBYOK = byok.size > 0;
    // Long-running pack runs blow past the 60s Clerk-token lifetime,
    // so each subtask call resolves a fresh access token via the
    // refresh flow before firing. `getValidAccessToken` rotates the
    // token in-place when within 60s of expiry.
    const getJwt = async (): Promise<string> => {
      const t = await useAuthStore.getState().getValidAccessToken();
      if (!t) throw new Error('Sign in to continue this run.');
      return t;
    };
    const runSubtask: SubtaskRunner | undefined =
      workspace
        ? async ({ subtask, prompt, decision, signal }) => {
            const toolPreset = pickToolCapableModel(
              decision.preset.tier,
              available,
              billingTier,
            );
            // Per-subtask skillset directive + dep-barrier tagging. Read
            // off the live TaskState so a resumed run picks up whatever
            // skillset.md was captured when the run originally started
            // (the snapshot persists across the 402 / Top up gap).
            const projectInstructions = taskState.projectInstructions;
            const subtaskId = subtask.id;
            // No-BYOK + managed mode + workspace: route through managed
            // proxy `/api/llm/chat/completions` so the agent loop runs on
            // Sonnet/GPT-5/Opus instead of free Llama 8B (which drops
            // tool calls and produces 0-byte writes). `urlOverride` flips
            // agentSubtask's OpenAI-compat path to the worker alias.
            const wantManagedAgent =
              managedModeEnabled &&
              !hasBYOK &&
              (!toolPreset || toolPreset.provider === 'server');
            if (wantManagedAgent) {
              const proxyPreset: ModelPreset = {
                provider: 'openrouter', // cosmetic; URL is overridden
                modelId: decision.managed.id,
                label: decision.managed.label,
                tier: decision.preset.tier,
                costPer1M: 0,
                supportsReasoning: decision.managed.supportsReasoning,
                reasoningEfforts: decision.managed.reasoningEfforts,
                alwaysReasons: decision.managed.alwaysReasons,
              };
              return runAgentSubtask({
                preset: proxyPreset,
                apiKey: await getJwt(),
                workspace,
                prompt,
                effort: decision.effort ?? null,
                signal,
                urlOverride: 'https://api.pmtpk.com/api/llm',
                projectInstructions,
                subtaskId,
                getJwt,
                cheapModelId: selections.cheap,
              });
            }
            if (toolPreset) {
              // Server provider auths with the user's Clerk JWT; BYOK
              // providers use their own keys. Ollama doesn't need a key.
              const apiKey =
                toolPreset.provider === 'ollama'
                  ? 'ollama'
                  : toolPreset.provider === 'server'
                    ? await getJwt()
                    : apiKeys[toolPreset.provider] ?? '';
              return runAgentSubtask({
                preset: toolPreset,
                apiKey,
                workspace,
                prompt,
                effort: decision.effort ?? null,
                signal,
                projectInstructions,
                subtaskId,
                getJwt,
                cheapModelId: selections.cheap,
              });
            }
            // No tool-capable preset survived (rare — server is always
            // available); fall through to managed proxy.
            const res = await tauriFetch(MANAGED_API_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${await getJwt()}`,
                // Orchestrator subtask — bypass /api/llm/chat concurrent cap.
                'X-From-Orchestrator': 'true',
              },
              body: JSON.stringify({
                model: decision.managed.id,
                messages: [{ role: 'user', content: prompt }],
                ...managedProxyReasoning(decision.managed.id, decision.effort ?? null),
              }),
              signal,
            });
            if (!res.ok) {
              const err = await safeParseErrorBody(res);
              console.error('[skillflow-subtask]', res.status, err);
              throw new Error(friendlyApiError(res.status, err, 'subtask'));
            }
            syncCreditsFromHeaders(res);
            const data = (await res.json()) as {
              choices?: Array<{ message?: { content?: string } }>;
              usage?: { completion_tokens_details?: { reasoning_tokens?: number } };
            };
            return {
              text: data.choices?.[0]?.message?.content ?? '',
              reasoningTokens: data.usage?.completion_tokens_details?.reasoning_tokens,
            };
          }
        : hasBYOK
          ? async ({ prompt, decision, signal }) => {
              // BYOK plain — no workspace, so no tool loop. Pick the
              // cheapest BYOK preset for the subtask's tier.
              const plainPreset = pickModel(decision.preset.tier, available);
              if (plainPreset && byok.has(plainPreset.provider)) {
                const text = await callPlainPreset(
                  plainPreset,
                  apiKeys,
                  [{ role: 'user', content: prompt }],
                  undefined,
                  decision.effort ?? null,
                );
                return { text };
              }
              // Fall through to managed.
              const res = await tauriFetch(MANAGED_API_URL, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${await getJwt()}`,
                  // Orchestrator subtask — bypass /api/llm/chat concurrent cap.
                  'X-From-Orchestrator': 'true',
                },
                body: JSON.stringify({
                  model: decision.managed.id,
                  messages: [{ role: 'user', content: prompt }],
                  ...managedProxyReasoning(decision.managed.id, decision.effort ?? null),
                }),
                signal,
              });
              if (!res.ok) {
                const err = await safeParseErrorBody(res);
                console.error('[skillflow-byok-fallback]', res.status, err);
                throw new Error(friendlyApiError(res.status, err, 'subtask'));
              }
              syncCreditsFromHeaders(res);
              const data = (await res.json()) as {
                choices?: Array<{ message?: { content?: string } }>;
                usage?: { completion_tokens_details?: { reasoning_tokens?: number } };
              };
              return {
                text: data.choices?.[0]?.message?.content ?? '',
                reasoningTokens: data.usage?.completion_tokens_details?.reasoning_tokens,
              };
            }
          : undefined;

    // Default planner = inbuilt server (free Llama 3.1 8B). Orchestrator
    // automatically falls back to the user's managed `cheap` selection
    // if the server is unreachable. Pass no skill so the planner uses
    // the server source. `workspace` is forwarded so the planner system
    // prompt knows file tools are usable at runtime.

    // Phase 5 — credit preflight. Telemetry-only. We used to hard-halt
    // on the worker's 402 here, but the envelope estimate (8 subtasks ×
    // cheap × 3) over-shot what cheap prompts actually cost — users with
    // a small but non-zero balance saw "out of credits" up front even
    // though the run would've succeeded. Per-call holds remain the real
    // gate; mid-run 402s still surface the Top up & resume UX via
    // `onError`. The preflight ping is kept so the worker can log
    // run-start volume without changing behaviour.
    if (!resumeTaskState) {
      const cheapModel = getManagedModel(selections.cheap);
      const planSize = predefinedPlan?.subtasks.length ?? 8;
      const perCallEstimate = cheapModel
        ? estimateCreditsForCall({
            model: cheapModel,
            inputTokens: 800,
            maxOutputTokens: 2048,
            effort: null,
          })
        : 5;
      const envelope = Math.max(10, planSize * perCallEstimate * 3);
      void (async () => {
        try {
          const jwtForPreflight = await getJwt();
          await tauriFetch('https://api.pmtpk.com/api/llm/run/reserve', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${jwtForPreflight}`,
            },
            body: JSON.stringify({ estimatedCredits: envelope }),
            signal: abort.signal,
          });
        } catch {
          // Non-blocking — never halt a run on preflight failure.
        }
      })();
    }

    const orch = new Orchestrator({
      getJwt,
      selections,
      signal: abort.signal,
      workspace,
      runSubtask,
      // Cap pack-run tier at `balanced` (Sonnet 4.6 / GPT-5 / Gemini 2.5
      // Pro). The LR classifier escalates curated analyst-style prompts
      // to `powerful` (GPT-5 Pro / Opus / o3-Pro) which on 5-round tool
      // loops costs ~$0.50–$1.00 per step — the pack author already
      // chose the prompts, the LR head has no business overriding to a
      // 10× more expensive tier on top of that.
      tierCap: predefinedPlan ? 'balanced' : undefined,
      predefinedPlan,
      predefinedPlanSource: predefinedPlan
        ? { sourceLabel: 'pack', modelId: predefinedPlanLabel ?? 'pack' }
        : undefined,
      // Use the user's cheap-tier managed pick as the planner — Llama 8B
      // serialises multi-step prompts into chains and kills the DAG
      // executor's parallelism. The cost is a few credits per run; the
      // payoff is real fan-out on prompts like "compare A, B, C, then
      // summarise". Skill-level `plannerModelId` overrides this when set.
      defaultPlannerModelId: selections.cheap,
    });
    await orch.run(text, taskState, {
      onPlan: async (plan, info) => {
        await useRunStore.getState().patchTaskState((s) => {
          s.plan = plan;
        });
        await useRunStore.getState().patchRun({ status: 'running' });
        const plannerLabel = predefinedPlan
          ? `Pack-defined plan (no planner LLM)`
          : info.source === 'server'
            ? 'Llama 3.1 8B (free)'
            : `${info.modelId} (managed fallback)`;
        useRunStore.getState().setPlannerInfo({
          source: info.source,
          modelId: info.modelId,
          label: plannerLabel,
        });
        // Plan + per-step routing live in the Run Trace panel, not the
        // chat bubble. Keeps the response surface clean — only the
        // final answer renders inline. User opens Trace if they want
        // to inspect the orchestration.
      },
      onSubtaskStart: async (s, decision) => {
        // Update runStore only — the Run Trace panel renders chips,
        // model chips, effort chips, and subtask outputs from there.
        // Chat bubble stays clean; final merged answer is the only
        // inline text the user sees.
        await useRunStore.getState().upsertSubtask({
          id: s.id,
          runId: runId!,
          parentId: null,
          ord: 0,
          title: s.title,
          instruction: s.instruction,
          complexityHint: s.complexity_hint,
          reasoningHint: s.reasoning_hint ?? null,
          needsTools: JSON.stringify(s.needs_tools),
          dependsOn: JSON.stringify(s.depends_on),
          status: 'running',
          presetJson: JSON.stringify(decision.preset),
          effort: decision.effort ?? null,
          output: null,
          confidence: null,
          credits: null,
          reasoningTokens: null,
          retries: 0,
          error: null,
          startedAt: Date.now(),
          endedAt: null,
        });
        // Mirror taskState mutation into runStore so the Memory Snapshot
        // panel sees subtask counts. Orchestrator mutates the same
        // TaskState ref but Zustand needs a fresh reference to re-emit.
        await useRunStore.getState().patchTaskState((st) => {
          st.subtasks[s.id] = {
            ...(taskState.subtasks[s.id] ?? { status: 'running', instruction: s.instruction }),
          };
        });
      },
      onSubtaskDone: async (s, out) => {
        await useRunStore.getState().patchSubtask(s.id, {
          status: 'done',
          output: out.text,
          reasoningTokens: out.reasoningTokens ?? null,
          credits: out.credits ?? null,
          confidence: out.confidence ?? null,
          retries: out.retries ?? 0,
          endedAt: Date.now(),
        });
        await useRunStore.getState().patchTaskState((st) => {
          st.subtasks[s.id] = { ...taskState.subtasks[s.id] };
          st.summaries = { ...taskState.summaries };
          st.facts = [...taskState.facts];
          st.artifacts = [...taskState.artifacts];
        });
      },
      onSubtaskRetry: async (s, next) => {
        // Phase 6 — escalation. Confidence heuristic flagged a low score,
        // bump (tier, effort) on the chip in real time so the user sees
        // the retry happen instead of staring at a stuck row.
        await useRunStore.getState().patchSubtask(s.id, {
          presetJson: JSON.stringify(next.decision.preset),
          effort: next.decision.effort ?? null,
          retries: next.retries,
          error: `retry ${next.retries}: ${next.reason}`,
        });
      },
      onSubtaskFailed: async (s, err) => {
        const existing = useRunStore
          .getState()
          .subtasks.find((x) => x.id === s.id);
        if (existing) {
          await useRunStore.getState().patchSubtask(s.id, {
            status: 'failed',
            error: err,
            endedAt: Date.now(),
          });
        } else {
          // Dependency-skip path: executor jumps straight to onSubtaskFailed
          // when a dep failed, never firing onSubtaskStart. Upsert the row
          // so the Run Trace shows step 3 of N as "failed: dependency
          // failed" instead of dropping it from the panel entirely.
          await useRunStore.getState().upsertSubtask({
            id: s.id,
            runId: runId!,
            parentId: null,
            ord: 0,
            title: s.title,
            instruction: s.instruction,
            complexityHint: s.complexity_hint,
            reasoningHint: s.reasoning_hint ?? null,
            needsTools: JSON.stringify(s.needs_tools),
            dependsOn: JSON.stringify(s.depends_on),
            status: 'failed',
            presetJson: null,
            effort: null,
            output: null,
            confidence: null,
            credits: null,
            reasoningTokens: null,
            retries: 0,
            error: err,
            startedAt: Date.now(),
            endedAt: Date.now(),
          });
        }
        await useRunStore.getState().patchTaskState((st) => {
          st.subtasks[s.id] = { ...taskState.subtasks[s.id] };
        });
      },
      onFinal: async (final, totalCredits) => {
        if (telemetryId) {
          void settleRoute({
            id: telemetryId,
            completed: 1,
            actualRoute: 'workflow',
          });
        }
        await useRunStore.getState().endRun('done');
        // Chat bubble shows ONLY the final synthesized answer. Plan,
        // per-subtask routing, model picks, and intermediate outputs
        // all live in the Run Trace panel — chat is the response
        // surface, Trace is the execution surface.
        blocks.length = 0;
        blocks.push({ kind: 'text', text: final });
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === assistantId
              ? { ...m, blocks: [...blocks], content: final }
              : m,
          ),
          isLoading: false,
        }));
        void totalCredits;
      },
      onError: async (err) => {
        if (telemetryId) {
          void settleRoute({
            id: telemetryId,
            completed: -1,
            actualRoute: 'workflow',
          });
        }
        await useRunStore.getState().endRun('failed', err.message);
        // Phase 5 — credit-exhausted runs get a sentinel error so the UI
        // can render a "Top up & resume" button instead of a raw toast.
        // Detection is loose: the message can come from the friendly
        // 402 string we emit in agentSubtask / chatStore subtask
        // runners, or from the worker's `insufficient_credits` body.
        const msg = err.message;
        const looksOutOfCredits =
          /\bout of credits\b/i.test(msg) ||
          /\binsufficient[_ ]credits\b/i.test(msg) ||
          /\b402\b/.test(msg);
        if (looksOutOfCredits) {
          // Drop the empty assistant placeholder so the chat doesn't
          // show a blank bubble next to the "Top up & resume" card.
          set((state) => ({
            messages: state.messages.filter((m) => m.id !== assistantId),
            error: '__OUT_OF_CREDITS__',
            isLoading: false,
          }));
          return;
        }
        // Real failure — fold the error into the assistant bubble so
        // it's not just a floating empty placeholder + a separate red
        // toast. Run Trace still owns per-subtask chips. Humanize the
        // raw message: "HTTP 502" / "HTTP 503" / "HTTP 504" → friendly
        // "Connection to the AI provider failed. Please try again."
        // The toolbar retry button (rendered when bubble.looksFailed)
        // is the user's one-click recovery path.
        const humanized = humanizeRunFailure(msg);
        blocks.length = 0;
        blocks.push({
          kind: 'text',
          text: `_(run failed: ${humanized.slice(0, 280)})_`,
        });
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === assistantId
              ? { ...m, blocks: [...blocks], content: humanized }
              : m,
          ),
          error: humanized,
          isLoading: false,
        }));
      },
    });

    // Cancel path: Orchestrator.run() returns silently when its abort
    // signal fires. Tidy up the chat — flip isLoading off, push a
    // small "(cancelled by user)" line, clear any stale toast. Subtask
    // chip cancellations live in runStore for the Run Trace panel.
    if (abort.signal.aborted) {
      blocks.push({ kind: 'text', text: '_(cancelled by user)_' });
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === assistantId ? { ...m, blocks: [...blocks] } : m,
        ),
        isLoading: false,
        error: null,
      }));
    }
  } catch (err) {
    // Outer catch: only surfaces if Orchestrator.run() rejected synchronously
    // (e.g. before the planner LLM call). On cancel we expect a silent return,
    // so guard against `signal.aborted` first.
    if (useRunStore.getState().abort?.signal.aborted) {
      set({ isLoading: false, error: null });
      return;
    }
    const msg = err instanceof Error ? err.message : String(err);
    if (runId) await useRunStore.getState().endRun('failed', msg);
    set({ error: msg, isLoading: false });
  } finally {
    // Restore the user's auto-accept preference + clear the Set-Run
    // active flag. Covers every exit path — success, mid-loop error,
    // outer reject, cancel, 402 credit exhaustion. On resume after 402,
    // runOrchestratorMessage is called afresh, so the enable + finally
    // fires cleanly again with no leak.
    autoAcceptRestore?.();
    if (predefinedPlan) {
      useAgentStore.getState().setSetRunActive(false);
    }
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
  pendingRouteLabel: null,
  messageQueue: [],

  setAgentMode: (on) => set({ agentMode: on }),

  enqueueMessage: (entry) => {
    set((state) => ({ messageQueue: [...state.messageQueue, entry] }));
  },
  removeQueuedMessage: (index) => {
    set((state) => ({
      messageQueue: state.messageQueue.filter((_, i) => i !== index),
    }));
  },
  clearQueue: () => set({ messageQueue: [] }),
  stopGeneration: () => {
    // Run-store holds the AbortController for any orchestrator pass.
    // Aborting it propagates into in-flight tauriFetch + agent loops.
    void useRunStore.getState().cancelRun();
    set({ isLoading: false });
  },

  sendMessage: async (text, packName, systemPrompt, attachments) => {
    const settings = useSettingsStore.getState();
    const { apiKeys, billingTier } = settings;
    const incrementServerChatCount = settings.incrementServerChatCount;
    const available = await getAvailableProvidersAsync(
      (apiKeys ?? {}) as Record<string, string | undefined>,
    );
    // Three-head LR classifier:
    //   - tier  → which managed model serves the prompt
    //   - effort → reasoning budget (null on fast tier)
    //   - route → dispatch decision: chat | agent | workflow
    const { tier: rawTier, effort: rawEffort } = classifyPrompt(text);
    // Compute write-file intent up-front so it can both:
    //   - bump tier to balanced (cheap models hallucinate file tools), AND
    //   - force the agent path later (workspace + intent = real tools).
    const writeFileIntent = detectWriteFileIntent(text);
    // Pack prompts AND write-file-intent prompts always ride mid+ tier —
    // cheap models hallucinate tool calls (write_file, read_file) too
    // often, breaking pack flows and producing fake file-edit results.
    // Force at least `balanced` and seed an effort floor of `low` so
    // reasoning models actually reason instead of one-shot guessing.
    const needsBalancedFloor = Boolean(packName) || writeFileIntent !== null;
    const tier = needsBalancedFloor && rawTier === 'fast' ? 'balanced' : rawTier;
    const effort: typeof rawEffort =
      needsBalancedFloor && tier !== 'fast' && !rawEffort ? 'low' : rawEffort;
    const lrRoute = predictRouteWithConfidence(text);
    let route: RouteClass = lrRoute.route;
    let fallbackUsed = false;
    let fallbackRoute: RouteClass | undefined;
    // Context-aware LLM tiebreaker. The on-device LR classifier is
    // bag-of-words — it can't see "do that for AAPL too" referring to
    // a previous TSLA fetch. We pass the last 4 conversation turns so
    // Llama can resolve those references and route accordingly.
    // FALLBACK_THRESHOLD raised to 0.75 so borderline `workflow`
    // predictions (most expensive on a misroute) get the second
    // opinion. Cached after first call per (history, prompt) pair.
    const authSessionEarly = useAuthStore.getState().session;
    if (
      lrRoute.confidence < FALLBACK_THRESHOLD &&
      authSessionEarly?.session_token
    ) {
      const recentHistory = get()
        .messages.slice(-4)
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content ?? '',
        }))
        .filter((h) => h.content.trim().length > 0);
      const fb = await llmRouteFallback(text, {
        jwt: authSessionEarly.session_token,
        history: recentHistory,
      });
      if (fb && fb !== lrRoute.route) {
        fallbackUsed = true;
        fallbackRoute = fb;
        route = fb;
      } else if (fb) {
        // LLM agreed with LR. Keep route, mark fallback for telemetry.
        fallbackUsed = true;
        fallbackRoute = fb;
      }
    }

    // Settle prior assistant turn (Phase 2 reprompt-within signal). If
    // the user types another message within 30 seconds of the last
    // assistant response, we treat that as a soft "wasn't quite right"
    // signal — useful retraining input.
    const prev = get()
      .messages
      .slice()
      .reverse()
      .find((m) => m.role === 'assistant' && m.telemetryId);
    if (prev?.telemetryId) {
      const sec = Math.floor((Date.now() - prev.createdAt) / 1000);
      if (sec >= 0 && sec < 600) {
        void settleRoute({ id: prev.telemetryId, repromptWithin: sec });
      }
    }

    // Log this turn's routing decision. Non-blocking on failure.
    const wordCount = text.trim().split(/\s+/).length;
    const telemetryId = await logRoute({
      prompt: text,
      wordCount,
      predictedRoute: lrRoute.route,
      confidence: lrRoute.confidence,
      fallbackUsed,
      fallbackRoute,
    });

    // Managed-mode (credit-metered OpenRouter) — preferred path for casuals.
    // Only active when toggle on AND user signed in (need JWT for proxy auth).
    // Falls through to existing agent/plain dispatch when off or unauthed.
    const authSession = useAuthStore.getState().session;

    // Orchestrator path: planner decomposes the goal, router picks a model
    // per subtask, executor runs them sequentially, merge produces the
    // final assistant message. Gated behind a feature flag so existing
    // flows stay default. Managed-mode only.
    //
    // Short-circuit on FOUR conditions:
    //   1. Fast-tier prompts ("hi", "what is X") — trivial lookups never
    //      need a planner.
    //   2. `looksMultiStep` returns false — the goal is a single self-
    //      contained task (no "then", no list, < 12 words, etc.).
    //   3. `packName` is set — the user is running a Skill pack whose
    //      prompts are already curated single-task steps. Letting the
    //      planner re-decompose them yields nonsense subtasks like
    //      "parse input text" that lose the workspace + tool context.
    //   4. Agent mode + workspace selected — workspace presence signals
    //      "I want tools". The orchestrator's per-subtask managed-proxy
    //      path doesn't expose tools, so workspace users get the agent
    //      loop even with SkillFlow toggled on.
    //
    // The combined gate means the orchestrator only runs for free-form
    // multi-step prompts when no workspace is connected and no pack is
    // driving the message.
    const workspace = useAgentStore.getState().workspace;
    // Dispatch decision now driven by the LR `route` head.
    //   - `agent`    → tool loop, but only if a workspace is connected
    //                  (otherwise model can't actually act → degrades to chat)
    //   - `workflow` → SkillFlow planner + subtasks + merge, gated on
    //                  toggle + managed mode + signed in + not a pack run
    //   - anything else → single-shot managed
    // Pack prompts always bypass orchestration — pack steps are user-
    // curated single-task units.
    // Skill Flow is the master switch for agent capabilities.
    //   Skill Flow ON  + workspace → agent path (single-agent vs
    //                                multi-agent decided automatically
    //                                by the LR route head + orchestrator).
    //   Skill Flow OFF              → single-shot, no tools. The SkillChat
    //                                handleSend gate intercepts prompts
    //                                that clearly need tools and shows the
    //                                "Enable Skill Flow?" popup before
    //                                reaching this code.
    // agentMode is no longer a user-facing toggle; it follows Skill Flow.
    const wantsAgent =
      Boolean(workspace) && settings.orchestratorEnabled;
    // Cost-aware confidence floor for orchestrator routing.
    //
    // The LR route head outputs a soft probability across {chat, agent,
    // workflow}. A barely-confident `workflow` prediction (say 0.45)
    // shouldn't pay the ~20cr orchestrator overhead — single-shot
    // Sonnet/Haiku handles those cases at ~5cr. We only auto-route to
    // SkillFlow when the head is *clearly* signalling fan-out work
    // (≥ 0.7 confidence, after the LLM tiebreaker if it ran).
    //
    // Tradeoff calibrated against actual session traces — a 218cr run
    // burnt on a Compare-React-Vue-Svelte prompt that single-shot
    // Sonnet would've answered for ~5cr. The LR head said `workflow`
    // at ~0.6 confidence; this floor would have kept it single-shot.
    const WORKFLOW_CONFIDENCE_FLOOR = 0.7;
    const workflowConfident =
      route === 'workflow' &&
      // After LLM tiebreaker, lrRoute.confidence is the original LR
      // probability — not the fallback's. Treat the fallback agreement
      // as a confidence boost (2nd opinion confirmed), but still
      // require ≥ floor so disagreements don't auto-route to expensive.
      (lrRoute.confidence >= WORKFLOW_CONFIDENCE_FLOOR ||
        (fallbackUsed && fallbackRoute === 'workflow'));
    const shouldOrchestrate =
      workflowConfident &&
      settings.orchestratorEnabled &&
      settings.managedModeEnabled &&
      authSession?.session_token &&
      !packName &&
      !wantsAgent;
    if (shouldOrchestrate) {
      const ws = useAgentStore.getState().workspace;
      set({
        pendingRouteLabel: `Routing → Skill Flow workflow · planner + subtasks`,
      });
      await runOrchestratorMessage({
        text,
        packName,
        attachments,
        jwt: authSession.session_token,
        selections: settings.selectedManagedModels,
        apiKeys: (apiKeys ?? {}) as Record<string, string | undefined>,
        available,
        workspace: ws,
        managedModeEnabled: settings.managedModeEnabled,
        billingTier,
        telemetryId,
        set,
      });
      return;
    }

    // Workspace + agent-intent prompt preempts the managed-mode branch —
    // those prompts want tools and the managed proxy doesn't pipe them.
    // Plain greetings / chitchat with a workspace connected stay on the
    // managed path (no tool-fishing). `wantsAgent` already encodes both
    // conditions.
    if (
      settings.managedModeEnabled &&
      authSession?.session_token &&
      !wantsAgent
    ) {
      const picked = pickFromSelections(tier, settings.selectedManagedModels);
      const modelId = picked.id;
      // Validate against allowlist (worker rejects unknown anyway; fail fast)
      if (!getManagedModel(modelId)) {
        set({ error: `Unknown managed model: ${modelId}` });
        return;
      }
      // If we got here with SkillFlow on, the route head said this
      // message was `chat`/`agent`, OR it said `workflow` but with
      // low confidence — both cases auto-bypass the orchestrator's
      // ~20cr overhead and run single-shot. Surface the bypass so
      // users see why no Run Trace activity fired.
      const orchestratorSkipped =
        settings.orchestratorEnabled &&
        (route !== 'workflow' || !workflowConfident);
      const userMsg: ChatMessage = {
        id: makeId(),
        role: 'user',
        content: text,
        packName,
        attachments: attachments && attachments.length > 0 ? [...attachments] : undefined,
        createdAt: Date.now(),
      };
      const managedModel = getManagedModel(modelId);
      const routeLabelStr = orchestratorSkipped
        ? `Routing → single-shot (auto-bypassed Skill Flow) · ${managedModel?.label ?? modelId}`
        : `Routing → single-shot · ${managedModel?.label ?? modelId}`;
      set((state) => ({
        messages: [...state.messages, userMsg],
        isLoading: true,
        error: null,
        pendingRouteLabel: routeLabelStr,
      }));
      const fullHistory = get()
        .messages.map((m) => ({ role: m.role, content: m.content }));
      const history = fullHistory.slice(-HISTORY_MAX_MESSAGES);
      try {
        const content = await callManagedProxy(
          authSession.session_token,
          modelId,
          history,
          systemPrompt,
          effort,
        );
        set((state) => ({
          messages: [
            ...state.messages,
            {
              id: makeId(),
              role: 'assistant',
              content,
              modelId,
              tier,
              effort,
              orchestratorSkipped,
              telemetryId: telemetryId ?? undefined,
              createdAt: Date.now(),
            },
          ],
          isLoading: false,
        }));
        if (telemetryId) {
          void settleRoute({
            id: telemetryId,
            completed: 1,
            actualRoute: 'chat',
          });
        }
      } catch (err) {
        if (telemetryId) {
          void settleRoute({
            id: telemetryId,
            completed: -1,
            actualRoute: 'chat',
          });
        }
        if (err instanceof SessionExpiredError) {
          set({ error: '__SESSION_EXPIRED__', isLoading: false });
        } else if (err instanceof InsufficientCreditsError) {
          set({ error: '__INSUFFICIENT_CREDITS__', isLoading: false });
        } else if (err instanceof SkillFlowLockedError) {
          set({ error: err.message, isLoading: false });
        } else if (err instanceof FrontierLockedError) {
          set({ error: err.message, isLoading: false });
        } else if (err instanceof DailyLimitError) {
          set({ error: err.message, isLoading: false });
        } else {
          set({
            error: err instanceof Error ? err.message : "Couldn't send this message. Please try again.",
            isLoading: false,
          });
          useNotificationStore.getState().report(err, {
            source: 'chatStore.sendMessage.managedProxy',
            onRetry: () => get().sendMessage(text, packName, systemPrompt, attachments),
          });
        }
      }
      return;
    }

    // (agentMode + workspace already pulled at the top of sendMessage)

    // Agent path: use tool-capable provider, ignore packs/system overrides.
    // Entry condition is `wantsAgent` (computed earlier from agent-toggle
    // OR write-intent + workspace) so prompts like "write hello.pdf in
    // workspace" engage tools even without the user flipping the agent
    // toggle on first.
    let agentPresetReady: ModelPreset | null = null;
    let useManagedProxyAgent = false;
    if (wantsAgent && workspace) {
      let preset = pickToolCapableModel(tier, available, billingTier);
      if (preset?.provider === 'ollama') {
        const loaded = await fetchOllamaModels();
        const reconciled = reconcileOllamaPreset(preset, loaded);
        preset = reconciled; // null if Ollama unusable — fall through to plain
      }
      // Every workspace-attached turn now reaches this block (wantsAgent =
      // Boolean(workspace)) so we always need a tool-capable model. Llama
      // 8B drops tool calls, emits `<formation=...>` wrappers, and writes
      // 0-byte files when forced via tool_choice — never trustworthy here.
      // Redirect to the managed proxy whenever the picked preset would be
      // the inbuilt server. `packName` and `writeFileIntent` are kept on
      // the audit list for clarity/telemetry; the practical value is
      // always `true` while inside this branch.
      const llamaCantBeTrustedHere =
        true ||
        packName !== undefined ||
        writeFileIntent !== null;
      // The user-selected provider keys actually plugged in. Used to
      // tailor error messages so we don't suggest "add a provider key"
      // to a managed-only user (which sounds like we're claiming they
      // already have one), and so we don't suggest "turn on managed
      // mode" when they already have it on.
      const userHasOwnKeys = byokSet(available).size > 0;
      // Redirect to the managed proxy when:
      //   - the picked preset is the free server (Llama 8B, can't tool-call), OR
      //   - no preset survived at all (powerful-tier ban with no own keys).
      // ...AND managed mode is on + signed in. This keeps managed-only
      // users on a working tool path for write-intent / pack prompts
      // even when their selected tier bans the inbuilt server.
      const managedRedirectAvailable =
        settings.managedModeEnabled && authSession?.session_token;
      const needsRedirect =
        llamaCantBeTrustedHere &&
        (preset?.provider === 'server' || preset === null);

      if (needsRedirect && managedRedirectAvailable) {
        // Use the LR-classified tier as-is. Managed cheap-tier
        // (Haiku 4.5 / Gemini 2.5 Flash / GPT-5 Mini) all handle
        // OpenAI-compat tool-calls reliably; only the inbuilt Llama
        // 8B can't be trusted with tools, and that's already
        // excluded by the `preset.provider === 'server'` redirect
        // condition. Forcing balanced for every tool call would burn
        // 4-5× the credits for no quality gain on simple writes.
        const managedModel = pickFromSelections(tier, settings.selectedManagedModels);
        preset = {
          provider: 'openrouter', // cosmetic; runtime URL is the managed proxy
          modelId: managedModel.id,
          label: managedModel.label,
          tier,
          costPer1M: 0,
          supportsReasoning: managedModel.supportsReasoning,
          reasoningEfforts: managedModel.reasoningEfforts,
          alwaysReasons: managedModel.alwaysReasons,
        };
        useManagedProxyAgent = true;
      } else if (needsRedirect) {
        // Managed mode off (or unauth) + no own provider keys → no
        // premium model available. Halting beats letting Llama produce
        // hallucinated tool calls (e.g. fake `pandoc` shell output).
        // Tailor the message to the user's actual state so we don't
        // suggest something they already have.
        const wantedThing = packName
          ? 'Pack steps need a stronger model than the inbuilt one.'
          : 'Writing files needs a stronger model than the inbuilt one (it hallucinates tool calls).';
        const fix = userHasOwnKeys
          ? 'Sign in (Managed mode requires a session) or use one of your provider keys.'
          : 'Turn on Managed mode in Settings.';
        set({ error: `${wantedThing} ${fix}` });
        return;
      }
      // If a powerful-tier prompt resolved to nothing tool-capable AND
      // managed redirect didn't catch it (managed off + no own key),
      // surface a clear hint.
      if (!preset && SERVER_BANNED_TIERS.has(tier)) {
        set({
          error: managedRedirectAvailable
            ? 'No tool-capable model available for this tier. Pick a model under Settings → AI Credits.'
            : userHasOwnKeys
              ? "Powerful-tier prompts need a provider that supports tools. Add an Anthropic / OpenAI / Google key under Settings → Advanced."
              : 'Powerful-tier prompts need Managed mode on. Turn it on in Settings.',
        });
        return;
      }
      // Pre-flight daily cap when picker chose the inbuilt server
      if (preset?.provider === 'server') {
        const used = settings.getServerDailyCount();
        const cap = SERVER_DAILY_CAPS[billingTier];
        if (used >= cap) {
          set({
            error: `Daily limit reached (${used}/${cap}). Resets at midnight, or add a BYOK key for unlimited use.`,
          });
          return;
        }
      }
      agentPresetReady = preset;
      // Null preset → no tool-capable provider works right now. Silent
      // fall-through to plain-chat below; the assistant's model tag tells
      // the user what was used. Tools simply aren't invoked this turn.
    }
    if (workspace && agentPresetReady) {
      const preset = agentPresetReady;
      const userMsg: ChatMessage = {
        id: makeId(),
        role: 'user',
        content: text,
        attachments: attachments && attachments.length > 0 ? [...attachments] : undefined,
        createdAt: Date.now(),
      };
      set((state) => ({
        messages: [...state.messages, userMsg],
        isLoading: true,
        error: null,
      }));

      // Truncate history to the most recent N turns so server costs stay
      // bounded on long sessions. User context further back is dropped.
      const fullHistory = get().messages.slice(0, -1); // exclude just-added user msg
      const history = fullHistory.slice(-HISTORY_MAX_MESSAGES);
      const pushAssistant = (msg: ChatMessage) =>
        set((state) => ({ messages: [...state.messages, msg] }));
      const patchAssistant = (id: string, blocks: MessageBlock[]) =>
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === id ? { ...m, blocks: [...blocks] } : m,
          ),
        }));

      // Server provider: count each LLM round (initial + each tool round)
      // against the daily cap. Throws to abort the loop when exceeded.
      const onBeforeRound = preset.provider === 'server'
        ? () => {
            const cap = SERVER_DAILY_CAPS[billingTier];
            const post = useSettingsStore.getState().incrementServerDailyCount();
            if (post > cap) {
              throw new Error(
                `Daily limit reached (${post - 1}/${cap}). Resets at midnight, or add a BYOK key.`,
              );
            }
          }
        : undefined;

      // Multi-round agent loops on `powerful` tier with `high` effort
      // burn credits fast — each round reserves 25× × 6× = 150 credits.
      // Cap to medium (still reasons; ~50% cheaper) for the loop only;
      // single-shot paths keep the original effort.
      const loopEffort = capEffortForAgentLoop(preset, effort);
      try {
        if (preset.provider === 'anthropic') {
          await runAnthropicAgent(
            (apiKeys ?? {}).anthropic!,
            preset,
            workspace,
            history,
            text,
            pushAssistant,
            patchAssistant,
            onBeforeRound,
            loopEffort,
          );
        } else {
          // Managed-proxy agent path: pack runs without BYOK route here.
          // Posts to `/api/llm/chat/completions` (worker alias added so
          // OpenAI-compat clients can target the managed proxy directly).
          // Worker forwards `tools` + `tool_choice` to OpenRouter,
          // letting Sonnet/GPT-5/Opus run agent loops on managed credit.
          const baseUrl = useManagedProxyAgent
            ? 'https://api.pmtpk.com/api/llm'
            : preset.provider === 'server'
              ? SERVER_OPENAI_COMPAT_BASE
              : PROVIDER_BASE_URLS[preset.provider];
          const keyMap = (apiKeys ?? {}) as Record<string, string | undefined>;
          // Resolve via the refresh-aware accessor so multi-round agent
          // loops don't 401 when the access token rolls past 1h. Returns
          // null when refresh fails — surface the same "sign in" message.
          const serverJwt =
            (preset.provider === 'server' || useManagedProxyAgent)
              ? (await useAuthStore.getState().getValidAccessToken()) ?? ''
              : '';
          if (
            (preset.provider === 'server' || useManagedProxyAgent) &&
            !serverJwt
          ) {
            throw new Error('Sign in to use the managed Skillset agent.');
          }
          const apiKey = useManagedProxyAgent
            ? serverJwt
            : preset.provider === 'ollama'
              ? 'ollama'
              : preset.provider === 'server'
                ? serverJwt
                : keyMap[preset.provider] ?? '';
          const extra: Record<string, string> = {};
          if (preset.provider === 'openrouter' && !useManagedProxyAgent) {
            extra['http-referer'] = 'https://skillset.so';
            extra['x-title'] = 'Skillset';
          }
          await runOpenAIAgent(
            baseUrl,
            apiKey,
            preset,
            workspace,
            history,
            text,
            extra,
            pushAssistant,
            patchAssistant,
            onBeforeRound,
            loopEffort,
          );
        }
        // Record preset + telemetryId on the last assistant message
        set((state) => {
          const msgs = [...state.messages];
          for (let i = msgs.length - 1; i >= 0; i--) {
            if (msgs[i].role === 'assistant' && !msgs[i].preset) {
              msgs[i] = {
                ...msgs[i],
                preset,
                telemetryId: telemetryId ?? msgs[i].telemetryId,
              };
              break;
            }
          }
          return { messages: msgs, isLoading: false };
        });
        if (telemetryId) {
          void settleRoute({
            id: telemetryId,
            completed: 1,
            actualRoute: 'agent',
          });
        }
      } catch (err) {
        // Suppress trailing API errors when the assistant already emitted
        // text. Multi-round agent loops can hit a malformed tool-call
        // mid-stream ("Failed to call a function" / `failed_generation`)
        // *after* useful text was generated. Surfacing the toast next
        // to a working response is just noise.
        const last = get()
          .messages
          .slice()
          .reverse()
          .find((m) => m.role === 'assistant');
        const hasContent =
          (last?.content ?? '').trim().length > 0 ||
          (last?.blocks ?? []).some(
            (b) => b.kind === 'text' && b.text.trim().length > 0,
          );
        if (telemetryId) {
          void settleRoute({
            id: telemetryId,
            completed: hasContent ? 1 : -1,
            actualRoute: 'agent',
          });
        }
        if (hasContent) {
          set({ isLoading: false });
          return;
        }
        // Map worker auth errors to the friendly session-expired pill so
        // the chat surface renders the "Sign in again" CTA instead of a
        // raw red toast with the worker's `error` string.
        const rawMsg = err instanceof Error ? err.message : String(err);
        if (
          /invalid or expired session/i.test(rawMsg) ||
          /\b401\b/.test(rawMsg) ||
          /\bunauthorized\b/i.test(rawMsg)
        ) {
          set({ error: '__SESSION_EXPIRED__', isLoading: false });
          return;
        }
        set({
          error: rawMsg || 'Something went wrong',
          isLoading: false,
        });
        useNotificationStore.getState().report(err, {
          source: 'chatStore.sendMessage.agent',
          onRetry: () => get().sendMessage(text, packName, systemPrompt, attachments),
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
    // Server tier-based daily cap (free=3, pro=200, studio=400)
    if (preset.provider === 'server') {
      const used = settings.getServerDailyCount();
      const cap = SERVER_DAILY_CAPS[billingTier];
      if (used >= cap) {
        set({
          error:
            billingTier === 'free'
              ? '__CHAT_LIMIT_REACHED__'
              : `Daily limit reached (${used}/${cap}). Resets at midnight, or add a BYOK key.`,
        });
        return;
      }
    }
    const userMsg: ChatMessage = {
      id: makeId(),
      role: 'user',
      content: text,
      packName,
      attachments: attachments && attachments.length > 0 ? [...attachments] : undefined,
      createdAt: Date.now(),
    };
    set((state) => ({ messages: [...state.messages, userMsg], isLoading: true, error: null }));
    const fullHistory = get().messages.map((m) => ({ role: m.role, content: m.content }));
    const history = fullHistory.slice(-HISTORY_MAX_MESSAGES);
    try {
      const content = await callPlainPreset(
        preset,
        (apiKeys ?? {}) as Record<string, string | undefined>,
        history,
        systemPrompt,
        effort,
      );
      if (preset.provider === 'server') {
        incrementServerChatCount();
        useSettingsStore.getState().incrementServerDailyCount();
      }
      set((state) => ({
        messages: [
          ...state.messages,
          {
            id: makeId(),
            role: 'assistant',
            content,
            preset,
            telemetryId: telemetryId ?? undefined,
            createdAt: Date.now(),
          },
        ],
        isLoading: false,
      }));
      if (telemetryId) {
        void settleRoute({
          id: telemetryId,
          completed: 1,
          actualRoute: 'chat',
        });
      }
    } catch (err) {
      if (telemetryId) {
        void settleRoute({
          id: telemetryId,
          completed: -1,
          actualRoute: 'chat',
        });
      }
      const rawMsg = err instanceof Error ? err.message : String(err);
      if (
        /invalid or expired session/i.test(rawMsg) ||
        /\b401\b/.test(rawMsg) ||
        /\bunauthorized\b/i.test(rawMsg)
      ) {
        set({ error: '__SESSION_EXPIRED__', isLoading: false });
        return;
      }
      set({ error: rawMsg || 'Something went wrong', isLoading: false });
      useNotificationStore.getState().report(err, {
        source: 'chatStore.sendMessage.plain',
        onRetry: () => get().sendMessage(text, packName, systemPrompt, attachments),
      });
    }
  },

  clearMessages: () => set({ messages: [], error: null }),
  clearError: () => set({ error: null }),

  /**
   * Persist a thumbs-up / thumbs-down vote on an assistant message and
   * settle the matching telemetry row. Idempotent — clicking the same
   * thumb twice toggles it off; clicking the other thumb replaces.
   */
  resumeOrchestratorRun: async () => {
    // Phase 5 — pull the existing taskState + plan from runStore and
    // re-run the orchestrator with `predefinedPlan`. The executor's
    // done-skip short-circuit means subtasks that already succeeded
    // don't repeat; only pending/failed ones run.
    const runState = useRunStore.getState();
    const ts = runState.taskState;
    const run = runState.run;
    if (!ts?.plan || !run) {
      set({
        error:
          'Nothing to resume — the previous run was cleared from memory.',
      });
      return;
    }
    const settings = useSettingsStore.getState();
    const authSession = useAuthStore.getState().session;
    if (!authSession?.session_token) {
      set({ error: '__SESSION_EXPIRED__' });
      return;
    }
    const { apiKeys, billingTier } = settings;
    const available = await getAvailableProvidersAsync(
      (apiKeys ?? {}) as Record<string, string | undefined>,
    );
    const workspace = useAgentStore.getState().workspace;
    set({ error: null });
    // Reset done counts on the runStore-side row so the UI flips
    // pending subtasks back into the queue. Done rows stay green.
    await runState.patchRun({ status: 'running', endedAt: null });
    await runOrchestratorMessage({
      text: ts.goal,
      jwt: authSession.session_token,
      selections: settings.selectedManagedModels,
      apiKeys: (apiKeys ?? {}) as Record<string, string | undefined>,
      available,
      workspace,
      managedModeEnabled: settings.managedModeEnabled,
      billingTier,
      telemetryId: null,
      predefinedPlan: ts.plan,
      predefinedPlanLabel: 'resume',
      // Carry the existing TaskState forward so the executor's
      // done-skip path sees prior outputs.
      resumeTaskState: ts,
      set,
    });
  },

  runPack: async (packTitle, steps, attachments, extraInstructions) => {
    if (steps.length === 0) return;
    const settings = useSettingsStore.getState();
    const { apiKeys, billingTier } = settings;
    const authSession = useAuthStore.getState().session;
    if (!authSession?.session_token) {
      set({
        error:
          'Sign in to run packs. Pack runs use the orchestrator with shared memory across steps; that needs your Skillset session.',
      });
      return;
    }
    if (!settings.managedModeEnabled) {
      set({
        error:
          'Turn on Managed mode in Settings to run packs. Pack steps share memory and route to managed models per step.',
      });
      return;
    }

    const available = await getAvailableProvidersAsync(
      (apiKeys ?? {}) as Record<string, string | undefined>,
    );
    const workspace = useAgentStore.getState().workspace;

    // Optional skillset.md — project rules the user drops into the
    // workspace root that every subtask in the pack must follow. The
    // RAW contents go onto TaskState.projectInstructions so the agent
    // loop can inject them into the system prompt under "# Project
    // Skill (MUST FOLLOW)" — directive weight that cheap-tier models
    // actually obey. Per-run `extraInstructions` (typed by the user in
    // the chat input alongside the pack tag) remain in rolling-summary
    // framing under "## User instructions" / "# CONTEXT SO FAR"; they
    // are advisory adjustments rather than rules.
    let projectInstructions: string | undefined;
    if (workspace) {
      for (const candidate of ['skillset.md', '.skillset.md']) {
        try {
          const result = await invoke<{ content: string }>('agent_read', {
            workspace,
            path: candidate,
          });
          if (result?.content?.trim()) {
            projectInstructions = result.content.trim();
            break;
          }
        } catch {
          // File missing or unreadable — try next candidate.
        }
      }
    }
    const extraContext = extraInstructions?.trim()
      ? `## User instructions\n\n### From this run's chat input\n\n${extraInstructions.trim()}`
      : undefined;

    // Classify execution mode — cheap Llama 8B pre-call decides whether
    // to collapse the pack into a single LLM call (cheapest), keep the
    // existing per-step chain (default; required for file artifacts), or
    // fan out to DAG (independent research → parallel). Falls back to
    // 'chain' on Groq cap / network failure.
    const execDecision = await classifyExecutionMode({
      packTitle,
      prompts: steps,
      getJwt: async () => authSession.session_token,
    });

    // Synthetic plan shape depends on the execution decision.
    const ALLOWED_TOOLS = [
      'read_file',
      'write_file',
      'edit_file',
      'list_dir',
      'glob',
      'grep',
      'bash',
      'lsp_diagnostics',
    ];

    let subtasks: import('../lib/orchestrator/types').PlannerSubtask[];
    if (execDecision.mode === 'single') {
      // Single-call mode: collapse all prompts into ONE subtask. The
      // model receives every step as numbered sections in one prompt and
      // produces a combined response. Skips chain orchestration entirely
      // — ~3× cheaper for pure-text packs that don't build file artifacts.
      const combined = steps
        .map((s, i) => {
          const header = s.header?.trim() || `Step ${i + 1}`;
          return `## ${header}\n\n${s.text}`;
        })
        .join('\n\n');
      subtasks = [
        {
          id: 't1',
          title: packTitle,
          instruction:
            `Complete EVERY step below in a single comprehensive response. ` +
            `Each step may build on prior steps' reasoning. Produce all ` +
            `requested outputs as one combined answer.\n\n${combined}`,
          complexity_hint: 'moderate',
          reasoning_hint: 'none',
          needs_tools: ALLOWED_TOOLS,
          depends_on: [],
          produces: 'text',
        },
      ];
    } else if (execDecision.mode === 'dag') {
      // DAG mode: prompts in `serialIndices` depend on ALL earlier ones
      // (synthesis / aggregation steps); others are parallel roots.
      const serial = new Set(execDecision.serialIndices);
      subtasks = steps.map((step, i) => ({
        id: `t${i + 1}`,
        title: step.header?.trim() || `Step ${i + 1}`,
        instruction: step.text,
        complexity_hint: 'moderate',
        reasoning_hint: 'none',
        needs_tools: ALLOWED_TOOLS,
        depends_on: serial.has(i)
          ? steps.slice(0, i).map((_, j) => `t${j + 1}`)
          : [],
        produces: 'text',
      }));
    } else {
      // chain (default) — every step depends on the previous one.
      subtasks = steps.map((step, i) => ({
        id: `t${i + 1}`,
        title: step.header?.trim() || `Step ${i + 1}`,
        instruction: step.text,
        complexity_hint: 'moderate',
        reasoning_hint: 'none',
        needs_tools: ALLOWED_TOOLS,
        depends_on: i === 0 ? [] : [`t${i}`],
        produces: 'text',
      }));
    }
    const predefinedPlan: import('../lib/orchestrator/types').PlannerOutput = {
      goal: packTitle,
      subtasks,
      merge: 'first',
    };

    // Publish the execution decision to runStore so the Run Trace panel
    // can show the mode + reason. Done before runOrchestratorMessage so
    // the chip appears as soon as the run starts.
    useRunStore.getState().setExecutionDecision(execDecision);

    // Telemetry — log the pack as one workflow event so retraining
    // sees pack runs as `workflow` ground truth.
    const telemetryId = await logRoute({
      prompt: `[pack:${packTitle}] ${steps.map((s) => s.header ?? s.text.slice(0, 40)).join(' → ')}`,
      wordCount: steps.reduce(
        (n, s) => n + s.text.trim().split(/\s+/).length,
        0,
      ),
      predictedRoute: 'workflow',
      confidence: 1,
      actualRoute: 'workflow',
    });

    await runOrchestratorMessage({
      // The synthetic "user message" surfaced in chat is the pack title
      // — keeps the bubble compact. Step prompts live inside the
      // subtask chips below.
      text: packTitle,
      packName: packTitle,
      attachments,
      jwt: authSession.session_token,
      selections: settings.selectedManagedModels,
      apiKeys: (apiKeys ?? {}) as Record<string, string | undefined>,
      available,
      workspace,
      managedModeEnabled: settings.managedModeEnabled,
      billingTier,
      telemetryId,
      predefinedPlan,
      predefinedPlanLabel: packTitle,
      extraContext,
      projectInstructions,
      set,
    });
  },

  voteOnMessage: (messageId: string, signal: 'thumbs_up' | 'thumbs_down') => {
    const cur = get().messages.find((m) => m.id === messageId);
    if (!cur || cur.role !== 'assistant') return;
    const next = cur.userSignal === signal ? undefined : signal;
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, userSignal: next } : m,
      ),
    }));
    if (cur.telemetryId && next) {
      void settleRoute({ id: cur.telemetryId, userSignal: next });
    }
  },

  retryFromAssistant: async (assistantId) => {
    const messages = get().messages;
    const idx = messages.findIndex((m) => m.id === assistantId);
    if (idx < 0) return;
    // Walk back to the user message that drove this assistant turn.
    let userIdx = idx - 1;
    while (userIdx >= 0 && messages[userIdx].role !== 'user') userIdx--;
    if (userIdx < 0) return;
    const userMsg = messages[userIdx];
    // Drop the failed assistant + clear any error sentinel so the UI
    // doesn't show stale state while the retry runs.
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== assistantId),
      error: null,
    }));
    await get().sendMessage(
      userMsg.content,
      userMsg.packName,
      undefined,
      userMsg.attachments,
    );
  },
}));
