import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }
    const packages = await prisma.checkupPackage.findMany({
      include: { hospital: { select: { id: true, name: true, nameCn: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(packages);
  } catch (error) {
    console.error('Admin packages GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch packages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }
    const body = await request.json();
    const { hospitalId, name, price, currency, duration, items, description, tags, includesTranslator } = body;

    if (!hospitalId || !name || price === undefined) {
      return NextResponse.json(
        { error: 'Hospital ID, name, and price are required' },
        { status: 400 }
      );
    }

    const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId } });
    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
    }

    const pkg = await prisma.checkupPackage.create({
      data: {
        hospitalId,
        name,
        price,
        currency: currency || 'USD',
        duration: duration || null,
        items: items || [],
        description: description || null,
        tags: tags || [],
        includesTranslator: includesTranslator || false,
      },
    });
    return NextResponse.json(pkg, { status: 201 });
  } catch (error) {
    console.error('Admin packages POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create package' },
      { status: 500 }
    );
  }
}