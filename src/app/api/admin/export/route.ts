import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const PACKAGE_HEADERS = [
  'hospitalName', 'name', 'price', 'currency', 'duration',
  'items', 'description', 'source', 'tags', 'includesTranslator',
] as const;

const HOSPITAL_HEADERS = [
  'name', 'nameCn', 'address', 'phone', 'email', 'website', 'description', 'isActive',
] as const;

export async function GET(request: NextRequest) {
  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized: admin access required' }, { status: 401 });
  }

  const type = request.nextUrl.searchParams.get('type') || 'packages';

  try {
    let rows: Record<string, unknown>[];
    let sheetName: string;
    let fileName: string;

    if (type === 'hospitals') {
      const hospitals = await prisma.hospital.findMany({ orderBy: { createdAt: 'asc' } });
      rows = hospitals.map(h => ({
        name: h.name,
        nameCn: h.nameCn ?? '',
        address: h.address,
        phone: h.phone ?? '',
        email: h.email ?? '',
        website: h.website ?? '',
        description: h.description,
        isActive: h.isActive ? 'true' : 'false',
      }));
      sheetName = 'Hospitals';
      fileName = 'hospitals.xlsx';
    } else if (type === 'packages') {
      const packages = await prisma.checkupPackage.findMany({
        include: { hospital: true },
        orderBy: [{ hospital: { name: 'asc' } }, { price: 'asc' }],
      });
      rows = packages.map(p => ({
        hospitalName: p.hospital.name,
        name: p.name,
        price: Number(p.price),
        currency: p.currency,
        duration: p.duration ?? '',
        items: Array.isArray(p.items) ? (p.items as unknown[]).join('; ') : '',
        description: p.description ?? '',
        source: p.source ?? '',
        tags: p.tags.join(', '),
        includesTranslator: p.includesTranslator ? 'true' : 'false',
      }));
      sheetName = 'Packages';
      fileName = 'packages.xlsx';
    } else {
      return NextResponse.json({ error: 'Invalid type. Use ?type=packages or ?type=hospitals' }, { status: 400 });
    }

    const worksheet = XLSX.utils.json_to_sheet(rows, {
      header: [...(type === 'hospitals' ? HOSPITAL_HEADERS : PACKAGE_HEADERS)],
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Export failed' }, { status: 500 });
  }
}
