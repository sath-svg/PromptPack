/**
 * Style Analyzer: Uses Claude Vision to extract artistic style characteristics
 * from uploaded reference images.
 */

import { tauriFetch } from './tauriFetch';
import { WORKERS_API_URL } from './constants';

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
}

// v3 schema — skillset = SET of style-locked prompts for different gen surfaces
// (image, video, character, setting, mood). Specificity preserved across all.
export interface SkillPrompt {
  id: string;            // "image" | "video" | "character" | "setting" | "mood" | custom-{n}
  label: string;         // "Image Generation"
  purpose: string;       // "Use with DALL-E, Gemini, Midjourney for static images"
  icon: string;          // emoji
  template: string;      // "{subject}, drawn in chibi style with..."
  negativePrompt: string;
}

export interface StyleCharacteristics {
  lineWork: {
    thickness: string;
    edges: string;
    consistency: string;
  };
  colorPalette: {
    hexCodes: string[];
    count: number;
    temperature: string;
    dominant: string;
    accents: string[];
  };
  shading: {
    technique: string;
    lightDirection: string;
    intensity: string;
  };
  texture: {
    medium: string;
    scale: string;
    density: string;
  };
  composition: {
    framing: string;
    perspective: string;
  };
  signatureElements: string[];
  fullStyleDescription: string;
  extractedAt: number;
}

export interface StyleAnalysisResult {
  characteristics: StyleCharacteristics;
  prompts: SkillPrompt[];   // The skillset — multiple style-locked prompts
}

/**
 * Analyze uploaded images using Claude Vision to extract style characteristics.
 * Returns rich structured data for high-fidelity mimicry.
 */
export async function analyzeStyle(
  images: UploadedImage[],
  userDescription: string,
  userId: string
): Promise<StyleAnalysisResult> {
  if (!images.length) {
    throw new Error('No images provided');
  }

  // Convert all images to PNG via Canvas (normalizes format).
  // Why: providers like Anthropic via Amazon Bedrock reject webp, and
  // browser File.type is unreliable (sometimes reports jpeg for webp
  // bytes). Re-encoding through Canvas guarantees PNG output regardless
  // of source format. Also resizes to max 1024px to keep payload small.
  const imageDataList: Array<{
    base64: string;
    mediaType: 'image/jpeg' | 'image/png' | 'image/webp';
  }> = [];

  for (const image of images) {
    const base64 = await convertToPngBase64(image.file, 1024);
    imageDataList.push({
      base64,
      mediaType: 'image/png',
    });
  }

  // Call Claude Vision via Workers API
  const response = await tauriFetch(`${WORKERS_API_URL}/style-analysis`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      images: imageDataList,
      userDescription,
      userId,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    let body: { code?: string; message?: string } = {};
    try { body = JSON.parse(errText); } catch { /* not JSON */ }
    console.error('[style-analysis]', response.status, errText);
    const { friendlyApiError } = await import('./apiErrors');
    throw new Error(friendlyApiError(response.status, body));
  }

  const data = await response.json();

  // Build prompts array. Prefer new schema (data.prompts[]).
  // Backward-compat: if API returns old single-prompt shape OR no prompts
  // at all, synthesize a default 5-prompt skillset from whatever style
  // data is available.
  let prompts: SkillPrompt[] = Array.isArray(data.prompts) ? data.prompts : [];

  if (prompts.length === 0) {
    const fallbackBase =
      data.generationPrompt ||
      data.fullStyleDescription ||
      buildPromptFromCharacteristics(data);

    if (fallbackBase) {
      prompts = synthesizeDefaultPrompts(
        fallbackBase,
        data.negativePrompt || '',
        data.signatureElements ?? []
      );
    }
  }

  return {
    characteristics: {
      lineWork: data.lineWork,
      colorPalette: data.colorPalette,
      shading: data.shading,
      texture: data.texture,
      composition: data.composition,
      signatureElements: data.signatureElements ?? [],
      fullStyleDescription: data.fullStyleDescription ?? '',
      extractedAt: Date.now(),
    },
    prompts,
  };
}

/**
 * Last-resort: build a style prompt string from raw characteristics
 * when API didn't return any prompt text. Concatenates extracted
 * dimensions into a usable image-gen prompt.
 */
