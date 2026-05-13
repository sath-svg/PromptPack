import { useState, useCallback } from 'react';
import { Upload, Trash2, Zap, AlertCircle, ArrowLeft, RotateCcw, Check } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { ImageUpload } from './ImageUpload';
import { PreviewGallery } from './PreviewGallery';
import { ExportModal } from './ExportModal';
import { StyleBreakdown } from './StyleBreakdown';
import { analyzeStyle, type StyleCharacteristics, type SkillPrompt } from '../../lib/styleAnalyzer';
import { generateImages } from '../../lib/skillsetGenerator';
import { refineStyleFromFeedback } from '../../lib/styleRefiner';

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
}

interface PreviewGeneration {
  id: string;
  imageUrls: string[];
  generatedAt: number;
  prompt?: string;
  satisfied: boolean;
}

type Phase = 'upload' | 'analyzing' | 'analyze-error' | 'generating' | 'preview' | 'exporting';

export function SkillPresetPage() {
  const { session } = useAuthStore();
  const { creditBalance } = useSettingsStore();

  // Phase 1: Image upload + verification
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [styleDescription, setStyleDescription] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [title, setTitle] = useState('');

  // Phase 2.5: Style analysis
  const [styleCharacteristics, setStyleCharacteristics] = useState<StyleCharacteristics | null>(null);
  // Skillset = SET of prompts (image, video, character, setting, mood, custom).
  // Each style-locked, each for different gen surface.
  const [skillPrompts, setSkillPrompts] = useState<SkillPrompt[]>([]);
  // Active prompt id used for preview generation
  const [activePromptId, setActivePromptId] = useState<string>('image');
  // Allow artist to manually edit
  const [editingPrompt, setEditingPrompt] = useState(false);

  // Phase 3: Image generation
  const [, setPreviewGenerations] = useState<PreviewGeneration[]>([]);
  const [currentGeneration, setCurrentGeneration] = useState<PreviewGeneration | null>(null);

  // UI state
  const [phase, setPhase] = useState<Phase>('upload');
  const [error, setError] = useState<string | null>(null);
  // Structured error for special cases (content policy, etc) — show suggestion
  const [errorSuggestion, setErrorSuggestion] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  // Track last-tried subject so we can offer click-to-replace rewordings
  const [lastSubject, setLastSubject] = useState<string>('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  // Transient success flag after refine — shows "changes applied" banner
  const [refineSuccess, setRefineSuccess] = useState(false);

  // Reset all state — called after successful export
  const resetAll = useCallback(() => {
    // Revoke any blob URLs to prevent memory leaks
    uploadedImages.forEach((img) => URL.revokeObjectURL(img.preview));
    setUploadedImages([]);
    setStyleDescription('');
    setIsVerified(false);
    setTitle('');
    setStyleCharacteristics(null);
    setSkillPrompts([]);
    setActivePromptId('image');
    setEditingPrompt(false);
    setPreviewGenerations([]);
    setCurrentGeneration(null);
    setPhase('upload');
    setError(null);
    setShowExportModal(false);
  }, [uploadedImages]);

  // Back to step 1 (upload). Keeps all data — user can edit images/desc + re-analyze.
  const handleBackToUpload = useCallback(() => {
    setPhase('upload');
    setError(null);
  }, []);

  // Refine style from artist feedback (text + optional reference images via Vision)
  const handleRefineFromFeedback = useCallback(
    async (feedback: string, feedbackImages: UploadedImage[] = []) => {
      if (!styleCharacteristics) return;
      setIsRefining(true);
      setError(null);
      try {
        // Vision adds tokens — credit check matches API estimate
        const needed = feedbackImages.length > 0 ? 12 : 8;
        if (!creditBalance || creditBalance.monthly + creditBalance.topup < needed) {
          setError(`Insufficient credits to refine (need ~${needed}). Top up to continue.`);
          return;
        }
        const result = await refineStyleFromFeedback(
          styleCharacteristics,
          skillPrompts,
          feedback,
          session?.user_id || '',
          feedbackImages
        );
        setStyleCharacteristics(result.characteristics);
        setSkillPrompts(result.prompts);
        // Show success banner; auto-clear after 8s
        setRefineSuccess(true);
        setTimeout(() => setRefineSuccess(false), 8000);
      } catch (err) {
        console.error('Refine failed:', err);
        setError(err instanceof Error ? err.message : 'Refine failed');
      } finally {
        setIsRefining(false);
      }
    },
    [styleCharacteristics, skillPrompts, creditBalance, session?.user_id]
  );

  // Handlers
  const handleImagesAdded = useCallback((images: UploadedImage[]) => {
    setUploadedImages((prev) => [...prev, ...images]);
    setError(null);
  }, []);

  const handleRemoveImage = useCallback((id: string) => {
    setUploadedImages((prev) => {
      const updated = prev.filter((img) => img.id !== id);
      // Clean up preview URL
      const removed = prev.find((img) => img.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }
      return updated;
    });
  }, []);

  const handleAnalyzeStyle = async () => {
    if (!uploadedImages.length) {
      setError('Upload at least one image');
      return;
    }
    if (!styleDescription.trim()) {
      setError('Describe your art style');
      return;
    }
    if (!isVerified) {
      setError('Verify you are the artist');
      return;
    }

    setPhase('analyzing');
    setError(null);

    try {
      // Check credit availability (~5-10 credits for analysis)
      if (!creditBalance || creditBalance.monthly + creditBalance.topup < 10) {
        setPhase('analyze-error');
        setError('Insufficient credits for style analysis. Top up to continue.');
        return;
      }

      // Call style analyzer (v3 — returns prompt set)
      const result = await analyzeStyle(uploadedImages, styleDescription, session?.user_id || '');

      setStyleCharacteristics(result.characteristics);
      setSkillPrompts(result.prompts);
      // Default active = image (most common gen surface)
      setActivePromptId(result.prompts.find((p) => p.id === 'image')?.id || result.prompts[0]?.id || 'image');
      setPhase('preview');
    } catch (err) {
      console.error('Style analysis failed:', err);
      setPhase('analyze-error');
      setError(err instanceof Error ? err.message : 'Style analysis failed. Try again.');
    }
  };

  const handleGenerateImages = async (subjectPrompt: string = '') => {
    const activePrompt = skillPrompts.find((p) => p.id === activePromptId);
    if (!activePrompt) {
      setError('No active prompt selected');
      return;
    }
    if (!title.trim()) {
      setError('Give your skillset a name');
      return;
    }

    setPhase('generating');
    setError(null);
    setErrorSuggestion(null);
    setErrorCode(null);
    setLastSubject(subjectPrompt);
    setRefineSuccess(false); // clear once user acts on the suggestion

    try {
      // Check credit availability (~24 credits for 3 images)
      if (!creditBalance || creditBalance.monthly + creditBalance.topup < 24) {
        setPhase('preview');
        setError('Insufficient credits for image generation. Top up to continue.');
        return;
      }

      // Generate 3 images using active prompt's template + negative
      const result = await generateImages({
        stylePromptTemplate: activePrompt.template,
        negativePrompt: activePrompt.negativePrompt,
        subject: subjectPrompt,
        userId: session?.user_id || '',
      });

      // Create generation entry
      const newGeneration: PreviewGeneration = {
        id: `${Date.now()}-${Math.random()}`,
        imageUrls: result.images.map((b64) => `data:image/png;base64,${b64}`),
        generatedAt: Date.now(),
        prompt: activePrompt.template,
        satisfied: false,
      };

      setCurrentGeneration(newGeneration);
      setPreviewGenerations((prev) => [...prev, newGeneration]);
      setPhase('preview');
    } catch (err: any) {
      console.error('Image generation failed:', err);
      setPhase('preview');
      // Use friendly userMessage if present, else fall back to error message
      setError(err?.userMessage || (err instanceof Error ? err.message : 'Image generation failed'));
      setErrorSuggestion(err?.suggestion || null);
      setErrorCode(err?.code || null);
    }
  };

  /**
   * Soften a subject phrase to pass DALL-E 3 safety filter.
   * Replaces common violent verbs with safer alternatives.
   */
  function softenSubject(subject: string): string[] {
    const replacements: Array<[RegExp, string]> = [
      [/\bslaying\b/gi, 'standing victorious over a defeated'],
      [/\bslay\b/gi, 'defeat'],
      [/\bkilling\b/gi, 'overcoming'],
      [/\bkill\b/gi, 'overcome'],
      [/\bfighting\b/gi, 'facing'],
      [/\bfight\b/gi, 'face'],
      [/\bmurder(ing|ed|s)?\b/gi, 'dramatic scene'],
      [/\bbattle\b/gi, 'standoff with'],
      [/\bblood(y|ied)?\b/gi, 'intense'],
      [/\bgun(s)?\b/gi, 'weapon'],
    ];

    const variants = new Set<string>();
    // Variant 1: apply ALL replacements
    let v1 = subject;
    for (const [re, repl] of replacements) v1 = v1.replace(re, repl);
    if (v1 !== subject) variants.add(v1);

    // Variant 2: rephrase as a "scene" not action
    variants.add(`a mythical scene featuring ${subject.replace(/\b(slaying|killing|fighting|battling)\b/gi, 'with')}`);

    // Variant 3: heroic pose framing
    variants.add(
      subject.replace(/\b(slaying|killing|fighting|battling)\s+(a|an|the)?\s*/gi, 'in heroic pose with $2 ')
    );

    return Array.from(variants).filter((v) => v.trim() && v !== subject).slice(0, 3);
  }

  const isPolicyError = errorCode === 'content_policy_violation';
  const suggestedRewordings = isPolicyError && lastSubject ? softenSubject(lastSubject) : [];

  // Render phases
  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 text-[var(--muted-foreground)]" size={48} />
          <p className="text-[var(--muted-foreground)]">Sign in to create prompt presets</p>
        </div>
      </div>
    );
  }

  // Determine current step number for indicator (1-indexed)
  // Step 1 = upload/analyzing, Step 2 = preview/generating
  const currentStep = phase === 'upload' || phase === 'analyzing' || phase === 'analyze-error' ? 1 : 2;
  const hasAnalysis = !!styleCharacteristics;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--background)] border-b border-[var(--border)] px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-[var(--foreground)]">Skill Preset</h1>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                Upload reference images, let AI analyze your style, generate previews, then export as a skillset
              </p>
            </div>
            {/* Reset button (only when there's something to reset) */}
            {(uploadedImages.length > 0 || hasAnalysis) && (
              <button
                onClick={() => {
                  if (
                    confirm('Reset everything and start over? Uploaded images, style analysis, and generated previews will be cleared.')
                  ) {
                    resetAll();
                  }
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs text-[var(--muted-foreground)] hover:bg-red-500/10 hover:text-red-500 transition-colors"
                title="Reset everything"
              >
                <RotateCcw size={12} />
                Reset
              </button>
            )}
          </div>

          {/* Step indicator */}
          <div className="mt-4 flex items-center gap-2">
            <StepDot
              step={1}
              label="Upload & Verify"
              active={currentStep === 1}
              done={currentStep > 1}
              clickable={currentStep > 1}
              onClick={handleBackToUpload}
            />
            <StepConnector done={currentStep > 1} />
            <StepDot
              step={2}
              label="Style & Preview"
              active={currentStep === 2}
              done={false}
              clickable={hasAnalysis && currentStep !== 2}
              onClick={() => setPhase('preview')}
            />
            <StepConnector done={false} />
            <StepDot
              step={3}
              label="Export"
              active={false}
              done={false}
              clickable={false}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Phase 1: Upload */}
        {(phase === 'upload' || phase === 'analyzing' || phase === 'analyze-error') && (
          <div className="space-y-6">
            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Reference Images
              </label>
              <ImageUpload onImagesAdded={handleImagesAdded} />
              {uploadedImages.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-4 sm:grid-cols-2">
                  {uploadedImages.map((img) => (
                    <div key={img.id} className="relative group">
                      <img
                        src={img.preview}
                        alt="Reference"
                        className="w-full h-32 object-cover rounded-lg border border-[var(--border)]"
                      />
                      <button
                        onClick={() => handleRemoveImage(img.id)}
                        className="absolute top-1 right-1 p-1 rounded-md bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-[var(--muted-foreground)] mt-2">
                Max 10 images, 5MB total. JPG, PNG, WebP.
              </p>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Skillset Name
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., 'My Watercolor Style', 'Abstract Oil Paintings'"
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--input)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>

            {/* Style Description */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Describe Your Style
              </label>
              <textarea
                value={styleDescription}
                onChange={(e) => setStyleDescription(e.target.value)}
                placeholder="e.g., 'Watercolor landscapes with soft transitions, warm earth tones, impressionistic style'"
                maxLength={500}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--input)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] h-24 resize-none"
              />
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                {styleDescription.length}/500 characters
              </p>
            </div>

            {/* Verification */}
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isVerified}
                  onChange={(e) => setIsVerified(e.target.checked)}
                  className="mt-1 rounded border-[var(--border)]"
                />
                <span className="text-sm text-[var(--foreground)]">
                  I confirm I am the original artist of these images and own all rights to them.
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isVerified}
                  onChange={(e) => setIsVerified(e.target.checked)}
                  className="mt-1 rounded border-[var(--border)]"
                  disabled
                />
                <span className="text-sm text-[var(--muted-foreground)]">
                  I agree to Skillset Terms of Service
                </span>
              </label>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3">
                <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-500">{error}</p>
                  {phase === 'analyze-error' && (
                    <button
                      onClick={() => {
                        window.dispatchEvent(
                          new CustomEvent('skillset:navigate', { detail: 'settings' })
                        );
                      }}
                      className="text-xs text-red-600 hover:text-red-700 mt-2 font-medium"
                    >
                      Go to Top Up Credits →
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons — different layout if user has analysis cached */}
            {hasAnalysis ? (
              <div className="flex gap-3">
                <button
                  onClick={() => setPhase('preview')}
                  className="flex-1 py-3 px-4 rounded-lg border border-[var(--primary)]/40 text-[var(--primary)] hover:bg-[var(--primary)]/10 font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Check size={18} />
                  Continue to Style & Preview →
                </button>
                <button
                  onClick={handleAnalyzeStyle}
                  disabled={
                    !uploadedImages.length ||
                    !styleDescription.trim() ||
                    !isVerified ||
                    !title.trim() ||
                    phase === 'analyzing'
                  }
                  className="flex-1 py-3 px-4 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] font-medium hover:bg-[var(--primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  title="Re-run analysis with current images (uses credits)"
                >
                  {phase === 'analyzing' ? (
                    <>
                      <div className="animate-spin">
                        <Zap size={18} />
                      </div>
                      Re-analyzing...
                    </>
                  ) : (
                    <>
                      <RotateCcw size={18} />
                      Re-analyze (5-10 credits)
                    </>
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={handleAnalyzeStyle}
                disabled={
                  !uploadedImages.length ||
                  !styleDescription.trim() ||
                  !isVerified ||
                  !title.trim() ||
                  phase === 'analyzing'
                }
                className="w-full py-3 px-4 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] font-medium hover:bg-[var(--primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {phase === 'analyzing' ? (
                  <>
                    <div className="animate-spin">
                      <Zap size={18} />
                    </div>
                    Analyzing Style...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Analyze Style (5-10 credits)
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Phase 3+: Preview & Export */}
        {(phase === 'preview' || phase === 'generating') && styleCharacteristics && (
          <div className="space-y-6">
            {/* Back button → Step 1 (cached state preserved) */}
            <button
              onClick={handleBackToUpload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] transition-colors -mb-2"
            >
              <ArrowLeft size={14} />
              Back to Upload & Verify
            </button>

            {/* Style Breakdown — visual swatches + dimension cards + prompt set (all editable) */}
            <StyleBreakdown
              characteristics={styleCharacteristics}
              prompts={skillPrompts}
              activePromptId={activePromptId}
              editing={editingPrompt}
              onToggleEditing={() => setEditingPrompt((v) => !v)}
              onUpdateCharacteristics={(next) => setStyleCharacteristics(next)}
              onUpdatePrompts={(next) => setSkillPrompts(next)}
              onSetActivePrompt={(id) => setActivePromptId(id)}
            />

            {/* Preview Gallery */}
            <PreviewGallery
              phase={phase}
              currentGeneration={currentGeneration}
              activePrompt={(() => {
                const ap = skillPrompts.find((p) => p.id === activePromptId);
                return ap ? { id: ap.id, label: ap.label, icon: ap.icon, purpose: ap.purpose } : null;
              })()}
              onGenerateImages={handleGenerateImages}
              onExport={() => setShowExportModal(true)}
              onRefineFromFeedback={handleRefineFromFeedback}
              isRefining={isRefining}
              refineSuccess={refineSuccess}
              onDismissRefineSuccess={() => setRefineSuccess(false)}
            />

            {/* Error — polished UI for content policy vs generic */}
            {error && isPolicyError && (
              <div className="rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-orange-500/10 overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-amber-500/30 bg-amber-500/5">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <AlertCircle size={16} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                      DALL-E 3 Safety Filter
                    </p>
                    <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80">
                      Your prompt triggered OpenAI's content policy
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setError(null);
                      setErrorSuggestion(null);
                      setErrorCode(null);
                    }}
                    className="text-amber-600 hover:text-amber-700 hover:bg-amber-500/10 p-1 rounded-md"
                    aria-label="Dismiss"
                  >
                    <span className="text-lg leading-none">×</span>
                  </button>
                </div>

                {/* Body */}
                <div className="px-4 py-3 space-y-3">
                  {/* Blocked categories chip row */}
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-amber-700/70 dark:text-amber-300/70 mb-1.5 font-semibold">
                      What DALL-E 3 blocks
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {['violence (slay, kill, fight)', 'weapons', 'gore', 'sexual content', 'real public figures'].map(
                        (term) => (
                          <span
                            key={term}
                            className="px-2 py-0.5 rounded-md text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                          >
                            {term}
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  {/* Your prompt */}
                  {lastSubject && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-[var(--muted-foreground)] mb-1 font-semibold">
                        Your subject
                      </p>
                      <p className="text-xs font-mono text-[var(--foreground)] bg-[var(--background)] px-2 py-1.5 rounded border border-[var(--border)]">
                        "{lastSubject}"
                      </p>
                    </div>
                  )}

                  {/* Suggested rewordings — one-click retry */}
                  {suggestedRewordings.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-amber-700/70 dark:text-amber-300/70 mb-1.5 font-semibold">
                        Try one of these (click to retry)
                      </p>
                      <div className="space-y-1.5">
                        {suggestedRewordings.map((rewording, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setError(null);
                              setErrorSuggestion(null);
                              setErrorCode(null);
                              handleGenerateImages(rewording);
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg bg-[var(--background)] border border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-500/5 transition-colors group"
                          >
                            <div className="flex items-start gap-2">
                              <span className="text-amber-500 font-bold text-xs mt-0.5">
                                {idx + 1}.
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-[var(--foreground)] font-mono">
                                  "{rewording}"
                                </p>
                                <p className="text-[10px] text-amber-600/70 dark:text-amber-400/70 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  ↻ Click to retry with this wording
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Generic suggestion (fallback if no auto-rewording matched) */}
                  {suggestedRewordings.length === 0 && errorSuggestion && (
                    <div className="p-2 rounded-md bg-[var(--background)] border border-amber-500/30">
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        💡 {errorSuggestion}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Generic error (non-policy) */}
            {error && !isPolicyError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3">
                <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-500">{error}</p>
                  {errorSuggestion && (
                    <p className="text-xs text-red-400/80 mt-1">{errorSuggestion}</p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setError(null);
                    setErrorSuggestion(null);
                    setErrorCode(null);
                  }}
                  className="p-1 text-red-500 hover:text-red-600"
                  aria-label="Dismiss"
                >
                  <span className="text-lg leading-none">×</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          onClose={() => setShowExportModal(false)}
          onExportSuccess={() => {
            // Export complete → reset all cached state for next skillset
            setShowExportModal(false);
            resetAll();
          }}
          skillsetData={{
            title,
            styleCharacteristics: styleCharacteristics!,
            prompts: skillPrompts,
            images: uploadedImages,
          }}
        />
      )}
    </div>
  );
}

interface StepDotProps {
  step: number;
  label: string;
  active: boolean;
  done: boolean;
  clickable: boolean;
  onClick?: () => void;
}

function StepDot({ step, label, active, done, clickable, onClick }: StepDotProps) {
  const baseClass = 'flex items-center gap-2 transition-colors';
  const numClass = active
    ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
    : done
      ? 'bg-green-500/20 text-green-500 border border-green-500/40'
      : 'bg-[var(--muted)]/30 text-[var(--muted-foreground)]';
  const labelClass = active
    ? 'text-[var(--foreground)] font-medium'
    : done
      ? 'text-green-500'
      : 'text-[var(--muted-foreground)]';

  const Wrapper: any = clickable ? 'button' : 'div';
  return (
    <Wrapper
      onClick={clickable ? onClick : undefined}
      className={`${baseClass} ${clickable ? 'hover:opacity-80 cursor-pointer' : ''}`}
      title={clickable ? `Go back to ${label}` : undefined}
    >
      <span
        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${numClass}`}
      >
        {done ? <Check size={12} /> : step}
      </span>
      <span className={`text-xs ${labelClass}`}>{label}</span>
    </Wrapper>
  );
}

function StepConnector({ done }: { done: boolean }) {
  return (
    <div className={`flex-1 h-0.5 max-w-12 ${done ? 'bg-green-500/40' : 'bg-[var(--border)]'}`} />
  );
}
