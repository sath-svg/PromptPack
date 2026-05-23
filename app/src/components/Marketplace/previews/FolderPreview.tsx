import { Package } from 'lucide-react';
import type { FolderPreview } from '../../../stores/marketplaceStore';

interface Props {
  preview?: FolderPreview;
  promptCount: number;
}

export function FolderPreviewPanel({ preview, promptCount }: Props) {
  const headers = preview?.promptHeaders ?? [];
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="flex items-center gap-2 mb-4">
        <Package size={16} className="text-[var(--primary)]" />
        <h4 className="font-medium text-[var(--foreground)]">Skillset contents</h4>
        <span className="ml-auto text-xs text-[var(--muted-foreground)]">
          {promptCount} prompt{promptCount !== 1 ? 's' : ''}
        </span>
      </div>
      {headers.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">
          {promptCount} prompt{promptCount !== 1 ? 's' : ''}. Headers hidden until purchase.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {headers.map((h, i) => (
            <li
              key={i}
              className="flex items-start gap-3 text-sm text-[var(--foreground)]"
            >
              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--primary)]" />
              <span>{h}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