function buildPromptFromCharacteristics(data: any): string {
  const parts: string[] = [];
  if (data.lineWork) {
    parts.push(`${data.lineWork.thickness || ''} line work, ${data.lineWork.edges || ''} edges`);
  }
  if (data.colorPalette) {
    const hex = (data.colorPalette.hexCodes || []).slice(0, 6).join(', ');
    parts.push(`palette: ${data.colorPalette.temperature || ''} ${data.colorPalette.dominant || ''} dominant${hex ? ` (${hex})` : ''}`);
  }
  if (data.shading) {
    parts.push(`${data.shading.technique || ''}, ${data.shading.lightDirection || ''}, ${data.shading.intensity || ''}`);
  }
  if (data.texture) {
    parts.push(`${data.texture.medium || ''}, ${data.texture.scale || ''}`);
  }
  if (data.composition) {
    parts.push(`${data.composition.framing || ''}, ${data.composition.perspective || ''}`);
  }
  const cleaned = parts.filter(Boolean).join('; ');
  return cleaned ? `{subject}, drawn in this style: ${cleaned}` : '';
}

/**
 * Synthesize default 5-prompt skillset from a single base style prompt.
 * Used as fallback when API returns old (pre-prompt-set) response shape.
 */
function synthesizeDefaultPrompts(
  basePrompt: string,
  negativePrompt: string,
  signatureElements: string[]
): SkillPrompt[] {
  const baseNeg = negativePrompt || 'realistic, photorealistic, dark, gritty, harsh, muted colors';
  // Force {subject} placeholder if missing
  const baseTemplate = basePrompt.includes('{subject}')
    ? basePrompt
    : `{subject}, ${basePrompt}`;
  const sigText = signatureElements.length ? ` Signature: ${signatureElements.join(', ')}.` : '';

  return [
    {
      id: 'image',
      label: 'Image Generation',
      icon: '🖼️',
      purpose: 'Use with DALL-E, Gemini, Midjourney, Stable Diffusion for static images',
      template: baseTemplate + sigText,
      negativePrompt: baseNeg,
    },
    {
      id: 'video',
      label: 'Video Generation',
      icon: '🎬',
      purpose: 'Use with Sora, Runway, Veo, Kling for animated clips',
      template: `${baseTemplate} Animated with smooth fluid motion matching this style, frame-consistent line weight and palette across motion.${sigText}`,
      negativePrompt: `${baseNeg}, static, frozen, choppy motion, flickering`,
    },
    {
      id: 'character',
      label: 'Character/Portrait Prompt',
      icon: '👤',
      purpose: 'Generate figures, faces, character designs in this style',
      template: `{subject}, character portrait drawn in this style. ${baseTemplate.replace('{subject}, ', '')}${sigText} Emphasize signature face/anatomy details.`,
      negativePrompt: `${baseNeg}, deformed, extra limbs, wrong proportions, blurred face`,
    },
    {
      id: 'setting',
      label: 'Setting/Background Prompt',
      icon: '🏞️',
      purpose: 'Generate environments, scenes, backgrounds without focal characters',
      template: `{subject}, environment/background scene drawn in this style. ${baseTemplate.replace('{subject}, ', '')} Focus on composition, lighting, depth, environmental texture. No character figures.`,
      negativePrompt: `${baseNeg}, people, faces, characters, figures`,
    },
    {
      id: 'mood',
      label: 'Mood/Atmosphere Prompt',
      icon: '✨',
      purpose: 'Apply tonal/lighting overlay — pair with content generated separately',
      template: `{subject}, atmospheric/mood overlay matching this style — emphasize palette, lighting tone, and emotional atmosphere only. ${baseTemplate.replace('{subject}, ', '')}`,
      negativePrompt: `${baseNeg}, harsh contrast, neon, oversaturated`,
    },
  ];
}

/**
 * Convert any image File (jpeg/png/webp/gif) to PNG base64 via Canvas.
 * Resizes to fit within maxDim while preserving aspect ratio.
 *
 * Why: Some LLM providers (Anthropic via Bedrock) reject webp. Browser
 * File.type is also unreliable — webp files sometimes report as jpeg.
 * Canvas re-encoding normalizes everything to PNG regardless of source.
 */
async function convertToPngBase64(file: File, maxDim: number): Promise<string> {
  // Load file into Image element
  const dataUrl = await fileToDataUrl(file);
  const img = await loadImage(dataUrl);

  // Compute resized dimensions (preserve aspect ratio)
  let { width, height } = img;
  if (width > maxDim || height > maxDim) {
    const ratio = Math.min(maxDim / width, maxDim / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  // Draw to canvas + export as PNG
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.drawImage(img, 0, 0, width, height);

  const pngDataUrl = canvas.toDataURL('image/png');
  // Strip "data:image/png;base64," prefix
  return pngDataUrl.split(',')[1];
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
