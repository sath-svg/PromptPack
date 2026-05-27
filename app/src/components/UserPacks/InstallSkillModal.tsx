import { useState } from 'react';
import {
  X,
  FolderOpen,
  Check,
  AlertCircle,
  Loader2,
  Copy,
  Palette,
  GitBranch,
  Package,
} from 'lucide-react';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import {
  mkdir,
  exists,
  writeTextFile,
  readTextFile,
} from '@tauri-apps/plugin-fs';
import {
  generateSkill,
  type SkillTarget,
  type SkillKind,
} from '../../lib/workflowExporter';
import type { UserPack, PackKind } from '../../stores/syncStore';

interface InstallSkillModalProps {
  pack: UserPack;
  prompts: Array<{ text: string; header?: string }>;
  /** Called when the user picks a kind in the modal — wires through to the
   *  cloud-backed updateUserPackKind action so the choice persists. */
  onKindChange: (kind: PackKind) => void;
  onClose: () => void;
}

interface TargetOption {
  id: SkillTarget;
  label: string;
  pathHint: string;
  blurb: string;
}

const TARGETS: TargetOption[] = [
  {
    id: 'claude-code',
    label: 'Claude Code',
    pathHint: '.claude/skills/',
    blurb: "Claude Code's skill folder. SKILL.md with YAML frontmatter.",
  },
  {
    id: 'cursor',
    label: 'Cursor',
    pathHint: '.cursor/rules/',
    blurb: 'Cursor MDC rules. Description + globs frontmatter.',
  },
  {
    id: 'codex',
    label: 'Codex / AGENTS.md',
    pathHint: 'AGENTS.md (root)',
    blurb:
      'Generic AGENTS.md at project root for OpenAI Codex CLI and any tool that reads AGENTS.md.',
  },
];

interface KindOption {
  id: PackKind;
  label: string;
  description: string;
  Icon: typeof GitBranch;
}

const KINDS: KindOption[] = [
  {
    id: 'flow',
    label: 'Workflow',
    description: 'Sequential chain — each prompt feeds the next.',
    Icon: GitBranch,
  },
  {
    id: 'folder',
    label: 'Folder',
    description: 'Each prompt becomes its own independent skill.',
    Icon: Package,
  },
  {
    id: 'preset',
    label: 'Preset',
    description: 'Style preset → Leonardo.AI for images, Higgsfield for video.',
    Icon: Palette,
  },
];

/**
 * Join a base directory and a forward-slash relative path. Detects whether
 * the base uses Windows (`\`) or Unix (`/`) separators and rewrites the
 * relative path accordingly. Forward-slash relative paths come from
 * `generateSkill()`.
 */
