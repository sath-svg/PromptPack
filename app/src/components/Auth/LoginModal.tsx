import { useEffect } from 'react';
import { X, LogIn, Loader2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { openSignIn, isLoading, error, clearError, session, initAuthListener, closeAuthWindow } = useAuthStore();

  // Initialize auth callback listener
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    initAuthListener().then((fn) => {
      unlisten = fn;
    });

    return () => {
      if (unlisten) unlisten();
    };
  }, [initAuthListener]);

  // Close modal when session is received
  useEffect(() => {
    if (session && isOpen) {
      onClose();
    }
  }, [session, isOpen, onClose]);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    await openSignIn();
    // Close this modal since we're opening the auth window
    onClose();
  };

  const handleClose = () => {
    clearError();
    closeAuthWindow();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[var(--card)] rounded-xl shadow-xl border border-[var(--border)]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Sign In to PromptPack
          </h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-[var(--accent)] text-[var(--muted-foreground)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--primary)]/10 flex items-center justify-center mx-auto mb-4">
              <LogIn size={28} className="text-[var(--primary)]" />
            </div>
            <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
              Welcome to PromptPack
            </h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              Sign in to sync your prompts across devices and access premium features.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={handleSignIn}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Opening...</span>
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>Sign In</span>
                </>
              )}
            </button>

            <button
              onClick={handleClose}
              className="w-full px-4 py-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors text-sm"
            >
              Cancel
            </button>
          </div>

          <p className="text-xs text-center text-[var(--muted-foreground)]">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
