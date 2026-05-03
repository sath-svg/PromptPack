import { Folder, FolderOpen, X, Wrench } from 'lucide-react';
import { useAgentStore } from '../../stores/agentStore';
import { useChatStore } from '../../stores/chatStore';

export function WorkspaceBar() {
  const { workspace, pickWorkspace, clearWorkspace } = useAgentStore();
  const { agentMode, setAgentMode } = useChatStore();

  const onPick = async () => {
    const picked = await pickWorkspace();
    if (picked) setAgentMode(true);
  };

  const display = workspace
    ? workspace.length > 50
      ? '…' + workspace.slice(-47)
      : workspace
    : null;

  return (
    <div className="flex items-center gap-2 mb-3 text-xs">
      {workspace ? (
        <>
          <button
            onClick={() => setAgentMode(!agentMode)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full border transition-colors ${
              agentMode
                ? 'bg-[var(--primary)]/10 border-[var(--primary)]/40 text-[var(--primary)]'
                : 'border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
            title={agentMode ? 'Agent mode on (tools enabled)' : 'Agent mode off'}
          >
            <Wrench size={11} /> Agent {agentMode ? 'on' : 'off'}
          </button>
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
        </>
      ) : (
        <button
          onClick={onPick}
          className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-dashed border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--primary)]/40 transition-colors"
        >
          <Folder size={11} /> Connect a workspace folder for code edits
        </button>
      )}
    </div>
  );
}
