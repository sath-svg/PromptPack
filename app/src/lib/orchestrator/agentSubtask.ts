/**
 * Agent-style tool loop for an orchestrator subtask.
 *
 * Mirrors `runAnthropicAgent` / `runOpenAIAgent` in `chatStore.ts` but:
 *   - Builds context from the planner-supplied subtask prompt instead
 *     of the chat history.
 *   - Returns the final accumulated text + token usage instead of
 *     pushing UI blocks.
 *   - Keeps `dispatchTool` as the single source of truth for tool
 *     side-effects (file edits stage through `useAgentStore`).
 *
 * Used by `chatStore.runOrchestratorMessage` when the user has BYOK
 * keys + a workspace AND a subtask declared `needs_tools`. SkillFlow
 * thus inherits the same coding-agent loop the chat surface already
 * uses, applied per subtask.
 */

import { tauriFetch } from '../tauriFetch';
import { applyReasoning, capEffortForAgentLoop } from '../reasoningParams';
import { AGENT_TOOLS, AGENT_SYSTEM_PROMPT, dispatchTool, detectWriteFileIntent } from '../agentTools';
import type { ModelPreset } from '../classifier';
import type { EffortLevel } from '../classifier';
import type { SubtaskRunResult } from './executor';

const MAX_TOOL_ROUNDS = 8;

interface AgentSubtaskInput {
  preset: ModelPreset;
  apiKey: string;
  workspace: string;
  prompt: string;
  effort?: EffortLevel | null;
  signal?: AbortSignal;
}

export async function runAgentSubtask(input: AgentSubtaskInput): Promise<SubtaskRunResult> {
  // Frontier × high-effort × N-round tool loop = catastrophic credit
  // burn. Cap to medium for the loop; planner/router still saw the
  // original signal and may have routed away from frontier already.
  const capped: AgentSubtaskInput = {
    ...input,
    effort: capEffortForAgentLoop(input.preset, input.effort ?? null),
  };
  if (capped.preset.provider === 'anthropic') {
    return runAnthropicSubtask(capped);
  }
  return runOpenAICompatSubtask(capped);
}

// ─── Anthropic native tool loop ────────────────────────────────────────────

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

async function runAnthropicSubtask(input: AgentSubtaskInput): Promise<SubtaskRunResult> {
  const messages: AnthropicMessage[] = [
    { role: 'user', content: input.prompt },
  ];
  let textOut = '';
  let reasoningTokens: number | undefined;
  const forceWritePath = detectWriteFileIntent(input.prompt);

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    if (input.signal?.aborted) {
      throw new DOMException('aborted', 'AbortError');
    }
    const baseBody: Record<string, unknown> = {
      model: input.preset.modelId,
      max_tokens: 4096,
      system: AGENT_SYSTEM_PROMPT,
      tools: AGENT_TOOLS.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.input_schema,
      })),
      messages,
    };
    if (round === 0 && forceWritePath) {
      baseBody.tool_choice = { type: 'tool', name: 'write_file' };
    }
    const body = applyReasoning(input.preset, input.effort ?? null, baseBody);
    const res = await tauriFetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': input.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: input.signal,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      // Mid-loop errors after we already accumulated text → return what
      // we've got. Common cause: malformed tool-call args from the
      // model; the partial answer is still useful.
      if (textOut.trim().length > 0) {
        return { text: textOut, reasoningTokens };
      }
      throw new Error(`Anthropic agent error ${res.status}: ${JSON.stringify(err)}`);
    }
    const data = (await res.json()) as {
      content?: AnthropicContentBlock[];
      stop_reason?: string;
      usage?: { cache_read_input_tokens?: number; output_tokens?: number };
    };
    const content = data.content ?? [];
    const apiContent: AnthropicContentBlock[] = [];
    for (const block of content) {
      if (block.type === 'text' && block.text) {
        textOut += (textOut ? '\n' : '') + block.text;
        apiContent.push({ type: 'text', text: block.text });
      } else if (block.type === 'tool_use' && block.id && block.name) {
        apiContent.push({
          type: 'tool_use',
          id: block.id,
          name: block.name,
          input: block.input ?? {},
        });
      }
    }
    if (data.usage?.output_tokens) {
      reasoningTokens = (reasoningTokens ?? 0) + data.usage.output_tokens;
    }
    if (data.stop_reason !== 'tool_use' || apiContent.every((c) => c.type !== 'tool_use')) {
      break;
    }
    messages.push({ role: 'assistant', content: apiContent });
    const toolResults: Array<{
      type: 'tool_result';
      tool_use_id: string;
      content: string;
      is_error?: boolean;
    }> = [];
    for (const block of apiContent) {
      if (block.type !== 'tool_use' || !block.id || !block.name) continue;
      try {
        const r = await dispatchTool(
          { workspace: input.workspace },
          block.name,
          block.input ?? {},
        );
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: r.output,
        });
      } catch (e) {
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: e instanceof Error ? e.message : String(e),
          is_error: true,
        });
      }
    }
    messages.push({ role: 'user', content: toolResults });
  }
  return { text: textOut, reasoningTokens };
}

