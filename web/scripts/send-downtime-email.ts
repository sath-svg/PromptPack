import { Resend } from "resend";

const FROM_EMAIL = "support@pmtpk.com";
const REPLY_TO = "support@pmtpk.com";
const SUBJECT = "🔧 Maintenance Alert - Enhanced Login Service Today";

const EMAILS = [
  "services@craftsmaily.com",
  "alemoayako.am@gmail.com",
  "wilmer.martinez@globallexemail.com",
  "followhardcode@gmail.com",
  "tusharkit60@gmail.com",
  "bipojekop@gmail.com",
  "biancadaysignal@gmail.com",
  "rogelfogety@gmail.com",
  "testsgp@gmail.com",
  "tripjejot@gmail.com",
  "tameel.jalaiinghani29@gmail.com",
  "arinivingslaye@gmail.com",
  "lisleidahame.D89@gmail.com",
  "slectingdada@gmail.com",
  "huntingdit@gmail.com",
  "umilabogre@gmail.com",
  "xaooleros@gmail.com",
  "chamelssourcus@gmail.com",
  "infos@gpath.es",
  "k.illioncomet@gmail.com",
  "adamty2811@gmail.com",
  "sd7096071@gmail.com",
  "khaldaruse@gmail.com",
  "zoelcomner@solar.edu.br",
  "desterrulid@gmail.com",
  "anghoohhim@gmail.com",
  "info.griswara.d@gmail.com",
  "petarsteinnann.de",
  "bergonabt@reefloor.com",
  "oppalang@gmail.com",
  "ankitdeshakti778@gmail.com",
  "ereldus@gmail.com",
  "thousaksi@gmail.com",
  "bharath.shareagzol@gmail.com",
  "ailederp@gmailemail.com",
  "samuelan@gmail.com",
  "dikharithd@gmail.com",
  "conclistest08@gmail.com",
  "axthrilt.work@gmail.com",
  "encreasso@gmail.com",
  "toomade@gmail.com",
  "hatko25@gmail.com",
  "dontevergloomy@gmail.com",
  "carebohelam.964@gmail.com",
  "emboyz@gmail.com",
  "gustchexample.com",
  "careionam@gmail.com",
  "joshaliang.yjs@gmail.com",
  "discouthik@gmail.com",
  "peter@stemann.de",
];

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

async function main() {
  const apiKey = "re_Wc5vZGYN_7NSyXMqePCuAuwYqhYRmiTyU";
  const resend = new Resend(apiKey);
  const html = buildMigrationEmailHtml();

  // Filter valid emails (must contain @)
  const validEmails = EMAILS.filter((email) => email.includes("@"));
  const invalidEmails = EMAILS.filter((email) => !email.includes("@"));

  if (invalidEmails.length > 0) {
    console.log("⚠️  Skipping invalid emails:", invalidEmails);
  }

  console.log(`Sending maintenance notification to ${validEmails.length} users...`);
  console.log("Recipients (BCC - hidden):", validEmails.slice(0, 3).join(", "), `... and ${validEmails.length - 3} more`);

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: FROM_EMAIL,
    bcc: validEmails,
    subject: SUBJECT,
    html: html,
    text: "PromptPack Maintenance Alert: We're upgrading to a better login service today (10:00 PM SGT / 4:00 PM CEST) for 1-2 hours. Your data is safe. You'll need to log in again after the upgrade.",
  } as any);

  if (error) {
    console.error("❌ Failed:", error);
    process.exitCode = 1;
    return;
  }

  console.log(`✅ Email sent! Message ID: ${data?.id}`);
  console.log(`Recipients: ${validEmails.length} users (BCC)`);
  console.log(`Subject: ${SUBJECT}`);
}

main();
