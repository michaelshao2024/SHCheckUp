import { NextResponse } from 'next/server';
import { meilisearch, HOSPITALS_INDEX } from '@/lib/meilisearch';
import { prisma } from '@/lib/prisma';

// Cache responses for 1 hour to reduce Neon reads (data changes rarely)
export const revalidate = 3600;

export async function GET() {
  // Try Meilisearch first
  try {
    const result = await meilisearch.index(HOSPITALS_INDEX).search('', { limit: 50, filter: ['isActive = true'], attributesToRetrieve: ['id', 'name', 'description', 'address'] });
    return NextResponse.json(result.hits);
  } catch { /* fallback */ }

  // Prisma fallback
  try {
    if (!prisma) return NextResponse.json([]);
    const hospitals = await prisma.hospital.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
    return NextResponse.json(hospitals);
  } catch {
    return NextResponse.json([]);
  }
}