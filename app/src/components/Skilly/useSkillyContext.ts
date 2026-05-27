/**
 * Derives Skilly's current contextual state from the active tab, the
 * chat-loading flag, and the transient mouth override. Pure read-only —
 * no side effects.
 *
 * Priority (top wins):
 *   1. passedOut       → state='passedOut', eyes='passedOut', mouth='flat'
 *   2. mouthOverride   → mouth = sad / o (state still from tab)
 *   3. chat + loading  → state='writing'
 *   4. skill-preset    → state='painting'
 *   5. user-packs      → state='reading'
 *   6. prompt-control  → state='thinking', eyes='thinking', mouth='thinking'
 *   7. default         → state='default'.
 *                        Default mouth: 'sad' if happy <= 20, else 'smile'.
 */

import { useSyncExternalStore } from 'react';
import { useUiStore } from '../../stores/uiStore';
import { useChatStore } from '../../stores/chatStore';
import { useSkillyStore } from '../../stores/skillyStore';
import type { SkillyMouth, SkillyEyesMode } from './SkillyFace';
import type { SkillyContextState } from './SkillyProps';

export interface SkillyContext {
  state: SkillyContextState;
  mouth: SkillyMouth;
  eyesMode: SkillyEyesMode;
}

export function useSkillyContext(): SkillyContext {
  const currentPage = useUiStore((s) => s.currentPage);
  const isLoading = useChatStore((s) => s.isLoading);
  const passedOut = useSkillyStore((s) => s.passedOut);
  const sleeping = useSkillyStore((s) => s.sleeping);
  const dragging = useSkillyStore((s) => s.dragging);
  const happy = useSkillyStore((s) => s.happy);
  const mouthOverride = useSkillyStore((s) => s.mouthOverride);

  // The mouth-override has a TTL (`until` timestamp). React selectors
  // don't re-run when the wall clock passes that timestamp on its own,
  // so we subscribe via `useSyncExternalStore` — the subscribe callback
  // schedules a re-read at the TTL boundary, keeping render pure.
  const overrideActive = useSyncExternalStore(
    (notify) => {
      if (!mouthOverride.kind) return () => {};
      const remaining = mouthOverride.until - Date.now();
      if (remaining <= 0) return () => {};
      const t = window.setTimeout(notify, remaining);
      return () => window.clearTimeout(t);
    },
    () =>
      mouthOverride.kind !== null && mouthOverride.until > Date.now(),
  );

  // 1. Passed out wins everything.
  if (passedOut) {
    return { state: 'passedOut', mouth: 'flat', eyesMode: 'passedOut' };
  }

  // 1b. Sleeping — closed eyes + flat mouth, but keep the contextual
  //      prop (suit, paintbrush, etc.) tied to the current tab.
  if (sleeping) {
    let stateWhileSleeping: SkillyContextState = 'default';
    if (currentPage === 'skill-preset') stateWhileSleeping = 'painting';
    else if (currentPage === 'user-packs') stateWhileSleeping = 'reading';
    else if (currentPage === 'marketplace') stateWhileSleeping = 'marketplace';
    else if (currentPage === 'chat' && isLoading) stateWhileSleeping = 'writing';
    return { state: stateWhileSleeping, mouth: 'flat', eyesMode: 'sleeping' };
  }

  // 2. Mouth override (transient sad / o).
  const overrideMouth: SkillyMouth | null =
    overrideActive && mouthOverride.kind ? mouthOverride.kind : null;

  // 3–6. State derived from current tab.
  // 7. Default mouth.
  let state: SkillyContextState = 'default';
  let mouth: SkillyMouth = happy <= 20 ? 'sad' : 'smile';
  let eyesMode: SkillyEyesMode = 'normal';

  if (currentPage === 'chat' && isLoading) {
    state = 'writing';
  } else if (currentPage === 'skill-preset') {
    state = 'painting';
  } else if (currentPage === 'user-packs') {
    state = 'reading';
  } else if (currentPage === 'prompt-control') {
    state = 'thinking';
    eyesMode = 'thinking';
    mouth = 'thinking';
  } else if (currentPage === 'marketplace') {
    state = 'marketplace';
  }

  // Override wins on mouth only — state (and therefore the prop) still
  // reflects the current tab.
  if (overrideMouth) mouth = overrideMouth;

  // Dragging trumps both the default and override mouths — surprised face
  // is core feedback that the drag is engaged. Exception: the thinking
  // state owns the mouth (flat dash), keep it stable when the user picks
  // Skilly up in skill-control.
  if (dragging && state !== 'thinking') mouth = 'o';

  return { state, mouth, eyesMode };
}
