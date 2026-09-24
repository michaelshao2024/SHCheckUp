import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { revalidatePublicContent } from '@/lib/revalidate';

export const dynamic = 'force-dynamic';

export async function POST() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized: admin access required' }, { status: 401 });
  }
  revalidatePublicContent();
  return NextResponse.json({ ok: true, revalidatedAt: new Date().toISOString() });
}
