import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { rateLimit, clientKey } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

// Public package listing for the compare page. Only active packages
// of active (non-hidden) hospitals are exposed. Full package details
// (price, hospital, items, etc.) are for registered users only, so
// anonymous callers are rejected and prompted to sign up.
export async function GET(request: NextRequest) {
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Sign in to compare checkup packages', authRequired: true },
        { status: 401 }
      );
    }
    // Registered users are capped too — prevents bulk scripted extraction
    // of the full package catalogue via a single account.
    const rl = rateLimit(clientKey(user.id, request), 30, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down and try again shortly.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
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
