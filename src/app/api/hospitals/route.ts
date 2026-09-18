import { NextResponse } from 'next/server';
import { meilisearch, HOSPITALS_INDEX } from '@/lib/meilisearch';

export async function GET() {
  try {
    const result = await meilisearch.index(HOSPITALS_INDEX).search('', {
      limit: 50,
      filter: ['isActive = true'],
      attributesToRetrieve: ['id', 'name', 'description', 'address'],
    });

    return NextResponse.json({ hospitals: result.hits });
  } catch (error) {
    console.error('Hospitals fetch error:', error);
    return NextResponse.json(
      { error: 'Unable to load hospitals' },
      { status: 503 }
    );
  }
}