import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthed } from '@/lib/access';

export const dynamic = 'force-dynamic';

// Public package listing for the compare page. Only active packages
// of active (non-hidden) hospitals are exposed. Full package details
// (price, hospital, items, etc.) are for registered users only, so
// anonymous callers are rejected and prompted to sign up.
export async function GET() {
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }
    if (!(await isAuthed())) {
      return NextResponse.json(
        { error: 'Sign in to compare checkup packages', authRequired: true },
        { status: 401 }
      );
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
