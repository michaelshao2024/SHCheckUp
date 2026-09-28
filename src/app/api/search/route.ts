import { NextRequest, NextResponse } from 'next/server';
import { meilisearch, PACKAGES_INDEX, HOSPITALS_INDEX } from '@/lib/meilisearch';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const fReport = searchParams.get('englishReport') === 'true';
  const fService = searchParams.get('englishService') === 'true';

  // Try Meilisearch first, fallback to Prisma
  if (q.trim()) {
    try {
      const hospitalsResult = await meilisearch.index(HOSPITALS_INDEX).search(q, { limit: 5, filter: ['isActive = true'], attributesToRetrieve: ['id', 'name', 'description', 'address'] });
      const pkgFilter = ['isActive = true', ...(fReport ? ['englishReport = true'] : []), ...(fService ? ['englishService = true'] : [])];
      const packagesResult = await meilisearch.index(PACKAGES_INDEX).search(q, { limit: 10, filter: pkgFilter, attributesToRetrieve: ['id', 'name', 'price', 'currency', 'duration', 'hospitalName', 'avgRating', 'tags', 'hospitalId', 'englishReport', 'englishService'] });
      return NextResponse.json({ hospitals: hospitalsResult.hits, packages: packagesResult.hits, source: 'meilisearch' });
    } catch { /* fallback to Prisma below */ }
  }

  // Prisma fallback
  try {
    if (!prisma) {
      return NextResponse.json({ hospitals: [], packages: [] });
    }
    const hospitals = await prisma.hospital.findMany({
      where: { isActive: true, name: q ? { contains: q, mode: 'insensitive' } : undefined },
      take: 10,
    });
    const hospitalIds = hospitals.map(h => h.id);
    // Packages match by their own name/description/tags, or by belonging to a matched hospital
    const packages = await prisma.checkupPackage.findMany({
      where: {
        isActive: true,
        hospital: { isActive: true },
        ...(fReport && { englishReport: true }),
        ...(fService && { englishService: true }),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
                { tags: { has: q.toLowerCase() } },
                ...(hospitalIds.length ? [{ hospitalId: { in: hospitalIds } }] : []),
              ],
            }
          : {}),
      },
      include: { hospital: true },
      take: 10,
    });

    return NextResponse.json({
      hospitals: hospitals.map(h => ({ id: h.id, name: h.name, description: h.description, address: h.address })),
      packages: packages.map(p => ({ id: p.id, hospitalId: p.hospitalId, hospitalName: p.hospital.name, name: p.name, price: Number(p.price), currency: p.currency, duration: p.duration, avgRating: Number(p.avgRating), tags: p.tags, englishReport: p.englishReport, englishService: p.englishService })),
      source: 'prisma',
    });
  } catch {
    return NextResponse.json({ hospitals: [], packages: [] });
  }
}