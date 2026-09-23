import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: admin access required' }, { status: 401 });
    }
    const inquiries = await prisma.inquiry.findMany({
      include: {
        hospital: { select: { name: true } },
        package: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(inquiries);
  } catch (error) {
    console.error('Admin inquiries GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch inquiries' }, { status: 500 });
  }
}

const ALLOWED_STATUS = ['pending', 'processing', 'done'];

export async function PATCH(request: NextRequest) {
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: admin access required' }, { status: 401 });
    }
    const body = await request.json();
    const { id, status } = body;
    if (!id || !ALLOWED_STATUS.includes(status)) {
      return NextResponse.json({ error: 'Valid id and status (pending/processing/done) are required' }, { status: 400 });
    }
    const inquiry = await prisma.inquiry.update({ where: { id }, data: { status } });
    return NextResponse.json(inquiry);
  } catch (error) {
    console.error('Admin inquiries PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update inquiry' }, { status: 500 });
  }
}
