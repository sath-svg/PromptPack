import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  staticFile,
  Img,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily: interFont } = loadFont();

/* ─── colour tokens ─── */
const C = {
  bg: "#0a0a0f",
  darkGray: "#1a1a2e",
  card: "#1e1e30",
  cardBorder: "#2a2a45",
  purple: "#9b7bff",
  purpleLight: "#c4b5fd",
  purpleDark: "#7c3aed",
  blue: "#3b82f6",
  cyan: "#00d4ff",
  white: "#ffffff",
  gray: "#9ca3af",
  grayLight: "#d1d5db",
  green: "#22c55e",
  orange: "#f97316",
  red: "#ef4444",
};

/* ─── helpers ─── */
const fadeIn = (frame: number, start: number, dur = 20) =>
  interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

const fadeOut = (frame: number, start: number, dur = 15) =>
  interpolate(frame, [start, start + dur], [1, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

const slideUp = (frame: number, start: number, dur = 20, dist = 60) =>
  interpolate(frame, [start, start + dur], [dist, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

const slideIn = (frame: number, start: number, from = 80, dur = 25) =>
  interpolate(frame, [start, start + dur], [from, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

const scaleIn = (frame: number, fps: number, delay: number) =>
  spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

/* ─── background gradient ─── */
const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const shift = interpolate(frame, [0, 1635], [20, 80], {
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at ${shift}% 20%, ${C.purpleDark}18 0%, ${C.bg} 70%)`,
      }}
    />
  );
};

/* ─── subtle grid pattern ─── */
const GridOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 0.03], {
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        opacity,
        backgroundImage: `
          linear-gradient(${C.purple}20 1px, transparent 1px),
          linear-gradient(90deg, ${C.purple}20 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
      }}
    />
  );
};

/* ─── Floating particles ─── */
const Particles: React.FC = () => {
  const frame = useCurrentFrame();
  const particles = [
    { x: 10, y: 20, size: 4, speed: 0.3, delay: 0 },
    { x: 85, y: 70, size: 3, speed: 0.5, delay: 20 },
    { x: 50, y: 90, size: 5, speed: 0.2, delay: 40 },
    { x: 30, y: 50, size: 3, speed: 0.4, delay: 10 },
    { x: 70, y: 30, size: 4, speed: 0.35, delay: 30 },
    { x: 15, y: 80, size: 3, speed: 0.45, delay: 50 },
    { x: 90, y: 15, size: 4, speed: 0.25, delay: 15 },
  ];
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {particles.map((p, i) => {
        const y = p.y + Math.sin((frame + p.delay) * p.speed * 0.05) * 5;
        const opacity = interpolate(
          Math.sin((frame + p.delay) * 0.03),
          [-1, 1],
          [0.1, 0.4]
        );
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${p.x}%`,
              top: `${y}%`,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: C.purple,
              opacity,
              filter: "blur(1px)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/* ═══════════════════════════════════════════
   SCENE 1 — Logo Intro  (0s → 4s = 0–120)
   ═══════════════════════════════════════════ */
const SceneLogo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 80 },
  });
  const subOp = fadeIn(frame, 25);
  const subY = slideUp(frame, 25);

  const glowSize = interpolate(frame, [0, 40, 90], [0, 150, 120], {
    extrapolateRight: "clamp",
  });
  const glowPulse = interpolate(Math.sin(frame * 0.08), [-1, 1], [0.6, 1]);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* Big glow behind logo */}
      <div
        style={{
          position: "absolute",
          width: glowSize * 8,
          height: glowSize * 5,
          borderRadius: "50%",
          background: `radial-gradient(circle, #6366f130 0%, transparent 70%)`,
          filter: "blur(80px)",
          opacity: glowPulse,
        }}
      />
      {/* Large logo image (icon + wordmark) */}
      <div style={{ transform: `scale(${logoScale})`, marginBottom: -100 }}>
        <Img
          src={staticFile("PromptPack.png")}
          style={{
            width: 1100,
            height: "auto",
            filter: "drop-shadow(0 0 60px rgba(99,102,241,0.5))",
          }}
        />
      </div>
      {/* Subtitle — hero style from pmtpk.com */}
      <div
        style={{
          opacity: subOp,
          transform: `translateY(${subY}px)`,
          fontSize: 32,
          fontWeight: 700,
          fontFamily: interFont,
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: 4,
          textTransform: "uppercase",
        }}
      >
        AI Prompt Management Tool
      </div>
    </AbsoluteFill>
  );
};

/* ═══════════════════════════════════════════
   SCENE 2 — Hook / Problem (4s → 9s = 120–270)
   ═══════════════════════════════════════════ */
const SceneProblem: React.FC = () => {
  const frame = useCurrentFrame();

  const headOp = fadeIn(frame, 5);
  const headY = slideUp(frame, 5);

  const statOp = fadeIn(frame, 35);
  const statY = slideUp(frame, 35);

  const problems = [
    { text: "Rewriting the same prompts over and over", icon: "🔄" },
    { text: "Losing your best prompts in chat history", icon: "💨" },
    { text: "No way to organize across AI platforms", icon: "📂" },
  ];

  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center", padding: 100 }}
    >
      {/* Main headline */}
      <div
        style={{
          opacity: headOp,
          transform: `translateY(${headY}px)`,
          fontSize: 62,
          fontWeight: 800,
          color: C.white,
          marginBottom: 20,
          fontFamily: interFont,
          textAlign: "center",
          lineHeight: 1.2,
        }}
      >
        Stop losing your best prompts.
      </div>

      {/* Stat line */}
      <div
        style={{
          opacity: statOp,
          transform: `translateY(${statY}px)`,
          fontSize: 22,
          color: C.gray,
          marginBottom: 60,
          fontFamily: interFont,
          textAlign: "center",
          maxWidth: 700,
          lineHeight: 1.5,
        }}
      >
        ChatGPT alone sees{" "}
        <span style={{ color: C.cyan, fontWeight: 700 }}>
          2.5 billion prompts a day
        </span>
        . Your best work shouldn't disappear.
      </div>

      {/* Problem list */}
      {problems.map((p, i) => {
        const delay = 55 + i * 20;
        const op = fadeIn(frame, delay);
        const x = slideIn(frame, delay, -50);
        return (
          <div
            key={i}
            style={{
              opacity: op,
              transform: `translateX(${x}px)`,
              display: "flex",
              alignItems: "center",
              gap: 20,
              marginBottom: 28,
              fontSize: 26,
              color: C.grayLight,
              fontFamily: interFont,
              background: `${C.red}08`,
              padding: "16px 32px",
              borderRadius: 12,
              border: `1px solid ${C.red}20`,
            }}
          >
            <span style={{ fontSize: 28 }}>{p.icon}</span>
            <span style={{ color: C.orange, fontSize: 28, fontWeight: 700 }}>
              ✗
            </span>
            {p.text}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/* ═══════════════════════════════════════════
   SCENE 3 — Solution Intro (9s → 13s = 270–390)
   ═══════════════════════════════════════════ */
const SceneSolution: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({
    frame: frame - 5,
    fps,
    config: { damping: 12, stiffness: 80 },
  });
  const subOp = fadeIn(frame, 30);
  const subY = slideUp(frame, 30);

  const tagOp = fadeIn(frame, 55);

  const tags = [
    { text: "Save", color: C.green },
    { text: "Organize", color: C.blue },
    { text: "Enhance", color: C.purple },
    { text: "Share", color: C.cyan },
  ];

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          transform: `scale(${titleScale})`,
          fontSize: 78,
          fontWeight: 800,
          background: `linear-gradient(135deg, ${C.purpleLight}, ${C.purple}, ${C.purpleDark})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontFamily: interFont,
          marginBottom: 24,
        }}
      >
        Meet PromptPack
      </div>
      <div
        style={{
          opacity: subOp,
          transform: `translateY(${subY}px)`,
          fontSize: 30,
          color: C.white,
          fontFamily: interFont,
          textAlign: "center",
          maxWidth: 800,
          lineHeight: 1.4,
          marginBottom: 50,
        }}
      >
        Save, organize, and access your best prompts — everywhere
      </div>

      {/* Feature tags */}
      <div style={{ display: "flex", gap: 20 }}>
        {tags.map((t, i) => {
          const s = scaleIn(frame, fps, 50 + i * 8);
          return (
            <div
              key={t.text}
              style={{
                opacity: tagOp,
                transform: `scale(${s})`,
                padding: "14px 32px",
                borderRadius: 40,
                background: `${t.color}15`,
                border: `2px solid ${t.color}50`,
                color: t.color,
                fontSize: 22,
                fontWeight: 700,
                fontFamily: interFont,
              }}
            >
              {t.text}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ═══════════════════════════════════════════
   SCENE 4 — Feature: One-Click Save (13s → 19s = 390–570)
   ═══════════════════════════════════════════ */
const SceneFeatureSave: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const labelOp = fadeIn(frame, 5);
  const titleOp = fadeIn(frame, 15);
  const titleY = slideUp(frame, 15);
  const descOp = fadeIn(frame, 30);
  const imgScale = scaleIn(frame, fps, 40);
  const imgOp = fadeIn(frame, 40, 30);

  // Cursor animation for the "click" effect
  const cursorX = interpolate(frame, [70, 100], [100, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  const clickScale = interpolate(frame, [100, 110, 120], [1, 0.9, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  return (
    <AbsoluteFill
      style={{ flexDirection: "row", alignItems: "center", padding: "0 120px" }}
    >
      {/* Left text */}
      <div style={{ flex: 1, paddingRight: 60 }}>
        <div
          style={{
            opacity: labelOp,
            color: C.purple,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: 3,
            marginBottom: 16,
          }}
        >
          ONE-CLICK SAVE
        </div>
        <div
          style={{
            opacity: titleOp,
            transform: `translateY(${titleY}px)`,
            fontSize: 48,
            fontWeight: 700,
            color: C.white,
            fontFamily: interFont,
            marginBottom: 20,
            lineHeight: 1.2,
          }}
        >
          Save Prompts
          <br />
          <span
            style={{
              background: `linear-gradient(135deg, ${C.purple}, ${C.cyan})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Instantly
          </span>
        </div>
        <div
          style={{
            opacity: descOp,
            fontSize: 22,
            color: C.gray,
            lineHeight: 1.7,
            fontFamily: interFont,
          }}
        >
          Capture any prompt with one click directly from ChatGPT, Claude, or
          Gemini. Auto-organized into folders by platform.
        </div>
      </div>
      {/* Right — PromptBoxEnhanced with ConciseBubble overlay + save click */}
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
        }}
      >
        {/* PromptBoxEnhanced + ConciseBubble below */}
        <div
          style={{
            opacity: imgOp,
            transform: `scale(${imgScale})`,
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* PromptBoxEnhanced SVG — main prompt box */}
          <Img
            src={staticFile("PromptBoxEnhanced.svg")}
            style={{
              width: 800,
              height: "auto",
              filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.08))",
            }}
          />
          {/* ConciseBubble SVG — below the prompt box */}
          <div
            style={{
              marginTop: 16,
              transform: `scale(${clickScale})`,
              transformOrigin: "center center",
              position: "relative",
            }}
          >
            <Img
              src={staticFile("ConciseBubble.svg")}
              style={{
                width: 500,
                height: "auto",
                filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.08))",
              }}
            />
            {/* Save button flash effect */}
            {frame > 100 && frame < 130 && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: `radial-gradient(circle at 80% 50%, ${C.purple}30 0%, transparent 60%)`,
                  borderRadius: 30,
                  opacity: interpolate(frame, [100, 115, 130], [0, 1, 0], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }),
                }}
              />
            )}
          </div>
          {/* "Saved!" confirmation that appears after click */}
          {frame > 115 && (
            <div
              style={{
                position: "absolute",
                bottom: -50,
                left: "50%",
                transform: "translateX(-50%)",
                opacity: interpolate(frame, [115, 125, 155, 165], [0, 1, 1, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
                padding: "10px 28px",
                borderRadius: 30,
                background: C.green,
                color: C.white,
                fontSize: 20,
                fontWeight: 700,
                fontFamily: interFont,
                boxShadow: `0 8px 24px ${C.green}50`,
                whiteSpace: "nowrap",
              }}
            >
              ✓ Saved!
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ═══════════════════════════════════════════
   SCENE 4b — Save from Input Box
   ═══════════════════════════════════════════ */
const SceneSaveFromInput: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const labelOp = fadeIn(frame, 5);
  const titleOp = fadeIn(frame, 15);
  const titleY = slideUp(frame, 15);
  const descOp = fadeIn(frame, 30);
  const bubbleOp = fadeIn(frame, 40, 20);
  const bubbleScale = scaleIn(frame, fps, 40);

  // Click animation on PromptPack icon at frame 80
  const clickFrame = 80;
  const iconClickScale = interpolate(
    frame,
    [clickFrame, clickFrame + 4, clickFrame + 8],
    [1, 0.7, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const iconGlow = interpolate(
    frame,
    [clickFrame, clickFrame + 8, clickFrame + 20],
    [0, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  // Saved toast
  const showToast = frame > clickFrame + 10;
  const toastOp = interpolate(
    frame,
    [clickFrame + 10, clickFrame + 20, clickFrame + 50, clickFrame + 60],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const toastY = interpolate(
    frame,
    [clickFrame + 10, clickFrame + 20],
    [10, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{ flexDirection: "row", alignItems: "center", padding: "0 120px" }}
    >
      {/* Left text */}
      <div style={{ flex: 1, paddingRight: 60 }}>
        <div
          style={{
            opacity: labelOp,
            color: C.purple,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: 3,
            marginBottom: 16,
          }}
        >
          SAVE FROM INPUT
        </div>
        <div
          style={{
            opacity: titleOp,
            transform: `translateY(${titleY}px)`,
            fontSize: 48,
            fontWeight: 700,
            color: C.white,
            fontFamily: interFont,
            marginBottom: 20,
            lineHeight: 1.2,
          }}
        >
          Save Directly
          <br />
          <span
            style={{
              background: `linear-gradient(135deg, ${C.purple}, ${C.cyan})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            From Chat
          </span>
        </div>
        <div
          style={{
            opacity: descOp,
            fontSize: 22,
            color: C.gray,
            lineHeight: 1.7,
            fontFamily: interFont,
          }}
        >
          Click the PromptPack icon below any input box to save the prompt
          instantly. No menus, no extra steps.
        </div>
      </div>
      {/* Right — crafted input bubble with icons */}
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            opacity: bubbleOp,
            transform: `scale(${bubbleScale})`,
            position: "relative",
            width: 700,
          }}
        >
          {/* Chat input bubble */}
          <div
            style={{
              background: "#2d2d2d",
              borderRadius: 24,
              padding: "28px 32px",
              color: C.white,
              fontSize: 20,
              fontFamily: interFont,
              lineHeight: 1.6,
              boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
            }}
          >
            Explain the ISO ecosystem by comparing these entities:
            Standard-setting body vs. Certification bodies vs. Training
            providers vs. Consultants.
          </div>
          {/* Icons row below the bubble — right aligned */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 12,
              marginTop: 12,
              marginRight: 8,
            }}
          >
            {/* PromptPack icon — clickable */}
            <div
              style={{
                transform: `scale(${iconClickScale})`,
                cursor: "pointer",
                position: "relative",
              }}
            >
              <Img
                src={staticFile("PromptPackIcon.png")}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 4,
                  filter: iconGlow > 0
                    ? `drop-shadow(0 0 ${8 * iconGlow}px ${C.purple}) brightness(${1 + iconGlow * 0.3})`
                    : "none",
                }}
              />
            </div>
            {/* Copy icon (SVG inline) */}
            <svg
              width="34"
              height="34"
              viewBox="0 0 24 24"
              fill="none"
              stroke={C.gray}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
          </div>
          {/* "Saved!" toast */}
          {showToast && (
            <div
              style={{
                position: "absolute",
                bottom: -60,
                left: 0,
                opacity: toastOp,
                transform: `translateY(${toastY}px)`,
                padding: "10px 28px",
                borderRadius: 30,
                background: C.green,
                color: C.white,
                fontSize: 20,
                fontWeight: 700,
                fontFamily: interFont,
                boxShadow: `0 8px 24px ${C.green}50`,
                whiteSpace: "nowrap",
              }}
            >
              ✓ Saved!
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ═══════════════════════════════════════════
   SCENE 5 — Feature: Organize (19s → 24s = 570–720)
   ═══════════════════════════════════════════ */
const SceneFeatureOrganize: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const labelOp = fadeIn(frame, 5);
  const titleOp = fadeIn(frame, 15);
  const titleY = slideUp(frame, 15);
  const descOp = fadeIn(frame, 30);
  const imgScale = scaleIn(frame, fps, 40);
  const imgOp = fadeIn(frame, 40, 30);

  // Floating bob animation
  const floatY = Math.sin(frame * 0.06) * 8;
  // Subtle tilt
  const tilt = Math.sin(frame * 0.04) * 1.5;
  // Glow pulse
  const glowIntensity = interpolate(
    Math.sin(frame * 0.08),
    [-1, 1],
    [40, 80]
  );

  return (
    <AbsoluteFill
      style={{
        flexDirection: "row-reverse",
        alignItems: "center",
        padding: "0 120px",
      }}
    >
      {/* Right text */}
      <div style={{ flex: 1, paddingLeft: 60 }}>
        <div
          style={{
            opacity: labelOp,
            color: C.cyan,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: 3,
            marginBottom: 16,
          }}
        >
          SMART FOLDERS
        </div>
        <div
          style={{
            opacity: titleOp,
            transform: `translateY(${titleY}px)`,
            fontSize: 48,
            fontWeight: 700,
            color: C.white,
            fontFamily: interFont,
            marginBottom: 20,
            lineHeight: 1.2,
          }}
        >
          Organize by
          <br />
          <span
            style={{
              background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            AI Platform
          </span>
        </div>
        <div
          style={{
            opacity: descOp,
            fontSize: 22,
            color: C.gray,
            lineHeight: 1.7,
            fontFamily: interFont,
          }}
        >
          Prompts automatically sort into ChatGPT, Claude, and Gemini folders.
          Create custom packs for repeatable workflows.
        </div>
      </div>
      {/* Left image — PromptPack extension with floating animation */}
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            opacity: imgOp,
            transform: `scale(${imgScale}) translateY(${floatY}px) rotate(${tilt}deg)`,
            borderRadius: 20,
            overflow: "hidden",
            boxShadow: `0 ${30 + floatY}px ${glowIntensity}px ${C.blue}40, 0 0 0 1px ${C.blue}30`,
          }}
        >
          <Img
            src={staticFile("PromptPack.svg")}
            style={{ width: 600, height: "auto" }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ═══════════════════════════════════════════
   SCENE 6 — Feature: Quick Select (24s → 29s = 720–870)
   ═══════════════════════════════════════════ */
const SceneFeatureQuickSelect: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const labelOp = fadeIn(frame, 5);
  const titleOp = fadeIn(frame, 15);
  const titleY = slideUp(frame, 15);
  const descOp = fadeIn(frame, 30);
  const imgScale = scaleIn(frame, fps, 40);
  const imgOp = fadeIn(frame, 40, 30);

  // Click animation at frame 85: QuickSelect bounces, then fades out, PromptBox swaps
  const clickFrame = 85;
  const clickBounce = interpolate(frame, [clickFrame, clickFrame + 5, clickFrame + 10], [1, 0.95, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // QuickSelect fades out after click
  const qsOpacity = interpolate(frame, [clickFrame + 5, clickFrame + 15], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // PromptBox swaps to Enhanced after QuickSelect fades
  const showEnhanced = frame > clickFrame + 10;
  // Enhanced prompt box scale pop + brightness on swap
  const enhancedPop = interpolate(
    frame,
    [clickFrame + 10, clickFrame + 16, clickFrame + 22],
    [0.95, 1.03, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const enhancedBright = interpolate(
    frame,
    [clickFrame + 10, clickFrame + 16, clickFrame + 24],
    [1.3, 1.15, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{ flexDirection: "row", alignItems: "center", padding: "0 120px" }}
    >
      {/* Left text */}
      <div style={{ flex: 1, paddingRight: 60 }}>
        <div
          style={{
            opacity: labelOp,
            color: C.green,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: 3,
            marginBottom: 16,
          }}
        >
          INSTANT ACCESS
        </div>
        <div
          style={{
            opacity: titleOp,
            transform: `translateY(${titleY}px)`,
            fontSize: 48,
            fontWeight: 700,
            color: C.white,
            fontFamily: interFont,
            marginBottom: 20,
            lineHeight: 1.2,
          }}
        >
          Quick Select
          <br />
          <span
            style={{
              background: `linear-gradient(135deg, ${C.green}, ${C.cyan})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Menu
          </span>
        </div>
        <div
          style={{
            opacity: descOp,
            fontSize: 22,
            color: C.gray,
            lineHeight: 1.7,
            fontFamily: interFont,
          }}
        >
          Right-click any prompt box to instantly insert a saved prompt. Your
          entire library, one click away.
        </div>
      </div>
      {/* Right image — QuickSelect over PromptBox */}
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginTop: -120,
        }}
      >
        <div
          style={{
            opacity: imgOp,
            transform: `scale(${imgScale})`,
            position: "relative",
          }}
        >
          {/* PromptBox behind — swaps to Enhanced after click */}
          <div
            style={{
              position: "absolute",
              top: showEnhanced ? "42%" : "85%",
              left: 0,
              zIndex: 0,
              transform: showEnhanced ? `scale(${enhancedPop})` : undefined,
              filter: showEnhanced ? `brightness(${enhancedBright})` : undefined,
            }}
          >
            {!showEnhanced && (
              <Img
                src={staticFile("PromptBox.png")}
                style={{
                  width: 700,
                  height: "auto",
                  filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.4))",
                }}
              />
            )}
            {showEnhanced && (
              <Img
                src={staticFile("PromptBoxEnhanced.svg")}
                style={{
                  width: 700,
                  height: "auto",
                  filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.4))",
                }}
              />
            )}
          </div>
          {/* QuickSelect on top — bounces on click, then fades out */}
          <Img
            src={staticFile("QuickSelect.png")}
            style={{
              width: 550,
              height: "auto",
              position: "relative",
              zIndex: 1,
              transform: `scale(${clickBounce})`,
              opacity: qsOpacity,
              filter: `drop-shadow(0 20px 40px ${C.green}30)`,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ═══════════════════════════════════════════
   SCENE 7 — Feature: Output Styles (29s → 34s = 870–1020)
   ═══════════════════════════════════════════ */
const SceneOutputStyles: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const styles = [
    { label: "Structured", desc: "Organized output", color: C.blue },
    { label: "Clarity", desc: "Clear & readable", color: C.green },
    { label: "Concise", desc: "Short & direct", color: C.purple },
    { label: "Strict", desc: "Precise control", color: C.orange },
  ];

  const labelOp = fadeIn(frame, 3);
  const titleOp = fadeIn(frame, 8);
  const titleY = slideUp(frame, 8);
  const descOp = fadeIn(frame, 18);
  const imgOp = fadeIn(frame, 35, 20);
  const imgScale = scaleIn(frame, fps, 35);

  // Highlight animation - cycle through styles (starts earlier, longer range)
  const activeIdx = Math.floor(
    interpolate(frame, [40, 180], [0, 3.99], { extrapolateRight: "clamp", extrapolateLeft: "clamp" })
  );

  return (
    <AbsoluteFill
      style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 60, padding: "60px 80px 80px" }}
    >
      <div
        style={{
          opacity: labelOp,
          color: C.orange,
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: 3,
          marginBottom: 16,
        }}
      >
        AI ENHANCEMENT
      </div>
      <div
        style={{
          opacity: titleOp,
          transform: `translateY(${titleY}px)`,
          fontSize: 52,
          fontWeight: 700,
          color: C.white,
          fontFamily: interFont,
          marginBottom: 20,
        }}
      >
        Smart Output Styles
      </div>
      <div
        style={{
          opacity: descOp,
          fontSize: 22,
          color: C.gray,
          marginBottom: 50,
          fontFamily: interFont,
          textAlign: "center",
          maxWidth: 700,
        }}
      >
        Enhance any prompt before sending. Shape the AI's response with 4
        distinct modes.
      </div>
      {/* Style pills */}
      <div style={{ display: "flex", gap: 24, marginBottom: 50 }}>
        {styles.map((s, i) => {
          const pillScale = scaleIn(frame, fps, 25 + i * 6);
          const active = i === activeIdx;
          return (
            <div
              key={s.label}
              style={{
                transform: `scale(${pillScale})`,
                padding: "18px 40px",
                borderRadius: 50,
                background: active
                  ? `linear-gradient(135deg, ${s.color}, ${s.color}cc)`
                  : C.card,
                color: C.white,
                fontSize: 22,
                fontWeight: 600,
                fontFamily: interFont,
                boxShadow: active ? `0 12px 30px ${s.color}50` : "none",
                border: active ? "none" : `1px solid ${C.purple}30`,
                transition: "all 0.3s",
              }}
            >
              {s.label}
            </div>
          );
        })}
      </div>
      {/* Bubble.png bar with coded animated dropdown */}
      <div
        style={{
          opacity: imgOp,
          transform: `scale(${imgScale * 1.5})`,
          position: "absolute",
          bottom: 420,
          display: "inline-block",
        }}
      >
        {/* Top bar — Bubble.png */}
        <Img
          src={staticFile("Bubble.svg")}
          style={{
            width: 470,
            height: "auto",
            display: "block",
            filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.08))",
          }}
        />
        {/* Dropdown — absolute, anchored to bottom-left of the grey pill area */}
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 41,
            marginTop: -23,
            width: 168,
            border: "1px solid #3f3f3f",
            background: "white",
            borderRadius: 4,
            overflow: "hidden",
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.08))",
          }}
        >
          {["Structured", "Clarity", "Concise", "Strict"].map((item, i) => {
            const isActive = i === activeIdx;
            return (
              <div
                key={item}
                style={{
                  padding: "10px 16px",
                  fontFamily: interFont,
                  fontSize: 18,
                  fontWeight: 400,
                  lineHeight: "28px",
                  color: isActive ? C.white : "#424242",
                  background: isActive ? "#0066FF" : "transparent",
                  borderBottom: i < 3 ? "1px solid #e0e0e0" : "none",
                }}
              >
                {item}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ═══════════════════════════════════════════
   SCENE 8 — Works Everywhere (34s → 39s = 1020–1170)
   ═══════════════════════════════════════════ */
const ScenePlatforms: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const platforms = [
    {
      name: "ChatGPT",
      color: "#10a37f",
      img: "ChatGPTBubble.png",
    },
    {
      name: "Claude",
      color: "#f97316",
      img: "ClaudeBubble.png",
    },
    {
      name: "Gemini",
      color: "#4285f4",
      img: "GeminiBubble.png",
    },
  ];

  const labelOp = fadeIn(frame, 5);
  const titleOp = fadeIn(frame, 15);
  const titleY = slideUp(frame, 15);
  const subOp = fadeIn(frame, 30);

  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center", padding: 60 }}
    >
      <div
        style={{
          opacity: labelOp,
          color: C.cyan,
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: 3,
          marginBottom: 16,
        }}
      >
        CROSS-PLATFORM
      </div>
      <div
        style={{
          opacity: titleOp,
          transform: `translateY(${titleY}px)`,
          fontSize: 52,
          fontWeight: 700,
          color: C.white,
          fontFamily: interFont,
          marginBottom: 16,
        }}
      >
        Works with Every Major AI Platform
      </div>
      <div
        style={{
          opacity: subOp,
          fontSize: 22,
          color: C.gray,
          marginBottom: 60,
          fontFamily: interFont,
        }}
      >
        One extension. All your AI tools.
      </div>
      <div style={{ display: "flex", gap: 50 }}>
        {platforms.map((p, i) => {
          const s = scaleIn(frame, fps, 35 + i * 12);
          const op = fadeIn(frame, 35 + i * 12, 20);
          return (
            <div
              key={p.name}
              style={{
                opacity: op,
                transform: `scale(${s})`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
              }}
            >
              <Img
                src={staticFile(p.img)}
                style={{
                  width: 420,
                  height: "auto",
                  filter: `drop-shadow(0 10px 30px ${p.color}40)`,
                }}
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginTop: 10,
                }}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: p.color,
                    boxShadow: `0 0 10px ${p.color}`,
                  }}
                />
                <span
                  style={{
                    color: p.color,
                    fontSize: 24,
                    fontWeight: 700,
                    fontFamily: interFont,
                  }}
                >
                  {p.name}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};


/* ═══════════════════════════════════════════
   SCENE 10 — CTA (43s → 50s = 1290–1500)
   ═══════════════════════════════════════════ */
const SceneCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({
    frame: frame - 5,
    fps,
    config: { damping: 10, stiffness: 80 },
  });
  const titleOp = fadeIn(frame, 15);
  const titleY = slideUp(frame, 15);
  const chromeScale = scaleIn(frame, fps, 40);
  const chromeOp = fadeIn(frame, 40, 20);
  const urlOp = fadeIn(frame, 70);

  const pulse = interpolate(Math.sin(frame * 0.08), [-1, 1], [0.4, 1]);

  // Chrome icon click animation — two bounces
  const clickFrame = 80;
  const clickBounce = interpolate(
    frame,
    [clickFrame, clickFrame + 4, clickFrame + 10, clickFrame + 14, clickFrame + 20],
    [1, 0.82, 1.05, 0.95, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const clickGlow = interpolate(
    frame,
    [clickFrame, clickFrame + 6, clickFrame + 25],
    [0, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* Big glow */}
      <div
        style={{
          position: "absolute",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${C.purple}20 0%, transparent 70%)`,
          filter: "blur(80px)",
          opacity: pulse,
        }}
      />
      {/* Logo — at top */}
      <div style={{ transform: `scale(${logoScale})`, marginBottom: -100 }}>
        <Img
          src={staticFile("PromptPack.png")}
          style={{
            width: 1000,
            height: "auto",
            filter: "drop-shadow(0 0 60px rgba(99,102,241,0.5))",
          }}
        />
      </div>
      {/* "Get started at" + pmtpk.com */}
      <div
        style={{
          opacity: urlOp,
          display: "flex",
          alignItems: "baseline",
          gap: 12,
          fontFamily: interFont,
          marginBottom: 100,
        }}
      >
        <span
          style={{
            fontSize: 34,
            fontWeight: 700,
            color: C.white,
            letterSpacing: 1,
          }}
        >
          Get started at
        </span>
        <span
          style={{
            fontSize: 34,
            fontWeight: 700,
            letterSpacing: 3,
            background: `linear-gradient(135deg, ${C.purple}, ${C.cyan})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          pmtpk.com
        </span>
      </div>
      {/* Chrome SVG with click animation */}
      <div
        style={{
          opacity: chromeOp,
          transform: `scale(${chromeScale * clickBounce})`,
          filter: clickGlow > 0
            ? `drop-shadow(0 0 ${20 * clickGlow}px ${C.purple}) brightness(${1 + clickGlow * 0.2})`
            : "none",
          marginBottom: 30,
        }}
      >
        <Img
          src={staticFile("Chrome.svg")}
          style={{
            width: 800,
            height: "auto",
          }}
        />
      </div>
      {/* "Start Saving Time Today" */}
      <div
        style={{
          opacity: titleOp,
          transform: `translateY(${titleY}px)`,
          fontSize: 22,
          fontWeight: 700,
          fontFamily: interFont,
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: 4,
          textTransform: "uppercase",
        }}
      >
        Start Saving Time Today
      </div>
    </AbsoluteFill>
  );
};

/* ═══════════════════════════════════════════
   SCENE TRANSITIONS
   ═══════════════════════════════════════════ */
const SceneWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const opacity = interpolate(
    frame,
    [0, 15, durationInFrames - 15, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Slight zoom transition
  const scale = interpolate(
    frame,
    [0, 15, durationInFrames - 15, durationInFrames],
    [0.97, 1, 1, 1.02],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ opacity, transform: `scale(${scale})` }}>
      {children}
    </AbsoluteFill>
  );
};

/* ═══════════════════════════════════════════
   MAIN COMPOSITION — 54.5s = 1635 frames @ 30fps
   ═══════════════════════════════════════════ */
export const PromptPackVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const progress = (frame / durationInFrames) * 100;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.bg,
        fontFamily: interFont,
      }}
    >
      <Background />
      <GridOverlay />
      <Particles />

      {/* Scene 1: Logo — 0s–3s (0–90) */}
      <Sequence from={0} durationInFrames={90}>
        <SceneWrapper>
          <SceneLogo />
        </SceneWrapper>
      </Sequence>

      {/* Scene 2: Problem — 3s–8s (90–240) */}
      <Sequence from={90} durationInFrames={150}>
        <SceneWrapper>
          <SceneProblem />
        </SceneWrapper>
      </Sequence>

      {/* Scene 3: Solution — 8s–12s (240–360) */}
      <Sequence from={240} durationInFrames={120}>
        <SceneWrapper>
          <SceneSolution />
        </SceneWrapper>
      </Sequence>

      {/* Scene 4: Quick Select — 12s–17s (360–510) */}
      <Sequence from={360} durationInFrames={150}>
        <SceneWrapper>
          <SceneFeatureQuickSelect />
        </SceneWrapper>
      </Sequence>

      {/* Scene 5: Output Styles (Enhance) — 17s–24s (510–720) */}
      <Sequence from={510} durationInFrames={210}>
        <SceneWrapper>
          <SceneOutputStyles />
        </SceneWrapper>
      </Sequence>

      {/* Scene 6: Save Feature — 24s–30s (720–900) */}
      <Sequence from={720} durationInFrames={180}>
        <SceneWrapper>
          <SceneFeatureSave />
        </SceneWrapper>
      </Sequence>

      {/* Scene 6b: Save from Input — 30s–35s (900–1050) */}
      <Sequence from={900} durationInFrames={150}>
        <SceneWrapper>
          <SceneSaveFromInput />
        </SceneWrapper>
      </Sequence>

      {/* Scene 7: Organize (MVP) — 35s–42.5s (1050–1275) */}
      <Sequence from={1050} durationInFrames={225}>
        <SceneWrapper>
          <SceneFeatureOrganize />
        </SceneWrapper>
      </Sequence>

      {/* Scene 8: Platforms — 42.5s–47.5s (1275–1425) */}
      <Sequence from={1275} durationInFrames={150}>
        <SceneWrapper>
          <ScenePlatforms />
        </SceneWrapper>
      </Sequence>

      {/* Scene 9: CTA — 47.5s–54.5s (1425–1635) */}
      <Sequence from={1425} durationInFrames={210}>
        <SceneWrapper>
          <SceneCTA />
        </SceneWrapper>
      </Sequence>

      {/* Progress bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: 4,
          width: `${progress}%`,
          background: `linear-gradient(90deg, ${C.purple}, ${C.cyan})`,
          zIndex: 100,
        }}
      />
    </AbsoluteFill>
  );
};
