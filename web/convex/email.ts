"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";

const FROM_EMAIL = "PromptPack <support@pmtpk.com>";
const REPLY_TO = "support@pmtpk.com";
const SUBJECT = "Welcome to PromptPack!";

const CLIP_BASE = "https://image.pmtpk.com/img";
const CLIPS = {
  enhance: `${CLIP_BASE}/clip-output-styles.mp4`,
  save: `${CLIP_BASE}/clip-save.mp4`,
  quickSelect: `${CLIP_BASE}/clip-quick-select.mp4`,
  saveFromInput: `${CLIP_BASE}/clip-save-from-input.mp4`,
  organize: `${CLIP_BASE}/clip-organize.mp4`,
  platforms: `${CLIP_BASE}/clip-platforms.mp4`,
};
// Fallback images for email clients that don't support <video>
const IMAGES = {
  enhance: `${CLIP_BASE}/Enhance-save.jpg`,
  quickSelect: `${CLIP_BASE}/Quick-Select.jpg`,
  saveFromInput: `${CLIP_BASE}/Save-from-input-box.jpg`,
  organize: `${CLIP_BASE}/Organize.jpg`,
  platforms: `${CLIP_BASE}/LLMs.jpg`,
};

function buildWelcomeEmailHtml(): string {
  const themeLight = {
    background: "#f3f4f6",
    foreground: "#0f172a",
    card: "#ffffff",
    muted: "#4b5563",
    border: "rgba(15, 23, 42, 0.1)",
    primary: "#4f46e5",
  };

  const themeDark = {
    background: "#0a0a0a",
    foreground: "#ededed",
    card: "#1a1a1a",
    muted: "#d1d5db",
    border: "rgba(255, 255, 255, 0.1)",
    primary: "#6366f1",
  };

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light dark" />
    <meta name="supported-color-schemes" content="light dark" />
    <title>Welcome to PromptPack</title>
    <style>
      :root {
        color-scheme: light dark;
        supported-color-schemes: light dark;
      }
      @media (max-width: 600px) {
        .container {
          width: 100% !important;
        }
      }
      @media (prefers-color-scheme: dark) {
        body,
        .email-body,
        .email-shell,
        .email-content {
          background-color: ${themeDark.background} !important;
          color: ${themeDark.foreground} !important;
        }
        .email-card {
          background-color: ${themeDark.card} !important;
          border-color: ${themeDark.border} !important;
        }
        .email-muted {
          color: ${themeDark.muted} !important;
        }
        .email-foreground {
          color: ${themeDark.foreground} !important;
        }
        .email-button-primary {
          background-color: ${themeDark.primary} !important;
        }
        .email-divider {
          background: linear-gradient(90deg, ${themeDark.primary}, #8b5cf6) !important;
        }
      }
    </style>
  </head>
  <body bgcolor="${themeLight.background}" style="margin:0;padding:0;background-color:${themeLight.background};color:${themeLight.foreground};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Ubuntu,'Helvetica Neue',Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;">
      Welcome to PromptPack — save, enhance, and reuse your best prompts.
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${themeLight.background}" class="email-body" style="background-color:${themeLight.background};padding:24px 0;">
      <tr>
        <td align="center" bgcolor="${themeLight.background}" class="email-shell" style="background-color:${themeLight.background};">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" class="container email-content" bgcolor="${themeLight.background}" style="width:600px;max-width:600px;background-color:${themeLight.background};">
            <!-- Logo -->
            <tr>
              <td style="padding:24px 16px 8px;">
                <img src="https://pmtpk.com/img/promptpack_logo_horizontal.png" alt="PromptPack" width="220" style="display:block;border:0;outline:none;text-decoration:none;height:auto;" />
              </td>
            </tr>
            <!-- Gradient divider -->
            <tr>
              <td style="padding:0 16px 16px;">
                <div class="email-divider" style="height:3px;background:linear-gradient(90deg,${themeLight.primary},#8b5cf6);border-radius:999px;"></div>
              </td>
            </tr>
            <!-- Header -->
            <tr>
              <td style="padding:0 16px 16px;">
                <h1 class="email-foreground" style="margin:0 0 8px;font-size:26px;line-height:1.3;color:${themeLight.foreground};">
                  Welcome to PromptPack!
                </h1>
                <p class="email-muted" style="margin:0;font-size:16px;line-height:1.6;color:${themeLight.muted};">
                  Thanks for signing up! Here's what you can do with PromptPack.
                </p>
              </td>
            </tr>

            <!-- Add to Chrome -->
            <tr>
              <td align="center" style="padding:0 16px 24px;">
                <a href="https://chromewebstore.google.com/detail/promptpack/ajfgnekiofhiblifmiimnlmcnfhibnbl" target="_blank" style="display:inline-block;text-decoration:none;">
                  <img src="https://image.pmtpk.com/img/Chrome..png" alt="Add to Chrome" width="200" style="display:block;border:0;height:auto;" />
                </a>
              </td>
            </tr>

            <!-- Feature 1: Enhance & Save -->
            <tr>
              <td style="padding:0 16px 16px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${themeLight.card}" class="email-card" style="background-color:${themeLight.card};border:1px solid ${themeLight.border};border-radius:12px;overflow:hidden;">
                  <tr>
                    <td>
                      <video autoplay loop muted playsinline width="568" style="width:100%;height:auto;display:block;">
                        <source src="${CLIPS.enhance}" type="video/mp4">
                        <img src="${IMAGES.enhance}" alt="Enhance & Save" width="568" style="width:100%;height:auto;display:block;border:0;" />
                      </video>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:16px 20px;">
                      <h3 class="email-foreground" style="margin:0 0 8px;font-size:16px;color:${themeLight.foreground};">Enhance & Save</h3>
                      <p class="email-muted" style="margin:0;font-size:14px;line-height:1.6;color:${themeLight.muted};">The floating bubble appears beside the prompt box with options to enhance your prompt using AI (Structured, Clarity, Concise, or Strict modes) and a Save button to capture prompts instantly.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Feature 3: Quick Select -->
            <tr>
              <td style="padding:0 16px 16px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${themeLight.card}" class="email-card" style="background-color:${themeLight.card};border:1px solid ${themeLight.border};border-radius:12px;overflow:hidden;">
                  <tr>
                    <td>
                      <video autoplay loop muted playsinline width="568" style="width:100%;height:auto;display:block;">
                        <source src="${CLIPS.quickSelect}" type="video/mp4">
                        <img src="${IMAGES.quickSelect}" alt="Quick Select" width="568" style="width:100%;height:auto;display:block;border:0;" />
                      </video>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:16px 20px;">
                      <h3 class="email-foreground" style="margin:0 0 8px;font-size:16px;color:${themeLight.foreground};">Quick Select</h3>
                      <p class="email-muted" style="margin:0;font-size:14px;line-height:1.6;color:${themeLight.muted};">Right-click in the prompt box to open the Quick Select menu. Instantly select and insert any saved prompt from your PromptPacks without leaving your chat.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Feature 4: Save from Input Box -->
            <tr>
              <td style="padding:0 16px 16px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${themeLight.card}" class="email-card" style="background-color:${themeLight.card};border:1px solid ${themeLight.border};border-radius:12px;overflow:hidden;">
                  <tr>
                    <td>
                      <video autoplay loop muted playsinline width="568" style="width:100%;height:auto;display:block;">
                        <source src="${CLIPS.saveFromInput}" type="video/mp4">
                        <img src="${IMAGES.saveFromInput}" alt="Save from Input Box" width="568" style="width:100%;height:auto;display:block;border:0;" />
                      </video>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:16px 20px;">
                      <h3 class="email-foreground" style="margin:0 0 8px;font-size:16px;color:${themeLight.foreground};">Save from Input Box</h3>
                      <p class="email-muted" style="margin:0;font-size:14px;line-height:1.6;color:${themeLight.muted};">Save prompts directly from AI responses. Click the PromptPack icon next to the copy button to save any message to your library instantly.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Feature 5: Organize -->
            <tr>
              <td style="padding:0 16px 16px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${themeLight.card}" class="email-card" style="background-color:${themeLight.card};border:1px solid ${themeLight.border};border-radius:12px;overflow:hidden;">
                  <tr>
                    <td>
                      <video autoplay loop muted playsinline width="568" style="width:100%;height:auto;display:block;">
                        <source src="${CLIPS.organize}" type="video/mp4">
                        <img src="${IMAGES.organize}" alt="Organize" width="568" style="width:100%;height:auto;display:block;border:0;" />
                      </video>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:16px 20px;">
                      <h3 class="email-foreground" style="margin:0 0 8px;font-size:16px;color:${themeLight.foreground};">Organize</h3>
                      <p class="email-muted" style="margin:0;font-size:14px;line-height:1.6;color:${themeLight.muted};">The extension popup serves as your prompt library. View and manage all your saved prompts organized into PromptPacks, add custom headers, and keep everything structured.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Feature 6: Multi-LLM Support -->
            <tr>
              <td style="padding:0 16px 24px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${themeLight.card}" class="email-card" style="background-color:${themeLight.card};border:1px solid ${themeLight.border};border-radius:12px;overflow:hidden;">
                  <tr>
                    <td>
                      <video autoplay loop muted playsinline width="568" style="width:100%;height:auto;display:block;">
                        <source src="${CLIPS.platforms}" type="video/mp4">
                        <img src="${IMAGES.platforms}" alt="Multi-LLM Support" width="568" style="width:100%;height:auto;display:block;border:0;" />
                      </video>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:16px 20px;">
                      <h3 class="email-foreground" style="margin:0 0 8px;font-size:16px;color:${themeLight.foreground};">Multi-LLM Support</h3>
                      <p class="email-muted" style="margin:0;font-size:14px;line-height:1.6;color:${themeLight.muted};">PromptPack works with ChatGPT, Claude, and Gemini. The same enhance and save bubble adapts seamlessly to each platform's design.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Review Request -->
            <tr>
              <td style="padding:0 16px 24px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${themeLight.card}" class="email-card" style="background-color:${themeLight.card};border:1px solid ${themeLight.border};border-radius:12px;overflow:hidden;">
                  <tr>
                    <td style="padding:20px;text-align:center;">
                      <p class="email-foreground" style="margin:0 0 12px;font-size:16px;color:${themeLight.foreground};">Enjoying PromptPack?</p>
                      <p class="email-muted" style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${themeLight.muted};">Your review helps others discover PromptPack and keeps us motivated to build more features!</p>
                      <a href="https://chromewebstore.google.com/detail/promptpack/ajfgnekiofhiblifmiimnlmcnfhibnbl/reviews" target="_blank" style="display:inline-block;background-color:${themeLight.primary};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">Leave a Review ⭐</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- CTA -->
            <tr>
              <td align="center" style="padding:0 16px 24px;">
                <p class="email-muted" style="margin:0;font-size:14px;color:${themeLight.muted};">
                  <a href="https://pmtpk.com/dashboard" style="color:${themeLight.primary};text-decoration:underline;">Open Dashboard</a> · <a href="https://pmtpk.com/pricing" style="color:${themeLight.primary};text-decoration:underline;">Upgrade to Pro</a>
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:0 16px 32px;font-size:12px;color:#9ca3af;line-height:1.6;">
                <p style="margin:0 0 4px;">PromptPack Support</p>
                <p style="margin:8px 0 0;">
                  <a href="https://pmtpk.com" style="color:${themeLight.primary};text-decoration:none;">https://pmtpk.com</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export const sendWelcomeEmail = internalAction({
  args: {
    email: v.string(),
  },
  handler: async (_, { email }) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("RESEND_API_KEY not set, skipping welcome email");
      return { success: false, error: "RESEND_API_KEY not configured" };
    }

    const html = buildWelcomeEmailHtml();

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: email,
        subject: SUBJECT,
        html,
        reply_to: REPLY_TO,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Failed to send welcome email:", error);
      return { success: false, error };
    }

    const data = await response.json();
    console.log(`Welcome email sent to ${email}. Id: ${data.id}`);
    return { success: true, id: data.id };
  },
});
