import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Resend } from "resend";

// Skillset Chrome extension retirement notice.
// Run from web/ directory:
//   cd web && bun run scripts/send-extension-retire-email.ts
//
// Flags:
//   --dry-run               render but don't send
//   --self-test <email>    send only to that email
//   --from <n>  --to <n>   slice the recipient list

const FROM_EMAIL = "Skillset <support@pmtpk.com>";
const TO_EMAIL = "support@pmtpk.com";
const REPLY_TO = "support@pmtpk.com";
const SUBJECT = "Heads up: the Skillset Chrome extension is retired";

const BCC_CHUNK_SIZE = 25;

const CSV_PATH = join(
  process.cwd(),
  "..",
  "Product demo",
  "ins_37TSelBFVEJZOIu3AY9sw1aLvpw.csv",
);
const CSV_EMAIL_COLUMN = "primary_email_address";

function loadEnvVar(key: string): string | undefined {
  if (process.env[key]) return process.env[key];
  try {
    const envPath = join(process.cwd(), ".env");
    const contents = readFileSync(envPath, "utf8");
    const line = contents.split(/\r?\n/).find((row) => row.startsWith(`${key}=`));
    if (!line) return undefined;
    return line.slice(key.length + 1).trim().replace(/^["']|["']$/g, "");
  } catch {
    return undefined;
  }
}

function parseEmailsFromCsv(csvPath: string): string[] {
  const raw = readFileSync(csvPath, "utf8");
  const lines = raw.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) return [];
  const headers = lines[0].split(",");
  const idx = headers.findIndex((h) => h.trim() === CSV_EMAIL_COLUMN);
  if (idx < 0) throw new Error(`CSV missing "${CSV_EMAIL_COLUMN}"`);
  const set = new Set<string>();
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(",");
    const email = cells[idx]?.trim()?.toLowerCase();
    if (!email || !email.includes("@") || !email.includes(".")) continue;
    set.add(email);
  }
  return Array.from(set);
}

