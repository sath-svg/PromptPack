/**
 * PostHog product analytics for the Tauri desktop app.
 *
 * Distinct from `app/src/lib/telemetry.ts` (routing-classifier ML data,
 * local-only). This file fires real product events to PostHog Cloud.
 *
 * Scope per product decision: navigation/click capture only. We do NOT
 * fire pack-object events. Autocapture covers buttons, links, and the
 * sidebar/tab navigation without any per-element wiring.
 */

import posthog from 'posthog-js';
import { useSettingsStore } from '../stores/settingsStore';
import { useAuthStore } from '../stores/authStore';

let initialized = false;

export function initPostHog() {
  if (initialized) return;
  if (typeof window === 'undefined') return;

  const optIn = useSettingsStore.getState().telemetryOptIn;
  if (optIn === false) return;

  const key = import.meta.env.VITE_POSTHOG_KEY;
  const host = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';
  if (!key) return;

  posthog.init(key, {
    api_host: host,
    capture_pageview: true,
    autocapture: true,
    person_profiles: 'identified_only',
    capture_pageleave: true,
    loaded: (ph) => {
      // Tag every event with surface = "desktop" so dashboards can split
      // desktop vs web without separate projects.
      ph.register({ surface: 'desktop' });
    },
  });
  initialized = true;

  // If a session is already in the auth store on boot, identify immediately.
  const session = useAuthStore.getState().session;
  if (session?.user_id) {
    posthog.identify(session.user_id, {
      email: session.email ?? undefined,
      name: session.name ?? undefined,
    });
    posthog.capture('auth_signed_in_app', {});
  }

  // Subscribe to auth changes so a sign-in mid-session triggers identify
  // and sign-out triggers reset.
  useAuthStore.subscribe((state, prev) => {
    if (state.session?.user_id && state.session.user_id !== prev.session?.user_id) {
      posthog.identify(state.session.user_id, {
        email: state.session.email ?? undefined,
        name: state.session.name ?? undefined,
      });
      posthog.capture('auth_signed_in_app', {});
    } else if (!state.session && prev.session) {
      posthog.capture('auth_signed_out_app', {});
      posthog.reset();
    }
  });
}

export function capture(
  event: string,
  props?: Record<string, string | number | boolean | null | undefined>,
): void {
  if (!initialized) return;
  posthog.capture(event, props);
}

export function setTelemetryOptIn(enabled: boolean) {
  if (!initialized) {
    if (enabled) initPostHog();
    return;
  }
  if (enabled) posthog.opt_in_capturing();
  else posthog.opt_out_capturing();
}
