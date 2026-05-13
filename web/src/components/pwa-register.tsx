"use client";

import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // In dev (Next.js HMR), the service worker caches chunks by path —
    // every `.next` rebuild changes those paths, so the cached SW
    // rejects new fetches with `network error response: the promise
    // was rejected`. Skip registration in dev AND unregister any
    // worker the user already has from a prior dev session.
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister().catch(() => {}));
      });
      return;
    }

    // When the active SW is swapped (e.g. old promptpack-v1 → skillset-v2),
    // reload once so the new worker's fetch rules (which bypass navigate /
    // /api / auth pages) take effect immediately. Without this, the old SW
    // keeps controlling the tab until the user manually reloads twice.
    let reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    });

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        // Force an update check on every page load so stale SW versions
        // (notably the old PromptPack SW that intercepted OAuth callbacks
        // and broke Set-Cookie) get replaced as soon as users reload.
        registration.update().catch(() => {});
        console.log("SW registered:", registration.scope);
      })
      .catch((error) => {
        console.log("SW registration failed:", error);
      });
  }, []);

  return null;
}
