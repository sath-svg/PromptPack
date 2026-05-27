"use client";

import { useEffect, useRef, useState } from "react";
import {
  FileEdit,
  History,
  MessagesSquare,
  Package,
  Palette,
} from "lucide-react";
import {
  HeroChatVisual,
  HeroFlowVisual,
  HeroPresetVisual,
  HeroRouterVisual,
} from "./hero-mockup-visuals";

type FeatureKey = "chat" | "router" | "flow" | "preset";

type Feature = {
  key: FeatureKey;
  name: string;
  caption: string;
  visual: React.ReactNode;
  activeNav: "chat" | "preset";
};

const FEATURES: Feature[] = [
  {
    key: "chat",
    name: "Skill Chat",
    caption:
      "Watch a prompt fan out to parallel agents, then save the winning answer as a reusable skill.",
    visual: <HeroChatVisual />,
    activeNav: "chat",
  },
  {
    key: "router",
    name: "Skill Router",
    caption:
      "Three prompts, three complexities. Skillset routes each to the cheapest model that can handle it.",
    visual: <HeroRouterVisual />,
    activeNav: "chat",
  },
  {
    key: "flow",
    name: "Skill Flow",
    caption:
      "Email Tone Pro skillset runs every step on its own — parse, detect, match, draft, send.",
    visual: <HeroFlowVisual />,
    activeNav: "chat",
  },
  {
    key: "preset",
    name: "Skill Preset",
    caption:
      "Palette, strokes, type, mood — pack your style into an encrypted skillset, license access.",
    visual: <HeroPresetVisual />,
    activeNav: "preset",
  },
];

const CYCLE_MS = 7000;
const PAUSE_MS = 30000;

function useFeatureCycle() {
  const [selected, setSelected] = useState<FeatureKey>("chat");
  const [paused, setPaused] = useState(false);
  const pauseTimerRef = useRef<number | null>(null);
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    prefersReducedMotion.current = mq.matches;
    const onChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion.current = e.matches;
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (paused || prefersReducedMotion.current) return;
    const interval = window.setInterval(() => {
      setSelected((prev) => {
        const idx = FEATURES.findIndex((f) => f.key === prev);
        return FEATURES[(idx + 1) % FEATURES.length].key;
      });
    }, CYCLE_MS);
    return () => window.clearInterval(interval);
  }, [paused]);

  useEffect(() => {
    return () => {
      if (pauseTimerRef.current !== null) {
        window.clearTimeout(pauseTimerRef.current);
      }
    };
  }, []);

  const onSelect = (key: FeatureKey) => {
    setSelected(key);
    setPaused(true);
    if (pauseTimerRef.current !== null) {
      window.clearTimeout(pauseTimerRef.current);
    }
    pauseTimerRef.current = window.setTimeout(() => setPaused(false), PAUSE_MS);
  };

  return { selected, onSelect };
}

export function AppMockupTabbed() {
  const { selected, onSelect } = useFeatureCycle();
  const feature = FEATURES.find((f) => f.key === selected) ?? FEATURES[0];

  return (
    <div className="relative w-full max-w-[780px] md:mt-2 md:translate-x-[20%] md:scale-[1.2] md:origin-top-right">
      {/* Tab pills */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {FEATURES.map((f) => {
          const isActive = selected === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => onSelect(f.key)}
              className={`inline-flex items-center gap-1.5 rounded-full border text-[11px] font-medium transition-all duration-200 ${
                isActive
                  ? "border-[#2563EB] bg-[#2563EB]/15 text-zinc-50"
                  : "border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/20 hover:bg-white/[0.05] hover:text-zinc-100"
              }`}
              style={{
                padding: "5px 10px",
                fontFamily: "var(--font-geist-mono), monospace",
              }}
              aria-pressed={isActive}
            >
              {isActive && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2563EB] opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#2563EB]" />
                </span>
              )}
              {f.name}
            </button>
          );
        })}
      </div>

      {/* Caption */}
      <p
        key={feature.key + "-caption"}
        className="mb-3 max-w-[62ch] text-[13px] leading-[1.55] text-zinc-400"
      >
        {feature.caption}
      </p>

      {/* Mockup chrome */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f12] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#3b3b3f]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#3b3b3f]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#3b3b3f]" />
          </div>
          <span
            className="text-[11px] uppercase tracking-[0.16em] text-zinc-500"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            Skillset Desktop
          </span>
          <span className="text-[11px] text-zinc-500">v1.3</span>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <aside className="hidden w-[120px] shrink-0 border-r border-white/5 bg-[#0a0a0c] p-2 sm:block md:w-[140px]">
            <div className="mb-3 flex items-center gap-2 px-1.5 py-1.5 md:px-2">
              {/* Plain <img> — Next Image optimizer races on the 2048x2048 source PNG */}
              <img
                src="/img/skillset_logo.png"
                alt="Skillset"
                width={20}
                height={20}
                className="h-5 w-5 shrink-0 rounded-md object-cover"
              />
              <span className="whitespace-nowrap text-[12px] font-medium tracking-tight text-zinc-100">
                Skillset
              </span>
            </div>

            <MiniNavRow
              icon={<MessagesSquare className="h-3.5 w-3.5" strokeWidth={1.75} />}
              label="Chat"
              active={feature.activeNav === "chat"}
            />
            <MiniNavRow
              icon={<FileEdit className="h-3.5 w-3.5" strokeWidth={1.75} />}
              label="Draft"
            />
            <MiniNavRow
              icon={<Palette className="h-3.5 w-3.5" strokeWidth={1.75} />}
              label="Skill Preset"
              active={feature.activeNav === "preset"}
            />
            <MiniNavRow
              icon={<Package className="h-3.5 w-3.5" strokeWidth={1.75} />}
              label="Your Skillsets"
            />
            <div className="my-2 border-t border-white/5" />
            <MiniNavRow
              icon={<History className="h-3.5 w-3.5" strokeWidth={1.75} />}
              label="Skill Control"
            />
          </aside>

          {/* Main area: feature visual */}
          <div className="flex min-h-[306px] flex-1 flex-col p-3 md:p-5">
            <div className="mb-3 flex items-center justify-between">
              <p
                className="text-[10px] uppercase tracking-[0.22em] text-zinc-500"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              >
                {feature.name}
              </p>
              <span
                className="inline-flex items-center gap-1.5 rounded-full border border-[#2563EB]/40 bg-[#2563EB]/10 px-2 py-0.5 text-[10px] text-[#7BA7FF]"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#7BA7FF] opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#7BA7FF]" />
                </span>
                live
              </span>
            </div>
            <div key={feature.key} className="flex-1">
              {feature.visual}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniNavRow({
  icon,
  label,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[11.5px] transition-colors ${
        active ? "bg-white/[0.05] text-zinc-50" : "text-zinc-400"
      }`}
    >
      <span className={active ? "text-[#7BA7FF]" : "text-zinc-500"}>{icon}</span>
      <span className="truncate">{label}</span>
    </div>
  );
}
