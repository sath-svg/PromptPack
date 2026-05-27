import { useState } from 'react';
import {
  Upload,
  Download,
  Settings,
  ChevronDown,
  ChevronRight,
  Package,
  FileEdit,
  PanelLeftClose,
  History,
  MessageSquare,
  Palette,
  Store,
} from 'lucide-react';
import { useSyncStore } from '../../stores/syncStore';
import { useAuthStore } from '../../stores/authStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { ConversationSwitcher } from '../SkillChat/ConversationSwitcher';
import logoIcon from '../../assets/skillset-logo.png';

const SkillyStarIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 130"
    style={{ flexShrink: 0 }}
    aria-hidden
  >
    <g strokeLinejoin="round" strokeLinecap="round">
      <polygon
        points="58,14 78,56 106,42 88,76 98,108 58,86 18,112 30,78 10,50 40,50"
        fill="#2b6bff"
        stroke="#2b6bff"
        strokeWidth="22"
      />
      <polygon
        points="58.7,31.9 71.7,59.2 89.9,50.1 78.2,72.2 84.7,93 58.7,78.7 32.7,95.6 40.5,73.5 27.5,55.3 47,55.3"
        fill="#aac7ff"
        stroke="#aac7ff"
        strokeWidth="10"
      />
    </g>
    <circle cx="48" cy="60" r="3.5" fill="#0d266b" />
    <circle cx="74" cy="63" r="3" fill="#0d266b" />
  </svg>
);

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ currentPage, onNavigate, isCollapsed, onToggleCollapse }: SidebarProps) {
  const [userPacksExpanded, setUserPacksExpanded] = useState(true);
  const { userPacks, selectedPackId, setSelectedPackId } = useSyncStore();
  const { session } = useAuthStore();
  const skillyEnabled = useSettingsStore((s) => s.skillyEnabled);

  return (
    <aside
      className={`bg-[var(--sidebar)] border-r border-[var(--sidebar-border)] flex flex-col h-screen transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo + collapse toggle.
          Collapsed: ONE element — the logo doubles as the expand
          button. Avoids the prior bug where a separate logo image +
          chevron button both rendered inside the narrow w-16 column
          and crammed on top of each other.
          Expanded: logo (decorative) + title + Beta chip on the left,
          chevron collapse button on the right. */}
      <div className="px-3 border-b border-[var(--sidebar-border)] flex items-center justify-between min-h-[57px]">
        {isCollapsed ? (
          <button
            onClick={onToggleCollapse}
            className="mx-auto p-0.5 rounded-md hover:ring-2 hover:ring-[var(--primary)]/30 transition-all duration-200"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <img
              src={logoIcon}
              alt="Skillset"
              className="w-7 h-7 flex-shrink-0 rounded-md object-cover"
            />
          </button>
        ) : (
          <>
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
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] transition-all duration-300 flex-shrink-0 ml-2"
              title="Collapse sidebar"
            >
              <div className="transition-transform duration-300 rotate-0">
                <PanelLeftClose size={18} />
              </div>
            </button>
          </>
        )}
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
            data-tutorial="skill-chat"
          >
            <MessageSquare size={18} className="flex-shrink-0" />
            <span className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
              Chat
            </span>
          </button>

          {/* Conversation list — inline, sidebar-native. Max 3 chats.
              Only renders when the user is on the Chat page so the
              sidebar nav stays compact while working in Skill Preset /
              Marketplace / Settings. Also hidden in collapsed mode
              (no room for titles). */}
          {!isCollapsed && currentPage === 'chat' && (
            <ConversationSwitcher onSwitch={() => onNavigate('chat')} />
          )}

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
            onClick={() => onNavigate('skill-preset')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              currentPage === 'skill-preset'
                ? 'bg-[var(--primary-soft)] text-[var(--foreground)] ring-1 ring-inset ring-[var(--primary)]/30'
                : 'text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]'
            }`}
            title={isCollapsed ? 'Skill Preset' : undefined}
            data-tutorial="skill-preset"
          >
            <Palette size={18} className="flex-shrink-0" />
            <span className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
              Skill Preset
            </span>
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
            title={isCollapsed ? 'Your Skillsets' : undefined}
            data-tutorial="your-skillsets"
          >
            <Package size={18} className="flex-shrink-0" />
            <span className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
              Your Skillsets
            </span>
          </button>

          <button
            onClick={() => onNavigate('marketplace')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              currentPage === 'marketplace'
                ? 'bg-[var(--primary-soft)] text-[var(--foreground)] ring-1 ring-inset ring-[var(--primary)]/30'
                : 'text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]'
            }`}
            title={isCollapsed ? 'Marketplace' : undefined}
            data-tutorial="marketplace"
          >
            <Store size={18} className="flex-shrink-0" />
            <span className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
              Marketplace
            </span>
          </button>
        </div>

        {/* Your Skillsets (from Convex userPacks) - collapsible list */}
        {!isCollapsed && session && userPacks.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => setUserPacksExpanded(!userPacksExpanded)}
              className="w-full flex items-center gap-2 px-3 py-2 text-[10px] text-[var(--muted-foreground)] uppercase tracking-[0.18em]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {userPacksExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              Your Sets
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

        {/* SkillControl (version control) - Pro+ only */}
        {session && session.tier !== 'free' && (
          <div className={`space-y-1 ${isCollapsed ? 'mt-4 pt-4 border-t border-[var(--border)]' : 'mt-6'}`}>
            <button
              onClick={() => onNavigate('prompt-control')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                currentPage === 'prompt-control'
                  ? 'bg-[var(--primary-soft)] text-[var(--foreground)] ring-1 ring-inset ring-[var(--primary)]/30'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]'
              }`}
              title={isCollapsed ? 'Skill Control' : undefined}
              data-tutorial="skill-control"
            >
              <History size={18} className="flex-shrink-0" />
              <span className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                Skill Control
              </span>
            </button>
          </div>
        )}

        {/* Import/Export */}
        <div className={`space-y-1 ${isCollapsed ? 'mt-4 pt-4 border-t border-[var(--border)]' : 'mt-1'}`}>
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

      {/* Skilly + Settings */}
      <div className="p-2 border-t border-[var(--border)] space-y-1">
        {skillyEnabled !== false && (
          <button
            onClick={() => onNavigate('skilly')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              currentPage === 'skilly'
                ? 'bg-[var(--primary-soft)] text-[var(--foreground)] ring-1 ring-inset ring-[var(--primary)]/30'
                : 'text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]'
            }`}
            title={isCollapsed ? 'Skilly' : undefined}
          >
            <SkillyStarIcon size={18} />
            <span className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
              Skilly
            </span>
          </button>
        )}
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
