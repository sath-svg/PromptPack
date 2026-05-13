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

import { Brain, X, Database, Cpu, CheckCircle2, Loader2, AlertCircle, Circle, Wrench, FileOutput, FileInput, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useRunStore, SUBTASK_STATUS_COLORS, type SubtaskToolCall } from '../../../stores/runStore';
import { useSettingsStore } from '../../../stores/settingsStore';
import { getManagedModel } from '../../../lib/managed-models';
import { EFFORT_DISPLAY_LABELS } from '../../../lib/classifier';
import { friendlyToolName } from '../../../lib/toolLabels';
import type { Subtask, TaskState } from '../../../lib/orchestrator/types';
import type { ToolIntent } from '../../../lib/orchestrator/toolIntent';
import type { ExecutionDecision } from '../../../lib/orchestrator/executionMode';

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
  const {
    run,
    subtasks,
    taskState,
    plannerInfo,
    cancelRun,
    subtaskToolCalls,
    subtaskIntents,
    executionDecision,
  } = useRunStore();
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
              ? 'No active run. Send a multi-step message with Skill Flow on to see the planner output, per-subtask routing decisions, and live progress here.'
              : 'Nothing running right now. Send a message and progress will show up here.'}
          </p>
        )}

        {run && developerMode && (
          <DeveloperView
            run={run}
            subtasks={subtasks}
            taskState={taskState}
            plannerLabel={plannerLabel}
            subtaskToolCalls={subtaskToolCalls}
            subtaskIntents={subtaskIntents}
            executionDecision={executionDecision}
            onCancel={() => void cancelRun()}
          />
        )}

        {run && !developerMode && (
          <UserView
            run={run}
            subtasks={subtasks}
            subtaskToolCalls={subtaskToolCalls}
            subtaskIntents={subtaskIntents}
            executionDecision={executionDecision}
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
  subtaskToolCalls: Record<string, SubtaskToolCall[]>;
  subtaskIntents: Record<string, ToolIntent>;
  executionDecision: ExecutionDecision | null;
  onCancel: () => void;
}

function UserView({ run, subtasks, subtaskToolCalls, subtaskIntents, executionDecision, onCancel }: ViewProps) {
  // Total = full planned subtask count. `subtasks` is the runStore's
  // incrementally-upserted list (size 1 at the first step, 2 at the
  // second, …) so using `subtasks.length` as the denominator renders
  // "step 1 of 1" mid-run. The full plan is available on `taskState`,
  // but UserView doesn't take that prop — fall back to the longer of
  // (current upserted count, last seen plan size cached on subtasks).
  const taskState = useRunStore((s) => s.taskState);
  const total = taskState?.plan?.subtasks.length ?? subtasks.length;
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
      {executionDecision && <ExecutionModeChip decision={executionDecision} />}
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
          <UserSubtaskRow
            key={s.id}
            subtask={s}
            index={i}
            toolCalls={subtaskToolCalls[s.id] ?? []}
            intent={subtaskIntents[s.id]}
          />
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

function UserSubtaskRow({
  subtask: s,
  index,
  toolCalls,
  intent,
}: {
  subtask: Subtask;
  index: number;
  toolCalls: SubtaskToolCall[];
  intent: ToolIntent | undefined;
}) {
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
        {intent && <IntentChips intent={intent} developerMode={false} />}
        {toolCalls.length > 0 && (
          <ToolCallList toolCalls={toolCalls} developerMode={false} />
        )}
        {s.error && (
          <p className="text-[11px] text-red-400 mt-1">{s.error}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Pack execution-mode chip. Shows how the planner decided to run this
 * Set Run — `single` (cheapest, one LLM call), `chain` (default,
 * per-step), or `dag` (parallel where possible). Reason tooltip
 * carries the LLM rationale.
 */
function ExecutionModeChip({ decision }: { decision: ExecutionDecision }) {
  const palette: Record<ExecutionDecision['mode'], { bg: string; fg: string; label: string }> = {
    single: { bg: 'bg-emerald-500/15', fg: 'text-emerald-400', label: 'single call' },
    chain: { bg: 'bg-amber-500/15', fg: 'text-amber-400', label: 'chain' },
    dag: { bg: 'bg-sky-500/15', fg: 'text-sky-400', label: 'parallel (dag)' },
  };
  const p = palette[decision.mode];
  return (
    <div
      className="flex items-start gap-2 rounded border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-[11px]"
      title={
        `Execution mode chosen by the Llama 8B classifier.\n\n` +
        `Reason: ${decision.reason || '(none)'}\n` +
        `Source: ${decision.source === 'llama' ? 'classifier' : 'heuristic fallback'}\n\n` +
        `single = one LLM call (cheapest, no file artifacts).\n` +
        `chain  = one call per step, sequential (default; for packs that build files).\n` +
        `dag    = independent steps run in parallel.`
      }
    >
      <span className={`px-1.5 py-0.5 rounded font-mono ${p.bg} ${p.fg} shrink-0`}>
        {p.label}
      </span>
      <span className="text-zinc-400 leading-snug">{decision.reason || 'classifier picked this mode'}</span>
    </div>
  );
}

/**
 * Resolver contract chips: must-write paths + must-read paths + source.
 * Renders the tool-intent contract the loop is enforcing. In user mode,
 * just the file-list chips appear ("Files: nvda_action.md"). In dev
 * mode, an extra `resolver: llama|fallback` chip + tool subset shows
 * how the contract was derived. Amber chip when source='fallback' so
 * the dev sees Groq capped out or down.
 */
function IntentChips({
  intent,
  developerMode,
}: {
  intent: ToolIntent;
  developerMode: boolean;
}) {
  const hasWrites = intent.mustWritePaths.length > 0;
  const hasReads = intent.mustReadPaths.length > 0;
  if (!hasWrites && !hasReads && !developerMode) return null;
  return (
    <div className="mt-1.5 space-y-0.5">
      {developerMode && (
        <>
          <div className="flex items-center gap-1.5 text-[10px] font-mono leading-tight flex-wrap">
            <span
              className={
                intent.source === 'llama'
                  ? 'px-1 py-px rounded bg-emerald-500/15 text-emerald-400'
                  : 'px-1 py-px rounded bg-amber-500/15 text-amber-400'
              }
              title={
                intent.source === 'llama'
                  ? 'Per-subtask intent classifier (Llama 8B) succeeded — tool subset + must-write/must-read paths + round budget + tier hint derived from this step\'s prompt.'
                  : `Intent classifier fallback (${intent.fallbackReason ?? 'unknown'}). Using full tool catalog + regex-derived write path. No regression vs. pre-resolver behavior.`
              }
            >
              intent: {intent.source === 'llama' ? 'ok' : 'fallback'}
            </span>
            <span
              className="px-1 py-px rounded bg-zinc-700/40 text-zinc-300"
              title={`Round budget — planner chose ${intent.maxRounds}/5 tool rounds. Lower = cheaper. Each round resends prompt + history.`}
            >
              rounds: {intent.maxRounds}/5
            </span>
            <span
              className={
                intent.suggestedTier === 'fast'
                  ? 'px-1 py-px rounded bg-emerald-500/15 text-emerald-400'
                  : 'px-1 py-px rounded bg-orange-500/15 text-orange-400'
              }
              title={
                intent.suggestedTier === 'fast'
                  ? 'Planner suggested cheap tier — agent loop swapped to your cheap-tier managed model (Haiku / Flash / Mini) for this step.'
                  : 'Planner suggested balanced tier — using mid-tier model (Sonnet / GPT-5 / Gemini Pro) for synthesis quality.'
              }
            >
              tier: {intent.suggestedTier}
            </span>
          </div>
          <div className="text-[10px] font-mono text-zinc-500 truncate">
            tools: {intent.tools.join(', ')}
          </div>
        </>
      )}
      {hasWrites && (
        <div className="flex items-start gap-1.5 text-[10px] leading-tight">
          <FileOutput size={9} className="text-emerald-400 mt-0.5 shrink-0" />
          <div className="flex flex-wrap gap-1 min-w-0">
            {intent.mustWritePaths.map((p) => (
              <span
                key={p}
                className="font-mono text-emerald-300 bg-emerald-500/10 px-1 py-px rounded"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      )}
      {hasReads && developerMode && (
        <div className="flex items-start gap-1.5 text-[10px] leading-tight">
          <FileInput size={9} className="text-sky-400 mt-0.5 shrink-0" />
          <div className="flex flex-wrap gap-1 min-w-0">
            {intent.mustReadPaths.map((p) => (
              <span
                key={p}
                className="font-mono text-sky-300 bg-sky-500/10 px-1 py-px rounded"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact audit log of every tool call the model invoked inside this
 * subtask. Renders the tool name (friendly in user mode, raw in dev),
 * first useful arg (path / pattern), and a ✓ / ✗ marker for OK / error.
 * Lets the user verify "yes the model actually called write_file"
 * instead of trusting the narration text alone.
 */
function ToolCallList({
  toolCalls,
  developerMode,
}: {
  toolCalls: SubtaskToolCall[];
  developerMode: boolean;
}) {
  return (
    <div className="mt-1.5 space-y-0.5">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
        <Wrench size={9} /> tool calls ({toolCalls.length})
      </div>
      {toolCalls.map((tc, i) => {
        const isCacheHit = tc.preview?.startsWith('[cache]') ?? false;
        return (
          <div
            key={i}
            className="flex items-center gap-1.5 text-[10px] leading-tight flex-nowrap min-w-0"
            title={tc.preview}
          >
            <span className={`shrink-0 ${tc.ok ? 'text-green-400' : 'text-red-400'}`}>
              {tc.ok ? '✓' : '✗'}
            </span>
            <span className="text-zinc-300 shrink-0 whitespace-nowrap">
              {developerMode ? tc.name : friendlyToolName(tc.name)}
            </span>
            {isCacheHit && (
              <span
                className="shrink-0 text-[9px] px-1 py-px rounded bg-sky-500/15 text-sky-400 font-mono"
                title="In-run cache hit — same URL fetched earlier this run, replayed for free."
              >
                cached
              </span>
            )}
            {tc.arg && (
              <span className="text-zinc-500 truncate font-mono min-w-0 flex-1">
                {tc.arg}
              </span>
            )}
          </div>
        );
      })}
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
  subtaskToolCalls,
  subtaskIntents,
  executionDecision,
  onCancel,
}: DeveloperViewProps) {
  return (
    <>
      <ArchitectureNote plannerLabel={plannerLabel} />
      {executionDecision && <ExecutionModeChip decision={executionDecision} />}
      <RunHeader run={run} subtaskCount={subtasks.length} />
      {taskState?.plan && (
        <PlanCard
          merge={taskState.plan.merge}
          count={taskState.plan.subtasks.length}
        />
      )}
      <DevSubtaskList
        subtasks={subtasks}
        subtaskToolCalls={subtaskToolCalls}
        subtaskIntents={subtaskIntents}
      />
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
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded border border-zinc-800 bg-zinc-900/50 text-xs">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-zinc-200 transition-colors"
        aria-expanded={open}
      >
        <Cpu size={12} />
        <span>Skill Flow engine</span>
        <span className="ml-auto flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-amber-500/10 text-amber-400">
            {plannerLabel}
          </span>
          {open ? (
            <ChevronDown size={12} className="text-zinc-500" />
          ) : (
            <ChevronRight size={12} className="text-zinc-500" />
          )}
        </span>
      </button>
      {open && (
        <div className="px-3 pb-2.5 pt-0 text-zinc-500 leading-relaxed space-y-2 border-t border-zinc-800">
          <p className="pt-2">
            <span className="text-zinc-300">Skill Flow</span> runs your Set on
            this workspace. First the{' '}
            <span className="text-zinc-300">planner</span> decides the steps
            (skipped for Set Runs — your pack already is the plan). Each step
            then routes through{' '}
            <span className="text-zinc-300">Skill Router</span> to pick the
            cheapest Skill model that fits the work — Fast for lookups,
            Balanced for synthesis, Powerful only when the prompt demands it.
          </p>
          <p>
            A per-step <span className="text-zinc-300">intent classifier</span>{' '}
            (Llama 8B, free) decides the tool subset, must-write paths, round
            budget, and tier hint — so the model only sees the tools the step
            actually needs.
          </p>
        </div>
      )}
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
        Green ≥ 75%, amber ≥ 55%, red below.{' '}
        <strong className="text-zinc-300">Informational only</strong> — auto-retry was
        disabled in v0.1 to avoid surprise credit spend. Re-run the prompt
        manually if a step scored low.
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
  const hasSkillset = Boolean(state.projectInstructions?.trim());
  return (
    <div className="rounded border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-xs space-y-1.5">
      <div className="flex items-center gap-2 text-zinc-400">
        <Database size={12} />
        <span>Shared memory</span>
        <span className="ml-auto text-[10px] text-zinc-600 font-mono">
          sqlite · task_memory
        </span>
      </div>
      <p className="text-zinc-500 text-[10px] leading-relaxed">
        Cross-step memory persisted in SQLite. Each subtask reads prior
        outputs + the rolling summary from here; nothing else carries
        state between steps. The "artifacts" list is now populated when
        a step calls <code className="text-zinc-300">write_file</code> /
        <code className="text-zinc-300"> pdf_generate</code> so you can
        verify which files actually landed on disk.
      </p>
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
        <span>skillset.md</span>
        <span className="text-right">{hasSkillset ? 'loaded' : '—'}</span>
      </div>
      {state.artifacts.length > 0 && (
        <div className="pt-1.5 border-t border-zinc-800/60 space-y-0.5">
          {state.artifacts.map((a, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400"
            >
              <span className="text-emerald-400">●</span>
              <span className="text-zinc-500">{a.subtaskId}</span>
              <span className="text-zinc-300 truncate" title={a.path}>
                {a.path}
              </span>
            </div>
          ))}
        </div>
      )}
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

function DevSubtaskList({
  subtasks,
  subtaskToolCalls,
  subtaskIntents,
}: {
  subtasks: Subtask[];
  subtaskToolCalls: Record<string, SubtaskToolCall[]>;
  subtaskIntents: Record<string, ToolIntent>;
}) {
  if (subtasks.length === 0) {
    return <p className="text-xs text-zinc-500 italic">No subtasks yet.</p>;
  }
  return (
    <div className="space-y-2">
      {subtasks.map((s) => (
        <DevSubtaskRow
          key={s.id}
          subtask={s}
          toolCalls={subtaskToolCalls[s.id] ?? []}
          intent={subtaskIntents[s.id]}
        />
      ))}
    </div>
  );
}

function DevSubtaskRow({
  subtask: s,
  toolCalls,
  intent,
}: {
  subtask: Subtask;
  toolCalls: SubtaskToolCall[];
  intent: ToolIntent | undefined;
}) {
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
                'Informational only — auto-retry disabled in v0.1 to avoid surprise credit spend. Re-run the prompt manually if the score is low.',
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
      {intent && <IntentChips intent={intent} developerMode={true} />}
      {toolCalls.length > 0 && (
        <ToolCallList toolCalls={toolCalls} developerMode={true} />
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
