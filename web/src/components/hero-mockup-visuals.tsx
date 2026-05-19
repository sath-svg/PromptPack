"use client";

import { useEffect, useState } from "react";
import {
  Bot,
  Check,
  Loader2,
  Lock,
  Mail,
  Package,
  Sparkles,
  Wand2,
  Zap,
} from "lucide-react";

/* ────────────────────────────────────────────────── HERO CHAT VISUAL */

/**
 * Skill Chat: user prompt → 3 parallel agents → save to "Email Tone Pro" skillset.
 * 4 phases, 2s each (8s loop).
 */
export function HeroChatVisual() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    // Phase 0 short so animation kicks in fast; final state (saved) lingers.
    const durations = [1100, 1800, 1800, 2500];
    const id = window.setTimeout(
      () => setPhase((p) => (p + 1) % 4),
      durations[phase],
    );
    return () => window.clearTimeout(id);
  }, [phase]);

  const agents = [
    { name: "Haiku 4.5", task: "Slack · casual blurb", color: "#7BA7FF" },
    { name: "Sonnet 4.5", task: "LinkedIn · 280 words", color: "#a78bfa" },
    { name: "GPT-5", task: "Blog post · 800 words", color: "#34d399" },
  ];

  return (
    <div className="flex flex-col gap-2 text-[11px]">
      {/* Phase 0: user prompt typing */}
      <div className="flex justify-end">
        <div
          className={`max-w-[80%] rounded-lg bg-[#2563EB]/15 px-3 py-2 text-zinc-100 transition-opacity duration-500 ${
            phase >= 0 ? "opacity-100" : "opacity-0"
          }`}
        >
          {phase === 0 ? (
            <span>
              Reformat this announcement for Slack, LinkedIn, and a blog post
              <span className="ml-0.5 inline-block h-3 w-[1px] animate-pulse bg-zinc-100" />
            </span>
          ) : (
            <span>Reformat this announcement for Slack, LinkedIn, and a blog post</span>
          )}
        </div>
      </div>

      {/* Phase 1+: parallel agents */}
      <div
        className={`transition-opacity duration-500 ${
          phase >= 1 ? "opacity-100" : "opacity-0"
        }`}
      >
        <p
          className="mb-1.5 text-[9px] uppercase tracking-[0.16em] text-[#7BA7FF]"
          style={{ fontFamily: "var(--font-geist-mono), monospace" }}
        >
          ↳ 3 agents · parallel
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {agents.map((a) => (
            <div
              key={a.name}
              className="rounded-md border border-white/10 bg-white/[0.02] p-2"
            >
              <div className="flex items-center gap-1">
                <Bot
                  className="h-2.5 w-2.5"
                  strokeWidth={2}
                  style={{ color: a.color }}
                />
                <span
                  className="text-[8.5px] uppercase tracking-[0.08em] text-zinc-400"
                  style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                >
                  {a.name}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-1 text-[10px] text-zinc-300">
                {phase >= 2 ? (
                  <>
                    <Check className="h-2.5 w-2.5 text-emerald-400" strokeWidth={3} />
                    <span>{a.task}</span>
                  </>
                ) : (
                  <>
                    <Loader2 className="h-2.5 w-2.5 animate-spin text-[#7BA7FF]" strokeWidth={2.5} />
                    <span className="text-zinc-400">{a.task}…</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Phase 3: save to skillset */}
      <div
        className={`mt-1 flex items-center gap-2 rounded-md border px-3 py-2 transition-all duration-500 ${
          phase === 3
            ? "border-emerald-500/40 bg-emerald-500/10 opacity-100 translate-y-0"
            : "border-transparent opacity-0 translate-y-1"
        }`}
      >
        <Sparkles
          className={`h-3.5 w-3.5 text-emerald-400 ${phase === 3 ? "animate-pulse" : ""}`}
          strokeWidth={2}
        />
        <span className="text-[10.5px] text-zinc-200">
          Saved to skillset ·{" "}
          <span className="font-medium text-emerald-300">Channel Voice</span>
        </span>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────── HERO ROUTER VISUAL */

/**
 * Skill Router: 3 prompts of varying complexity → routed to 3 different models.
 * Phase 0: prompts shown. Phase 1: arrows drawing. Phase 2: routes complete.
 */
export function HeroRouterVisual() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    // Phase 0 short so routing arrows draw fast; total summary lingers.
    const durations = [900, 2000, 2400];
    const id = window.setTimeout(
      () => setPhase((p) => (p + 1) % 3),
      durations[phase],
    );
    return () => window.clearTimeout(id);
  }, [phase]);

  const routes = [
    {
      prompt: "Summarize this email",
      complexity: "easy",
      model: "Gemini Flash",
      cost: "0.1¢",
      color: "#7BA7FF",
    },
    {
      prompt: "Draft a press release",
      complexity: "medium",
      model: "Sonnet 4.5",
      cost: "1.2¢",
      color: "#a78bfa",
    },
    {
      prompt: "Solve this proof",
      complexity: "hard",
      model: "GPT-5 Pro",
      cost: "8.0¢",
      color: "#f97316",
    },
  ];

  return (
    <div className="flex flex-col gap-1.5 text-[10px]">
      {routes.map((r, i) => {
        const visible = phase >= 1 || phase === 0;
        const routed = phase >= 1;
        return (
          <div
            key={r.prompt}
            className={`grid grid-cols-[1fr_auto_1fr] items-center gap-2 transition-all duration-500 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
            }`}
            style={{ transitionDelay: `${i * 100}ms` }}
          >
            {/* prompt */}
            <div className="rounded-md border border-white/10 bg-white/[0.02] px-2 py-1.5">
              <p className="truncate text-[11px] text-zinc-200">{r.prompt}</p>
              <p
                className="mt-0.5 text-[8.5px] uppercase tracking-[0.12em] text-zinc-500"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              >
                {r.complexity}
              </p>
            </div>

            {/* arrow */}
            <div className="flex items-center justify-center">
              <div
                className={`h-px transition-all duration-700 ${
                  routed ? "w-6 opacity-100" : "w-0 opacity-0"
                }`}
                style={{
                  background: `linear-gradient(to right, transparent, ${r.color})`,
                  transitionDelay: `${i * 150}ms`,
                }}
              />
              <Zap
                className={`h-2.5 w-2.5 transition-opacity duration-300 ${
                  routed ? "opacity-100" : "opacity-0"
                }`}
                style={{ color: r.color, transitionDelay: `${i * 150 + 400}ms` }}
                strokeWidth={2.5}
              />
            </div>

            {/* model */}
            <div
              className={`rounded-md border px-2 py-1.5 transition-all duration-500 ${
                routed
                  ? "border-white/15 bg-white/[0.04]"
                  : "border-white/5 bg-white/[0.01]"
              }`}
              style={{
                transitionDelay: `${i * 150 + 200}ms`,
              }}
            >
              <p
                className="text-[10.5px] font-medium text-zinc-100"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              >
                {r.model}
              </p>
              <p
                className="mt-0.5 text-[8.5px] uppercase tracking-[0.12em]"
                style={{
                  color: r.color,
                  fontFamily: "var(--font-geist-mono), monospace",
                }}
              >
                {r.cost}
              </p>
            </div>
          </div>
        );
      })}

      {phase === 2 && (
        <div className="mt-1 flex items-center justify-between rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5">
          <span
            className="text-[9px] uppercase tracking-[0.16em] text-emerald-300"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            Total
          </span>
          <span className="text-[10.5px] font-medium text-emerald-300">
            9.3¢ · 78% cheaper
          </span>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────── HERO FLOW VISUAL */

/**
 * Skill Flow: Email Tone Pro skillset runs step-by-step automatically.
 * 5 steps cycle through "running" → "done".
 */
export function HeroFlowVisual() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => setActiveStep((s) => (s + 1) % 6), 1500);
    return () => window.clearInterval(t);
  }, []);

  const steps = [
    "Parse incoming email",
    "Detect tone + intent",
    "Match brand voice",
    "Draft response",
    "Polish + send",
  ];

  return (
    <div className="flex flex-col gap-2 text-[10.5px]">
      {/* Skillset header */}
      <div className="flex items-center justify-between rounded-md border border-[#2563EB]/40 bg-[#2563EB]/10 px-2.5 py-1.5">
        <div className="flex items-center gap-1.5">
          <Mail className="h-3 w-3 text-[#7BA7FF]" strokeWidth={2.5} />
          <span className="text-[11px] font-medium text-zinc-100">
            Email Tone Pro
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          <span
            className="text-[9px] uppercase tracking-[0.14em] text-emerald-300"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            running
          </span>
        </div>
      </div>

      {/* Steps list */}
      <div className="flex flex-col gap-1">
        {steps.map((s, i) => {
          const done = i < activeStep || activeStep === 5;
          const running = i === activeStep && activeStep !== 5;
          const pending = i > activeStep && activeStep !== 5;
          return (
            <div
              key={s}
              className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 transition-all duration-300 ${
                running
                  ? "border-[#2563EB]/40 bg-[#2563EB]/10"
                  : done
                    ? "border-white/[0.06] bg-white/[0.02]"
                    : "border-white/[0.04] bg-transparent"
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[8px] font-medium ${
                  done
                    ? "bg-emerald-500/20 text-emerald-300"
                    : running
                      ? "bg-[#2563EB]/20 text-[#7BA7FF]"
                      : "bg-white/[0.04] text-zinc-600"
                }`}
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              >
                {done ? (
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                ) : running ? (
                  <Loader2 className="h-2.5 w-2.5 animate-spin" strokeWidth={2.5} />
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={`flex-1 truncate transition-colors ${
                  pending
                    ? "text-zinc-600"
                    : running
                      ? "text-zinc-50"
                      : "text-zinc-300"
                }`}
              >
                {s}
              </span>
              {done && (
                <span
                  className="text-[8.5px] uppercase tracking-[0.1em] text-emerald-400/70"
                  style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                >
                  done
                </span>
              )}
            </div>
          );
        })}
      </div>

      {activeStep === 5 && (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-[10.5px] text-emerald-300">
          ✓ All 5 steps complete · sent in 4.2s
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────── HERO PRESET VISUAL */

/**
 * Skill Preset:
 *   phase 0-1: girl photo with scan line animation
 *   phase 2: photo fades, 4 element cards appear around central skillset
 *   phase 3-6: elements fly into skillset one at a time (captured count increments)
 *   phase 7: locked + for sale
 */
export function HeroPresetVisual() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    // 0-1: photo scan · 2: cards appear (faster) · 3-6: capture (faster) · 7: sealed (+0.5s)
    const durations = [1300, 1300, 700, 600, 600, 600, 600, 1800];
    const id = window.setTimeout(
      () => setPhase((p) => (p + 1) % 8),
      durations[phase],
    );
    return () => window.clearTimeout(id);
  }, [phase]);

  const elements = [
    { label: "Palette", swatches: ["#f97316", "#0ea5e9", "#e879f9", "#fbbf24"] },
    { label: "Strokes", icon: "～" },
    { label: "Type", icon: "Aa" },
    { label: "Mood", icon: "✦" },
  ];

  const scanning = phase < 2;
  const elementsVisible = phase >= 2;
  const capturedCount = Math.max(0, Math.min(4, phase - 2));
  const sealed = phase >= 7;

  return (
    <div className="relative flex h-full min-h-[220px] flex-col">
      {/* Photo always mounted — fades + scales out when elements take over */}
      <div
        className="absolute inset-0 transition-all duration-700 ease-out"
        style={{
          opacity: scanning ? 1 : 0,
          transform: `scale(${scanning ? 1 : 0.9})`,
          filter: scanning ? "none" : "blur(4px)",
          pointerEvents: scanning ? "auto" : "none",
        }}
      >
        <div className="relative h-full overflow-hidden rounded-md border border-white/[0.06]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/img/skill-preset/source.jpg"
            alt="Verified style source"
            className="h-full w-full object-cover"
          />
          <span
            className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.14em] text-zinc-200"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            your photo · verified
          </span>
          {scanning && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 h-[2px] bg-[#7BA7FF] shadow-[0_0_12px_2px_rgba(123,167,255,0.7)]"
              style={{ animation: "heroPresetScan 1.3s linear infinite" }}
            />
          )}
          <p
            className="absolute right-1.5 top-1.5 rounded bg-[#2563EB]/30 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.14em] text-[#7BA7FF]"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            extracting style…
          </p>
          <style>{`
            @keyframes heroPresetScan {
              0% { top: 0; }
              50% { top: calc(100% - 2px); }
              100% { top: 0; }
            }
          `}</style>
        </div>
      </div>

      {/* Elements + skillset target — fade in after scan, always mounted */}
      <div
        className="absolute inset-0 transition-all duration-700 ease-out"
        style={{
          opacity: elementsVisible ? 1 : 0,
          transform: `scale(${elementsVisible ? 1 : 1.05})`,
          pointerEvents: elementsVisible ? "auto" : "none",
        }}
      >
        <div className="relative flex h-full min-h-[220px] flex-col items-center justify-center">
          {/* Floating element cards */}
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-3 p-1">
            {elements.map((el, i) => {
              const flown = capturedCount > i;
              return (
                <div
                  key={el.label}
                  className={`flex flex-col items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] p-2 transition-all duration-500 ease-[cubic-bezier(0.6,-0.05,0.6,1.2)] ${
                    flown ? "opacity-0" : "opacity-100"
                  }`}
                  style={{
                    transformOrigin: "50% 50%",
                    transform: flown
                      ? `translate(${i % 2 === 0 ? "60%" : "-60%"}, ${i < 2 ? "60%" : "-60%"}) scale(0.2)`
                      : "translate(0,0) scale(1)",
                  }}
                >
                  {el.label === "Palette" ? (
                    <div className="flex gap-1">
                      {el.swatches?.map((c) => (
                        <span
                          key={c}
                          className="h-3 w-3 rounded-full"
                          style={{ background: c }}
                        />
                      ))}
                    </div>
                  ) : (
                    <span
                      className="text-[20px] font-medium leading-none text-zinc-100"
                      style={{
                        fontFamily:
                          el.label === "Type" ? "Georgia, serif" : "inherit",
                      }}
                    >
                      {el.icon}
                    </span>
                  )}
                  <span
                    className="mt-1 text-[9px] uppercase tracking-[0.16em] text-zinc-500"
                    style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                  >
                    {el.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Central skillset target */}
          <div
            className={`relative z-10 flex flex-col items-center justify-center rounded-2xl border-2 transition-all duration-500 ${
              sealed
                ? "border-emerald-500/60 bg-emerald-500/10 scale-105"
                : "border-[#2563EB]/60 bg-[#2563EB]/10"
            }`}
            style={{ padding: "14px 20px" }}
          >
            <div className="flex items-center gap-2">
              {sealed ? (
                <Lock className="h-4 w-4 text-emerald-400" strokeWidth={2.5} />
              ) : (
                <Package className="h-4 w-4 text-[#7BA7FF]" strokeWidth={2} />
              )}
              <span className="text-[12px] font-medium text-zinc-50">
                My Visual Style
              </span>
            </div>
            <span
              className="mt-1 text-[9px] uppercase tracking-[0.18em]"
              style={{
                fontFamily: "var(--font-geist-mono), monospace",
                color: sealed ? "rgb(110, 231, 183)" : "rgb(123, 167, 255)",
              }}
            >
              {sealed ? "Encrypted · for sale" : `${capturedCount}/4 captured`}
            </span>

            {/* Pulse rings while capturing */}
            {!sealed && capturedCount > 0 && (
              <span className="pointer-events-none absolute inset-0 animate-ping rounded-2xl border border-[#2563EB]/40" />
            )}
          </div>

          {sealed && (
            <div className="absolute bottom-1 flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[9.5px] text-emerald-300">
              <Wand2 className="h-2.5 w-2.5" strokeWidth={2.5} />
              <span
                className="uppercase tracking-[0.14em]"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              >
                $19 / unlock
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
