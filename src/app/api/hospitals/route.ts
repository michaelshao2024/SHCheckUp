import { NextRequest, NextResponse } from 'next/server';
import { meilisearch, HOSPITALS_INDEX } from '@/lib/meilisearch';
import { prisma } from '@/lib/prisma';
import { publicHospital } from '@/lib/access';
import { getSessionUser } from '@/lib/auth';
import { rateLimit, clientKey } from '@/lib/rate-limit';

// Responses depend on the caller's session (anonymous vs registered), so this
// endpoint is dynamic and never cached.
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  const authed = user !== null;
  const rl = authed
    ? await rateLimit(clientKey(user!.id, request), 60, 60_000)
    : await rateLimit(clientKey(null, request), 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down and try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    );
  }
  const shape = (hospitals: any[]) => (authed ? hospitals : hospitals.map(publicHospital));

  // Try Meilisearch first
  try {
    const result = await meilisearch.index(HOSPITALS_INDEX).search('', { limit: 50, filter: ['isActive = true'], attributesToRetrieve: ['id', 'name', 'description', 'address', 'jciAccredited'] });
    return NextResponse.json(shape(result.hits as any[]));
  } catch { /* fallback */ }

  // Prisma fallback
  try {
    if (!prisma) return NextResponse.json([]);
    const hospitals = await prisma.hospital.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
    return NextResponse.json(shape(hospitals as any[]));
  } catch {
    return NextResponse.json([]);
  }
}