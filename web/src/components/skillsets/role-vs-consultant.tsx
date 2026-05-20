import { Check } from "lucide-react";
import type { RoleComparisonRow } from "@/lib/pseo/types";

export function RoleVsConsultant({ rows, role }: { rows: RoleComparisonRow[]; role: string }) {
  return (
    <section className="mt-16">
      <h2
        className="mb-6 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
        style={{ fontFamily: "var(--font-geist-mono), monospace" }}
      >
        Skillset vs hiring a {role} consultant
      </h2>
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
                {role} consultant
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.feature}
                className={`border-b border-white/[0.04] last:border-0 ${i % 2 === 1 ? "bg-white/[0.015]" : ""}`}
              >
                <td className="whitespace-nowrap px-5 py-3.5 font-medium text-zinc-200">
                  {row.feature}
                </td>
                <td
                  className={`px-5 py-3.5 ${row.winner === "skillset" ? "text-emerald-400" : "text-zinc-300"}`}
                >
                  {row.winner === "skillset" && (
                    <Check className="mr-1.5 inline h-3.5 w-3.5" strokeWidth={2.5} />
                  )}
                  {row.skillset}
                </td>
                <td
                  className={`px-5 py-3.5 ${row.winner === "consultant" ? "text-emerald-400" : "text-zinc-400"}`}
                >
                  {row.winner === "consultant" && (
                    <Check className="mr-1.5 inline h-3.5 w-3.5" strokeWidth={2.5} />
                  )}
                  {row.consultant}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
