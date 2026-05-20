import type { RoleCitation } from "@/lib/pseo/types";

export function RoleCitations({ citations, lastUpdated }: { citations: RoleCitation[]; lastUpdated?: string }) {
  return (
    <section className="mt-16 border-t border-white/[0.06] pt-6">
      <div
        className="mb-3 text-[10.5px] uppercase tracking-[0.18em] text-zinc-500"
        style={{ fontFamily: "var(--font-geist-mono), monospace" }}
      >
        {lastUpdated ? `Last updated ${lastUpdated} · Sources` : "Sources"}
      </div>
      <ol className="space-y-1.5 text-[13px] text-zinc-500">
        {citations.map((c, i) => (
          <li key={c.url}>
            <span className="mr-2 text-zinc-600">[{i + 1}]</span>
            <a
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 underline decoration-zinc-700 underline-offset-4 hover:text-[#7BA7FF] hover:decoration-[#7BA7FF]/60"
            >
              {c.label}
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
