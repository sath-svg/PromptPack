"use client";

import { useState, useRef } from "react";
import { assetUrl } from "@/lib/constants";

export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="hero-video">
      <div className="demo-card demo-card-wide">
        <div className="demo-media demo-media-hero">
          <video
            ref={videoRef}
            src={assetUrl("/img/PromptPack_Ad.mp4")}
            autoPlay
            muted
            loop
            playsInline
            className="hero-video-player"
          />
          <div className="hero-video-controls">
            <button
              className="hero-video-btn"
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? "⏸" : "▶"}
            </button>
            <button
              className="hero-video-btn"
              onClick={toggleMute}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? "🔇" : "🔊"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
