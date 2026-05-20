/**
 * Compile the skillset-packs manifest into one .skill JSON file per pack.
 *
 *   npx tsx web/scripts/build-skillset-files.ts
 *
 * Runs automatically as part of `npm run prebuild` (see web/package.json).
 *
 * Output: web/public/skillsets/<pack.id>.skill
 *
 * The .skill format is the same shape the Tauri desktop app's
 * Import flow already parses (web/src/components/skillsets/persona-card.tsx
 * download links serve these files directly).
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { skillsetPacks, type SkillsetPack } from "../src/lib/pseo/skillset-packs";

// Deterministic timestamp — keeps generated files diff-stable across runs.
// Bump this when shipping a pack revision that should bust caches.
const EXPORTED_AT = 1716120000000;

interface SkillFileJson {
  version: "1.0";
  type: "skillset";
  title: string;
  icon: string;
  description: string;
  isWorkflow?: true;
  prompts: Array<{
    id: string;
    label: string;
    icon: string;
    purpose: string;
    template: string;
  }>;
  exportedAt: number;
}

function packToFile(pack: SkillsetPack): SkillFileJson {
  const file: SkillFileJson = {
    version: "1.0",
    type: "skillset",
    title: pack.title,
    icon: pack.icon,
    description: pack.description,
    prompts: pack.prompts.map((p) => ({
      id: p.id,
      label: p.label,
      icon: p.icon,
      purpose: p.purpose,
      template: p.template,
    })),
    exportedAt: EXPORTED_AT,
  };
  if (pack.type === "workflow") {
    // Insert isWorkflow right after description to match the legacy field
    // order in the existing 4 .skill files. Field order matters because
    // some downstream tools diff these as text.
    return {
      version: file.version,
      type: file.type,
      title: file.title,
      icon: file.icon,
      description: file.description,
      isWorkflow: true,
      prompts: file.prompts,
      exportedAt: file.exportedAt,
    };
  }
  return file;
}

async function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  const outDir = resolve(here, "../public/skillsets");
  await mkdir(outDir, { recursive: true });

  let written = 0;
  for (const pack of skillsetPacks) {
    const file = packToFile(pack);
    const outPath = resolve(outDir, `${pack.id}.skill`);
    // Use 2-space indent to match the existing files byte-for-byte.
    await writeFile(outPath, JSON.stringify(file, null, 2) + "\n", "utf8");
    written += 1;
  }

  console.log(
    `[build-skillsets] wrote ${written} .skill file${written === 1 ? "" : "s"} to ${outDir}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
