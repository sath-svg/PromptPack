import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Loader2,
  Package,
  X,
} from 'lucide-react';
import { useAgentStore } from '../../stores/agentStore';
import { getServerById } from '../../lib/lspClient';

// Surfaces LSP availability so casual users can install missing servers
// with one click. Lives below the workspace bar.
export function LspStatusBar() {
  const lspStatus = useAgentStore((s) => s.lspStatus);
  const installLspServer = useAgentStore((s) => s.installLspServer);
  const setLspStatus = useAgentStore((s) => s.setLspStatus);
  const [expanded, setExpanded] = useState<string | null>(null);

  const entries = Object.entries(lspStatus).filter(
    ([, status]) =>
      status.state !== 'idle' && status.state !== 'ready' && status.state !== 'checking',
  );
  if (entries.length === 0) return null;

  return (
    <div className="space-y-1 mb-3">
      {entries.map(([id, status]) => {
        const spec = getServerById(id);
        const name = spec?.displayName ?? id;
        return (
          <div
            key={id}
            className="rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs"
          >
            <div className="flex items-center gap-2">
              {status.state === 'fetching' && (
                <>
                  <Loader2 size={12} className="animate-spin text-[var(--primary)]" />
                  <span className="text-[var(--foreground)]">
                    Fetching {name} language server (first run, ~30s)…
                  </span>
                </>
              )}
              {status.state === 'installing' && (
                <>
                  <Loader2 size={12} className="animate-spin text-[var(--primary)]" />
                  <span className="text-[var(--foreground)]">Installing {name} language server…</span>
                  <button
                    onClick={() => setExpanded(expanded === id ? null : id)}
                    className="ml-auto text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  >
                    {expanded === id ? 'hide log' : 'show log'}
                  </button>
                </>
              )}
              {status.state === 'needs-install' && (
                <>
                  <Package size={12} className="text-[var(--primary)]" />
                  <span className="text-[var(--foreground)]">
                    {name} language server not installed.
                  </span>
                  <button
                    onClick={() => installLspServer(id)}
                    className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20"
                  >
                    <Download size={11} /> Install via {status.via}
                  </button>
                  <button
                    onClick={() => setLspStatus(id, { state: 'unavailable', reason: 'Dismissed.' })}
                    className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    title="Dismiss"
                  >
                    <X size={11} />
                  </button>
                </>
              )}
              {status.state === 'unavailable' && (
                <>
                  <AlertTriangle size={12} className="text-amber-500" />
                  <span className="text-[var(--muted-foreground)]">
                    {name}: {status.reason}
                  </span>
                  <button
                    onClick={() => setLspStatus(id, { state: 'idle' })}
                    className="ml-auto text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  >
                    <X size={11} />
                  </button>
                </>
              )}
            </div>
            {expanded === id && status.state === 'installing' && (
              <pre
                className="mt-2 max-h-32 overflow-y-auto bg-[var(--background)] rounded p-2 text-[10px] text-[var(--muted-foreground)] whitespace-pre-wrap"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {status.lines.join('\n') || '(waiting…)'}
              </pre>
            )}
          </div>
        );
      })}
      {Object.values(lspStatus).some((s) => s.state === 'ready') && (
        <div className="flex items-center gap-1.5 text-[10px] text-[var(--muted-foreground)] px-1">
          <CheckCircle2 size={10} className="text-emerald-500" />
          {
            Object.entries(lspStatus)
              .filter(([, s]) => s.state === 'ready')
              .map(([id]) => getServerById(id)?.displayName ?? id)
              .join(', ')
          }{' '}
          ready
        </div>
      )}
    </div>
  );
}
