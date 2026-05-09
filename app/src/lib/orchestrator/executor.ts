/**
 * Sequential subtask executor. Phase 4 ships:
 *   - Topological walk of `depends_on` edges (planner already validates
 *     forward-only, so a stable insertion order suffices).
 *   - Managed-mode call per subtask via `callManagedProxy`-equivalent.
 *   - No tools (Phase 6 wires that in).
 *   - No confidence/escalation (Phase 6).
 *
 * Each subtask emits start/end events through the supplied callbacks so
 * the orchestrator can update `runStore` and `taskMemory` between calls.
 */

import { tauriFetch } from '../tauriFetch';
import { managedProxyReasoning } from '../reasoningParams';
import { syncCreditsFromHeaders } from '../creditSync';
import { buildSubtaskPrompt, recordSubtaskDone, recordSubtaskFailed, recordSubtaskStart } from './memory';
import { decide, type RouterDecision } from './router';
import { evaluateConfidence } from './confidence';
import type { PlannerOutput, PlannerSubtask, TaskState } from './types';
import type { ManagedTier } from '../managed-models';

const MANAGED_API_URL = 'https://api.pmtpk.com/api/llm/chat';

export interface SubtaskRunInput {
  subtask: PlannerSubtask;
  prompt: string;
  decision: RouterDecision;
  signal?: AbortSignal;
}

export interface SubtaskRunResult {
  text: string;
  reasoningTokens?: number;
  credits?: number;
}

/**
 * Per-subtask execution closure. Lets the caller substitute the default
 * managed-proxy path with a BYOK-aware path that runs tool-capable
 * subtasks through the same Anthropic / OpenAI agent loop the chat
 * surface uses for plain `agentMode` messages. The orchestrator itself
 * stays decoupled from chat-specific call helpers.
 */
export type SubtaskRunner = (input: SubtaskRunInput) => Promise<SubtaskRunResult>;

export interface ExecutorDeps {
  jwt: string;
  selections: Record<ManagedTier, string>;
  signal?: AbortSignal;
  /**
   * Override the per-subtask call. When omitted, executor falls back to
   * the managed proxy. chatStore's `runOrchestratorMessage` injects a
   * BYOK-aware runner that routes tool-needing subtasks through the
   * agent loop.
   */
  runSubtask?: SubtaskRunner;
  /** Called when a subtask starts so the run store can flip its status. */
  onSubtaskStart?: (subtaskId: string, decision: RouterDecision) => void | Promise<void>;
  /** Called on success with output + token usage. */
  onSubtaskDone?: (
    subtaskId: string,
    out: {
      text: string;
      reasoningTokens?: number;
      credits?: number;
      modelId: string;
      confidence?: number;
      retries?: number;
    },
  ) => void | Promise<void>;
  /**
   * Deprecated since the v1.3 halt-on-error switch — confidence-driven
   * retries no longer happen, so this never fires. Kept on the type so
   * existing chatStore wiring compiles; safe to drop in a later cleanup.
   */
  onSubtaskRetry?: (
    subtaskId: string,
    next: { decision: RouterDecision; reason: string; retries: number },
  ) => void | Promise<void>;
  onSubtaskFailed?: (subtaskId: string, err: string) => void | Promise<void>;
  /**
   * Halt-on-error hook. The first subtask to throw calls this with its
   * error message; the orchestrator wires it to its `AbortController`
   * so every other in-flight subtask gets a chance to bail. Pending
   * subtasks see their dep as failed and skip.
   */
  runAbort?: (reason: string) => void;
}

/**
 * DAG-parallel subtask execution. Each subtask is wrapped in a promise
 * that awaits its declared dependencies before running. Independent
 * subtasks fire concurrently. Linear plans (pack runs with chained
 * `depends_on: ['t<i-1>']`) naturally sequence themselves because each
 * promise blocks on the previous.
 *
 * Failure mode: when a subtask throws, dependents detect the failed
 * status on their dep and mark themselves "skipped: dependency failed"
 * without trying to run. The wrapping `Promise.all` rejects on any
 * subtask error; the orchestrator's outer catch surfaces it once.
 */
