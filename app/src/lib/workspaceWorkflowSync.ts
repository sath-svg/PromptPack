/**
 * Workspace Workflow Sync
 *
 * When a workspace is connected AND a pack is selected, auto-write the
 * pack's Skill Flow workflow to the workspace so the in-workspace agent
 * (Claude Code, IDE assistants, etc.) reads it as a skill.
 *
 * Files written:
 *   <workspace>/.skillset/workflows/<pack-slug>.md   — full Skill Flow chain
 *   <workspace>/Skillset-Flow.md                     — pointer to active workflow
 *
 * Idempotent: rewrites on every call so prompt edits + reordering are
 * reflected immediately.
 */

import { mkdir, writeTextFile, exists, remove } from '@tauri-apps/plugin-fs';
import { generateWorkflow, getSkillDirName } from './workflowExporter';
import { buildClaudeSkill, packSlug, type PackForSkill } from './claudeSkillEncoder';

interface SyncPromptShape {
  text: string;
  header?: string;
}

/**
 * Write pack workflow markdown to workspace.
 *
 * @returns Relative path of written workflow file, or null if skipped.
 */
export async function syncWorkflowToWorkspace(
  workspace: string,
  packTitle: string,
  prompts: SyncPromptShape[]
): Promise<string | null> {
  if (!workspace || !packTitle || prompts.length === 0) return null;

  const slug = getSkillDirName(packTitle);
  // Normalize Windows backslashes — Tauri's fs plugin accepts forward slashes
  const root = workspace.replace(/\\/g, '/');
  const dir = `${root}/.skillset`;
  // Single canonical path — same as the bulk-sync target so the
  // currently-selected pack and the cloud refresh write to the same
  // file (last write wins; they generate the same content). Older
  // builds wrote to `.skillset/workflows/<slug>.md` + a root pointer
  // `Skillset-Flow.md`; both are cleaned up by `purgeLegacyArtifacts`
  // below so workspaces don't end up with duplicate files.
  const filePath = `${dir}/${slug}.md`;

  try {
    try {
      await mkdir(dir, { recursive: true });
    } catch {
      // Already exists or permission issue — try to write anyway
    }
    const content = generateWorkflow({
      format: 'claude-skill',
      packTitle,
      prompts,
    });
    await writeTextFile(filePath, content);
    // Best-effort: prune the legacy `workflows/` subdir + pointer if
    // they exist from an older build. Failures swallowed — purely
    // tidy-up.
    void purgeLegacyArtifacts(root);
    return `.skillset/${slug}.md`;
  } catch (err) {
    console.error('[workspaceWorkflowSync] write failed:', err);
    return null;
  }
}

/**
 * Remove the legacy `.skillset/workflows/` subdir + `Skillset-Flow.md`
 * root pointer left behind by older builds. Safe to call repeatedly.
 * Newer builds write per-pack `.md` directly under `.skillset/` —
 * the subdir + pointer are redundant and surface as confusing
 * duplicate files in the user's workspace listing.
 */
async function purgeLegacyArtifacts(normalizedRoot: string): Promise<void> {
  const workflowsDir = `${normalizedRoot}/.skillset/workflows`;
  const pointerPath = `${normalizedRoot}/Skillset-Flow.md`;
  try {
    if (await exists(workflowsDir)) {
      await remove(workflowsDir, { recursive: true });
    }
  } catch {
    /* tidy-up only */
  }
  try {
    if (await exists(pointerPath)) {
      await remove(pointerPath);
    }
  } catch {
    /* tidy-up only */
  }
}

/**
 * Optional: remove pointer + workflow when pack deselected (keeps
 * workspace clean). Workflow files in .skillset/workflows/ persist
 * unless explicitly cleared.
 */
export async function clearWorkflowPointer(workspace: string): Promise<void> {
  if (!workspace) return;
  const root = workspace.replace(/\\/g, '/');
  const pointerPath = `${root}/Skillset-Flow.md`;
  try {
    if (await exists(pointerPath)) {
      // Write an "inactive" marker rather than deleting — gives agents a clean signal
      await writeTextFile(
        pointerPath,
        '# Skillset-Flow\n\nNo active workflow. Select a Skillset pack in the desktop app to populate this file.\n'
      );
    }
  } catch {
    // ignore
  }
}

/**
 * Remove ALL Skillset-managed artifacts from a workspace on disconnect.
 * Leaves no traces.
 *
 * Removes:
 *   <workspace>/SKILLSET.md       (generic project doc)
 *   <workspace>/Skillset-Flow.md  (active workflow pointer)
 *   <workspace>/.skillset/        (workflows dir + any future artifacts)
 */
export async function removeWorkflowArtifacts(workspace: string): Promise<void> {
  if (!workspace) return;
  const root = workspace.replace(/\\/g, '/');

  const targets = [
    { path: `${root}/SKILLSET.md`, label: 'SKILLSET.md' },
    { path: `${root}/Skillset-Flow.md`, label: 'Skillset-Flow.md' },
  ];

  for (const t of targets) {
    try {
      if (await exists(t.path)) {
        await remove(t.path);
      }
    } catch (err) {
      console.error(`[workspaceWorkflowSync] failed to remove ${t.label}:`, err);
    }
  }

  // Remove .skillset/ dir recursively
  const skillsetDir = `${root}/.skillset`;
  try {
    if (await exists(skillsetDir)) {
      await remove(skillsetDir, { recursive: true });
    }
  } catch (err) {
    console.error('[workspaceWorkflowSync] failed to remove .skillset dir:', err);
  }
}

/**
 * One-way bulk sync: write every loaded pack as a Claude Skill markdown
 * file at `<workspace>/.skillset/<slug>.md`. Existing files at those
 * paths are overwritten (cloud is the source of truth — user edits are
 * not preserved). Called from the WorkspaceBar "refresh skillsets"
 * button. Idempotent; safe to re-run.
 *
 * Returns `{ written: string[], failed: Array<{ slug, reason }> }` so
 * the caller can surface a toast.
 */
export interface BulkSyncResult {
  written: string[];
  failed: Array<{ slug: string; reason: string }>;
}

export async function syncAllPacksToWorkspace(
  workspace: string,
  packs: PackForSkill[],
): Promise<BulkSyncResult> {
  const result: BulkSyncResult = { written: [], failed: [] };
  if (!workspace) return result;
  const root = workspace.replace(/\\/g, '/');
  const dir = `${root}/.skillset`;
  try {
    await mkdir(dir, { recursive: true });
  } catch {
    /* may already exist — proceed */
  }
  for (const pack of packs) {
    if (!pack.title || pack.prompts.length === 0) continue;
    const slug = packSlug(pack.title);
    const filePath = `${dir}/${slug}.md`;
    try {
      const content = buildClaudeSkill(pack);
      await writeTextFile(filePath, content);
      result.written.push(`.skillset/${slug}.md`);
    } catch (err) {
      result.failed.push({
        slug,
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return result;
}

// `buildPointerMarkdown` removed — older builds wrote a root-level
// `Skillset-Flow.md` pointer alongside `.skillset/workflows/<slug>.md`.
// Newer builds write each pack as a single `.skillset/<slug>.md`
// (Claude-skill format), and `purgeLegacyArtifacts` cleans up the
// pointer + subdir on every sync. The pointer is no longer needed.
