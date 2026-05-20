export function RoleKeyTasks({ tasks, role }: { tasks: string[]; role: string }) {
  return (
    <section className="mt-16">
      <h2
        className="mb-6 text-[11px] uppercase tracking-[0.22em] text-zinc-500"
        style={{ fontFamily: "var(--font-geist-mono), monospace" }}
      >
        What {role} actually use AI for
      </h2>
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {tasks.map((t) => (
          <li
            key={t}
            className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-[#0f0f12] p-4"
          >
            <span className="mt-0.5 text-[#7BA7FF]">→</span>
            <span className="text-[14.5px] leading-[1.5] text-zinc-300">{t}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
