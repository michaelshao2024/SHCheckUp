import { NextResponse } from 'next/server';
import { meilisearch, HOSPITALS_INDEX } from '@/lib/meilisearch';
import { prisma } from '@/lib/prisma';
import { isAuthed, publicHospital } from '@/lib/access';

// Responses depend on the caller's session (anonymous vs registered), so this
// endpoint is dynamic and never cached.
export const dynamic = 'force-dynamic';

export async function GET() {
  const authed = await isAuthed();
  const shape = (hospitals: any[]) => (authed ? hospitals : hospitals.map(publicHospital));

  // Try Meilisearch first
  try {
    const result = await meilisearch.index(HOSPITALS_INDEX).search('', { limit: 50, filter: ['isActive = true'], attributesToRetrieve: ['id', 'name', 'description', 'address'] });
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