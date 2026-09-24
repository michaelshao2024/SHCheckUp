import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { SITE_URL } from '@/lib/constants';

// Rebuild the sitemap at most once per hour
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/compare`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
  ];

  const dynamicRoutes: MetadataRoute.Sitemap = [];
  try {
    if (prisma) {
      const [hospitals, packages] = await Promise.all([
        prisma.hospital.findMany({ where: { isActive: true }, select: { id: true, updatedAt: true } }),
        prisma.checkupPackage.findMany({ where: { isActive: true }, select: { id: true, updatedAt: true } }),
      ]);
      for (const h of hospitals) {
        dynamicRoutes.push({ url: `${SITE_URL}/hospitals/${h.id}`, lastModified: h.updatedAt, changeFrequency: 'weekly', priority: 0.7 });
      }
      for (const p of packages) {
        dynamicRoutes.push({ url: `${SITE_URL}/packages/${p.id}`, lastModified: p.updatedAt, changeFrequency: 'weekly', priority: 0.6 });
      }
    }
  } catch {
    // DB unavailable — fall back to static routes only
  }

  return [...staticRoutes, ...dynamicRoutes];
}
