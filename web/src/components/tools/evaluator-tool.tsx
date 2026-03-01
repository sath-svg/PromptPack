"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { PromptInput } from "./prompt-input";
import { RateLimitBanner } from "./rate-limit-banner";
import { ScoreBadge, getScoreColor, getScoreBgColor } from "@/components/evaluation/score-badge";
import { WORKERS_API_URL } from "@/lib/constants";
import { trackEvent } from "@/lib/analytics";

const LLM_LABELS: Record<string, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  gemini: "Gemini",
  perplexity: "Perplexity",
  grok: "Grok",
  deepseek: "DeepSeek",
  kimi: "Kimi",
};

export function EvaluatorTool() {
  const { getToken, isSignedIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [scores, setScores] = useState<Record<string, number> | null>(null);
  const [overallScore, setOverallScore] = useState<number | null>(null);
  const [rateLimited, setRateLimited] = useState<"signup" | "upgrade" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (text: string) => {
    setIsLoading(true);
    setError(null);
    setScores(null);
    setOverallScore(null);
    setRateLimited(null);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (isSignedIn) {
        const token = await getToken();
        if (token) headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${WORKERS_API_URL}/api/web/evaluate`, {
        method: "POST",
        headers,
        body: JSON.stringify({ text }),
      });

      const data = await response.json() as {
        overallScore?: number;
        scores?: Record<string, number>;
        error?: string;
        code?: string;
      };

      if (response.status === 429) {
        setRateLimited(isSignedIn ? "upgrade" : "signup");
        return;
      }

      if (!response.ok || data.overallScore === undefined || !data.scores) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setOverallScore(data.overallScore);
      setScores(data.scores);
      trackEvent("evaluate-tool-used", { authenticated: isSignedIn ? "yes" : "no" });
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <PromptInput
        onSubmit={handleSubmit}
        isLoading={isLoading}
        placeholder="Paste your prompt here to evaluate its quality..."
        buttonText="Evaluate Prompt"
        loadingText="Evaluating..."
      />

      {error && (
        <p style={{ color: "#ef4444", margin: 0, fontSize: "0.9rem" }}>{error}</p>
      )}

      {rateLimited && <RateLimitBanner variant={rateLimited} />}

      {overallScore !== null && scores && (
        <div
          style={{
            padding: "1.25rem",
            borderRadius: "8px",
            border: "1px solid var(--border, #27272a)",
            backgroundColor: "var(--card, #18181b)",
          }}
        >
          {/* Overall score */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
            <ScoreBadge score={overallScore} size="lg" showLabel />
            <div>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>Overall Score</h3>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted-foreground)" }}>
                Average across 7 LLMs
              </p>
            </div>
          </div>

          {/* Per-LLM breakdown */}
          <div style={{ display: "grid", gap: "0.6rem" }}>
            {Object.entries(scores)
              .sort(([, a], [, b]) => b - a)
              .map(([llm, score]) => (
                <div
                  key={llm}
                  style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
                >
                  <span style={{ width: 80, fontSize: "0.85rem", fontWeight: 500 }}>
                    {LLM_LABELS[llm] || llm}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: "rgba(255,255,255,0.06)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${score}%`,
                        borderRadius: 4,
                        backgroundColor: getScoreColor(score),
                        transition: "width 0.5s ease",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      width: 36,
                      textAlign: "right",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: getScoreColor(score),
                      backgroundColor: getScoreBgColor(score),
                      padding: "0.1rem 0.3rem",
                      borderRadius: 4,
                    }}
                  >
                    {score}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
