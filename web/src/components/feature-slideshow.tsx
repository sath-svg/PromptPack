"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { assetUrl } from "@/lib/constants";

const slides = [
  {
    id: "quick-select",
    label: "INSTANT ACCESS",
    labelColor: "#22c55e",
    title: "Quick Select Menu",
    titleGradient: "linear-gradient(135deg, #22c55e, #00d4ff)",
    description:
      "Right-click any prompt box to instantly insert a saved prompt. Your entire library, one click away.",
    video: "/img/clip-quick-select.mp4",
  },
  {
    id: "output-styles",
    label: "AI ENHANCEMENT",
    labelColor: "#f97316",
    title: "Smart Output Styles",
    titleGradient: "linear-gradient(135deg, #f97316, #9b7bff)",
    description:
      "Enhance any prompt before sending. Shape the AI's response with 4 distinct modes.",
    video: "/img/clip-output-styles.mp4",
  },
  {
    id: "save",
    label: "ONE-CLICK SAVE",
    labelColor: "#9b7bff",
    title: "Save Prompts Instantly",
    titleGradient: "linear-gradient(135deg, #9b7bff, #00d4ff)",
    description:
      "Capture any prompt with one click directly from ChatGPT, Claude, or Gemini. Auto-organized into folders by platform.",
    video: "/img/clip-save.mp4",
  },
  {
    id: "save-input",
    label: "SAVE FROM INPUT",
    labelColor: "#9b7bff",
    title: "Save Directly From Chat",
    titleGradient: "linear-gradient(135deg, #9b7bff, #00d4ff)",
    description:
      "Click the PromptPack icon below any input box to save the prompt instantly. No menus, no extra steps.",
    video: "/img/clip-save-from-input.mp4",
  },
  {
    id: "organize",
    label: "SMART FOLDERS",
    labelColor: "#00d4ff",
    title: "Organize by AI Platform",
    titleGradient: "linear-gradient(135deg, #00d4ff, #3b82f6)",
    description:
      "Prompts automatically sort into ChatGPT, Claude, and Gemini folders. Create custom packs for repeatable workflows.",
    video: "/img/clip-organize.mp4",
  },
  {
    id: "platforms",
    label: "CROSS-PLATFORM",
    labelColor: "#00d4ff",
    title: "Works with Every Major AI Platform",
    titleGradient: "linear-gradient(135deg, #00d4ff, #3b82f6)",
    description: "One extension. All your AI tools.",
    video: "/img/clip-platforms.mp4",
  },
];

export function FeatureSlideshow() {
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, next]);

  // Reset video on slide change
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [current]);

  const handleDotClick = (index: number) => {
    setCurrent(index);
    setIsAutoPlaying(false);
  };

  const handleNav = (dir: "prev" | "next") => {
    dir === "prev" ? prev() : next();
    setIsAutoPlaying(false);
  };

  const slide = slides[current];

  return (
    <section className="slideshow-section">
      <h2 className="slideshow-heading">Feature Highlights</h2>

      <div className="slideshow-container">
        {/* Nav arrows */}
        <button
          className="slideshow-arrow slideshow-arrow-left"
          onClick={() => handleNav("prev")}
          aria-label="Previous slide"
        >
          &#8249;
        </button>
        <button
          className="slideshow-arrow slideshow-arrow-right"
          onClick={() => handleNav("next")}
          aria-label="Next slide"
        >
          &#8250;
        </button>

        {/* Slide content */}
        <div className="slideshow-slide" key={slide.id}>
          <div className="slideshow-text">
            <span
              className="slideshow-label"
              style={{ color: slide.labelColor }}
            >
              {slide.label}
            </span>
            <h3
              className="slideshow-title"
              style={{
                background: slide.titleGradient,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {slide.title}
            </h3>
            <p className="slideshow-desc">{slide.description}</p>
          </div>

          <div className="slideshow-visual">
            <video
              ref={videoRef}
              key={slide.id}
              src={assetUrl(slide.video)}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              className="slideshow-video"
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Dots */}
        <div className="slideshow-dots">
          {slides.map((s, i) => (
            <button
              key={s.id}
              className={`slideshow-dot ${i === current ? "slideshow-dot-active" : ""}`}
              onClick={() => handleDotClick(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
