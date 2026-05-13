/**
 * Style Analysis Handler v2: Uses Claude Vision (via OpenRouter) to extract
 * artistic style with maximum mimicry fidelity.
 *
 * Methodology (research-backed, see plan):
 *   - 6 core dimensions: line work, color palette, shading, texture,
 *     composition, signature elements
 *   - Specificity rule: measurements (1-2pt), exact hex codes, named
 *     techniques (cel-shading) — not vague ("soft", "warm")
 *   - Cross-image extraction: COMMON style only, ignore content of
 *     individual images
 *   - {subject} placeholder template — isolates style from content,
 *     reusable across diverse subjects
 *   - Negative prompt — explicit "what this style is NOT"
 *
 * Route: POST /style-analysis
 * Body: { images: [{base64, mediaType}], userDescription, userId }
 * Response: StyleAnalysisResponse (richer schema, see interface below)
 */

import {
  reserveCredits,
  settleCredits,
  releaseCredits,
  reserveErrorResponse,
  creditsHeaders,
  CREDIT_USD_VALUE,
} from "./credits";

interface StyleAnalysisEnv {
  CONVEX_URL: string;
  OPENROUTER_API_KEY: string;
  SKILLSET_INTERNAL_KEY: string;
}

interface ImageData {
  base64: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp";
}

interface StyleAnalysisRequest {
  images: ImageData[];
  userDescription: string;
  userId: string;
}

// A single style-derived prompt. Skillset is a SET of these covering
// different generation purposes (image, video, character, setting, mood).
interface SkillPrompt {
  id: string;            // "image" | "video" | "character" | "setting" | "mood" | custom
  label: string;         // "Image Generation"
  purpose: string;       // "Use with DALL-E, Gemini, Midjourney for static images"
  icon: string;          // emoji
  template: string;      // "{subject}, drawn in chibi style with..."
  negativePrompt: string;
}

interface StyleAnalysisResponse {
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
  // Skillset = set of prompts derived from the same style.
  // Default 5 covering primary gen surfaces: image, video, character, setting, mood.
  prompts: SkillPrompt[];
  fullStyleDescription: string;
}

function jsonResponse(payload: unknown, status: number, headers?: HeadersInit): Response {
  const h = new Headers(headers);
  h.set("Content-Type", "application/json");
  return new Response(JSON.stringify(payload), { status, headers: h });
}

