"use client";

import type { ComponentType, ReactNode } from "react";
import {
  Megaphone,
  GraduationCap,
  Briefcase,
  Code2,
  Pencil,
  Wrench,
  Scale,
  Stethoscope,
  BarChart3,
  Server,
  Hammer,
  Users,
  BookOpen,
  Calculator,
  ChefHat,
  Microscope,
  PenTool,
  Headphones,
  Building2,
  DollarSign,
  Home,
  ListChecks,
  Crown,
  Lightbulb,
  Heart,
  Video,
  Database,
  Activity,
  ArrowRight,
  Eye,
  type LucideIcon,
} from "lucide-react";
import { TRIAL_CTA_HREF } from "@/lib/cta";

/**
 * Map of named persona icons → Lucide components. The skillset-packs.ts
 * manifest stores `personaIcon` as a string; this map resolves to the
 * actual component at render time. Add new icons here when introducing
 * roles that don't fit the existing set.
 */
export const personaIconMap: Record<string, LucideIcon> = {
  Megaphone,
  GraduationCap,
  Briefcase,
  Code2,
  Pencil,
  Wrench,
  Scale,
  Stethoscope,
  BarChart3,
  Server,
  Hammer,
  Users,
  BookOpen,
  Calculator,
  ChefHat,
  Microscope,
  PenTool,
  Headphones,
  Building2,
  DollarSign,
  Home,
  ListChecks,
  Crown,
  Lightbulb,
  Heart,
  Video,
  Database,
  Activity,
};

export type PersonaIconName = keyof typeof personaIconMap;

export type PersonaCard = {
  /**
   * Lucide icon node OR a name from `personaIconMap`. Inline ReactNode
   * keeps the landing-page call sites working unchanged; string lookup
   * is used by manifest-driven cards on the pSEO surfaces.
   */
  icon: ReactNode | PersonaIconName;
  role: string;
  outcome: string;
  skillsetTitle: string;
  skillCount: number;
  type: "workflow" | "folder";
  preview: string[];
  file: string;
};

interface Props {
  persona: PersonaCard;
  /**
   * Optional preview handler. When provided, a "Preview" button renders
   * alongside the Download button. The role page wires this to open a
   * modal listing every prompt's label + purpose.
   */
  onPreview?: () => void;
}

function resolveIcon(icon: PersonaCard["icon"]): ReactNode {
  if (typeof icon === "string") {
    const Cmp: ComponentType<{ strokeWidth?: number; className?: string }> | undefined =
      personaIconMap[icon];
    if (!Cmp) return null;
    return <Cmp strokeWidth={1.75} className="h-5 w-5" />;
  }
  return icon;
}

export function PersonaCardView({ persona, onPreview }: Props) {
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0f0f12] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-all duration-300 hover:border-white/[0.14] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_20px_40px_-30px_rgba(37,99,235,0.4)]">
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-32 h-72 w-72 rounded-full opacity-50 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(circle, rgba(37,99,235,0.12), transparent 65%)",
        }}
      />

      <div className="relative z-10 flex h-full flex-col p-5 md:p-6">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-white/10 bg-white/[0.03] text-[#7BA7FF]">
            {resolveIcon(persona.icon)}
          </span>
          <span
            className="text-[11px] uppercase tracking-[0.18em] text-zinc-500"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            {persona.role}
          </span>
        </div>

        <h3 className="mt-5 text-[18px] font-medium leading-[1.2] tracking-[-0.01em] text-zinc-50 md:text-[20px]">
          {persona.skillsetTitle}
        </h3>
        <p className="mt-2 text-[13px] leading-[1.5] text-zinc-400">
          {persona.outcome}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-2 text-[11px]">
          <span
            className="whitespace-nowrap rounded-full border border-white/10 bg-white/[0.02] px-2 py-0.5 text-zinc-400"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            {persona.skillCount} skills
          </span>
          <span
            className={`whitespace-nowrap rounded-full px-2 py-0.5 ${
              persona.type === "workflow"
                ? "border border-[#2563EB]/40 bg-[#2563EB]/10 text-[#7BA7FF]"
                : "border border-white/10 bg-white/[0.02] text-zinc-400"
            }`}
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            {persona.type}
          </span>
          <span
            className="whitespace-nowrap rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-emerald-300"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            trial
          </span>
        </div>

        <div className="mt-5 flex flex-1 flex-col border-t border-white/5 pt-4">
          <p
            className="mb-3 text-[10px] uppercase tracking-[0.18em] text-zinc-500"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            What's inside
          </p>
          <ul className="space-y-1.5 text-[12.5px] leading-[1.45] text-zinc-300">
            {persona.preview.map((skill, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-zinc-600" />
                <span>{skill}</span>
              </li>
            ))}
            {persona.skillCount > persona.preview.length && (
              <li className="flex items-start gap-2 text-zinc-500">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-zinc-700" />
                <span>+ {persona.skillCount - persona.preview.length} more</span>
              </li>
            )}
          </ul>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {onPreview && (
            <button
              type="button"
              onClick={onPreview}
              className="inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-white/[0.02] px-3 py-2.5 text-[13px] font-medium text-zinc-200 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.06] hover:text-white active:translate-y-[1px]"
            >
              <Eye className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              Preview
            </button>
          )}
          <a
            href={TRIAL_CTA_HREF}
            className="inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-white/[0.03] px-3 py-2.5 text-[13px] font-medium text-zinc-100 transition-all duration-200 hover:border-[#2563EB]/50 hover:bg-[#2563EB]/15 hover:text-white active:translate-y-[1px]"
          >
            <ArrowRight className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            Open in Skillset
          </a>
        </div>
      </div>
    </div>
  );
}
