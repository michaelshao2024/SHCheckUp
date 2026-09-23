import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { sendInquiryEmail } from '@/lib/mail';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }
    const body = await request.json();
    const packageId = typeof body.packageId === 'string' ? body.packageId : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const preferredDate = typeof body.preferredDate === 'string' && body.preferredDate ? body.preferredDate : null;
    const message = typeof body.message === 'string' ? body.message.trim() : '';

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const pkg = await prisma.checkupPackage.findUnique({
      where: { id: packageId },
      include: { hospital: true },
    });
    if (!pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    const user = await getSessionUser();
    const fullMessage = [
      `Service: Medical escort (陪诊服务)`,
      phone ? `Phone/WhatsApp: ${phone}` : null,
      message ? `Message: ${message}` : null,
    ].filter(Boolean).join('\n');

    await prisma.inquiry.create({
      data: {
        userId: user?.id ?? null,
        hospitalId: pkg.hospitalId,
        packageId: pkg.id,
        name,
        email,
        preferredDate: preferredDate ? new Date(preferredDate) : null,
        message: fullMessage || 'Service: Medical escort (陪诊服务)',
      },
    });

    const mailResult = await sendInquiryEmail({
      packageName: pkg.name,
      hospitalName: pkg.hospital.name,
      name,
      email,
      phone: phone || null,
      preferredDate,
      message,
    });

    return NextResponse.json({ success: true, emailSent: mailResult.ok });
  } catch (error) {
    console.error('Inquiry POST error:', error);
    return NextResponse.json({ error: 'Failed to submit inquiry' }, { status: 500 });
  }
}
