import { useState, useRef, useEffect, useMemo, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Moon, Sun, Minus, Square, X, CornerDownLeft } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { usePromptStore } from '../../stores/promptStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useSyncStore } from '../../stores/syncStore';
import { UserMenu, LoginModal } from '../Auth';
import { searchItems, type ScoredItem, type SearchItem } from '../../lib/searchIndex';

interface HeaderProps {
  onNavigate?: (page: string) => void;
}

export function Header({ onNavigate }: HeaderProps = {}) {
  const { searchQuery, setSearchQuery } = usePromptStore();
  const { theme, setTheme } = useSettingsStore();
  const { userPacks, loadedUserPacks, setSelectedPackId } = useSyncStore();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const [isOpen, setIsOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [dropdownRect, setDropdownRect] = useState<{ left: number; top: number; width: number }>({ left: 0, top: 0, width: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Dynamic items: user skillsets + headers of any loaded prompts inside them.
  const dynamicItems: SearchItem[] = useMemo(() => {
    const items: SearchItem[] = [];
    for (const pack of userPacks) {
      const titleLower = pack.title.toLowerCase();
      items.push({
        id: `pack-${pack.id}`,
        label: pack.title,
        category: 'Skillsets',
        page: 'user-packs',
        packId: pack.id,
        keywords: [
          titleLower,
          'skillset',
          'pack',
          pack.description?.toLowerCase() || '',
          pack.category?.toLowerCase() || '',
        ].filter(Boolean),
      });

      const loaded = loadedUserPacks[pack.id];
      if (!loaded) continue;
      loaded.prompts.forEach((prompt, idx) => {
        if (!prompt.header) return;
        items.push({
          id: `prompt-${pack.id}-${idx}`,
          label: prompt.header,
          category: `Skillsets · ${pack.title}`,
          page: 'user-packs',
          packId: pack.id,
          section: `prompt-${pack.id}-${idx}`,
          keywords: [
            prompt.header.toLowerCase(),
            titleLower,
            'prompt',
            'skill',
          ],
        });
      });
    }
    return items;
  }, [userPacks, loadedUserPacks]);

  const results: ScoredItem[] = useMemo(
    () => searchItems(searchQuery, 8, dynamicItems),
    [searchQuery, dynamicItems]
  );

  const toggleTheme = () => {
    if (theme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const handleMinimize = async () => {
    const appWindow = getCurrentWindow();
    await appWindow.minimize();
  };

  const handleMaximize = async () => {
    const appWindow = getCurrentWindow();
    const maximized = await appWindow.isMaximized();
    if (maximized) {
      await appWindow.unmaximize();
      setIsMaximized(false);
    } else {
      await appWindow.maximize();
      setIsMaximized(true);
    }
  };

  const handleClose = async () => {
    const appWindow = getCurrentWindow();
    await appWindow.close();
  };

  // Ctrl/Cmd+K to focus search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Click outside closes dropdown — must also exclude the portaled dropdown
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      const insideContainer = containerRef.current && containerRef.current.contains(t);
      const insideDropdown = dropdownRef.current && dropdownRef.current.contains(t);
      if (!insideContainer && !insideDropdown) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Track input rect for portaled dropdown positioning.
  useLayoutEffect(() => {
    if (!isOpen) return;
    const update = () => {
      const r = inputRef.current?.getBoundingClientRect();
      if (r) setDropdownRect({ left: r.left, top: r.bottom + 6, width: r.width });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [isOpen]);

  // Reset active index when results change
  useEffect(() => {
    setActiveIdx(0);
  }, [searchQuery]);

  const pickResult = (item: ScoredItem) => {
    setIsOpen(false);
    setSearchQuery('');
    inputRef.current?.blur();
    if (item.packId) {
      setSelectedPackId(item.packId);
    } else if (item.page === 'user-packs') {
      setSelectedPackId(null);
    }
    if (onNavigate) {
      onNavigate(item.page);
    } else {
      window.dispatchEvent(new CustomEvent('skillset:navigate', { detail: item.page }));
    }
    if (item.section) {
      const sectionId = item.section;
      // Poll for the target. Destination page may still be mounting/laying out
      // after the navigation state update. Retry until the element is rendered
      // AND its offsetTop is non-zero (proxy for layout completion).
      let tries = 0;
      const tryScroll = () => {
        const el = document.getElementById(sectionId);
        if (el && el.offsetTop > 0) {
          el.scrollIntoView({ behavior: 'auto', block: 'start' });
          el.classList.add('search-flash');
          setTimeout(() => el.classList.remove('search-flash'), 1500);
          return;
        }
        if (++tries < 30) setTimeout(tryScroll, 30);
      };
      setTimeout(tryScroll, 30);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!isOpen || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = results[activeIdx];
      if (item) pickResult(item);
    }
  };

  return (
    <>
      <header className="relative z-40 h-12 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl flex items-center justify-between select-none">
        {/* Left side - Drag region */}
        <div
          className="flex-1 h-full flex items-center px-4"
          data-tauri-drag-region
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
          {/* Search - not draggable */}
          <div ref={containerRef} className="max-w-xl w-full relative" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
              />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search ( Ctrl + K )"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setIsOpen(true); }}
                onFocus={() => setIsOpen(true)}
                onKeyDown={onKeyDown}
                className="w-full pl-9 pr-4 py-1.5 rounded-full bg-[var(--accent)] border border-[var(--border)] text-[13px] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]/40 focus:border-[var(--ring)]/30 transition-all"
              />
            </div>

          </div>
        </div>

        {/* Right side - Actions and Window controls */}
        <div className="flex items-center h-full" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-[var(--accent)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          <div className="px-2" data-tutorial="sign-in">
            <UserMenu onLoginClick={() => setShowLoginModal(true)} />
          </div>

          <div className="flex items-center h-full">
            <button
              onClick={handleMinimize}
              className="w-12 h-full flex items-center justify-center hover:bg-[var(--accent)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              title="Minimize"
            >
              <Minus size={16} />
            </button>
            <button
              onClick={handleMaximize}
              className="w-12 h-full flex items-center justify-center hover:bg-[var(--accent)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              title={isMaximized ? 'Restore' : 'Maximize'}
            >
              <Square size={14} />
            </button>
            <button
              onClick={handleClose}
              className="w-12 h-full flex items-center justify-center hover:bg-red-500 text-[var(--muted-foreground)] hover:text-white transition-colors"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Portaled search results — escape any local stacking context */}
      {isOpen && searchQuery.trim() && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            left: dropdownRect.left,
            top: dropdownRect.top,
            width: dropdownRect.width,
            zIndex: 9999,
          }}
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-xl overflow-hidden max-h-[60vh] overflow-y-auto"
        >
          {results.length === 0 ? (
            <div className="px-3 py-4 text-xs text-[var(--muted-foreground)] text-center">
              No matches for "{searchQuery}"
            </div>
          ) : (
            <ul role="listbox" className="py-1">
              {results.map((item, idx) => (
                <li
                  key={item.id}
                  role="option"
                  aria-selected={idx === activeIdx}
                  onMouseDown={(e) => { e.preventDefault(); pickResult(item); }}
                  onMouseEnter={() => setActiveIdx(idx)}
                  className={`px-3 py-2 flex items-center justify-between gap-3 cursor-pointer text-sm ${
                    idx === activeIdx ? 'bg-[var(--accent)]' : 'hover:bg-[var(--accent)]/60'
                  }`}
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-[var(--foreground)] truncate">{item.label}</span>
                    <span className="text-[11px] text-[var(--muted-foreground)] truncate">{item.category}</span>
                  </div>
                  {idx === activeIdx && (
                    <CornerDownLeft size={12} className="text-[var(--muted-foreground)] shrink-0" />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>,
        document.body
      )}

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
}
