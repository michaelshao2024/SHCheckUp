/**
 * Hospital photos are stored in the existing `Hospital.imageUrl` String? column.
 * To support multiple photos without a schema migration, we store either:
 *   - a JSON array of image sources (data URLs or http URLs), e.g. ["data:...","data:..."], or
 *   - a single legacy string (one data URL / http URL), which we treat as a 1-item gallery.
 * The first item is the primary (cover) photo.
 */

/** Parse the stored `imageUrl` value into an array of image sources. */
export function parseHospitalImages(imageUrl: string | null | undefined): string[] {
  if (!imageUrl) return [];
  const raw = imageUrl.trim();
  if (!raw) return [];
  // Try JSON array first
  if (raw.startsWith('[')) {
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return arr
          .filter((s): s is string => typeof s === 'string')
          .map((s) => s.trim())
          .filter(Boolean);
      }
    } catch {
      // fall through to legacy single-string handling
    }
  }
  // Legacy single image string
  return [raw];
}

/**
 * Serialize an array of image sources back into the `imageUrl` column.
 * Returns '' for an empty gallery (stored as null-ish/empty), a plain string
 * for a single image (keeps legacy shape), or a JSON array for 2+ images.
 */
export function serializeHospitalImages(images: string[]): string {
  const cleaned = images.map((s) => (s || '').trim()).filter(Boolean);
  if (cleaned.length === 0) return '';
  if (cleaned.length === 1) return cleaned[0];
  return JSON.stringify(cleaned);
}
