"use client";

import Image from "next/image";
import Link from "next/link";
import { Package, Lock } from "lucide-react";
import { SignedIn, SignedOut } from "@/lib/auth-compat";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";

type ReplayState = "idle" | "playing" | "done";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function useReplay(durationMs: number) {
  const [state, setState] = useState<ReplayState>("idle");
  const [runId, setRunId] = useState(0);
  const prefersReduced = usePrefersReducedMotion();
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const play = useCallback(() => {
    if (state === "playing" || prefersReduced) return;
    setRunId((n) => n + 1);
    setState("playing");
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      setState("done");
      timeoutRef.current = null;
    }, durationMs);
  }, [state, prefersReduced, durationMs]);

  return { state, runId, play, prefersReduced };
}

function PlayableVisual({
  children,
  onPlay,
  state,
  label,
}: {
  children: ReactNode;
  onPlay: () => void;
  state: ReplayState;
  label: string;
}) {
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onPlay();
    }
  };
  const hintText = state === "idle" ? "▶ Click to play" : state === "playing" ? "Playing…" : "▶ Replay";
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-pressed={state === "playing"}
      onClick={onPlay}
      onKeyDown={onKeyDown}
      className={`bento-playable relative rounded-md outline-none ${
        state === "playing" ? "cursor-progress" : "cursor-pointer"
      }`}
    >
      <span className="bento-hint">{hintText}</span>
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── CHAT */

type ChatTurn =
  | { kind: "you"; text: string }
  | { kind: "ai"; model: string; text: string }
  | { kind: "parallel"; agents: { model: string; result: string }[] };

const CHAT_TURNS: ChatTurn[] = [
  { kind: "you", text: "Rewrite this in this voice." },
  { kind: "ai", model: "Claude", text: "Done. Switching to GPT-5 for the code block." },
  { kind: "ai", model: "GPT-5", text: "Refactored. Same skill, same context." },
  { kind: "you", text: "Now audit it — tests, lint, security in parallel." },
  { kind: "ai", model: "Planner", text: "Fanning out to 3 agents…" },
  {
    kind: "parallel",
    agents: [
      { model: "Haiku 4.5", result: "Tests ✓ 47 pass" },
      { model: "Sonnet 4.5", result: "Lint ✓ 2 fixes" },
      { model: "GPT-5", result: "Security ✓ clean" },
    ],
  },
];

const CHAT_DURATION = 2400;
const CHAT_BUBBLE_BASE_DELAY = 400;
const CHAT_BUBBLE_STAGGER = 320;

