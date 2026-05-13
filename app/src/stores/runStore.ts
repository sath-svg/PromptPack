/**
 * Live in-memory mirror of the active orchestrator run. Sister store to
 * `chatStore.ts`. The Run Trace UI subscribes here. Persistence flushes
 * happen via `persist.ts` Tauri commands; this store is the synchronous
 * source of truth while a run is in flight.
 */

import { create } from 'zustand';
import {
  runCancel as runCancelCmd,
  runUpdate as runUpdateCmd,
  subtaskUpsert as subtaskUpsertCmd,
  taskMemorySet as taskMemorySetCmd,
} from '../lib/orchestrator/persist';
import {
  emptyTaskState,
  type Run,
  type Subtask,
  type SubtaskStatus,
  type TaskState,
} from '../lib/orchestrator/types';
import type { ToolIntent } from '../lib/orchestrator/toolIntent';
import type { ExecutionDecision } from '../lib/orchestrator/executionMode';

/**
 * Live audit-log entry for a tool call inside a Skill Flow subtask.
 * Populated from `dispatchTool` on every model-emitted tool call so the
 * Run Trace panel can show the user EXACTLY what the model invoked —
 * "yes the model called write_file with path X, here was the result" —
 * instead of leaving them to guess from the subtask's text output.
 *
 * Kept in-memory (not on `Subtask`) so the SQLite schema doesn't grow.
 */
export interface SubtaskToolCall {
  name: string;
  /** First useful argument (path / pattern / query) for quick scanning. */
  arg?: string;
  /** false when the tool returned an `error:` prefixed payload or threw. */
  ok: boolean;
  /** First ~120 chars of tool output (or error). Lets the user spot empty / error rounds. */
  preview?: string;
  ts: number;
}

interface RunState {
  // ─── Live run ─────────────────────────────────────────────────────────
  run: Run | null;
  subtasks: Subtask[];
  taskState: TaskState | null;
  /**
   * Per-subtask tool call audit log. Keyed by subtask id; entries pushed
   * in dispatch order. Cleared on `startRun`. Source of truth for the
   * "what did the model actually do" view in the Run Trace panel.
   */
  subtaskToolCalls: Record<string, SubtaskToolCall[]>;
  /**
   * Per-subtask tool-intent resolution. Populated by `runAgentSubtask`
   * after the Llama 8B pre-call returns. Keyed by subtask id. Lets the
   * Run Trace panel show the contract (tool subset, must-write paths,
   * must-read paths) the loop is enforcing. Cleared on `startRun`.
   */
  subtaskIntents: Record<string, ToolIntent>;
  /**
   * Execution mode chosen for this Set Run (set by chatStore.runPack
   * before the orchestrator kicks off). Lets the Run Trace panel show
   * "Mode: single / chain / dag" + a one-line reason. Null for non-
   * pack runs (free-form Skill Flow).
   */
  executionDecision: ExecutionDecision | null;
  /**
   * In-run cache for `web_fetch` (and other idempotent HTTP-GET tools)
   * keyed by full URL. Set Runs commonly fetch the same Yahoo / Macrotrends
   * URL 2-3× across chained steps (step 1 grabs financials, step 2 grabs
   * the same page again for price action, etc.) — each fetch is ~4K
   * tokens of input on the next round. Caching cuts ~30-40% of token spend
   * on data-heavy packs. Cleared on `startRun`.
   */
  fetchCache: Record<string, string>;
  /**
   * The concrete planner that produced the current plan. Populated by
   * `runOrchestratorMessage` on the `onPlan` event so the Run Trace
   * panel can show "Llama 3.1 8B (server)" vs the managed fallback.
   */
  plannerInfo: { source: 'server' | 'managed'; modelId: string; label: string } | null;
  /** AbortController used to cancel in-flight LLM calls. Cleared between runs. */
  abort: AbortController | null;

  // ─── Lifecycle ────────────────────────────────────────────────────────
  startRun: (run: Run) => AbortController;
  setRun: (run: Run) => void;
  patchRun: (patch: Partial<Run>) => Promise<void>;
  cancelRun: () => Promise<void>;
  endRun: (status: 'done' | 'failed' | 'cancelled', error?: string) => Promise<void>;

  // ─── Subtasks ─────────────────────────────────────────────────────────
  upsertSubtask: (s: Subtask) => Promise<void>;
  patchSubtask: (id: string, patch: Partial<Subtask>) => Promise<void>;
  appendSubtaskToolCall: (subtaskId: string, entry: SubtaskToolCall) => void;
  setSubtaskIntent: (subtaskId: string, intent: ToolIntent) => void;
  setExecutionDecision: (decision: ExecutionDecision | null) => void;
  getCachedFetch: (url: string) => string | undefined;
  setCachedFetch: (url: string, output: string) => void;

  // ─── Task memory ──────────────────────────────────────────────────────
  setTaskState: (state: TaskState) => Promise<void>;
  patchTaskState: (mutate: (s: TaskState) => void) => Promise<void>;

  // ─── Planner info ─────────────────────────────────────────────────────
  setPlannerInfo: (info: RunState['plannerInfo']) => void;

  // ─── Cleanup ──────────────────────────────────────────────────────────
  reset: () => void;
}

