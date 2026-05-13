import { Check } from "lucide-react";
import type { ComparisonPoint } from "@/lib/pseo/types";

interface ComparisonTableProps {
  points: ComparisonPoint[];
  competitorName: string;
}

export function ComparisonTable({ points, competitorName }: ComparisonTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-[#0f0f12]">
      <table className="w-full border-collapse text-[14px]">
        <thead>
          <tr className="border-b border-white/[0.06]">
            <th
              className="px-5 py-3.5 text-left text-[11px] uppercase tracking-[0.16em] text-zinc-500"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              Feature
            </th>
            <th className="px-5 py-3.5 text-left text-[14px] font-medium text-[#7BA7FF]">
              Skillset
            </th>
            <th className="px-5 py-3.5 text-left text-[14px] font-medium text-zinc-400">
              {competitorName}
            </th>
          </tr>
        </thead>
        <tbody>
          {points.map((point, i) => (
            <tr
              key={point.feature}
              className={`border-b border-white/[0.04] last:border-0 ${i % 2 === 1 ? "bg-white/[0.015]" : ""}`}
            >
              <td className="whitespace-nowrap px-5 py-3.5 font-medium text-zinc-200">
                {point.feature}
              </td>
              <td
                className={`px-5 py-3.5 ${point.winner === "skillset" ? "text-emerald-400" : "text-zinc-300"}`}
              >
                {point.winner === "skillset" && (
                  <Check className="mr-1.5 inline h-3.5 w-3.5" strokeWidth={2.5} />
                )}
                {point.skillset}
              </td>
              <td
                className={`px-5 py-3.5 ${point.winner === "competitor" ? "text-emerald-400" : "text-zinc-400"}`}
              >
                {point.winner === "competitor" && (
                  <Check className="mr-1.5 inline h-3.5 w-3.5" strokeWidth={2.5} />
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
