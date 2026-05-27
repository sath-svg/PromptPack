#!/usr/bin/env node
/**
 * Skilly Telegram sticker build pipeline.
 *
 * For each entry in STICKERS:
 *   1. Launch headless Chromium via Playwright.
 *   2. Open `http://localhost:1420/sticker-harness.html?...` (Vite dev).
 *   3. Wait for `body.skilly-ready` so the first animation frame settled.
 *   4. Screenshot `recordSeconds × 30` PNG frames at 33.3 ms intervals
 *      (`omitBackground: true` keeps the WebM transparent).
 *   5. Encode with ffmpeg VP9 at CRF 32; retries CRF 36 then 40 if the
 *      file overshoots Telegram's 256 KB sticker cap.
 *   6. Verify codec / dims / duration / no-audio via ffprobe.
 *
 * Output: `web/public/img/stickers/skilly_{id}.webm`.
 *
 * Usage:
 *   pnpm dev    (in another terminal — Vite must be serving port 1420)
 *   node scripts/build-skilly-stickers.mjs           # idempotent
 *   node scripts/build-skilly-stickers.mjs --force   # rebuild all
 */

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import net from 'node:net';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ---------- Sticker matrix (mirrors stickers.ts STICKER_IDS) ----------
// `fps` is optional; defaults to FPS_DEFAULT below. High-motion entries
// (spin, hop) override to 15 because constant whole-body rotation with
// an alpha channel blows past Telegram's 256 KB cap even at CRF 63.
const STICKERS = [
  { id: 'default_smile',  mouth: 'smile',    eyes: 'normal',     state: 'default',     sleeping: false, passedOut: false, recordSeconds: 3, extraClass: '' },
  { id: 'default_sad',    mouth: 'sad',      eyes: 'normal',     state: 'default',     sleeping: false, passedOut: false, recordSeconds: 3, extraClass: '' },
  { id: 'writing',        mouth: 'smile',    eyes: 'normal',     state: 'writing',     sleeping: false, passedOut: false, recordSeconds: 3, extraClass: '' },
  { id: 'painting',       mouth: 'smile',    eyes: 'normal',     state: 'painting',    sleeping: false, passedOut: false, recordSeconds: 3, extraClass: '' },
  { id: 'reading',        mouth: 'smile',    eyes: 'normal',     state: 'reading',     sleeping: false, passedOut: false, recordSeconds: 3, extraClass: '' },
  { id: 'thinking',       mouth: 'thinking', eyes: 'thinking',   state: 'thinking',    sleeping: false, passedOut: false, recordSeconds: 3, extraClass: '' },
  { id: 'marketplace',    mouth: 'smile',    eyes: 'normal',     state: 'marketplace', sleeping: false, passedOut: false, recordSeconds: 3, extraClass: '' },
  { id: 'sleeping',       mouth: 'flat',     eyes: 'sleeping',   state: 'default',     sleeping: true,  passedOut: false, recordSeconds: 3, extraClass: '' },
  { id: 'passed_out',     mouth: 'flat',     eyes: 'passedOut',  state: 'passedOut',   sleeping: false, passedOut: true,  recordSeconds: 3, extraClass: 'hop',  fps: 15 },
  { id: 'o_mouth',        mouth: 'o',        eyes: 'normal',     state: 'default',     sleeping: false, passedOut: false, recordSeconds: 3, extraClass: 'spin', fps: 15 },
];

const FORCE = process.argv.includes('--force');
const VITE_PORT = 1420;
// 20 fps default for low-motion stickers. High-motion entries (spin,
// hop in STICKERS[]) override to 15 because constant-motion frames
// with alpha blow past the 256 KB cap even at CRF 63.
const FPS_DEFAULT = 20;
const OUT_DIR = resolve(__dirname, '../../web/public/img/stickers');
const TMP_DIR = resolve(__dirname, '../.sticker-tmp');
const MAX_BYTES = 256 * 1024; // Telegram sticker cap

mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(TMP_DIR, { recursive: true });

// ---------- Helpers ----------

