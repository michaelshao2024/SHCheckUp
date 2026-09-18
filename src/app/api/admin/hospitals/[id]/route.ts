import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Props { params: { id: string } }

export async function PUT(request: NextRequest, { params }: Props) {
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }
    const body = await request.json();
    const { name, nameCn, address, phone, email, website, description, isActive } = body;

    const existing = await prisma.hospital.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
    }

    const hospital = await prisma.hospital.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(nameCn !== undefined && { nameCn }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(website !== undefined && { website }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    return NextResponse.json(hospital);
  } catch (error: any) {
    console.error('Admin hospitals PUT error:', error);
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'A hospital with this name already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update hospital' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: Props) {
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }
    const existing = await prisma.hospital.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
    }
    await prisma.hospital.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin hospitals DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete hospital' },
      { status: 500 }
    );
  }
}