import { Download, RefreshCw, CheckCircle2, Zap, X, Maximize2, MessageSquare, Wand2, ImagePlus, Trash2 } from 'lucide-react';
import { useState, useCallback } from 'react';
import { save as tauriSave } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import { useSettingsStore } from '../../stores/settingsStore';

interface ActivePromptInfo {
  id: string;
  label: string;
  icon: string;
  purpose: string;
}

interface FeedbackImage {
  id: string;
  file: File;
  preview: string;
}

interface PreviewGalleryProps {
  phase: 'preview' | 'generating';
  currentGeneration: {
    id: string;
    imageUrls: string[];
    generatedAt: number;
    prompt?: string;
    satisfied: boolean;
  } | null;
  activePrompt?: ActivePromptInfo | null;
  onGenerateImages: (subjectPrompt?: string) => void;
  onExport: () => void;
  // Refine flow: artist gives natural-language feedback + optional reference
  // images. Vision LLM analyzes both → style updates.
  onRefineFromFeedback?: (feedback: string, images: FeedbackImage[]) => Promise<void>;
  isRefining?: boolean;
  // Show transient "changes applied, regenerate" banner after refine
  refineSuccess?: boolean;
  onDismissRefineSuccess?: () => void;
}

/**
 * Decode data URL "data:image/png;base64,XXX" → Uint8Array of image bytes.
 */
