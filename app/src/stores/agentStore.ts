// Agent state: workspace root, pending file edits awaiting accept/reject,
// tool-call log, and LSP diagnostics surfaced into the chat panel.

import { create } from 'zustand';
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

const WORKSPACE_KEY = 'skillset.agent.workspace';

export interface PendingEdit {
  id: string;
  path: string;
  before: string;
  after: string;
  accepted: boolean | null; // null = pending
  diagnostics?: LspDiagnostic[];
  createdAt: number;
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

interface AgentState {
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

  reset: () => void;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  workspace: null,
  pendingEdits: {},
  toolCalls: {},
  toolCallOrder: [],
  lspStatus: {},
  attachments: [],
  autoAcceptEdits: false,

  initWorkspace: () => {
    const stored = localStorage.getItem(WORKSPACE_KEY);
    if (stored) set({ workspace: stored });
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
    localStorage.setItem(WORKSPACE_KEY, path);
    set({ workspace: path });
  },

  clearWorkspace: () => {
    localStorage.removeItem(WORKSPACE_KEY);
    set({ workspace: null, attachments: [], autoAcceptEdits: false });
    lspShutdownAll().catch(() => {});
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
  },

  acceptEdit: async (id) => {
    const edit = get().pendingEdits[id];
    if (!edit) return;
    set((state) => ({
      pendingEdits: {
        ...state.pendingEdits,
        [id]: { ...edit, accepted: true },
      },
    }));
    // Push to LSP for diagnostics
    const ws = get().workspace;
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
    if (!ws) return;
    // Restore previous content
    try {
      await invoke('agent_write', {
        workspace: ws,
        path: edit.path,
        content: edit.before,
      });
    } catch {
      // ignore
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
