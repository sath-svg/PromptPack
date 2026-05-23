import { useEffect, useState } from 'react';
import { Palette, X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { PresetPreview } from '../../../stores/marketplaceStore';

interface Props {
  preview?: PresetPreview;
}

export function PresetPreviewPanel({ preview }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const images = preview?.sampleImages ?? [];

  useEffect(() => {
    if (lightboxIndex == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      else if (e.key === 'ArrowRight')
        setLightboxIndex((i) =>
          i == null ? null : Math.min(images.length - 1, i + 1),
        );
      else if (e.key === 'ArrowLeft')
        setLightboxIndex((i) => (i == null ? null : Math.max(0, i - 1)));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIndex, images.length]);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Palette size={16} className="text-[var(--primary)]" />
        <h4 className="font-medium text-[var(--foreground)]">Style preset</h4>
      </div>
      {preview?.styleSummary && (
        <p className="text-sm leading-relaxed text-[var(--foreground)]">
          {preview.styleSummary}
        </p>
      )}
      {preview?.palette?.length ? (
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted-foreground)] mb-2">
            Palette
          </p>
          <div className="flex gap-2 flex-wrap">
            {preview.palette.map((hex, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <span
                  className="block h-9 w-9 rounded-md border border-[var(--border)]"
                  style={{ background: hex }}
                  title={hex}
                />
                <span
                  className="text-[10px] text-[var(--muted-foreground)]"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {hex}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {images.length > 0 ? (
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted-foreground)] mb-2">
            Reference photos · click to expand
          </p>
          <div className="grid grid-cols-3 gap-2 md:grid-cols-5">
            {images.map((src, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setLightboxIndex(i)}
                className="group relative aspect-square overflow-hidden rounded-md border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                <img
                  src={src}
                  alt={`Sample ${i + 1}`}
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {!preview ? (
        <p className="text-sm text-[var(--muted-foreground)]">
          Style locked. Buy to access reference images and the full style description.
        </p>
      ) : null}

      {lightboxIndex != null && images[lightboxIndex] && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-6"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(null);
            }}
            className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Close"
          >
            <X size={18} />
          </button>
          {lightboxIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((i) =>
                  i == null ? null : Math.max(0, i - 1),
                );
              }}
              className="absolute left-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              aria-label="Previous"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          {lightboxIndex < images.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((i) =>
                  i == null ? null : Math.min(images.length - 1, i + 1),
                );
              }}
              className="absolute right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              aria-label="Next"
            >
              <ChevronRight size={20} />
            </button>
          )}
          <img
            src={images[lightboxIndex]}
            alt={`Sample ${lightboxIndex + 1} of ${images.length}`}
            className="max-h-[90vh] max-w-[90vw] rounded-md object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs text-white">
            {lightboxIndex + 1} / {images.length}
          </span>
        </div>
      )}
    </div>
  );
}
