import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE } from '@/lib/auth';
import { SITE_URL } from '@/lib/constants';

export const dynamic = 'force-dynamic';

const STATE_COOKIE = 'shf_google_oauth_state';

function verifyState(signed: string | undefined, raw: string): boolean {
  if (!signed) return false;
  const idx = signed.lastIndexOf('.');
  if (idx <= 0) return false;
  const value = signed.slice(0, idx);
  const sig = signed.slice(idx + 1);
  const secret = process.env.AUTH_SECRET || 'dev-only-secret-change-me';
  const expected = crypto.createHmac('sha256', secret).update(value).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  return value === raw;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

// GET /api/auth/google/callback — complete the OAuth flow, create/link the
// user, and start a session.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state') || '';
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  const fail = (err: string) => NextResponse.redirect(new URL(`/login?error=${err}`, SITE_URL));

  if (!clientId || !clientSecret) return fail('google_not_configured');
  if (!code) return fail('google_denied');

  const signedState = request.cookies.get(STATE_COOKIE)?.value;
  if (!verifyState(signedState, state)) return fail('google_state');

  const [stateToken, nextPath] = state.split('|');
  const safeNext = nextPath && nextPath.startsWith('/') && !nextPath.startsWith('//') ? nextPath : '';
  void stateToken;

  try {
    // Exchange the authorization code for tokens.
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${SITE_URL}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenRes.ok) return fail('google_token');
    const tokens = await tokenRes.json();

    // Fetch the user's Google profile.
    const infoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!infoRes.ok) return fail('google_profile');
    const info = (await infoRes.json()) as GoogleUserInfo;
    if (!info.sub || !info.email) return fail('google_profile');

    if (!prisma) return fail('db_unavailable');

    const email = info.email.trim().toLowerCase();
    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId: info.sub }, { email }] },
    });
    if (user) {
      // Link the Google account / refresh profile fields.
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: user.googleId ?? info.sub,
          emailVerified: user.emailVerified ?? new Date(),
          name: user.name ?? info.name ?? null,
          image: user.image ?? info.picture ?? null,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          email,
          googleId: info.sub,
          name: info.name ?? null,
          image: info.picture ?? null,
          emailVerified: new Date(),
          role: 'user',
        },
      });
    }

    const dest = user.role === 'admin' ? (safeNext.startsWith('/admin') ? safeNext : '/admin') : safeNext || '/';
    const res = NextResponse.redirect(new URL(dest, SITE_URL));
    res.cookies.set(SESSION_COOKIE, createSessionToken(user.id, user.role), sessionCookieOptions());
    res.cookies.set(STATE_COOKIE, '', { path: '/', maxAge: 0 });
    return res;
  } catch (e) {
    console.error('Google OAuth callback error:', e);
    return fail('google_failed');
  }
}
