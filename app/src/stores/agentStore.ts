// Agent state: workspace root, pending file edits awaiting accept/reject,
// tool-call log, and LSP diagnostics surfaced into the chat panel.
//
// Per-conversation: each Skill Chat conversation gets its own agentStore
// instance via `createAgentStore(convoId)`. The exported `useAgentStore`
// is a router that delegates to the active conversation's instance — see
// the bottom of this file for the wrapper. Cross-store code that knows
// which convo it's operating on should call `getStoresFor(convoId).agent`
// from `./registry.ts` instead of going through the active router.

import { create } from 'zustand';
import type { StoreApi, UseBoundStore } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import {
  lspOpenFile,
  lspGetDiagnostics,
  lspShutdownAll,
  resolveAvailability,
  installServer,
  getServerForFile,
  getServerById,
  type LspAvailability,
  type LspDiagnostic,
} from '../lib/lspClient';
import {
  BOOT_CONVO_ID,
  getActiveConvoId,
  getStoresFor,
  registerAgentFactory,
} from './registry';
import { useConversationsStore } from './conversationsStore';

/**
 * Fire a desktop Notification when the agent stages a write that the
 * user has to approve. Lets long-running pack runs surface the gate
 * even when the Skillset window is in the background.
 *
 * Permission is requested lazily on the first stage. Browsers/Tauri
 * webviews that deny or unsupport Notification silently no-op — the
 * in-app DiffPanel always remains the source of truth for accept/reject.
 */
async function notifyPendingEdit(path: string): Promise<void> {
  if (typeof Notification === 'undefined') return;
  try {
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
    if (Notification.permission !== 'granted') return;
    const filename = path.split(/[\\/]/).pop() ?? path;
    new Notification('Skillset · approval needed', {
      body: `Review changes to ${filename}`,
      tag: 'skillset-pending-edit',
    });
  } catch {
    // Permission flow blocked by the OS / settings. Skip.
  }
}

export interface PendingEdit {
  id: string;
  path: string;
  before: string;
  after: string;
  accepted: boolean | null; // null = pending
  /**
   * `true` = the file on disk still has `before` content; the write
   *          has NOT happened. `acceptEdit` will commit `after` to
   *          disk, `rejectEdit` is a no-op (no revert needed).
   * `false` = the file on disk already has `after` content (auto-accept
   *           mode wrote eagerly). `rejectEdit` re-writes `before` to
   *           revert.
   *
   * The "Accept edits: ask" workspace toggle drives this: ask mode
   * stages true so the user's click is what triggers the actual
   * filesystem write.
   */
  isStaged: boolean;
  /**
   * When set, this is a binary PDF stage. `acceptEdit` calls the Rust
   * `agent_pdf_generate` handler with these args instead of plain
   * `agent_write` (which can't produce binary content). `before` /
   * `after` still hold the markdown source for the diff preview.
   */
  pdfPayload?: { content: string; title?: string };
  diagnostics?: LspDiagnostic[];
  createdAt: number;
  /**
   * Orchestrator subtask that produced this edit. Set when the edit is
   * staged from inside a Set Run; undefined for ad-hoc single-shot
   * agent turns. Used by the executor's per-dep barrier to wait only
   * on edits produced by declared dependencies — preserves DAG
   * fan-out for genuinely independent subtasks.
   */
  sourceSubtaskId?: string;
}

export interface ToolCallRecord {
  id: string;
  name: string;
  input: Record<string, unknown>;
  output?: string;
  error?: string;
  pendingEditId?: string;
  startedAt: number;
  endedAt?: number;
}

export type LspInstallStatus =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'fetching'; lines: string[] }       // npx first-run download in progress
  | { state: 'installing'; lines: string[] }     // managed install via npm/rustup/go/pip
  | { state: 'ready' }
  | { state: 'needs-install'; via: 'npm' | 'rustup' | 'go' | 'pip'; package: string }
  | { state: 'unavailable'; reason: string };

export interface AgentState {
  /** Read-only — set at factory construction. Used by methods that need
   *  to write back to the SQLite `conversations` row (workspace, etc.). */
  convoId: string;
  workspace: string | null;
  pendingEdits: Record<string, PendingEdit>;
  toolCalls: Record<string, ToolCallRecord>;
  toolCallOrder: string[];

  // LSP install/availability tracker keyed by server id
  lspStatus: Record<string, LspInstallStatus>;

  // Attachments staged for the next message — workspace-relative paths
  attachments: string[];

  // Auto-accept staged edits without prompting. Off by default; toggle in
  // workspace bar. Reset to false on workspace change.
  autoAcceptEdits: boolean;

