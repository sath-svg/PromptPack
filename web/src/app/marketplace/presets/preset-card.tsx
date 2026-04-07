"use client";

import {
  Scissors, Tv, Users, Atom, Sword, Heart, Castle, Rabbit,
  CloudSun, Flame, Shield, Sparkles, Cog, Coffee,
  Zap, Gamepad2, Sunset, Box, Triangle, Monitor,
  Brush, Palette, Leaf, Eye, Crown, Paintbrush,
  Megaphone, Flower2, Diamond, BookOpen, PenTool, Microscope,
  Film, Clapperboard, Camera, Layers,
  Skull, Ghost, Octagon, Settings,
} from "lucide-react";
import type { PromptPreset } from "./preset-data";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Scissors, Tv, Users, Atom, Sword, Heart, Castle, Rabbit,
  CloudSun, Flame, Shield, Sparkles, Cog, Coffee,
  Zap, Gamepad2, Sunset, Box, Triangle, Monitor,
  Brush, Palette, Leaf, Eye, Crown, Paintbrush,
  Megaphone, Flower2, Diamond, BookOpen, PenTool, Microscope,
  Film, Clapperboard, Camera, Layers,
  Skull, Ghost, Octagon, Settings,
};

const ASPECT_RATIOS = ["4/5", "3/4", "1/1", "4/5", "3/4"];

interface PresetCardProps {
  preset: PromptPreset;
  index: number;
  state: "default" | "expanded" | "highlighted" | "faded";
  onClick: () => void;
}

function darkenColor(hex: string, amount: number): string {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - amount);
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - amount);
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - amount);
  return `rgb(${r}, ${g}, ${b})`;
}

export function PresetCard({ preset, index, state, onClick }: PresetCardProps) {
  const IconComponent = ICON_MAP[preset.icon];
  const aspect = ASPECT_RATIOS[index % ASPECT_RATIOS.length];
  const dark = darkenColor(preset.colorAccent, 80);

  const stateClass =
    state === "expanded"
      ? "preset-card--expanded"
      : state === "highlighted"
        ? "preset-card--highlighted"
        : state === "faded"
          ? "preset-card--faded"
          : "";

  return (
    <div
      className={`preset-card ${stateClass}`}
      style={{ aspectRatio: aspect }}
      onClick={onClick}
    >
      {preset.images.length > 0 ? (
        <img
          src={preset.images[0]}
          alt={preset.name}
          className="preset-card__img"
        />
      ) : (
        <>
          <div
            className="preset-card__bg"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${preset.colorAccent}, ${dark})`,
            }}
          />
          {IconComponent && (
            <div className="preset-card__icon">
              <IconComponent size={48} />
            </div>
          )}
        </>
      )}
      <div className="preset-card__label">
        <span className="preset-card__name">{preset.name}</span>
        <span className="preset-card__category">{preset.category}</span>
      </div>
    </div>
  );
}
