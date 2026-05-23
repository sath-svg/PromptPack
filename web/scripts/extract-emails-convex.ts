import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

// Extract user emails from the Convex `users` table via `npx convex run`.
// Users are mirrored from BetterAuth into Convex on signup, so this is a
// reachable equivalent to extract-emails-pg.ts (which needs a PG connection
// that times out from local dev).
//
// Usage:
//   npx tsx scripts/extract-emails-convex.ts                # → scripts/users.csv
//   npx tsx scripts/extract-emails-convex.ts --out path.csv
//   npx tsx scripts/extract-emails-convex.ts --print
//   npx tsx scripts/extract-emails-convex.ts --since 2026-01-01

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

type ConvexUser = {
  _id: string;
  _creationTime: number;
  email?: string;
  name?: string;
  createdAt?: number;
  lastActive?: number;
  plan?: string;
};

function runConvex(): ConvexUser[] {
  const isWin = process.platform === "win32";
  const result = spawnSync(
    isWin ? "npx.cmd" : "npx",
    ["convex", "run", "users:listUsersForInactivityScan"],
    { encoding: "utf8", shell: isWin, cwd: process.cwd() },
  );
  if (result.status !== 0) {
    console.error(result.stderr);
    throw new Error(`convex run exited with status ${result.status}`);
  }
  const stdout = result.stdout.trim();
  const start = stdout.indexOf("[");
  if (start < 0) throw new Error(`Could not find JSON array in convex output:\n${stdout}`);
  const json = stdout.slice(start);
  return JSON.parse(json) as ConvexUser[];
}

function main() {
  const outPath = arg("--out") ?? join(process.cwd(), "scripts", "users.csv");
  const printStdout = hasFlag("--print");
  const since = arg("--since");
  const sinceMs = since ? Date.parse(since) : 0;

  console.log("📡 Fetching users from Convex...");
  const users = runConvex();
  console.log(`📦 ${users.length} rows from Convex`);

  const seen = new Set<string>();
  const dedup: { email: string; name: string; created: number; lastActive: number }[] = [];
  for (const u of users) {
    const email = String(u.email ?? "").trim().toLowerCase();
    if (!email || !email.includes("@") || !email.includes(".")) continue;
    if (seen.has(email)) continue;
    const created = u.createdAt ?? u._creationTime ?? 0;
    if (sinceMs && created < sinceMs) continue;
    seen.add(email);
    dedup.push({
      email,
      name: String(u.name ?? ""),
      created,
      lastActive: u.lastActive ?? 0,
    });
  }
  dedup.sort((a, b) => a.created - b.created);

  console.log(`✅ ${dedup.length} unique emails`);

  const header = "email,name,createdAt,lastActive";
  const lines = [header];
  for (const r of dedup) {
    const name = r.name.replace(/"/g, '""');
    const created = r.created ? new Date(r.created).toISOString() : "";
    const last = r.lastActive ? new Date(r.lastActive).toISOString() : "";
    lines.push(`${r.email},"${name}",${created},${last}`);
  }
  writeFileSync(outPath, lines.join("\n") + "\n", "utf8");
  console.log(`📄 wrote ${outPath}`);

  if (printStdout) {
    for (const r of dedup) console.log(r.email);
  }
}

main();