  /**
   * True while a Set Run (pack run) is executing through the orchestrator.
   * Lets the WorkspaceBar disable the auto-accept toggle and render a
   * dedicated runtime badge so the user sees "auto-accept active for this
   * Set Run" without us mutating their stored preference. chatStore's
   * `runOrchestratorMessage` flips this on at run kickoff (when
   * `predefinedPlan` is set) and back off in its `finally` — same scope
   * as the auto-accept restore.
   */
  setRunActive: boolean;

  initWorkspace: () => void;
  pickWorkspace: () => Promise<string | null>;
  setWorkspace: (path: string) => void;
  clearWorkspace: () => void;

  addToolCall: (call: Omit<ToolCallRecord, 'startedAt'>) => void;
  finishToolCall: (id: string, patch: Partial<ToolCallRecord>) => void;

  addPendingEdit: (edit: Omit<PendingEdit, 'accepted' | 'createdAt'>) => void;
  acceptEdit: (id: string) => Promise<void>;
  rejectEdit: (id: string) => Promise<void>;
  setEditDiagnostics: (id: string, diagnostics: LspDiagnostic[]) => void;

  probeLspForFile: (path: string) => Promise<LspAvailability | null>;
  installLspServer: (serverId: string) => Promise<boolean>;
  setLspStatus: (serverId: string, status: LspInstallStatus) => void;

  attachFiles: (sources: string[]) => Promise<{ copied: string[]; failed: string[] }>;
  removeAttachment: (path: string) => void;
  clearAttachments: () => void;
  setAutoAcceptEdits: (on: boolean) => void;
  setSetRunActive: (on: boolean) => void;

  reset: () => void;
}

