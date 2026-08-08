import type { MetadataRoute } from 'next';

import { siteConfig } from '@/config/site';

/**
 * BUILD-SPEC §12 (SEO): allow public marketing pages, block authenticated and
 * admin surfaces from indexing.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/dashboard', '/settings', '/api', '/monitoring'],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
