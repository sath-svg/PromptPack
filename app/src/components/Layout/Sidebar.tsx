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
  History,
  MessageSquare,
} from 'lucide-react';
import { useSyncStore } from '../../stores/syncStore';
import { useAuthStore } from '../../stores/authStore';
import { SOURCE_META } from '../../types';
import type { PromptSource } from '../../types';
import logoIcon from '../../assets/skillset-logo.png';

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
      className={`bg-[var(--sidebar)] border-r border-[var(--sidebar-border)] flex flex-col h-screen transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="px-3 border-b border-[var(--sidebar-border)] flex items-center justify-between min-h-[57px]">
        {!isCollapsed && (
          <div className="flex items-center gap-2 overflow-hidden transition-all duration-300">
            <img
              src={logoIcon}
              alt="Skillset"
              className="w-7 h-7 flex-shrink-0 rounded-md object-cover"
            />
            <h1 className="text-[15px] font-medium tracking-tight whitespace-nowrap text-[var(--foreground)]">
              Skillset
            </h1>
            <span
              className="ml-1 rounded-full border border-[var(--border)] px-1.5 py-0.5 text-[9px] uppercase tracking-[0.14em] text-[var(--muted-foreground)]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Beta
            </span>
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
            onClick={() => onNavigate('chat')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              currentPage === 'chat'
                ? 'bg-[var(--primary-soft)] text-[var(--foreground)] ring-1 ring-inset ring-[var(--primary)]/30'
                : 'text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]'
            }`}
            title={isCollapsed ? 'Chat' : undefined}
          >
            <MessageSquare size={18} className="flex-shrink-0" />
            <span className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
              Chat
            </span>
          </button>

          <button
            onClick={() => onNavigate('draft')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              currentPage === 'draft'
                ? 'bg-[var(--primary-soft)] text-[var(--foreground)] ring-1 ring-inset ring-[var(--primary)]/30'
                : 'text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]'
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
                ? 'bg-[var(--primary-soft)] text-[var(--foreground)] ring-1 ring-inset ring-[var(--primary)]/30'
                : 'text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]'
            }`}
            title={isCollapsed ? 'Saved from Extension' : undefined}
            data-tutorial="saved-packs"
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
                ? 'bg-[var(--primary-soft)] text-[var(--foreground)] ring-1 ring-inset ring-[var(--primary)]/30'
                : 'text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]'
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
              className="w-full flex items-center gap-2 px-3 py-2 text-[10px] text-[var(--muted-foreground)] uppercase tracking-[0.18em]"
              style={{ fontFamily: 'var(--font-mono)' }}
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
              className="w-full flex items-center gap-2 px-3 py-2 text-[10px] text-[var(--muted-foreground)] uppercase tracking-[0.18em]"
              style={{ fontFamily: 'var(--font-mono)' }}
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

        {/* PromptControl (version control) - Pro+ only */}
        {session && session.tier !== 'free' && (
          <div className={`space-y-1 ${isCollapsed ? 'mt-4 pt-4 border-t border-[var(--border)]' : 'mt-6'}`}>
            <button
              onClick={() => onNavigate('prompt-control')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                currentPage === 'prompt-control'
                  ? 'bg-[var(--primary-soft)] text-[var(--foreground)] ring-1 ring-inset ring-[var(--primary)]/30'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]'
              }`}
              title={isCollapsed ? 'PromptControl' : undefined}
            >
              <History size={18} className="flex-shrink-0" />
              <span className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                PromptControl
              </span>
            </button>
          </div>
        )}

        {/* Import/Export */}
        <div className={`space-y-1 ${isCollapsed ? 'mt-4 pt-4 border-t border-[var(--border)]' : 'mt-6'}`}>
          <button
            onClick={() => onNavigate('import')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              currentPage === 'import'
                ? 'bg-[var(--primary-soft)] text-[var(--foreground)] ring-1 ring-inset ring-[var(--primary)]/30'
                : 'text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]'
            }`}
            title={isCollapsed ? 'Import' : undefined}
            data-tutorial="import"
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
                ? 'bg-[var(--primary-soft)] text-[var(--foreground)] ring-1 ring-inset ring-[var(--primary)]/30'
                : 'text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]'
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
