import { useMemo } from 'react';
import { Check, X, AlertTriangle } from 'lucide-react';
import { useAgentStore } from '../../stores/agentStore';
import { diffLines, diffStats } from '../../lib/diff';

interface DiffPanelProps {
  pendingEditId: string;
}

export function DiffPanel({ pendingEditId }: DiffPanelProps) {
  const edit = useAgentStore((s) => s.pendingEdits[pendingEditId]);
  const acceptEdit = useAgentStore((s) => s.acceptEdit);
  const rejectEdit = useAgentStore((s) => s.rejectEdit);

  const diff = useMemo(
    () => (edit ? diffLines(edit.before, edit.after) : []),
    [edit],
  );
  const stats = useMemo(() => diffStats(diff), [diff]);

  if (!edit) return null;

  const errorCount = (edit.diagnostics ?? []).filter((d) => (d.severity ?? 1) === 1).length;
  const warnCount = (edit.diagnostics ?? []).filter((d) => d.severity === 2).length;

  return (
    <div className="rounded-md border border-[var(--border)] overflow-hidden">
      <div className="flex items-center gap-2 px-2 py-1.5 bg-[var(--background)] border-b border-[var(--border)] text-xs">
        <span style={{ fontFamily: 'var(--font-mono)' }} className="text-[var(--foreground)]">
          {edit.path}
        </span>
        <span className="text-emerald-500">+{stats.added}</span>
        <span className="text-red-500">-{stats.removed}</span>
        {errorCount > 0 && (
          <span className="flex items-center gap-1 text-red-500" title="LSP errors">
            <AlertTriangle size={11} /> {errorCount}
          </span>
        )}
        {warnCount > 0 && (
          <span className="flex items-center gap-1 text-amber-500" title="LSP warnings">
            <AlertTriangle size={11} /> {warnCount}
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          {edit.accepted === null ? (
            <>
              <button
                onClick={() => acceptEdit(edit.id)}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25"
              >
                <Check size={11} /> Accept
              </button>
              <button
                onClick={() => rejectEdit(edit.id)}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/15 text-red-500 hover:bg-red-500/25"
              >
                <X size={11} /> Reject
              </button>
            </>
          ) : edit.accepted ? (
            <span className="text-emerald-500 text-[10px] uppercase tracking-wider">accepted</span>
          ) : (
            <span className="text-red-500 text-[10px] uppercase tracking-wider">rejected</span>
          )}
        </div>
      </div>
      <pre
        className="text-xs leading-[1.5] overflow-x-auto max-h-72 overflow-y-auto"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {diff.map((line, i) => {
          const bg =
            line.kind === 'add'
              ? 'bg-emerald-500/10 text-emerald-300'
              : line.kind === 'remove'
                ? 'bg-red-500/10 text-red-300'
                : 'text-[var(--muted-foreground)]';
          const prefix = line.kind === 'add' ? '+' : line.kind === 'remove' ? '-' : ' ';
          return (
            <div key={i} className={`px-2 ${bg}`}>
              <span className="inline-block w-4 select-none">{prefix}</span>
              {line.text || ' '}
            </div>
          );
        })}
      </pre>
      {edit.diagnostics && edit.diagnostics.length > 0 && (
        <div className="border-t border-[var(--border)] px-2 py-1.5 bg-[var(--background)] space-y-1">
          {edit.diagnostics.slice(0, 6).map((d, i) => (
            <div
              key={i}
              className={`text-xs ${
                d.severity === 1
                  ? 'text-red-500'
                  : d.severity === 2
                    ? 'text-amber-500'
                    : 'text-[var(--muted-foreground)]'
              }`}
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {d.range.start.line + 1}:{d.range.start.character + 1} — {d.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
