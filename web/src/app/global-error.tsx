"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error.tsx]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          background: "#0a0a0a",
          color: "#e4e4e7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <p style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "#71717a", margin: 0 }}>
            Critical error
          </p>
          <h1 style={{ marginTop: 16, fontSize: 48, fontWeight: 500, letterSpacing: "-0.025em" }}>
            Skillset crashed.
          </h1>
          <p style={{ marginTop: 16, color: "#a1a1aa", lineHeight: 1.6 }}>
            {error.message || "An unexpected error broke the page."}
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: 32,
              padding: "10px 22px",
              borderRadius: 9999,
              background: "#2563EB",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
