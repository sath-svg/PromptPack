import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  FileEdit,
  FileText,
  Folder,
  Search,
  Terminal,
  Wrench,
  AlertCircle,
} from 'lucide-react';
import type { MessageBlock } from '../../stores/chatStore';
import { DiffPanel } from './DiffPanel';

const TOOL_ICONS: Record<string, typeof Wrench> = {
  read_file: FileText,
  write_file: FileEdit,
  edit_file: FileEdit,
  list_dir: Folder,
  glob: Search,
  grep: Search,
  bash: Terminal,
  lsp_diagnostics: AlertCircle,
};

interface ToolBlockProps {
  block: MessageBlock;
  // Sibling blocks let us locate the matching tool_result for a tool_use
  resultByToolUseId?: Record<string, MessageBlock>;
}

export function ToolBlock({ block, resultByToolUseId }: ToolBlockProps) {
  const [open, setOpen] = useState(false);

  if (block.kind !== 'tool_use') return null;

  const Icon = TOOL_ICONS[block.name] ?? Wrench;
  const result = resultByToolUseId?.[block.toolUseId];
  const isError = result?.kind === 'tool_result' && result.isError;
  const summary = describeInput(block.name, block.input);

  return (
    <div
      className={`my-1 rounded-lg border ${
        isError ? 'border-red-500/30 bg-red-500/5' : 'border-[var(--border)] bg-[var(--card)]'
      } overflow-hidden`}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[var(--accent)] transition-colors text-left"
      >
        {open ? (
          <ChevronDown size={12} className="text-[var(--muted-foreground)]" />
        ) : (
          <ChevronRight size={12} className="text-[var(--muted-foreground)]" />
        )}
        <Icon size={12} className={isError ? 'text-red-500' : 'text-[var(--primary)]'} />
        <span
          className="text-xs text-[var(--foreground)]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {block.name}
        </span>
        <span className="text-xs text-[var(--muted-foreground)] truncate flex-1">
          {summary}
        </span>
      </button>
      {open && (
        <div className="px-3 pb-2 pt-1 border-t border-[var(--border)] space-y-2">
          {block.name === 'edit_file' || block.name === 'write_file' ? (
            result?.kind === 'tool_result' && result.pendingEditId ? (
              <DiffPanel pendingEditId={result.pendingEditId} />
            ) : null
          ) : null}
          <details>
            <summary
              className="cursor-pointer text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              input
            </summary>
            <pre
              className="text-xs text-[var(--muted-foreground)] mt-1 whitespace-pre-wrap break-words bg-[var(--background)] rounded p-2 max-h-40 overflow-y-auto"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {JSON.stringify(block.input, null, 2)}
            </pre>
          </details>
          {result?.kind === 'tool_result' && (
            <details open>
              <summary
                className="cursor-pointer text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {isError ? 'error' : 'output'}
              </summary>
              <pre
                className={`text-xs mt-1 whitespace-pre-wrap break-words rounded p-2 max-h-60 overflow-y-auto ${
                  isError
                    ? 'text-red-500 bg-red-500/5'
                    : 'text-[var(--foreground)] bg-[var(--background)]'
                }`}
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {result.output}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

function describeInput(name: string, input: Record<string, unknown>): string {
  switch (name) {
    case 'read_file':
    case 'list_dir':
    case 'lsp_diagnostics':
      return String(input.path ?? '');
    case 'write_file':
      return `${input.path} (${(input.content as string | undefined)?.length ?? 0} bytes)`;
    case 'edit_file':
      return `${input.path}`;
    case 'glob':
      return String(input.pattern ?? '');
    case 'grep':
      return `${input.pattern}${input.glob_filter ? ` in ${input.glob_filter}` : ''}`;
    case 'bash':
      return String(input.command ?? '');
    default:
      return JSON.stringify(input).slice(0, 80);
  }
}
