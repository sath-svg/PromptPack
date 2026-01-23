const APP_URL = "https://pmtpk.com";
const DASHBOARD_URL = "https://pmtpk.com/dashboard";
const EXTENSION_URL =
  "https://chromewebstore.google.com/detail/ajfgnekiofhiblifmiimnlmcnfhibnbl?utm_source=item-share-cb";
const LOGO_URL = "https://pmtpk.com/img/promptpack_logo_horizontal.png";

const themeLight = {
  background: "#f3f4f6",
  foreground: "#0f172a",
  card: "#ffffff",
  muted: "#4b5563",
  border: "rgba(15, 23, 42, 0.1)",
  primary: "#4f46e5",
  primaryHover: "#4338ca",
};

const themeDark = {
  background: "#0a0a0a",
  foreground: "#ededed",
  card: "#1a1a1a",
  muted: "#d1d5db",
  border: "rgba(255, 255, 255, 0.1)",
  primary: "#6366f1",
  primaryHover: "#4f46e5",
};

export const LIVE_EMAIL_SUBJECT = "PromptPack is live - welcome aboard";

export function buildLiveEmailHtml() {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light dark" />
    <meta name="supported-color-schemes" content="light dark" />
    <title>PromptPack is live</title>
    <style>
      :root {
        color-scheme: light dark;
        supported-color-schemes: light dark;
      }
      @media (max-width: 600px) {
        .container {
          width: 100% !important;
        }
        .stack {
          display: block !important;
          width: 100% !important;
        }
        .stack a {
          display: block !important;
          margin-bottom: 10px !important;
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
        .email-link {
          color: ${themeDark.foreground} !important;
        }
        .email-button-primary {
          background-color: ${themeDark.primary} !important;
        }
        .email-button-secondary {
          border-color: ${themeDark.border} !important;
          color: ${themeDark.foreground} !important;
        }
        .email-divider {
          background: linear-gradient(90deg, ${themeDark.primary}, #8b5cf6) !important;
        }
      }
    </style>
  </head>
  <body bgcolor="${themeLight.background}" style="margin:0;padding:0;background-color:${themeLight.background};color:${themeLight.foreground};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Ubuntu,'Helvetica Neue',Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;">
      PromptPack is live. Thanks for choosing PromptPack.
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${themeLight.background}" class="email-body" style="background-color:${themeLight.background};padding:24px 0;">
      <tr>
        <td align="center" bgcolor="${themeLight.background}" class="email-shell" style="background-color:${themeLight.background};">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" class="container email-content" bgcolor="${themeLight.background}" style="width:600px;max-width:600px;background-color:${themeLight.background};">
            <tr>
              <td style="padding:24px 16px 8px;">
                <img src="${LOGO_URL}" alt="PromptPack" width="220" style="display:block;border:0;outline:none;text-decoration:none;height:auto;" />
              </td>
            </tr>
            <tr>
              <td style="padding:0 16px 16px;">
                <div class="email-divider" style="height:3px;background:linear-gradient(90deg,${themeLight.primary},#8b5cf6);border-radius:999px;"></div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 16px 24px;">
                <h1 class="email-foreground" style="margin:0 0 8px;font-size:26px;line-height:1.3;color:${themeLight.foreground};">
                  PromptPack is live 🎉
                </h1>
                <p class="email-muted" style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${themeLight.muted};">
                  Thanks for joining the waitlist — your beta access is ready.
                  Save your best prompts, organize them into PromptPacks, and reuse them across ChatGPT, Claude, and Gemini.
                </p>
                <table role="presentation" cellspacing="0" cellpadding="0" class="stack">
                  <tr>
                    <td style="padding-right:12px;">
                      <a
                        href="${EXTENSION_URL}"
                        class="email-button-primary"
                        style="display:inline-flex;align-items:center;justify-content:center;background:${themeLight.primary};color:#ffffff;text-decoration:none;border-radius:8px;padding:12px 18px;font-size:14px;font-weight:600;"
                      >
                        Get the Extension
                      </a>
                    </td>
                    <td>
                      <a
                        href="${DASHBOARD_URL}"
                        class="email-button-secondary"
                        style="display:inline-flex;align-items:center;justify-content:center;border:1px solid ${themeLight.border};color:${themeLight.foreground};text-decoration:none;border-radius:8px;padding:10px 14px;font-size:13px;font-weight:600;background:transparent;"
                      >
                        Open Dashboard
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 16px 24px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${themeLight.card}" class="email-card" style="background-color:${themeLight.card};border:1px solid ${themeLight.border};border-radius:12px;">
                  <tr>
                    <td style="padding:16px 20px;">
                      <h3 class="email-foreground" style="margin:0 0 8px;font-size:16px;color:${themeLight.foreground};">
                        Your next steps
                      </h3>
                      <ol class="email-muted" style="margin:0;padding-left:18px;color:${themeLight.muted};font-size:14px;line-height:1.6;">
                        <li>Install the extension and start saving prompts as you work.</li>
                        <li>Sign in to sync your library to the dashboard.</li>
                        <li>Optional: Go Pro to create and share PromptPacks.</li>
                      </ol>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 16px 24px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${themeLight.card}" class="email-card" style="background-color:${themeLight.card};border:1px solid ${themeLight.border};border-radius:12px;">
                  <tr>
                    <td style="padding:16px 20px;">
                      <p class="email-muted" style="margin:0;font-size:14px;line-height:1.6;color:${themeLight.muted};">
                        Hit reply with bugs, feature requests, or anything confusing — or use the Contact Support button on pmtpk.com. We read every note.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 16px 32px;font-size:12px;color:#9ca3af;line-height:1.6;">
                <p style="margin:0 0 4px;">PromptPack Support</p>
                <p style="margin:0;">If you didn’t request this email, ignore it.</p>
                <p style="margin:8px 0 0;">
                  <a href="${APP_URL}" class="email-link" style="color:${themeLight.primary};text-decoration:none;">${APP_URL}</a>
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
