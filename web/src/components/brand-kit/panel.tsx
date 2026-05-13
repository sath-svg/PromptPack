import type { ReactNode } from "react";

export function Panel({
  label,
  index,
  children,
  className = "",
  contentClassName = "",
}: {
  label: string;
  index: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d10] ${className}`}
    >
      <header className="flex items-center justify-between border-b border-white/5 px-5 py-3">
        <span
          className="text-[10px] uppercase tracking-[0.22em] text-zinc-500"
          style={{ fontFamily: "var(--font-geist-mono), monospace" }}
        >
          {label}
        </span>
        <span
          className="text-[10px] tracking-[0.18em] text-zinc-600"
          style={{ fontFamily: "var(--font-geist-mono), monospace" }}
        >
          {index}
        </span>
      </header>
      <div className={`relative ${contentClassName}`}>{children}</div>
    </section>
  );
}
