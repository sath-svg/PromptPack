import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/subscribe',
        '/sign-in',
        '/sign-up',
        '/api/',
        '/_next/',
      ],
    },
    sitemap: 'https://skillset.so/sitemap.xml',
  }
}
