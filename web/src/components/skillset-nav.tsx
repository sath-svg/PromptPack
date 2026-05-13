import Link from "next/link";
import { ArrowRight } from "lucide-react";

type NavLink = { label: string; href: string };

const DEFAULT_LINKS: NavLink[] = [
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how" },
  { label: "For teams", href: "/#power" },
  { label: "Pricing", href: "/pricing" },
];

export function SkillsetNav({ links = DEFAULT_LINKS }: { links?: NavLink[] }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0c]/80 backdrop-blur-xl">
      <div className="mx-auto grid max-w-[1400px] grid-cols-3 items-center px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          {/* Plain <img> — Next Image optimizer was racing on the 2048x2048
              source PNG, intermittently showing as broken in the sticky header. */}
          <img
            src="/img/skillset_logo.png"
            alt="Skillset"
            width={28}
            height={28}
            className="h-7 w-7 rounded-md object-cover"
          />
          <span className="text-[15px] font-medium tracking-tight text-zinc-50">
            Skillset
          </span>
          <span
            className="ml-2 rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-zinc-400"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            Beta
          </span>
        </Link>

        <nav className="hidden items-center justify-center gap-7 text-sm text-zinc-400 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="transition-colors hover:text-zinc-50"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-3">
          <Link
            href="/sign-in"
            className="hidden text-[15px] text-zinc-400 transition-colors hover:text-zinc-50 md:inline"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            style={{ padding: "8px 18px" }}
            className="group inline-flex items-center gap-2 rounded-full bg-[#2563EB] text-sm font-medium text-white whitespace-nowrap shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[#1d4ed8] active:translate-y-[1px]"
          >
            Start Free
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
          </Link>
        </div>
      </div>
    </header>
  );
}
