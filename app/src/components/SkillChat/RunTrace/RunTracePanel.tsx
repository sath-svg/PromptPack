/**
 * Run Trace panel.
 *
 * Two render modes, gated by `settings.developerMode`:
 *   - **User mode** (default): jargon-free progress view. Step counter,
 *     friendly status text, plain-English effort labels. No tool catalog,
 *     no shared-memory snapshot, no planner internals.
 *   - **Developer mode**: full technical view with planner source,
 *     tools-per-subtask, shared memory grid, model ids.
 *
 * Subscribes to `useRunStore` and renders only when a run is active.
 */

import { Brain, X, Database, Cpu, CheckCircle2, Loader2, AlertCircle, Circle } from 'lucide-react';
import { useRunStore, SUBTASK_STATUS_COLORS } from '../../../stores/runStore';
import { useSettingsStore } from '../../../stores/settingsStore';
import { getManagedModel } from '../../../lib/managed-models';
import { EFFORT_DISPLAY_LABELS } from '../../../lib/classifier';
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
  const developerMode = useSettingsStore((s) => s.developerMode);
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
          <h2 className="text-sm font-medium text-zinc-100">
            {developerMode ? 'Run Trace' : 'Progress'}
          </h2>
          {developerMode && (
            <span className="text-[10px] uppercase tracking-wider text-amber-500/80 font-mono">
              dev
            </span>
          )}
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
        {!run && (
          <p className="text-xs text-zinc-500 italic">
            {developerMode
              ? 'No active run. Send a multi-step message with SkillFlow on to see the planner output, per-subtask routing decisions, and live progress here.'
              : 'Nothing running right now. Send a message and progress will show up here.'}
          </p>
        )}

        {run && developerMode && (
          <DeveloperView
            run={run}
            subtasks={subtasks}
            taskState={taskState}
            plannerLabel={plannerLabel}
            onCancel={() => void cancelRun()}
          />
        )}

        {run && !developerMode && (
          <UserView
            run={run}
            subtasks={subtasks}
            onCancel={() => void cancelRun()}
          />
        )}
      </div>
    </div>
  );
}

// ─── User-friendly view ────────────────────────────────────────────────────

interface ViewProps {
  run: { id: string; status: string; goal: string };
  subtasks: Subtask[];
  onCancel: () => void;
}

