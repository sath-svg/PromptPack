/**
 * Image Generation Handler: Calls OpenAI DALL-E 3 directly (better
 * quality than Gemini Flash Image, well-documented, $0.04/image standard).
 * Integrates with credit system (reserve → call → settle).
 *
 * Falls back to OpenRouter Gemini if OPENAI_API_KEY not configured.
 *
 * Route: POST /generate-images
 * Body: { prompt, count, userId, quality? }
 * Response: { images: [base64...], creditsCharged }
 */

import {
  reserveCredits,
  settleCredits,
  releaseCredits,
  reserveErrorResponse,
  creditsHeaders,
  CREDIT_USD_VALUE,
} from "./credits";

interface ImageGenEnv {
  CONVEX_URL: string;
  OPENROUTER_API_KEY: string;
  OPENAI_API_KEY?: string; // Optional — DALL-E 3 direct
  SKILLSET_INTERNAL_KEY: string;
}

interface ImageGenRequest {
  prompt: string;
  count: number;             // 1-3
  userId: string;
  quality?: "standard" | "hd"; // DALL-E 3 only. Default: standard ($0.04/img). HD = $0.08.
}

interface ImageGenResponse {
  images: string[]; // base64 encoded
  creditsCharged: number;
}

// OpenRouter image-output model fallback chain (per OpenRouter docs).
// Try in order — first model with available endpoints wins.
// OpenRouter's "No endpoints found" 404 means model listed but no
// active provider routes requests. Fallback covers provider outages
// and version churn on Google's side.
const IMAGE_MODEL_FALLBACK: string[] = [
  "google/gemini-2.5-flash-image",          // production, cheap, fast
  "google/gemini-3.1-flash-image-preview",  // newer, supports extended aspect ratios
  "black-forest-labs/flux.2-flex",          // different provider fallback
];

function jsonResponse(payload: unknown, status: number, headers?: HeadersInit): Response {
  const h = new Headers(headers);
  h.set("Content-Type", "application/json");
  return new Response(JSON.stringify(payload), { status, headers: h });
}

/**
 * Extract base64 image data from OpenRouter chat response.
 * Image-output models return images in choices[0].message.images[]
 * where each image has image_url.url = "data:image/png;base64,..."
 */
function extractImageBase64(llmData: any): string | null {
  const message = llmData.choices?.[0]?.message;
  const imagesArr = message?.images;

  if (Array.isArray(imagesArr) && imagesArr.length > 0) {
    const url = imagesArr[0]?.image_url?.url;
    if (typeof url === "string" && url.startsWith("data:")) {
      // Strip "data:image/png;base64," prefix
      const commaIdx = url.indexOf(",");
      if (commaIdx > 0) return url.slice(commaIdx + 1);
    }
  }

  return null;
}

