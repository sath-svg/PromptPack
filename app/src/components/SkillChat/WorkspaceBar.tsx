import { useCallback, useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Folder, FolderOpen, X, Info, Zap, BookOpen, RotateCw, Cloud, Loader2 } from 'lucide-react';
import { useAgentStore } from '../../stores/agentStore';
import { useChatStore } from '../../stores/chatStore';
import { useSyncStore } from '../../stores/syncStore';
import { syncAllPacksToWorkspace } from '../../lib/workspaceWorkflowSync';
import type { PackForSkill } from '../../lib/claudeSkillEncoder';
import { InfoModal } from '../Common/InfoModal';

export function WorkspaceBar() {
  const {
    workspace,
    pickWorkspace,
    clearWorkspace,
    autoAcceptEdits,
    setAutoAcceptEdits,
    setRunActive,
  } = useAgentStore();
  const { agentMode, setAgentMode } = useChatStore();
  const {
    userPacks,
    loadedUserPacks,
    fetchUserPackPrompts,
  } = useSyncStore();
  const [showAcceptInfo, setShowAcceptInfo] = useState(false);
  const [syncStatus, setSyncStatus] = useState<
    | { state: 'idle' }
    | { state: 'syncing'; current: number; total: number }
    | { state: 'done'; written: number; failed: number; ts: number }
  >({ state: 'idle' });

  // Pull every USER pack out of the sync store, write each as a Claude
  // Skill .md file at .skillset/<slug>.md. One-way: cloud → workspace.
  //
  // We deliberately SKIP `cloudPacks` ("saved-from-X" buckets the
  // extension auto-fills with prompts the user captured while using
  // ChatGPT / Claude / Gemini / etc.). Those are flat prompt dumps,
  // not curated skill workflows — rendering them as numbered "Step N"
  // sections produces a Frankenstein file that doesn't match any
  // useful skill shape. Only the user's intentionally-authored
  // `userPacks` (with title + ordered prompts) become skills.
  const refreshSkillsetsFromCloud = useCallback(async () => {
    if (!workspace) return;
    const targets: Array<{ id: string; title: string; description?: string }> =
      userPacks.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
      }));
    setSyncStatus({ state: 'syncing', current: 0, total: targets.length });
    const packsForSkill: PackForSkill[] = [];
    let i = 0;
    for (const target of targets) {
      i += 1;
      setSyncStatus({ state: 'syncing', current: i, total: targets.length });
      const userPack = userPacks.find((p) => p.id === target.id);
      if (!userPack) continue;
      let loaded: { prompts: { text: string; header?: string; url?: string; createdAt: number }[] } | undefined =
        loadedUserPacks[target.id];
      if (!loaded) {
        loaded =
          (await fetchUserPackPrompts(userPack).catch(() => null)) ?? undefined;
      }
      if (loaded?.prompts?.length) {
        packsForSkill.push({
          title: target.title,
          description: target.description,
          prompts: loaded.prompts,
        });
      }
    }
    const result = await syncAllPacksToWorkspace(workspace, packsForSkill);
    setSyncStatus({
      state: 'done',
      written: result.written.length,
      failed: result.failed.length,
      ts: Date.now(),
    });
    // Settle back to idle after a brief display so the chip doesn't
    // permanently report stale numbers.
    setTimeout(() => setSyncStatus({ state: 'idle' }), 4000);
  }, [
    workspace,
    userPacks,
    loadedUserPacks,
    fetchUserPackPrompts,
  ]);
  // null = no skillset.md in workspace root.
  // string = filename that was loaded ('skillset.md' or '.skillset.md').
  // Used in the chip tooltip so the user knows EXACTLY which file is in
  // play — separate from the `.skillset/` folder, which holds workflow
  // sync artifacts (a different feature; not what "Skill loaded" means).
  const [skillsetLoadedPath, setSkillsetLoadedPath] = useState<string | null>(null);

  // Probe the workspace for skillset.md / .skillset.md so the user sees a
  // visible "Skill loaded ✓" affordance — confirms the project rules are
  // wired into Set Runs. Computed at render via useEffect, not stored in
  // agentStore (chatStore.runPack re-reads on every run; any cache here
  // would only desync). Pure observability surface.
  const probeSkillset = useCallback(async () => {
    if (!workspace) {
      setSkillsetLoadedPath(null);
      return;
    }
    for (const candidate of ['skillset.md', '.skillset.md']) {
      try {
        const result = await invoke<{ content: string }>('agent_read', {
          workspace,
          path: candidate,
        });
        if (result?.content?.trim()) {
          setSkillsetLoadedPath(candidate);
          return;
        }
      } catch {
        /* try next candidate */
      }
    }
    setSkillsetLoadedPath(null);
  }, [workspace]);

  useEffect(() => {
    void probeSkillset();
  }, [probeSkillset]);

  // Auto-sync cloud → workspace on first mount of a workspace. Mirrors
  // what the user gets from clicking the "Refresh skills" button, but
  // fires automatically the first time a fresh workspace becomes
  // available. Idempotent — overwrites `.skillset/*.md` from cloud.
  // Tracked via ref (not state) so the deduping doesn't trigger
  // re-renders of the entire bar.
  const lastAutoSyncedWorkspace = useRef<string | null>(null);
  useEffect(() => {
    if (!workspace) return;
    if (lastAutoSyncedWorkspace.current === workspace) return;
    lastAutoSyncedWorkspace.current = workspace;
    void (async () => {
      await refreshSkillsetsFromCloud();
      await probeSkillset();
    })();
    // refreshSkillsetsFromCloud + probeSkillset are stable refs via
    // useCallback; the workspace-change effect is the real trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace]);

  // Agent mode is now derived from workspace presence — no manual toggle.
  // Workspace selected ⇒ tools enabled. Workspace cleared ⇒ tools off.
  // Keeps the surface focused: the user's only decision is "do I want
  // Skillset to touch my filesystem?", expressed via picking a folder.
  useEffect(() => {
    setAgentMode(Boolean(workspace));
  }, [workspace, setAgentMode]);

  const onPick = async () => {
    await pickWorkspace();
  };

  const display = workspace
    ? workspace.length > 50
      ? '…' + workspace.slice(-47)
      : workspace
    : null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
      {workspace ? (
        <>
          <span className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
            <FolderOpen size={11} className="text-[var(--primary)]" />
            <span style={{ fontFamily: 'var(--font-mono)' }}>{display}</span>
          </span>
          <button
            onClick={onPick}
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] underline"
          >
            change
          </button>
          <button
            onClick={clearWorkspace}
            className="text-[var(--muted-foreground)] hover:text-red-500"
            title="Disconnect workspace"
          >
            <X size={11} />
          </button>

          {agentMode && (
            <>
              <span className="mx-1 text-[var(--border)]">·</span>
              {setRunActive ? (
                <span
                  className="flex items-center gap-1.5 px-2 py-1 rounded-full border bg-amber-500/10 border-amber-500/40 text-amber-500 cursor-not-allowed"
                  title="Auto-accept is active for the duration of this Set Run. Your saved preference will be restored when the run finishes."
                >
                  <Zap size={11} /> Auto-accept active for Set Run
                </span>
              ) : (
                <button
                  onClick={() => setAutoAcceptEdits(!autoAcceptEdits)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-full border transition-colors ${
                    autoAcceptEdits
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-500'
                      : 'border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
                  title={
                    autoAcceptEdits
                      ? 'Auto-accept on — edits applied without prompting'
                      : 'Auto-accept off — every edit shows a diff to accept/reject'
                  }
                >
                  <Zap size={11} /> Accept edits: {autoAcceptEdits ? 'auto' : 'ask'}
                </button>
              )}
              <button
                onClick={() => setShowAcceptInfo(true)}
                className="p-0.5 rounded-full text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                title="What does this do?"
              >
                <Info size={11} />
              </button>

              {/* Combined skills indicator + refresh button.
                  Status text reflects the latest state:
                    - idle + skillset.md loaded: "Skill loaded" (emerald)
                    - idle + no skillset.md:     "Skills" (muted)
                    - syncing:                   "Syncing N/M" (muted)
                    - done OK:                   "Synced K skills" (emerald)
                    - done with failures:        "K ok, F failed" (amber)
                  Click triggers BOTH:
                    1. refreshSkillsetsFromCloud() — pull every pack from
                       cloud and write each as .skillset/<slug>.md
                    2. probeSkillset() — re-read workspace skillset.md so
                       the loaded indicator reflects the latest file. */}
              <span className="mx-1 text-[var(--border)]">·</span>
              <button
                onClick={async () => {
                  await refreshSkillsetsFromCloud();
                  await probeSkillset();
                }}
                disabled={syncStatus.state === 'syncing'}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-full border transition-colors ${
                  syncStatus.state === 'done' && syncStatus.failed > 0
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-500'
                    : syncStatus.state === 'done' && syncStatus.failed === 0
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-500'
                      : skillsetLoadedPath
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-500'
                        : 'border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                } disabled:opacity-60`}
                title={
                  (skillsetLoadedPath
                    ? `Workspace skillset loaded: \`${skillsetLoadedPath}\`.\n\n`
                    : 'No `skillset.md` in workspace root yet.\n\n') +
                  'Click to: pull every cloud + user pack and write each as ' +
                  '`.skillset/<slug>.md`, then re-read `skillset.md` from the ' +
                  'workspace root. One-way: cloud → workspace. Existing ' +
                  '`.skillset/<slug>.md` files are overwritten.'
                }
              >
                {syncStatus.state === 'syncing' ? (
                  <>
                    <Loader2 size={11} className="animate-spin" /> Syncing{' '}
                    {syncStatus.current}/{syncStatus.total}
                  </>
                ) : syncStatus.state === 'done' ? (
                  <>
                    <Cloud size={11} />{' '}
                    {syncStatus.failed === 0
                      ? 'Synced'
                      : `${syncStatus.failed} failed`}
                  </>
                ) : skillsetLoadedPath ? (
                  <>
                    <BookOpen size={11} /> Skill loaded
                    <RotateCw size={10} className="opacity-60" />
                  </>
                ) : (
                  <>
                    <Cloud size={11} /> Refresh skills
                  </>
                )}
              </button>
            </>
          )}
        </>
      ) : (
        <button
          onClick={onPick}
          className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-dashed border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--primary)]/40 transition-colors"
        >
          <Folder size={11} /> Connect a workspace folder for code edits
        </button>
      )}

      <InfoModal
        open={showAcceptInfo}
        title="How edits work"
        secondaryLabel="Got it"
        onClose={() => setShowAcceptInfo(false)}
      >
        <p className="mb-2">
          When the agent edits a file, the change is{' '}
          <span className="text-[var(--foreground)] font-medium">staged on disk</span> and a diff
          panel opens with Accept / Reject buttons.
        </p>
        <p className="mb-2">
          <span className="text-[var(--foreground)]">Accept</span> keeps the new content and runs LSP
          diagnostics. <span className="text-[var(--foreground)]">Reject</span> restores the
          original file.
        </p>
        <p className="mb-2">
          <span className="text-[var(--foreground)]">Auto-accept</span> mode skips the prompt and
          applies edits immediately. Use it for trusted refactors. Switch back to{' '}
          <span className="text-[var(--foreground)]">ask</span> when in doubt — every edit can still
          be undone via git.
        </p>
        <p className="text-xs text-[var(--muted-foreground)]">
          Edits never delete files. Reject restores prior content from the in-memory snapshot.
        </p>
      </InfoModal>
    </div>
  );
}
