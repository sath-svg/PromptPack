export function ColorSwatch({
  hex,
  role,
  name,
  light = false,
}: {
  hex: string;
  role: string;
  name: string;
  light?: boolean;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/10">
      <div
        className="aspect-[4/3] w-full"
        style={{ background: hex }}
      />
      <div className="flex items-baseline justify-between border-t border-white/10 bg-[#0d0d10] px-4 py-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
            {role}
          </div>
          <div className="mt-0.5 text-[13px] font-medium text-zinc-100">
            {name}
          </div>
        </div>
        <div
          className={`text-[11px] tracking-wider ${
            light ? "text-zinc-300" : "text-zinc-400"
          }`}
          style={{ fontFamily: "var(--font-geist-mono), monospace" }}
        >
          {hex}
        </div>
      </div>
    </div>
  );
}
