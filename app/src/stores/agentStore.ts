// Agent state: workspace root, pending file edits awaiting accept/reject,
// tool-call log, and LSP diagnostics surfaced into the chat panel.

import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { lspOpenFile, lspGetDiagnostics, lspShutdownAll, type LspDiagnostic } from '../lib/lspClient';

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

interface AgentState {
  workspace: string | null;
  pendingEdits: Record<string, PendingEdit>;
  toolCalls: Record<string, ToolCallRecord>;
  toolCallOrder: string[];

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

  reset: () => void;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  workspace: null,
  pendingEdits: {},
  toolCalls: {},
  toolCallOrder: [],

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
    set({ workspace: null });
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

  reset: () => {
    set({ pendingEdits: {}, toolCalls: {}, toolCallOrder: [] });
  },
}));
