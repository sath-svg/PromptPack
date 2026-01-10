import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Resend } from "resend";
import { buildLiveEmailHtml, LIVE_EMAIL_SUBJECT } from "../src/lib/email/live-email";

const cliRecipients = process.argv.slice(2);
const EMAIL_TO = cliRecipients.length > 0 ? cliRecipients : ["sathvik.work@gmail.com"];
const FROM_EMAIL = "PromptPack Support <support@pmtpk.com>";
const REPLY_TO = "support@pmtpk.com";

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

async function main() {
  const apiKey = loadEnvVar("RESEND_API_KEY");
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set. Add it to web/.env or your shell env.");
  }

  const resend = new Resend(apiKey);
  const html = buildLiveEmailHtml();

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: EMAIL_TO,
    subject: LIVE_EMAIL_SUBJECT,
    html,
    replyTo: REPLY_TO,
  });

  if (error) {
    throw error;
  }

  console.log(`Email sent to ${EMAIL_TO.join(", ")}. Id: ${data?.id ?? "unknown"}`);
}

main().catch((error) => {
  console.error("Send failed:", error);
  process.exitCode = 1;
});
