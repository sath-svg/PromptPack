import { useEffect, useRef, useState } from 'react';
import { X, Save, Loader2 } from 'lucide-react';

interface PromptEditModalProps {
  open: boolean;
  title?: string;
  value: string;
  onChange: (v: string) => void;
  /**
   * Invoked when the user clicks Save / hits Ctrl+Enter. May return a
   * promise — the modal disables the Save button + swaps the icon for
   * a spinner until the promise settles. Lets the caller surface
   * cloud-write latency without per-caller plumbing.
   */
  onSave: () => void | Promise<void>;
  onCancel: () => void;
  /**
   * Optional external loading override. When the parent already
   * orchestrates saving status via its own state, pass this in and the
   * modal will reflect it (e.g. for staged batch saves). The internal
   * saving state (set from `onSave` resolving) is OR'd with this.
   */
  saving?: boolean;
}

export function PromptEditModal({
  open,
  title,
  value,
  onChange,
  onSave,
  onCancel,
  saving: externalSaving,
}: PromptEditModalProps) {
  const [internalSaving, setInternalSaving] = useState(false);
  const saving = internalSaving || Boolean(externalSaving);

  // Reset internal state when modal re-opens so a previous error doesn't
  // leave the Save button stuck spinning.
  useEffect(() => {
    if (!open) setInternalSaving(false);
  }, [open]);

  const handleSave = async () => {
    if (saving) return;
    try {
      setInternalSaving(true);
      await onSave();
    } finally {
      setInternalSaving(false);
    }
  };
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    const ta = textareaRef.current;
    if (!ta) return;
    ta.focus();
    const end = ta.value.length;
    ta.setSelectionRange(end, end);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={saving ? undefined : onCancel}
    >
      <div
        className="flex flex-col w-[720px] max-w-[92vw] max-h-[85vh] rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <h3 className="text-sm font-semibold text-[var(--foreground)] truncate">
            {title ? `Edit prompt — ${title}` : 'Edit prompt'}
          </h3>
          <button
            onClick={onCancel}
            disabled={saving}
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-40 disabled:cursor-not-allowed"
            title={saving ? 'Saving…' : 'Close'}
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 min-h-0 px-4 py-3">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={saving}
            onKeyDown={(e) => {
              if (saving) return;
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                void handleSave();
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                onCancel();
              }
            }}
            className="w-full h-full min-h-[60vh] px-3 py-2 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] resize-none font-mono leading-relaxed disabled:opacity-60"
          />
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[var(--border)]">
          <span className="text-xs text-[var(--muted-foreground)] mr-auto">
            {saving ? 'Saving…' : 'Ctrl+Enter to save · Esc to cancel'}
          </span>
          <button
            onClick={onCancel}
            disabled={saving}
            className="px-3 py-1.5 rounded-md text-sm text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={() => void handleSave()}
            disabled={!value.trim() || saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save size={14} />
                Save
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
