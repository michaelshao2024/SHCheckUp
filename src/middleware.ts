import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Geo policy: mainland China (CN) visitors can only reach the admin portal
 * and its auth APIs. Public pages/APIs return 451.
 * Country comes from Vercel's x-vercel-ip-country header (HK/MO/TW have
 * their own codes and are NOT blocked).
 */
const CN_ALLOWED_PREFIXES = [
  '/admin',
  '/login',
  '/api/admin',
  '/api/auth',
];

export function middleware(request: NextRequest) {
  const country = request.headers.get('x-vercel-ip-country');
  const { pathname } = request.nextUrl;

  if (country === 'CN' && !CN_ALLOWED_PREFIXES.some((p) => pathname.startsWith(p))) {
    return new NextResponse(
      '<!doctype html><html><head><meta charset="utf-8"><title>Not available</title></head>' +
        '<body style="font-family:sans-serif;max-width:32rem;margin:4rem auto;text-align:center">' +
        '<h1>Service not available in your region</h1>' +
        '<p>This website serves overseas users only.</p></body></html>',
      { status: 451, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  }

  // S1: Basic security headers only
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};