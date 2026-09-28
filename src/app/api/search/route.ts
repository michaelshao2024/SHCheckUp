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
      const pkgFilter = ['isActive = true', ...(fReport ? ['englishReport = true'] : []), ...(fService ? ['englishService = true'] : [])];
      const hospitalsResult = await meilisearch.index(HOSPITALS_INDEX).search(q, { limit: 5, filter: ['isActive = true'], attributesToRetrieve: ['id', 'name', 'description', 'address'] });
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
    // Packages match across all package fields (name, description, checkup
    // items, tags), via the hospital name, or by belonging to a matched hospital
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
                { items: { string_contains: q } },
                { tags: { has: q.toLowerCase() } },
                { hospital: { name: { contains: q, mode: 'insensitive' } } },
                ...(hospitalIds.length ? [{ hospitalId: { in: hospitalIds } }] : []),
              ],
            }
          : {}),
      },
      include: { hospital: true },
      take: 10,
    });

    // Hospitals in the response = name-matched hospitals ∪ hospitals of matched packages
    const hospitalMap = new Map<string, { id: string; name: string; description: string; address: string }>();
    for (const h of hospitals) {
      hospitalMap.set(h.id, { id: h.id, name: h.name, description: h.description, address: h.address });
    }
    for (const p of packages) {
      if (!hospitalMap.has(p.hospital.id)) {
        hospitalMap.set(p.hospital.id, { id: p.hospital.id, name: p.hospital.name, description: p.hospital.description, address: p.hospital.address });
      }
    }

    return NextResponse.json({
      hospitals: [...hospitalMap.values()],
      packages: packages.map(p => ({ id: p.id, hospitalId: p.hospitalId, hospitalName: p.hospital.name, name: p.name, price: Number(p.price), currency: p.currency, duration: p.duration, avgRating: Number(p.avgRating), tags: p.tags, englishReport: p.englishReport, englishService: p.englishService })),
      source: 'prisma',
    });
  } catch {
    return NextResponse.json({ hospitals: [], packages: [] });
  }
}
