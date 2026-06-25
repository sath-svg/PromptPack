import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Resend } from "resend";

// One-off manual send of the abandoned-checkout / feedback email to a single
// recipient, while the Loops `checkoutCancelled` workflow isn't deployed yet.
//
// Run from web/:
//   cd web && bun run scripts/send-checkout-abandoned-email.ts --to someone@example.com --name "BAM user"
//
// Flags:
//   --to <email>   required recipient
//   --name <name>  optional; personalizes the greeting ("Hi <name>,")

const FROM_EMAIL = "Skillset <support@skillset.so>";
const REPLY_TO = "support@skillset.so";
const SUBJECT = "Did something stop you?";
const HTML_PATH = join(process.cwd(), "..", "checkout-abandoned-email.html");

function loadEnvVar(key: string): string | undefined {
  if (process.env[key]) return process.env[key];
  try {
    const contents = readFileSync(join(process.cwd(), ".env"), "utf8");
    const line = contents.split(/\r?\n/).find((row) => row.startsWith(`${key}=`));
    if (!line) return undefined;
    return line.slice(key.length + 1).trim().replace(/^["']|["']$/g, "");
  } catch {
    return undefined;
  }
}

function arg(name: string): string | null {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

async function main() {
  const to = arg("--to");
  const name = arg("--name");
  if (!to || !to.includes("@")) throw new Error("Missing/invalid --to <email>");

  const apiKey = loadEnvVar("RESEND_API_KEY");
  if (!apiKey) throw new Error("RESEND_API_KEY missing in web/.env");

  let html = readFileSync(HTML_PATH, "utf8");
  if (name) html = html.replace("Hi there,", `Hi ${name},`);

  const text = [
    `Hi ${name ?? "there"},`,
    "",
    "We noticed you started setting up Skillset but didn't finish checkout. No worries at all. We'd genuinely love to know what got in the way: pricing, a missing feature, or just timing?",
    "",
    "A one-line reply helps us build the right thing. Or write to feedback@skillset.so. Need a hand with something specific? support@skillset.so is here for you.",
    "",
    "Finish your 3-day free trial: https://skillset.so/start-trial",
    "",
    "The Skillset team — https://skillset.so",
  ].join("\n");

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: SUBJECT,
    html,
    replyTo: REPLY_TO,
    text,
  } as Parameters<typeof resend.emails.send>[0]);

  if (error) {
    console.error("❌ Send failed:", error);
    process.exitCode = 1;
    return;
  }
  console.log(`✅ Sent to ${to}${name ? ` (${name})` : ""}. Message ID: ${data?.id}`);
}

main().catch((e) => {
  console.error("Send failed:", e);
  process.exitCode = 1;
});
