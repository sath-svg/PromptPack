import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Resend } from "resend";

// Legacy Pro grandfather email — single recipient.
// Run from web/ directory:
//   cd web && bun run scripts/send-legacy-pro-email.ts --dry-run
//   cd web && bun run scripts/send-legacy-pro-email.ts
//
// Body is loaded from preview-legacy-pro-email.html so the live preview is the
// single source of truth — no drift between what you see and what gets sent.

const FROM_EMAIL = "Skillset <support@skillset.so>";
const REPLY_TO = "support@skillset.so";
const SUBJECT = "About your Pro plan — you're locked in";

// Hardcoded recipient. The only legacy_pro user.
// If this ever needs to expand, query Convex:
//   `users:listLegacyProEmailsForBlast` with the gating key.
const RECIPIENT = "wilmar.martina@globalwireai.com";

const HTML_TEMPLATE_PATH = join(
  process.cwd(),
  "scripts",
  "preview-legacy-pro-email.html",
);

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

const TEXT_BODY = [
  "Hey Wilmar,",
  "",
  "Quick apology first — the migration email I sent earlier today didn't call out that you're on the early-bird plan. That was an oversight. Here's the full picture:",
  "",
  "Pro is moving to $15/month for new sign-ups. You're not affected.",
  "",
  "Your price timeline:",
  "  • Now → end of October 2026: $1.99/month (early-bird, 5 cycles remaining of 6)",
  "  • November 2026 onward: $9/month — your locked-in legacy rate, for the lifetime of your subscription",
  "",
  "One thing to know about credits: starting your NEXT billing cycle, the legacy plan moves to 300 credits/month (down from 750). This billing cycle is unchanged — you still have 750 to use as normal. The change is not retroactive and applies regardless of which price phase you're in.",
  "",
  "Why: inference costs across every model have climbed sharply since you signed up. Lowering the credit allowance is what makes $9 sustainable for us long-term while still giving you every Pro feature.",
  "",
  "If you regularly burn more than ~300 credits, the new $15 Pro plan gives you 750/month. Cancel any time. Upgrade here:",
  "  https://skillset.so/account/upgrade?from=legacy",
  "",
  "What stays the same:",
  "  • Your account, packs, history — untouched",
  "  • Every Pro feature, every premium model",
  "  • Encrypted prompts and skills (Skill Preset MVP)",
  "  • Your locked-in price — no auto-bumps, ever (early-bird honored in full)",
  "",
  "Questions about credits, the upgrade, or anything else? Reply directly — I read every one personally.",
  "",
  "— The Skillset team",
  "https://skillset.so",
].join("\n");

async function main() {
  const apiKey = loadEnvVar("RESEND_API_KEY");
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set. Add it to web/.env or your shell env.");
  }

  const html = readFileSync(HTML_TEMPLATE_PATH, "utf8");

  const dryRun = process.argv.includes("--dry-run");
  if (dryRun) {
    console.log("\n--- DRY RUN ---");
    console.log(`Recipient: ${RECIPIENT}`);
    console.log(`From:      ${FROM_EMAIL}`);
    console.log(`Subject:   ${SUBJECT}`);
    console.log(`Body:      loaded from ${HTML_TEMPLATE_PATH} (${html.length} bytes)`);
    console.log("\nRe-run without --dry-run to actually send.\n");
    return;
  }

  const resend = new Resend(apiKey);
  console.log(`📨 Sending legacy Pro grandfather email to ${RECIPIENT}…`);

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: RECIPIENT,
    subject: SUBJECT,
    html,
    replyTo: REPLY_TO,
    text: TEXT_BODY,
  } as any);

  if (error) {
    console.error("❌ Send failed:", error);
    process.exitCode = 1;
    return;
  }

  console.log(`✅ Sent. Message ID: ${data?.id}`);
  console.log(`From:    ${FROM_EMAIL}`);
  console.log(`To:      ${RECIPIENT}`);
  console.log(`Subject: ${SUBJECT}`);
}

main();
