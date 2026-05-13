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

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered:", registration.scope);
      })
      .catch((error) => {
        console.log("SW registration failed:", error);
      });
  }, []);

  return null;
}
