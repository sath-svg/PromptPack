/**
 * Canonical TaskState helpers. Builds the per-subtask prompt context from
 * the rolling summary + filtered facts + dependency outputs. Replaces the
 * naive "stuff the entire chat history" approach in `chatStore`.
 */

import type {
  Fact,
  PlannerSubtask,
  SubtaskState,
  TaskState,
} from './types';

const ROLLING_SUMMARY_TOKEN_BUDGET = 800;

/**
 * Compose the executor-facing prompt for a single subtask.
 *
 * Sections (each separated by a blank line, all optional except instruction):
 *   1. GOAL — repeated verbatim so the model never forgets the top-level objective.
 *   2. ROLLING SUMMARY — appended only after enough subtasks have completed
 *      that a summary exists.
 *   3. RELEVANT FACTS — `state.facts` filtered to those whose source
 *      subtask is in `subtask.depends_on`.
 *   4. DEPENDENCY OUTPUTS — full text of each declared dependency's output.
 *   5. INSTRUCTION — the planner-emitted instruction itself.
 */
export function buildSubtaskPrompt(
  subtask: PlannerSubtask,
  state: TaskState,
): string {
  const parts: string[] = [];
  parts.push(`# GOAL\n${state.goal}`);

  if (state.summaries.rolling.trim()) {
    parts.push(`# CONTEXT SO FAR\n${state.summaries.rolling}`);
  }

  if (subtask.depends_on.length > 0) {
    const facts = relevantFacts(state.facts, subtask.depends_on);
    if (facts.length > 0) {
      parts.push(
        `# RELEVANT FACTS\n${facts.map((f, i) => `${i + 1}. ${f.text}`).join('\n')}`,
      );
    }

    const depBlocks: string[] = [];
    for (const depId of subtask.depends_on) {
      const dep = state.subtasks[depId];
      if (dep?.output) {
        depBlocks.push(`## ${depId}\n${dep.output}`);
      }
    }
    if (depBlocks.length > 0) {
      parts.push(`# DEPENDENCY OUTPUTS\n${depBlocks.join('\n\n')}`);
    }
  }

  parts.push(`# YOUR TASK\n${subtask.instruction}`);
  return parts.join('\n\n');
}

function relevantFacts(facts: Fact[], depIds: string[]): Fact[] {
  if (facts.length === 0) return [];
  const set = new Set(depIds);
  return facts.filter((f) => set.has(f.sourceSubtaskId));
}

// ─── Rolling summary builder ───────────────────────────────────────────────

/**
 * Decide whether the rolling summary needs a refresh. Phase 4 ships a
 * cheap heuristic: rebuild every 3rd completed subtask, or whenever the
 * concatenated per-subtask summaries would exceed 2× the token budget.
 */
export function needsSummaryRefresh(state: TaskState): boolean {
  const completed = Object.values(state.subtasks).filter(
    (s) => s.status === 'done',
  ).length;
  if (completed === 0) return false;
  if (completed % 3 === 0 && !state.summaries.rolling) return true;
  if (completed % 3 === 0) return true;
  // Token-budget guard: if the per-subtask summaries collectively exceed
  // the rolling cap, we have to recompress.
  const total = Object.values(state.summaries.perSubtask).reduce(
    (n, s) => n + estimateTokens(s),
    0,
  );
  return total > ROLLING_SUMMARY_TOKEN_BUDGET * 2;
}

/** ~4 chars per token, matching the worker's heuristic in api/src/llm.ts. */
export function estimateTokens(s: string): number {
  return Math.ceil(s.length / 4);
}

/**
 * Rolling-summary input — concatenation of per-subtask summaries with a
 * hard token cap. The orchestrator passes this to a `fast`-tier
 * summarizer model and stores the result back into
 * `state.summaries.rolling`.
 */
export function buildSummaryInput(state: TaskState): string {
  const items: string[] = [];
  for (const [id, s] of Object.entries(state.subtasks)) {
    if (s.status !== 'done') continue;
    const summary = state.summaries.perSubtask[id] ?? truncate(s.output ?? '', 600);
    if (summary.trim()) items.push(`[${id}] ${summary}`);
  }
  return items.join('\n');
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max) + ` …[truncated ${s.length - max} chars]`;
}

// ─── State mutation helpers ────────────────────────────────────────────────

export function recordSubtaskStart(
  state: TaskState,
  id: string,
  s: PlannerSubtask,
): void {
  state.subtasks[id] = {
    status: 'running',
    instruction: s.instruction,
  };
}

export function recordSubtaskDone(
  state: TaskState,
  id: string,
  patch: Partial<SubtaskState>,
): void {
  const cur = state.subtasks[id] ?? {
    status: 'pending' as const,
    instruction: '',
  };
  state.subtasks[id] = { ...cur, ...patch, status: 'done' };
  // Cheap auto-summary: first 600 chars of the output. Replaced later by
  // the rolling-summary refresh job.
  if (patch.output) {
    state.summaries.perSubtask[id] = truncate(patch.output, 600);
  }
}

export function recordSubtaskFailed(state: TaskState, id: string, error: string): void {
  const cur = state.subtasks[id];
  state.subtasks[id] = {
    ...(cur ?? { status: 'failed' as const, instruction: '' }),
    status: 'failed',
    output: error,
  };
}
