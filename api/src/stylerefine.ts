/**
 * Style Refine Handler: Takes existing style characteristics + prompts +
 * artist's natural-language feedback ("colors too saturated, lines too thick")
 * and returns updated characteristics + prompts incorporating the feedback.
 *
 * Uses Claude Haiku (no vision needed — just text).
 *
 * Route: POST /style-refine
 * Body: { characteristics, prompts, feedback, userId }
 * Response: { characteristics, prompts }
 */

import {
  reserveCredits,
  settleCredits,
  releaseCredits,
  reserveErrorResponse,
  creditsHeaders,
  CREDIT_USD_VALUE,
} from "./credits";

interface StyleRefineEnv {
  CONVEX_URL: string;
  OPENROUTER_API_KEY: string;
  SKILLSET_INTERNAL_KEY: string;
}

interface FeedbackImage {
  base64: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp";
}

interface StyleRefineRequest {
  characteristics: any;
  prompts: any[];
  feedback: string;
  userId: string;
  images?: FeedbackImage[]; // optional reference images for visual feedback
}

function jsonResponse(payload: unknown, status: number, headers?: HeadersInit): Response {
  const h = new Headers(headers);
  h.set("Content-Type", "application/json");
  return new Response(JSON.stringify(payload), { status, headers: h });
}

export async function handleStyleRefine(
  request: Request,
  env: StyleRefineEnv
): Promise<Response> {
  if (request.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  let body: StyleRefineRequest;
  try {
    body = (await request.json()) as StyleRefineRequest;
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  // Either feedback text OR images required (one or both)
  if (!body.characteristics || !body.prompts || !body.userId) {
    return jsonResponse({ error: "missing_fields" }, 400);
  }
  const hasText = !!(body.feedback && body.feedback.trim());
  const hasImages = Array.isArray(body.images) && body.images.length > 0;
  if (!hasText && !hasImages) {
    return jsonResponse({ error: "feedback_or_images_required" }, 400);
  }

  // Vision adds tokens — bump credit estimate when images present.
  // Buffered above expected upstream so settle refunds rather than shortfalls.
  const estimatedCredits = hasImages ? 18 : 12;
  const reserve = await reserveCredits(env, body.userId, estimatedCredits, "anthropic/claude-haiku-4-5");
  if (!reserve.ok) return reserveErrorResponse(reserve);
  const holdId = reserve.data.holdId;

  try {
    const refineInstructions = `You are an expert art-style analyst. An artist has reviewed AI-generated previews of their style and provided feedback${hasImages ? " (including reference images attached above)" : ""}. Update the existing style characteristics and skillset prompts to address the feedback.

CURRENT STYLE:
${JSON.stringify(body.characteristics, null, 2)}

CURRENT PROMPTS:
${JSON.stringify(body.prompts, null, 2)}

ARTIST FEEDBACK (text):
${hasText ? `"${body.feedback}"` : "(none — see attached reference images)"}

${hasImages ? "REFERENCE IMAGES: The artist has attached image(s) showing the corrections they want. ANALYZE these images carefully — they represent corrections or additional style samples. Identify what differs from the current style data (different palette? line weight? shading? composition?) and update the style + prompts to MATCH the attached images." : ""}

INSTRUCTIONS:
1. Identify which dimensions the feedback targets (line work, palette, shading, texture, composition, signature elements, prompts).
   ${hasImages ? "Cross-reference both the text feedback AND the visual evidence from attached images." : ""}
2. Modify ONLY the targeted dimensions. Leave other dimensions unchanged.
3. Be specific — if feedback says "colors too saturated", reduce saturation in palette descriptions, change hex codes if needed, update prompts to say "muted" / "desaturated".
   ${hasImages ? "Extract exact hex codes from attached images when palette is affected." : ""}
4. If feedback targets prompts directly, update prompt templates to incorporate the change.
5. Keep the SAME schema. Same keys. Same number of prompts. Same prompt ids.
6. Keep "{subject}" placeholder in every prompt template.
7. Output ONLY raw JSON. No markdown.

OUTPUT EXACTLY this shape:
{
  "characteristics": { ... same keys as input characteristics ... },
  "prompts": [ ... same length & ids as input prompts ... ]
}`;

    // Build messages — multimodal if images attached, text-only otherwise
    const userContent: any[] = [];
    if (hasImages) {
      for (const img of body.images!) {
        userContent.push({
          type: "image_url",
          image_url: { url: `data:${img.mediaType};base64,${img.base64}` },
        });
      }
    }
    userContent.push({ type: "text", text: refineInstructions });

    const messages = hasImages
      ? [{ role: "user", content: userContent }]
      : [{ role: "user", content: refineInstructions }];

    const llmResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "anthropic/claude-haiku-4-5",
        messages,
        max_tokens: 4096,
        temperature: 0.4,
        usage: { include: true },
      }),
    });

    if (!llmResponse.ok) {
      const error = await llmResponse.text();
      await releaseCredits(env, holdId, "claude_failed");
      return jsonResponse({ error: "claude_failed", details: error }, llmResponse.status);
    }

    const llmData = (await llmResponse.json()) as any;
    const responseText: string = llmData.choices?.[0]?.message?.content || "";

    let cleaned = responseText.trim();
    if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
    else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
    if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
    cleaned = cleaned.trim();

    let parsed: { characteristics: any; prompts: any[] };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      await releaseCredits(env, holdId, "invalid_json_response");
      return jsonResponse({ error: "invalid_response_format", raw: responseText }, 500);
    }

    if (!parsed.characteristics || !Array.isArray(parsed.prompts)) {
      await releaseCredits(env, holdId, "incomplete_refine");
      return jsonResponse({ error: "incomplete_refine", raw: responseText }, 500);
    }

    // Force {subject} placeholder if Claude dropped it
    parsed.prompts = parsed.prompts.map((p: any) => ({
      ...p,
      template: p.template?.includes("{subject}") ? p.template : `{subject}, ${p.template ?? ""}`,
    }));

    const inputTokens = llmData.usage?.prompt_tokens ?? 0;
    const outputTokens = llmData.usage?.completion_tokens ?? 0;
    const actualCostUsd: number =
      typeof llmData.usage?.cost === "number"
        ? llmData.usage.cost
        : estimatedCredits * CREDIT_USD_VALUE;

    const settled = await settleCredits(env, holdId, actualCostUsd, inputTokens, outputTokens);

    return jsonResponse(parsed, 200, creditsHeaders(settled, undefined));
  } catch (err) {
    await releaseCredits(env, holdId, "internal_error");
    console.error("[style-refine] error:", err);
    return jsonResponse(
      { error: "internal_error", message: err instanceof Error ? err.message : "Unknown error" },
      500
    );
  }
}