function tcpProbe(port, host) {
  return new Promise((res) => {
    const s = net.createConnection({ port, host }, () => {
      s.end();
      res(true);
    });
    s.on('error', () => res(false));
    s.setTimeout(500, () => {
      s.destroy();
      res(false);
    });
  });
}

// Vite can bind IPv4 (127.0.0.1) or IPv6 (::1) depending on OS / config.
// Probe both so the build script doesn't false-negative when the dev
// server is up but on the other family.
async function waitForVite(port, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await tcpProbe(port, '127.0.0.1')) return true;
    if (await tcpProbe(port, '::1')) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

function run(cmd, args, opts = {}) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, args, { stdio: 'pipe', ...opts });
    let stdout = '';
    let stderr = '';
    p.stdout?.on('data', (d) => (stdout += d.toString()));
    p.stderr?.on('data', (d) => (stderr += d.toString()));
    p.on('error', rej);
    p.on('close', (code) => {
      if (code === 0) res({ stdout, stderr });
      else rej(new Error(`${cmd} exited ${code}\n${stderr}`));
    });
  });
}

// ffmpeg / ffprobe paths via @ffmpeg-installer when available; else
// fall back to system PATH.
async function ffmpegPath() {
  try {
    const mod = await import('@ffmpeg-installer/ffmpeg');
    return mod.default?.path ?? mod.path;
  } catch {
    return 'ffmpeg';
  }
}
async function ffprobePath() {
  try {
    const mod = await import('@ffprobe-installer/ffprobe');
    return mod.default?.path ?? mod.path;
  } catch {
    return 'ffprobe';
  }
}

async function probe(file) {
  const ff = await ffprobePath();
  const { stdout } = await run(ff, [
    '-v', 'quiet',
    '-print_format', 'json',
    '-show_streams',
    '-show_format',
    file,
  ]);
  const j = JSON.parse(stdout);
  const v = j.streams?.find((s) => s.codec_type === 'video');
  const hasAudio = j.streams?.some((s) => s.codec_type === 'audio');
  return {
    codec: v?.codec_name,
    width: v?.width,
    height: v?.height,
    duration: Number(j.format?.duration ?? 0),
    hasAudio: Boolean(hasAudio),
    bytes: statSync(file).size,
  };
}

async function encodeWebm({ framesDir, outFile, recordSeconds, crf, fps }) {
  const ff = await ffmpegPath();
  await run(ff, [
    '-y',
    '-framerate', String(fps),
    '-i', join(framesDir, 'frame_%04d.png'),
    '-c:v', 'libvpx-vp9',
    '-pix_fmt', 'yuva420p',
    '-b:v', '0',
    '-crf', String(crf),
    '-auto-alt-ref', '0',
    // `-deadline best -cpu-used 0` = slowest but smallest VP9 output.
    // Sticker build is offline so the extra encode time is fine; we
    // care about bytes-per-file (Telegram cap = 256 KB).
    '-deadline', 'best',
    '-cpu-used', '0',
    // Tile + row threading for the larger encodes; harmless on small.
    '-tile-columns', '2',
    '-row-mt', '1',
    '-frame-parallel', '1',
    '-an',
    '-t', String(recordSeconds),
    outFile,
  ]);
}

// ---------- Main ----------

