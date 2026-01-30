import React from "react";
import {
  AbsoluteFill,
  Sequence,
  staticFile,
  OffthreadVideo,
  Audio,
  useCurrentFrame,
  interpolate,
} from "remotion";

// Import scene components from PromptPackVideo
import {
  Background,
  GridOverlay,
  Particles,
  SceneLogo,
  SceneProblem,
  SceneSolution,
  SceneFeatureQuickSelect,
  SceneOutputStyles,
  SceneFeatureSave,
  SceneSaveFromInput,
  SceneFeatureOrganize,
  ScenePlatforms,
  SceneCTA,
} from "./PromptPackVideo";

const FPS = 30;

// Timings based on Whisper transcription (in seconds)
// [00:00.00 --> 00:07.84] Problem: "How many great prompts... disappears into chat history"
// [00:07.84 --> 00:09.72] Logo: "That's why we built PromptPack"
// [00:09.72 --> 00:13.56] Solution: "save, organize, and access your prompts everywhere"
// [00:13.56 --> 00:15.20] Spokesperson: "Let me show you how it works"
// [00:15.20 --> 00:19.36] QuickSelect: "right-click any prompt box to quickly select"
// [00:19.36 --> 00:23.60] Spokesperson: "enhance it before sending"
// [00:23.60 --> 00:30.48] OutputStyles: "structured, clarity, concise, strict"
// [00:30.48 --> 00:35.52] Spokesperson: "The main feature is simple. Saving takes one second"
// [00:35.52 --> 00:40.40] Save: "Click Save, prompt is captured instantly"
// [00:40.40 --> 00:47.32] SaveFromInput: "hit the PromptPack icon below the input box"
// [00:47.32 --> 00:51.56] Spokesperson: "everything stays organized automatically"
// [00:51.56 --> 00:55.72] Organize: "Prompts sort into ChatGPT, Claude, Gemini folders"
// [00:55.76 --> 00:59.88] Spokesperson: "create custom packs for workflows"
// [00:59.88 --> 01:04.76] Platforms: "works flawlessly with ChatGPT, Claude, Gemini"
// [01:04.76 --> 01:08.20] Spokesperson: "Stop losing your best prompts. Try PromptPack today"
// [01:08.20 --> 01:13.68] CTA: "Get started at pmtpk.com"

// Convert seconds to frames
const sec = (s: number) => Math.round(s * FPS);

// Scene durations in frames
// NEW ORDER: Spokesperson intro (0-2.08s) then Problem scene (2.08-7.84s)
const SCENE_TIMINGS = {
  // Spokesperson says "How many great prompts have you lost?" from 0-2.08s
  problem: { start: sec(2.08), duration: sec(7.84 - 2.08) }, // 0:02.08 - 0:07.84 (audio: "Billions are sent daily...")
  logo: { start: sec(7.84), duration: sec(2.46) },           // 0:07.84 - 0:10.30 (until "it lets YOU" - before "save")
  solution: { start: sec(10.3), duration: sec(4.9) },        // 0:10.30 - 0:15.20 ("save, organize, access...")
  // Spokesperson: 0:13.56 - 0:15.20
  quickSelect: { start: sec(15.2), duration: sec(19.36 - 15.2) }, // 0:15.20 - 0:19.36 (ends at "and with your prompt in the box")
  // Spokesperson: 0:19.36 - 0:23.60
  outputStyles: { start: sec(23.6), duration: sec(30.16 - 23.6) }, // 0:23.60 - 0:30.16 (ends before "The main feature is simple")
  // Spokesperson: 0:30.16 - 0:35.52
  save: { start: sec(35.52), duration: sec(4.88) },          // 0:35.52 - 0:40.40
  saveFromInput: { start: sec(40.4), duration: sec(6.92) },  // 0:40.40 - 0:47.32
  // Spokesperson: 0:47.32 - 0:51.56
  organize: { start: sec(51.56), duration: sec(59.88 - 51.56) }, // 0:51.56 - 0:59.88 (includes "for workflows you repeat")
  // No spokesperson gap here - goes directly to platforms
  platforms: { start: sec(59.88), duration: sec(4.88) },     // 0:59.88 - 1:04.76
  // Spokesperson: 1:04.76 - 1:08.20
  cta: { start: sec(68.2), duration: sec(5.48) },            // 1:08.20 - 1:13.68
};

