import { MetadataRoute } from 'next'
import { promptCategories } from '@/lib/pseo/prompts'
import { comparisonPages } from '@/lib/pseo/comparisons'
import { platformPages } from '@/lib/pseo/platforms'
import { rolePages } from '@/lib/pseo/roles'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://skillset.so'

  const promptEntries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/prompts`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...promptCategories.map((category) => ({
      url: `${baseUrl}/prompts/${category.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...promptCategories.flatMap((category) =>
      category.templates.map((template) => ({
        url: `${baseUrl}/prompts/${category.slug}/${template.slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }))
    ),
  ]

  const platformEntries: MetadataRoute.Sitemap = platformPages.map((page) => ({
    url: `${baseUrl}/prompts/for/${page.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const skillsetRoleEntries: MetadataRoute.Sitemap = rolePages.map((page) => ({
    url: `${baseUrl}/skillsets/for/${page.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const skillsetsPillar: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/skillsets`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ]

  const compareEntries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/compare`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    ...comparisonPages.map((page) => ({
      url: `${baseUrl}/compare/${page.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ]

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/downloads`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...skillsetsPillar,
    ...skillsetRoleEntries,
    ...promptEntries,
    ...platformEntries,
    ...compareEntries,
    {
      url: `${baseUrl}/skillset/brand`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]
}