export async function handleStyleAnalysis(
  request: Request,
  env: StyleAnalysisEnv
): Promise<Response> {
  if (request.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  let body: StyleAnalysisRequest;
  try {
    body = (await request.json()) as StyleAnalysisRequest;
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  if (!body.images || body.images.length === 0) {
    return jsonResponse({ error: "no_images_provided" }, 400);
  }
  if (!body.userDescription || !body.userId) {
    return jsonResponse({ error: "missing_fields" }, 400);
  }

  // Reserve credits for Claude Vision analysis.
  // v3: output now generates 5 prompts (image, video, character, setting, mood)
  // → larger response, bump credits. 35cr buffer covers vision-heavy
  // inputs (large reference images) so settle rarely shortfalls.
  const estimatedCredits = 35;
  const reserve = await reserveCredits(env, body.userId, estimatedCredits, "anthropic/claude-haiku-4-5");

  if (!reserve.ok) {
    return reserveErrorResponse(reserve);
  }

  const holdId = reserve.data.holdId;

  try {
    // Build Vision message (OpenAI-compat format, OpenRouter normalizes per provider)
    const imageContent = body.images.map((img) => ({
      type: "image_url" as const,
      image_url: {
        url: `data:${img.mediaType};base64,${img.base64}`,
      },
    }));

    // v2 extraction prompt — research-backed framework
    // Critical: forces specificity (measurements, hex codes, named techniques)
    // and {subject} placeholder for reusable style template
    const extractionInstructions = `You are an expert art-style analyst. Analyze ${body.images.length} reference image(s) from an artist who describes their style as: "${body.userDescription}"

CRITICAL RULES:
1. Extract COMMON style elements ACROSS all images. IGNORE specific content/subjects of individual images.
2. Use MEASURABLE SPECIFICS, not vague descriptors:
   ❌ "soft lines" → ✅ "1-2pt clean uniform digital lines, sharp edges"
   ❌ "warm palette" → ✅ "6 pastel colors: #FFB6C1 dominant, #E6E6FA accent, warm temperature"
   ❌ "smooth shading" → ✅ "cel-shading with soft single gradient, top-left light, low intensity"
3. Output ONLY raw JSON. No markdown code fences. No prose before/after.

Extract these dimensions:

**lineWork** — How lines are drawn:
- thickness: e.g. "1-2pt clean uniform" or "2-4pt varied tapered"
- edges: "sharp clean digital" / "soft graphite" / "textured ink"
- consistency: "consistent throughout" / "varied weight by depth"

**colorPalette** — Estimate dominant colors as hex codes by VISUAL inspection:
- hexCodes: array of 4-8 actual hex colors visible in the images (e.g. ["#FFB6C1", "#E6E6FA"])
- count: number of distinct colors
- temperature: "warm pastel" / "cool muted" / "high-contrast vivid"
- dominant: name of the most-used color (e.g. "soft pink")
- accents: 2-3 accent color names

**shading** — How depth/light is rendered:
- technique: NAMED method — "cel-shading" / "soft gradient" / "cross-hatching" / "stippling" / "flat no shading" / "airbrushed"
- lightDirection: "top-left soft fill" / "bottom-up dramatic" / "ambient flat"
- intensity: "low contrast gentle" / "high contrast dramatic"

**texture** — Surface treatment:
- medium: "digital illustration" / "oil paint impasto" / "watercolor wash" / "vector flat"
- scale: "smooth no visible texture" / "fine grain" / "large visible brushstrokes"
- density: "minimal" / "uniform" / "concentrated in shadows"

**composition** — Recurring framing:
- framing: "centered character with reference sheet layout" / "rule-of-thirds wide shot"
- perspective: "frontal flat 2D" / "3/4 view with mild depth" / "isometric"

**signatureElements** — 3-6 SPECIFIC recurring quirks unique to this artist (these are KEY to mimicry):
- e.g. "large round eyes with star-shaped highlights"
- e.g. "exaggerated chibi proportions, oversized head 1:2 with body"
- e.g. "heart-shaped mouth on cheerful expressions"
- e.g. "soft pink blush circles on cheeks"

**prompts** — A SKILLSET is a SET of style-locked prompts for different generation surfaces. Generate ALL 5 below. Each MUST start with literal "{subject}" placeholder and describe ONLY style (no specific content from reference images). Each has its own focused negative prompt.

Required prompts (use exactly these ids, labels, icons, purposes):

1. id="image", label="Image Generation", icon="🖼️", purpose="Use with DALL-E 3, Gemini, Midjourney, Stable Diffusion for static images"
   - template: Comprehensive style prompt (line work + palette w/ hex + shading + texture + composition + signature elements)

2. id="video", label="Video Generation", icon="🎬", purpose="Use with Sora, Runway, Veo, Kling for animated clips"
   - template: Same style descriptors PLUS motion cues — "smooth fluid motion in {style}", frame-rate hint, animation feel (anime cel motion / hand-drawn rotoscope / etc.)

3. id="character", label="Character/Portrait Prompt", icon="👤", purpose="Generate figures, faces, character designs in this style"
   - template: Emphasizes anatomy + face details + signature character traits (eye style, proportions, hair, expression patterns)

4. id="setting", label="Setting/Background Prompt", icon="🏞️", purpose="Generate environments, scenes, backgrounds without focal characters"
   - template: Emphasizes composition + lighting + depth + environmental texture in this style. Skip character-specific signatures.

5. id="mood", label="Mood/Atmosphere Prompt", icon="✨", purpose="Apply tonal/lighting overlay — pair with content generated separately"
   - template: Pure atmosphere descriptors — palette + lighting + emotional tone + texture quality. No anatomy or composition rules.

Each prompt's negativePrompt is comma-separated and tailored — e.g. video adds "static, frozen, choppy"; character adds "deformed, extra limbs, wrong proportions"; setting adds "people, faces, characters".

**fullStyleDescription** — One-paragraph human-readable summary of the style (backup for display).

OUTPUT EXACTLY this JSON shape (no other keys, no markdown):
{
  "lineWork": { "thickness": "...", "edges": "...", "consistency": "..." },
  "colorPalette": { "hexCodes": ["#..."], "count": 6, "temperature": "...", "dominant": "...", "accents": ["..."] },
  "shading": { "technique": "...", "lightDirection": "...", "intensity": "..." },
  "texture": { "medium": "...", "scale": "...", "density": "..." },
  "composition": { "framing": "...", "perspective": "..." },
  "signatureElements": ["...", "..."],
  "prompts": [
    { "id": "image", "label": "Image Generation", "icon": "🖼️", "purpose": "...", "template": "{subject}, ...", "negativePrompt": "..." },
    { "id": "video", "label": "Video Generation", "icon": "🎬", "purpose": "...", "template": "{subject}, ...", "negativePrompt": "..." },
    { "id": "character", "label": "Character/Portrait Prompt", "icon": "👤", "purpose": "...", "template": "{subject}, ...", "negativePrompt": "..." },
    { "id": "setting", "label": "Setting/Background Prompt", "icon": "🏞️", "purpose": "...", "template": "{subject}, ...", "negativePrompt": "..." },
    { "id": "mood", "label": "Mood/Atmosphere Prompt", "icon": "✨", "purpose": "...", "template": "{subject}, ...", "negativePrompt": "..." }
  ],
  "fullStyleDescription": "..."
}`;

    const messages = [
      {
        role: "user" as const,
        content: [
          ...imageContent,
          { type: "text" as const, text: extractionInstructions },
        ],
      },
    ];

    // Claude Haiku 4.5: vision-capable, cheap, fast — sweet spot for style analysis
    const llmResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "anthropic/claude-haiku-4-5",
        messages,
        max_tokens: 4096, // v3: 5 prompts in output → much larger JSON
        temperature: 0.4, // lower temp for more deterministic structured output
        usage: { include: true },
      }),
    });

    if (!llmResponse.ok) {
      const error = await llmResponse.text();
      await releaseCredits(env, holdId, "claude_failed");
      return jsonResponse(
        { error: "claude_failed", details: error },
        llmResponse.status
      );
    }

    const llmData = (await llmResponse.json()) as any;
    const responseText: string = llmData.choices?.[0]?.message?.content || "";

    // Strip markdown code fences if present
    let cleanedText = responseText.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.slice(7);
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.slice(3);
    }
    if (cleanedText.endsWith("```")) {
      cleanedText = cleanedText.slice(0, -3);
    }
    cleanedText = cleanedText.trim();

    let analysisResult: StyleAnalysisResponse;
    try {
      analysisResult = JSON.parse(cleanedText) as StyleAnalysisResponse;
    } catch {
      await releaseCredits(env, holdId, "invalid_json_response");
      return jsonResponse(
        { error: "invalid_response_format", raw: responseText },
        500
      );
    }

    // Validate required fields exist (defensive — Claude could omit fields)
    if (!analysisResult.prompts || !Array.isArray(analysisResult.prompts) || analysisResult.prompts.length === 0) {
      await releaseCredits(env, holdId, "incomplete_analysis");
      return jsonResponse(
        { error: "incomplete_analysis_no_prompts", raw: responseText },
        500
      );
    }
    if (!analysisResult.lineWork || !analysisResult.colorPalette) {
      await releaseCredits(env, holdId, "incomplete_analysis");
      return jsonResponse(
        { error: "incomplete_analysis", raw: responseText },
        500
      );
    }

    // Force {subject} placeholder on every prompt if Claude forgot
    analysisResult.prompts = analysisResult.prompts.map((p) => ({
      ...p,
      template: p.template.includes("{subject}") ? p.template : `{subject}, ${p.template}`,
    }));

    // Settle credits using actual OpenRouter cost
    const inputTokens = llmData.usage?.prompt_tokens ?? 0;
    const outputTokens = llmData.usage?.completion_tokens ?? 0;
    const actualCostUsd: number =
      typeof llmData.usage?.cost === "number"
        ? llmData.usage.cost
        : estimatedCredits * CREDIT_USD_VALUE;

    const settled = await settleCredits(env, holdId, actualCostUsd, inputTokens, outputTokens);

    return jsonResponse(
      analysisResult,
      200,
      creditsHeaders(settled, undefined, {
        promptTokens: inputTokens,
        completionTokens: outputTokens,
        totalTokens: llmData.usage?.total_tokens,
      })
    );
  } catch (err) {
    await releaseCredits(env, holdId, "internal_error");
    console.error("[style-analysis] error:", err);
    return jsonResponse(
      {
        error: "internal_error",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      500
    );
  }
}
