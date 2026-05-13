import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ConvexHttpClient } from "convex/browser";
import { Resend } from "resend";
import { api } from "../convex/_generated/api";

// One-time price-change email blast for legacy_pro subscribers.
// Run AFTER `npx convex run users:backfillPlanVariant` (sets planVariant=legacy_pro).
//
// Run from web/ directory:
//   cd web && bun run scripts/send-pro-price-change-email.ts
//
// Env vars required (web/.env):
//   RESEND_API_KEY
//   NEXT_PUBLIC_CONVEX_URL
//   SKILLSET_INTERNAL_KEY  (matches Convex env, used to call listLegacyProEmailsForBlast)
//
// CLI flags:
//   --from <n>  --to <n>   slice the recipient list for partial resend
//   --dry-run               fetch + render but DO NOT send
//   --self-test <email>    send only to that email (overrides recipient list)

const FROM_EMAIL = "Skillset <support@pmtpk.com>";
const TO_EMAIL = "support@pmtpk.com"; // visible recipient — recipients see this only
const REPLY_TO = "support@pmtpk.com";
const SUBJECT = "Heads up: Pro plan changes (you're grandfathered)";

// Resend cap is to+cc+bcc ≤ 50 per request. Stay at 25 for safety.
const BCC_CHUNK_SIZE = 25;

