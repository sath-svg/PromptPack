import type { RoleHowToStep } from "@/lib/pseo/types";

export function RoleHowTo({ steps, role }: { steps: RoleHowToStep[]; role: string }) {
  return (
    <section className="mt-16">
      <h2
        className="mb-6 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
        style={{ fontFamily: "var(--font-geist-mono), monospace" }}
      >
        How {role} use Skillset
      </h2>
      <ol className="space-y-4">
        {steps.map((step, i) => (
          <li
            key={step.name}
            className="flex gap-4 rounded-2xl border border-white/[0.06] bg-[#0f0f12] p-5"
          >
            <div
              className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-[#2563EB]/40 bg-[#2563EB]/10 text-[13px] font-medium text-[#7BA7FF]"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              {i + 1}
            </div>
            <div>
              <div className="text-[15px] font-medium text-zinc-100">{step.name}</div>
              <p className="mt-1 text-[14px] leading-[1.55] text-zinc-400">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
