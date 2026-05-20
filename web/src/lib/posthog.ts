/**
 * PostHog wrapper — product analytics for the logged-in surfaces of the
 * web app. Sits alongside Plausible (which still handles marketing-funnel
 * traffic on public pages). Mirrors the shape of analytics.ts.
 *
 * Init is lazy: components call `getPostHog()`, which returns null on the
 * server and during the brief window before `<PostHogProvider>` runs.
 */

import type { PostHog } from "posthog-js";

let client: PostHog | null = null;

export function setPostHogClient(c: PostHog | null) {
  client = c;
}

export function getPostHog(): PostHog | null {
  return client;
}

export function capture(
  event: string,
  props?: Record<string, string | number | boolean | null | undefined>,
): void {
  client?.capture(event, props);
}

export function identify(
  distinctId: string,
  traits?: Record<string, string | number | boolean | null | undefined>,
): void {
  client?.identify(distinctId, traits);
}

export function optOut(): void {
  client?.opt_out_capturing();
}

export function optIn(): void {
  client?.opt_in_capturing();
}

export function reset(): void {
  client?.reset();
}
