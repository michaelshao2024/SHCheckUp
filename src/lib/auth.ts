import { cookies } from 'next/headers';
import crypto from 'crypto';
import { prisma } from './prisma';

export const SESSION_COOKIE = 'shf_session';
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

function getSecret(): string {
  return process.env.AUTH_SECRET || 'dev-only-secret-change-me';
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string | null | undefined): boolean {
  if (!stored) return false;
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}

interface SessionPayload {
  uid: string;
  role: string;
  exp: number; // unix ms
}

function signPayload(payloadB64: string): string {
  return crypto.createHmac('sha256', getSecret()).update(payloadB64).digest('base64url');
}

export function createSessionToken(uid: string, role: string): string {
  const payload: SessionPayload = { uid, role, exp: Date.now() + SESSION_TTL_SECONDS * 1000 };
  const b64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${b64}.${signPayload(b64)}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  const dotIndex = token.lastIndexOf('.');
  if (dotIndex <= 0) return null;
  const b64 = token.slice(0, dotIndex);
  const sig = token.slice(dotIndex + 1);
  const expected = signPayload(b64);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(b64, 'base64url').toString()) as SessionPayload;
    if (!payload.uid || typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  };
}

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const token = cookies().get(SESSION_COOKIE)?.value;
    if (!token || !prisma) return null;
    const payload = verifySessionToken(token);
    if (!payload) return null;
    const user = await prisma.user.findUnique({
      where: { id: payload.uid },
      select: { id: true, email: true, name: true, role: true },
    });
    return user;
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<SessionUser | null> {
  const user = await getSessionUser();
  if (!user || user.role !== 'admin') return null;
  return user;
}