function buildEmailHtml(): string {
  const light = {
    bg: "#f3f4f6",
    fg: "#0f172a",
    card: "#ffffff",
    muted: "#4b5563",
    border: "rgba(15, 23, 42, 0.1)",
    primary: "#4f46e5",
  };
  const dark = {
    bg: "#0a0a0a",
    fg: "#ededed",
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
    <title>Chrome extension retired — Skillset</title>
    <style>
      :root { color-scheme: light dark; supported-color-schemes: light dark; }
      @media (max-width: 600px) { .container { width: 100% !important; } }
      @media (prefers-color-scheme: dark) {
        body, .email-body, .email-shell, .email-content {
          background-color: ${dark.bg} !important; color: ${dark.fg} !important;
        }
        .email-card { background-color: ${dark.card} !important; border-color: ${dark.border} !important; }
        .email-muted { color: ${dark.muted} !important; }
        .email-foreground { color: ${dark.fg} !important; }
        .email-divider { background: linear-gradient(90deg, ${dark.primary}, #8b5cf6) !important; }
      }
    </style>
  </head>
  <body bgcolor="${light.bg}" style="margin:0;padding:0;background-color:${light.bg};color:${light.fg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Ubuntu,'Helvetica Neue',Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;">
      The Skillset Chrome extension is retired. Your prompts are safe — pick up where you left off in the desktop app.
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${light.bg}" class="email-body" style="background-color:${light.bg};padding:24px 0;">
      <tr>
        <td align="center" bgcolor="${light.bg}" class="email-shell" style="background-color:${light.bg};">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" class="container email-content" bgcolor="${light.bg}" style="width:600px;max-width:600px;background-color:${light.bg};">
            <tr>
              <td style="padding:24px 16px 8px;">
                <p class="email-foreground" style="margin:0;font-size:28px;line-height:1;letter-spacing:-0.02em;font-weight:700;color:${light.fg};">Skillset</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 16px 16px;">
                <div class="email-divider" style="height:3px;background:linear-gradient(90deg,${light.primary},#8b5cf6);border-radius:999px;"></div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 16px 16px;">
                <h1 class="email-foreground" style="margin:0 0 8px;font-size:26px;line-height:1.3;color:${light.fg};">Chrome extension retired</h1>
                <p class="email-muted" style="margin:0;font-size:16px;line-height:1.6;color:${light.muted};">
                  We've retired the Skillset Chrome extension to focus everything we build into the desktop app — a faster, more capable home for your prompts.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 16px 16px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${light.card}" class="email-card" style="background-color:${light.card};border:1px solid ${light.border};border-radius:12px;overflow:hidden;">
                  <tr>
                    <td style="padding:20px;">
                      <p class="email-foreground" style="margin:0 0 8px;font-size:14px;color:${light.fg};font-weight:600;">✓ Your prompts are safe</p>
                      <p class="email-muted" style="margin:0;font-size:14px;line-height:1.6;color:${light.muted};">
                        Every prompt, pack, and saved workflow you captured through the extension is preserved in your Skillset account. Sign in to the desktop app and it's all there.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 16px 16px;">
                <h3 class="email-foreground" style="margin:0 0 8px;font-size:18px;color:${light.fg};">What changes</h3>
                <ul class="email-muted" style="margin:0 0 16px;padding-left:20px;color:${light.muted};font-size:15px;line-height:1.8;">
                  <li>The extension no longer updates or receives new features.</li>
                  <li>Save-from-ChatGPT/Claude/Gemini moves into the desktop app — same gesture, more polish.</li>
                  <li>Skillset desktop now ships SkillChat: managed AI across ChatGPT, Claude, Gemini, Cursor, and more.</li>
                </ul>
              </td>
            </tr>
            <tr>
              <td style="padding:0 16px 16px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${light.card}" class="email-card" style="background-color:${light.card};border:1px solid ${light.border};border-radius:12px;overflow:hidden;">
                  <tr>
                    <td style="padding:20px;">
                      <p class="email-foreground" style="margin:0 0 8px;font-size:16px;color:${light.fg};font-weight:600;">Get the desktop app</p>
                      <p class="email-muted" style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${light.muted};">
                        macOS + Windows. Same account, all your packs.
                      </p>
                      <a href="https://skillset.so/downloads" style="display:inline-block;background-color:${light.primary};color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600;">Download Skillset →</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 16px 16px;">
                <p class="email-muted" style="margin:0;font-size:14px;line-height:1.6;color:${light.muted};">
                  Questions or want to share what you'd like to see next? <a href="mailto:support@pmtpk.com" style="color:${light.primary};text-decoration:underline;">support@pmtpk.com</a>. Thank you for being an early Skillset user.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 16px 32px;font-size:12px;color:#9ca3af;line-height:1.6;">
                <p style="margin:0 0 4px;">Skillset Support</p>
                <p style="margin:8px 0 0;"><a href="https://skillset.so" style="color:${light.primary};text-decoration:none;">https://skillset.so</a></p>
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
  const selfTestEmail = selfTestIdx >= 0 && args[selfTestIdx + 1] ? args[selfTestIdx + 1] : null;
  const fromIdx = args.indexOf("--from");
  const toIdx = args.indexOf("--to");

  const apiKey = loadEnvVar("RESEND_API_KEY");
  if (!apiKey) throw new Error("RESEND_API_KEY missing in web/.env");

  let recipients: string[];
  if (selfTestEmail) {
    recipients = [selfTestEmail];
    console.log(`🧪 Self-test → ${selfTestEmail}`);
  } else {
    recipients = parseEmailsFromCsv(CSV_PATH);
    console.log(`👥 ${recipients.length} unique recipients loaded from CSV`);
  }

  const sliceFrom = fromIdx >= 0 && args[fromIdx + 1] ? parseInt(args[fromIdx + 1], 10) : 0;
  const sliceTo = toIdx >= 0 && args[toIdx + 1] ? parseInt(args[toIdx + 1], 10) : recipients.length;
  if (sliceFrom !== 0 || sliceTo !== recipients.length) {
    console.log(`✂️  Slice [${sliceFrom}, ${sliceTo}) → ${sliceTo - sliceFrom}/${recipients.length}`);
    recipients = recipients.slice(sliceFrom, sliceTo);
  }

  if (dryRun) {
    console.log(`📝 DRY-RUN — would send to ${recipients.length}: ${recipients.slice(0, 3).join(", ")}...`);
    return;
  }

  const resend = new Resend(apiKey);
  const html = buildEmailHtml();
  const text = "The Skillset Chrome extension has been retired. Your prompts are safe in your Skillset account. Use the desktop app for the full experience: https://skillset.so/downloads — Questions? support@pmtpk.com";

  const chunks: string[][] = [];
  for (let i = 0; i < recipients.length; i += BCC_CHUNK_SIZE) {
    chunks.push(recipients.slice(i, i + BCC_CHUNK_SIZE));
  }

  console.log(`📨 ${chunks.length} batch(es) of up to ${BCC_CHUNK_SIZE} BCC. TO: ${TO_EMAIL}`);

  let ok = 0;
  let fail = 0;
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
      text,
    } as any);
    if (error) {
      fail++;
      console.error(`    ❌ ${error}`);
    } else {
      ok++;
      console.log(`    ✅ Sent. Id: ${data?.id}`);
    }
    if (i < chunks.length - 1) await new Promise((r) => setTimeout(r, 600));
  }

  console.log(`\n--- Summary --- recipients=${recipients.length} ok=${ok} fail=${fail}`);
  if (fail > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exitCode = 1;
});
