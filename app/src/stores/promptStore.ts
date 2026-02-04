import { create } from 'zustand';
import type { Prompt, PromptSource, Folder } from '../types';

interface PromptState {
  prompts: Prompt[];
  folders: Folder[];
  selectedFolderId: string | null;
  selectedSource: PromptSource | 'all';
  searchQuery: string;
  isLoading: boolean;

  // Actions
  setPrompts: (prompts: Prompt[]) => void;
  addPrompt: (prompt: Prompt) => void;
  updatePrompt: (id: string, updates: Partial<Prompt>) => void;
  deletePrompt: (id: string) => void;
  setFolders: (folders: Folder[]) => void;
  addFolder: (folder: Folder) => void;
  setSelectedFolder: (folderId: string | null) => void;
  setSelectedSource: (source: PromptSource | 'all') => void;
  setSearchQuery: (query: string) => void;
  setLoading: (loading: boolean) => void;
  toggleFavorite: (id: string) => void;
}

export const usePromptStore = create<PromptState>((set) => ({
  prompts: [],
  folders: [],
  selectedFolderId: null,
  selectedSource: 'all',
  searchQuery: '',
  isLoading: false,

  setPrompts: (prompts) => set({ prompts }),

  addPrompt: (prompt) =>
    set((state) => ({
      prompts: [prompt, ...state.prompts],
    })),

  updatePrompt: (id, updates) =>
    set((state) => ({
      prompts: state.prompts.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
      ),
    })),

  deletePrompt: (id) =>
    set((state) => ({
      prompts: state.prompts.filter((p) => p.id !== id),
    })),

  setFolders: (folders) => set({ folders }),

  addFolder: (folder) =>
    set((state) => ({
      folders: [...state.folders, folder],
    })),

  setSelectedFolder: (folderId) => set({ selectedFolderId: folderId }),

  setSelectedSource: (source) => set({ selectedSource: source }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setLoading: (loading) => set({ isLoading: loading }),

  toggleFavorite: (id) =>
    set((state) => ({
      prompts: state.prompts.map((p) =>
        p.id === id ? { ...p, isFavorite: !p.isFavorite, updatedAt: Date.now() } : p
      ),
    })),
}));

// Selectors
export const useFilteredPrompts = () => {
  const { prompts, selectedFolderId, selectedSource, searchQuery } = usePromptStore();

  return prompts.filter((prompt) => {
    // Filter by folder
    if (selectedFolderId && prompt.folderId !== selectedFolderId) {
      return false;
    }

    // Filter by source
    if (selectedSource !== 'all' && prompt.source !== selectedSource) {
      return false;
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesText = prompt.text.toLowerCase().includes(query);
      const matchesHeader = prompt.header?.toLowerCase().includes(query);
      if (!matchesText && !matchesHeader) {
        return false;
      }
    }

    return true;
  });
};
