import { useState, useRef, useEffect } from 'react';
import { User, LogOut, Cloud, CloudOff, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

interface UserMenuProps {
  onLoginClick: () => void;
}

export function UserMenu({ onLoginClick }: UserMenuProps) {
  const { session, logout, isLoading } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  // Not logged in
  if (!session) {
    return (
      <button
        onClick={onLoginClick}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity text-sm"
      >
        <CloudOff size={16} />
        <span>Sign In</span>
      </button>
    );
  }

  // Logged in
  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--accent)] transition-colors text-sm"
      >
        {session.image_url ? (
          <img
            src={session.image_url}
            alt="Profile"
            className="w-6 h-6 rounded-full"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-[var(--primary)] flex items-center justify-center">
            <User size={14} className="text-[var(--primary-foreground)]" />
          </div>
        )}
        <span className="text-[var(--foreground)] max-w-[120px] truncate">
          {session.name || session.email || 'User'}
        </span>
        <Cloud size={14} className="text-green-400" />
        <ChevronDown size={14} className="text-[var(--muted-foreground)]" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-[var(--card)] rounded-lg shadow-xl border border-[var(--border)] overflow-hidden z-50">
          {/* User Info */}
          <div className="p-3 border-b border-[var(--border)]">
            <p className="text-sm font-medium text-[var(--foreground)] truncate">
              {session.name || 'User'}
            </p>
            {session.email && (
              <p className="text-xs text-[var(--muted-foreground)] truncate">
                {session.email}
              </p>
            )}
            <div className="mt-2 flex items-center gap-1.5">
              <span className="px-2 py-0.5 text-xs rounded-full bg-[var(--primary)]/20 text-[var(--primary)] capitalize">
                {session.tier}
              </span>
              <span className="flex items-center gap-1 text-xs text-green-400">
                <Cloud size={12} />
                Synced
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="p-1">
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
