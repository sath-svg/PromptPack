import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Resend } from "resend";

const EMAIL_TO = ["ivan.securebyte@gmail.com"];
const FROM_EMAIL = "PromptPack Support <support@pmtpk.com>";
const REPLY_TO = "support@pmtpk.com";
const SUBJECT = "Re: Bug/Technical Issue";

const APP_URL = "https://pmtpk.com";
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

function buildHtml() {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light dark" />
    <meta name="supported-color-schemes" content="light dark" />
    <title>${SUBJECT}</title>
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
        .email-link {
          color: ${themeDark.foreground} !important;
        }
        .email-divider {
          background: linear-gradient(90deg, ${themeDark.primary}, #8b5cf6) !important;
        }
      }
    </style>
  </head>
  <body bgcolor="${themeLight.background}" style="margin:0;padding:0;background-color:${themeLight.background};color:${themeLight.foreground};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Ubuntu,'Helvetica Neue',Arial,sans-serif;">
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
                <h1 class="email-foreground" style="margin:0 0 16px;font-size:22px;line-height:1.3;color:${themeLight.foreground};">
                  Re: Bug/Technical Issue
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 16px 24px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${themeLight.card}" class="email-card" style="background-color:${themeLight.card};border:1px solid ${themeLight.border};border-radius:12px;">
                  <tr>
                    <td style="padding:20px 24px;">
                      <p class="email-foreground" style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${themeLight.foreground};">
                        Hi Ivan,
                      </p>
                      <p class="email-muted" style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${themeLight.muted};">
                        Thank you for your detailed security report and for taking the time to document these findings so thoroughly. We appreciate your responsible disclosure approach.
                      </p>
                      <p class="email-muted" style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${themeLight.muted};">
                        We've reviewed each of the vulnerabilities you identified:
                      </p>
                      <ul class="email-muted" style="margin:0 0 16px;padding-left:20px;font-size:15px;line-height:1.7;color:${themeLight.muted};">
                        <li style="margin-bottom:8px;"><strong>Clickjacking / X-Frame-Options</strong> - Noted. We're evaluating this for implementation.</li>
                        <li style="margin-bottom:8px;"><strong>DNSSEC</strong> - We've assessed this against our infrastructure and user base requirements.</li>
                        <li style="margin-bottom:8px;"><strong>DMARC Record</strong> - This has been addressed and is now configured.</li>
                        <li style="margin-bottom:8px;"><strong>TLS/SSL Version</strong> - We're reviewing our current TLS configuration.</li>
                        <li><strong>Security Headers</strong> - We're prioritizing which headers to implement based on our application's threat model and deployment context (many of our users access PromptPack via corporate VPNs with existing security layers).</li>
                      </ul>
                      <p class="email-muted" style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${themeLight.muted};">
                        As a token of appreciation for your report, we'd like to offer you a discounted PromptPack Pro subscription at $1.99. Only 9 spots remain at this price.
                      </p>
                      <p class="email-muted" style="margin:0;font-size:15px;line-height:1.7;color:${themeLight.muted};">
                        Thank you again for helping us improve PromptPack's security posture.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 16px 32px;font-size:12px;color:#9ca3af;line-height:1.6;">
                <p style="margin:0 0 4px;">Best regards,<br/>The PromptPack Team</p>
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

  const resend = new Resend(apiKey);
  const html = buildHtml();

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
