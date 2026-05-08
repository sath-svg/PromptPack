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

interface RunState {
  // ─── Live run ─────────────────────────────────────────────────────────
  run: Run | null;
  subtasks: Subtask[];
  taskState: TaskState | null;
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
  plannerInfo: null,
  abort: null,

  startRun: (run) => {
    const abort = new AbortController();
    set({
      run,
      subtasks: [],
      taskState: emptyTaskState(run.goal),
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
    set({ run: null, subtasks: [], taskState: null, plannerInfo: null, abort: null });
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
