import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Resend } from "resend";

const FROM_EMAIL = "PromptPack <support@pmtpk.com>";
const REPLY_TO = "support@pmtpk.com";
const SUBJECT = "🔧 Maintenance Alert - Enhanced Login Service Today";

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

function buildMigrationEmailHtml(): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light dark" />
    <title>Maintenance Alert - Enhanced Login</title>
  </head>
  <body bgcolor="#f3f4f6" style="margin:0;padding:0;background-color:#f3f4f6;color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Ubuntu,'Helvetica Neue',Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;">
      We're upgrading authentication for better security and longer sessions.
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#f3f4f6" style="background-color:#f3f4f6;padding:24px 0;">
      <tr>
        <td align="center" bgcolor="#f3f4f6" style="background-color:#f3f4f6;">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="width:600px;max-width:600px;background-color:#ffffff;border-radius:12px;box-shadow:0 10px 15px -3px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <tr>
              <td style="padding:32px 24px 0;">
                <h1 style="margin:0 0 12px;font-size:24px;line-height:1.3;color:#0f172a;">
                  🔧 Maintenance Alert
                </h1>
                <p style="margin:0;font-size:16px;line-height:1.6;color:#4b5563;">
                  We're upgrading to a better login service today
                </p>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding:24px;">
                <div style="background-color:#f9fafb;border-left:4px solid #4f46e5;padding:16px;border-radius:4px;margin-bottom:20px;">
                  <p style="margin:0;font-size:14px;color:#0f172a;font-weight:600;">
                    ⏰ Maintenance Window
                  </p>
                  <p style="margin:8px 0 0;font-size:16px;color:#0f172a;">
                    Today at <strong>10:00 PM SGT</strong> (4:00 PM CEST)
                  </p>
                  <p style="margin:4px 0 0;font-size:14px;color:#4b5563;">
                    Duration: 1-2 hours
                  </p>
                </div>

                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4b5563;">
                  We're migrating to a <strong>better login service</strong> for your benefit:
                </p>

                <ul style="margin:0 0 20px;padding-left:24px;color:#4b5563;font-size:15px;line-height:1.8;">
                  <li style="margin-bottom:8px;">✅ Longer sessions (no more 7-day limits)</li>
                  <li style="margin-bottom:8px;">✅ Better security with modern standards</li>
                  <li style="margin-bottom:8px;">✅ Seamless re-authentication</li>
                </ul>

                <div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-bottom:20px;">
                  <p style="margin:0;font-size:14px;color:#166534;font-weight:600;">
                    ✓ Your data is safe
                  </p>
                  <p style="margin:8px 0 0;font-size:14px;color:#166534;">
                    All your prompts and packs will be preserved. You'll just need to log in again when the upgrade is complete.
                  </p>
                </div>

                <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4b5563;">
                  If you experience any issues, just log in again or reach out to us at <a href="mailto:support@pmtpk.com" style="color:#4f46e5;text-decoration:underline;">support@pmtpk.com</a>.
                </p>

                <p style="margin:0;font-size:15px;color:#4b5563;">
                  Thank you for your patience! 🙏
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:24px;border-top:1px solid #e5e7eb;text-align:center;font-size:12px;color:#9ca3af;">
                <p style="margin:0;">
                  <a href="https://pmtpk.com" style="color:#4f46e5;text-decoration:none;">PromptPack</a> · <a href="mailto:support@pmtpk.com" style="color:#4f46e5;text-decoration:none;">Support</a>
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

async function getAllUserEmails(): Promise<string[]> {
  const convexUrl = "https://determined-lark-313.convex.site";
  const convexAdminKey = loadEnvVar("CONVEX_ADMIN_KEY");

  if (!convexAdminKey) {
    throw new Error("CONVEX_ADMIN_KEY not set. Add it to web/.env or your shell env.");
  }

  // Query all users via Convex HTTP API
  const response = await fetch(`${convexUrl}/api/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${convexAdminKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      path: "users:getAllUserEmails",
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch users from Convex: ${response.statusText}`);
  }

  const result = (await response.json()) as Array<{ email: string }>;
  return result.map((user) => user.email).filter(Boolean);
}

async function main() {
  const resendApiKey = loadEnvVar("RESEND_API_KEY");
  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY not set. Add it to web/.env or your shell env.");
  }

  console.log("Fetching all user emails from Convex...");
  const emails = await getAllUserEmails();

  if (emails.length === 0) {
    console.log("No users found.");
    return;
  }

  console.log(`Found ${emails.length} users. Sending maintenance notification email...`);

  const resend = new Resend(resendApiKey);
  const html = buildMigrationEmailHtml();

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: FROM_EMAIL,
    bcc: emails,
    subject: SUBJECT,
    html,
    replyTo: REPLY_TO,
  } as any);

  if (error) {
    throw error;
  }

  console.log(`✅ Email sent to ${emails.length} users. Message ID: ${data?.id ?? "unknown"}`);
  console.log("Recipient emails (BCC):", emails.slice(0, 3).join(", "), emails.length > 3 ? `... and ${emails.length - 3} more` : "");
}

main().catch((error) => {
  console.error("❌ Send failed:", error);
  process.exitCode = 1;
});
