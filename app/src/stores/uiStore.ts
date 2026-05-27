import { create } from 'zustand';

/**
 * Tiny UI-state store exposing the active top-level tab globally so
 * components like Skilly can react to navigation without prop drilling.
 *
 * App.tsx is the single writer (its `setCurrentPage` binds to this
 * store's setter). The legacy `skillset:navigate` CustomEvent also
 * routes through here.
 *
 * NOT persisted — active tab is ephemeral session state.
 */
interface UiState {
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  currentPage: 'chat',
  setCurrentPage: (page) => set({ currentPage: page }),
}));