const TOTAL_DURATION_SECONDS = 74;
const TOTAL_FRAMES = Math.ceil(TOTAL_DURATION_SECONDS * FPS);

// Gaps where spokesperson video should appear (between demo scenes)
const SPOKESPERSON_GAPS = [
  // Gap 0: Opening - "How many great prompts have you lost?" (0:00 - 0:02.08)
  { start: sec(0), duration: sec(2.08) },

  // Gap 1: After quickSelect (0:19.36), before outputStyles (0:23.60)
  // "and with your prompt in the box, you can enhance it before sending"
  { start: sec(19.36), duration: sec(23.6 - 19.36) },

  // Gap 2: After outputStyles (0:30.16), before save (0:35.52)
  // "The main feature is simple..."
  { start: sec(30.16), duration: sec(35.52 - 30.16) },

  // Gap 3: After saveFromInput (0:47.32), before organize (0:51.56)
  { start: sec(47.32), duration: sec(51.56 - 47.32) },

  // Gap 4: After platforms (0:59.88 + 4.88 = 1:04.76), before cta (1:08.20)
  { start: sec(64.76), duration: sec(68.2 - 64.76) },

  // Gap 5: After cta (1:08.20 + 5.48 = 1:13.68), until end
  { start: sec(73.68), duration: sec(TOTAL_DURATION_SECONDS - 73.68) },
];

// Transition duration in frames
const TRANSITION_FRAMES = 6;

