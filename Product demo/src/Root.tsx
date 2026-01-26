import React from "react";
import { Composition } from "remotion";
import { PromptPackVideo } from "./PromptPackVideo";
import {
  ClipQuickSelect,
  ClipOutputStyles,
  ClipSave,
  ClipSaveFromInput,
  ClipOrganize,
  ClipPlatforms,
} from "./SlideshowClips";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="PromptPackVideo"
        component={PromptPackVideo}
        durationInFrames={1635}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ClipQuickSelect"
        component={ClipQuickSelect}
        durationInFrames={150}
        fps={30}
        width={800}
        height={600}
      />
      <Composition
        id="ClipOutputStyles"
        component={ClipOutputStyles}
        durationInFrames={180}
        fps={30}
        width={800}
        height={600}
      />
      <Composition
        id="ClipSave"
        component={ClipSave}
        durationInFrames={150}
        fps={30}
        width={800}
        height={600}
      />
      <Composition
        id="ClipSaveFromInput"
        component={ClipSaveFromInput}
        durationInFrames={120}
        fps={30}
        width={800}
        height={600}
      />
      <Composition
        id="ClipOrganize"
        component={ClipOrganize}
        durationInFrames={120}
        fps={30}
        width={800}
        height={600}
      />
      <Composition
        id="ClipPlatforms"
        component={ClipPlatforms}
        durationInFrames={120}
        fps={30}
        width={800}
        height={600}
      />
    </>
  );
};
