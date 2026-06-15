import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ConvexHttpClient } from "convex/browser";
import { Resend } from "resend";
import { api } from "../convex/_generated/api";

// Free-plan closure announcement. Tells every current free-plan user that the
// free plan is ending (rising AI costs) and points them to the 3-day trial.
// Sends with a single visible TO (support@) and the real recipients as BCC,
// in batches, so recipients never see each other.
//
// Run from the web/ directory:
//   cd web && bun run scripts/send-free-plan-closure-email.ts --self-test you@example.com
//   cd web && bun run scripts/send-free-plan-closure-email.ts --dry-run
//   cd web && bun run scripts/send-free-plan-closure-email.ts
//
// Env vars required (web/.env):
//   RESEND_API_KEY
//   NEXT_PUBLIC_CONVEX_URL
//   SKILLSET_INTERNAL_KEY  (must match the Convex deployment env var)
//
// Before the real blast you must deploy the Convex functions so
// `users:listFreeUserEmailsForBlast` exists in the deployment + generated api:
//   cd web && npx convex deploy
//
// CLI flags:
//   --csv <path>          read recipients from a CSV (email in column 1) instead of Convex
//   --from <n> --to <n>   slice the recipient list for partial resend
//   --dry-run             fetch + render but DO NOT send (prints recipients)
//   --self-test <email>   send one copy to that address only (skips Convex)

const FROM_EMAIL = "Skillset <support@skillset.so>";
const TO_EMAIL = "support@skillset.so"; // visible recipient — recipients see this only
const REPLY_TO = "support@skillset.so";
const SUBJECT = "Your Skillset free plan is ending";

// Path to the email HTML (repo root). Script runs with cwd = web/.
const HTML_PATH = join(process.cwd(), "..", "free-plan-closure-email.html");

// Resend caps the SUM of to+cc+bcc at 50 per request. With TO=1 that leaves
// 49 BCC slots per batch.
const BCC_CHUNK_SIZE = 49;

const TEXT_BODY = [
  "Your Skillset free plan is ending.",
  "",
  "AI model prices have climbed sharply, and we can no longer keep the free plan running. In 3 days, free accounts will stop being able to run AI inside Skillset.",
  "",
  "Your skills, skillsets, and settings stay safe in your account. To keep running them, start a 3-day free trial of Pro: powerful models, the Skill Router, Skill Flow, and up to 80% lower token costs. Cancel anytime within the trial.",
  "",
  "Start your 3-day trial: https://skillset.so/start-trial",
  "",
  "Thank you for being an early part of Skillset.",
  "The Skillset team — https://skillset.so",
].join("\n");

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

function dedupe(emails: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const e of emails) {
    const norm = e.trim().toLowerCase();
    if (!norm || !norm.includes("@")) continue;
    if (seen.has(norm)) continue;
    seen.add(norm);
    out.push(e.trim());
  }
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const selfTestIdx = args.indexOf("--self-test");
  const selfTestEmail =
    selfTestIdx >= 0 && args[selfTestIdx + 1] ? args[selfTestIdx + 1] : null;
  const fromIdx = args.indexOf("--from");
  const toIdx = args.indexOf("--to");
  const csvIdx = args.indexOf("--csv");
  const csvPath = csvIdx >= 0 && args[csvIdx + 1] ? args[csvIdx + 1] : null;

  const apiKey = loadEnvVar("RESEND_API_KEY");
  if (!apiKey) throw new Error("RESEND_API_KEY missing in web/.env");

  // Load the email HTML.
  let html: string;
  try {
    html = readFileSync(HTML_PATH, "utf8");
  } catch {
    throw new Error(`Could not read email HTML at ${HTML_PATH}`);
  }

  // Build the recipient list.
  let emails: string[];
  if (selfTestEmail) {
    emails = [selfTestEmail];
    console.log(`🧪 Self-test mode → only sending to ${selfTestEmail}`);
  } else if (csvPath) {
    let raw: string;
    try {
      raw = readFileSync(csvPath, "utf8");
    } catch {
      throw new Error(`Could not read CSV at ${csvPath}`);
    }
    const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const rows =
      lines.length && lines[0].toLowerCase().startsWith("email")
        ? lines.slice(1)
        : lines;
    const parsed = rows.map((l) =>
      l.split(",")[0].trim().replace(/^["']|["']$/g, ""),
    );
    emails = dedupe(parsed);
    console.log(`📄 Loaded ${emails.length} unique recipients from ${csvPath}`);
  } else {
    const convexUrl = loadEnvVar("NEXT_PUBLIC_CONVEX_URL");
    const internalKey = loadEnvVar("SKILLSET_INTERNAL_KEY");
    if (!convexUrl) throw new Error("NEXT_PUBLIC_CONVEX_URL missing in web/.env");
    if (!internalKey) throw new Error("SKILLSET_INTERNAL_KEY missing in web/.env");

    const client = new ConvexHttpClient(convexUrl);
    let recipients: { email: string; name?: string }[];
    try {
      recipients = await client.action(api.users.listFreeUserEmailsForBlast, {
        internalKey,
      });
    } catch (err) {
      console.error("❌ Could not fetch recipients from Convex:", err);
      console.error(
        "   Did you deploy the Convex functions? cd web && npx convex deploy",
      );
      process.exitCode = 1;
      return;
    }
    emails = dedupe(recipients.map((r) => r.email));
    console.log(
      `👥 Fetched ${recipients.length} free-plan recipients from Convex → ${emails.length} unique`,
    );
  }

  // Optional CLI slice for partial resend after a failure.
  const sliceFrom =
    fromIdx >= 0 && args[fromIdx + 1] ? parseInt(args[fromIdx + 1], 10) : 0;
  const sliceTo =
    toIdx >= 0 && args[toIdx + 1] ? parseInt(args[toIdx + 1], 10) : emails.length;
  if (sliceFrom !== 0 || sliceTo !== emails.length) {
    console.log(
      `✂️  Slicing recipients [${sliceFrom}, ${sliceTo}) → ${sliceTo - sliceFrom} of ${emails.length}`,
    );
    emails = emails.slice(sliceFrom, sliceTo);
  }

  if (emails.length === 0) {
    console.error("❌ No recipients. Aborting.");
    process.exitCode = 1;
    return;
  }

  if (dryRun) {
    console.log(`📝 DRY-RUN — would send to ${emails.length} recipients:`);
    console.log(emails.slice(0, 5).join("\n"));
    if (emails.length > 5) console.log(`... and ${emails.length - 5} more`);
    return;
  }

  const resend = new Resend(apiKey);

  // Chunk for the Resend per-request recipient cap.
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
      text: TEXT_BODY,
    } as Parameters<typeof resend.emails.send>[0]);

    if (error) {
      failCount++;
      console.error(`    ❌ Batch ${i + 1} failed:`, error);
    } else {
      okCount++;
      console.log(`    ✅ Batch ${i + 1} sent. Message ID: ${data?.id}`);
    }

    // Resend rate-limit safety.
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

main().catch((error) => {
  console.error("Send failed:", error);
  process.exitCode = 1;
});
