/**
 * Per-conversation store registry.
 *
 * Phase 2 of multi-conversation Skill Chat. Each conversation gets its own
 * zustand instances of chatStore / runStore / agentStore, so backgrounded
 * convos keep mutating their own state while the user works in another.
 *
 * The "active" wrapper hooks in `chatStore.ts` / `runStore.ts` /
 * `agentStore.ts` delegate every call (hook, `getState`, `setState`,
 * `subscribe`) to the instance returned by `getActiveConvoId()` via this
 * registry.
 *
 * Cross-store calls inside chatStore methods (and `dispatchTool`) use
 * `getStoresFor(ctx.convoId)` to read/write the correct slice instead of
 * the active one — required so a backgrounded chat's tool call goes to
 * its own agentStore, not whichever convo the user is staring at.
 */

import type { StoreApi, UseBoundStore } from 'zustand';
import { useConversationsStore } from './conversationsStore';

/** Sentinel id used before the first conversation is loaded. Lets the
 *  app boot in a coherent state — components mounted pre-load resolve
 *  to a stable "empty" instance rather than throwing. */
export const BOOT_CONVO_ID = '__boot__';

// Forward refs only — actual factories are wired via `register*` calls
// from each store module after its `create*Store` factory is defined.
// Avoids cyclic imports while keeping each store module the source of
// truth for its own state shape.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Factory = (convoId: string) => UseBoundStore<StoreApi<any>>;

interface Slot {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chat: UseBoundStore<StoreApi<any>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  run: UseBoundStore<StoreApi<any>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  agent: UseBoundStore<StoreApi<any>>;
}

const registry = new Map<string, Slot>();

let chatFactory: Factory | null = null;
let runFactory: Factory | null = null;
let agentFactory: Factory | null = null;

export function registerChatFactory(f: Factory): void {
  chatFactory = f;
}
export function registerRunFactory(f: Factory): void {
  runFactory = f;
}
export function registerAgentFactory(f: Factory): void {
  agentFactory = f;
}

/**
 * Resolve the store trio for a conversation. Creates lazy on first hit.
 * Throws if a factory hasn't been registered yet — that means an import
 * order bug; the store modules must run before any consumer calls this.
 */
export function getStoresFor(convoId: string): Slot {
  let slot = registry.get(convoId);
  if (slot) return slot;
  if (!chatFactory || !runFactory || !agentFactory) {
    throw new Error(
      `[registry] store factories not registered yet (convoId=${convoId}). ` +
        'Import order bug — chatStore/runStore/agentStore modules must load first.',
    );
  }
  slot = {
    chat: chatFactory(convoId),
    run: runFactory(convoId),
    agent: agentFactory(convoId),
  };
  registry.set(convoId, slot);
  return slot;
}

/** Read the currently-active conversation id outside React. Falls back
 *  to the boot sentinel before the conversations list loads. */
export function getActiveConvoId(): string {
  return useConversationsStore.getState().activeId ?? BOOT_CONVO_ID;
}

/** Drop a conversation's store instances from the registry. Called by
 *  `conversationsStore.close` after aborting in-flight work + persisting
 *  final state. Reading from a dropped instance afterwards would still
 *  return last-known state via captured refs; consumers should resolve
 *  via `getStoresFor(activeId)` (a fresh empty instance is created on
 *  next access). */
export function dropStoresFor(convoId: string): void {
  registry.delete(convoId);
}

/** Test/dev helper — wipe everything. Not used by app code. */
export function _resetRegistry(): void {
  registry.clear();
}
