import type { MetadataRoute } from 'next';
import { getLabs } from '@/lib/data';

const BASE = 'https://allaimodels.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const fixed = ['', '/labs', '/timeline', '/compare', '/benchmarks', '/methodology'].map(
    (path) => ({
      url: `${BASE}${path}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: path === '' ? 1 : 0.8,
    }),
  );

  const labPages = getLabs().map((l) => ({
    url: `${BASE}/labs/${l.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...fixed, ...labPages];
}
