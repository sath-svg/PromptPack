/**
 * Multi-conversation manager for Skill Chat.
 *
 * Holds the list of conversations (max 3) loaded from SQLite + the active id.
 * Owns CRUD against the Rust `conversation_*` and `chat_message_*` commands.
 *
 * Switching semantics today are **snapshot/restore**: on switch, the current
 * chatStore / agentStore state is snapshotted into an in-memory map keyed by
 * the prior conversation id, then the new conversation's snapshot (or freshly
 * loaded persistence) is hydrated into chatStore/agentStore. runStore is
 * snapshot/restored too — its abort controller is preserved so a backgrounded
 * run can still be cancelled from the dropdown, but UI updates pause while
 * the convo is inactive.
 *
 * True-parallel execution (Phase 2) requires per-slice keying inside
 * chatStore/runStore/agentStore; the slice abstraction lives in
 * `_convoSnapshots` here as the seed for that work.
 */

import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type { Conversation } from '../types';
import { dropStoresFor } from './registry';

export const MAX_CONVERSATIONS = 3;

export class MaxConversationsError extends Error {
  constructor() {
    super('You can only have 3 chats open. Close one to start a new one.');
    this.name = 'MaxConversationsError';
  }
}

// ─── Rust DTOs (snake_case from Tauri) ─────────────────────────────────────

interface ConversationRow {
  id: string;
  title: string;
  workspace: string | null;
  selected_pack_id: string | null;
  agent_mode: boolean;
  auto_accept_edits: boolean;
  last_active_at: number;
  created_at: number;
}

export interface ChatMessageRow {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  blocks_json: string | null;
  model_id: string | null;
  tier: string | null;
  effort: string | null;
  pack_name: string | null;
  attachments_json: string | null;
  telemetry_id: string | null;
  user_signal: string | null;
  created_at: number;
}

function fromRow(row: ConversationRow): Conversation {
  return {
    id: row.id,
    title: row.title,
    workspace: row.workspace,
    selectedPackId: row.selected_pack_id,
    agentMode: row.agent_mode,
    autoAcceptEdits: row.auto_accept_edits,
    lastActiveAt: row.last_active_at,
    createdAt: row.created_at,
  };
}

// ─── Snapshot shape (forward-compat seed for per-slice refactor) ───────────

export interface ConvoSnapshot {
  /** chatStore subset — captured on switch-away. */
  chat?: {
    messages: unknown[];
    error: string | null;
    agentMode: boolean;
    pendingRouteLabel: string | null;
    messageQueue: unknown[];
    /** isLoading is intentionally NOT snapshotted — a paused convo always
     *  reads as not-loading from the active store's POV. Phase 2 (true
     *  parallel) will track per-slice isLoading separately. */
  };
  /** agentStore subset — workspace, attachments, pendingEdits, autoAcceptEdits. */
  agent?: {
    workspace: string | null;
    attachments: string[];
    pendingEdits: Record<string, unknown>;
    autoAcceptEdits: boolean;
  };
  /** runStore subset — passed through for inspection but not rehydrated
   *  in Phase 1 (each convo starts with a fresh run on next send). */
  run?: unknown;
}

// ─── Store ─────────────────────────────────────────────────────────────────

interface ConversationsState {
  conversations: Conversation[];
  activeId: string | null;
  loading: boolean;
  error: string | null;

  /** In-memory snapshots keyed by conversation id. Restored on switch. */
  _snapshots: Map<string, ConvoSnapshot>;

  load: () => Promise<void>;
  create: (opts?: { title?: string; workspace?: string }) => Promise<Conversation>;
  rename: (id: string, title: string) => Promise<void>;
  close: (id: string) => Promise<void>;
  setActive: (id: string) => Promise<void>;
  patch: (id: string, patch: Partial<Conversation>) => Promise<void>;
  touch: (id: string) => Promise<void>;

  /** Phase 1 snapshot/restore helpers — called by chatStore/agentStore on
   *  switch. Phase 2 will replace these with slice writes. */
  snapshot: (id: string, snap: ConvoSnapshot) => void;
  takeSnapshot: (id: string) => ConvoSnapshot | undefined;

  /** Persist a chat message under the given conversation id. Fire-and-forget. */
  persistMessage: (input: {
    conversationId: string;
    id?: string;
    role: 'user' | 'assistant';
    content: string;
    blocksJson?: string | null;
    modelId?: string | null;
    tier?: string | null;
    effort?: string | null;
    packName?: string | null;
    attachmentsJson?: string | null;
    telemetryId?: string | null;
    userSignal?: string | null;
    createdAt?: number;
  }) => Promise<void>;

  /** Load all persisted messages for a conversation (ASC by created_at). */
  loadMessages: (conversationId: string) => Promise<ChatMessageRow[]>;

  /** Update a message's user_signal (thumbs vote) on disk. */
  updateMessageSignal: (id: string, signal: 'thumbs_up' | 'thumbs_down' | null) => Promise<void>;
}

