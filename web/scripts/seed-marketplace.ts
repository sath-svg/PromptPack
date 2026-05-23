/**
 * Seed marketplace with the 47 official Skillset Team .skill files.
 *
 * Run locally (Node 20+):
 *   cd web
 *   node --env-file=.env.local --import tsx scripts/seed-marketplace.ts
 *
 * If `tsx` is not on PATH, run `npm i -g tsx` first (or `npx tsx ...`).
 *
 * Reads NEXT_PUBLIC_CONVEX_URL + MARKETPLACE_ADMIN_EMAIL (default
 * dksathvik@gmail.com) from web/.env.local.
 *
 * Idempotent — re-running updates metadata + re-uploads bytes, keeps
 * existing purchase rows.
 */

import { promises as fs, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { skillsetPacks } from "../src/lib/pseo/skillset-packs";

// Manual .env loader — avoids dotenv dep + Node --env-file which requires tsx
// to be installed locally for the --import flag.
function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}
loadEnvFile(path.join(process.cwd(), ".env.local"));
loadEnvFile(path.join(process.cwd(), ".env"));

const ADMIN_EMAIL = process.env.MARKETPLACE_ADMIN_EMAIL ?? "dksathvik@gmail.com";

function inferKind(packType: "workflow" | "folder"): "flow" | "folder" {
  return packType === "workflow" ? "flow" : "folder";
}

async function main() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    console.error("NEXT_PUBLIC_CONVEX_URL not set");
    process.exit(1);
  }
  const apiBase = convexUrl
    .replace(/\.site$/, ".cloud")
    .replace(/\/+$/, "");
  console.log(`Convex endpoint: ${apiBase}`);

  const client = new ConvexHttpClient(apiBase);

  const sellerId = (await client.query(api.marketplace.getAdminSellerId, {
    email: ADMIN_EMAIL,
  })) as Id<"users"> | null;
  if (!sellerId) {
    console.error(`Admin seller not found in users table (email=${ADMIN_EMAIL})`);
    process.exit(1);
  }
  console.log(`Admin sellerId: ${sellerId}`);

  const skillsDir = path.join(process.cwd(), "public", "skillsets");
  let created = 0;
  let updated = 0;
  let errored = 0;

  for (const pack of skillsetPacks) {
    const slug = pack.id;
    const filePath = path.join(skillsDir, `${slug}.skill`);
    try {
      const buf = await fs.readFile(filePath);
      const fileData = buf.toString("base64");
      const kind = inferKind(pack.type);
      const headers = pack.prompts
        .slice(0, 6)
        .map((p) => `${p.icon ? p.icon + " " : ""}${p.label}`);
      const result = await client.action(
        api.marketplace.seedOfficialListing,
        {
          sellerId,
          slug,
          kind,
          title: pack.title,
          description: pack.description,
          icon: pack.icon,
          tags: Array.from(
            new Set([
              pack.persona.toLowerCase(),
              ...pack.roleSlugs,
              pack.type,
            ]),
          ).slice(0, 8),
          fileData,
          promptCount: pack.prompts.length,
          flowPreview:
            kind === "flow"
              ? { stepCount: pack.prompts.length, stepLabels: headers }
              : undefined,
          folderPreview:
            kind === "folder" ? { promptHeaders: headers } : undefined,
        },
      );
      if (result.created) {
        created++;
        console.log(`  + ${slug}`);
      } else {
        updated++;
        console.log(`  ~ ${slug}`);
      }
    } catch (e) {
      errored++;
      console.error(`  ✗ ${slug}: ${e instanceof Error ? e.message : e}`);
    }
  }

  console.log(
    `\nDone — created=${created} updated=${updated} errored=${errored}`,
  );
  if (errored > 0) process.exit(2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
