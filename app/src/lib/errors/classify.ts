/**
 * Single entry point for converting any thrown thing into a structured
 * AppError that the notification system can render. Delegates HTTP body
 * text to existing `friendlyApiError` so error copy stays consistent.
 *
 * Detection order: domain Error classes (by `.name` — they live in
 * chatStore and aren't exported) → TypeError network failure from
 * tauriFetch → AbortError (returns null, never a toast) → HTTP status
 * (if caller supplied one) → Tauri invoke string heuristics → unknown.
 */

import { friendlyApiError, safeParseErrorBody, type ApiErrorBody } from '../apiErrors';

export type ErrorCategory =
  | 'network'
  | 'auth'
  | 'permission'
  | 'not_found'
  | 'rate_limit'
  | 'payment'
  | 'server'
  | 'validation'
  | 'client'
  | 'unknown';

export type ErrorAction =
  | { kind: 'retry'; label?: string }
  | { kind: 'sign_in'; label?: string }
  | { kind: 'top_up'; label?: string }
  | { kind: 'upgrade'; label?: string; url?: string }
  | { kind: 'restart'; label?: string }
  | { kind: 'open_url'; url: string; label: string }
  | { kind: 'install_update'; label?: string }
  | { kind: 'dismiss'; label?: string };

export type ErrorSeverity = 'info' | 'warning' | 'error';

export interface AppError {
  category: ErrorCategory;
  severity: ErrorSeverity;
  title: string;
  message: string;
  actions: ErrorAction[];
  details: string;
  dedupeKey: string;
  source: string;
  /** Optional retry callback wired by caller. Toast renders Retry button. */
  onRetry?: () => void | Promise<void>;
}

export interface ClassifyContext {
  source: string;
  status?: number;
  body?: ApiErrorBody;
  onRetry?: () => void | Promise<void>;
}

function stringifyDetails(err: unknown, ctx: ClassifyContext): string {
  const parts: string[] = [];
  if (ctx.status !== undefined) parts.push(`status: ${ctx.status}`);
  if (ctx.body) parts.push(`body: ${JSON.stringify(ctx.body)}`);
  if (err instanceof Error) {
    parts.push(`name: ${err.name}`);
    parts.push(`message: ${err.message}`);
    if (err.stack) parts.push(`stack:\n${err.stack}`);
    const cause = (err as { cause?: unknown }).cause;
    if (cause !== undefined) parts.push(`cause: ${String(cause)}`);
  } else if (typeof err === 'string') {
    parts.push(`raw: ${err}`);
  } else if (err != null) {
    try {
      parts.push(`raw: ${JSON.stringify(err)}`);
    } catch {
      parts.push(`raw: ${String(err)}`);
    }
  }
  return parts.join('\n');
}

