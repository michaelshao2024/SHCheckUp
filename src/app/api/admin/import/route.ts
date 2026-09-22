import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function POST(request: NextRequest) {
  if (!prisma) {
    return NextResponse.json({ success: 0, failed: 0, errors: ['Database not available'] }, { status: 503 });
  }
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ success: 0, failed: 0, errors: ['Unauthorized: admin access required'] }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { rows } = body as { rows: Array<{
      hospitalName: string;
      name: string;
      price: string;
      currency: string;
      duration: string;
      items: string;
      description: string;
      tags: string;
      includesTranslator: string;
    }> };

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: 0, failed: 0, errors: ['No data rows provided'] });
    }

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;

      try {
        if (!row.hospitalName?.trim() || !row.name?.trim()) {
          failed++;
          errors.push(`Row ${rowNum}: Missing hospital name or package name`);
          continue;
        }

        const price = parseFloat(row.price);
        if (isNaN(price) || price <= 0) {
          failed++;
          errors.push(`Row ${rowNum} ("${row.name}"): Invalid price "${row.price}"`);
          continue;
        }

        // Find or create hospital
        let hospital = await prisma.hospital.findFirst({
          where: { name: { contains: row.hospitalName.trim(), mode: 'insensitive' } },
        });

        if (!hospital) {
          hospital = await prisma.hospital.create({
            data: {
              name: row.hospitalName.trim(),
              address: '',
              description: `Auto-imported hospital`,
              isActive: true,
            },
          });
        }

        // Items: comma or newline separated
        const itemsList = row.items
          ? row.items.split(/[,\n]/).map(s => s.trim()).filter(Boolean)
          : [];

        // Tags: comma separated
        const tagsList = row.tags
          ? row.tags.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
          : ['general'];

        const includesTranslator = row.includesTranslator?.toLowerCase() === 'true' || row.includesTranslator === '1';

        // Create package
        await prisma.checkupPackage.create({
          data: {
            hospitalId: hospital.id,
            name: row.name.trim(),
            price: price,
            currency: row.currency?.trim() || 'USD',
            duration: row.duration?.trim() || null,
            items: itemsList,
            description: row.description?.trim() || null,
            tags: tagsList,
            includesTranslator,
            isActive: true,
          },
        });

        success++;
      } catch (err) {
        failed++;
        errors.push(`Row ${rowNum} ("${row.name || 'unknown'}"): ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success,
      failed,
      errors: errors.slice(0, 100), // Limit error messages
      total: rows.length,
    });
  } catch (err) {
    return NextResponse.json({
      success: 0,
      failed: 0,
      errors: [err instanceof Error ? err.message : 'Failed to process import'],
    }, { status: 400 });
  }
}