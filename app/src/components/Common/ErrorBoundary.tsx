import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { useNotificationStore } from '../../stores/notificationStore';
import { CopyDetailsButton } from '../Notifications/CopyDetailsButton';
import type { AppError } from '../../lib/errors/classify';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional callback to navigate away — used to render a "Go to chat" link. */
  onGoHome?: () => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    useNotificationStore.getState().report(error, {
      source: 'react.errorBoundary',
    });
    // Keep raw context for the Copy details payload via console too.
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const fallbackError: AppError = {
      category: 'unknown',
      severity: 'error',
      title: 'Something broke on this page',
      message: error.message || 'An unexpected error occurred while rendering.',
      actions: [{ kind: 'dismiss' }],
      details: `${error.name}: ${error.message}\n${error.stack ?? ''}`,
      dedupeKey: 'react.errorBoundary',
      source: 'react.errorBoundary',
    };

    return (
      <div className="flex items-center justify-center min-h-[60vh] p-8">
        <div className="max-w-md w-full rounded-xl border border-red-500/20 bg-[var(--card)] p-6 shadow-lg">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-[var(--foreground)]">
                Something broke on this page
              </h2>
              <p className="text-sm text-[var(--muted-foreground)] mt-1 break-words">
                {error.message || 'An unexpected error occurred.'}
              </p>
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm hover:opacity-90 transition-opacity"
                >
                  <RefreshCw size={12} />
                  Reload Skillset
                </button>
                {this.props.onGoHome && (
                  <button
                    type="button"
                    onClick={() => {
                      this.reset();
                      this.props.onGoHome?.();
                    }}
                    className="px-3 py-1.5 rounded-lg text-sm text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] transition-colors"
                  >
                    Go to chat
                  </button>
                )}
                <CopyDetailsButton error={fallbackError} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
