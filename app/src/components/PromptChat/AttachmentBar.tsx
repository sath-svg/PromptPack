import { useState } from 'react';
import { Paperclip, X, FileText } from 'lucide-react';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { useAgentStore } from '../../stores/agentStore';
import { InfoModal } from '../Common/InfoModal';

// Attachments are copied into <workspace>/.skillset-attachments/ so the
// agent can read them via locally-scoped tools instead of inlining their
// contents into the LLM context. First-use popup explains the move.

const SEEN_KEY = 'skillset.attachments.popupSeen';

export function AttachmentBar() {
  const workspace = useAgentStore((s) => s.workspace);
  const attachments = useAgentStore((s) => s.attachments);
  const attachFiles = useAgentStore((s) => s.attachFiles);
  const removeAttachment = useAgentStore((s) => s.removeAttachment);

  const [showInfo, setShowInfo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pickerError, setPickerError] = useState<string | null>(null);

  const runPicker = async () => {
    setPickerError(null);
    setBusy(true);
    try {
      const picked = await openDialog({ multiple: true, directory: false });
      if (!picked) return;
      const sources = Array.isArray(picked) ? picked : [picked];
      const res = await attachFiles(sources);
      if (res.failed.length > 0) {
        setPickerError(`${res.failed.length} file(s) failed to copy.`);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleAttachClick = () => {
    if (!workspace) return;
    const seen = localStorage.getItem(SEEN_KEY) === '1';
    if (seen) {
      runPicker();
      return;
    }
    setShowInfo(true);
  };

  const handleProceed = () => {
    localStorage.setItem(SEEN_KEY, '1');
    runPicker();
  };

  return (
    <>
      <button
        type="button"
        onClick={handleAttachClick}
        disabled={!workspace || busy}
        title={workspace ? 'Attach files' : 'Connect a workspace first'}
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

      <InfoModal
        open={showInfo}
        title="Attach files to workspace"
        primaryLabel="Continue"
        secondaryLabel="Cancel"
        onPrimary={handleProceed}
        onClose={() => setShowInfo(false)}
      >
        <p className="mb-2">
          Selected files will be <span className="text-[var(--foreground)] font-medium">copied into your workspace folder</span>{' '}
          at <code className="text-[var(--primary)]">.skillset-attachments/</code>.
        </p>
        <p className="mb-2">
          The agent reads them locally with <code>read_file</code> instead of stuffing
          them into every LLM call. Saves tokens, scales to large files, keeps your
          original files untouched.
        </p>
        <p className="text-xs text-[var(--muted-foreground)]">
          Workspace: <code className="text-[var(--foreground)]">{workspace ?? '(none)'}</code>
        </p>
      </InfoModal>
    </>
  );
}
