import { useState } from 'react';
import { AlertCircle, AlertTriangle, Info, X, RefreshCw } from 'lucide-react';
import { open as openExternal } from '@tauri-apps/plugin-shell';
import { useNotificationStore, type Notification } from '../../stores/notificationStore';
import { useAuthStore } from '../../stores/authStore';
import { CopyDetailsButton } from './CopyDetailsButton';
import { InfoModal } from '../Common/InfoModal';
import type { ErrorAction, AppError } from '../../lib/errors/classify';

const PRICING_URL = 'https://skillset.so/pricing';
const TOPUP_URL = 'https://skillset.so/account';

function SeverityIcon({ severity }: { severity: AppError['severity'] }) {
  if (severity === 'error') return <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />;
  if (severity === 'warning') return <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />;
  return <Info size={16} className="text-[var(--primary)] flex-shrink-0 mt-0.5" />;
}

function bgFor(severity: AppError['severity']): string {
  if (severity === 'error') return 'bg-red-500/10 border-red-500/20';
  if (severity === 'warning') return 'bg-amber-500/10 border-amber-500/20';
  return 'bg-[var(--primary)]/5 border-[var(--primary)]/30';
}

function actionLabel(a: ErrorAction): string {
  if (a.label) return a.label;
  switch (a.kind) {
    case 'retry': return 'Retry';
    case 'sign_in': return 'Sign in';
    case 'top_up': return 'Top up';
    case 'upgrade': return 'Upgrade';
    case 'restart': return 'Restart';
    case 'open_url': return a.label;
    case 'dismiss': return 'Dismiss';
  }
}

function NotificationToast({
  notification,
  onDismiss,
  onRestartConfirm,
}: {
  notification: Notification;
  onDismiss: (id: string) => void;
  onRestartConfirm: () => void;
}) {
  const { error, id, count, pending } = notification;
  const openSignIn = useAuthStore((s) => s.openSignIn);
  const setPending = useNotificationStore((s) => s.setPending);

  const runAction = async (action: ErrorAction) => {
    switch (action.kind) {
      case 'retry': {
        if (!error.onRetry) {
          onDismiss(id);
          return;
        }
        setPending(id, true);
        try {
          await error.onRetry();
          onDismiss(id);
        } catch {
          // retry handler should surface its own error via report()
        } finally {
          setPending(id, false);
        }
        return;
      }
      case 'sign_in':
        onDismiss(id);
        openSignIn().catch(() => { /* swallow — toast already gone */ });
        return;
      case 'top_up':
        onDismiss(id);
        openExternal(TOPUP_URL).catch(() => { /* ignore */ });
        return;
      case 'upgrade':
        onDismiss(id);
        openExternal(action.url ?? PRICING_URL).catch(() => { /* ignore */ });
        return;
      case 'open_url':
        onDismiss(id);
        openExternal(action.url).catch(() => { /* ignore */ });
        return;
      case 'restart':
        onRestartConfirm();
        return;
      case 'dismiss':
        onDismiss(id);
        return;
    }
  };

  const primary = error.actions[0];
  const rest = error.actions.slice(1);

  return (
    <div
      className={`flex items-start gap-2.5 p-3 rounded-xl border shadow-lg backdrop-blur-sm ${bgFor(error.severity)}`}
      role="alert"
    >
      <SeverityIcon severity={error.severity} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-[var(--foreground)] truncate">{error.title}</p>
          {count > 1 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--muted-foreground)]/20 text-[var(--muted-foreground)]">
              ×{count}
            </span>
          )}
        </div>
        <p className="text-xs text-[var(--muted-foreground)] mt-0.5 leading-snug break-words">
          {error.message}
        </p>
        <div className="flex items-center gap-1 mt-2">
          {primary && primary.kind !== 'dismiss' && (
            <button
              type="button"
              disabled={pending}
              onClick={() => runAction(primary)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] text-xs hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {pending && primary.kind === 'retry' && <RefreshCw size={10} className="animate-spin" />}
              {actionLabel(primary)}
            </button>
          )}
          {rest.filter((a) => a.kind !== 'dismiss').map((a, i) => (
            <button
              key={i}
              type="button"
              disabled={pending}
              onClick={() => runAction(a)}
              className="px-2.5 py-1 rounded-md text-xs text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] transition-colors disabled:opacity-50"
            >
              {actionLabel(a)}
            </button>
          ))}
          <CopyDetailsButton error={error} />
        </div>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(id)}
        className="flex-shrink-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function NotificationCenter() {
  const notifications = useNotificationStore((s) => s.notifications);
  const dismiss = useNotificationStore((s) => s.dismiss);
  const [restartOpen, setRestartOpen] = useState(false);

  if (notifications.length === 0 && !restartOpen) return null;

  return (
    <>
      <div
        className="fixed bottom-4 right-4 flex flex-col gap-2 w-[360px] max-w-[calc(100vw-2rem)]"
        style={{ zIndex: 60 }}
      >
        {notifications.map((n) => (
          <NotificationToast
            key={n.id}
            notification={n}
            onDismiss={dismiss}
            onRestartConfirm={() => setRestartOpen(true)}
          />
        ))}
      </div>
      <InfoModal
        open={restartOpen}
        title="Restart Skillset?"
        primaryLabel="Quit Skillset"
        secondaryLabel="Cancel"
        onPrimary={() => {
          // No app_restart Tauri command exists — instruct the user.
          // Reload the webview so frontend state at least resets.
          window.location.reload();
        }}
        onClose={() => setRestartOpen(false)}
      >
        Skillset will reload to recover. If the problem persists, quit the app
        from the system tray or dock and reopen it.
      </InfoModal>
    </>
  );
}
