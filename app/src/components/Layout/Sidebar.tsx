import { useState } from 'react';
import {
  Upload,
  Download,
  Settings,
  ChevronDown,
  ChevronRight,
  Package,
  FileEdit,
  Cloud,
  PanelLeftClose,
} from 'lucide-react';
import { useSyncStore } from '../../stores/syncStore';
import { useAuthStore } from '../../stores/authStore';
import { SOURCE_META } from '../../types';
import type { PromptSource } from '../../types';
import logoIcon from '../../assets/icon-512.png';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ currentPage, onNavigate, isCollapsed, onToggleCollapse }: SidebarProps) {
  const [savedPacksExpanded, setSavedPacksExpanded] = useState(true);
  const [userPacksExpanded, setUserPacksExpanded] = useState(true);
  const { cloudPacks, userPacks, selectedPackId, setSelectedPackId } = useSyncStore();
  const { session } = useAuthStore();

  return (
    <aside
      className={`bg-[var(--card)] border-r border-[var(--border)] flex flex-col h-screen transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="p-3 border-b border-[var(--border)] flex items-center justify-between min-h-[57px]">
        {!isCollapsed && (
          <div className="flex items-center gap-2 overflow-hidden transition-all duration-300">
            <img src={logoIcon} alt="PromptPack" className="w-8 h-8 flex-shrink-0" />
            <h1
              className="text-xl font-bold whitespace-nowrap"
              style={{
                background: 'linear-gradient(90deg, #7C5CFF, #A78BFA)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              PromptPack
            </h1>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className={`p-1.5 rounded-md text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] transition-all duration-300 flex-shrink-0 ${
            isCollapsed ? 'mx-auto' : 'ml-2'
          }`}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <div className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : 'rotate-0'}`}>
            <PanelLeftClose size={18} />
          </div>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2">
        {/* Main Navigation */}
        <div className="space-y-1">
          <button
            onClick={() => onNavigate('draft')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              currentPage === 'draft'
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                : 'text-[var(--foreground)] hover:bg-[var(--accent)]'
            }`}
            title={isCollapsed ? 'Draft' : undefined}
          >
            <FileEdit size={18} className="flex-shrink-0" />
            <span className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
              Draft
            </span>
          </button>

          <button
            onClick={() => {
              setSelectedPackId(null);
              onNavigate('saved-packs');
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              currentPage === 'saved-packs' && !selectedPackId
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                : 'text-[var(--foreground)] hover:bg-[var(--accent)]'
            }`}
            title={isCollapsed ? 'Saved from Extension' : undefined}
          >
            <Cloud size={18} className="flex-shrink-0" />
            <span className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
              Saved from Extension
            </span>
            {!isCollapsed && session && cloudPacks.length > 0 && (
              <span className="ml-auto text-xs opacity-70">
                {cloudPacks.reduce((sum, p) => sum + p.promptCount, 0)}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setSelectedPackId(null);
              onNavigate('user-packs');
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              currentPage === 'user-packs' && !selectedPackId
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                : 'text-[var(--foreground)] hover:bg-[var(--accent)]'
            }`}
            title={isCollapsed ? 'Your Prompt Packs' : undefined}
          >
            <Package size={18} className="flex-shrink-0" />
            <span className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
              Your Prompt Packs
            </span>
          </button>
        </div>

        {/* Saved Prompt Packs (from extension/cloud) - collapsible list */}
        {!isCollapsed && session && cloudPacks.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => setSavedPacksExpanded(!savedPacksExpanded)}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide"
            >
              {savedPacksExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              Saved Packs
            </button>

            {savedPacksExpanded && (
              <div className="mt-1 space-y-1">
                {cloudPacks.map((pack) => {
                  const meta = SOURCE_META[pack.source as PromptSource];
                  return (
                    <button
                      key={pack.id}
                      onClick={() => {
                        setSelectedPackId(pack.id);
                        onNavigate('saved-packs');
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        currentPage === 'saved-packs' && selectedPackId === pack.id
                          ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                          : 'text-[var(--foreground)] hover:bg-[var(--accent)]'
                      }`}
                    >
                      <span className="text-lg">{meta?.icon || '📦'}</span>
                      <span className="truncate">{meta?.label || pack.source}</span>
                      <span className="ml-auto text-xs opacity-70">{pack.promptCount}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Your Prompt Packs (from Convex userPacks) - collapsible list */}
        {!isCollapsed && session && userPacks.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => setUserPacksExpanded(!userPacksExpanded)}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide"
            >
              {userPacksExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              Your Packs
            </button>

            {userPacksExpanded && (
              <div className="mt-1 space-y-1">
                {userPacks.map((pack) => (
                  <button
                    key={pack.id}
                    onClick={() => {
                      setSelectedPackId(pack.id);
                      onNavigate('user-packs');
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      currentPage === 'user-packs' && selectedPackId === pack.id
                        ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                        : 'text-[var(--foreground)] hover:bg-[var(--accent)]'
                    }`}
                  >
                    {pack.icon ? (
                      <span className="text-lg">{pack.icon}</span>
                    ) : (
                      <Package size={18} className={selectedPackId === pack.id ? '' : 'text-[var(--primary)]'} />
                    )}
                    <span className="truncate">{pack.title}</span>
                    <span className="ml-auto text-xs opacity-70">{pack.promptCount}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Import/Export */}
        <div className={`space-y-1 ${isCollapsed ? 'mt-4 pt-4 border-t border-[var(--border)]' : 'mt-6'}`}>
          <button
            onClick={() => onNavigate('import')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              currentPage === 'import'
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                : 'text-[var(--foreground)] hover:bg-[var(--accent)]'
            }`}
            title={isCollapsed ? 'Import' : undefined}
          >
            <Upload size={18} className="flex-shrink-0" />
            <span className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
              Import
            </span>
          </button>

          <button
            onClick={() => onNavigate('export')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              currentPage === 'export'
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                : 'text-[var(--foreground)] hover:bg-[var(--accent)]'
            }`}
            title={isCollapsed ? 'Export' : undefined}
          >
            <Download size={18} className="flex-shrink-0" />
            <span className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
              Export
            </span>
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
          title={isCollapsed ? 'Settings' : undefined}
        >
          <Settings size={18} className="flex-shrink-0" />
          <span className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
            Settings
          </span>
        </button>
      </div>
    </aside>
  );
}