function UserView({ run, subtasks, onCancel }: ViewProps) {
  const total = subtasks.length;
  const done = subtasks.filter((s) => s.status === 'done').length;
  const current = subtasks.find((s) => s.status === 'running');
  const failed = subtasks.find((s) => s.status === 'failed');

  let summaryText = '';
  if (run.status === 'running') {
    summaryText = current
      ? `Working on step ${subtasks.indexOf(current) + 1} of ${total}…`
      : `Starting…`;
  } else if (run.status === 'done') {
    summaryText = `Finished all ${total} step${total === 1 ? '' : 's'}.`;
  } else if (run.status === 'failed') {
    summaryText = failed
      ? `Stopped on step ${subtasks.indexOf(failed) + 1}.`
      : `Stopped with an error.`;
  } else if (run.status === 'cancelled') {
    summaryText = `Stopped by you.`;
  } else {
    summaryText = `${done} of ${total} done.`;
  }

  return (
    <>
      <div className="rounded border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 space-y-2">
        <p className="text-zinc-200 text-sm leading-snug">{run.goal}</p>
        <div className="flex items-center gap-2 text-xs">
          {run.status === 'running' && (
            <Loader2 size={12} className="text-amber-400 animate-spin" />
          )}
          {run.status === 'done' && (
            <CheckCircle2 size={12} className="text-green-400" />
          )}
          {(run.status === 'failed' || run.status === 'cancelled') && (
            <AlertCircle size={12} className="text-red-400" />
          )}
          <span className="text-zinc-400">{summaryText}</span>
        </div>
        {total > 0 && (
          <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-amber-400 transition-all"
              style={{ width: `${total === 0 ? 0 : (done / total) * 100}%` }}
            />
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        {subtasks.map((s, i) => (
          <UserSubtaskRow key={s.id} subtask={s} index={i} />
        ))}
      </div>

      {run.status === 'running' && (
        <button
          onClick={onCancel}
          className="w-full py-2 text-xs rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
        >
          Stop
        </button>
      )}
    </>
  );
}

function UserSubtaskRow({ subtask: s, index }: { subtask: Subtask; index: number }) {
  const Icon =
    s.status === 'done'
      ? CheckCircle2
      : s.status === 'running'
        ? Loader2
        : s.status === 'failed'
          ? AlertCircle
          : Circle;
  const iconColor =
    s.status === 'done'
      ? 'text-green-400'
      : s.status === 'running'
        ? 'text-amber-400 animate-spin'
        : s.status === 'failed'
          ? 'text-red-400'
          : 'text-zinc-600';

  const effortLabel = s.effort
    ? s.effort === 'low'
      ? 'Quick'
      : s.effort === 'medium'
        ? 'Standard'
        : 'Deep'
    : null;

  return (
    <div className="flex items-start gap-2.5 px-3 py-2 rounded bg-zinc-900/30">
      <Icon size={14} className={`${iconColor} mt-0.5 shrink-0`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-zinc-500 font-mono">
            Step {index + 1}
          </span>
          {effortLabel && s.status !== 'pending' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
              {effortLabel}
            </span>
          )}
        </div>
        <p className="text-xs text-zinc-200 leading-snug">
          {s.title ?? '(untitled)'}
        </p>
        {s.error && (
          <p className="text-[11px] text-red-400 mt-1">{s.error}</p>
        )}
      </div>
    </div>
  );
}

// ─── Developer view (the existing technical layout) ────────────────────────

interface DeveloperViewProps extends ViewProps {
  taskState: TaskState | null;
  plannerLabel: string;
}

function DeveloperView({
  run,
  subtasks,
  taskState,
  plannerLabel,
  onCancel,
}: DeveloperViewProps) {
  return (
    <>
      <ArchitectureNote plannerLabel={plannerLabel} />
      <RunHeader run={run} subtaskCount={subtasks.length} />
      {taskState?.plan && (
        <PlanCard
          merge={taskState.plan.merge}
          count={taskState.plan.subtasks.length}
        />
      )}
      <DevSubtaskList subtasks={subtasks} />
      <ChipLegend />
      {taskState && <MemorySnapshot state={taskState} />}
      {run.status === 'running' && (
        <button
          onClick={onCancel}
          className="w-full py-2 text-xs rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
        >
          Cancel run
        </button>
      )}
    </>
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
    </div>
  );
}

// One-shot legend below the dev-mode subtask list so the % / ↻ / Light /
// Standard / Deep chips aren't black boxes. Folds together what would
// otherwise have to live as separate hover tooltips on each row.
function ChipLegend() {
  return (
    <div className="rounded border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-[11px] text-zinc-500 space-y-1.5 leading-relaxed">
      <p className="text-zinc-300 font-medium">Chip legend</p>
      <p>
        <span className="font-mono px-1 py-px rounded bg-emerald-500/15 text-emerald-400">
          85%
        </span>{' '}
        confidence — heuristic check on the output (empty / refusal /
        truncation / JSON validity / file mention / length).
        Green ≥ 75%, amber ≥ 55%, red below. Sub-55% triggers one retry.
      </p>
      <p>
        <span className="font-mono px-1 py-px rounded bg-orange-500/15 text-orange-400">
          ↻ 1
        </span>{' '}
        retry count — Skillset re-ran this subtask once at a higher
        effort (then tier) because the first attempt scored low.
      </p>
      <p>
        <span className="font-mono px-1 py-px rounded bg-amber-500/15 text-amber-400">
          Light
        </span>{' '}
        /{' '}
        <span className="font-mono px-1 py-px rounded bg-orange-500/15 text-orange-400">
          Standard
        </span>{' '}
        /{' '}
        <span className="font-mono px-1 py-px rounded bg-red-500/15 text-red-400">
          Deep
        </span>{' '}
        — reasoning effort the model was asked to spend. Higher = more
        thinking tokens, higher cost.
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

function DevSubtaskList({ subtasks }: { subtasks: Subtask[] }) {
  if (subtasks.length === 0) {
    return <p className="text-xs text-zinc-500 italic">No subtasks yet.</p>;
  }
  return (
    <div className="space-y-2">
      {subtasks.map((s) => (
        <DevSubtaskRow key={s.id} subtask={s} />
      ))}
    </div>
  );
}

function DevSubtaskRow({ subtask: s }: { subtask: Subtask }) {
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
            className={`px-1.5 py-0.5 rounded ${EFFORT_COLORS[s.effort]}`}
            title={
              s.reasoningTokens
                ? `Reasoning effort · ${s.reasoningTokens} thinking tokens`
                : 'Reasoning effort'
            }
          >
            {EFFORT_DISPLAY_LABELS[s.effort]}
          </span>
        )}
        {s.retries > 0 && (
          <span
            className="px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400 font-mono"
            title="Confidence heuristic escalated this subtask. Run Trace shows the bumped (tier, effort)."
          >
            ↻ {s.retries}
          </span>
        )}
        {typeof s.confidence === 'number' && s.status === 'done' && (
          <span
            className={`px-1.5 py-0.5 rounded font-mono ${
              s.confidence >= 0.75
                ? 'bg-emerald-500/15 text-emerald-400'
                : s.confidence >= 0.55
                  ? 'bg-amber-500/15 text-amber-400'
                  : 'bg-red-500/15 text-red-400'
            }`}
            title={
              [
                'Confidence score (0–100%) — Skillset\'s heuristic check on the model\'s output.',
                'Looks at: empty / refusal / truncation / JSON validity (when produces=json) / file mention (when produces=file) / length-vs-instruction.',
                'Below 55% triggers one retry at a higher effort or tier; this chip shows the FINAL score after any retries.',
                '',
                `Score: ${s.confidence.toFixed(2)}`,
              ].join('\n')
            }
          >
            {Math.round(s.confidence * 100)}%
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
        // Retry notes start with "retry N: …" — render in amber so users
        // don't read them as a hard failure. Real failures (status=failed)
        // still surface red.
        <p
          className={
            s.status === 'failed'
              ? 'text-red-400 text-[11px]'
              : 'text-amber-400 text-[11px]'
          }
        >
          {s.error}
        </p>
      )}
    </div>
  );
}
