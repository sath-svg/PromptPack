/**
 * Style Refiner: Sends current characteristics + prompts + artist feedback
 * (text + optional reference images) to Workers /style-refine endpoint.
 * Claude (Vision if images provided) updates only the targeted dimensions.
 */

import { tauriFetch } from './tauriFetch';
import { WORKERS_API_URL } from './constants';
import type { StyleCharacteristics, SkillPrompt } from './styleAnalyzer';

interface FeedbackImage {
  id: string;
  file: File;
  preview: string;
}

interface RefineResult {
  characteristics: StyleCharacteristics;
  prompts: SkillPrompt[];
}

export async function refineStyleFromFeedback(
  characteristics: StyleCharacteristics,
  prompts: SkillPrompt[],
  feedback: string,
  userId: string,
  feedbackImages: FeedbackImage[] = []
): Promise<RefineResult> {
  if (!feedback.trim() && feedbackImages.length === 0) {
    throw new Error('Provide feedback text or attach reference images');
  }

  // Convert feedback images → PNG base64 via Canvas (normalizes format,
  // resizes for payload size). Same approach as initial style analysis.
  const imageDataList: Array<{ base64: string; mediaType: 'image/png' }> = [];
  for (const img of feedbackImages) {
    const base64 = await convertToPngBase64(img.file, 1024);
    imageDataList.push({ base64, mediaType: 'image/png' });
  }

  const response = await tauriFetch(`${WORKERS_API_URL}/style-refine`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      characteristics,
      prompts,
      feedback,
      userId,
      images: imageDataList,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    let body: { code?: string; message?: string } = {};
    try { body = JSON.parse(errText); } catch { /* not JSON */ }
    console.error('[style-refine]', response.status, errText);
    const { friendlyApiError } = await import('./apiErrors');
    throw new Error(friendlyApiError(response.status, body));
  }

  const data = await response.json();
  return {
    characteristics: {
      ...data.characteristics,
      extractedAt: characteristics.extractedAt, // preserve original timestamp
    },
    prompts: data.prompts,
  };
}

/**
 * Convert any image File → PNG base64 via Canvas.
 * Resizes to fit maxDim while preserving aspect ratio.
 * (Duplicated from styleAnalyzer.ts to keep this module self-contained;
 * could be moved to shared util later.)
 */
async function convertToPngBase64(file: File, maxDim: number): Promise<string> {
  const dataUrl = await fileToDataUrl(file);
  const img = await loadImage(dataUrl);

  let { width, height } = img;
  if (width > maxDim || height > maxDim) {
    const ratio = Math.min(maxDim / width, maxDim / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.drawImage(img, 0, 0, width, height);

  const pngDataUrl = canvas.toDataURL('image/png');
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
