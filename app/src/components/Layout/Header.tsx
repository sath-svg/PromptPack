import { useState } from 'react';
import { Search, Moon, Sun, Minus, Square, X } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { usePromptStore } from '../../stores/promptStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { UserMenu, LoginModal } from '../Auth';

export function Header() {
  const { searchQuery, setSearchQuery } = usePromptStore();
  const { theme, setTheme } = useSettingsStore();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const toggleTheme = () => {
    if (theme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Window control handlers
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

  return (
    <>
      <header className="h-12 border-b border-[var(--border)] bg-[var(--card)] flex items-center justify-between select-none">
        {/* Left side - Drag region */}
        <div
          className="flex-1 h-full flex items-center px-4"
          data-tauri-drag-region
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
          {/* Search - not draggable */}
          <div className="max-w-xl w-full" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
              />
              <input
                type="text"
                placeholder="Search prompts... (Ctrl+K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 rounded-md bg-[var(--background)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Right side - Actions and Window controls */}
        <div className="flex items-center h-full" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-[var(--accent)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          {/* User Menu */}
          <div className="px-2">
            <UserMenu onLoginClick={() => setShowLoginModal(true)} />
          </div>

          {/* Window Controls */}
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

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
}
