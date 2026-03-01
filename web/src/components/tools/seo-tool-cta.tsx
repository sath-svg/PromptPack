import Link from "next/link";

interface SEOToolCTAProps {
  variant?: "extension" | "signup" | "tools";
}

export function SEOToolCTA({ variant = "extension" }: SEOToolCTAProps) {
  if (variant === "tools") {
    return (
      <div
        style={{
          padding: "2rem",
          borderRadius: "12px",
          border: "1px solid var(--border, #27272a)",
          backgroundColor: "var(--card, #18181b)",
          textAlign: "center",
          marginTop: "3rem",
        }}
      >
        <h3 style={{ fontSize: "1.25rem", fontWeight: 600, margin: "0 0 0.5rem" }}>
          Try our free AI prompt tools
        </h3>
        <p style={{ color: "var(--muted-foreground)", margin: "0 0 1.25rem", fontSize: "0.95rem" }}>
          Enhance and evaluate your prompts with AI — no sign-up required for your first use.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/tools/prompt-enhancer" className="btn btn-primary" style={{ padding: "0.6rem 1.5rem" }}>
            Enhance a Prompt
          </Link>
          <Link href="/tools/prompt-evaluator" className="btn btn-secondary" style={{ padding: "0.6rem 1.5rem" }}>
            Evaluate a Prompt
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "2rem",
        borderRadius: "12px",
        border: "1px solid var(--border, #27272a)",
        backgroundColor: "var(--card, #18181b)",
        textAlign: "center",
        marginTop: "3rem",
      }}
    >
      <h3 style={{ fontSize: "1.25rem", fontWeight: 600, margin: "0 0 0.5rem" }}>
        {variant === "extension"
          ? "Manage prompts where you work"
          : "Start building your prompt library"}
      </h3>
      <p style={{ color: "var(--muted-foreground)", margin: "0 0 1.25rem", fontSize: "0.95rem" }}>
        {variant === "extension"
          ? "PromptPack works directly inside ChatGPT, Claude, Gemini, and more. Save, organize, and enhance prompts without leaving your AI chat."
          : "Sign up free to save prompts, create custom prompt packs, and enhance your prompts with AI."}
      </p>
      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
        <Link href="/downloads" className="btn btn-primary" style={{ padding: "0.6rem 1.5rem" }}>
          Get the Extension
        </Link>
        <Link href="/pricing" className="btn btn-secondary" style={{ padding: "0.6rem 1.5rem" }}>
          View Plans
        </Link>
      </div>
    </div>
  );
}