function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1] || dataUrl;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function PreviewGallery({
  phase,
  currentGeneration,
  activePrompt,
  onGenerateImages,
  onExport,
  onRefineFromFeedback,
  isRefining,
  refineSuccess,
  onDismissRefineSuccess,
}: PreviewGalleryProps) {
  const [subjectPrompt, setSubjectPrompt] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [feedbackImages, setFeedbackImages] = useState<FeedbackImage[]>([]);
  const [feedbackImageError, setFeedbackImageError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const { defaultDownloadFolder, skipDownloadDialog } = useSettingsStore();

  // Image handlers for feedback section
  const addFeedbackImages = useCallback((files: FileList) => {
    setFeedbackImageError(null);
    const valid: FeedbackImage[] = [];
    const maxSize = 5 * 1024 * 1024;
    let total = feedbackImages.reduce((s, i) => s + i.file.size, 0);

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
        setFeedbackImageError(`Invalid type: ${f.name}. Use JPG/PNG/WebP.`);
        continue;
      }
      if (f.size > maxSize) {
        setFeedbackImageError(`Too large: ${f.name}. Max 5MB/file.`);
        continue;
      }
      total += f.size;
      if (total > maxSize) {
        setFeedbackImageError('Total feedback images exceed 5MB.');
        break;
      }
      valid.push({
        id: `${Date.now()}-${Math.random()}`,
        file: f,
        preview: URL.createObjectURL(f),
      });
    }

    if (valid.length > 0) setFeedbackImages((prev) => [...prev, ...valid]);
  }, [feedbackImages]);

  const removeFeedbackImage = useCallback((id: string) => {
    setFeedbackImages((prev) => {
      const removed = prev.find((i) => i.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const handleFeedbackDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const handleFeedbackDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);
      if (e.dataTransfer.files) addFeedbackImages(e.dataTransfer.files);
    },
    [addFeedbackImages]
  );

  const hasGenerated = !!currentGeneration && currentGeneration.imageUrls.length > 0;
  const images = currentGeneration?.imageUrls || [];

  const handleDownloadImage = async (src: string, idx: number) => {
    const filename = `skillpreset-preview-${Date.now()}-${idx + 1}.png`;
    const bytes = dataUrlToBytes(src);

    try {
      let filePath: string | null = null;

      if (skipDownloadDialog && defaultDownloadFolder) {
        // Skip dialog — write to default folder
        filePath = `${defaultDownloadFolder}/${filename}`.replace(/\\/g, '/');
      } else {
        filePath = await tauriSave({
          defaultPath: defaultDownloadFolder
            ? `${defaultDownloadFolder}/${filename}`.replace(/\\/g, '/')
            : filename,
          filters: [{ name: 'PNG Image', extensions: ['png'] }],
        });
      }

      if (filePath) {
        await writeFile(filePath, bytes);
      }
    } catch (err) {
      // Tauri unavailable (web fallback) → browser download
      console.warn('Tauri save failed, using browser download:', err);
      const link = document.createElement('a');
      link.href = src;
      link.download = filename;
      link.click();
    }
  };

  return (
    <div className="space-y-6">
      {/* Refine-success banner — prompts user to regenerate */}
      {refineSuccess && (
        <div className="p-3 rounded-lg border border-green-500/40 bg-gradient-to-r from-green-500/10 to-emerald-500/10 flex items-center gap-3 animate-in fade-in">
          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={16} className="text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-green-700 dark:text-green-400">
              Style updated ✨
            </p>
            <p className="text-xs text-green-600/80 dark:text-green-300/80">
              Your feedback has been applied to the style + prompts. Try{' '}
              <span className="font-medium">Regenerate</span> below to see the change.
            </p>
          </div>
          {onDismissRefineSuccess && (
            <button
              onClick={onDismissRefineSuccess}
              className="p-1 text-green-600 hover:text-green-700 hover:bg-green-500/10 rounded-md"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* Generate Button */}
      <div>
        <h3 className="font-medium text-[var(--foreground)] mb-3">Generate Preview Images</h3>
        <p className="text-sm text-[var(--muted-foreground)] mb-2">
          Generate 3 images in your style. Costs ~24 credits per batch.
        </p>
        {/* Active prompt indicator */}
        {activePrompt && (
          <div className="mb-4 p-2.5 rounded-md bg-[var(--primary)]/10 border border-[var(--primary)]/30 flex items-center gap-2">
            <span className="text-base">{activePrompt.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[var(--foreground)]">
                Using: <span className="text-[var(--primary)]">{activePrompt.label}</span>
              </p>
              <p className="text-[10px] text-[var(--muted-foreground)] truncate">
                {activePrompt.purpose}
              </p>
            </div>
            <span className="text-[10px] text-[var(--muted-foreground)]">
              Switch via ★ in Skillset Prompts above
            </span>
          </div>
        )}

        {!hasGenerated && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              What should the images show? (Optional)
            </label>
            <input
              type="text"
              value={subjectPrompt}
              onChange={(e) => setSubjectPrompt(e.target.value)}
              placeholder="e.g., 'a mountain landscape', 'a portrait', 'abstract shapes'"
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--input)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
        )}

        <button
          onClick={() => onGenerateImages(subjectPrompt)}
          disabled={phase === 'generating' || !activePrompt}
          title={!activePrompt ? 'Select a prompt first (★ on a prompt above)' : undefined}
          className={`w-full py-3 px-4 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] font-medium hover:bg-[var(--primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 ${
            refineSuccess ? 'ring-2 ring-green-500/60 ring-offset-2 ring-offset-[var(--background)] animate-pulse' : ''
          }`}
        >
          {phase === 'generating' ? (
            <>
              <div className="animate-spin">
                <Zap size={18} />
              </div>
              Generating...
            </>
          ) : (
            <>
              <RefreshCw size={18} />
              {hasGenerated ? 'Regenerate Images' : 'Generate 3 Images'}
            </>
          )}
        </button>
      </div>

      {/* Image Gallery */}
      {hasGenerated && images.length > 0 && (
        <div>
          <h3 className="font-medium text-[var(--foreground)] mb-3">Preview Results</h3>
          <p className="text-xs text-[var(--muted-foreground)] mb-3">
            Click any image to view larger and download.
          </p>
          <div className="grid grid-cols-3 gap-4">
            {images.map((src, idx) => (
              <button
                key={idx}
                onClick={() => setLightboxIndex(idx)}
                className="group relative overflow-hidden rounded-lg border border-[var(--border)] cursor-zoom-in"
              >
                <img
                  src={src}
                  alt={`Preview ${idx + 1}`}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <Maximize2
                    size={28}
                    className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg"
                  />
                </div>
              </button>
            ))}
          </div>

          {/* Feedback → refine style (text + optional images) */}
          {onRefineFromFeedback && (
            <div className="mt-4 p-3 rounded-lg border border-[var(--border)] bg-[var(--card)]">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare size={14} className="text-[var(--muted-foreground)]" />
                <h4 className="font-medium text-xs text-[var(--foreground)]">
                  Not quite right? Tell AI what to fix
                </h4>
              </div>
              <p className="text-[10px] text-[var(--muted-foreground)] mb-2">
                Examples: "colors too saturated, want softer pastels" • "lines too thick, make them 1pt"
                • "eyes should be smaller and rounder" • or upload corrected art samples below.
              </p>

              {/* Text feedback */}
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Describe what's off... (optional if attaching images)"
                disabled={isRefining}
                className="w-full px-2 py-1.5 rounded border border-[var(--border)] bg-[var(--input)] text-[var(--foreground)] text-xs h-16 resize-none focus:outline-none focus:ring-1 focus:ring-[var(--primary)] disabled:opacity-50"
              />

              {/* Image upload — drag-drop or click */}
              <div className="mt-2">
                <label
                  onDragEnter={handleFeedbackDrag}
                  onDragLeave={handleFeedbackDrag}
                  onDragOver={handleFeedbackDrag}
                  onDrop={handleFeedbackDrop}
                  className={`block px-3 py-3 rounded border-2 border-dashed cursor-pointer transition-colors text-center ${
                    isDragActive
                      ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                      : 'border-[var(--border)] hover:border-[var(--primary)]/50 hover:bg-[var(--primary)]/5'
                  } ${isRefining ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <div className="flex items-center justify-center gap-2 text-[11px] text-[var(--muted-foreground)]">
                    <ImagePlus size={14} />
                    <span>
                      Drop or click to attach reference images (corrections, more samples of your style)
                    </span>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      if (e.target.files) addFeedbackImages(e.target.files);
                      e.target.value = ''; // reset so same file can be re-added
                    }}
                    className="hidden"
                    disabled={isRefining}
                  />
                </label>

                {feedbackImageError && (
                  <p className="text-[10px] text-amber-600 mt-1">{feedbackImageError}</p>
                )}

                {/* Thumbnails */}
                {feedbackImages.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {feedbackImages.map((img) => (
                      <div key={img.id} className="relative group w-16 h-16">
                        <img
                          src={img.preview}
                          alt="Feedback ref"
                          className="w-16 h-16 object-cover rounded border border-[var(--border)]"
                        />
                        <button
                          onClick={() => removeFeedbackImage(img.id)}
                          disabled={isRefining}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          aria-label="Remove"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={async () => {
                  if (!onRefineFromFeedback) return;
                  if (!feedback.trim() && feedbackImages.length === 0) return;
                  await onRefineFromFeedback(feedback, feedbackImages);
                  // Clear inputs after success
                  setFeedback('');
                  feedbackImages.forEach((i) => URL.revokeObjectURL(i.preview));
                  setFeedbackImages([]);
                }}
                disabled={
                  (!feedback.trim() && feedbackImages.length === 0) || isRefining
                }
                className="mt-2 w-full py-1.5 px-3 rounded-md bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {isRefining ? (
                  <>
                    <div className="animate-spin">
                      <Wand2 size={12} />
                    </div>
                    Updating Style...
                  </>
                ) : (
                  <>
                    <Wand2 size={12} />
                    Refine Style {feedbackImages.length > 0 ? `(+${feedbackImages.length} image${feedbackImages.length !== 1 ? 's' : ''}) ~12` : '~8'} credits
                  </>
                )}
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => onGenerateImages(subjectPrompt)}
              className={`flex-1 py-2 px-3 rounded-lg border text-[var(--foreground)] transition-colors flex items-center justify-center gap-2 ${
                refineSuccess
                  ? 'border-green-500/60 bg-green-500/10 hover:bg-green-500/20 animate-pulse'
                  : 'border-[var(--border)] hover:bg-[var(--accent)]'
              }`}
            >
              <RefreshCw size={16} />
              Regenerate
            </button>
            <button
              onClick={onExport}
              className="flex-1 py-2 px-3 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <CheckCircle2 size={16} />
              Mark Satisfied & Export
            </button>
          </div>
        </div>
      )}

      {!hasGenerated && (
        <div className="p-6 rounded-lg border-2 border-dashed border-[var(--border)] text-center">
          <div className="flex justify-center mb-3">
            <Zap size={32} className="text-[var(--muted-foreground)]" />
          </div>
          <p className="text-sm text-[var(--muted-foreground)]">
            Click "Generate 3 Images" above to see AI-generated previews of your art style
          </p>
        </div>
      )}

      {/* Lightbox modal */}
      {lightboxIndex !== null && images[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute -top-2 -right-2 z-10 p-2 rounded-full bg-white text-black hover:bg-gray-200 transition-colors shadow-lg"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            {/* Image */}
            <img
              src={images[lightboxIndex]}
              alt={`Preview ${lightboxIndex + 1}`}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />

            {/* Footer with download + nav */}
            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex gap-2">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setLightboxIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      idx === lightboxIndex ? 'bg-white' : 'bg-white/40 hover:bg-white/70'
                    }`}
                    aria-label={`Image ${idx + 1}`}
                  />
                ))}
              </div>
              <button
                onClick={() => handleDownloadImage(images[lightboxIndex], lightboxIndex)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black hover:bg-gray-200 transition-colors text-sm font-medium shadow-lg"
              >
                <Download size={16} />
                {skipDownloadDialog && defaultDownloadFolder ? 'Save (default folder)' : 'Save As...'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
