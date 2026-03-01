import type { ComparisonPoint } from "@/lib/pseo/types";

interface ComparisonTableProps {
  points: ComparisonPoint[];
  competitorName: string;
}

export function ComparisonTable({ points, competitorName }: ComparisonTableProps) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "0.9rem",
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                textAlign: "left",
                padding: "0.75rem 1rem",
                borderBottom: "2px solid var(--border, #27272a)",
                color: "var(--muted-foreground)",
                fontWeight: 500,
                fontSize: "0.85rem",
              }}
            >
              Feature
            </th>
            <th
              style={{
                textAlign: "left",
                padding: "0.75rem 1rem",
                borderBottom: "2px solid #6366f1",
                color: "#6366f1",
                fontWeight: 600,
              }}
            >
              PromptPack
            </th>
            <th
              style={{
                textAlign: "left",
                padding: "0.75rem 1rem",
                borderBottom: "2px solid var(--border, #27272a)",
                color: "var(--muted-foreground)",
                fontWeight: 500,
              }}
            >
              {competitorName}
            </th>
          </tr>
        </thead>
        <tbody>
          {points.map((point, i) => (
            <tr
              key={point.feature}
              style={{
                backgroundColor: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
              }}
            >
              <td
                style={{
                  padding: "0.75rem 1rem",
                  borderBottom: "1px solid var(--border, #27272a)",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                }}
              >
                {point.feature}
              </td>
              <td
                style={{
                  padding: "0.75rem 1rem",
                  borderBottom: "1px solid var(--border, #27272a)",
                  color: point.winner === "promptpack" ? "#22c55e" : "var(--foreground)",
                }}
              >
                {point.winner === "promptpack" && (
                  <span style={{ marginRight: "0.35rem" }}>&#10003;</span>
                )}
                {point.promptpack}
              </td>
              <td
                style={{
                  padding: "0.75rem 1rem",
                  borderBottom: "1px solid var(--border, #27272a)",
                  color: point.winner === "competitor" ? "#22c55e" : "var(--muted-foreground)",
                }}
              >
                {point.winner === "competitor" && (
                  <span style={{ marginRight: "0.35rem" }}>&#10003;</span>
                )}
                {point.competitor}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