export function createAgentStore(convoId: string): UseBoundStore<StoreApi<AgentState>> {
  return create<AgentState>((set, get) => ({
  convoId,
  workspace: null,
  pendingEdits: {},
  toolCalls: {},
  toolCallOrder: [],
  lspStatus: {},
  attachments: [],
  autoAcceptEdits: false,
  setRunActive: false,

  initWorkspace: () => {
    // Phase-2 multi-conversation: workspace lives on the SQLite
    // `conversations` row, hydrated by SkillChat/index.tsx on convo
    // switch via setWorkspace. No-op here so the boot path doesn't
    // double-write and accidentally clobber a freshly-restored value.
  },

  pickWorkspace: async () => {
    const picked = await openDialog({ directory: true, multiple: false });
    if (typeof picked === 'string') {
      get().setWorkspace(picked);
      return picked;
    }
    return null;
  },

  setWorkspace: (path) => {
    // Workspace-switch cleanup — when the user picks a NEW folder while
    // a different one is already mounted, remove the old folder's
    // Skillset-managed artifacts (`.skillset/`, `Skillset-Flow.md`,
    // legacy `SKILLSET.md`) so we never leave stale skill files behind
    // on a folder the user no longer considers "their workspace".
    // Skipped on first mount (no prior path) and on no-op same-path
    // re-set.
    const prior = get().workspace;
    if (prior && prior !== path) {
      void import('../lib/workspaceWorkflowSync')
        .then(({ removeWorkflowArtifacts }) => removeWorkflowArtifacts(prior))
        .catch(() => {});
    }

    set({ workspace: path });
    // Persist back to the per-convo SQLite row so the choice survives
    // restarts. Skipped for the BOOT sentinel — happens on app launch
    // before any real convo exists.
    if (convoId !== BOOT_CONVO_ID) {
      void import('./conversationsStore').then(({ useConversationsStore }) => {
        void useConversationsStore.getState().patch(convoId, { workspace: path });
      }).catch(() => {});
    }
    // Drop skillset.md into the workspace so the agent has stable
    // instructions to read on every session. Idempotent — won't
    // overwrite an existing file. Filename is lowercase to match the
    // pack-run loader (chatStore.runPack) and the agent's system prompt.
    invoke('agent_init_workspace_doc', { workspace: path }).catch(() => {});

    // Also sync the currently-selected pack's Skill Flow workflow to the
    // workspace (if a pack is selected). Dynamic import to avoid circular
    // dep with syncStore (which imports useAgentStore).
    void import('./syncStore').then(({ useSyncStore, syncSelectedPackToWorkspace }) => {
      const selectedPackId = useSyncStore.getState().selectedPackId;
      if (selectedPackId) {
        void syncSelectedPackToWorkspace(selectedPackId, useSyncStore.getState);
      }
    }).catch(() => {});
  },

  clearWorkspace: () => {
    // Capture path BEFORE clearing state — needed for cleanup
    const oldWorkspace = get().workspace;

    set({ workspace: null, attachments: [], autoAcceptEdits: false });
    if (convoId !== BOOT_CONVO_ID) {
      void import('./conversationsStore').then(({ useConversationsStore }) => {
        void useConversationsStore.getState().patch(convoId, { workspace: null });
      }).catch(() => {});
    }
    lspShutdownAll().catch(() => {});

    // Remove .skillset/ + Skillset-Flow.md from the workspace. Dynamic
    // import to avoid circular dep at module init.
    if (oldWorkspace) {
      void import('../lib/workspaceWorkflowSync')
        .then(({ removeWorkflowArtifacts }) => removeWorkflowArtifacts(oldWorkspace))
        .catch(() => {});
    }
  },

  addToolCall: (call) => {
    set((state) => ({
      toolCalls: {
        ...state.toolCalls,
        [call.id]: { ...call, startedAt: Date.now() },
      },
      toolCallOrder: [...state.toolCallOrder, call.id],
    }));
  },

  finishToolCall: (id, patch) => {
    set((state) => {
      const existing = state.toolCalls[id];
      if (!existing) return state;
      return {
        toolCalls: {
          ...state.toolCalls,
          [id]: { ...existing, ...patch, endedAt: Date.now() },
        },
      };
    });
  },

  addPendingEdit: (edit) => {
    set((state) => ({
      pendingEdits: {
        ...state.pendingEdits,
        [edit.id]: {
          ...edit,
          accepted: null,
          createdAt: Date.now(),
        },
      },
    }));
    // OS-level toast so a long pack run that hits an "Accept edits: ask"
    // gate doesn't silently stall while the user is in another window.
    // Best-effort: requests permission once; no-ops on platforms / OS
    // permission states that block. Pairs with the in-app DiffPanel —
    // clicking the notification only flags attention, doesn't auto-accept.
    void notifyPendingEdit(edit.path);
  },

  acceptEdit: async (id) => {
    const edit = get().pendingEdits[id];
    if (!edit) return;
    const ws = get().workspace;

    // Staged edits — side effect hasn't happened yet. Commit now.
    // Auto-accept mode (isStaged=false) already wrote eagerly at
    // tool-call time, so this branch only fires for "Accept edits: ask"
    // mode where the user's click is the trigger.
    if (edit.isStaged && ws) {
      try {
        if (edit.pdfPayload) {
          // Binary PDF — call the Rust handler with the saved args.
          await invoke('agent_pdf_generate', {
            workspace: ws,
            path: edit.path,
            content: edit.pdfPayload.content,
            title: edit.pdfPayload.title,
          });
        } else {
          await invoke('agent_write', {
            workspace: ws,
            path: edit.path,
            content: edit.after,
          });
        }
      } catch (e) {
        // Surface the failure rather than silently flipping to accepted.
        // Leaves the pending row visible so the user can retry / reject.
        console.error('[agentStore] accept-time write failed:', e);
        return;
      }
    }

    set((state) => ({
      pendingEdits: {
        ...state.pendingEdits,
        [id]: { ...edit, accepted: true, isStaged: false },
      },
    }));

    // LSP push runs for both modes — diagnostics only make sense once
    // the file is actually on disk.
    if (ws) {
      try {
        await lspOpenFile(ws + '/' + edit.path, edit.path, edit.after);
        const diags = await lspGetDiagnostics(edit.path);
        get().setEditDiagnostics(id, diags);
      } catch {
        // ignore
      }
    }
  },

  rejectEdit: async (id) => {
    const edit = get().pendingEdits[id];
    if (!edit) return;
    const ws = get().workspace;

    // Staged reject = no filesystem op needed. The write never
    // happened; just flip the flag so the DiffPanel shows red.
    if (!edit.isStaged && ws) {
      // Auto-accept mode wrote eagerly — restore `before` to revert.
      // For PDFs we can't faithfully restore (the original was
      // binary). Best we can do is delete the file, but that's
      // surprising to the user; leave the file in place and just
      // mark rejected. Text edits get the proper revert.
      if (!edit.pdfPayload) {
        try {
          await invoke('agent_write', {
            workspace: ws,
            path: edit.path,
            content: edit.before,
          });
        } catch {
          // ignore
        }
      }
    }

    set((state) => ({
      pendingEdits: {
        ...state.pendingEdits,
        [id]: { ...edit, accepted: false },
      },
    }));
  },

  setEditDiagnostics: (id, diagnostics) => {
    set((state) => {
      const existing = state.pendingEdits[id];
      if (!existing) return state;
      return {
        pendingEdits: {
          ...state.pendingEdits,
          [id]: { ...existing, diagnostics },
        },
      };
    });
  },

  setLspStatus: (serverId, status) => {
    set((state) => ({ lspStatus: { ...state.lspStatus, [serverId]: status } }));
  },

  probeLspForFile: async (path) => {
    const spec = getServerForFile(path);
    if (!spec) return null;
    get().setLspStatus(spec.id, { state: 'checking' });
    const availability = await resolveAvailability(spec);
    switch (availability.kind) {
      case 'ready':
        get().setLspStatus(spec.id, { state: 'ready' });
        break;
      case 'npx':
        // First spawn may take ~30s while npx downloads — surface it
        get().setLspStatus(spec.id, { state: 'fetching', lines: [] });
        // Mark ready optimistically; lspOpenFile will spawn it
        setTimeout(() => {
          const cur = get().lspStatus[spec.id];
          if (cur?.state === 'fetching') get().setLspStatus(spec.id, { state: 'ready' });
        }, 60000);
        break;
      case 'installable':
        get().setLspStatus(spec.id, {
          state: 'needs-install',
          via: availability.via,
          package: availability.package,
        });
        break;
      case 'unavailable':
        get().setLspStatus(spec.id, { state: 'unavailable', reason: availability.reason });
        break;
    }
    return availability;
  },

  installLspServer: async (serverId) => {
    const spec = getServerById(serverId);
    if (!spec) return false;
    const lines: string[] = [];
    get().setLspStatus(serverId, { state: 'installing', lines: [] });
    const res = await installServer(spec, (line) => {
      lines.push(line);
      // Cap visible log to last 30 lines to avoid bloat
      get().setLspStatus(serverId, {
        state: 'installing',
        lines: lines.slice(-30),
      });
    });
    if (res.success) {
      get().setLspStatus(serverId, { state: 'ready' });
      return true;
    }
    get().setLspStatus(serverId, {
      state: 'unavailable',
      reason: res.message || 'Install failed.',
    });
    return false;
  },

  attachFiles: async (sources) => {
    const ws = get().workspace;
    if (!ws) return { copied: [], failed: sources };
    try {
      const res = await invoke<{ copied: string[]; failed: string[] }>('agent_attach_files', {
        workspace: ws,
        sources,
      });
      set((state) => ({
        attachments: Array.from(new Set([...state.attachments, ...res.copied])),
      }));
      return res;
    } catch (err) {
      console.error('attach failed:', err);
      return { copied: [], failed: sources };
    }
  },

  removeAttachment: (path) => {
    set((state) => ({ attachments: state.attachments.filter((p) => p !== path) }));
  },

  clearAttachments: () => set({ attachments: [] }),

  setAutoAcceptEdits: (on) => set({ autoAcceptEdits: on }),

  setSetRunActive: (on) => set({ setRunActive: on }),

  reset: () => {
    set({
      pendingEdits: {},
      toolCalls: {},
      toolCallOrder: [],
      lspStatus: {},
      attachments: [],
    });
  },
  }));
}

