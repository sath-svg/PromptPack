import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Resend } from "resend";

// Skillset branded downtime/migration notice.
// Run from web/ directory: `cd web && bun run scripts/send-downtime-email.ts`
// Reads recipient emails from the Clerk-exported CSV at "<repo>/Product demo/<file>.csv"
// (column: `primary_email_address`). Sends as BCC so recipients don't see each other.
// Attaches ad.jpg from "<repo>/Product demo/skillset/ad.jpg" inline via CID.

const FROM_EMAIL = "Skillset <support@pmtpk.com>";
const TO_EMAIL = "support@pmtpk.com"; // Visible recipient — recipients see this only.
const REPLY_TO = "support@pmtpk.com";
const SUBJECT = "🔧 Scheduled maintenance — 7:30 AM CET, ~1-2 hrs downtime";

// Resend caps the SUM of to+cc+bcc at 50 recipients per request.
// With TO=1 the practical BCC max is 49; we stay at 25 for safety + smaller blast radius on per-batch errors.
const BCC_CHUNK_SIZE = 25;

// Path to the ad image, relative to the repo root.
// process.cwd() = web/ when run via `cd web && bun run ...`, so go up one level.
const AD_IMAGE_PATH = join(process.cwd(), "..", "Product demo", "skillset", "ad.jpg");

// Path to the Clerk user CSV. Column 5 (zero-indexed: 4) = primary_email_address.
const CSV_PATH = join(
  process.cwd(),
  "..",
  "Product demo",
  "ins_37TSelBFVEJZOIu3AY9sw1aLvpw.csv",
);
const CSV_EMAIL_COLUMN = "primary_email_address";

function parseEmailsFromCsv(csvPath: string): string[] {
  const raw = readFileSync(csvPath, "utf8");
  const lines = raw.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) return [];
  const headers = lines[0].split(",");
  const emailIdx = headers.findIndex((h) => h.trim() === CSV_EMAIL_COLUMN);
  if (emailIdx < 0) {
    throw new Error(`CSV missing required column "${CSV_EMAIL_COLUMN}"`);
  }
  const emails = new Set<string>();
  for (let i = 1; i < lines.length; i++) {
    // Simple CSV split — Clerk export does not quote email fields.
    const cells = lines[i].split(",");
    const email = cells[emailIdx]?.trim()?.toLowerCase();
    if (!email) continue;
    if (!email.includes("@") || !email.includes(".")) continue;
    emails.add(email);
  }
  return Array.from(emails);
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
    if (!line) return undefined;
    const value = line.slice(key.length + 1).trim();
    return value.replace(/^["']|["']$/g, "");
  } catch {
    return undefined;
  }
}

