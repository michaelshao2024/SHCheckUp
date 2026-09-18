import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }
    const hospitals = await prisma.hospital.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(hospitals);
  } catch (error) {
    console.error('Admin hospitals GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hospitals' },
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
    const { name, nameCn, address, phone, email, website, description } = body;

    if (!name || !address || !description) {
      return NextResponse.json(
        { error: 'Name, address, and description are required' },
        { status: 400 }
      );
    }

    const hospital = await prisma.hospital.create({
      data: { name, nameCn, address, phone, email, website, description },
    });
    return NextResponse.json(hospital, { status: 201 });
  } catch (error: any) {
    console.error('Admin hospitals POST error:', error);
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'A hospital with this name already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create hospital' },
      { status: 500 }
    );
  }
}