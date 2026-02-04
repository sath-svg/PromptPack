import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { SOURCE_META } from '../../types';
import type { Prompt, PromptSource } from '../../types';
import { usePromptStore } from '../../stores/promptStore';

interface PromptEditorProps {
  prompt: Prompt | null;
  onClose: () => void;
}

export function PromptEditor({ prompt, onClose }: PromptEditorProps) {
  const { addPrompt, updatePrompt } = usePromptStore();

  const [text, setText] = useState(prompt?.text || '');
  const [header, setHeader] = useState(prompt?.header || '');
  const [source, setSource] = useState<PromptSource>(prompt?.source || 'chatgpt');

  const isEditing = !!prompt;

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSave = () => {
    if (!text.trim()) return;

    if (isEditing && prompt) {
      updatePrompt(prompt.id, {
        text: text.trim(),
        header: header.trim() || undefined,
        source,
      });
    } else {
      const newPrompt: Prompt = {
        id: crypto.randomUUID(),
        text: text.trim(),
        header: header.trim() || undefined,
        source,
        isFavorite: false,
        useCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        syncStatus: 'local-only',
      };
      addPrompt(newPrompt);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-[var(--card)] rounded-xl shadow-xl border border-[var(--border)]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            {isEditing ? 'Edit Prompt' : 'New Prompt'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--accent)] text-[var(--muted-foreground)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="p-4 space-y-4">
          {/* Header/Title */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
              Title (optional)
            </label>
            <input
              type="text"
              value={header}
              onChange={(e) => setHeader(e.target.value)}
              placeholder="Short title for the prompt"
              className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>

          {/* Prompt Text */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
              Prompt
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter your prompt text..."
              rows={8}
              className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none"
            />
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              Use {'{{variable}}'} for template variables
            </p>
          </div>

          {/* Prompt Pack (Source) */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
              Prompt Pack
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as PromptSource)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            >
              {(Object.keys(SOURCE_META) as PromptSource[]).map((s) => (
                <option key={s} value={s}>
                  {SOURCE_META[s].icon} {SOURCE_META[s].label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-[var(--border)]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!text.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            <span>{isEditing ? 'Save Changes' : 'Create Prompt'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
