/**
 * One-time script to generate .pmtpk files for all presets.
 * Run: npx tsx web/scripts/generate-presets.ts
 */
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { gzipSync } from "zlib";

// XOR key: "PromptPack"
const OBFUSCATE_KEY = new Uint8Array([
  0x50, 0x72, 0x6f, 0x6d, 0x70, 0x74, 0x50, 0x61, 0x63, 0x6b,
]);
const MAGIC_OBFUSCATED = new Uint8Array([0x50, 0x50, 0x4b, 0x00]);
const FORMAT_VERSION = 0x01;
const HASH_LENGTH = 32;
const HEADER_SIZE = MAGIC_OBFUSCATED.length + 1 + HASH_LENGTH; // 37 bytes

function xorObfuscate(data: Uint8Array): Uint8Array {
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] ^ OBFUSCATE_KEY[i % OBFUSCATE_KEY.length];
  }
  return result;
}

async function computeHash(data: Uint8Array): Promise<Uint8Array> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", data as BufferSource);
  return new Uint8Array(hashBuffer);
}

async function encodePmtpk(jsonStr: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const jsonBytes = encoder.encode(jsonStr);
  const hash = await computeHash(jsonBytes);
  const compressed = gzipSync(Buffer.from(jsonBytes));
  const obfuscated = xorObfuscate(new Uint8Array(compressed));

  const result = new Uint8Array(HEADER_SIZE + obfuscated.length);
  result.set(MAGIC_OBFUSCATED, 0);
  result[MAGIC_OBFUSCATED.length] = FORMAT_VERSION;
  result.set(hash, MAGIC_OBFUSCATED.length + 1);
  result.set(obfuscated, HEADER_SIZE);
  return result;
}

// Dynamically import preset data (TS with path aliases won't work, use relative)
async function main() {
  // We inline-import to avoid TS module issues
  const { PRESETS } = await import(
    "../src/app/marketplace/presets/preset-data.js"
  );

  const outDir = join(__dirname, "..", "public", "presets");
  mkdirSync(outDir, { recursive: true });

  const now = Date.now();

  for (const preset of PRESETS) {
    const packData = {
      version: 1,
      exportedAt: now,
      prompts: preset.prompts.map(
        (p: { header: string; text: string }) => ({
          text: p.text,
          header: p.header,
          source: "promptpack",
          createdAt: now,
        })
      ),
    };

    const bytes = await encodePmtpk(JSON.stringify(packData));
    const filePath = join(outDir, preset.fileName);
    writeFileSync(filePath, bytes);
    console.log(`Generated: ${preset.fileName} (${bytes.length} bytes)`);
  }

  console.log(`\nDone! Generated ${PRESETS.length} preset files.`);
}

main().catch(console.error);
