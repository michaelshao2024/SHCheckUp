import { getSessionUser } from './auth';

/**
 * Access policy for anti-scraping + registration incentive.
 *
 * Registered (logged-in) users see full information.
 * Anonymous (not logged-in) users get a deliberately reduced payload:
 *   - Hospitals: name + simple address only.
 *   - Checkup packages: name only (search still works, but no price,
 *     hospital, rating, duration, tags, items, description, etc.).
 *
 * Gating happens on the server (API routes + server-rendered detail pages)
 * so the reduced data is never sent to anonymous clients — a scraper reading
 * the raw JSON/HTML cannot recover the hidden fields.
 */

export async function isAuthed(): Promise<boolean> {
  return (await getSessionUser()) !== null;
}

/** Trim an address to a coarse, non-identifying location for anonymous users. */
export function simpleAddress(address: string | null | undefined): string {
  if (!address) return '';
  const raw = address.trim();
  if (!raw) return '';
  // Prefer the segment before the first comma (usually the district / area).
  const firstComma = raw.split(',')[0].trim();
  let base = firstComma || raw;
  // Chinese addresses often have no commas; cut at district/area markers so we
  // expose the general area (e.g. "上海市黄浦区") but not the exact street/number.
  const m = base.match(/^(.*?(?:区|County|District|区县|新区|市辖区))/);
  if (m && m[1]) base = m[1];
  // Hard cap so a full street address can never leak via a long single token.
  if (base.length > 24) base = base.slice(0, 24) + '…';
  return base;
}

export interface FullHospital {
  id: string;
  name: string;
  nameCn?: string | null;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  imageUrl?: string | null;
  isActive?: boolean;
  [k: string]: unknown;
}

/** Public (anonymous) hospital shape: name + simple address only. */
export function publicHospital(h: FullHospital) {
  return {
    id: h.id,
    name: h.name,
    address: simpleAddress(h.address),
  };
}

export interface FullPackage {
  id: string;
  name: string;
  [k: string]: unknown;
}

/** Public (anonymous) package shape: name only. */
export function publicPackage(p: FullPackage) {
  return { id: p.id, name: p.name };
}
