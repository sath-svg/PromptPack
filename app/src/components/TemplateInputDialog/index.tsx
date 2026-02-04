import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Copy } from 'lucide-react';

interface TemplateInputDialogProps {
  variables: string[];
  onSubmit: (values: Record<string, string>) => void;
  onClose: () => void;
}

export function TemplateInputDialog({
  variables,
  onSubmit,
  onClose,
}: TemplateInputDialogProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    variables.forEach((v) => (initial[v] = ''));
    return initial;
  });

  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus first input on mount
    firstInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape, true); // capture phase
    return () => window.removeEventListener('keydown', handleEscape, true);
  }, [onClose]);

  const handleSubmit = () => {
    onSubmit(values);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[var(--card)] rounded-xl shadow-xl border border-[var(--border)]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Fill in variables
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--accent)] text-[var(--muted-foreground)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="p-4 space-y-4" onKeyDown={handleKeyDown}>
          {variables.map((varName, index) => (
            <div key={varName}>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                {varName}
              </label>
              <input
                ref={index === 0 ? firstInputRef : undefined}
                type="text"
                value={values[varName]}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [varName]: e.target.value }))
                }
                placeholder={`Enter ${varName}...`}
                className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
            </div>
          ))}
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
            onClick={handleSubmit}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 transition-opacity"
          >
            <Copy size={16} />
            <span>Copy & Close</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
