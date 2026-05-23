import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Pool } from "pg";

// Extract user emails from BetterAuth PostgreSQL `user` table.
// Usage:
//   npx tsx scripts/extract-emails-pg.ts                     # writes scripts/users.csv (all users)
//   npx tsx scripts/extract-emails-pg.ts --out path.csv      # custom output path
//   npx tsx scripts/extract-emails-pg.ts --verified-only     # only emailVerified=true
//   npx tsx scripts/extract-emails-pg.ts --since 2026-01-01  # filter by createdAt >= date
//   npx tsx scripts/extract-emails-pg.ts --print             # also print emails to stdout
//   npx tsx scripts/extract-emails-pg.ts --count             # only print row count, no file

function loadEnvVar(key: string): string | undefined {
  if (process.env[key]) return process.env[key];
  for (const filename of [".env.local", ".env"]) {
    try {
      const envPath = join(process.cwd(), filename);
      const contents = readFileSync(envPath, "utf8");
      const line = contents.split(/\r?\n/).find((row) => row.startsWith(`${key}=`));
      if (!line) continue;
      const value = line.slice(key.length + 1).trim().replace(/^["']|["']$/g, "");
      if (value) return value;
    } catch {
      // ignore
    }
  }
  return undefined;
}

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

async function main() {
  const connectionString = loadEnvVar("DATABASE_URL");
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Add to web/.env or shell env.");
  }

  const outPath = arg("--out") ?? join(process.cwd(), "scripts", "users.csv");
  const verifiedOnly = hasFlag("--verified-only");
  const since = arg("--since");
  const printStdout = hasFlag("--print");
  const countOnly = hasFlag("--count");

  const conds: string[] = [`email IS NOT NULL`, `email <> ''`];
  const params: any[] = [];
  if (verifiedOnly) {
    conds.push(`"emailVerified" = true`);
  }
  if (since) {
    params.push(since);
    conds.push(`"createdAt" >= $${params.length}`);
  }

  const sql = `
    SELECT LOWER(email) AS email, name, "emailVerified" AS verified, "createdAt" AS created
    FROM "user"
    WHERE ${conds.join(" AND ")}
    ORDER BY "createdAt" ASC
  `;

  const pool = new Pool({ connectionString });

  try {
    const { rows } = await pool.query(sql, params);
    const seen = new Set<string>();
    const dedup: typeof rows = [];
    for (const r of rows) {
      const e = String(r.email ?? "").trim();
      if (!e || !e.includes("@") || !e.includes(".")) continue;
      if (seen.has(e)) continue;
      seen.add(e);
      dedup.push({ ...r, email: e });
    }

    console.log(`✅ ${dedup.length} unique emails`);

    if (countOnly) return;

    const header = "email,name,verified,created";
    const lines = [header];
    for (const r of dedup) {
      const name = String(r.name ?? "").replace(/"/g, '""');
      const created = r.created instanceof Date ? r.created.toISOString() : String(r.created ?? "");
      lines.push(`${r.email},"${name}",${r.verified ? "true" : "false"},${created}`);
    }
    writeFileSync(outPath, lines.join("\n") + "\n", "utf8");
    console.log(`📄 wrote ${outPath}`);

    if (printStdout) {
      for (const r of dedup) console.log(r.email);
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exitCode = 1;
});
