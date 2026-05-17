import { useState } from 'react';
import { Paperclip, X, FileText } from 'lucide-react';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { useAgentStore } from '../../stores/agentStore';
import { useNotificationStore } from '../../stores/notificationStore';

// Picks files via native dialog and copies them into
// <workspace>/.skillset-attachments/. The user message is annotated with
// a tooltip note so the user can reference the saved paths in future
// messages without re-attaching.

export function AttachmentBar() {
  const workspace = useAgentStore((s) => s.workspace);
  const attachments = useAgentStore((s) => s.attachments);
  const attachFiles = useAgentStore((s) => s.attachFiles);
  const removeAttachment = useAgentStore((s) => s.removeAttachment);

  const [busy, setBusy] = useState(false);
  const [pickerError, setPickerError] = useState<string | null>(null);

  const handleAttachClick = async () => {
    if (!workspace || busy) return;
    setPickerError(null);
    setBusy(true);
    try {
      const picked = await openDialog({ multiple: true, directory: false });
      if (!picked) return;
      const sources = Array.isArray(picked) ? picked : [picked];
      const res = await attachFiles(sources);
      if (res.failed.length > 0) {
        const names = res.failed.map((p) => p.split(/[\\/]/).pop() ?? p).join(', ');
        setPickerError(`${res.failed.length} file(s) failed to copy.`);
        useNotificationStore.getState().notify({
          category: 'client',
          severity: 'warning',
          title: "Couldn't attach file",
          message: `${res.failed.length} file(s) failed: ${names}`,
          actions: [{ kind: 'dismiss' }],
          details: `failed=${JSON.stringify(res.failed)} copied=${JSON.stringify(res.copied)}`,
          dedupeKey: 'attach.failed',
          source: 'AttachmentBar.attachFiles',
        });
      }
    } catch (err) {
      useNotificationStore.getState().report(err, {
        source: 'AttachmentBar.attachFiles',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleAttachClick}
        disabled={!workspace || busy}
        title={workspace ? 'Attach files (copied to workspace)' : 'Connect a workspace first'}
        className="p-2 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] disabled:opacity-40 transition-colors"
      >
        <Paperclip size={18} />
      </button>

      {(attachments.length > 0 || pickerError) && (
        <div className="flex flex-wrap items-center gap-1.5 px-3 pt-2 w-full">
          {attachments.map((p) => {
            const name = p.split('/').pop() ?? p;
            return (
              <span
                key={p}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20"
                title={p}
              >
                <FileText size={10} /> {name}
                <button
                  onClick={() => removeAttachment(p)}
                  className="hover:opacity-70"
                  title="Remove"
                >
                  <X size={10} />
                </button>
              </span>
            );
          })}
          {pickerError && (
            <span className="text-xs text-red-500">{pickerError}</span>
          )}
        </div>
      )}
    </>
  );
}