function joinPath(base: string, rel: string): string {
  const sep = base.includes('\\') && !base.includes('/') ? '\\' : '/';
  const normalized = sep === '\\' ? rel.replace(/\//g, '\\') : rel;
  const trimmedBase = base.replace(/[\\/]+$/, '');
  return `${trimmedBase}${sep}${normalized}`;
}

/** Return the parent dir of an absolute path, preserving separator style. */
function dirnameOf(p: string): string {
  const lastSlash = Math.max(p.lastIndexOf('/'), p.lastIndexOf('\\'));
  return lastSlash > 0 ? p.slice(0, lastSlash) : p;
}

export function InstallSkillModal({
  pack,
  prompts,
  onKindChange,
  onClose,
}: InstallSkillModalProps) {
  const currentKind: PackKind = pack.kind ?? 'flow';
  const [target, setTarget] = useState<SkillTarget>('claude-code');
  const [isInstalling, setIsInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [installedPaths, setInstalledPaths] = useState<string[]>([]);
  const [copiedPaths, setCopiedPaths] = useState(false);

  // All three kinds (flow / folder / preset) are now installable as skills.
  const installable = true;

  const handleInstall = async () => {
    if (prompts.length === 0) {
      setError('Pack has no prompts to install.');
      return;
    }

    setIsInstalling(true);
    setError(null);
    setInstalledPaths([]);

    try {
      const projectDir = await openDialog({
        directory: true,
        title: 'Select your project folder to install the skill',
      });

      if (!projectDir) {
        setIsInstalling(false);
        return;
      }

      const files = generateSkill({
        target,
        kind: currentKind as SkillKind,
        packTitle: pack.title,
        packDescription: pack.description,
        prompts,
      });

      const writtenPaths: string[] = [];

      for (const file of files) {
        const fullPath = joinPath(projectDir, file.relativePath);
        const parent = dirnameOf(fullPath);

        if (!(await exists(parent))) {
          await mkdir(parent, { recursive: true });
        }

        const fileExists = await exists(fullPath);
        if (file.appendIfExists && fileExists) {
          // AGENTS.md flow install — append new section with separator
          const existing = await readTextFile(fullPath);
          const separator =
            existing.endsWith('\n\n') ? '' : existing.endsWith('\n') ? '\n' : '\n\n';
          await writeTextFile(fullPath, existing + separator + file.contents);
        } else {
          await writeTextFile(fullPath, file.contents);
        }

        writtenPaths.push(fullPath);
      }

      setInstalledPaths(writtenPaths);
    } catch (err) {
      console.error('Install skill failed:', err);
      setError(err instanceof Error ? err.message : 'Install failed.');
    } finally {
      setIsInstalling(false);
    }
  };

  const handleCopyPaths = async () => {
    try {
      await navigator.clipboard.writeText(installedPaths.join('\n'));
      setCopiedPaths(true);
      setTimeout(() => setCopiedPaths(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{pack.icon || '📦'}</span>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Install Skill
              </h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                {pack.title} · {prompts.length} prompt{prompts.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-5">
          {/* Kind selector */}
          <section>
            <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-2">
              Skill kind
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {KINDS.map((k) => {
                const active = currentKind === k.id;
                const Icon = k.Icon;
                return (
                  <button
                    key={k.id}
                    onClick={() => onKindChange(k.id)}
                    className={`flex flex-col items-start gap-1 p-3 rounded-lg border text-left transition-colors ${
                      active
                        ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--foreground)]'
                        : 'border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]/40 hover:text-[var(--foreground)]'
                    }`}
                  >
                    <Icon size={16} />
                    <span className="text-sm font-medium">{k.label}</span>
                    <span className="text-[10px] leading-tight">{k.description}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Preset banner — informational only; preset packs install just
              like flow / folder, but each child wires a generation surface
              to a visual AI tool (Seedance, GPT-Image-1, Nanobanana,
              Higgsfield) with an HTML→JPG fallback. */}
          {currentKind === 'preset' && (
            <section className="rounded-lg border border-[var(--border)] bg-[var(--accent)]/30 p-3">
              <div className="flex items-start gap-3">
                <Palette size={16} className="text-[var(--primary)] mt-0.5" />
                <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                  Catalog + 1 skill per surface (image · video · character ·
                  setting · mood).<br/>
                  Images → <strong>Leonardo.AI</strong>{' '}
                  (Flux / SDXL / Phoenix / Kino XL). 
                  <br/>Video →{' '}
                  <strong>Higgsfield</strong>. <br/>
                  Fallback: HTML→JPG render.
                </p>
              </div>
            </section>
          )}

          {/* Target picker + per-kind hints (shown for every kind, preset included) */}
          {(
            <>
              {/* Target picker */}
              <section>
                <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-2">
                  Target app
                </h3>
                <div className="space-y-2">
                  {TARGETS.map((t) => {
                    const active = target === t.id;
                    return (
                      <label
                        key={t.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          active
                            ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                            : 'border-[var(--border)] hover:bg-[var(--accent)]/40'
                        }`}
                      >
                        <input
                          type="radio"
                          name="install-target"
                          value={t.id}
                          checked={active}
                          onChange={() => setTarget(t.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-sm font-medium text-[var(--foreground)]">
                              {t.label}
                            </span>
                            <code className="text-[10px] text-[var(--muted-foreground)] truncate">
                              {t.pathHint}
                            </code>
                          </div>
                          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                            {t.blurb}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </section>

              {/* Per-target / per-kind heads-up */}
              {target === 'codex' && currentKind === 'flow' && (
                <p className="text-xs text-[var(--muted-foreground)] flex items-start gap-2">
                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                  Existing <code>AGENTS.md</code> will be appended to, not overwritten.
                </p>
              )}
              {(currentKind === 'folder' || currentKind === 'preset') && (
                <p className="text-xs text-[var(--muted-foreground)] flex items-start gap-2">
                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                  {currentKind === 'folder' ? 'Folder' : 'Preset'} kind writes{' '}
                  <strong>{prompts.length + 1}</strong> files — 1 parent catalog
                  + 1 per {currentKind === 'folder' ? 'prompt' : 'surface'}.
                </p>
              )}
            </>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600 flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success: paths written */}
          {installedPaths.length > 0 && (
            <div className="rounded-lg border border-green-500/40 bg-green-500/10 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-700 flex items-center gap-2">
                  <Check size={16} />
                  Wrote {installedPaths.length} file
                  {installedPaths.length === 1 ? '' : 's'}
                </span>
                <button
                  onClick={handleCopyPaths}
                  className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  {copiedPaths ? <Check size={12} /> : <Copy size={12} />}
                  {copiedPaths ? 'Copied' : 'Copy paths'}
                </button>
              </div>
              <pre className="text-[10px] text-[var(--muted-foreground)] whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
                {installedPaths.join('\n')}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-[var(--border)]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            {installedPaths.length > 0 ? 'Done' : 'Cancel'}
          </button>
          {installable && (
            <button
              onClick={handleInstall}
              disabled={isInstalling || prompts.length === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:opacity-90 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isInstalling ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Installing…
                </>
              ) : (
                <>
                  <FolderOpen size={16} />
                  Pick folder & install
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
