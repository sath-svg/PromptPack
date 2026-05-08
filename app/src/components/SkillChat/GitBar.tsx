import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { GitBranch, GitCommit, RefreshCw, Loader2, Upload } from 'lucide-react';
import { useAgentStore } from '../../stores/agentStore';
import { InfoModal } from '../Common/InfoModal';

interface GitStatus {
  branch?: string;
  modified: number;
  untracked: number;
  ahead: number;
  behind: number;
  clean: boolean;
  is_repo: boolean;
}

// Lightweight git surface: branch + commit + push from the workspace.
// Heavier ops (rebase, merge, cherry-pick) stay in a real terminal —
// agent's `bash` tool covers those.
export function GitBar() {
  const workspace = useAgentStore((s) => s.workspace);
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [showCommit, setShowCommit] = useState(false);
  const [commitMsg, setCommitMsg] = useState('');
  const [output, setOutput] = useState<string | null>(null);

  const refresh = async () => {
    if (!workspace) {
      setStatus(null);
      return;
    }
    try {
      const res = await invoke<GitStatus>('agent_git_status', { workspace });
      setStatus(res);
    } catch {
      setStatus(null);
    }
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 12000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace]);

  const runBash = async (command: string): Promise<string> => {
    if (!workspace) return '';
    setBusy(true);
    try {
      const res = await invoke<{ stdout: string; stderr: string; code: number | null }>(
        'agent_bash',
        { workspace, command, timeoutMs: 60000 },
      );
      const out = [res.stdout, res.stderr].filter(Boolean).join('\n');
      return `${out}\nexit: ${res.code ?? '?'}`;
    } finally {
      setBusy(false);
      refresh();
    }
  };

  const handleCommit = async () => {
    if (!commitMsg.trim()) return;
    const safe = commitMsg.replace(/"/g, '\\"');
    const out = await runBash(`git add -A && git commit -m "${safe}"`);
    setOutput(out);
    setCommitMsg('');
    setShowCommit(false);
  };

  const handlePush = async () => {
    const out = await runBash('git push');
    setOutput(out);
  };

  if (!workspace || !status?.is_repo) return null;

  const dirtyCount = status.modified + status.untracked;

  return (
    <>
      <div className="flex items-center gap-2 mb-3 text-xs">
        <span className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-[var(--border)] text-[var(--muted-foreground)]">
          <GitBranch size={11} className="text-[var(--primary)]" />
          <span style={{ fontFamily: 'var(--font-mono)' }} className="text-[var(--foreground)]">
            {status.branch ?? 'detached'}
          </span>
          {dirtyCount > 0 && <span className="text-amber-500">●</span>}
          {status.clean && <span className="text-emerald-500">●</span>}
        </span>
        {status.modified > 0 && (
          <span className="text-amber-500">{status.modified}M</span>
        )}
        {status.untracked > 0 && (
          <span className="text-[var(--muted-foreground)]">{status.untracked}U</span>
        )}
        {status.ahead > 0 && (
          <span className="text-emerald-500">↑{status.ahead}</span>
        )}
        {status.behind > 0 && (
          <span className="text-red-500">↓{status.behind}</span>
        )}
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => setShowCommit(true)}
            disabled={busy || dirtyCount === 0}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] disabled:opacity-40 transition-colors"
            title="Stage all + commit"
          >
            <GitCommit size={11} /> Commit
          </button>
          <button
            onClick={handlePush}
            disabled={busy || status.ahead === 0}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] disabled:opacity-40 transition-colors"
            title="git push"
          >
            <Upload size={11} /> Push
          </button>
          <button
            onClick={refresh}
            disabled={busy}
            className="p-1 rounded text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] disabled:opacity-40 transition-colors"
            title="Refresh"
          >
            {busy ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
          </button>
        </div>
      </div>

      <InfoModal
        open={showCommit}
        title="Commit changes"
        primaryLabel={busy ? 'Committing…' : 'Commit'}
        secondaryLabel="Cancel"
        onPrimary={handleCommit}
        onClose={() => setShowCommit(false)}
      >
        <p className="mb-2 text-xs">
          Stages all changes (<code>git add -A</code>) and commits with the message below.
          {' '}
          <span className="text-[var(--foreground)]">{status.modified}</span> modified,{' '}
          <span className="text-[var(--foreground)]">{status.untracked}</span> untracked.
        </p>
        <textarea
          value={commitMsg}
          onChange={(e) => setCommitMsg(e.target.value)}
          placeholder="Commit message…"
          rows={3}
          className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:border-[var(--primary)] resize-none"
          autoFocus
        />
      </InfoModal>

      {output && (
        <div className="mb-3 rounded-md border border-[var(--border)] bg-[var(--background)] p-2 text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
              git
            </span>
            <button
              onClick={() => setOutput(null)}
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              clear
            </button>
          </div>
          <pre
            className="whitespace-pre-wrap break-words max-h-32 overflow-y-auto text-[var(--muted-foreground)]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {output}
          </pre>
        </div>
      )}
    </>
  );
}
