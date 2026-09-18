import { NextRequest, NextResponse } from 'next/server';
import { meilisearch, PACKAGES_INDEX, HOSPITALS_INDEX } from '@/lib/meilisearch';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';

  if (!q.trim()) {
    return NextResponse.json({ hospitals: [], packages: [] });
  }

  try {
    // Search hospitals
    const hospitalsResult = await meilisearch.index(HOSPITALS_INDEX).search(q, {
      limit: 5,
      filter: ['isActive = true'],
      attributesToRetrieve: ['id', 'name', 'description', 'address'],
    });

    // Search packages (anonymous = limited fields)
    const packagesResult = await meilisearch.index(PACKAGES_INDEX).search(q, {
      limit: 10,
      filter: ['isActive = true'],
      // Anonymous users see limited fields
      attributesToRetrieve: ['id', 'name', 'price', 'currency', 'duration', 'hospitalName', 'avgRating', 'tags', 'hospitalId'],
    });

    return NextResponse.json({
      hospitals: hospitalsResult.hits,
      packages: packagesResult.hits,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search temporarily unavailable' },
      { status: 503 }
    );
  }
}