import React from "react";
import { Composition } from "remotion";
import { PromptPackVideo } from "./PromptPackVideo";

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
    </>
  );
};
