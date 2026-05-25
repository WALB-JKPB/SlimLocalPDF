import type { MetadataRoute } from 'next';
import { getLocalePath, supportedLocales } from '@/lib/i18n';
import { siteMetadata } from '@/lib/siteMetadata';

export default function sitemap(): MetadataRoute.Sitemap {
  return supportedLocales.map((locale) => ({
    url: `${siteMetadata.url}${getLocalePath(locale)}`,
    lastModified: new Date('2026-05-22'),
    changeFrequency: 'weekly' as const,
    priority: locale === 'en' || locale === 'ko' ? 1 : 0.8,
  }));
}
