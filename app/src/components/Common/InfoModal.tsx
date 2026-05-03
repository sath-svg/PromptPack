import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface InfoModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  primaryLabel?: string;
  secondaryLabel?: string;
  onPrimary?: () => void;
  onClose: () => void;
}

export function InfoModal({
  open,
  title,
  children,
  primaryLabel,
  secondaryLabel = 'Cancel',
  onPrimary,
  onClose,
}: InfoModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-[440px] max-w-[90vw] rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">{title}</h3>
          <button
            onClick={onClose}
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            <X size={14} />
          </button>
        </div>
        <div className="px-4 py-4 text-sm text-[var(--muted-foreground)] leading-relaxed">
          {children}
        </div>
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[var(--border)]">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md text-sm text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] transition-colors"
          >
            {secondaryLabel}
          </button>
          {primaryLabel && (
            <button
              onClick={() => {
                onPrimary?.();
                onClose();
              }}
              className="px-3 py-1.5 rounded-md text-sm bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
            >
              {primaryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
