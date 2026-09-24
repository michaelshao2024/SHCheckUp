import { revalidatePath } from 'next/cache';

/**
 * Invalidate cached public pages/APIs after admin content changes
 * (hospital/package create, update, delete, batch import).
 * Call from admin mutation route handlers so changes take effect immediately
 * instead of waiting for the 1-hour ISR window.
 */
export function revalidatePublicContent(): void {
  try {
    // 'layout' type revalidates every page under the root layout,
    // including /packages/[id] and /hospitals/[id] ISR pages.
    revalidatePath('/', 'layout');
    revalidatePath('/api/hospitals');
    revalidatePath('/sitemap.xml');
  } catch (error) {
    // Never fail the mutation because of a revalidation issue
    console.error('revalidatePublicContent error:', error);
  }
}
