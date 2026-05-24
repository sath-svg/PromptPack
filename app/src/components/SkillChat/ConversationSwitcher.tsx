import { useState } from 'react';
import { Plus, X, Pencil, MessageSquare, Loader2 } from 'lucide-react';
import {
  useConversationsStore,
  MAX_CONVERSATIONS,
  MaxConversationsError,
} from '../../stores/conversationsStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { useChatStore, type ChatState } from '../../stores/chatStore';
import { getStoresFor } from '../../stores/registry';
import type { AgentState } from '../../stores/agentStore';
import type { Conversation } from '../../types';

interface ConversationSwitcherProps {
  onSwitch?: (id: string) => Promise<void> | void;
}

/**
 * Sidebar-native conversation list. Renders inline (no dropdown / popover)
 * so it visually blends into the sidebar nav — matches the Claude desktop
 * "Recents" pattern instead of the older floating dropdown.
 */
export function ConversationSwitcher({ onSwitch }: ConversationSwitcherProps) {
  const conversations = useConversationsStore((s) => s.conversations);
  const activeId = useConversationsStore((s) => s.activeId);
  const create = useConversationsStore((s) => s.create);
  const close = useConversationsStore((s) => s.close);
  const rename = useConversationsStore((s) => s.rename);
  const setActive = useConversationsStore((s) => s.setActive);
  const notify = useNotificationStore((s) => s.notify);

  // Active convo loading indicator. Background convos appear idle here
  // until per-slice isLoading wiring lands (future polish).
  const activeIsLoading = useChatStore((s) => s.isLoading);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const atCap = conversations.length >= MAX_CONVERSATIONS;

  const handleSwitch = async (id: string) => {
    if (id !== activeId) await setActive(id);
    await onSwitch?.(id);
  };

  const handleCreate = async () => {
    if (atCap) return;
    try {
      const convo = await create();
      await onSwitch?.(convo.id);
    } catch (err) {
      if (err instanceof MaxConversationsError) {
        notify({
          category: 'permission',
          severity: 'warning',
          title: 'Max chats reached',
          message: err.message,
          actions: [{ kind: 'dismiss' }],
          details: '',
          dedupeKey: 'max_conversations',
          source: 'conversationSwitcher',
        });
      } else {
        console.error('[ConversationSwitcher] create failed', err);
      }
    }
  };

  const handleClose = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (conversations.length === 1) {
      // X on the SOLE convo = reset in place. Doing delete+create
      // would flash "Chat 2" (Rust assigns the next numeric label
      // before the sole-survivor rename hook collapses it back to
      // "Chat"). Resetting the same row in a single set call avoids
      // both the flash and an unnecessary id churn.
      const slot = getStoresFor(id);
      (slot.chat.getState() as ChatState).clearMessages();
      (slot.agent.getState() as AgentState).clearWorkspace();
      // Rename last so the title flip happens in one commit. The
      // store's rename does a local set + DB write; the DB write is
      // background and the local set fires immediately.
      if (conversations[0].title !== 'Chat') {
        await rename(id, 'Chat');
      }
      return;
    }
    await close(id);
  };

  const startRename = (e: React.MouseEvent, c: Conversation) => {
    e.stopPropagation();
    setRenamingId(c.id);
    setRenameValue(c.title);
  };

  const commitRename = async () => {
    if (!renamingId) return;
    await rename(renamingId, renameValue);
    setRenamingId(null);
  };

  return (
    <div className="mt-2">
      {/* Section header — matches the "Your Sets" pattern used elsewhere
          in the sidebar so the chat list blends visually. */}
      <div
        className="flex items-center justify-between px-3 py-1.5 text-[10px] text-[var(--muted-foreground)] uppercase tracking-[0.18em]"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        <span>Chats</span>
        <span>
          {conversations.length}/{MAX_CONVERSATIONS}
        </span>
      </div>

      <div className="space-y-0.5">
        {conversations.map((c) => {
          const isActive = c.id === activeId;
          const showSpinner = isActive && activeIsLoading;
          const isRenaming = renamingId === c.id;
          return (
            <div
              key={c.id}
              onClick={() => !isRenaming && void handleSwitch(c.id)}
              className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                isActive
                  ? 'bg-[var(--primary-soft)] text-[var(--foreground)] ring-1 ring-inset ring-[var(--primary)]/30'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]'
              }`}
            >
              <div className="flex-shrink-0 w-[18px] flex items-center justify-center">
                {showSpinner ? (
                  <Loader2 size={14} className="animate-spin text-amber-500" />
                ) : (
                  <MessageSquare
                    size={14}
                    className={isActive ? 'text-[var(--primary)]' : ''}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                {isRenaming ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        void commitRename();
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        setRenamingId(null);
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded px-1.5 py-0.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
                  />
                ) : (
                  <span className="truncate block">{c.title}</span>
                )}
              </div>
              {!isRenaming && (
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => startRename(e, c)}
                    className="p-1 rounded-md text-[var(--muted-foreground)] hover:bg-[var(--background)] hover:text-[var(--foreground)]"
                    title="Rename"
                    aria-label="Rename conversation"
                  >
                    <Pencil size={11} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => void handleClose(e, c.id)}
                    className="p-1 rounded-md text-[var(--muted-foreground)] hover:bg-red-500/10 hover:text-red-500"
                    title="Close"
                    aria-label="Close conversation"
                  >
                    <X size={11} />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={handleCreate}
          disabled={atCap}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
            atCap
              ? 'text-[var(--muted-foreground)]/40 cursor-not-allowed'
              : 'text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]'
          }`}
          title={atCap ? 'Close a chat to start a new one' : 'New chat'}
        >
          <Plus size={14} className="flex-shrink-0" />
          <span className="flex-1 text-left">New chat</span>
          {atCap && (
            <span
              className="text-[10px] uppercase tracking-[0.14em]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Full
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
