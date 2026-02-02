import { useState } from 'react';
import {
  Home,
  Star,
  Upload,
  Download,
  Settings,
  Plus,
  ChevronDown,
  ChevronRight,
  Package,
  FileEdit,
  Cloud,
} from 'lucide-react';
import { usePromptStore } from '../../stores/promptStore';
import { useSyncStore } from '../../stores/syncStore';
import { useAuthStore } from '../../stores/authStore';
import { SOURCE_META } from '../../types';
import type { PromptSource } from '../../types';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const [packsExpanded, setPacksExpanded] = useState(true);
  const { folders, selectedSource, setSelectedSource, setSelectedFolder, prompts } =
    usePromptStore();
  const { cloudPacks } = useSyncStore();
  const { session } = useAuthStore();

  const sourceCounts = prompts.reduce(
    (acc, p) => {
      acc[p.source] = (acc[p.source] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const handleSourceClick = (source: PromptSource | 'all') => {
    setSelectedSource(source);
    setSelectedFolder(null);
    onNavigate('library');
  };

  return (
    <aside className="w-64 bg-[var(--card)] border-r border-[var(--border)] flex flex-col h-screen">
      {/* Logo */}
      <div className="p-4 border-b border-[var(--border)]">
        <h1 className="text-xl font-bold text-[var(--foreground)]">
          PromptPack
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        {/* Main Navigation */}
        <div className="space-y-1">
          <button
            onClick={() => {
              handleSourceClick('all');
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              currentPage === 'library' && selectedSource === 'all'
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                : 'text-[var(--foreground)] hover:bg-[var(--accent)]'
            }`}
          >
            <Home size={18} />
            <span>All Prompts</span>
            <span className="ml-auto text-xs opacity-70">{prompts.length}</span>
          </button>

          <button
            onClick={() => onNavigate('favorites')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              currentPage === 'favorites'
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                : 'text-[var(--foreground)] hover:bg-[var(--accent)]'
            }`}
          >
            <Star size={18} />
            <span>Favorites</span>
            <span className="ml-auto text-xs opacity-70">
              {prompts.filter((p) => p.isFavorite).length}
            </span>
          </button>

          <button
            onClick={() => onNavigate('draft')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              currentPage === 'draft'
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                : 'text-[var(--foreground)] hover:bg-[var(--accent)]'
            }`}
          >
            <FileEdit size={18} />
            <span>Draft</span>
          </button>

          <button
            onClick={() => onNavigate('cloud')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              currentPage === 'cloud'
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                : 'text-[var(--foreground)] hover:bg-[var(--accent)]'
            }`}
          >
            <Cloud size={18} />
            <span>Cloud Prompts</span>
            {session && cloudPacks.length > 0 && (
              <span className="ml-auto text-xs opacity-70">
                {cloudPacks.reduce((sum, p) => sum + p.promptCount, 0)}
              </span>
            )}
          </button>
        </div>

        {/* Saved Prompt Packs */}
        <div className="mt-6">
          <button
            onClick={() => setPacksExpanded(!packsExpanded)}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide"
          >
            {packsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            Saved Prompt Packs
          </button>

          {packsExpanded && (
            <div className="mt-1 space-y-1">
              {(Object.keys(SOURCE_META) as PromptSource[]).map((source) => {
                const meta = SOURCE_META[source];
                const count = sourceCounts[source] || 0;
                if (count === 0) return null;

                return (
                  <button
                    key={source}
                    onClick={() => handleSourceClick(source)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedSource === source
                        ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                        : 'text-[var(--foreground)] hover:bg-[var(--accent)]'
                    }`}
                  >
                    <span>{meta.icon}</span>
                    <span>{meta.label}</span>
                    <span className="ml-auto text-xs opacity-70">{count}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Your Prompt Packs (Folders) */}
        <div className="mt-6">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">
              Your Prompt Packs
            </span>
            <button
              className="p-1 rounded hover:bg-[var(--accent)] text-[var(--muted-foreground)]"
              title="New Prompt Pack"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="mt-1 space-y-1">
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => {
                  setSelectedFolder(folder.id);
                  setSelectedSource('all');
                  onNavigate('library');
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
              >
                <Package size={18} style={{ color: folder.color || 'var(--primary)' }} />
                <span>{folder.name}</span>
              </button>
            ))}

            {folders.length === 0 && (
              <p className="px-3 py-2 text-xs text-[var(--muted-foreground)]">
                No Prompt Packs yet
              </p>
            )}
          </div>
        </div>

        {/* Import/Export */}
        <div className="mt-6 space-y-1">
          <button
            onClick={() => onNavigate('import')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              currentPage === 'import'
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                : 'text-[var(--foreground)] hover:bg-[var(--accent)]'
            }`}
          >
            <Upload size={18} />
            <span>Import</span>
          </button>

          <button
            onClick={() => onNavigate('export')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              currentPage === 'export'
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                : 'text-[var(--foreground)] hover:bg-[var(--accent)]'
            }`}
          >
            <Download size={18} />
            <span>Export</span>
          </button>
        </div>
      </nav>

      {/* Settings */}
      <div className="p-2 border-t border-[var(--border)]">
        <button
          onClick={() => onNavigate('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
            currentPage === 'settings'
              ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
              : 'text-[var(--foreground)] hover:bg-[var(--accent)]'
          }`}
        >
          <Settings size={18} />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}
