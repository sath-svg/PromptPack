"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Component, ReactNode, useMemo, type ErrorInfo } from "react";
import { toast } from "sonner";

interface BoundaryState {
  error: Error | null;
}

class ConvexErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ConvexErrorBoundary]", error, info.componentStack);
    toast.error("Live data error", {
      description: error.message || "Couldn't load data. Refresh to try again.",
      action: {
        label: "Copy details",
        onClick: () => {
          const payload = [
            "[Skillset error]",
            "source: web.convex-provider",
            `name: ${error.name}`,
            `message: ${error.message}`,
            `when: ${new Date().toISOString()}`,
            "---",
            error.stack ?? "",
          ].join("\n");
          navigator.clipboard.writeText(payload).catch(() => { /* ignore */ });
        },
      },
      duration: 8000,
    });
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, textAlign: "center", color: "#a1a1aa" }}>
          <p>Couldn&apos;t load data. Refresh the page to try again.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const convex = useMemo(
    () => new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!),
    []
  );
  return (
    <ConvexProvider client={convex}>
      <ConvexErrorBoundary>{children}</ConvexErrorBoundary>
    </ConvexProvider>
  );
}