async function main() {
  console.log(`[stickers] output → ${OUT_DIR}`);
  console.log(`[stickers] checking Vite on port ${VITE_PORT}…`);
  if (!(await waitForVite(VITE_PORT))) {
    console.error(
      `[stickers] Vite not reachable on ${VITE_PORT}. Run \`pnpm dev\` (or \`npm run dev\`) in app/ first.`,
    );
    process.exit(1);
  }
  console.log(`[stickers] Vite OK.`);

  // Lazy-load Playwright so the script can at least print the help message
  // even before `npx playwright install chromium` has been run.
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    console.error(
      `[stickers] Playwright not installed. Run \`npm install\` in app/ then \`npx playwright install chromium\`.`,
    );
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  let built = 0;
  let skipped = 0;
  try {
    for (const s of STICKERS) {
      const outFile = join(OUT_DIR, `skilly_${s.id}.webm`);
      if (existsSync(outFile) && !FORCE) {
        console.log(`[skip] skilly_${s.id}.webm exists`);
        skipped++;
        continue;
      }

      const frameDir = join(TMP_DIR, s.id);
      rmSync(frameDir, { recursive: true, force: true });
      mkdirSync(frameDir, { recursive: true });

      const ctx = await browser.newContext({
        viewport: { width: 512, height: 512 },
        deviceScaleFactor: 1,
      });
      const page = await ctx.newPage();
      const q = new URLSearchParams({
        mouth: s.mouth,
        eyes: s.eyes,
        state: s.state,
        sleeping: s.sleeping ? '1' : '0',
        passedOut: s.passedOut ? '1' : '0',
        extraClass: s.extraClass,
      }).toString();

      console.log(`[render] ${s.id}`);
      await page.goto(`http://localhost:${VITE_PORT}/sticker-harness.html?${q}`, {
        waitUntil: 'domcontentloaded',
      });
      await page.waitForFunction(
        () => document.body.classList.contains('skilly-ready'),
        null,
        { timeout: 10000 },
      );
      // No warm-up — `skilly-ready` is set AFTER the harness resets every
      // CSS animation's currentTime to 0. Capturing immediately means
      // frame 0 lands at cycle position 0 → seamless Telegram loop. Any
      // delay here re-introduces the seam this fix is meant to remove.

      const fps = s.fps ?? FPS_DEFAULT;
      const frameCount = s.recordSeconds * fps;
      const intervalMs = 1000 / fps;
      const startedAt = Date.now();
      for (let i = 0; i < frameCount; i++) {
        const targetAt = startedAt + i * intervalMs;
        const wait = targetAt - Date.now();
        if (wait > 0) await page.waitForTimeout(wait);
        await page.screenshot({
          path: join(frameDir, `frame_${String(i + 1).padStart(4, '0')}.png`),
          omitBackground: true,
          type: 'png',
          clip: { x: 0, y: 0, width: 512, height: 512 },
        });
      }
      await ctx.close();

      // Encode w/ progressive CRF bisection until under cap. VP9 CRF
      // valid range = 0..63; values above ~50 trade visible quality
      // for size — needed for the constant-motion stickers (spin, hop).
      const crfLadder = [32, 38, 44, 50, 56, 63];
      let lastInfo = null;
      let success = false;
      for (const crf of crfLadder) {
        await encodeWebm({
          framesDir: frameDir,
          outFile,
          recordSeconds: s.recordSeconds,
          crf,
          fps,
        });
        lastInfo = await probe(outFile);
        console.log(
          `[encode] ${s.id} crf=${crf} ${(lastInfo.bytes / 1024).toFixed(1)} KB`,
        );
        if (lastInfo.bytes <= MAX_BYTES) {
          success = true;
          break;
        }
      }
      if (!success) {
        throw new Error(
          `[stickers] ${s.id} exceeded ${MAX_BYTES} bytes at all CRF tiers; last=${lastInfo?.bytes}`,
        );
      }
      // Hard checks against Telegram sticker spec.
      if (lastInfo.codec !== 'vp9') {
        throw new Error(`[stickers] ${s.id} wrong codec: ${lastInfo.codec}`);
      }
      if (lastInfo.width !== 512 || lastInfo.height !== 512) {
        throw new Error(
          `[stickers] ${s.id} wrong dims: ${lastInfo.width}x${lastInfo.height}`,
        );
      }
      if (lastInfo.duration > 3.05) {
        throw new Error(
          `[stickers] ${s.id} duration too long: ${lastInfo.duration}s`,
        );
      }
      if (lastInfo.hasAudio) {
        throw new Error(`[stickers] ${s.id} has audio stream (must be none)`);
      }

      rmSync(frameDir, { recursive: true, force: true });
      built++;
    }
  } finally {
    await browser.close();
  }

  console.log(
    `[stickers] done. built=${built} skipped=${skipped} out=${OUT_DIR}`,
  );
  // Tip for next step.
  console.log(
    `[stickers] next: cd web && node scripts/upload-assets-to-r2.mjs   # uploads ${readdirSync(OUT_DIR).length} files to R2`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
