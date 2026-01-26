import React from "react";
import {
  AbsoluteFill,
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
  card: "#1e1e30",
  purple: "#9b7bff",
  purpleDark: "#7c3aed",
  blue: "#3b82f6",
  cyan: "#00d4ff",
  white: "#ffffff",
  gray: "#9ca3af",
  green: "#22c55e",
  orange: "#f97316",
};

/* ─── helpers ─── */
const fadeIn = (frame: number, start: number, dur = 20) =>
  interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

const scaleIn = (frame: number, fps: number, delay: number) =>
  spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

/* ═══════════════════════════════════════════
   CLIP 1 — Quick Select (visual only)
   800×600, 150 frames (5s)
   ═══════════════════════════════════════════ */
export const ClipQuickSelect: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const imgScale = scaleIn(frame, fps, 10);
  const imgOp = fadeIn(frame, 10, 20);

  // Click at frame 55 (adjusted for shorter clip)
  const clickFrame = 55;
  const clickBounce = interpolate(
    frame,
    [clickFrame, clickFrame + 5, clickFrame + 10],
    [1, 0.95, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const qsOpacity = interpolate(
    frame,
    [clickFrame + 5, clickFrame + 15],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const showEnhanced = frame > clickFrame + 10;
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
      style={{
        backgroundColor: C.bg,
        fontFamily: interFont,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          opacity: imgOp,
          transform: `scale(${imgScale * 0.75})`,
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
        {/* QuickSelect on top */}
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
    </AbsoluteFill>
  );
};

/* ═══════════════════════════════════════════
   CLIP 2 — Output Styles (visual only)
   800×600, 180 frames (6s)
   ═══════════════════════════════════════════ */
export const ClipOutputStyles: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const imgOp = fadeIn(frame, 5, 20);
  const imgScale = scaleIn(frame, fps, 5);

  const styles = [
    { label: "Structured", color: C.blue },
    { label: "Clarity", color: C.green },
    { label: "Concise", color: C.purple },
    { label: "Strict", color: C.orange },
  ];

  // Cycle through styles
  const activeIdx = Math.floor(
    interpolate(frame, [30, 160], [0, 3.99], {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
    })
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.bg,
        fontFamily: interFont,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      {/* Style pills */}
      <div style={{ display: "flex", gap: 16, marginBottom: 40 }}>
        {styles.map((s, i) => {
          const pillScale = scaleIn(frame, fps, 5 + i * 5);
          const active = i === activeIdx;
          return (
            <div
              key={s.label}
              style={{
                transform: `scale(${pillScale * 0.85})`,
                padding: "14px 30px",
                borderRadius: 50,
                background: active
                  ? `linear-gradient(135deg, ${s.color}, ${s.color}cc)`
                  : C.card,
                color: C.white,
                fontSize: 18,
                fontWeight: 600,
                fontFamily: interFont,
                boxShadow: active ? `0 12px 30px ${s.color}50` : "none",
                border: active ? "none" : `1px solid ${C.purple}30`,
              }}
            >
              {s.label}
            </div>
          );
        })}
      </div>
      {/* Bubble with dropdown */}
      <div
        style={{
          opacity: imgOp,
          transform: `scale(${imgScale * 1.1})`,
          position: "relative",
          display: "inline-block",
        }}
      >
        <Img
          src={staticFile("Bubble.svg")}
          style={{
            width: 470,
            height: "auto",
            display: "block",
            filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.08))",
          }}
        />
        {/* Dropdown */}
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
   CLIP 3 — Save Prompts (visual only)
   800×600, 150 frames (5s)
   ═══════════════════════════════════════════ */
export const ClipSave: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const imgScale = scaleIn(frame, fps, 10);
  const imgOp = fadeIn(frame, 10, 20);

  // Click at frame 60
  const clickScale = interpolate(frame, [60, 70, 80], [1, 0.9, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.bg,
        fontFamily: interFont,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          opacity: imgOp,
          transform: `scale(${imgScale * 0.7})`,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Img
          src={staticFile("PromptBoxEnhanced.svg")}
          style={{
            width: 800,
            height: "auto",
            filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.08))",
          }}
        />
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
          {/* Save button flash */}
          {frame > 60 && frame < 90 && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `radial-gradient(circle at 80% 50%, ${C.purple}30 0%, transparent 60%)`,
                borderRadius: 30,
                opacity: interpolate(frame, [60, 75, 90], [0, 1, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            />
          )}
        </div>
        {/* "Saved!" toast */}
        {frame > 75 && (
          <div
            style={{
              position: "absolute",
              bottom: -50,
              left: "50%",
              transform: "translateX(-50%)",
              opacity: interpolate(frame, [75, 85, 120, 135], [0, 1, 1, 0], {
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
    </AbsoluteFill>
  );
};

/* ═══════════════════════════════════════════
   CLIP 4 — Save from Input (visual only)
   800×600, 120 frames (4s)
   ═══════════════════════════════════════════ */
export const ClipSaveFromInput: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bubbleOp = fadeIn(frame, 5, 20);
  const bubbleScale = scaleIn(frame, fps, 5);

  // Click at frame 50
  const clickFrame = 50;
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
      style={{
        backgroundColor: C.bg,
        fontFamily: interFont,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          opacity: bubbleOp,
          transform: `scale(${bubbleScale * 0.85})`,
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
        {/* Icons row */}
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
          <div
            style={{
              transform: `scale(${iconClickScale})`,
              position: "relative",
            }}
          >
            <Img
              src={staticFile("PromptPackIcon.png")}
              style={{
                width: 40,
                height: 40,
                borderRadius: 4,
                filter:
                  iconGlow > 0
                    ? `drop-shadow(0 0 ${8 * iconGlow}px ${C.purple}) brightness(${1 + iconGlow * 0.3})`
                    : "none",
              }}
            />
          </div>
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
    </AbsoluteFill>
  );
};

/* ═══════════════════════════════════════════
   CLIP 5 — Organize (visual only)
   800×600, 120 frames (4s)
   ═══════════════════════════════════════════ */
export const ClipOrganize: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const imgScale = scaleIn(frame, fps, 5);
  const imgOp = fadeIn(frame, 5, 20);

  const floatY = Math.sin(frame * 0.06) * 8;
  const tilt = Math.sin(frame * 0.04) * 1.5;
  const glowIntensity = interpolate(
    Math.sin(frame * 0.08),
    [-1, 1],
    [40, 80]
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.bg,
        fontFamily: interFont,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          opacity: imgOp,
          transform: `scale(${imgScale * 0.85}) translateY(${floatY}px) rotate(${tilt}deg)`,
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
    </AbsoluteFill>
  );
};

/* ═══════════════════════════════════════════
   CLIP 6 — Platforms (visual only)
   800×600, 120 frames (4s)
   ═══════════════════════════════════════════ */
export const ClipPlatforms: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const platforms = [
    { name: "ChatGPT", color: "#10a37f", img: "ChatGPTBubble.png" },
    { name: "Claude", color: "#f97316", img: "ClaudeBubble.png" },
    { name: "Gemini", color: "#4285f4", img: "GeminiBubble.png" },
  ];

  // Gentle breathing after entrance
  const breathe = 1 + Math.sin(frame * 0.05) * 0.015;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.bg,
        fontFamily: interFont,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", gap: 30 }}>
        {platforms.map((p, i) => {
          const s = scaleIn(frame, fps, 10 + i * 10);
          const op = fadeIn(frame, 10 + i * 10, 15);
          return (
            <div
              key={p.name}
              style={{
                opacity: op,
                transform: `scale(${s * breathe * 0.55})`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
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
                  marginTop: 8,
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
