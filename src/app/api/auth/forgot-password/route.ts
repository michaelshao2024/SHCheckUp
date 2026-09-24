import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendMail } from '@/lib/agentmail';
import { SITE_NAME, SITE_URL } from '@/lib/constants';

export const dynamic = 'force-dynamic';

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function POST(request: NextRequest) {
  // Always respond the same way so attackers cannot probe which emails exist
  const OK = { ok: true, message: 'If an account exists for this email, a reset link has been sent.' };

  if (!prisma) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  try {
    const { email } = (await request.json()) as { email?: string };
    const normalized = (email || '').trim().toLowerCase();
    if (!normalized || !normalized.includes('@')) {
      return NextResponse.json({ error: 'Please provide a valid email address' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: normalized } });
    // Only email/password accounts can reset a password (Google-only accounts have none)
    if (!user || !user.passwordHash) {
      return NextResponse.json(OK);
    }

    // Invalidate any previous reset tokens for this email
    await prisma.verificationToken.deleteMany({ where: { identifier: `pwdreset:${normalized}` } });

    const token = crypto.randomBytes(32).toString('hex');
    await prisma.verificationToken.create({
      data: {
        identifier: `pwdreset:${normalized}`,
        token,
        expires: new Date(Date.now() + TOKEN_TTL_MS),
      },
    });

    const resetUrl = `${SITE_URL}/reset-password?token=${token}`;
    const result = await sendMail(
      normalized,
      `${SITE_NAME} — Reset your password`,
      [
        'Hi,',
        '',
        'We received a request to reset your password. Click the link below to choose a new one:',
        '',
        resetUrl,
        '',
        'This link expires in 1 hour. If you did not request a password reset, you can ignore this email — your password will stay unchanged.',
        '',
        `— ${SITE_NAME}`,
      ].join('\n'),
    );
    if (!result.ok) {
      console.error('Password reset email failed:', result.error);
    }

    return NextResponse.json(OK);
  } catch (error) {
    console.error('forgot-password error:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
