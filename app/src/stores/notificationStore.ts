import { create } from 'zustand';
import { classifyError, type AppError, type ClassifyContext } from '../lib/errors/classify';

export interface Notification {
  id: string;
  error: AppError;
  createdAt: number;
  /** null = sticky (no auto-dismiss). */
  ttlMs: number | null;
  count: number;
  pending: boolean;
}

interface NotificationState {
  notifications: Notification[];
  notify: (err: AppError, opts?: { ttlMs?: number | null }) => string;
  report: (
    err: unknown,
    ctx: ClassifyContext,
    opts?: { ttlMs?: number | null },
  ) => string | null;
  dismiss: (id: string) => void;
  dismissAll: () => void;
  setPending: (id: string, pending: boolean) => void;
}

const MAX_VISIBLE = 5;
const DEDUPE_WINDOW_MS = 30_000;

const STICKY_CATEGORIES: ReadonlySet<AppError['category']> = new Set([
  'auth',
  'payment',
  'permission',
]);

function defaultTtl(err: AppError): number | null {
  if (STICKY_CATEGORIES.has(err.category)) return null;
  if (err.severity === 'error') return null;
  if (err.severity === 'warning') return 8000;
  return 4000;
}

function makeId(): string {
  return `n_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],

  notify: (err, opts) => {
    const now = Date.now();
    const ttlMs = opts?.ttlMs !== undefined ? opts.ttlMs : defaultTtl(err);

    const list = get().notifications;
    const existing = list.find(
      (n) => n.error.dedupeKey === err.dedupeKey && now - n.createdAt < DEDUPE_WINDOW_MS,
    );

    if (existing) {
      set({
        notifications: list.map((n) =>
          n.id === existing.id
            ? { ...n, count: n.count + 1, createdAt: now, error: err }
            : n,
        ),
      });
      return existing.id;
    }

    const id = makeId();
    const next: Notification = {
      id,
      error: err,
      createdAt: now,
      ttlMs,
      count: 1,
      pending: false,
    };

    let updated = [...list, next];
    if (updated.length > MAX_VISIBLE) {
      const firstNonStickyIdx = updated.findIndex((n) => n.ttlMs !== null);
      if (firstNonStickyIdx !== -1) {
        updated = [
          ...updated.slice(0, firstNonStickyIdx),
          ...updated.slice(firstNonStickyIdx + 1),
        ];
      } else {
        // All sticky — drop oldest.
        updated = updated.slice(1);
      }
    }
    set({ notifications: updated });

    if (ttlMs !== null) {
      setTimeout(() => {
        const stillThere = get().notifications.find((n) => n.id === id);
        if (stillThere && !stillThere.pending) {
          get().dismiss(id);
        }
      }, ttlMs);
    }

    return id;
  },

  report: (err, ctx, opts) => {
    const appErr = classifyError(err, ctx);
    if (!appErr) return null;
    return get().notify(appErr, opts);
  },

  dismiss: (id) => {
    set({ notifications: get().notifications.filter((n) => n.id !== id) });
  },

  dismissAll: () => {
    set({ notifications: [] });
  },

  setPending: (id, pending) => {
    set({
      notifications: get().notifications.map((n) =>
        n.id === id ? { ...n, pending } : n,
      ),
    });
  },
}));
