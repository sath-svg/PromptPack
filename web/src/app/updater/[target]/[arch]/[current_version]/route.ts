import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Tauri auto-updater endpoint.
 *
 * Wired by app/src-tauri/tauri.conf.json:
 *   "updater.endpoints": [
 *     "https://skillset.so/updater/{{target}}/{{arch}}/{{current_version}}"
 *   ]
 *
 * Tauri polls this URL on launch + every few hours. Two valid responses:
 *   • 204 No Content   → "you're already on the latest"
 *   • 200 + JSON       → "here's an update, with signature and URL"
 *
 * The JSON shape (Tauri v2):
 *   {
 *     "version": "1.1.0",
 *     "notes": "...",
 *     "pub_date": "2026-05-14T12:00:00Z",
 *     "platforms": {
 *       "darwin-aarch64": { "signature": "<base64>", "url": "https://..." },
 *       "darwin-x86_64":  { "signature": "<base64>", "url": "https://..." },
 *       "windows-x86_64": { "signature": "<base64>", "url": "https://..." },
 *       "windows-aarch64":{ "signature": "<base64>", "url": "https://..." },
 *       "linux-x86_64":   { "signature": "<base64>", "url": "https://..." }
 *     }
 *   }
 *
 * We compare the requesting client's `current_version` against the manifest's
 * `version`; if equal-or-newer, we return 204 so Tauri stays quiet. Otherwise
 * we return the full manifest so the client can download + verify with the
 * minisign pubkey baked into tauri.conf.json.
 *
 * The manifest itself lives at web/public/updater/latest.json so it can be
 * edited (or replaced by a CI step) without redeploying the Next.js app.
 */

interface UpdaterPlatform {
  signature: string;
  url: string;
}

interface UpdaterManifest {
  version: string;
  notes?: string;
  pub_date?: string;
  platforms: Record<string, UpdaterPlatform>;
}

// Convert Tauri's `{{target}}` ("darwin" | "windows" | "linux") plus
// `{{arch}}` ("x86_64" | "aarch64" | "i686") into the platform key used in
// latest.json (e.g. "darwin-aarch64"). Returns null if target/arch combo is
// not recognised so we can return 204 rather than a malformed response.
function platformKey(target: string, arch: string): string | null {
  const t = target.toLowerCase();
  const a = arch.toLowerCase();
  if (!["darwin", "windows", "linux"].includes(t)) return null;
  if (!["x86_64", "aarch64", "i686"].includes(a)) return null;
  return `${t}-${a}`;
}

// Compare semver loosely — enough to decide "is X >= Y". Doesn't handle
// pre-release tags, build metadata, or all the edge cases. For this
// updater channel we only ship stable X.Y.Z, so this is sufficient.
function isAtLeast(version: string, atLeast: string): boolean {
  const a = version.split(".").map((n) => parseInt(n, 10) || 0);
  const b = atLeast.split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    if (av > bv) return true;
    if (av < bv) return false;
  }
  return true; // equal
}

let cachedManifest: UpdaterManifest | null = null;
let cachedAt = 0;
const CACHE_MS = 60 * 1000;

async function loadManifest(): Promise<UpdaterManifest | null> {
  const now = Date.now();
  if (cachedManifest && now - cachedAt < CACHE_MS) {
    return cachedManifest;
  }
  try {
    const path = join(process.cwd(), "public", "updater", "latest.json");
    const raw = await readFile(path, "utf8");
    const parsed = JSON.parse(raw) as UpdaterManifest;
    if (!parsed.version || !parsed.platforms) return null;
    cachedManifest = parsed;
    cachedAt = now;
    return parsed;
  } catch {
    return null;
  }
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ target: string; arch: string; current_version: string }> },
) {
  const { target, arch, current_version } = await context.params;

  const platform = platformKey(target, arch);
  if (!platform) {
    return new NextResponse(null, { status: 204 });
  }

  const manifest = await loadManifest();
  if (!manifest) {
    // No manifest published yet — tell client they're up to date so we
    // don't break the launch flow on every poll.
    return new NextResponse(null, { status: 204 });
  }

  if (isAtLeast(current_version, manifest.version)) {
    return new NextResponse(null, { status: 204 });
  }

  const platformEntry = manifest.platforms[platform];
  if (!platformEntry) {
    // Platform not in manifest (e.g. ARM Linux) — silent no-op.
    return new NextResponse(null, { status: 204 });
  }

  return NextResponse.json(
    {
      version: manifest.version,
      notes: manifest.notes ?? "",
      pub_date: manifest.pub_date ?? new Date().toISOString(),
      // Tauri only reads the platform matching its own key, but we send the
      // full block so debugging is easier when curl-testing.
      platforms: {
        [platform]: platformEntry,
      },
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600",
      },
    },
  );
}
