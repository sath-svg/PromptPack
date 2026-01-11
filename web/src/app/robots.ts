import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard',
        '/subscribe',
        '/sign-in',
        '/sign-up',
        '/auth',
        '/extension-auth',
      ],
    },
    sitemap: 'https://pmtpk.com/sitemap.xml',
  }
}
