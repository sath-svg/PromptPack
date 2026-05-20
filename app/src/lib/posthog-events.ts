/**
 * Typed PostHog event taxonomy for the Tauri desktop app.
 * Keep event names + property shapes consistent across call sites.
 * See: ~/.claude/plans/i-want-to-set-peaceful-mountain.md Phase A.
 */

import { capture as posthogCapture } from './posthog';

type ManagedTier = 'fast' | 'balanced' | 'powerful';
type EnhanceMode = 'structured' | 'clarity' | 'concise' | 'strict';
type ImportSource = 'drop' | 'file_picker';
type StringProvider =
  | 'anthropic'
  | 'openai'
  | 'gemini'
  | 'grok'
  | 'deepseek'
  | 'perplexity'
  | 'kimi'
  | 'openrouter'
  | 'bedrock';

export type DesktopEventMap = {
  chat_sent: {
    orchestrator_enabled: boolean;
    managed_mode: boolean;
    byok: boolean;
    provider?: string;
  };
  orchestrator_dispatched: {
    parallel_agents?: number;
    decision?: string;
  };
  single_shot_dispatched: {
    route_class?: string;
  };
  model_used: {
    tier: ManagedTier | 'byok';
    model_id: string;
    managed_mode: boolean;
  };
  managed_mode_toggled: { enabled: boolean };
  byok_added: { provider: StringProvider };
  draft_tab_clicked: { tab_index: number; tab_name?: string };
  enhance_used: { mode: EnhanceMode };
  eval_run: { trial_count: number };
  skill_control_opened: Record<string, never>;
  skill_control_accepted: Record<string, never>;
  skill_control_rejected: Record<string, never>;
  pack_imported: {
    prompt_count: number;
    encrypted: boolean;
    source: ImportSource;
  };
  pack_exported: { prompt_count: number; encrypted: boolean };
  prompt_saved: { cloud: boolean };
  auth_signed_in_app: { provider?: string };
  auth_signed_out_app: Record<string, never>;
};

export type DesktopEventName = keyof DesktopEventMap;

/**
 * Fire a typed PostHog event from the Tauri app. No-op when PostHog isn't
 * initialized (telemetry opt-out, missing key, etc.). Safe to call anywhere;
 * never throws.
 */
export function track<E extends DesktopEventName>(
  event: E,
  properties: DesktopEventMap[E],
): void {
  posthogCapture(
    event,
    properties as Record<string, string | number | boolean | null | undefined>,
  );
}
