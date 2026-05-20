import { promptCategories } from "@/lib/pseo/prompts";
import { platformPages } from "@/lib/pseo/platforms";

export const dynamic = "force-static";
export const revalidate = 3600;

const BASE_URL = "https://skillset.so";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const lastmod = new Date().toISOString().split("T")[0];

  const urls: { loc: string; priority: string; changefreq: string; lastmod: string }[] = [
    {
      loc: `${BASE_URL}/prompts`,
      priority: "0.9",
      changefreq: "weekly",
      lastmod,
    },
    ...promptCategories.map((c) => ({
      loc: `${BASE_URL}/prompts/${c.slug}`,
      priority: "0.7",
      changefreq: "weekly",
      lastmod,
    })),
    ...promptCategories.flatMap((c) =>
      c.templates.map((t) => ({
        loc: `${BASE_URL}/prompts/${c.slug}/${t.slug}`,
        priority: "0.6",
        changefreq: "monthly",
        lastmod,
      })),
    ),
    ...platformPages.map((p) => ({
      loc: `${BASE_URL}/prompts/for/${p.slug}`,
      priority: "0.8",
      changefreq: "weekly",
      lastmod,
    })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