function loadEnvVar(key: string): string | undefined {
  if (process.env[key]) return process.env[key];
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
    <title>Pro plan changes — Skillset</title>
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
      Pro is going from $9 to $15 for new signups — you're locked in at $9 with adjusted credits.
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${themeLight.background}" class="email-body" style="background-color:${themeLight.background};padding:24px 0;">
      <tr>
        <td align="center" bgcolor="${themeLight.background}" class="email-shell" style="background-color:${themeLight.background};">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" class="container email-content" bgcolor="${themeLight.background}" style="width:600px;max-width:600px;background-color:${themeLight.background};">
            <!-- Wordmark -->
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
                  Heads up: Pro plan changes
                </h1>
                <p class="email-muted" style="margin:0;font-size:16px;line-height:1.6;color:${themeLight.muted};">
                  As we keep building Skillset, we're updating the Pro plan for new sign-ups. Here's what it means for you — short version: <strong>nothing breaks</strong>.
                </p>
              </td>
            </tr>

            <!-- TL;DR -->
            <tr>
              <td style="padding:0 16px 16px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${themeLight.card}" class="email-card" style="background-color:${themeLight.card};border:1px solid ${themeLight.border};border-radius:12px;overflow:hidden;">
                  <tr>
                    <td style="padding:20px;">
                      <p class="email-foreground" style="margin:0 0 8px;font-size:14px;color:${themeLight.foreground};font-weight:600;">✓ You're grandfathered at $9/mo</p>
                      <p class="email-muted" style="margin:0;font-size:14px;line-height:1.6;color:${themeLight.muted};">
                        We're keeping you on your existing $9/mo Pro plan. <strong>Your price does not change.</strong>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- The change -->
            <tr>
              <td style="padding:0 16px 16px;">
                <h3 class="email-foreground" style="margin:0 0 8px;font-size:18px;color:${themeLight.foreground};">What's changing</h3>
                <p class="email-muted" style="margin:0 0 12px;font-size:15px;line-height:1.6;color:${themeLight.muted};">
                  New Pro signups now pay <strong>$15/month for 750 AI credits</strong>. To balance the cost of upgraded models and infrastructure, your grandfathered $9/mo plan now includes <strong>300 AI credits/month</strong> (effective on your next billing cycle).
                </p>
                <p class="email-muted" style="margin:0 0 12px;font-size:15px;line-height:1.6;color:${themeLight.muted};">
                  All other Pro features stay the same: saved prompts, custom skillsets, premium models access, SkillFlow workflows, priority support.
                </p>
              </td>
            </tr>

            <!-- Want more credits -->
            <tr>
              <td style="padding:0 16px 16px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${themeLight.card}" class="email-card" style="background-color:${themeLight.card};border:1px solid ${themeLight.border};border-radius:12px;overflow:hidden;">
                  <tr>
                    <td style="padding:20px;">
                      <p class="email-foreground" style="margin:0 0 8px;font-size:16px;color:${themeLight.foreground};font-weight:600;">Want the full 750 credits?</p>
                      <p class="email-muted" style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${themeLight.muted};">
                        Upgrade to the new $15/mo Pro plan anytime from your account settings. Or stay on $9 — your call.
                      </p>
                      <a href="https://pmtpk.com/account?upgrade=pro" style="display:inline-block;background-color:${themeLight.primary};color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600;">Upgrade to $15 Pro →</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Reasoning + thanks -->
            <tr>
              <td style="padding:0 16px 16px;">
                <p class="email-muted" style="margin:0 0 12px;font-size:14px;line-height:1.6;color:${themeLight.muted};">
                  Why the change? Frontier AI model costs have grown faster than we projected when Skillset launched at $9. Rather than push everyone to the new price, we wanted early adopters to stay on the price you signed up at — even if it means recalibrating credit allowances.
                </p>
                <p class="email-muted" style="margin:0;font-size:14px;line-height:1.6;color:${themeLight.muted};">
                  Thanks for being one of the first Skillset users. Real-talk feedback always welcome → <a href="mailto:support@pmtpk.com" style="color:${themeLight.primary};text-decoration:underline;">support@pmtpk.com</a>.
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
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const selfTestIdx = args.indexOf("--self-test");
  const selfTestEmail =
    selfTestIdx >= 0 && args[selfTestIdx + 1] ? args[selfTestIdx + 1] : null;
  const fromIdx = args.indexOf("--from");
  const toIdx = args.indexOf("--to");

  const apiKey = loadEnvVar("RESEND_API_KEY");
  const convexUrl = loadEnvVar("NEXT_PUBLIC_CONVEX_URL");
  const internalKey = loadEnvVar("SKILLSET_INTERNAL_KEY");
  if (!apiKey) throw new Error("RESEND_API_KEY missing in web/.env");
  if (!convexUrl) throw new Error("NEXT_PUBLIC_CONVEX_URL missing in web/.env");
  if (!internalKey) throw new Error("SKILLSET_INTERNAL_KEY missing in web/.env");

  // Fetch recipient list from Convex.
  let recipients: { email: string; name?: string }[];
  if (selfTestEmail) {
    recipients = [{ email: selfTestEmail }];
    console.log(`🧪 Self-test mode → only sending to ${selfTestEmail}`);
  } else {
    const client = new ConvexHttpClient(convexUrl);
    try {
      recipients = await client.action(api.users.listLegacyProEmailsForBlast, {
        internalKey,
      });
      console.log(`👥 Fetched ${recipients.length} legacy_pro recipients from Convex`);
    } catch (err) {
      console.error("❌ Could not fetch recipients from Convex:", err);
      process.exitCode = 1;
      return;
    }
  }

  if (recipients.length === 0) {
    console.error("❌ No legacy_pro recipients. Did you run the backfill?");
    console.error("   npx convex run users:backfillPlanVariant '{\"dryRun\": false}'");
    process.exitCode = 1;
    return;
  }

  // Optional CLI slice.
  const sliceFrom =
    fromIdx >= 0 && args[fromIdx + 1] ? parseInt(args[fromIdx + 1], 10) : 0;
  const sliceTo =
    toIdx >= 0 && args[toIdx + 1] ? parseInt(args[toIdx + 1], 10) : recipients.length;
  if (sliceFrom !== 0 || sliceTo !== recipients.length) {
    console.log(
      `✂️  Slicing recipients [${sliceFrom}, ${sliceTo}) → ${sliceTo - sliceFrom} of ${recipients.length}`,
    );
    recipients = recipients.slice(sliceFrom, sliceTo);
  }

  const emails = recipients.map((r) => r.email);

  if (dryRun) {
    console.log(`📝 DRY-RUN — would send to ${emails.length} recipients:`);
    console.log(emails.slice(0, 5).join("\n"));
    if (emails.length > 5) console.log(`... and ${emails.length - 5} more`);
    return;
  }

  const resend = new Resend(apiKey);
  const html = buildEmailHtml();
  const textBody =
    "Heads up: Pro plan changes. You're grandfathered at $9/mo — your price does not change. Effective next billing cycle, your $9 plan includes 300 AI credits/month (down from previous). New Pro signups pay $15/mo for 750 credits. Want the full 750? Upgrade anytime: https://pmtpk.com/account?upgrade=pro. Questions: support@pmtpk.com";

  // Chunk for Resend cap.
  const chunks: string[][] = [];
  for (let i = 0; i < emails.length; i += BCC_CHUNK_SIZE) {
    chunks.push(emails.slice(i, i + BCC_CHUNK_SIZE));
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
    } as any);

    if (error) {
      failCount++;
      console.error(`    ❌ Batch ${i + 1} failed:`, error);
    } else {
      okCount++;
      console.log(`    ✅ Batch ${i + 1} sent. Message ID: ${data?.id}`);
    }

    // Resend rate limit safety.
    if (i < chunks.length - 1) {
      await new Promise((r) => setTimeout(r, 600));
    }
  }

  console.log("\n--- Summary ---");
  console.log(`Total recipients: ${emails.length}`);
  console.log(`Batches OK: ${okCount}`);
  console.log(`Batches failed: ${failCount}`);

  if (failCount > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exitCode = 1;
});
