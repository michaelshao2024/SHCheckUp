import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { SITE_URL } from '@/lib/constants';

export const dynamic = 'force-dynamic';

const STATE_COOKIE = 'shf_google_oauth_state';

function signState(value: string): string {
  const secret = process.env.AUTH_SECRET || 'dev-only-secret-change-me';
  const sig = crypto.createHmac('sha256', secret).update(value).digest('base64url');
  return `${value}.${sig}`;
}

// GET /api/auth/google — start the Google OAuth flow.
export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect(new URL('/login?error=google_not_configured', SITE_URL));
  }

  const state = crypto.randomBytes(16).toString('hex');
  const next = request.nextUrl.searchParams.get('next') || '';
  const stateValue = next && next.startsWith('/') ? `${state}|${next}` : state;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${SITE_URL}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    state: stateValue,
    access_type: 'online',
    prompt: 'select_account',
  });

  const res = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  res.cookies.set(STATE_COOKIE, signState(stateValue), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 600, // 10 minutes
  });
  return res;
}
