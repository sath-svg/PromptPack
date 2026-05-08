import { useEffect, useState } from 'react';
import { Folder, FolderOpen, X, Info, Zap } from 'lucide-react';
import { useAgentStore } from '../../stores/agentStore';
import { useChatStore } from '../../stores/chatStore';
import { InfoModal } from '../Common/InfoModal';

export function WorkspaceBar() {
  const { workspace, pickWorkspace, clearWorkspace, autoAcceptEdits, setAutoAcceptEdits } = useAgentStore();
  const { agentMode, setAgentMode } = useChatStore();
  const [showAcceptInfo, setShowAcceptInfo] = useState(false);

  // Agent mode is now derived from workspace presence — no manual toggle.
  // Workspace selected ⇒ tools enabled. Workspace cleared ⇒ tools off.
  // Keeps the surface focused: the user's only decision is "do I want
  // Skillset to touch my filesystem?", expressed via picking a folder.
  useEffect(() => {
    setAgentMode(Boolean(workspace));
  }, [workspace, setAgentMode]);

  const onPick = async () => {
    await pickWorkspace();
  };

  const display = workspace
    ? workspace.length > 50
      ? '…' + workspace.slice(-47)
      : workspace
    : null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
      {workspace ? (
        <>
          <span className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
            <FolderOpen size={11} className="text-[var(--primary)]" />
            <span style={{ fontFamily: 'var(--font-mono)' }}>{display}</span>
          </span>
          <button
            onClick={onPick}
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] underline"
          >
            change
          </button>
          <button
            onClick={clearWorkspace}
            className="text-[var(--muted-foreground)] hover:text-red-500"
            title="Disconnect workspace"
          >
            <X size={11} />
          </button>

          {agentMode && (
            <>
              <span className="mx-1 text-[var(--border)]">·</span>
              <button
                onClick={() => setAutoAcceptEdits(!autoAcceptEdits)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-full border transition-colors ${
                  autoAcceptEdits
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-500'
                    : 'border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
                title={
                  autoAcceptEdits
                    ? 'Auto-accept on — edits applied without prompting'
                    : 'Auto-accept off — every edit shows a diff to accept/reject'
                }
              >
                <Zap size={11} /> Accept edits: {autoAcceptEdits ? 'auto' : 'ask'}
              </button>
              <button
                onClick={() => setShowAcceptInfo(true)}
                className="p-0.5 rounded-full text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                title="What does this do?"
              >
                <Info size={11} />
              </button>
            </>
          )}
        </>
      ) : (
        <button
          onClick={onPick}
          className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-dashed border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--primary)]/40 transition-colors"
        >
          <Folder size={11} /> Connect a workspace folder for code edits
        </button>
      )}

      <InfoModal
        open={showAcceptInfo}
        title="How edits work"
        secondaryLabel="Got it"
        onClose={() => setShowAcceptInfo(false)}
      >
        <p className="mb-2">
          When the agent edits a file, the change is{' '}
          <span className="text-[var(--foreground)] font-medium">staged on disk</span> and a diff
          panel opens with Accept / Reject buttons.
        </p>
        <p className="mb-2">
          <span className="text-[var(--foreground)]">Accept</span> keeps the new content and runs LSP
          diagnostics. <span className="text-[var(--foreground)]">Reject</span> restores the
          original file.
        </p>
        <p className="mb-2">
          <span className="text-[var(--foreground)]">Auto-accept</span> mode skips the prompt and
          applies edits immediately. Use it for trusted refactors. Switch back to{' '}
          <span className="text-[var(--foreground)]">ask</span> when in doubt — every edit can still
          be undone via git.
        </p>
        <p className="text-xs text-[var(--muted-foreground)]">
          Edits never delete files. Reject restores prior content from the in-memory snapshot.
        </p>
      </InfoModal>
    </div>
  );
}
