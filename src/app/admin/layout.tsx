import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login?next=/admin');
  }
  if (user.role !== 'admin') {
    redirect('/');
  }
  return <>{children}</>;
}
