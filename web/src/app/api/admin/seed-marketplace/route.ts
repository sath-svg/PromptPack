/**
 * Seed the marketplace with official Skillset Team listings. One row per
 * file in `web/public/skillsets/*.skill`. Idempotent — re-running upserts.
 *
 * Auth: requires `Authorization: Bearer <ADMIN_SEED_TOKEN>` header
 *       (env var `ADMIN_SEED_TOKEN`). Returns 401 otherwise.
 *
 * Usage:
 *   curl -X POST http://localhost:3000/api/admin/seed-marketplace \
 *     -H "Authorization: Bearer $ADMIN_SEED_TOKEN"
 */

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { skillsetPacks } from "@/lib/pseo/skillset-packs";

export const runtime = "nodejs";
export const maxDuration = 300;

const ADMIN_EMAIL = process.env.MARKETPLACE_ADMIN_EMAIL ?? "dksathvik@gmail.com";

function fileToBase64(buf: Buffer): string {
  return buf.toString("base64");
}

function inferKind(packType: "workflow" | "folder"): "flow" | "folder" {
  return packType === "workflow" ? "flow" : "folder";
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const expected = process.env.ADMIN_SEED_TOKEN;
  if (!expected || !token || token !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_CONVEX_URL not set" },
      { status: 500 },
    );
  }
  // Convex actions expect the .cloud URL (not .site). Normalize either form.
  const apiBase = convexUrl.replace(/\.site$/, ".cloud").replace(/\/+$/, "");
  const client = new ConvexHttpClient(apiBase);

  const sellerId = (await client.query(api.marketplace.getAdminSellerId, {
    email: ADMIN_EMAIL,
  })) as Id<"users"> | null;
  if (!sellerId) {
    return NextResponse.json(
      { error: `Admin seller not found (email=${ADMIN_EMAIL})` },
      { status: 500 },
    );
  }

  const skillsDir = path.join(process.cwd(), "public", "skillsets");
  const results: Array<{ slug: string; status: string; error?: string }> = [];

  for (const pack of skillsetPacks) {
    const slug = pack.id;
    const filePath = path.join(skillsDir, `${slug}.skill`);
    try {
      const buf = await fs.readFile(filePath);
      const fileData = fileToBase64(buf);
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
      results.push({
        slug,
        status: result.created ? "created" : "updated",
      });
    } catch (e) {
      results.push({
        slug,
        status: "error",
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return NextResponse.json({
    success: true,
    sellerId,
    counts: {
      created: results.filter((r) => r.status === "created").length,
      updated: results.filter((r) => r.status === "updated").length,
      error: results.filter((r) => r.status === "error").length,
    },
    results,
  });
}
