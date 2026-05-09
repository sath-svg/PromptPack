/**
 * Top-level orchestrator. Wires planner → executor → merge and forwards
 * lifecycle events to a callback set so the UI can update `runStore` +
 * surface progress in the Run Trace panel.
 *
 * Phase 3+4 scope: managed-mode only, sequential execution, no tools, no
 * confidence/escalation. Tool subtasks are flagged in the planner output
 * but the executor currently ignores them — they'll start working once
 * Phase 6 lands.
 */

import { execute, type SubtaskRunner } from './executor';
import { merge } from './merge';
import { plan as runPlanner, PlannerError, type PlannerSource } from './planner';
import { decide, type RouterDecision } from './router';
import type { ManagedTier } from '../managed-models';
import type {
  PlannerOutput,
  PlannerSubtask,
  Skill,
  TaskState,
} from './types';

export interface OrchestratorEvents {
  /**
   * Fires once after the planner returns, before any subtask runs.
   * `source` + `modelId` reveal which path actually produced the plan
   * (server Llama, managed Haiku, etc) — useful for the Run Trace chip.
   */
  onPlan(plan: PlannerOutput, info: { source: PlannerSource; modelId: string }): void | Promise<void>;
  /** Fires when a subtask transitions out of `pending`. */
  onSubtaskStart(subtask: PlannerSubtask, decision: RouterDecision): void | Promise<void>;
  /** Fires when a subtask completes successfully. */
  onSubtaskDone(
    subtask: PlannerSubtask,
    out: {
      text: string;
      reasoningTokens?: number;
      credits?: number;
      modelId: string;
      confidence?: number;
      retries?: number;
    },
  ): void | Promise<void>;
  /**
   * Fires when the confidence heuristic escalates a subtask along the
   * effort or tier axis. Lets the Run Trace flip the chip + model label
   * to the new pick so users can see the retry happen in real time.
   */
  onSubtaskRetry?(
    subtask: PlannerSubtask,
    next: { decision: RouterDecision; reason: string; retries: number },
  ): void | Promise<void>;
  onSubtaskFailed(subtask: PlannerSubtask, err: string): void | Promise<void>;
  /** Fires after merge with the final assistant message. */
  onFinal(text: string, totalCredits: number): void | Promise<void>;
  onError(err: Error): void | Promise<void>;
}

export interface OrchestratorDeps {
  /**
   * Thunk that returns a non-expired managed-mode access token. Each
   * lifecycle phase (planner / per-subtask / merge) calls this anew so
   * a long pack run can refresh past Clerk's session-token expiry
   * without 401-ing mid-flow. Should reject (or return empty) when the
   * user's refresh token is revoked — the orchestrator surfaces that
   * via `onError`.
   */
  getJwt: () => Promise<string>;
  selections: Record<ManagedTier, string>;
  skill?: Skill | null;
  signal: AbortSignal;
  /**
   * Workspace path. Forwarded into the planner's system prompt so
   * subtasks correctly declare `needs_tools` instead of asking the user
   * to paste file content. Also signals "tools available at runtime"
   * to the executor.
   */
  workspace?: string | null;
  /**
   * Optional BYOK-aware per-subtask runner. When provided, executor
   * routes each subtask through this closure instead of the default
   * managed-proxy path. chatStore wires this so SkillFlow can use the
   * agent tool loop on tool-needing subtasks when the user has BYOK
   * keys + a workspace.
   */
  runSubtask?: SubtaskRunner;
  /**
   * When set, the orchestrator skips its planner LLM call and runs
   * this user-authored plan directly. Used by pack runs — the pack
   * prompts ARE the plan, so re-decomposing them via the planner is
   * wasteful and lossy. Each pack prompt becomes a subtask. Shared
   * TaskState (rolling summary, facts, dependency outputs) carries
   * across steps automatically.
   */
  predefinedPlan?: PlannerOutput;
  /**
   * Source label shown in telemetry / Run Trace when `predefinedPlan`
   * is used. Defaults to `'pack'`. The model id field becomes the
   * pack title or skill id for traceability.
   */
  predefinedPlanSource?: { sourceLabel: string; modelId: string };
  /**
   * Default planner override. When set and `skill.plannerModelId` is
   * absent, the orchestrator routes the planner call through this
   * managed model instead of the free Llama 3.1 8B server endpoint.
   * chatStore wires this to the user's selected `cheap`-tier model so
   * the planner reliably emits independent-subtask DAGs (Llama 8B
   * tends to over-serialize), at the cost of a few cheap credits per
   * run.
   */
  defaultPlannerModelId?: string;
}

export class Orchestrator {
  private deps: OrchestratorDeps;
  constructor(deps: OrchestratorDeps) {
    this.deps = deps;
  }