export async function execute(
  plan: PlannerOutput,
  state: TaskState,
  deps: ExecutorDeps,
): Promise<void> {
  const promises = new Map<string, Promise<void>>();

  for (const subtask of plan.subtasks) {
    promises.set(
      subtask.id,
      (async () => {
        // Wait for declared dependencies. We swallow errors here —
        // failure is detected via state.subtasks[d].status below so we
        // can mark this subtask as "skipped" instead of cascading the
        // raw exception.
        for (const depId of subtask.depends_on) {
          const depPromise = promises.get(depId);
          if (depPromise) {
            await depPromise.catch(() => {
              /* swallow — handled via state lookup below */
            });
          }
        }

        if (deps.signal?.aborted) {
          throw new DOMException('aborted', 'AbortError');
        }

        // Phase 5 — resume support. If the prior run already completed
        // this subtask (e.g. user hit 402, topped up, clicked Resume),
        // short-circuit. The previous output stays in TaskState and
        // downstream subtasks will see it under DEPENDENCY OUTPUTS.
        const existingState = state.subtasks[subtask.id];
        if (existingState?.status === 'done' && existingState.output) {
          await deps.onSubtaskDone?.(subtask.id, {
            text: existingState.output,
            modelId: existingState.modelId ?? '',
            reasoningTokens: existingState.reasoningTokens,
            credits: existingState.credits,
            confidence: existingState.confidence,
            retries: 0,
          });
          return;
        }

        // Skip if any dep ended up `failed`.
        if (
          subtask.depends_on.some(
            (d) => state.subtasks[d]?.status === 'failed',
          )
        ) {
          recordSubtaskFailed(state, subtask.id, 'skipped: dependency failed');
          await deps.onSubtaskFailed?.(subtask.id, 'dependency failed');
          throw new Error(`skipped: dependency failed`);
        }

        let decision = decide(subtask, { selections: deps.selections });
        recordSubtaskStart(state, subtask.id, subtask);
        await deps.onSubtaskStart?.(subtask.id, decision);

        try {
          // Single-shot. The Phase 6 confidence-driven retry loop
          // burned credits on auto-escalation (cheap → mid → frontier)
          // even when the user wanted a hard halt — a Tesla / Rivian /
          // Lucid run torched 1,000 credits on GPT-5 Pro retries that
          // the user never asked for. Confidence is now informational
          // only: the score is recorded for the Run Trace chip but no
          // retry is taken. If the user wants another attempt, they
          // re-run the prompt themselves.
          const result = await runOne(subtask, state, decision, deps);
          const conf = evaluateConfidence({ subtask, text: result.text });

          recordSubtaskDone(state, subtask.id, {
            output: result.text,
            modelId: decision.managed.id,
            effort: decision.effort ?? null,
            reasoningTokens: result.reasoningTokens,
            credits: result.credits,
          });
          await deps.onSubtaskDone?.(subtask.id, {
            text: result.text,
            reasoningTokens: result.reasoningTokens,
            credits: result.credits,
            modelId: decision.managed.id,
            confidence: conf.score,
            retries: 0,
          });
        } catch (err) {
          // Silent on cancel — runStore already marked the subtask as
          // failed via runCancel(); surfacing another error here just
          // spams the UI with stale 502s from in-flight fetches.
          if (deps.signal?.aborted) {
            throw new DOMException('aborted', 'AbortError');
          }
          const msg = err instanceof Error ? err.message : String(err);
          recordSubtaskFailed(state, subtask.id, msg);
          await deps.onSubtaskFailed?.(subtask.id, msg);
          // **Halt-on-error.** Abort the whole orchestrator the moment
          // any subtask fails. Sibling subtasks already in flight
          // notice the abort signal and bail; pending ones never
          // start. Prevents the cascade where one failure costs N×
          // dependency-failed retries + a planner-driven Frontier
          // escalation + a 1,000-credit burn before the user can
          // hit Stop.
          deps.runAbort?.(msg);
          throw err;
        }
      })(),
    );
  }

  // allSettled gives every subtask a chance to run even if a sibling
  // fails. Two-pass result triage so the user sees the *originating*
  // failure (e.g. "Out of credits") instead of a downstream AbortError
  // from the halt-on-error broadcast.
  const results = await Promise.allSettled(promises.values());
  let firstAbort: unknown = null;
  for (const r of results) {
    if (r.status !== 'rejected') continue;
    const err = r.reason;
    if (err instanceof DOMException && err.name === 'AbortError') {
      firstAbort = firstAbort ?? err;
      continue;
    }
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.startsWith('skipped:')) continue;
    // Real subtask failure — surface immediately. Halt-on-error path
    // also lands here (the failing subtask throws its own message
    // before triggering the abort that cascades).
    throw err;
  }
  if (firstAbort) throw firstAbort;
}

async function runOne(
  subtask: PlannerSubtask,
  state: TaskState,
  decision: RouterDecision,
  deps: ExecutorDeps,
): Promise<SubtaskRunResult> {
  const prompt = buildSubtaskPrompt(subtask, state);

  // BYOK-aware caller takes precedence — lets tool-needing subtasks run
  // through the agent loop when the user has BYOK + a workspace.
  if (deps.runSubtask) {
    return deps.runSubtask({ subtask, prompt, decision, signal: deps.signal });
  }

  // Default: managed proxy, plain (no tools).
  const messages = [{ role: 'user', content: prompt }];
  const res = await tauriFetch(MANAGED_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${deps.jwt}`,
    },
    body: JSON.stringify({
      model: decision.managed.id,
      messages,
      ...managedProxyReasoning(decision.managed.id, decision.effort ?? null),
    }),
    signal: deps.signal,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 401) {
      throw new Error(
        'session expired — sign in again to continue the workflow',
      );
    }
    if (res.status === 402) {
      throw new Error('insufficient credits — top up to continue');
    }
    throw new Error(`Subtask LLM error ${res.status}: ${JSON.stringify(err)}`);
  }
  syncCreditsFromHeaders(res);
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: {
      total_tokens?: number;
      completion_tokens_details?: { reasoning_tokens?: number };
    };
  };
  const text = data.choices?.[0]?.message?.content ?? '';
  return {
    text,
    reasoningTokens: data.usage?.completion_tokens_details?.reasoning_tokens,
  };
}
