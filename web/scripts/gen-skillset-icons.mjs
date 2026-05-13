import sharp from "sharp";
import { writeFileSync, renameSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..", "public");
const SRC_LOGO = join(ROOT, "img", "skillset_logo.png");
const SRC_OG = join(ROOT, "img", "skillset_og.jpg");

const PNG_SIZES = [16, 48, 128, 192, 256, 512];
const ICO_SIZES = [16, 32, 48];

async function genPngs() {
  for (const size of PNG_SIZES) {
    const out = join(ROOT, "img", `icon-${size}.png`);
    await sharp(SRC_LOGO)
      .resize(size, size, { fit: "cover" })
      .png({ compressionLevel: 9 })
      .toFile(out);
    console.log(`wrote icon-${size}.png`);
  }
}

async function genOg() {
  const finalPath = join(ROOT, "img", "skillset_og.jpg");
  const tmpPath = join(ROOT, "img", "skillset_og.tmp.jpg");
  const buf = await sharp(SRC_OG)
    .resize(1200, 630, { fit: "cover" })
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();
  writeFileSync(tmpPath, buf);
  renameSync(tmpPath, finalPath);
  console.log(`wrote skillset_og.jpg (1200x630)`);
}

// Minimal ICO container: 6-byte header + 16-byte directory entries + PNG payloads
async function genFavicon() {
  const pngs = await Promise.all(
    ICO_SIZES.map((s) =>
      sharp(SRC_LOGO)
        .resize(s, s, { fit: "cover" })
        .png({ compressionLevel: 9 })
        .toBuffer()
    )
  );

  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = headerSize + dirEntrySize * pngs.length;
  let offset = dirSize;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);            // reserved
  header.writeUInt16LE(1, 2);            // type: 1 = ICO
  header.writeUInt16LE(pngs.length, 4);  // image count

  const entries = pngs.map((png, i) => {
    const size = ICO_SIZES[i];
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 = 256)
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2);                       // color palette
    entry.writeUInt8(0, 3);                       // reserved
    entry.writeUInt16LE(1, 4);                    // color planes
    entry.writeUInt16LE(32, 6);                   // bits per pixel
    entry.writeUInt32LE(png.length, 8);           // image size
    entry.writeUInt32LE(offset, 12);              // offset
    offset += png.length;
    return entry;
  });

  const ico = Buffer.concat([header, ...entries, ...pngs]);
  writeFileSync(join(ROOT, "favicon.ico"), ico);
  console.log(`wrote favicon.ico (${ICO_SIZES.join("/")})`);
}

await genOg();
await genPngs();
await genFavicon();
console.log("done.");
