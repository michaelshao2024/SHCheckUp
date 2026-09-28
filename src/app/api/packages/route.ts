import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Public package listing for the compare page. Only active packages
// of active (non-hidden) hospitals are exposed.
export async function GET() {
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }
    const packages = await prisma.checkupPackage.findMany({
      where: { isActive: true, hospital: { isActive: true } },
      include: { hospital: { select: { id: true, name: true, nameCn: true } } },
      orderBy: { price: 'asc' },
    });
    return NextResponse.json(packages.map(p => ({
      ...p,
      price: Number(p.price),
      avgRating: Number(p.avgRating),
      hospitalName: p.hospital.name,
    })));
  } catch (error) {
    console.error('Public packages GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 });
  }
}
