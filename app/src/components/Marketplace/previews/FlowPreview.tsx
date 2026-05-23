import { GitBranch } from 'lucide-react';
import type { FlowPreview } from '../../../stores/marketplaceStore';

interface Props {
  preview?: FlowPreview;
  promptCount: number;
}

export function FlowPreviewPanel({ preview, promptCount }: Props) {
  const stepCount = preview?.stepCount ?? promptCount;
  const labels = preview?.stepLabels ?? [];
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="flex items-center gap-2 mb-4">
        <GitBranch size={16} className="text-[var(--primary)]" />
        <h4 className="font-medium text-[var(--foreground)]">Flow steps</h4>
        <span className="ml-auto text-xs text-[var(--muted-foreground)]">
          {stepCount} step{stepCount !== 1 ? 's' : ''}
        </span>
      </div>
      {labels.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">
          {stepCount} chained step{stepCount !== 1 ? 's' : ''}. Step labels hidden until purchase.
        </p>
      ) : (
        <ol className="space-y-2">
          {labels.map((label, i) => (
            <li
              key={i}
              className="flex items-start gap-3 text-sm text-[var(--foreground)]"
            >
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-xs font-medium text-[var(--primary)]">
                {i + 1}
              </span>
              <span className="leading-6">{label}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
