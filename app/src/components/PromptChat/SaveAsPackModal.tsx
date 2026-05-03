import { useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { useSyncStore, type CloudPrompt } from '../../stores/syncStore';
import { useAuthStore } from '../../stores/authStore';
import { InfoModal } from '../Common/InfoModal';

interface SaveAsPackModalProps {
  open: boolean;
  promptText: string;
  onClose: () => void;
}

// Lets the user persist a finished prompt as a single-prompt skill pack
// so they can run it again later without retyping. Title required;
// header optional. Uses the existing syncStore.createUserPack flow.
export function SaveAsPackModal({ open, promptText, onClose }: SaveAsPackModalProps) {
  const session = useAuthStore((s) => s.session);
  const createUserPack = useSyncStore((s) => s.createUserPack);

  const [title, setTitle] = useState('');
  const [header, setHeader] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!session?.user_id) {
      setError('Sign in to save skills.');
      return;
    }
    if (!title.trim()) {
      setError('Title required.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const prompt: CloudPrompt = {
        text: promptText,
        header: header.trim() || undefined,
        createdAt: Date.now(),
      };
      const pack = await createUserPack(session.user_id, title.trim(), [prompt]);
      if (!pack) {
        setError('Failed to save. Pack limit reached?');
        return;
      }
      setTitle('');
      setHeader('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <InfoModal
      open={open}
      title="Save as a Skill"
      primaryLabel={busy ? 'Saving…' : 'Save'}
      secondaryLabel="Cancel"
      onPrimary={handleSave}
      onClose={onClose}
    >
      <div className="space-y-3">
        <div>
          <label className="block text-xs uppercase tracking-wider text-[var(--muted-foreground)] mb-1">
            Skill title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Stock Analysis Plan"
            className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-[var(--muted-foreground)] mb-1">
            Header (optional)
          </label>
          <input
            type="text"
            value={header}
            onChange={(e) => setHeader(e.target.value)}
            placeholder="Short label shown above the prompt"
            className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-[var(--muted-foreground)] mb-1">
            Prompt
          </label>
          <pre
            className="w-full max-h-32 overflow-y-auto px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--muted-foreground)] whitespace-pre-wrap break-words"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {promptText}
          </pre>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        {busy && (
          <p className="text-xs text-[var(--muted-foreground)] flex items-center gap-1.5">
            <Loader2 size={11} className="animate-spin" /> Encoding pack and uploading…
          </p>
        )}
        {!busy && (
          <p className="text-[10px] text-[var(--muted-foreground)] flex items-center gap-1">
            <Save size={10} /> Saved skills appear in "Your Prompt Packs" and can be re-run from this
            chat at any time.
          </p>
        )}
      </div>
    </InfoModal>
  );
}
