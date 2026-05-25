import type { MetadataRoute } from 'next';
import { siteMetadata } from '@/lib/siteMetadata';

export default function robots(): MetadataRoute.Robots {
  const siteHost = new URL(siteMetadata.url).host;

  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${siteMetadata.url}/sitemap.xml`,
    host: siteHost,
  };
}