// ─── OpenAI-compat tool loop (OpenAI / Gemini-compat / Grok / OpenRouter / Groq) ─

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
}

async function runOpenAICompatSubtask(input: AgentSubtaskInput): Promise<SubtaskRunResult> {
  const baseUrl = providerBaseUrl(input.preset.provider);
  const apiMessages: OpenAIMessage[] = [
    { role: 'system', content: AGENT_SYSTEM_PROMPT },
    { role: 'user', content: input.prompt },
  ];
  const extraHeaders: Record<string, string> = {};
  if (input.preset.provider === 'openrouter') {
    extraHeaders['http-referer'] = 'https://skillset.so';
    extraHeaders['x-title'] = 'Skillset';
  }
  let textOut = '';
  let reasoningTokens: number | undefined;
  const forceWritePath = detectWriteFileIntent(input.prompt);

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    if (input.signal?.aborted) {
      throw new DOMException('aborted', 'AbortError');
    }
    const baseBody: Record<string, unknown> = {
      model: input.preset.modelId,
      max_tokens: 4096,
      messages: apiMessages,
      tools: AGENT_TOOLS.map((t) => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.input_schema,
        },
      })),
    };
    if (round === 0 && forceWritePath) {
      baseBody.tool_choice = { type: 'function', function: { name: 'write_file' } };
    }
    const body = applyReasoning(input.preset, input.effort ?? null, baseBody);
    const res = await tauriFetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${input.apiKey}`,
        'content-type': 'application/json',
        ...extraHeaders,
      },
      body: JSON.stringify(body),
      signal: input.signal,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      // Mid-loop errors after we already accumulated text → return what
      // we've got. Common cause: malformed tool-call args from the
      // model; the partial answer is still useful.
      if (textOut.trim().length > 0) {
        return { text: textOut, reasoningTokens };
      }
      throw new Error(`Agent subtask error ${res.status}: ${JSON.stringify(err)}`);
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: OpenAIMessage }>;
      usage?: {
        completion_tokens_details?: { reasoning_tokens?: number };
      };
    };
    const reply = data.choices?.[0]?.message ?? { role: 'assistant', content: '' };
    if (reply.content) {
      textOut += (textOut ? '\n' : '') + reply.content;
    }
    if (data.usage?.completion_tokens_details?.reasoning_tokens) {
      reasoningTokens =
        (reasoningTokens ?? 0) + data.usage.completion_tokens_details.reasoning_tokens;
    }
    if (!reply.tool_calls?.length) break;

    apiMessages.push({
      role: 'assistant',
      // Empty string instead of null — see chatStore.ts comment about
      // OpenRouter's Anthropic adapter iterating `msg.content`.
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
        const r = await dispatchTool(
          { workspace: input.workspace },
          tc.function.name,
          parsed,
        );
        apiMessages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: r.output,
        });
      } catch (e) {
        apiMessages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: `ERROR: ${e instanceof Error ? e.message : String(e)}`,
        });
      }
    }
  }
  return { text: textOut, reasoningTokens };
}

function providerBaseUrl(provider: ModelPreset['provider']): string {
  switch (provider) {
    case 'openai': return 'https://api.openai.com/v1';
    case 'gemini': return 'https://generativelanguage.googleapis.com/v1beta/openai';
    case 'grok': return 'https://api.x.ai/v1';
    case 'deepseek': return 'https://api.deepseek.com/v1';
    case 'groq': return 'https://api.groq.com/openai/v1';
    case 'kimi': return 'https://api.moonshot.cn/v1';
    case 'openrouter': return 'https://openrouter.ai/api/v1';
    case 'ollama': return 'http://localhost:11434/v1';
    case 'perplexity': return 'https://api.perplexity.ai';
    case 'server': return 'https://api.pmtpk.com/v1';
    case 'anthropic': return 'https://api.anthropic.com'; // unused — Anthropic path forks earlier
  }
}
