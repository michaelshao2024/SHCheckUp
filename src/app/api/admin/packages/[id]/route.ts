import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { revalidatePublicContent } from '@/lib/revalidate';

interface Props { params: { id: string } }

export async function PUT(request: NextRequest, { params }: Props) {
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: admin access required' }, { status: 401 });
    }
    const body = await request.json();
    const { hospitalId, name, price, currency, duration, items, description, tags, includesTranslator, isActive } = body;

    const existing = await prisma.checkupPackage.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    if (hospitalId) {
      const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId } });
      if (!hospital) {
        return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
      }
    }

    const pkg = await prisma.checkupPackage.update({
      where: { id: params.id },
      data: {
        ...(hospitalId !== undefined && { hospitalId }),
        ...(name !== undefined && { name }),
        ...(price !== undefined && { price }),
        ...(currency !== undefined && { currency }),
        ...(duration !== undefined && { duration }),
        ...(items !== undefined && { items }),
        ...(description !== undefined && { description }),
        ...(tags !== undefined && { tags }),
        ...(includesTranslator !== undefined && { includesTranslator }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    revalidatePublicContent();
    return NextResponse.json(pkg);
  } catch (error) {
    console.error('Admin packages PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update package' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: Props) {
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: admin access required' }, { status: 401 });
    }
    const existing = await prisma.checkupPackage.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }
    await prisma.checkupPackage.delete({ where: { id: params.id } });
    revalidatePublicContent();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin packages DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete package' },
      { status: 500 }
    );
  }
}