export const useConversationsStore = create<ConversationsState>((set, get) => ({
  conversations: [],
  activeId: null,
  loading: false,
  error: null,
  _snapshots: new Map(),

  load: async () => {
    set({ loading: true, error: null });
    try {
      const rows = await invoke<ConversationRow[]>('conversation_list');
      const list = rows.map(fromRow);
      const activeId =
        get().activeId && list.some((c) => c.id === get().activeId)
          ? get().activeId
          : list[0]?.id ?? null;
      set({ conversations: list, activeId, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  },

  create: async (opts) => {
    if (get().conversations.length >= MAX_CONVERSATIONS) {
      throw new MaxConversationsError();
    }
    const row = await invoke<ConversationRow>('conversation_create', {
      input: { title: opts?.title ?? null, workspace: opts?.workspace ?? null },
    });
    const convo = fromRow(row);
    set((s) => ({
      conversations: [convo, ...s.conversations].slice(0, MAX_CONVERSATIONS),
      activeId: convo.id,
    }));
    return convo;
  },

  rename: async (id, title) => {
    const trimmed = title.trim().slice(0, 80) || 'Untitled chat';
    await invoke('conversation_update', {
      input: { id, title: trimmed },
    });
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === id ? { ...c, title: trimmed } : c,
      ),
    }));
  },

  close: async (id) => {
    // Abort in-flight LLM/orchestrator work for this convo BEFORE
    // tearing down its stores. The abort propagates into the agent
    // loop's tauriFetch + subtask runners and writes a 'cancelled'
    // status to the run row. Wrapped in a dynamic import to avoid a
    // module-init cycle between conversationsStore ↔ chat/runStore.
    try {
      const { getStoresFor } = await import('./registry');
      const slot = getStoresFor(id);
      // runStore.cancelRun aborts the AbortController + marks the
      // run/subtasks as cancelled in SQLite.
      const runState = slot.run.getState() as { cancelRun?: () => Promise<void> };
      await runState.cancelRun?.();
      // chatStore's own stopGeneration also flips isLoading off.
      const chatState = slot.chat.getState() as { stopGeneration?: () => void };
      chatState.stopGeneration?.();
    } catch (err) {
      console.warn('[conversationsStore] abort-on-close failed', err);
    }

    await invoke('conversation_delete', { id });
    const snaps = new Map(get()._snapshots);
    snaps.delete(id);
    const baseRemaining = get().conversations.filter((c) => c.id !== id);

    // Collapse sole-survivor default-titled convo to bare "Chat" in
    // the SAME set call as the delete so there's no intermediate
    // paint showing the stale "Chat 2" label before the rename lands.
    // DB persistence fires in the background; the next load
    // reconciles. Skips user-customised + auto-titled (slugged first
    // message) titles.
    const DEFAULT_RE = /^(Chat( \d+)?|New chat|Untitled chat)$/;
    let remaining = baseRemaining;
    let renameTargetId: string | null = null;
    if (
      baseRemaining.length === 1 &&
      DEFAULT_RE.test(baseRemaining[0].title) &&
      baseRemaining[0].title !== 'Chat'
    ) {
      renameTargetId = baseRemaining[0].id;
      remaining = [{ ...baseRemaining[0], title: 'Chat' }];
    }

    const nextActive =
      get().activeId === id ? remaining[0]?.id ?? null : get().activeId;
    set({
      conversations: remaining,
      activeId: nextActive,
      _snapshots: snaps,
    });
    dropStoresFor(id);

    // Background DB write — UI already shows the new title.
    if (renameTargetId) {
      void invoke('conversation_update', {
        input: { id: renameTargetId, title: 'Chat' },
      }).catch((err) => {
        console.warn('[conversationsStore] post-close rename failed', err);
      });
    }
  },

  setActive: async (id) => {
    if (get().activeId === id) return;
    set({ activeId: id });
    // Touch last_active_at so reordering reflects most-recent use on next load.
    void get().touch(id);
  },

  patch: async (id, patch) => {
    const input: Record<string, unknown> = { id };
    if (patch.title !== undefined) input.title = patch.title;
    if (patch.workspace !== undefined) input.workspace = patch.workspace;
    if (patch.selectedPackId !== undefined) input.selected_pack_id = patch.selectedPackId;
    if (patch.agentMode !== undefined) input.agent_mode = patch.agentMode;
    if (patch.autoAcceptEdits !== undefined) input.auto_accept_edits = patch.autoAcceptEdits;
    if (patch.lastActiveAt !== undefined) input.last_active_at = patch.lastActiveAt;
    await invoke('conversation_update', { input });
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === id ? { ...c, ...patch } : c,
      ),
    }));
  },

  touch: async (id) => {
    const ts = Date.now();
    await invoke('conversation_update', {
      input: { id, last_active_at: ts },
    }).catch(() => {});
    set((s) => ({
      conversations: s.conversations
        .map((c) => (c.id === id ? { ...c, lastActiveAt: ts } : c))
        .sort((a, b) => b.lastActiveAt - a.lastActiveAt),
    }));
  },

  snapshot: (id, snap) => {
    const snaps = new Map(get()._snapshots);
    snaps.set(id, snap);
    set({ _snapshots: snaps });
  },

  takeSnapshot: (id) => get()._snapshots.get(id),

  persistMessage: async (input) => {
    await invoke('chat_message_insert', {
      input: {
        id: input.id ?? null,
        conversation_id: input.conversationId,
        role: input.role,
        content: input.content,
        blocks_json: input.blocksJson ?? null,
        model_id: input.modelId ?? null,
        tier: input.tier ?? null,
        effort: input.effort ?? null,
        pack_name: input.packName ?? null,
        attachments_json: input.attachmentsJson ?? null,
        telemetry_id: input.telemetryId ?? null,
        user_signal: input.userSignal ?? null,
        created_at: input.createdAt ?? null,
      },
    }).catch((err) => {
      console.error('[conversationsStore] persistMessage failed', err);
    });
  },

  loadMessages: async (conversationId) => {
    try {
      return await invoke<ChatMessageRow[]>('chat_message_list', {
        conversationId,
      });
    } catch (err) {
      console.error('[conversationsStore] loadMessages failed', err);
      return [];
    }
  },

  updateMessageSignal: async (id, signal) => {
    await invoke('chat_message_update_signal', {
      id,
      signal: signal ?? null,
    }).catch((err) => {
      console.error('[conversationsStore] updateMessageSignal failed', err);
    });
  },
}));
