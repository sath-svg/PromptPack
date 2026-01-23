import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Resend } from "resend";

// Recipients - pass email addresses as CLI arguments
const EMAIL_TO: string[] = process.argv.slice(2);
const FROM_EMAIL = "PromptPack <support@pmtpk.com>";
const REPLY_TO = "support@pmtpk.com";
const SUBJECT = "PromptPack 2.0.0 is here!";

// Email images hosted on R2 custom domain
const IMG_BASE = "https://image.pmtpk.com/img";
const IMAGES = {
  enhanceSave: `${IMG_BASE}/Enhance-save.jpg`,
  quickReplace: `${IMG_BASE}/Quick-Replace.jpg`,
  saveFromInput: `${IMG_BASE}/Save-from-input-box.jpg`,
  organize: `${IMG_BASE}/Organize.jpg`,
  llms: `${IMG_BASE}/LLMs.jpg`,
};

function loadEnvVar(key: string): string | undefined {
  if (process.env[key]) {
    return process.env[key];
  }

  try {
    const envPath = join(process.cwd(), ".env");
    const contents = readFileSync(envPath, "utf8");
    const line = contents
      .split(/\r?\n/)
      .find((row) => row.startsWith(`${key}=`));

    if (!line) {
      return undefined;
    }

    const value = line.slice(key.length + 1).trim();
    return value.replace(/^["']|["']$/g, "");
  } catch {
    return undefined;
  }
}

async function main() {
  const apiKey = loadEnvVar("RESEND_API_KEY");
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set. Add it to web/.env or your shell env.");
  }

  // Theme colors matching live-email
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

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light dark" />
    <meta name="supported-color-schemes" content="light dark" />
    <title>PromptPack 2.0.0 - New Features</title>
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
      PromptPack 2.0.0 is here — check out what's new.
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
                  2.0.0 is here 🎉
                </h1>
                <p class="email-muted" style="margin:0;font-size:16px;line-height:1.6;color:${themeLight.muted};">
                  Thank you for using PromptPack! We've listened to your feedback and added some great new features.
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
                      <img src="${IMAGES.enhanceSave}" alt="Enhance & Save" width="568" style="width:100%;height:auto;display:block;border:0;" />
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:16px 20px;">
                      <h3 class="email-foreground" style="margin:0 0 8px;font-size:16px;color:${themeLight.foreground};">Enhance & Save</h3>
                      <p class="email-muted" style="margin:0;font-size:14px;line-height:1.6;color:${themeLight.muted};">The floating bubble appears above the prompt box with options to enhance your prompt using AI (Structured, Clarity, Concise, or Strict modes) and a Save button to capture prompts instantly.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Feature 2: Quick Replace -->
            <tr>
              <td style="padding:0 16px 16px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${themeLight.card}" class="email-card" style="background-color:${themeLight.card};border:1px solid ${themeLight.border};border-radius:12px;overflow:hidden;">
                  <tr>
                    <td>
                      <img src="${IMAGES.quickReplace}" alt="Quick Replace" width="568" style="width:100%;height:auto;display:block;border:0;" />
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:16px 20px;">
                      <h3 class="email-foreground" style="margin:0 0 8px;font-size:16px;color:${themeLight.foreground};">Quick Replace</h3>
                      <p class="email-muted" style="margin:0;font-size:14px;line-height:1.6;color:${themeLight.muted};">Right-click in the prompt box to open the Quick Replace menu. Instantly select and insert any saved prompt from your PromptPacks without leaving your chat.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Feature 3: Save from AI Response -->
            <tr>
              <td style="padding:0 16px 16px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${themeLight.card}" class="email-card" style="background-color:${themeLight.card};border:1px solid ${themeLight.border};border-radius:12px;overflow:hidden;">
                  <tr>
                    <td>
                      <img src="${IMAGES.saveFromInput}" alt="Save from AI Response" width="568" style="width:100%;height:auto;display:block;border:0;" />
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:16px 20px;">
                      <h3 class="email-foreground" style="margin:0 0 8px;font-size:16px;color:${themeLight.foreground};">Save from AI Response</h3>
                      <p class="email-muted" style="margin:0;font-size:14px;line-height:1.6;color:${themeLight.muted};">Save prompts directly from AI responses. Click the PromptPack icon next to the copy button to save any message to your library instantly.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Feature 4: Organize -->
            <tr>
              <td style="padding:0 16px 16px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${themeLight.card}" class="email-card" style="background-color:${themeLight.card};border:1px solid ${themeLight.border};border-radius:12px;overflow:hidden;">
                  <tr>
                    <td>
                      <img src="${IMAGES.organize}" alt="Organize" width="568" style="width:100%;height:auto;display:block;border:0;" />
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

            <!-- Feature 5: Multi-LLM -->
            <tr>
              <td style="padding:0 16px 24px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${themeLight.card}" class="email-card" style="background-color:${themeLight.card};border:1px solid ${themeLight.border};border-radius:12px;overflow:hidden;">
                  <tr>
                    <td>
                      <img src="${IMAGES.llms}" alt="Multi-LLM Support" width="568" style="width:100%;height:auto;display:block;border:0;" />
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

  const resend = new Resend(apiKey);

  if (EMAIL_TO.length === 0) {
    throw new Error("No recipients specified. Pass email addresses as CLI arguments.");
  }

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: EMAIL_TO,
    subject: SUBJECT,
    html,
    replyTo: REPLY_TO,
  });

  if (error) {
    throw error;
  }

  console.log(`Email sent to ${EMAIL_TO.join(", ")}. Id: ${data?.id ?? "unknown"}`);
}

main().catch((error) => {
  console.error("Send failed:", error);
  process.exitCode = 1;
});
