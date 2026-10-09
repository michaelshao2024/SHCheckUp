import { NextRequest, NextResponse } from 'next/server';
import { meilisearch, PACKAGES_INDEX, HOSPITALS_INDEX } from '@/lib/meilisearch';
import { prisma } from '@/lib/prisma';
import { publicHospital, publicPackage, sortHospitals } from '@/lib/access';
import { getSessionUser } from '@/lib/auth';
import { rateLimit, clientKey } from '@/lib/rate-limit';

// Responses depend on the caller's session (anonymous vs registered), so this
// endpoint must never be cached.
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const fReport = searchParams.get('englishReport') === 'true';
  const fService = searchParams.get('englishService') === 'true';
  const user = await getSessionUser();
  const authed = user !== null;

  // Anti-scraping rate limits: anonymous by IP (strict), logged-in by user id
  // (generous for real use, but caps scripted bulk extraction).
  const rl = authed
    ? await rateLimit(clientKey(user!.id, request), 60, 60_000)
    : await rateLimit(clientKey(null, request), 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down and try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    );
  }

  // Shape the final payload according to the access policy. Anonymous users
  // get hospital name + simple address, and package name only. Hospitals are
  // always ordered: JCI-accredited first, then Shanghai General IMCC.
  const shape = (hospitals: any[], packages: any[], source: string) =>
    authed
      ? { hospitals: sortHospitals(hospitals), packages, source }
      : {
          hospitals: sortHospitals(hospitals.map(publicHospital)),
          packages: packages.map(publicPackage),
          source,
          authRequired: true,
        };

  // Try Meilisearch first, fallback to Prisma
  if (q.trim()) {
    try {
      const pkgFilter = ['isActive = true', ...(fReport ? ['englishReport = true'] : []), ...(fService ? ['englishService = true'] : [])];
      const hospitalsResult = await meilisearch.index(HOSPITALS_INDEX).search(q, { limit: 5, filter: ['isActive = true'], attributesToRetrieve: ['id', 'name', 'description', 'address', 'jciAccredited'] });
      const packagesResult = await meilisearch.index(PACKAGES_INDEX).search(q, { limit: 10, filter: pkgFilter, attributesToRetrieve: ['id', 'name', 'price', 'currency', 'duration', 'hospitalName', 'avgRating', 'tags', 'hospitalId', 'englishReport', 'englishService'] });
      return NextResponse.json(shape(hospitalsResult.hits as any[], packagesResult.hits as any[], 'meilisearch'));
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

    // items is a JSON array of strings; Prisma's string_contains on JSON is
    // case-sensitive, so find case-insensitive item matches via raw SQL first.
    let itemMatchedIds: string[] = [];
    if (q) {
      const rows = await prisma.$queryRaw<{ id: string }[]>`
        SELECT p.id FROM checkup_packages p
        JOIN hospitals h ON h.id = p.hospital_id
        WHERE p.is_active = true AND h."isActive" = true
          AND p.items IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(p.items) AS elem
            WHERE elem ILIKE ${'%' + q + '%'}
          )
        LIMIT 50`;
      itemMatchedIds = rows.map(r => r.id);
    }

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
                ...(itemMatchedIds.length ? [{ id: { in: itemMatchedIds } }] : []),
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

    return NextResponse.json(shape(
      [...hospitalMap.values()],
      packages.map(p => ({ id: p.id, hospitalId: p.hospitalId, hospitalName: p.hospital.name, name: p.name, price: Number(p.price), currency: p.currency, duration: p.duration, avgRating: Number(p.avgRating), tags: p.tags, englishReport: p.englishReport, englishService: p.englishService })),
      'prisma',
    ));
  } catch {
    return NextResponse.json({ hospitals: [], packages: [] });
  }
}