function buildEmailHtml(): string {
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
    <title>Scheduled maintenance — Skillset</title>
    <style>
      :root {
        color-scheme: light dark;
        supported-color-schemes: light dark;
      }
      @media (max-width: 600px) {
        .container { width: 100% !important; }
      }
      @media (prefers-color-scheme: dark) {
        body, .email-body, .email-shell, .email-content {
          background-color: ${themeDark.background} !important;
          color: ${themeDark.foreground} !important;
        }
        .email-card {
          background-color: ${themeDark.card} !important;
          border-color: ${themeDark.border} !important;
        }
        .email-muted { color: ${themeDark.muted} !important; }
        .email-foreground { color: ${themeDark.foreground} !important; }
        .email-divider {
          background: linear-gradient(90deg, ${themeDark.primary}, #8b5cf6) !important;
        }
      }
    </style>
  </head>
  <body bgcolor="${themeLight.background}" style="margin:0;padding:0;background-color:${themeLight.background};color:${themeLight.foreground};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Ubuntu,'Helvetica Neue',Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;">
      Skillset is migrating to a better experience — 7:30 AM CET today, ~1–2 hrs downtime.
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${themeLight.background}" class="email-body" style="background-color:${themeLight.background};padding:24px 0;">
      <tr>
        <td align="center" bgcolor="${themeLight.background}" class="email-shell" style="background-color:${themeLight.background};">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" class="container email-content" bgcolor="${themeLight.background}" style="width:600px;max-width:600px;background-color:${themeLight.background};">
            <!-- Wordmark (text-only — no external image dependency) -->
            <tr>
              <td style="padding:24px 16px 8px;">
                <p class="email-foreground" style="margin:0;font-size:28px;line-height:1;letter-spacing:-0.02em;font-weight:700;color:${themeLight.foreground};">
                  Skillset
                </p>
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
                  Scheduled maintenance ⚙️
                </h1>
                <p class="email-muted" style="margin:0;font-size:16px;line-height:1.6;color:${themeLight.muted};">
                  We're migrating Skillset to a better experience and a smoother way to use it. Brief downtime ahead.
                </p>
              </td>
            </tr>

            <!-- Maintenance window callout -->
            <tr>
              <td style="padding:0 16px 16px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${themeLight.card}" class="email-card" style="background-color:${themeLight.card};border:1px solid ${themeLight.border};border-radius:12px;overflow:hidden;">
                  <tr>
                    <td style="padding:20px;">
                      <p class="email-foreground" style="margin:0 0 8px;font-size:14px;color:${themeLight.foreground};font-weight:600;">⏰ Maintenance window</p>
                      <p class="email-foreground" style="margin:0 0 4px;font-size:18px;color:${themeLight.foreground};">
                        Today at <strong>7:30 AM CET</strong>
                      </p>
                      <p class="email-muted" style="margin:0;font-size:14px;color:${themeLight.muted};">
                        Estimated duration: 1–2 hours
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Ad image (inline attachment via CID) -->
            <tr>
              <td style="padding:0 16px 16px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${themeLight.card}" class="email-card" style="background-color:${themeLight.card};border:1px solid ${themeLight.border};border-radius:12px;overflow:hidden;">
                  <tr>
                    <td>
                      <img src="cid:skillset-ad" alt="Skillset" width="568" style="width:100%;height:auto;display:block;border:0;" />
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Why we're migrating -->
            <tr>
              <td style="padding:0 16px 16px;">
                <h3 class="email-foreground" style="margin:0 0 8px;font-size:18px;color:${themeLight.foreground};">Why we're doing this</h3>
                <p class="email-muted" style="margin:0 0 12px;font-size:15px;line-height:1.6;color:${themeLight.muted};">
                  We're upgrading the platform for a faster, smoother, more reliable Skillset:
                </p>
                <ul class="email-muted" style="margin:0 0 16px;padding-left:20px;color:${themeLight.muted};font-size:15px;line-height:1.8;">
                  <li>Faster page loads + lower latency</li>
                  <li>Improved sign-in flow</li>
                  <li>More reliable infrastructure</li>
                  <li>Foundation for upcoming features</li>
                </ul>
              </td>
            </tr>

            <!-- Your data is safe -->
            <tr>
              <td style="padding:0 16px 16px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${themeLight.card}" class="email-card" style="background-color:${themeLight.card};border:1px solid ${themeLight.border};border-radius:12px;overflow:hidden;">
                  <tr>
                    <td style="padding:16px 20px;">
                      <p class="email-foreground" style="margin:0 0 6px;font-size:14px;color:${themeLight.foreground};font-weight:600;">✓ Your data is safe</p>
                      <p class="email-muted" style="margin:0;font-size:14px;line-height:1.6;color:${themeLight.muted};">
                        All prompts, packs, and credits are preserved. Once the migration completes, sign in again and you're back where you left off.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Support note -->
            <tr>
              <td style="padding:0 16px 24px;">
                <p class="email-muted" style="margin:0;font-size:14px;line-height:1.6;color:${themeLight.muted};">
                  Issues during or after the window? Reply to this email or reach us at <a href="mailto:support@pmtpk.com" style="color:${themeLight.primary};text-decoration:underline;">support@pmtpk.com</a>. Thank you for your patience! 🙏
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:0 16px 32px;font-size:12px;color:#9ca3af;line-height:1.6;">
                <p style="margin:0 0 4px;">Skillset Support</p>
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

async function main() {
  const apiKey = loadEnvVar("RESEND_API_KEY");
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set. Add it to web/.env or your shell env.");
  }

  // Read ad.jpg as base64 for inline CID attachment.
  let adImageBase64: string;
  try {
    const buf = readFileSync(AD_IMAGE_PATH);
    adImageBase64 = buf.toString("base64");
    console.log(`📎 Loaded ad.jpg (${(buf.byteLength / 1024).toFixed(1)} KB) from ${AD_IMAGE_PATH}`);
  } catch (err) {
    console.error(`❌ Could not read ad.jpg at ${AD_IMAGE_PATH}`);
    console.error(err);
    process.exitCode = 1;
    return;
  }

  // Parse recipients from the Clerk CSV.
  let recipients: string[];
  try {
    recipients = parseEmailsFromCsv(CSV_PATH);
    console.log(`👥 Loaded ${recipients.length} unique recipients from ${CSV_PATH}`);
  } catch (err) {
    console.error(`❌ Could not parse recipients from CSV at ${CSV_PATH}`);
    console.error(err);
    process.exitCode = 1;
    return;
  }

  if (recipients.length === 0) {
    console.error("❌ No recipients found in CSV. Aborting.");
    process.exitCode = 1;
    return;
  }

  // Optional CLI slice for partial resend after a failure:
  //   bun run scripts/send-downtime-email.ts --from 0 --to 50
  const args = process.argv.slice(2);
  const fromIdx = args.indexOf("--from");
  const toIdx = args.indexOf("--to");
  const sliceFrom = fromIdx >= 0 && args[fromIdx + 1] ? parseInt(args[fromIdx + 1], 10) : 0;
  const sliceTo =
    toIdx >= 0 && args[toIdx + 1] ? parseInt(args[toIdx + 1], 10) : recipients.length;
  if (sliceFrom !== 0 || sliceTo !== recipients.length) {
    console.log(`✂️  Slicing recipients [${sliceFrom}, ${sliceTo}) → ${sliceTo - sliceFrom} of ${recipients.length}`);
    recipients = recipients.slice(sliceFrom, sliceTo);
  }

  const resend = new Resend(apiKey);
  const html = buildEmailHtml();
  const textBody =
    "Scheduled maintenance: Skillset is migrating to a better experience today at 7:30 AM CET. Estimated downtime: 1-2 hours. Your data is safe — sign in again once the upgrade is complete. Questions? support@pmtpk.com";

  // Chunk recipients for Resend's 50-per-request BCC cap.
  const chunks: string[][] = [];
  for (let i = 0; i < recipients.length; i += BCC_CHUNK_SIZE) {
    chunks.push(recipients.slice(i, i + BCC_CHUNK_SIZE));
  }

  console.log(
    `📨 Sending in ${chunks.length} batch(es) of up to ${BCC_CHUNK_SIZE} BCC each. Visible TO: ${TO_EMAIL}`,
  );

  let okCount = 0;
  let failCount = 0;

  for (let i = 0; i < chunks.length; i++) {
    const bcc = chunks[i];
    console.log(`  → Batch ${i + 1}/${chunks.length}: ${bcc.length} recipients`);

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      bcc,
      subject: SUBJECT,
      html,
      replyTo: REPLY_TO,
      text: textBody,
      attachments: [
        {
          filename: "ad.jpg",
          content: adImageBase64,
          contentId: "skillset-ad",
          contentType: "image/jpeg",
          contentDisposition: "inline",
        },
      ],
    } as any);

    if (error) {
      failCount++;
      console.error(`    ❌ Batch ${i + 1} failed:`, error);
    } else {
      okCount++;
      console.log(`    ✅ Batch ${i + 1} sent. Message ID: ${data?.id}`);
    }

    // Resend free-tier rate limit: 2 req/sec. Sleep between batches.
    if (i < chunks.length - 1) {
      await new Promise((r) => setTimeout(r, 600));
    }
  }

  console.log("\n--- Summary ---");
  console.log(`Total recipients: ${recipients.length}`);
  console.log(`Batches OK: ${okCount}`);
  console.log(`Batches failed: ${failCount}`);
  console.log(`Subject: ${SUBJECT}`);

  if (failCount > 0) {
    process.exitCode = 1;
  }
}

main();
