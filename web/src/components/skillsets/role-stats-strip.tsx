import type { RolePage } from "@/lib/pseo/types";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

function formatSalary(n: number): string {
  return `$${formatNumber(n)}`;
}

export function RoleStatsStrip({ role, promptCount }: { role: RolePage; promptCount: number }) {
  const stats: { label: string; value: string }[] = [];

  if (role.medianSalary) {
    stats.push({ label: "Median US salary", value: formatSalary(role.medianSalary) });
  }
  if (role.employmentCount) {
    stats.push({ label: "US workers", value: formatNumber(role.employmentCount) });
  }
  if (role.aiAdoptionPct !== undefined) {
    stats.push({ label: "Using AI tools", value: `${role.aiAdoptionPct}%` });
  }
  if (role.hoursSavedPerWeek) {
    stats.push({ label: "Hrs saved/week", value: `${role.hoursSavedPerWeek}h` });
  }
  stats.push({ label: "Prompts inside", value: promptCount.toString() });

  return (
    <section className="mt-10 grid grid-cols-2 gap-4 rounded-2xl border border-white/[0.06] bg-[#0f0f12] p-6 md:grid-cols-5">
      {stats.slice(0, 5).map((s) => (
        <div key={s.label} className="text-center">
          <div className="text-[26px] font-medium tracking-[-0.02em] text-zinc-50 md:text-[32px]">
            {s.value}
          </div>
          <div
            className="mt-1 text-[10.5px] uppercase tracking-[0.18em] text-zinc-500"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            {s.label}
          </div>
        </div>
      ))}
    </section>
  );
}
