"use client";

import { useState, useRef, useEffect } from "react";
import { assetUrl } from "@/lib/constants";

const VIDEOS = [
  { src: "/img/PromptPack_Ad.mp4", label: "Ad" },
  { src: "/img/PromptPackMerged.mp4", label: "Demo" },
];

export function HeroVideo() {
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && activeIndex < VIDEOS.length - 1) {
      switchVideo(activeIndex + 1);
    }
    if (isRightSwipe && activeIndex > 0) {
      switchVideo(activeIndex - 1);
    }
  };

  const switchVideo = (newIndex: number) => {
    // Pause current video
    const currentVideo = videoRefs.current[activeIndex];
    if (currentVideo) {
      currentVideo.pause();
    }

    setActiveIndex(newIndex);

    // Play new video
    const newVideo = videoRefs.current[newIndex];
    if (newVideo) {
      newVideo.currentTime = 0;
      newVideo.muted = isMuted;
      if (isPlaying) {
        newVideo.play();
      }
    }
  };

  const togglePlay = () => {
    const video = videoRefs.current[activeIndex];
    if (video) {
      if (isPlaying) {
        video.pause();
      } else {
        video.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    const video = videoRefs.current[activeIndex];
    if (video) {
      video.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Sync mute state across videos when switching
  useEffect(() => {
    videoRefs.current.forEach((video) => {
      if (video) {
        video.muted = isMuted;
      }
    });
  }, [isMuted]);

  return (
    <div className="hero-video">
      <div className="demo-card demo-card-wide">
        <div
          className="demo-media demo-media-hero"
          ref={containerRef}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{ position: "relative", overflow: "hidden" }}
        >
          <div
            style={{
              display: "flex",
              transition: "transform 0.3s ease-out",
              transform: `translateX(-${activeIndex * 100}%)`,
              width: `${VIDEOS.length * 100}%`,
            }}
          >
            {VIDEOS.map((video, index) => (
              <video
                key={video.src}
                ref={(el) => { videoRefs.current[index] = el; }}
                src={assetUrl(video.src)}
                autoPlay={index === 0}
                muted
                loop
                playsInline
                className="hero-video-player"
                style={{
                  width: `${100 / VIDEOS.length}%`,
                  flexShrink: 0,
                }}
              />
            ))}
          </div>

          {/* Video indicator dots */}
          <div className="hero-video-dots">
            {VIDEOS.map((video, index) => (
              <button
                key={index}
                className={`hero-video-dot ${index === activeIndex ? "active" : ""}`}
                onClick={() => switchVideo(index)}
                aria-label={`Switch to ${video.label} video`}
              />
            ))}
          </div>

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
