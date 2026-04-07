"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import { PRESETS, getPresetById, getRelatedPresets } from "./preset-data";
import { PresetCard } from "./preset-card";
import { PresetDetailModal } from "./preset-detail-modal";
import type { PromptPreset } from "./preset-data";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.pmtpk.com";

/** Distribute items round-robin into N columns */
function distributeIntoColumns<T>(items: T[], numCols: number): T[][] {
  const cols: T[][] = Array.from({ length: numCols }, () => []);
  items.forEach((item, i) => {
    cols[i % numCols].push(item);
  });
  return cols;
}

/** Hook to track column count based on container width */
function useColumnCount() {
  const [cols, setCols] = useState(5);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w <= 480) setCols(1);
      else if (w <= 768) setCols(2);
      else if (w <= 1024) setCols(3);
      else if (w <= 1200) setCols(4);
      else setCols(5);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return cols;
}

/**
 * Same Energy–style exploration board.
 *
 * - Initial view: all 40 presets in masonry grid.
 * - Click a card → grid rearranges: seed first, similar next, rest faded.
 *   Items distribute across columns round-robin for even spread.
 * - Click the seed card → opens detail modal.
 * - Click any other card → that becomes the new seed.
 * - Back button / Escape → returns to previous view.
 */
export function PresetBoard() {
  const [history, setHistory] = useState<
    Array<{ seedId: string; resultIds: string[] }>
  >([]);
  const [currentView, setCurrentView] = useState<{
    seedId: string | null;
    resultIds: string[];
  }>({ seedId: null, resultIds: [] });
  const [loading, setLoading] = useState(false);
  const [detailPreset, setDetailPreset] = useState<PromptPreset | null>(null);
  const [fadeState, setFadeState] = useState<"visible" | "fading-out" | "fading-in">("visible");
  const numCols = useColumnCount();
  const gridRef = useRef<HTMLDivElement>(null);

  // Build ordered list: seed → similar → faded rest
  const { orderedPresets, similarSet } = useMemo(() => {
    if (currentView.seedId === null) {
      return { orderedPresets: PRESETS, similarSet: new Set<string>() };
    }

    const seed = getPresetById(currentView.seedId);
    if (!seed) return { orderedPresets: PRESETS, similarSet: new Set<string>() };

    const simSet = new Set(currentView.resultIds);
    const similar: PromptPreset[] = [];
    const rest: PromptPreset[] = [];

    for (const p of PRESETS) {
      if (p.id === currentView.seedId) continue;
      if (simSet.has(p.id)) similar.push(p);
      else rest.push(p);
    }

    return {
      orderedPresets: [seed, ...similar, ...rest],
      similarSet: simSet,
    };
  }, [currentView.seedId, currentView.resultIds]);

  // Distribute into columns round-robin
  const columns = useMemo(
    () => distributeIntoColumns(orderedPresets, numCols),
    [orderedPresets, numCols]
  );

  const fetchSimilarStyles = useCallback(
    async (presetId: string): Promise<string[]> => {
      const preset = getPresetById(presetId);
      if (!preset) return [];

      try {
        const res = await fetch(`${API_BASE}/api/similar-styles`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            presetId: preset.id,
            presetName: preset.name,
            presetCategory: preset.category,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.similar?.length > 0) return data.similar;
        }
      } catch {
        // fallback below
      }

      const related = getRelatedPresets(presetId, 12);
      return related.map((r) => r.id);
    },
    []
  );

  const navigateToSeed = useCallback(
    async (presetId: string) => {
      // Fade out
      setFadeState("fading-out");
      setLoading(true);

      // Fetch while fading out (run in parallel)
      const [resultIds] = await Promise.all([
        fetchSimilarStyles(presetId),
        new Promise((r) => setTimeout(r, 250)), // min fade-out duration
      ]);

      // Swap content
      setHistory((prev) => [...prev, { ...currentView }]);
      setCurrentView({ seedId: presetId, resultIds });
      setLoading(false);

      // Scroll to top then fade in
      window.scrollTo({ top: 0, behavior: "instant" });
      // Let React render the new layout before fading in
      requestAnimationFrame(() => {
        setFadeState("fading-in");
        setTimeout(() => setFadeState("visible"), 350);
      });
    },
    [currentView, fetchSimilarStyles]
  );

  const goBack = useCallback(() => {
    setFadeState("fading-out");

    setTimeout(() => {
      if (history.length === 0) {
        setCurrentView({ seedId: null, resultIds: [] });
      } else {
        const prev = history[history.length - 1];
        setHistory((h) => h.slice(0, -1));
        setCurrentView(prev);
      }

      window.scrollTo({ top: 0, behavior: "instant" });
      requestAnimationFrame(() => {
        setFadeState("fading-in");
        setTimeout(() => setFadeState("visible"), 350);
      });
    }, 250);
  }, [history]);

  const handleCardClick = useCallback(
    (presetId: string) => {
      if (currentView.seedId === presetId) {
        const preset = getPresetById(presetId);
        if (preset) setDetailPreset(preset);
      } else {
        navigateToSeed(presetId);
      }
    },
    [currentView.seedId, navigateToSeed]
  );

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (detailPreset) {
          setDetailPreset(null);
        } else if (currentView.seedId) {
          goBack();
        }
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [detailPreset, currentView.seedId, goBack]);

  const getCardState = (
    id: string
  ): "default" | "expanded" | "highlighted" | "faded" => {
    if (currentView.seedId === null) return "default";
    if (id === currentView.seedId) return "expanded";
    if (similarSet.has(id)) return "highlighted";
    return "faded";
  };

  // Track the global index for each preset for aspect-ratio staggering
  const presetGlobalIndex = useMemo(() => {
    const map = new Map<string, number>();
    orderedPresets.forEach((p, i) => map.set(p.id, i));
    return map;
  }, [orderedPresets]);

  // Related presets for the detail modal
  const detailRelated = detailPreset
    ? currentView.resultIds
        .map(getPresetById)
        .filter((p): p is PromptPreset => p !== undefined)
        .slice(0, 3)
    : [];
  const finalDetailRelated =
    detailRelated.length > 0
      ? detailRelated
      : detailPreset
        ? getRelatedPresets(detailPreset.id, 3)
        : [];

  return (
    <>
      {/* Back button + seed info bar */}
      {currentView.seedId && (
        <div className="preset-seed-bar">
          <button onClick={goBack} className="preset-back-btn">
            <ArrowLeft size={16} />
            Back
          </button>
          <span className="preset-seed-label">
            Showing styles similar to{" "}
            <strong>{getPresetById(currentView.seedId)?.name}</strong>
          </span>
          {loading && <Loader2 size={14} className="animate-spin" />}
        </div>
      )}

      {/* Flexbox columns masonry — items distributed round-robin */}
      <div
        ref={gridRef}
        className={`preset-masonry-flex ${
          fadeState === "fading-out"
            ? "preset-grid--fade-out"
            : fadeState === "fading-in"
              ? "preset-grid--fade-in"
              : ""
        }`}
      >
        {columns.map((col, colIdx) => (
          <div key={colIdx} className="preset-masonry-col">
            {col.map((preset) => (
              <PresetCard
                key={preset.id}
                preset={preset}
                index={presetGlobalIndex.get(preset.id) ?? 0}
                state={getCardState(preset.id)}
                onClick={() => handleCardClick(preset.id)}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Detail modal */}
      {detailPreset && (
        <PresetDetailModal
          preset={detailPreset}
          relatedPresets={finalDetailRelated}
          onClose={() => setDetailPreset(null)}
          onSelectRelated={(id) => {
            setDetailPreset(null);
            navigateToSeed(id);
          }}
        />
      )}
    </>
  );
}