// Register factory + boot instance so getStoresFor() / getActiveConvoId()
// resolve cleanly before any conversation loads.
registerAgentFactory(createAgentStore);

/**
 * Active-conversation router. Hook call subscribes to the active convo's
 * agentStore instance; `getState` / `setState` / `subscribe` proxies
 * forward to it too. Components/stores that have a known convoId in
 * scope should use `getStoresFor(convoId).agent` instead — that returns
 * the same instance directly without routing through the active id.
 */
function activeAgentStore(): UseBoundStore<StoreApi<AgentState>> {
  return getStoresFor(getActiveConvoId()).agent as UseBoundStore<StoreApi<AgentState>>;
}

export const useAgentStore: UseBoundStore<StoreApi<AgentState>> = (
  <T,>(selector?: (s: AgentState) => T): T => {
    const activeId = useConversationsStore((s) => s.activeId) ?? BOOT_CONVO_ID;
    const store = getStoresFor(activeId).agent as UseBoundStore<StoreApi<AgentState>>;
    return selector ? store(selector) : (store.getState() as T);
  }
) as unknown as UseBoundStore<StoreApi<AgentState>>;

useAgentStore.getState = (): AgentState => activeAgentStore().getState();
useAgentStore.setState = ((
  partial: Partial<AgentState> | AgentState | ((s: AgentState) => Partial<AgentState> | AgentState),
  replace?: boolean,
): void => {
  const store = activeAgentStore();
  if (replace === true) {
    (store.setState as unknown as (p: AgentState, replace: true) => void)(partial as AgentState, true);
  } else {
    (store.setState as unknown as (p: Partial<AgentState>) => void)(partial as Partial<AgentState>);
  }
}) as StoreApi<AgentState>['setState'];
useAgentStore.subscribe = ((listener: (s: AgentState, prev: AgentState) => void) =>
  activeAgentStore().subscribe(listener)) as StoreApi<AgentState>['subscribe'];
useAgentStore.getInitialState = (): AgentState => activeAgentStore().getInitialState();
