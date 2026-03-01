// Thin wrapper around Plausible custom events
// Plausible is loaded in layout.tsx with tagged-events and revenue modules

declare global {
  interface Window {
    plausible?: (
      event: string,
      options?: { props?: Record<string, string | number> }
    ) => void;
    lintrk?: (
      action: string,
      data: { conversion_id: number }
    ) => void;
  }
}

export function trackEvent(
  name: string,
  props?: Record<string, string | number>
): void {
  if (typeof window !== "undefined" && typeof window.plausible === "function") {
    window.plausible(name, props ? { props } : undefined);
  }
}

// LinkedIn Insight Tag conversion tracking
// Conversion IDs are configured in LinkedIn Campaign Manager > Conversions
export function trackLinkedInConversion(conversionId: number): void {
  if (typeof window !== "undefined" && typeof window.lintrk === "function") {
    window.lintrk("track", { conversion_id: conversionId });
  }
}