function tauriErrorString(err: unknown): string {
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

/**
 * Returns null for AbortError (user cancel) — caller should drop, never
 * surface as a toast. Returns AppError for everything else.
 */
export function classifyError(err: unknown, ctx: ClassifyContext): AppError | null {
  // 0. User cancel → never a toast.
  if (err instanceof Error && err.name === 'AbortError') return null;

  const details = stringifyDetails(err, ctx);

  // 1. Domain error classes from chatStore (name-based to avoid coupling).
  if (err instanceof Error) {
    switch (err.name) {
      case 'SessionExpiredError':
        return {
          category: 'auth',
          severity: 'error',
          title: 'Session expired',
          message: 'Sign in again to continue.',
          actions: [{ kind: 'sign_in' }, { kind: 'dismiss' }],
          details,
          dedupeKey: 'auth.session_expired',
          source: ctx.source,
        };
      case 'InsufficientCreditsError':
        return {
          category: 'payment',
          severity: 'error',
          title: 'Out of credits',
          message: 'Top up to keep using managed mode, or add your own provider key in Settings → Advanced.',
          actions: [{ kind: 'top_up' }, { kind: 'dismiss' }],
          details,
          dedupeKey: 'payment.insufficient_credits',
          source: ctx.source,
        };
      case 'SkillFlowLockedError':
        return {
          category: 'permission',
          severity: 'warning',
          title: 'Pro feature',
          message: err.message,
          actions: [{ kind: 'upgrade', url: 'https://skillset.so/pricing' }, { kind: 'dismiss' }],
          details,
          dedupeKey: 'permission.skillflow_locked',
          source: ctx.source,
        };
      case 'FrontierLockedError':
        return {
          category: 'permission',
          severity: 'warning',
          title: 'Pro feature',
          message: err.message,
          actions: [{ kind: 'upgrade', url: 'https://skillset.so/pricing' }, { kind: 'dismiss' }],
          details,
          dedupeKey: 'permission.frontier_locked',
          source: ctx.source,
        };
      case 'DailyLimitError':
        return {
          category: 'rate_limit',
          severity: 'warning',
          title: 'Daily limit reached',
          message: err.message,
          actions: [{ kind: 'upgrade', url: 'https://skillset.so/pricing' }, { kind: 'dismiss' }],
          details,
          dedupeKey: 'rate_limit.daily',
          source: ctx.source,
        };
    }
  }

  // 2. Network failure from tauriFetch (TypeError with the wrapper prefix).
  if (err instanceof TypeError && err.message.startsWith('Network request failed:')) {
    return {
      category: 'network',
      severity: 'warning',
      title: "Can't reach Skillset",
      message: 'Check your connection and try again.',
      actions: ctx.onRetry
        ? [{ kind: 'retry' }, { kind: 'dismiss' }]
        : [{ kind: 'dismiss' }],
      details,
      dedupeKey: 'network.unreachable',
      source: ctx.source,
      onRetry: ctx.onRetry,
    };
  }

  // 3. HTTP status (caller already parsed).
  if (ctx.status !== undefined) {
    return fromHttp(ctx.status, ctx.body, ctx, details);
  }

  // 4. Tauri invoke errors (Rust surfaces as string or Error w/ string message).
  const tauriMsg = tauriErrorString(err);
  if (tauriMsg) {
    const lower = tauriMsg.toLowerCase();
    // File too large keyword (Rust may include "exceeds" or "too large").
    if (lower.includes('too large') || lower.includes('exceeds')) {
      return {
        category: 'client',
        severity: 'warning',
        title: 'File too large',
        message: tauriMsg,
        actions: [{ kind: 'dismiss' }],
        details,
        dedupeKey: 'client.file_too_large',
        source: ctx.source,
      };
    }
    if (lower.includes('permission denied') || lower.includes('os error 5')) {
      return {
        category: 'client',
        severity: 'error',
        title: 'Permission denied',
        message: "Skillset can't access this file. Try opening a different workspace folder.",
        actions: [{ kind: 'restart' }, { kind: 'dismiss' }],
        details,
        dedupeKey: 'client.permission_denied',
        source: ctx.source,
      };
    }
    if (lower.includes('os error 28') || lower.includes('no space')) {
      return {
        category: 'client',
        severity: 'error',
        title: 'Disk full',
        message: 'Free up space on your disk and try again.',
        actions: [{ kind: 'dismiss' }],
        details,
        dedupeKey: 'client.disk_full',
        source: ctx.source,
      };
    }
    if (lower.includes('not found') || lower.includes('enoent') || lower.includes('os error 2')) {
      return {
        category: 'client',
        severity: 'warning',
        title: 'File not found',
        message: 'The file may have been moved or deleted.',
        actions: [{ kind: 'dismiss' }],
        details,
        dedupeKey: `client.not_found:${ctx.source}`,
        source: ctx.source,
      };
    }
  }

  // 5. Unknown fallthrough.
  return {
    category: 'unknown',
    severity: 'error',
    title: 'Something went wrong',
    message: err instanceof Error && err.message ? err.message : 'An unexpected error occurred.',
    actions: ctx.onRetry
      ? [{ kind: 'retry' }, { kind: 'dismiss' }]
      : [{ kind: 'dismiss' }],
    details,
    dedupeKey: `unknown:${ctx.source}`,
    source: ctx.source,
    onRetry: ctx.onRetry,
  };
}

function fromHttp(
  status: number,
  body: ApiErrorBody | undefined,
  ctx: ClassifyContext,
  details: string,
): AppError {
  const code = body?.code ?? '';
  const message = friendlyApiError(status, body, 'chat');

  if (status === 401) {
    return {
      category: 'auth',
      severity: 'error',
      title: 'Session expired',
      message: 'Sign in again to continue.',
      actions: [{ kind: 'sign_in' }, { kind: 'dismiss' }],
      details,
      dedupeKey: 'auth.session_expired',
      source: ctx.source,
    };
  }
  if (status === 402) {
    return {
      category: 'payment',
      severity: 'error',
      title: 'Out of credits',
      message,
      actions: [{ kind: 'top_up' }, { kind: 'dismiss' }],
      details,
      dedupeKey: 'payment.insufficient_credits',
      source: ctx.source,
    };
  }
  if (status === 403) {
    if (code === 'SKILLFLOW_REQUIRES_PAID' || code === 'FRONTIER_NOT_ALLOWED') {
      return {
        category: 'permission',
        severity: 'warning',
        title: 'Pro feature',
        message,
        actions: [{ kind: 'upgrade', url: 'https://skillset.so/pricing' }, { kind: 'dismiss' }],
        details,
        dedupeKey: `permission.${code}`,
        source: ctx.source,
      };
    }
    return {
      category: 'permission',
      severity: 'warning',
      title: 'Not allowed',
      message,
      actions: [{ kind: 'dismiss' }],
      details,
      dedupeKey: `permission.generic:${ctx.source}`,
      source: ctx.source,
    };
  }
  if (status === 404) {
    return {
      category: 'not_found',
      severity: 'warning',
      title: 'Not found',
      message: body?.message || "The item you requested doesn't exist.",
      actions: [{ kind: 'dismiss' }],
      details,
      dedupeKey: `not_found:${ctx.source}`,
      source: ctx.source,
    };
  }
  if (status === 429) {
    if (code === 'DAILY_FREE_LIMIT_REACHED') {
      return {
        category: 'rate_limit',
        severity: 'warning',
        title: 'Daily limit reached',
        message,
        actions: [{ kind: 'upgrade', url: 'https://skillset.so/pricing' }, { kind: 'dismiss' }],
        details,
        dedupeKey: 'rate_limit.daily',
        source: ctx.source,
      };
    }
    return {
      category: 'rate_limit',
      severity: 'info',
      title: 'Slow down',
      message,
      actions: ctx.onRetry
        ? [{ kind: 'retry' }, { kind: 'dismiss' }]
        : [{ kind: 'dismiss' }],
      details,
      dedupeKey: 'rate_limit.transient',
      source: ctx.source,
      onRetry: ctx.onRetry,
    };
  }
  if (status === 502 || status === 503 || status === 504) {
    return {
      category: 'server',
      severity: 'warning',
      title: 'Provider unavailable',
      message,
      actions: ctx.onRetry
        ? [{ kind: 'retry' }, { kind: 'dismiss' }]
        : [{ kind: 'dismiss' }],
      details,
      dedupeKey: 'server.gateway',
      source: ctx.source,
      onRetry: ctx.onRetry,
    };
  }
  if (status >= 500) {
    return {
      category: 'server',
      severity: 'error',
      title: 'Something broke',
      message,
      actions: ctx.onRetry
        ? [{ kind: 'retry' }, { kind: 'dismiss' }]
        : [{ kind: 'dismiss' }],
      details,
      dedupeKey: `server.5xx:${status}`,
      source: ctx.source,
      onRetry: ctx.onRetry,
    };
  }
  if (status === 400) {
    return {
      category: 'validation',
      severity: 'warning',
      title: 'Invalid request',
      message,
      actions: [{ kind: 'dismiss' }],
      details,
      dedupeKey: `validation:${ctx.source}`,
      source: ctx.source,
    };
  }
  return {
    category: 'unknown',
    severity: 'error',
    title: 'Something went wrong',
    message,
    actions: ctx.onRetry
      ? [{ kind: 'retry' }, { kind: 'dismiss' }]
      : [{ kind: 'dismiss' }],
    details,
    dedupeKey: `unknown.http:${status}:${ctx.source}`,
    source: ctx.source,
    onRetry: ctx.onRetry,
  };
}

/**
 * Tauri invoke command wrapper. Adds the command name to the source label
 * and routes through `classifyError` with no HTTP status.
 */
export function classifyTauriError(
  err: unknown,
  command: string,
  ctx?: { source?: string; onRetry?: () => void | Promise<void> },
): AppError | null {
  return classifyError(err, {
    source: ctx?.source ?? `tauri.${command}`,
    onRetry: ctx?.onRetry,
  });
}

/**
 * Helper that wraps a fetch call: returns a discriminated union so the
 * caller can either branch on the structured error or hand it to the
 * notification store directly.
 */
export async function fetchOrError(
  url: string,
  init: RequestInit,
  ctx: ClassifyContext,
): Promise<{ ok: true; res: Response } | { ok: false; error: AppError }> {
  try {
    const res = await fetch(url, init);
    if (!res.ok) {
      const body = await safeParseErrorBody(res);
      const error = classifyError(new Error(`HTTP ${res.status}`), {
        ...ctx,
        status: res.status,
        body,
      });
      return { ok: false, error: error ?? makeUnknown(ctx, `HTTP ${res.status}`) };
    }
    return { ok: true, res };
  } catch (err) {
    const error = classifyError(err, ctx);
    return { ok: false, error: error ?? makeUnknown(ctx, String(err)) };
  }
}

function makeUnknown(ctx: ClassifyContext, details: string): AppError {
  return {
    category: 'unknown',
    severity: 'error',
    title: 'Something went wrong',
    message: 'An unexpected error occurred.',
    actions: [{ kind: 'dismiss' }],
    details,
    dedupeKey: `unknown:${ctx.source}`,
    source: ctx.source,
  };
}
