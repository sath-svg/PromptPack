import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Resend } from "resend";

// Sends the "We have a feedback page!" email.
//
// Resend cap: 50 recipients per email (TO + CC + BCC). We use 1 TO + up to 25 BCC.
// Recipients come from a CSV (default: scripts/users.csv produced by extract-emails-pg.ts).
//
// Staged rollout for 65 users -> 25/25/15:
//   npx tsx scripts/send-feedback-live-email.ts --from 0  --to 25
//   npx tsx scripts/send-feedback-live-email.ts --from 25 --to 50
//   npx tsx scripts/send-feedback-live-email.ts --from 50 --to 65
//
// Other flags:
//   --dry-run                       print recipients, don't send
//   --self-test you@example.com     send only to this address (overrides CSV)
//   --csv path/to/file.csv          custom CSV path
//   --csv-col primary_email_address custom column name (default: email)

const FROM_EMAIL = "Skillset <support@skillset.so>";
const TO_EMAIL = "support@skillset.so";
const REPLY_TO = "support@skillset.so";
const SUBJECT = "We have a feedback page!";
const PREVIEW_HTML_PATH = join(process.cwd(), "scripts", "preview-feedback-live-email.html");

const BCC_CHUNK_SIZE = 25;
const THROTTLE_MS = 600;

const DEFAULT_CSV = join(process.cwd(), "scripts", "users.csv");
const DEFAULT_CSV_COLUMN = "email";

function loadEnvVar(key: string): string | undefined {
  if (process.env[key]) return process.env[key];
  for (const filename of [".env", ".env.local"]) {
    try {
      const envPath = join(process.cwd(), filename);
      const contents = readFileSync(envPath, "utf8");
      const line = contents.split(/\r?\n/).find((row) => row.startsWith(`${key}=`));
      if (!line) continue;
      const value = line.slice(key.length + 1).trim().replace(/^["']|["']$/g, "");
      if (value) return value;
    } catch {
      // ignore
    }
  }
  return undefined;
}

function parseEmailsFromCsv(csvPath: string, column: string): string[] {
  const raw = readFileSync(csvPath, "utf8");
  const lines = raw.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const idx = headers.findIndex((h) => h === column);
  if (idx < 0) throw new Error(`CSV missing column "${column}". Available: ${headers.join(", ")}`);
  const set = new Set<string>();
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(",");
    const raw = cells[idx]?.trim()?.replace(/^"|"$/g, "");
    const email = raw?.toLowerCase();
    if (!email || !email.includes("@") || !email.includes(".")) continue;
    set.add(email);
  }
  return Array.from(set);
}

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

async function main() {
  const apiKey = loadEnvVar("RESEND_API_KEY");
  if (!apiKey) throw new Error("RESEND_API_KEY missing. Add to web/.env or shell env.");

  const dryRun = hasFlag("--dry-run");
  const selfTestEmail = arg("--self-test");
  const csvPath = arg("--csv") ?? DEFAULT_CSV;
  const csvColumn = arg("--csv-col") ?? DEFAULT_CSV_COLUMN;

  let recipients: string[];
  if (selfTestEmail) {
    recipients = [selfTestEmail.toLowerCase()];
    console.log(`🧪 Self-test → ${selfTestEmail}`);
  } else {
    recipients = parseEmailsFromCsv(csvPath, csvColumn);
    console.log(`👥 ${recipients.length} unique recipients loaded from ${csvPath}`);
  }

  const fromStr = arg("--from");
  const toStr = arg("--to");
  const sliceFrom = fromStr ? parseInt(fromStr, 10) : 0;
  const sliceTo = toStr ? parseInt(toStr, 10) : recipients.length;
  if (sliceFrom !== 0 || sliceTo !== recipients.length) {
    console.log(`✂️  Slice [${sliceFrom}, ${sliceTo}) → ${sliceTo - sliceFrom}/${recipients.length}`);
    recipients = recipients.slice(sliceFrom, sliceTo);
  }

  if (recipients.length === 0) {
    console.log("⚠️  Empty recipient list. Nothing to send.");
    return;
  }

  if (dryRun) {
    console.log(`📝 DRY-RUN — would send to ${recipients.length}:`);
    for (const r of recipients) console.log(`   ${r}`);
    return;
  }

  const html = readFileSync(PREVIEW_HTML_PATH, "utf8");
  const text =
    "We have a feedback page! feedback.skillset.so is live for our best early users. " +
    "Request features, vote on ideas, report bugs. Every Skillset update so far (Skill Router, " +
    "Skill Chat, Skill Control, Skill Preset) came from users asking for it. Reply to this email " +
    "or visit https://feedback.skillset.so — Sathvik, founder.";

  const chunks: string[][] = [];
  for (let i = 0; i < recipients.length; i += BCC_CHUNK_SIZE) {
    chunks.push(recipients.slice(i, i + BCC_CHUNK_SIZE));
  }

  console.log(`📨 ${chunks.length} batch(es) of up to ${BCC_CHUNK_SIZE} BCC. TO: ${TO_EMAIL}`);

  const resend = new Resend(apiKey);
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
      console.error(`    ❌ ${JSON.stringify(error)}`);
    } else {
      ok++;
      console.log(`    ✅ Sent. Id: ${data?.id}`);
    }
    if (i < chunks.length - 1) {
      await new Promise((r) => setTimeout(r, THROTTLE_MS));
    }
  }

  console.log(`\n--- Summary --- recipients=${recipients.length} ok=${ok} fail=${fail}`);
  if (fail > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exitCode = 1;
});
