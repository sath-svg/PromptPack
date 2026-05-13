/**
 * Skillset Generator: Generates preview images using DALL-E 3
 * Supports both managed mode (credits) and BYOK mode (user's own API key)
 */

import { tauriFetch } from './tauriFetch';
import { WORKERS_API_URL } from './constants';

interface ImageGenerationRequest {
  /**
   * Style prompt template — must contain literal "{subject}" placeholder.
   * Example: "{subject}, drawn in chibi style with: 1-2pt lines..."
   */
  stylePromptTemplate: string;
  /**
   * Optional negative prompt — appended as "Avoid: <neg>".
   * Tells image gen what styles to NOT use.
   */
  negativePrompt?: string;
  /**
   * What the image should depict. Substituted into {subject} placeholder.
   * Example: "characters at a school", "a mountain landscape"
   */
  subject: string;
  userId: string;
  byokOpenAiKey?: string; // If provided, use BYOK mode
}

interface ImageGenerationResult {
  images: string[]; // Base64 encoded images
  costCredits: number;
}

/**
 * Build final image-gen prompt by substituting {subject} placeholder
 * and appending negative prompt. Style stays locked, content swaps cleanly.
 */
function buildFinalPrompt(template: string, subject: string, negative?: string): string {
  // Default subject if empty
  const subj = subject.trim() || 'a representative subject in the established style';
  // Substitute placeholder
  let prompt = template.replace(/\{subject\}/gi, subj);
  // If template was missing placeholder, prepend subject
  if (!template.toLowerCase().includes('{subject}')) {
    prompt = `${subj}, ${prompt}`;
  }
  // Append negative prompt
  if (negative && negative.trim()) {
    prompt += ` Avoid: ${negative.trim()}.`;
  }
  return prompt;
}

/**
 * Generate 3 images matching the artist's style
 * Uses managed mode by default (charges credits), BYOK if key provided
 */
export async function generateImages(
  request: ImageGenerationRequest
): Promise<ImageGenerationResult> {
  const finalPrompt = buildFinalPrompt(
    request.stylePromptTemplate,
    request.subject,
    request.negativePrompt
  );

  if (request.byokOpenAiKey) {
    return generateImagesViaByok(finalPrompt, request.byokOpenAiKey);
  } else {
    return generateImagesViaManaged(finalPrompt, request.userId);
  }
}

/**
 * Generate images via managed mode (Gemini 2.5 Flash Image via OpenRouter)
 */
async function generateImagesViaManaged(
  fullPrompt: string,
  userId: string
): Promise<ImageGenerationResult> {

  try {
    // Call Workers API which handles credit reservation, LLM call, and settlement
    const response = await tauriFetch(`${WORKERS_API_URL}/generate-images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        count: 3,
        userId,
      }),
    });

    if (!response.ok) {
      // Try to parse structured error from API
      let errBody: any = null;
      try {
        errBody = await response.json();
      } catch {
        errBody = { error: await response.text() };
      }

      // Throw a structured error with hints for UI to show targeted message
      const err: any = new Error(errBody.userMessage || errBody.error || 'Image generation failed');
      err.code = errBody.error;
      err.userMessage = errBody.userMessage;
      err.suggestion = errBody.suggestion;
      err.details = errBody.details;
      throw err;
    }

    const data = await response.json();

    return {
      images: data.images, // Array of base64 strings
      costCredits: data.creditsCharged || 30, // Typical cost
    };
  } catch (err) {
    console.error('Managed image generation failed:', err);
    throw err;
  }
}

/**
 * Generate images via BYOK mode (user's OpenAI key).
 * Same prompt sent 3x — DALL-E 3 returns different variations per call.
 */
async function generateImagesViaByok(
  fullPrompt: string,
  byokKey: string
): Promise<ImageGenerationResult> {
  // DALL-E 3 only supports n=1, so call 3x with same prompt
  const prompts = [fullPrompt, fullPrompt, fullPrompt];

  const images: string[] = [];

  try {
    // Call DALL-E 3 API 3x (OpenAI limits to n=1 for DALL-E 3)
    for (const prompt of prompts) {
      const response = await fetch(
        'https://api.openai.com/v1/images/generations',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${byokKey}`,
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt,
            n: 1,
            size: '1024x1024',
            quality: 'standard',
            response_format: 'b64_json', // Return base64
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `DALL-E 3 failed: ${error.error?.message || 'Unknown error'}`
        );
      }

      const data = await response.json();
      if (data.data && data.data[0] && data.data[0].b64_json) {
        images.push(data.data[0].b64_json);
      } else {
        throw new Error('No image data in response');
      }

      // Rate limit: DALL-E 3 is 1 req/min
      if (images.length < prompts.length) {
        await new Promise((resolve) => setTimeout(resolve, 1100));
      }
    }

    return {
      images,
      costCredits: 0, // BYOK doesn't use credits
    };
  } catch (err) {
    console.error('BYOK image generation failed:', err);
    throw err;
  }
}