export const useRunStore = create<RunState>((set, get) => ({
  run: null,
  subtasks: [],
  taskState: null,
  subtaskToolCalls: {},
  subtaskIntents: {},
  executionDecision: null,
  fetchCache: {},
  plannerInfo: null,
  abort: null,

  startRun: (run) => {
    const abort = new AbortController();
    set({
      run,
      subtasks: [],
      taskState: emptyTaskState(run.goal),
      subtaskToolCalls: {},
      subtaskIntents: {},
      // executionDecision is set by chatStore.runPack BEFORE startRun
      // for pack runs, so don't clobber here. Clear is handled in
      // `reset` / replaced on next pack-run kickoff.
      fetchCache: {},
      plannerInfo: null,
      abort,
    });
    return abort;
  },

  setPlannerInfo: (info) => set({ plannerInfo: info }),

  setRun: (run) => set({ run }),

  patchRun: async (patch) => {
    const cur = get().run;
    if (!cur) return;
    const next = { ...cur, ...patch };
    set({ run: next });
    await runUpdateCmd({
      id: cur.id,
      status: patch.status,
      totalCredits: patch.totalCredits,
      reserveId: patch.reserveId ?? undefined,
      error: patch.error ?? undefined,
      endedAt: patch.endedAt ?? undefined,
    });
  },

  cancelRun: async () => {
    const cur = get();
    cur.abort?.abort();
    if (!cur.run) return;
    await runCancelCmd(cur.run.id);
    set({
      run: { ...cur.run, status: 'cancelled', endedAt: Date.now() },
      abort: null,
    });
  },

  endRun: async (status, error) => {
    const cur = get();
    if (!cur.run) return;
    const ended = Date.now();
    set({
      run: { ...cur.run, status, error: error ?? null, endedAt: ended },
      abort: null,
    });
    await runUpdateCmd({ id: cur.run.id, status, error, endedAt: ended });
  },

  upsertSubtask: async (s) => {
    set((state) => {
      const idx = state.subtasks.findIndex((x) => x.id === s.id);
      const next = [...state.subtasks];
      if (idx >= 0) next[idx] = s;
      else next.push(s);
      next.sort((a, b) => a.ord - b.ord);
      return { subtasks: next };
    });
    await subtaskUpsertCmd(s);
  },

  patchSubtask: async (id, patch) => {
    const cur = get().subtasks.find((s) => s.id === id);
    if (!cur) return;
    const next: Subtask = { ...cur, ...patch };
    set((state) => ({
      subtasks: state.subtasks.map((s) => (s.id === id ? next : s)),
    }));
    await subtaskUpsertCmd(next);
  },

  appendSubtaskToolCall: (subtaskId, entry) => {
    set((state) => {
      const prev = state.subtaskToolCalls[subtaskId] ?? [];
      return {
        subtaskToolCalls: {
          ...state.subtaskToolCalls,
          [subtaskId]: [...prev, entry],
        },
      };
    });
  },

  setSubtaskIntent: (subtaskId, intent) => {
    set((state) => ({
      subtaskIntents: { ...state.subtaskIntents, [subtaskId]: intent },
    }));
  },

  setExecutionDecision: (decision) => set({ executionDecision: decision }),

  getCachedFetch: (url) => get().fetchCache[url],
  setCachedFetch: (url, output) => {
    set((state) => ({
      fetchCache: { ...state.fetchCache, [url]: output },
    }));
  },

  setTaskState: async (state) => {
    set({ taskState: state });
    const run = get().run;
    if (run) await taskMemorySetCmd(run.id, JSON.stringify(state));
  },

  patchTaskState: async (mutate) => {
    const cur = get().taskState;
    if (!cur) return;
    // Shallow clone is enough — mutate works on the top-level fields and
    // the orchestrator never holds a long-lived ref into the store object.
    const next: TaskState = {
      ...cur,
      subtasks: { ...cur.subtasks },
      summaries: { ...cur.summaries, perSubtask: { ...cur.summaries.perSubtask } },
      facts: [...cur.facts],
      artifacts: [...cur.artifacts],
      open_questions: [...cur.open_questions],
    };
    mutate(next);
    set({ taskState: next });
    const run = get().run;
    if (run) await taskMemorySetCmd(run.id, JSON.stringify(next));
  },

  reset: () => {
    get().abort?.abort();
    set({
      run: null,
      subtasks: [],
      taskState: null,
      subtaskToolCalls: {},
      subtaskIntents: {},
      executionDecision: null,
      fetchCache: {},
      plannerInfo: null,
      abort: null,
    });
  },
}));

/** Sub-status helpers used by the UI to render colors / badges. */
export const SUBTASK_STATUS_COLORS: Record<SubtaskStatus, string> = {
  pending:   'bg-zinc-500/15 text-zinc-400',
  routing:   'bg-amber-500/15 text-amber-400',
  running:   'bg-blue-500/15 text-blue-400',
  done:      'bg-emerald-500/15 text-emerald-400',
  retry:     'bg-orange-500/15 text-orange-400',
  escalated: 'bg-purple-500/15 text-purple-400',
  failed:    'bg-red-500/15 text-red-400',
};
