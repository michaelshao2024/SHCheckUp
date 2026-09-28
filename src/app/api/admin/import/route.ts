import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { revalidatePublicContent } from '@/lib/revalidate';

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
    const { rows, mode } = body as { rows: Array<{
      hospitalName: string;
      hospitalNameCn: string;
      address: string;
      phone: string;
      email: string;
      website: string;
      name: string;
      price: string;
      currency: string;
      duration: string;
      items: string;
      description: string;
      source: string;
      tags: string;
      includesTranslator: string;
      englishReport: string;
      englishService: string;
    }>; mode?: 'append' | 'replace' };

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: 0, failed: 0, errors: ['No data rows provided'] });
    }

    // Replace mode: the uploaded file is authoritative — wipe all existing
    // packages AND hospitals before inserting the new rows. Hospitals are
    // recreated from the file's hospitalName column. (Reviews cascade-delete
    // with their package; inquiries keep their records but lose the links.)
    let replacedCount = 0;
    let replacedHospitals = 0;
    if (mode === 'replace') {
      const deletedPkgs = await prisma.checkupPackage.deleteMany({});
      replacedCount = deletedPkgs.count;
      const deletedHospitals = await prisma.hospital.deleteMany({});
      replacedHospitals = deletedHospitals.count;
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

        // Find or create hospital (exact match first, then fuzzy)
        const hospName = row.hospitalName.trim();
        let hospital = await prisma.hospital.findFirst({
          where: { name: { equals: hospName, mode: 'insensitive' } },
        });
        if (!hospital) {
          hospital = await prisma.hospital.findFirst({
            where: { name: { contains: hospName, mode: 'insensitive' } },
          });
        }

        // Optional hospital detail columns from the same row
        const hospDetails = {
          ...(row.hospitalNameCn?.trim() && { nameCn: row.hospitalNameCn.trim() }),
          ...(row.address?.trim() && { address: row.address.trim() }),
          ...(row.phone?.trim() && { phone: row.phone.trim() }),
          ...(row.email?.trim() && { email: row.email.trim() }),
          ...(row.website?.trim() && { website: row.website.trim() }),
        };

        if (!hospital) {
          hospital = await prisma.hospital.create({
            data: {
              name: hospName,
              address: row.address?.trim() || '',
              description: `Auto-imported hospital`,
              isActive: true,
              ...hospDetails,
            },
          });
        } else if (Object.keys(hospDetails).length > 0) {
          // Enrich the existing hospital with any detail columns provided
          hospital = await prisma.hospital.update({
            where: { id: hospital.id },
            data: hospDetails,
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
        const truthy = (v?: string) => v?.toLowerCase() === 'true' || v === '1' || v?.toLowerCase() === 'yes' || v === '是';
        const englishReport = truthy(row.englishReport);
        const englishService = truthy(row.englishService);

        // Create package
        await prisma.checkupPackage.create({
          data: {
            hospitalId: hospital.id,
            name: row.name.trim(),
            price: price,
            currency: row.currency?.trim() || 'CNY',
            duration: row.duration?.trim() || null,
            items: itemsList,
            description: row.description?.trim() || null,
            source: row.source?.trim() || null,
            tags: tagsList,
            includesTranslator,
            englishReport,
            englishService,
            isActive: true,
          },
        });

        success++;
      } catch (err) {
        failed++;
        errors.push(`Row ${rowNum} ("${row.name || 'unknown'}"): ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    if (success > 0) {
      revalidatePublicContent();
    }
    return NextResponse.json({
      success,
      failed,
      errors: errors.slice(0, 100), // Limit error messages
      total: rows.length,
      ...(mode === 'replace' && { replaced: replacedCount, replacedHospitals }),
    });
  } catch (err) {
    return NextResponse.json({
      success: 0,
      failed: 0,
      errors: [err instanceof Error ? err.message : 'Failed to process import'],
    }, { status: 400 });
  }
}