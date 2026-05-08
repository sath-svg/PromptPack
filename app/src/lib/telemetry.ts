/**
 * Routing telemetry bridge — wraps the Tauri commands from
 * `app/src-tauri/src/telemetry.rs`. Logged on every dispatch decision;
 * settled when the run resolves. Export feeds the offline retrain
 * pipeline in `ml/retrain_from_telemetry.py`.
 *
 * Intentionally swallows errors — telemetry must never block a chat
 * message. Failure to log is acceptable; failure to send is not.
 */

import { invoke } from '@tauri-apps/api/core';
import type { RouteClass } from './classifier';

export interface RouteTelemetryRow {
  id: string;
  prompt: string;
  wordCount: number | null;
  predictedRoute: RouteClass;
  confidence: number;
  fallbackUsed: number;
  fallbackRoute: RouteClass | null;
  actualRoute: RouteClass | null;
  completed: number | null;
  repromptWithin: number | null;
  userSignal: 'thumbs_up' | 'thumbs_down' | null;
  createdAt: number;
  settledAt: number | null;
}

interface RustRouteTelemetry {
  id: string;
  prompt: string;
  word_count: number | null;
  predicted_route: string;
  confidence: number;
  fallback_used: number;
  fallback_route: string | null;
  actual_route: string | null;
  completed: number | null;
  reprompt_within: number | null;
  user_signal: string | null;
  created_at: number;
  settled_at: number | null;
}

function fromRust(r: RustRouteTelemetry): RouteTelemetryRow {
  return {
    id: r.id,
    prompt: r.prompt,
    wordCount: r.word_count,
    predictedRoute: r.predicted_route as RouteClass,
    confidence: r.confidence,
    fallbackUsed: r.fallback_used,
    fallbackRoute: (r.fallback_route as RouteClass | null) ?? null,
    actualRoute: (r.actual_route as RouteClass | null) ?? null,
    completed: r.completed,
    repromptWithin: r.reprompt_within,
    userSignal: (r.user_signal as 'thumbs_up' | 'thumbs_down' | null) ?? null,
    createdAt: r.created_at,
    settledAt: r.settled_at,
  };
}

export interface LogRouteInput {
  prompt: string;
  wordCount?: number;
  predictedRoute: RouteClass;
  confidence: number;
  fallbackUsed?: boolean;
  fallbackRoute?: RouteClass;
  actualRoute?: RouteClass;
}

export async function logRoute(input: LogRouteInput): Promise<string | null> {
  try {
    return await invoke<string>('telemetry_log_route', {
      input: {
        prompt: input.prompt,
        word_count: input.wordCount ?? null,
        predicted_route: input.predictedRoute,
        confidence: input.confidence,
        fallback_used: input.fallbackUsed ?? false,
        fallback_route: input.fallbackRoute ?? null,
        actual_route: input.actualRoute ?? null,
      },
    });
  } catch (err) {
    console.warn('[telemetry] log failed', err);
    return null;
  }
}

export interface SettleRouteInput {
  id: string;
  /** 1 = success, -1 = failed/cancelled. Omit to keep current value. */
  completed?: 1 | -1;
  /** Seconds until next user message in this conversation. */
  repromptWithin?: number;
  userSignal?: 'thumbs_up' | 'thumbs_down';
  /** What dispatch path actually fired (may differ from predicted route). */
  actualRoute?: RouteClass;
}

export async function settleRoute(input: SettleRouteInput): Promise<void> {
  try {
    await invoke('telemetry_settle_route', {
      input: {
        id: input.id,
        completed: input.completed ?? null,
        reprompt_within: input.repromptWithin ?? null,
        user_signal: input.userSignal ?? null,
        actual_route: input.actualRoute ?? null,
      },
    });
  } catch (err) {
    console.warn('[telemetry] settle failed', err);
  }
}

export async function exportRoute(opts?: {
  since?: number;
  limit?: number;
  onlySignaled?: boolean;
}): Promise<RouteTelemetryRow[]> {
  try {
    const rows = await invoke<RustRouteTelemetry[]>('telemetry_export_route', {
      input: {
        since: opts?.since ?? 0,
        limit: opts?.limit ?? 10_000,
        only_signaled: opts?.onlySignaled ?? false,
      },
    });
    return rows.map(fromRust);
  } catch (err) {
    console.warn('[telemetry] export failed', err);
    return [];
  }
}

export async function clearRouteTelemetry(): Promise<number> {
  try {
    return await invoke<number>('telemetry_clear_route');
  } catch (err) {
    console.warn('[telemetry] clear failed', err);
    return 0;
  }
}
