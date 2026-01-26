"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
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
    images: [
      { src: "/img/QuickSelect.png", alt: "Quick Select menu", width: 500 },
      { src: "/img/PromptBox.png", alt: "Prompt box", width: 640 },
    ],
    layout: "overlap" as const,
  },
  {
    id: "output-styles",
    label: "AI ENHANCEMENT",
    labelColor: "#f97316",
    title: "Smart Output Styles",
    titleGradient: "linear-gradient(135deg, #f97316, #9b7bff)",
    description:
      "Enhance any prompt before sending. Shape the AI's response with 4 distinct modes.",
    images: [{ src: "/img/Bubble.svg", alt: "Output styles bubble", width: 470 }],
    layout: "center" as const,
    pills: ["Structured", "Clarity", "Concise", "Strict"],
    pillColors: ["#3b82f6", "#22c55e", "#9b7bff", "#f97316"],
  },
  {
    id: "save",
    label: "ONE-CLICK SAVE",
    labelColor: "#9b7bff",
    title: "Save Prompts Instantly",
    titleGradient: "linear-gradient(135deg, #9b7bff, #00d4ff)",
    description:
      "Capture any prompt with one click directly from ChatGPT, Claude, or Gemini. Auto-organized into folders by platform.",
    images: [
      { src: "/img/PromptBoxEnhanced.svg", alt: "Enhanced prompt box", width: 700 },
      { src: "/img/ConciseBubble.svg", alt: "Concise bubble", width: 440 },
    ],
    layout: "stack" as const,
  },
  {
    id: "save-input",
    label: "SAVE FROM INPUT",
    labelColor: "#9b7bff",
    title: "Save Directly From Chat",
    titleGradient: "linear-gradient(135deg, #9b7bff, #00d4ff)",
    description:
      "Click the PromptPack icon below any input box to save the prompt instantly. No menus, no extra steps.",
    images: [{ src: "/img/PromptPackIcon.png", alt: "PromptPack icon", width: 40 }],
    layout: "input-bubble" as const,
  },
  {
    id: "organize",
    label: "SMART FOLDERS",
    labelColor: "#00d4ff",
    title: "Organize by AI Platform",
    titleGradient: "linear-gradient(135deg, #00d4ff, #3b82f6)",
    description:
      "Prompts automatically sort into ChatGPT, Claude, and Gemini folders. Create custom packs for repeatable workflows.",
    images: [{ src: "/img/PromptPack.svg", alt: "PromptPack extension", width: 520 }],
    layout: "center" as const,
  },
  {
    id: "platforms",
    label: "CROSS-PLATFORM",
    labelColor: "#00d4ff",
    title: "Works with Every Major AI Platform",
    titleGradient: "linear-gradient(135deg, #00d4ff, #3b82f6)",
    description: "One extension. All your AI tools.",
    images: [
      { src: "/img/ChatGPTBubble.png", alt: "ChatGPT", width: 340 },
      { src: "/img/ClaudeBubble.png", alt: "Claude", width: 340 },
      { src: "/img/GeminiBubble.png", alt: "Gemini", width: 340 },
    ],
    layout: "row" as const,
    platformNames: [
      { name: "ChatGPT", color: "#10a37f" },
      { name: "Claude", color: "#f97316" },
      { name: "Gemini", color: "#4285f4" },
    ],
  },
];

export function FeatureSlideshow() {
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

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
            {/* Pills for Output Styles */}
            {slide.pills && (
              <div className="slideshow-pills">
                {slide.pills.map((pill, i) => (
                  <span
                    key={pill}
                    className="slideshow-pill"
                    style={{
                      background: `${slide.pillColors![i]}18`,
                      border: `1px solid ${slide.pillColors![i]}50`,
                      color: slide.pillColors![i],
                    }}
                  >
                    {pill}
                  </span>
                ))}
              </div>
            )}

            {/* Input bubble for Save from Input */}
            {slide.layout === "input-bubble" && (
              <div className="slideshow-input-bubble">
                <div className="slideshow-chat-bubble">
                  Explain the ISO ecosystem by comparing these entities:
                  Standard-setting body vs. Certification bodies vs. Training
                  providers vs. Consultants.
                </div>
                <div className="slideshow-icon-row">
                  <Image
                    src={assetUrl(slide.images[0].src)}
                    alt={slide.images[0].alt}
                    width={36}
                    height={36}
                    className="slideshow-pp-icon"
                  />
                  <svg
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#9ca3af"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                </div>
              </div>
            )}

            {/* Overlap layout (Quick Select) */}
            {slide.layout === "overlap" && (
              <div className="slideshow-overlap">
                <Image
                  src={assetUrl(slide.images[1].src)}
                  alt={slide.images[1].alt}
                  width={slide.images[1].width}
                  height={0}
                  className="slideshow-img-back"
                  style={{ height: "auto" }}
                />
                <Image
                  src={assetUrl(slide.images[0].src)}
                  alt={slide.images[0].alt}
                  width={slide.images[0].width}
                  height={0}
                  className="slideshow-img-front"
                  style={{ height: "auto" }}
                />
              </div>
            )}

            {/* Stack layout (Save) */}
            {slide.layout === "stack" && (
              <div className="slideshow-stack">
                {slide.images.map((img) => (
                  <Image
                    key={img.src}
                    src={assetUrl(img.src)}
                    alt={img.alt}
                    width={img.width}
                    height={0}
                    style={{ height: "auto", maxWidth: "100%" }}
                  />
                ))}
              </div>
            )}

            {/* Center layout (Output Styles, Organize) */}
            {slide.layout === "center" && (
              <div className="slideshow-center">
                <Image
                  src={assetUrl(slide.images[0].src)}
                  alt={slide.images[0].alt}
                  width={slide.images[0].width}
                  height={0}
                  style={{ height: "auto", maxWidth: "100%" }}
                />
              </div>
            )}

            {/* Row layout (Platforms) */}
            {slide.layout === "row" && (
              <div className="slideshow-platforms">
                {slide.images.map((img, i) => (
                  <div key={img.src} className="slideshow-platform-card">
                    <Image
                      src={assetUrl(img.src)}
                      alt={img.alt}
                      width={img.width}
                      height={0}
                      style={{
                        height: "auto",
                        maxWidth: "100%",
                        filter: `drop-shadow(0 8px 20px ${slide.platformNames![i].color}40)`,
                      }}
                    />
                    <div className="slideshow-platform-label">
                      <span
                        className="slideshow-platform-dot"
                        style={{ background: slide.platformNames![i].color }}
                      />
                      <span style={{ color: slide.platformNames![i].color }}>
                        {slide.platformNames![i].name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
