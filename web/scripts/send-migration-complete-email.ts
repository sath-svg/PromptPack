import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Resend } from "resend";

// Skillset migration-complete blast.
// Run from web/ directory:
//   cd web && bun run scripts/send-migration-complete-email.ts --from 0 --to 25
//   cd web && bun run scripts/send-migration-complete-email.ts --from 25 --to 50
//   cd web && bun run scripts/send-migration-complete-email.ts --from 50 --to 60
//
// Body is loaded from preview-migration-complete-email.html so the live preview
// in the browser is the single source of truth — no drift between what you see
// and what gets sent. Both logos are hosted on https://image.skillset.so so no
// inline CID attachments are required.
//
// Recipients are read from the Clerk-exported CSV at
//   <repo>/Product demo/<file>.csv  (column: primary_email_address)
// Emails go out as BCC so recipients never see each other.

const FROM_EMAIL = "Skillset <support@skillset.so>";
const TO_EMAIL = "support@skillset.so"; // Visible TO; recipients only see this.
const REPLY_TO = "support@skillset.so";
const SUBJECT = "Welcome to Skillset — migration complete";

// Resend caps to+cc+bcc at 50 recipients per request.
// 25 keeps the blast radius small and matches the 25/25/10 split for 60 users.
const BCC_CHUNK_SIZE = 25;

const HTML_TEMPLATE_PATH = join(
  process.cwd(),
  "scripts",
  "preview-migration-complete-email.html",
);

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
    const cells = lines[i].split(",");
    const email = cells[emailIdx]?.trim()?.toLowerCase();
    if (!email) continue;
    if (!email.includes("@") || !email.includes(".")) continue;
    emails.add(email);
  }
  return Array.from(emails);
}

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

/**
 * Loads the preview HTML and rewrites the local relative path used by the
 * browser preview into the live CDN URL so email clients can fetch the asset.
 * No-op if the preview already references the CDN (current state).
 */
function loadEmailHtml(): string {
  let html = readFileSync(HTML_TEMPLATE_PATH, "utf8");
  // Defensive: if anyone ever switches a logo back to a relative ../public/img
  // path for browser preview, swap it to the CDN here so the email still works.
  html = html.replace(
    /src="\.\.\/public\/img\/promptpack_logo_horizontal\.png"/g,
    'src="https://image.skillset.so/img/logo_no_text.png"',
  );
  html = html.replace(
    /src="\.\.\/public\/img\/skillset_logo\.png"/g,
    'src="https://image.skillset.so/img/skillset_logo.png"',
  );
  return html;
}

const TEXT_BODY = [
  "PromptPack is now Skillset.",
  "",
  "We rebranded and migrated to skillset.so. Your account, packs, credits, and history are all preserved — sign in with your existing email.",
  "",
  "Why Skillset exists: as AI keeps rising, prompts and skills are getting lifted, screenshotted, and quietly absorbed. We built Skillset so your prompts stay encrypted at rest and in transit, executed inside the app rather than exposed in raw form to model providers.",
  "",
  "Inside the app:",
  "  • Skill Chat — every model in one window",
  "  • Skill Flow — multi-step orchestration",
  "  • Skill Router — routes each prompt to the best model",
  "  • Skill Preset (MVP) — encrypted, packaged skills built to stop AI theft",
  "  • Skill Control — per-skill model, credit, access controls",
  "  • Native installers for macOS (Apple Silicon & Intel) and Windows (x64 & ARM64)",
  "",
  "Sunsetting all browser extensions (Chrome, Firefox, Safari) and the MCP server. Everything they did now lives inside the desktop app.",
  "",
  "Download: https://skillset.so/downloads",
  "",
  "Issues? Reply to this email or write to support@skillset.so.",
  "",
  "— The Skillset team",
  "https://skillset.so",
].join("\n");

async function main() {
  const apiKey = loadEnvVar("RESEND_API_KEY");
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set. Add it to web/.env or your shell env.");
  }

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

  // CLI slice for 25 / 25 / 10 split:
  //   --from 0  --to 25
  //   --from 25 --to 50
  //   --from 50 --to 60
  const args = process.argv.slice(2);
  const fromIdx = args.indexOf("--from");
  const toIdx = args.indexOf("--to");
  const sliceFrom = fromIdx >= 0 && args[fromIdx + 1] ? parseInt(args[fromIdx + 1], 10) : 0;
  const sliceTo =
    toIdx >= 0 && args[toIdx + 1] ? parseInt(args[toIdx + 1], 10) : recipients.length;

  if (sliceFrom !== 0 || sliceTo !== recipients.length) {
    console.log(
      `✂️  Slicing recipients [${sliceFrom}, ${sliceTo}) → ${sliceTo - sliceFrom} of ${recipients.length}`,
    );
    recipients = recipients.slice(sliceFrom, sliceTo);
  }

  const dryRun = args.includes("--dry-run");
  if (dryRun) {
    console.log("\n--- DRY RUN ---");
    console.log(`Would send to ${recipients.length} recipient(s):`);
    recipients.forEach((e, i) => console.log(`  ${String(i + 1).padStart(3, " ")}. ${e}`));
    console.log(`\nFrom:    ${FROM_EMAIL}`);
    console.log(`Subject: ${SUBJECT}`);
    console.log("Re-run without --dry-run to actually send.\n");
    return;
  }

  const resend = new Resend(apiKey);
  const html = loadEmailHtml();

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
      text: TEXT_BODY,
    } as any);

    if (error) {
      failCount++;
      console.error(`    ❌ Batch ${i + 1} failed:`, error);
    } else {
      okCount++;
      console.log(`    ✅ Batch ${i + 1} sent. Message ID: ${data?.id}`);
    }

    if (i < chunks.length - 1) {
      // Resend free-tier rate limit: 2 req/sec.
      await new Promise((r) => setTimeout(r, 600));
    }
  }

  console.log("\n--- Summary ---");
  console.log(`Total recipients: ${recipients.length}`);
  console.log(`Batches OK: ${okCount}`);
  console.log(`Batches failed: ${failCount}`);
  console.log(`From: ${FROM_EMAIL}`);
  console.log(`Subject: ${SUBJECT}`);

  if (failCount > 0) process.exitCode = 1;
}

main();
