import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!prisma) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  try {
    const { token, password } = (await request.json()) as { token?: string; password?: string };
    if (!token) {
      return NextResponse.json({ error: 'Invalid or missing reset token' }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const record = await prisma.verificationToken.findUnique({ where: { token } });
    if (
      !record ||
      !record.identifier.startsWith('pwdreset:') ||
      record.expires.getTime() < Date.now()
    ) {
      return NextResponse.json({ error: 'Reset link is invalid or has expired. Please request a new one.' }, { status: 400 });
    }

    const email = record.identifier.slice('pwdreset:'.length);
    await prisma.user.update({
      where: { email },
      data: { passwordHash: hashPassword(password) },
    });
    // One-time use: remove all reset tokens for this email
    await prisma.verificationToken.deleteMany({ where: { identifier: `pwdreset:${email}` } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('reset-password error:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
