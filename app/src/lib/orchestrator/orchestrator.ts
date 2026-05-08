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
    out: { text: string; reasoningTokens?: number; credits?: number; modelId: string },
  ): void | Promise<void>;
  onSubtaskFailed(subtask: PlannerSubtask, err: string): void | Promise<void>;
  /** Fires after merge with the final assistant message. */
  onFinal(text: string, totalCredits: number): void | Promise<void>;
  onError(err: Error): void | Promise<void>;
}

export interface OrchestratorDeps {
  jwt: string;
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
      const plannerResult = await runPlanner(goal, {
        jwt: this.deps.jwt,
        // `'server'` (free Llama 3.1 8B via Skillset Groq proxy) is the
        // default — keeps the planner cost zero. `skill.plannerModelId`
        // forces a managed-mode override when the user explicitly picked
        // a smarter planner per-skill.
        source: this.deps.skill?.plannerModelId ? 'managed' : 'server',
        modelId: this.deps.skill?.plannerModelId ?? undefined,
        hints: this.deps.skill?.plannerHints
          ? safeJSON(this.deps.skill.plannerHints)
          : undefined,
        workspace: this.deps.workspace ?? null,
        signal: this.deps.signal,
      });
      const plan = plannerResult.output;
      state.plan = plan;
      await ev.onPlan(plan, {
        source: plannerResult.source,
        modelId: plannerResult.modelId,
      });

      // Index subtasks by id so the start callback can resolve back to the
      // PlannerSubtask shape (executor only knows the id internally).
      const byId = new Map<string, PlannerSubtask>();
      for (const s of plan.subtasks) byId.set(s.id, s);

      await execute(plan, state, {
        jwt: this.deps.jwt,
        selections: this.deps.selections,
        signal: this.deps.signal,
        runSubtask: this.deps.runSubtask,
        onSubtaskStart: async (id, decision) => {
          const s = byId.get(id);
          if (s) await ev.onSubtaskStart(s, decision);
        },
        onSubtaskDone: async (id, out) => {
          const s = byId.get(id);
          if (s) await ev.onSubtaskDone(s, out);
        },
        onSubtaskFailed: async (id, err) => {
          const s = byId.get(id);
          if (s) await ev.onSubtaskFailed(s, err);
        },
      });

      const final = await merge(plan, state, {
        jwt: this.deps.jwt,
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
