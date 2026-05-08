/**
 * Run Trace panel — minimal Phase 7 version.
 *
 * Subscribes to `useRunStore` and renders the planner output, subtask
 * status list, and final merged output. Visible only when the
 * orchestrator path is active and a run exists.
 */

import { Brain, X, Database, Cpu } from 'lucide-react';
import { useRunStore, SUBTASK_STATUS_COLORS } from '../../../stores/runStore';
import { useSettingsStore } from '../../../stores/settingsStore';
import { getManagedModel } from '../../../lib/managed-models';
import type { Subtask, TaskState } from '../../../lib/orchestrator/types';

const EFFORT_COLORS: Record<'low' | 'medium' | 'high', string> = {
  low: 'bg-amber-500/15 text-amber-400',
  medium: 'bg-orange-500/15 text-orange-400',
  high: 'bg-red-500/15 text-red-400',
};

interface RunTracePanelProps {
  open: boolean;
  onClose: () => void;
}

export function RunTracePanel({ open, onClose }: RunTracePanelProps) {
  const { run, subtasks, taskState, plannerInfo, cancelRun } = useRunStore();
  // Default label shown before any plan has run. Once a run starts the
  // store fills in `plannerInfo` with the concrete source / model and the
  // chip switches to that. The fallback default is the inbuilt Llama 8B
  // so users see the right answer even if they haven't run yet.
  const fallbackManagedId = useSettingsStore((s) => s.selectedManagedModels.cheap);
  const fallbackManaged = getManagedModel(fallbackManagedId);
  const plannerLabel =
    plannerInfo?.label ?? `Llama 3.1 8B (server · free) · fallback ${fallbackManaged?.label ?? fallbackManagedId}`;

  if (!open) return null;

  return (
    <div className="border-l border-zinc-800 bg-zinc-950 w-96 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Brain size={16} className="text-amber-400" />
          <h2 className="text-sm font-medium text-zinc-100">Run Trace</h2>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-300 transition-colors"
          aria-label="Close run trace"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        <ArchitectureNote plannerLabel={plannerLabel} />

        {!run && (
          <p className="text-xs text-zinc-500 italic">
            No active run. Send a multi-step message with SkillFlow on to see the
            planner output, per-subtask routing decisions, and live progress here.
          </p>
        )}

        {run && (
          <>
            <RunHeader run={run} subtaskCount={subtasks.length} />
            {taskState?.plan && (
              <PlanCard
                merge={taskState.plan.merge}
                count={taskState.plan.subtasks.length}
              />
            )}
            <SubtaskList subtasks={subtasks} />
            {taskState && <MemorySnapshot state={taskState} />}
            {run.status === 'running' && (
              <button
                onClick={() => void cancelRun()}
                className="w-full py-2 text-xs rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
              >
                Cancel run
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ArchitectureNote({ plannerLabel }: { plannerLabel: string }) {
  return (
    <div className="rounded border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-xs space-y-2">
      <div className="flex items-center gap-2 text-zinc-400">
        <Cpu size={12} />
        <span>Orchestrator</span>
      </div>
      <p className="text-zinc-500 leading-relaxed">
        The Skillset desktop app's <code className="text-zinc-300">Orchestrator</code>{' '}
        class drives SkillFlow. It calls the <span className="text-zinc-300">planner LLM</span>{' '}
        to decompose your message, then runs each subtask through whichever
        managed model the LR router picks for that subtask.
      </p>
      <div className="flex items-center gap-2 pt-1">
        <span className="text-zinc-500">Planner</span>
        <span className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-amber-500/10 text-amber-400">
          {plannerLabel}
        </span>
      </div>
      <p className="text-[10px] text-zinc-500">
        Default planner = <strong>inbuilt Llama 3.1 8B</strong> via the
        Skillset server (free, daily-capped). Falls back to your{' '}
        <strong>cheap</strong> managed pick if the server is unreachable.
      </p>
    </div>
  );
}

function MemorySnapshot({ state }: { state: TaskState }) {
  const subtaskCount = Object.keys(state.subtasks).length;
  const summaryLen = state.summaries.rolling.length;
  const factCount = state.facts.length;
  const artifactCount = state.artifacts.length;
  const openQ = state.open_questions.length;
  return (
    <div className="rounded border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-xs space-y-1.5">
      <div className="flex items-center gap-2 text-zinc-400">
        <Database size={12} />
        <span>Shared memory</span>
        <span className="ml-auto text-[10px] text-zinc-600 font-mono">
          sqlite · task_memory
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1 text-zinc-300 font-mono text-[11px]">
        <span>subtasks</span>
        <span className="text-right">{subtaskCount}</span>
        <span>summary</span>
        <span className="text-right">{summaryLen}c</span>
        <span>facts</span>
        <span className="text-right">{factCount}</span>
        <span>artifacts</span>
        <span className="text-right">{artifactCount}</span>
        <span>open questions</span>
        <span className="text-right">{openQ}</span>
      </div>
    </div>
  );
}

interface RunHeaderProps {
  run: { id: string; status: string; goal: string };
  subtaskCount: number;
}

function RunHeader({ run, subtaskCount }: RunHeaderProps) {
  return (
    <div className="text-xs space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="text-zinc-500">Status</span>
        <span
          className={`px-2 py-0.5 rounded font-mono ${SUBTASK_STATUS_COLORS[run.status as keyof typeof SUBTASK_STATUS_COLORS] ?? 'bg-zinc-500/15 text-zinc-400'}`}
        >
          {run.status}
        </span>
        <span className="text-zinc-600">·</span>
        <span className="text-zinc-500">{subtaskCount} subtask(s)</span>
      </div>
      <p className="text-zinc-300 leading-relaxed">{run.goal}</p>
    </div>
  );
}

function PlanCard({ merge, count }: { merge: string; count: number }) {
  return (
    <div className="rounded border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-xs">
      <div className="flex items-center justify-between">
        <span className="text-zinc-400">Plan</span>
        <span className="text-zinc-500 font-mono">
          {count} step(s) · merge: {merge}
        </span>
      </div>
    </div>
  );
}

function SubtaskList({ subtasks }: { subtasks: Subtask[] }) {
  if (subtasks.length === 0) {
    return <p className="text-xs text-zinc-500 italic">No subtasks yet.</p>;
  }
  return (
    <div className="space-y-2">
      {subtasks.map((s) => (
        <SubtaskRow key={s.id} subtask={s} />
      ))}
    </div>
  );
}

function SubtaskRow({ subtask: s }: { subtask: Subtask }) {
  // The planner-supplied tool list is stored as a JSON string; parse
  // defensively so a malformed value doesn't crash the panel.
  let needsTools: string[] = [];
  if (s.needsTools) {
    try {
      const parsed = JSON.parse(s.needsTools);
      if (Array.isArray(parsed)) needsTools = parsed.map(String);
    } catch {
      // ignore
    }
  }

  return (
    <div className="rounded border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs space-y-1">
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`px-1.5 py-0.5 rounded font-mono ${SUBTASK_STATUS_COLORS[s.status]}`}
        >
          {s.status}
        </span>
        {s.effort && (
          <span
            className={`px-1.5 py-0.5 rounded font-mono ${EFFORT_COLORS[s.effort]}`}
            title={
              s.reasoningTokens
                ? `${s.reasoningTokens} reasoning tokens`
                : 'reasoning effort'
            }
          >
            {s.effort}
          </span>
        )}
        {s.retries > 0 && (
          <span className="px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400 font-mono">
            ↻ {s.retries}
          </span>
        )}
        <span className="ml-auto text-zinc-500 font-mono text-[10px]">
          {s.id}
        </span>
      </div>
      <p className="text-zinc-200 font-medium">{s.title ?? '(untitled)'}</p>
      {needsTools.length > 0 && (
        <p className="text-zinc-500 font-mono text-[10px]">
          tools: {needsTools.join(', ')}
        </p>
      )}
      {s.error && (
        <p className="text-red-400 text-[11px]">{s.error}</p>
      )}
    </div>
  );
}