// Scene wrapper with smooth zoom + fade transitions
const SceneWrapper: React.FC<{ children: React.ReactNode; duration: number }> = ({
  children,
  duration,
}) => {
  const frame = useCurrentFrame();

  // Fade in: 0 -> 1
  const fadeIn = interpolate(frame, [0, TRANSITION_FRAMES], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Fade out: 1 -> 0
  const fadeOut = interpolate(
    frame,
    [duration - TRANSITION_FRAMES, duration],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Scale in: start slightly zoomed out, scale up to 1
  const scaleIn = interpolate(frame, [0, TRANSITION_FRAMES], [0.97, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Scale out: scale up slightly as it fades out
  const scaleOut = interpolate(
    frame,
    [duration - TRANSITION_FRAMES, duration],
    [1, 1.03],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const opacity = Math.min(fadeIn, fadeOut);
  const scale = frame < duration - TRANSITION_FRAMES ? scaleIn : scaleOut;

  return (
    <AbsoluteFill
      style={{
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

// Spokesperson video segment (muted - audio is separate)
// Shows video at specific timestamp matching the gap position
const SpokespersonVideoSegment: React.FC<{ startFrom: number }> = ({ startFrom }) => {
  return (
    <OffthreadVideo
      src={staticFile("Promptpack.mp4")}
      muted
      startFrom={startFrom}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
      }}
    />
  );
};

// Continuous audio from spokesperson
const SpokespersonAudio: React.FC = () => {
  return <Audio src={staticFile("Promptpack.mp4")} volume={1} />;
};

// Background music with fade in/out and -10dB volume
const BackgroundMusic: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeInDuration = FPS * 2; // 2 second fade in
  const fadeOutDuration = FPS * 2; // 2 second fade out
  const fadeOutStart = TOTAL_FRAMES - fadeOutDuration;

  // -30dB = 10^(-30/20) ≈ 0.0316 linear volume
  const baseVolume = 0.0316;

  const fadeIn = interpolate(frame, [0, fadeInDuration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [fadeOutStart, TOTAL_FRAMES], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const volume = baseVolume * Math.min(fadeIn, fadeOut);

  return <Audio src={staticFile("background-music.mp3")} volume={volume} />;
};

// Background for demo scenes
const DemoBackground: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0f" }}>
      <Background />
      <GridOverlay />
      <Particles />
    </AbsoluteFill>
  );
};

// Subtitles based on exact Whisper transcription segments
const SUBTITLES = [
  { start: 0.0, end: 2.42, text: "How many great prompts have you lost?" },
  { start: 2.42, end: 5.16, text: "Billions are sent daily, and most of your best work" },
  { start: 5.16, end: 7.84, text: "just disappears into chat history." },
  { start: 7.84, end: 9.72, text: "That's why we built PromptPack." },
  { start: 9.72, end: 12.48, text: "It lets you save, organize, and access your prompts" },
  { start: 12.48, end: 13.56, text: "everywhere." },
  { start: 13.56, end: 15.2, text: "Let me show you how it works." },
  { start: 15.2, end: 17.08, text: "You can right-click any prompt box" },
  { start: 17.08, end: 19.36, text: "to quickly select from your prompt packs," },
  { start: 19.36, end: 21.16, text: "and with your prompt in the box," },
  { start: 21.16, end: 23.6, text: "you can enhance it before sending." },
  { start: 23.6, end: 27.16, text: "Four output styles: Structured, Clarity, Concise," },
  { start: 27.16, end: 30.48, text: "and Strict. Shape how the AI responds." },
  { start: 30.48, end: 32.2, text: "The main feature is simple." },
  { start: 32.2, end: 35.52, text: "Saving a prompt takes literally one second." },
  { start: 35.52, end: 38.32, text: "Click Save, and the prompt is captured instantly," },
  { start: 38.32, end: 40.4, text: "auto-organized by platform," },
  { start: 40.4, end: 43.92, text: "or hit the PromptPack icon below the input box" },
  { start: 43.92, end: 47.32, text: "if you like the prompt after receiving the output." },
  { start: 47.32, end: 51.56, text: "And the best part, everything stays organized automatically." },
  { start: 51.56, end: 55.72, text: "Prompts sort into ChatGPT, Claude, and Gemini folders." },
  { start: 55.76, end: 57.88, text: "And you can also create custom packs" },
  { start: 57.88, end: 59.88, text: "for workflows you repeat." },
  { start: 59.88, end: 63.28, text: "PromptPack works flawlessly with ChatGPT, Claude," },
  { start: 63.28, end: 64.76, text: "and Gemini." },
  { start: 64.76, end: 66.48, text: "Stop losing your best prompts." },
  { start: 66.48, end: 68.2, text: "Try PromptPack today." },
  { start: 68.2, end: 71.68, text: "Get started at pmtpk.com." },
  { start: 71.68, end: 73.68, text: "Add it to Chrome, it's free." },
];

// No fade - instant subtitles

// Subtitle component - no fade, instant appearance
const Subtitles: React.FC = () => {
  const frame = useCurrentFrame();
  const currentTime = frame / FPS;

  const currentSubtitle = SUBTITLES.find(
    (sub) => currentTime >= sub.start && currentTime < sub.end
  );

  if (!currentSubtitle) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 80,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          padding: "12px 24px",
          borderRadius: 8,
          maxWidth: "80%",
        }}
      >
        <span
          style={{
            color: "#fff",
            fontSize: 28,
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 500,
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          {currentSubtitle.text}
        </span>
      </div>
    </div>
  );
};

export const PromptPackMerged: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Spokesperson video segments - only in gaps between demo scenes */}
      {SPOKESPERSON_GAPS.map((gap, i) => (
        <Sequence key={`spokesperson-${i}`} from={gap.start} durationInFrames={gap.duration}>
          <SpokespersonVideoSegment startFrom={gap.start} />
        </Sequence>
      ))}

      {/* Demo scenes */}

      {/* Scene 1: Problem - "Stop losing your best prompts" (0:00 - 0:07.84) */}
      <Sequence from={SCENE_TIMINGS.problem.start} durationInFrames={SCENE_TIMINGS.problem.duration}>
        <SceneWrapper duration={SCENE_TIMINGS.problem.duration}>
          <DemoBackground />
          <SceneProblem />
        </SceneWrapper>
      </Sequence>

      {/* Scene 2: Logo - "That's why we built PromptPack" (0:07.84 - 0:09.72) */}
      <Sequence from={SCENE_TIMINGS.logo.start} durationInFrames={SCENE_TIMINGS.logo.duration}>
        <SceneWrapper duration={SCENE_TIMINGS.logo.duration}>
          <DemoBackground />
          <SceneLogo />
        </SceneWrapper>
      </Sequence>

      {/* Scene 3: Solution - "save, organize, access" (0:09.72 - 0:13.56) */}
      <Sequence from={SCENE_TIMINGS.solution.start} durationInFrames={SCENE_TIMINGS.solution.duration}>
        <SceneWrapper duration={SCENE_TIMINGS.solution.duration}>
          <DemoBackground />
          <SceneSolution />
        </SceneWrapper>
      </Sequence>

      {/* Scene 4: QuickSelect - "right-click any prompt box" (0:15.20 - 0:19.36) */}
      <Sequence from={SCENE_TIMINGS.quickSelect.start} durationInFrames={SCENE_TIMINGS.quickSelect.duration}>
        <SceneWrapper duration={SCENE_TIMINGS.quickSelect.duration}>
          <DemoBackground />
          <SceneFeatureQuickSelect />
        </SceneWrapper>
      </Sequence>

      {/* Scene 5: OutputStyles - "structured, clarity, concise, strict" (0:23.60 - 0:30.48) */}
      <Sequence from={SCENE_TIMINGS.outputStyles.start} durationInFrames={SCENE_TIMINGS.outputStyles.duration}>
        <SceneWrapper duration={SCENE_TIMINGS.outputStyles.duration}>
          <DemoBackground />
          <SceneOutputStyles />
        </SceneWrapper>
      </Sequence>

      {/* Scene 6: Save - "Click Save, captured instantly" (0:35.52 - 0:40.40) */}
      <Sequence from={SCENE_TIMINGS.save.start} durationInFrames={SCENE_TIMINGS.save.duration}>
        <SceneWrapper duration={SCENE_TIMINGS.save.duration}>
          <DemoBackground />
          <SceneFeatureSave />
        </SceneWrapper>
      </Sequence>

      {/* Scene 7: SaveFromInput - "hit the PromptPack icon" (0:40.40 - 0:47.32) */}
      <Sequence from={SCENE_TIMINGS.saveFromInput.start} durationInFrames={SCENE_TIMINGS.saveFromInput.duration}>
        <SceneWrapper duration={SCENE_TIMINGS.saveFromInput.duration}>
          <DemoBackground />
          <SceneSaveFromInput />
        </SceneWrapper>
      </Sequence>

      {/* Scene 8: Organize - "Prompts sort into folders" (0:51.56 - 0:55.72) */}
      <Sequence from={SCENE_TIMINGS.organize.start} durationInFrames={SCENE_TIMINGS.organize.duration}>
        <SceneWrapper duration={SCENE_TIMINGS.organize.duration}>
          <DemoBackground />
          <SceneFeatureOrganize />
        </SceneWrapper>
      </Sequence>

      {/* Scene 9: Platforms - "works with ChatGPT, Claude, Gemini" (0:59.88 - 1:04.76) */}
      <Sequence from={SCENE_TIMINGS.platforms.start} durationInFrames={SCENE_TIMINGS.platforms.duration}>
        <SceneWrapper duration={SCENE_TIMINGS.platforms.duration}>
          <DemoBackground />
          <ScenePlatforms />
        </SceneWrapper>
      </Sequence>

      {/* Scene 10: CTA - "Get started at pmtpk.com" (1:08.20 - 1:13.68) */}
      <Sequence from={SCENE_TIMINGS.cta.start} durationInFrames={SCENE_TIMINGS.cta.duration}>
        <SceneWrapper duration={SCENE_TIMINGS.cta.duration}>
          <DemoBackground />
          <SceneCTA />
        </SceneWrapper>
      </Sequence>

      {/* Continuous audio layer */}
      <SpokespersonAudio />

      {/* Background music layer */}
      <BackgroundMusic />

      {/* Subtitles layer */}
      <Subtitles />
    </AbsoluteFill>
  );
};

export const MERGED_DURATION_FRAMES = TOTAL_FRAMES;
export const MERGED_FPS = FPS;