export async function handleImageGen(
  request: Request,
  env: ImageGenEnv
): Promise<Response> {
  if (request.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  let body: ImageGenRequest;
  try {
    body = (await request.json()) as ImageGenRequest;
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  if (!body.prompt || !body.userId || !body.count) {
    return jsonResponse({ error: "missing_fields" }, 400);
  }

  if (body.count < 1 || body.count > 3) {
    return jsonResponse({ error: "count_must_be_1_to_3" }, 400);
  }

  // Estimate credits.
  // DALL-E 3 standard: $0.04/image → ~8 credits ($0.04 / $0.005)
  // DALL-E 3 HD: $0.08/image → ~16 credits
  // Gemini fallback: ~8 credits/image
  const useOpenAI = !!env.OPENAI_API_KEY;
  const quality = body.quality ?? "standard";
  const perImageCredits = useOpenAI && quality === "hd" ? 16 : 8;
  const estimatedCredits = body.count * perImageCredits;
  const modelLabel = useOpenAI ? `openai/dall-e-3-${quality}` : IMAGE_MODEL_FALLBACK[0];

  const reserve = await reserveCredits(env, body.userId, estimatedCredits, modelLabel);

  if (!reserve.ok) {
    return reserveErrorResponse(reserve);
  }

  const holdId = reserve.data.holdId;

  try {
    const images: string[] = [];
    let totalCostUsd = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    // Path 1: OpenAI DALL-E 3 direct (preferred — better quality)
    if (useOpenAI) {
      // DALL-E 3 only supports n=1; loop for count
      for (let i = 0; i < body.count; i++) {
        const resp = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt: body.prompt.slice(0, 4000), // DALL-E 3 limit: 4000 chars
            n: 1,
            size: "1024x1024",
            quality, // "standard" | "hd"
            response_format: "b64_json",
          }),
        });

        if (!resp.ok) {
          const errText = await resp.text();
          await releaseCredits(env, holdId, "openai_dalle_failed");

          // Detect content policy violation — return clean structured error
          // so client can show user-friendly message + suggestion.
          const isContentPolicy = /content_policy|safety_system|safety system/i.test(errText);
          if (isContentPolicy) {
            return jsonResponse(
              {
                error: "content_policy_violation",
                userMessage:
                  "OpenAI's safety filter rejected this prompt. DALL-E 3 blocks violence (slay, kill, fight), weapons, gore, sexual content, and depictions of real public figures.",
                suggestion:
                  "Try softer wording. Example: 'slaying a dragon' → 'battling a dragon', 'standing victorious over a defeated dragon', 'with a dragon in the background'. Or remove the conflict and describe a scene instead.",
              },
              400
            );
          }

          return jsonResponse(
            { error: "openai_dalle_failed", details: errText.slice(0, 500), status: resp.status },
            resp.status
          );
        }

        const data = (await resp.json()) as any;
        const b64 = data?.data?.[0]?.b64_json;
        if (!b64) {
          await releaseCredits(env, holdId, "no_image_data");
          return jsonResponse({ error: "no_image_data" }, 500);
        }
        images.push(b64);

        // Add per-image cost ($0.04 std / $0.08 HD)
        totalCostUsd += quality === "hd" ? 0.08 : 0.04;

        // DALL-E 3 rate limit: spacing helps avoid 429
        if (i < body.count - 1) {
          await new Promise((r) => setTimeout(r, 500));
        }
      }

      const settled = await settleCredits(env, holdId, totalCostUsd, 0, 0);
      const responseBody: ImageGenResponse = {
        images,
        creditsCharged: settled?.actualCredits ?? estimatedCredits,
      };
      return jsonResponse(responseBody, 200, creditsHeaders(settled, undefined));
    }

    // Path 2: Gemini fallback via OpenRouter (only if OPENAI_API_KEY missing)
    let chosenModel: string | null = null;
    const failedModels: Array<{ model: string; status: number; error: string }> = [];

    for (let i = 0; i < body.count; i++) {
      let success = false;
      let lastError = "";

      // Try fallback models in order until one works
      for (const model of IMAGE_MODEL_FALLBACK) {
        // Skip models we already know fail
        if (failedModels.some((f) => f.model === model)) continue;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: "user",
                content: body.prompt,
              },
            ],
            // Modalities depend on model: Gemini outputs image+text,
            // Flux/Sourceful are image-only. Per OpenRouter docs.
            modalities:
              model.includes("flux") || model.includes("sourceful")
                ? ["image"]
                : ["image", "text"],
            usage: { include: true },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          // 404 = "No endpoints found" — try next model
          if (response.status === 404) {
            failedModels.push({ model, status: 404, error: errorText.slice(0, 200) });
            lastError = errorText.slice(0, 300);
            continue;
          }
          // Other errors: bail out
          await releaseCredits(env, holdId, "image_gen_failed");
          return jsonResponse(
            {
              error: "image_gen_failed",
              model,
              status: response.status,
              details: errorText.slice(0, 500),
            },
            response.status
          );
        }

        const data = (await response.json()) as any;
        const b64 = extractImageBase64(data);

        if (!b64) {
          // Model returned text instead of image — try next model
          failedModels.push({ model, status: 200, error: "no_image_in_response" });
          lastError = "no_image_in_response";
          continue;
        }

        images.push(b64);
        chosenModel = model;
        success = true;

        if (typeof data.usage?.cost === "number") {
          totalCostUsd += data.usage.cost;
        }
        totalInputTokens += data.usage?.prompt_tokens ?? 0;
        totalOutputTokens += data.usage?.completion_tokens ?? 0;
        break;
      }

      if (!success) {
        await releaseCredits(env, holdId, "all_models_failed");
        return jsonResponse(
          {
            error: "all_image_models_unavailable",
            triedModels: IMAGE_MODEL_FALLBACK,
            failures: failedModels,
            lastError,
          },
          503
        );
      }

      // Small delay between calls (avoid rate limits)
      if (i < body.count - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    // Fall back to estimated cost if OpenRouter didn't return it
    const actualCostUsd =
      totalCostUsd > 0 ? totalCostUsd : estimatedCredits * CREDIT_USD_VALUE;

    const settled = await settleCredits(
      env,
      holdId,
      actualCostUsd,
      totalInputTokens,
      totalOutputTokens
    );

    const responseBody: ImageGenResponse = {
      images,
      creditsCharged: settled?.actualCredits ?? estimatedCredits,
    };

    return jsonResponse(responseBody, 200, creditsHeaders(settled, undefined));
  } catch (err) {
    await releaseCredits(env, holdId, "internal_error");
    console.error("[imagegen] error:", err);
    return jsonResponse(
      {
        error: "internal_error",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      500
    );
  }
}
