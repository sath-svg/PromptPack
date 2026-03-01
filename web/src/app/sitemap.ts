import { MetadataRoute } from 'next'
import { blogPosts } from '@/lib/blog-posts'
import { promptCategories } from '@/lib/pseo/prompts'
import { comparisonPages } from '@/lib/pseo/comparisons'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://pmtpk.com'

  const blogEntries: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  // Tool pages
  const toolEntries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/tools`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tools/prompt-enhancer`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/tools/prompt-evaluator`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ]

  // Prompt template pages
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

  // Comparison pages
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
      url: `${baseUrl}/marketplace`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...blogEntries,
    ...toolEntries,
    ...promptEntries,
    ...compareEntries,
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]
}