export function ChatVisual() {
  const { state, runId, play } = useReplay(CHAT_DURATION);
  const playing = state === "playing";

  const bubbleStyle = (i: number): CSSProperties =>
    playing
      ? {
          animation: `bentoBubbleIn 280ms ease-out ${i * CHAT_BUBBLE_STAGGER + CHAT_BUBBLE_BASE_DELAY}ms both`,
        }
      : {};

  const tagStyle: CSSProperties = playing
    ? { animation: "bentoTagPulse 400ms ease-out both" }
    : state === "idle"
      ? { animation: "bentoIdleGlow 2.4s ease-in-out infinite" }
      : {};

  return (
    <PlayableVisual onPlay={play} state={state} label="Replay skill chat animation">
      <div key={runId} className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-[#2563EB]/15 px-2 py-1 text-[11px] text-[#7BA7FF]"
            style={tagStyle}
          >
            <Package className="h-3 w-3" strokeWidth={2} />
            Email Tone Pro
          </span>
          <span
            className="text-[10px] text-zinc-600"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            8 prompts
          </span>
        </div>
        {CHAT_TURNS.map((t, i) => {
          if (t.kind === "parallel") {
            return (
              <div key={i} className="space-y-1" style={bubbleStyle(i)}>
                <p
                  className="text-[9px] uppercase tracking-[0.18em] text-[#7BA7FF]"
                  style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                >
                  ↳ 3 agents · parallel
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {t.agents.map((a) => (
                    <div
                      key={a.model}
                      className="rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-1"
                    >
                      <span
                        className="block text-[8.5px] uppercase tracking-[0.12em] text-zinc-500"
                        style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                      >
                        {a.model}
                      </span>
                      <span className="block text-[10.5px] text-zinc-200">
                        {a.result}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          }
          return (
            <div
              key={i}
              className={`flex items-start gap-2 ${t.kind === "you" ? "justify-end" : ""}`}
              style={bubbleStyle(i)}
            >
              {t.kind === "ai" && (
                <span
                  className="mt-0.5 shrink-0 rounded-full border border-white/10 bg-white/[0.02] px-2 py-0.5 text-[9.5px] uppercase tracking-[0.12em] text-zinc-400"
                  style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                >
                  {t.model}
                </span>
              )}
              <div
                className={`max-w-[80%] rounded-lg px-3 py-1.5 text-[12px] leading-snug ${
                  t.kind === "you"
                    ? "bg-[#2563EB]/15 text-zinc-100"
                    : "bg-white/[0.03] text-zinc-300"
                }`}
              >
                {t.text}
              </div>
            </div>
          );
        })}
      </div>
    </PlayableVisual>
  );
}

/* ────────────────────────────────────────────────────────────── PRESET */

const PRESET_VARIANTS = [
  { file: "variant-1", label: "Scene", burstX: -40, burstY: -20 },
  { file: "variant-2", label: "Object", burstX: -12, burstY: -28 },
  { file: "variant-3", label: "Character", burstX: 12, burstY: -28 },
  { file: "variant-4", label: "Mood", burstX: 40, burstY: -20 },
];

const PRESET_DURATION = 3300;
const PRESET_TILE_BASE_DELAY = 1100;
const PRESET_TILE_STAGGER = 120;
const PRESET_PARTICLE_BASE_DELAY = 2000;

const PRESET_PARTICLES = [
  { delay: 0, x: -28 },
  { delay: 140, x: 18 },
  { delay: 240, x: -8 },
  { delay: 360, x: 30 },
  { delay: 500, x: -22 },
  { delay: 640, x: 6 },
];

function DollarParticles({ runId, playing }: { runId: number; playing: boolean }) {
  if (!playing) return null;
  return (
    <div
      key={runId}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
    >
      {PRESET_PARTICLES.map((p, i) => (
        <span
          key={i}
          className="absolute left-1/2 bottom-2 -translate-x-1/2 text-[14px] font-semibold text-emerald-300 drop-shadow-[0_0_8px_rgba(110,231,183,0.6)]"
          style={{
            // @ts-expect-error CSS custom property
            "--p-x": `${p.x}px`,
            animation: `bentoDollarFloat 1200ms ease-out ${PRESET_PARTICLE_BASE_DELAY + p.delay}ms both`,
          }}
        >
          $
        </span>
      ))}
    </div>
  );
}

export function PresetVisual() {
  const { state, runId, play } = useReplay(PRESET_DURATION);
  const playing = state === "playing";

  const sourceStyle: CSSProperties = playing
    ? { animation: "bentoSourceCapture 800ms ease-in-out both" }
    : state === "idle"
      ? { animation: "bentoIdleShimmer 2.4s ease-in-out infinite" }
      : {};

  const arrowStyle: CSSProperties = playing
    ? { animation: "bentoTagPulse 600ms ease-out 700ms both" }
    : {};

  const tileStyle = (i: number): CSSProperties =>
    playing
      ? ({
          "--burst-x": `${PRESET_VARIANTS[i].burstX}px`,
          "--burst-y": `${PRESET_VARIANTS[i].burstY}px`,
          animation: `bentoTileBurst 700ms cubic-bezier(0.16, 1, 0.3, 1) ${PRESET_TILE_BASE_DELAY + i * PRESET_TILE_STAGGER}ms both`,
        } as CSSProperties)
      : {};

  return (
    <PlayableVisual onPlay={play} state={state} label="Replay skill preset animation">
      <div key={runId} className="flex flex-col gap-1.5">
        <div className="rounded-md" style={sourceStyle}>
          <div className="relative overflow-hidden rounded-md border border-white/[0.06]">
            <Image
              src="/img/skill-preset/source.jpg"
              alt="Verified artist photo"
              width={400}
              height={140}
              className="h-[72px] w-full object-cover"
              unoptimized
            />
            <span
              className="absolute bottom-1 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.14em] text-zinc-200"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              your photo · verified
            </span>
            {playing && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 h-[2px] bg-[#7BA7FF] shadow-[0_0_12px_2px_rgba(123,167,255,0.7)]"
                style={{ animation: "bentoScanLine 800ms linear both" }}
              />
            )}
          </div>
        </div>
        <p
          className="rounded text-center text-[9px] uppercase tracking-[0.22em] text-[#7BA7FF]"
          style={{ fontFamily: "var(--font-geist-mono), monospace", ...arrowStyle }}
        >
          ↓ generated into skillset
        </p>
        <div className="relative">
          <div className="grid grid-cols-4 gap-1">
            {PRESET_VARIANTS.map((v, i) => (
              <div
                key={v.file}
                className="relative aspect-square overflow-hidden rounded-md border border-white/[0.06]"
                style={tileStyle(i)}
              >
                <Image
                  src={`/img/skill-preset/${v.file}.png`}
                  alt={`Style-locked ${v.label}`}
                  width={160}
                  height={160}
                  className="h-full w-full object-cover"
                  unoptimized
                />
                <span
                  className="absolute bottom-0.5 left-0.5 rounded bg-black/55 px-1 py-0.5 text-[7.5px] uppercase tracking-[0.12em] text-white/90"
                  style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                >
                  {v.label}
                </span>
              </div>
            ))}
          </div>
          <DollarParticles runId={runId} playing={playing} />
        </div>
      </div>
    </PlayableVisual>
  );
}

/* ────────────────────────────────────────────────────────────── WORKFLOW */

const WORKFLOW_STEPS = [
  { n: "01", t: "Research brief", state: "done" },
  { n: "02", t: "Outline sections", state: "done" },
  { n: "03", t: "Draft each block", state: "running" },
  { n: "04", t: "Polish & cite", state: "queued" },
];

const WORKFLOW_DURATION = 2000;
const WORKFLOW_STAGGER = 380;

export function WorkflowVisual() {
  const { state, runId, play } = useReplay(WORKFLOW_DURATION);
  const playing = state === "playing";

  const stepStyle = (i: number): CSSProperties =>
    playing
      ? { animation: `bentoStepIn 360ms ease-out ${i * WORKFLOW_STAGGER}ms both` }
      : {};

  return (
    <PlayableVisual onPlay={play} state={state} label="Replay skill flow animation">
      <ol
        key={runId}
        className="divide-y divide-white/[0.05] border-y border-white/[0.05]"
      >
        {WORKFLOW_STEPS.map((s, i) => (
          <li key={s.n} className="flex items-center gap-3 py-2.5" style={stepStyle(i)}>
            <span
              className="w-7 text-[11px] text-zinc-500"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              {s.n}
            </span>
            <span className="text-[13px] text-zinc-200">{s.t}</span>
            <span
              className={`ml-auto inline-flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.12em] ${
                s.state === "done"
                  ? "text-emerald-400/80"
                  : s.state === "running"
                    ? "text-[#7BA7FF]"
                    : "text-zinc-500"
              }`}
            >
              {s.state === "running" && (
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#7BA7FF]" />
              )}
              {s.state}
            </span>
          </li>
        ))}
      </ol>
    </PlayableVisual>
  );
}

/* ────────────────────────────────────────────────────────────── ROUTER */

const ROUTER_ROWS = [
  { task: "summarize 80-page PDF", model: "Haiku 4.5", cost: "$0.0012", value: 0.0012 },
  { task: "refactor TypeScript module", model: "Sonnet 4.6", cost: "$0.0143", value: 0.0143 },
  { task: "extract chart from image", model: "Gemini 3", cost: "$0.0061", value: 0.0061 },
];

const ROUTER_DURATION = 2400;
const ROUTER_ROW_STAGGER = 350;
const ROUTER_COUNT_DURATION = 900;
const ROUTER_CALLOUT_DELAY = 1700;

function RouterCallout({ href, style, sub }: { href: string; style?: CSSProperties; sub: string }) {
  return (
    <Link
      href={href}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      className="mt-3 block rounded-lg border border-[#2563EB]/30 bg-gradient-to-br from-[#2563EB]/15 via-[#7BA7FF]/10 to-transparent px-3 py-2.5 text-center transition-all duration-200 hover:border-[#2563EB]/60 hover:from-[#2563EB]/25 hover:via-[#7BA7FF]/20 hover:shadow-[0_10px_30px_-12px_rgba(37,99,235,0.6)]"
      style={style}
    >
      <p className="bg-gradient-to-r from-[#7BA7FF] via-[#a5c3ff] to-emerald-300 bg-clip-text text-[20px] font-semibold leading-none tracking-[-0.02em] text-transparent md:text-[22px]">
        Save up to 80% on tokens
      </p>
      <p
        className="mt-1.5 text-[9.5px] uppercase tracking-[0.18em] text-zinc-400"
        style={{ fontFamily: "var(--font-geist-mono), monospace" }}
      >
        {sub}
      </p>
    </Link>
  );
}

function CountUp({
  value,
  duration,
  delay,
  runId,
  playing,
  fallback,
  className,
  style,
}: {
  value: number;
  duration: number;
  delay: number;
  runId: number;
  playing: boolean;
  fallback: string;
  className?: string;
  style?: CSSProperties;
}) {
  const [display, setDisplay] = useState(fallback);

  useEffect(() => {
    if (!playing) {
      setDisplay(fallback);
      return;
    }
    let rafId = 0;
    let startTs = 0;
    setDisplay(`$${(0).toFixed(4)}`);
    const startTimeout = window.setTimeout(() => {
      const step = (ts: number) => {
        if (!startTs) startTs = ts;
        const t = Math.min(1, (ts - startTs) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        setDisplay(`$${(value * eased).toFixed(4)}`);
        if (t < 1) {
          rafId = window.requestAnimationFrame(step);
        } else {
          setDisplay(fallback);
        }
      };
      rafId = window.requestAnimationFrame(step);
    }, delay);
    return () => {
      window.clearTimeout(startTimeout);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [runId, playing, value, duration, delay, fallback]);

  return (
    <span className={className} style={style}>
      {display}
    </span>
  );
}

export function RouterVisual() {
  const { state, runId, play } = useReplay(ROUTER_DURATION);
  const playing = state === "playing";

  const calloutStyle: CSSProperties = playing
    ? { animation: `bentoCalloutPulse 600ms ease-in-out ${ROUTER_CALLOUT_DELAY}ms both` }
    : {};

  return (
    <PlayableVisual onPlay={play} state={state} label="Replay skill router animation">
      <div key={runId}>
        <div className="divide-y divide-white/[0.05] border-y border-white/[0.05]">
          {ROUTER_ROWS.map((r, i) => (
            <div
              key={r.task}
              className="grid grid-cols-[1.6fr_1fr_0.7fr] items-center gap-3 py-2.5"
            >
              <span className="truncate text-[13px] text-zinc-300">{r.task}</span>
              <span
                className="text-[12.5px] text-[#7BA7FF]"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              >
                {r.model}
              </span>
              <CountUp
                value={r.value}
                duration={ROUTER_COUNT_DURATION}
                delay={i * ROUTER_ROW_STAGGER}
                runId={runId}
                playing={playing}
                fallback={r.cost}
                className="text-right text-[12.5px] tabular-nums text-zinc-400"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              />
            </div>
          ))}
        </div>
        <SignedOut>
          <RouterCallout href="/sign-up" style={calloutStyle} sub="auto-routed to the cheapest capable tier · start free →" />
        </SignedOut>
        <SignedIn>
          <RouterCallout href="/pricing" style={calloutStyle} sub="auto-routed to the cheapest capable tier · see plans →" />
        </SignedIn>
      </div>
    </PlayableVisual>
  );
}

/* ────────────────────────────────────────────────────────────── STEP 01 — CAPTURE */

export function StepCaptureVisual() {
  const { state, runId, play } = useReplay(2000);
  const playing = state === "playing";

  const btnStyle: CSSProperties =
    state === "idle"
      ? { animation: "bentoIdleGlow 2.4s ease-in-out infinite" }
      : playing
        ? { animation: "bentoTagPulse 300ms ease-out both" }
        : {};

  const savedStyle: CSSProperties = playing
    ? { animation: "bentoBubbleIn 320ms ease-out 700ms both" }
    : {};

  return (
    <PlayableVisual onPlay={play} state={state} label="Replay capture animation">
      <div key={runId} className="space-y-2">
        <div className="overflow-hidden rounded-lg border border-white/[0.07] bg-[#0a0a0c]">
          <div className="flex items-center gap-1.5 border-b border-white/[0.05] px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#3b3b3f]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#3b3b3f]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#3b3b3f]" />
            <span
              className="ml-2 text-[9px] text-zinc-600"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              chatgpt.com
            </span>
          </div>
          <div className="space-y-2 p-3">
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-lg bg-[#2563EB]/15 px-2.5 py-1.5 text-[11px] text-zinc-200">
                Rewrite this email in a friendly tone.
              </div>
            </div>
            <div
              className="flex items-center gap-1.5 rounded-md border border-[#2563EB]/25 bg-[#2563EB]/[0.08] px-2.5 py-1.5"
              style={btnStyle}
            >
              <span className="flex-1 text-[10px] text-[#7BA7FF]">
                {playing ? "Saving to Skillset…" : "Save to Skillset"}
              </span>
              {playing && (
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#7BA7FF]" />
              )}
            </div>
          </div>
        </div>
        {state !== "idle" && (
          <div
            className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.05] px-3 py-2"
            style={savedStyle}
          >
            <span className="text-[12px] text-emerald-400">✓</span>
            <span className="text-[11px] text-zinc-300">Email Rewriter · saved</span>
            <span
              className="ml-auto text-[9px] text-zinc-500"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              just now
            </span>
          </div>
        )}
      </div>
    </PlayableVisual>
  );
}

/* ────────────────────────────────────────────────────────────── STEP 02 — PACK */

const PACK_CHIPS = ["Email Tone", "Rewrite", "Subject Line"];

export function StepPackVisual() {
  const { state, runId, play } = useReplay(2400);
  const playing = state === "playing";

  const chipStyle = (i: number): CSSProperties =>
    playing
      ? { animation: `bentoBubbleIn 280ms ease-out ${i * 160}ms both` }
      : {};

  const arrowStyle: CSSProperties = playing
    ? { animation: "bentoTagPulse 400ms ease-out 560ms both" }
    : {};

  const cardStyle: CSSProperties = playing
    ? { animation: "bentoBubbleIn 420ms cubic-bezier(0.16,1,0.3,1) 900ms both" }
    : {};

  return (
    <PlayableVisual onPlay={play} state={state} label="Replay pack animation">
      <div key={runId} className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {PACK_CHIPS.map((c, i) => (
            <span
              key={c}
              className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] text-zinc-300"
              style={chipStyle(i)}
            >
              {c}
            </span>
          ))}
        </div>
        {state !== "idle" && (
          <>
            <p
              className="text-center text-[9px] uppercase tracking-[0.2em] text-[#7BA7FF]"
              style={{ fontFamily: "var(--font-geist-mono), monospace", ...arrowStyle }}
            >
              ↓ bundling
            </p>
            <div
              className="rounded-lg border border-[#2563EB]/25 bg-[#2563EB]/[0.07] p-3"
              style={cardStyle}
            >
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-zinc-100">Email Pro</span>
                <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                  <Lock className="h-3 w-3" strokeWidth={2} />
                  encrypted
                </span>
              </div>
              <p
                className="mt-1 text-[10px] text-zinc-500"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              >
                3 prompts · portable · yours
              </p>
            </div>
          </>
        )}
      </div>
    </PlayableVisual>
  );
}

/* ────────────────────────────────────────────────────────────── STEP 03 — RUN / SELL */

export function StepRunVisual() {
  const { state, runId, play } = useReplay(2800);
  const playing = state === "playing";

  const responseStyle: CSSProperties = playing
    ? { animation: "bentoBubbleIn 380ms ease-out 600ms both" }
    : {};

  const saleStyle: CSSProperties = playing
    ? { animation: "bentoCalloutPulse 500ms ease-out 1700ms both" }
    : {};

  const saleFadeStyle: CSSProperties = playing
    ? { animation: "bentoBubbleIn 400ms ease-out 1700ms both" }
    : {};

  return (
    <PlayableVisual onPlay={play} state={state} label="Replay run or sell animation">
      <div key={runId} className="space-y-2">
        <div className="flex items-center gap-2 rounded-md border border-white/[0.07] bg-white/[0.02] px-3 py-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2563EB]/15 px-2 py-0.5 text-[10px] text-[#7BA7FF]">
            <Package className="h-2.5 w-2.5" strokeWidth={2} />
            Email Pro
          </span>
          <span className="ml-auto flex items-center gap-1 text-[10px] text-zinc-500">
            {playing && (
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#7BA7FF]" />
            )}
            {playing ? "running…" : "▶ run"}
          </span>
        </div>
        {state !== "idle" && (
          <div
            className="rounded-md border border-white/[0.05] bg-white/[0.03] px-3 py-2 text-[11px] leading-relaxed text-zinc-300"
            style={responseStyle}
          >
            Hi Sarah, just following up on our last chat — wanted to keep things moving on this…
          </div>
        )}
        {state !== "idle" && (
          <p
            className="text-center text-[9px] uppercase tracking-[0.2em] text-[#7BA7FF]"
            style={{ fontFamily: "var(--font-geist-mono), monospace", ...(playing ? { animation: "bentoTagPulse 400ms ease-out 1200ms both" } : {}) }}
          >
            ↓ sell your skillset
          </p>
        )}
        {state !== "idle" && (
          <div
            className="flex items-center gap-2.5 rounded-lg border border-emerald-500/25 bg-emerald-500/[0.07] px-3 py-2"
            style={{ ...saleStyle, ...saleFadeStyle }}
          >
            <span className="text-[15px]">💰</span>
            <div>
              <p className="text-[11px] font-medium text-emerald-300">Someone purchased &ldquo;Email Pro&rdquo; for $9.00</p>
              <p
                className="text-[9px] text-zinc-500"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              >
                licensed · royalty paid to you
              </p>
            </div>
          </div>
        )}
      </div>
    </PlayableVisual>
  );
}
