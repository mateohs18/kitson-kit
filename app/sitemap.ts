import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://kitson-kit.store';

  return [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/tienda-diaria`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/terminos`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ];
}
