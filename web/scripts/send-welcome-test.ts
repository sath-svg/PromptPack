import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Resend } from "resend";

const FROM_EMAIL = "Skillset <support@skillset.so>";
const SUBJECT = "Welcome to Skillset!";
const REPLY_TO = "support@skillset.so";

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
    throw new Error(
      "RESEND_API_KEY is not set. Add it to web/.env or your shell env.",
    );
  }

  const html = readFileSync(
    join(__dirname, "preview-welcome-email.html"),
    "utf-8",
  );

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: "support@skillset.so",
    bcc: ["adammueller777@gmail.com", "dksathvik@gmail.com"],
    subject: SUBJECT,
    html,
    replyTo: REPLY_TO,
  });

  if (error) {
    console.error("Failed:", error);
    process.exit(1);
  }

  console.log("Sent! Id:", data?.id);
}

main();