  async run(
    goal: string,
    state: TaskState,
    ev: OrchestratorEvents,
  ): Promise<void> {
    try {
      // Pack runs supply a predefined plan — pack prompts ARE the
      // subtask list. Skip the planner LLM entirely; it would only
      // re-decompose an already-decomposed task and lose domain
      // context the user encoded into the pack steps.
      let plan: PlannerOutput;
      let planSource: PlannerSource = 'server';
      let planModelId = '';
      if (this.deps.predefinedPlan) {
        plan = this.deps.predefinedPlan;
        planSource = 'server'; // synthetic; nothing was actually called
        planModelId = this.deps.predefinedPlanSource?.modelId ?? 'pack';
      } else {
        const plannerJwt = await this.deps.getJwt();
        // Resolution order:
        //   1. `skill.plannerModelId` — explicit per-skill override
        //   2. `defaultPlannerModelId` — chatStore's cheap-tier pick
        //   3. server Llama 3.1 8B (free) — no override available
        // Llama 8B tends to over-serialize multi-step prompts (every
        // subtask becomes `depends_on: [tN-1]`), which collapses the
        // DAG executor's parallelism. Routing the planner through the
        // user's cheap-tier managed pick fixes that for a few credits.
        const plannerModelId =
          this.deps.skill?.plannerModelId ?? this.deps.defaultPlannerModelId;
        const plannerResult = await runPlanner(goal, {
          jwt: plannerJwt,
          source: plannerModelId ? 'managed' : 'server',
          modelId: plannerModelId,
          hints: this.deps.skill?.plannerHints
            ? safeJSON(this.deps.skill.plannerHints)
            : undefined,
          workspace: this.deps.workspace ?? null,
          signal: this.deps.signal,
        });
        plan = plannerResult.output;
        planSource = plannerResult.source;
        planModelId = plannerResult.modelId;
      }
      state.plan = plan;
      await ev.onPlan(plan, {
        source: planSource,
        modelId: planModelId,
      });

      // Index subtasks by id so the start callback can resolve back to the
      // PlannerSubtask shape (executor only knows the id internally).
      const byId = new Map<string, PlannerSubtask>();
      for (const s of plan.subtasks) byId.set(s.id, s);

      // Snapshot the access token for the executor's default managed
      // proxy fallback. The chatStore-supplied `runSubtask` closure
      // resolves its own fresh token per subtask via authStore, so it
      // ignores this snapshot. Only the no-runSubtask fallback uses it.
      const executorJwt = await this.deps.getJwt();

      // Internal controller — wired to `deps.signal` so user-cancel
      // still propagates, but we also abort it ourselves the moment
      // any subtask fails. That halts every still-running sibling +
      // skips every pending dependent, which is the contract Phase 6
      // (post-revert) promised the user: no auto-retry, hard halt.
      const haltController = new AbortController();
      const onParentAbort = () => haltController.abort();
      this.deps.signal.addEventListener('abort', onParentAbort, { once: true });
      try {
        await execute(plan, state, {
          jwt: executorJwt,
          selections: this.deps.selections,
          signal: haltController.signal,
          runSubtask: this.deps.runSubtask,
          runAbort: (_reason) => haltController.abort(),
          onSubtaskStart: async (id, decision) => {
            const s = byId.get(id);
            if (s) await ev.onSubtaskStart(s, decision);
          },
          onSubtaskDone: async (id, out) => {
            const s = byId.get(id);
            if (s) await ev.onSubtaskDone(s, out);
          },
          onSubtaskRetry: async (id, next) => {
            const s = byId.get(id);
            if (s) await ev.onSubtaskRetry?.(s, next);
          },
          onSubtaskFailed: async (id, err) => {
            const s = byId.get(id);
            if (s) await ev.onSubtaskFailed(s, err);
          },
        });
      } finally {
        this.deps.signal.removeEventListener('abort', onParentAbort);
      }

      // Merge runs after every subtask finishes — could be 1h+ after
      // the run started. Resolve a fresh token here too.
      const mergeJwt = await this.deps.getJwt();
      const final = await merge(plan, state, {
        jwt: mergeJwt,
        signal: this.deps.signal,
      });
      // Total credits is summed by the worker via response headers; until
      // Phase 5 wires per-run reserves, surface 0 here and let the
      // existing X-Credits-Monthly/Topup headers reconcile balance.
      await ev.onFinal(final, 0);
    } catch (err) {
      // User-initiated cancel — every downstream error after the abort
      // should be silent. Includes `AbortError`, raw fetch failures
      // (worker returns 502 on aborted upstream), and provider-side
      // errors that race with the cancel. The runStore already flagged
      // the run as `cancelled`, so no error event needed.
      if (this.deps.signal.aborted) return;
      if (err instanceof DOMException && err.name === 'AbortError') return;
      const wrapped =
        err instanceof PlannerError
          ? new Error(`Planner ${err.stage}: ${err.message}`)
          : err instanceof Error
            ? err
            : new Error(String(err));
      await ev.onError(wrapped);
    }
  }
}

// `decide` is exported so the UI can render a router decision preview
// without running the full pipeline (Phase 7 preview tooltip).
export { decide };

function safeJSON<T>(s: string): T | undefined {
  try {
    return JSON.parse(s) as T;
  } catch {
    return undefined;
  }
}
