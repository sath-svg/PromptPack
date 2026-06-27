import { MetadataRoute } from 'next'

// Top-level sitemap = core static pages only.
//
// The prompts / skillsets / compare sections are each served by their own
// dedicated route-handler sitemap (sitemap-prompts.xml, sitemap-skillsets.xml,
// sitemap-compare.xml), all advertised in robots.ts. This file used to *also*
// list every one of those URLs, so each pSEO page appeared in two sitemaps with
// a conflicting lastmod (full timestamp here vs date-only there) — a muddy crawl
// signal. Keeping each URL in exactly one sitemap with a single stable lastmod
// is cleaner for crawlers.
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://skillset.so'
  // Date-only, matching the section sitemaps' format. Stable within a build.
  const lastModified = new Date().toISOString().split('T')[0]

  return [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/downloads`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/how-it-works`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/enterprise`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/skillset/brand`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]
}
