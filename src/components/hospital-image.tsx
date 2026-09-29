'use client';

import { useState } from 'react';

/**
 * Hospital photo gallery.
 * Handles any number of photos of differing dimensions/aspect ratios:
 *  - the active photo is shown in a fixed 16:9 frame with object-cover, so
 *    portrait, landscape and square sources all render uniformly (no layout jump);
 *  - a thumbnail strip lets the visitor switch photos;
 *  - photos that fail to load are dropped individually.
 * Backward compatible: pass a single src via `src`, or many via `images`.
 */
export function HospitalImage({
  src,
  images,
  alt,
}: {
  src?: string;
  images?: string[];
  alt: string;
}) {
  const initial = (images && images.length > 0 ? images : src ? [src] : []).filter(
    Boolean
  ) as string[];
  const [broken, setBroken] = useState<Set<number>>(new Set());
  const [active, setActive] = useState(0);

  const visible = initial
    .map((s, i) => ({ s, i }))
    .filter(({ i }) => !broken.has(i));

  if (visible.length === 0) return null;

  // Keep the active index valid if the active image was dropped.
  const activeEntry =
    visible.find(({ i }) => i === active) ?? visible[0];

  return (
    <div className="mb-6">
      {/* Primary image — uniform 16:9 frame regardless of source dimensions */}
      <div className="relative w-full overflow-hidden rounded-lg border border-border bg-muted aspect-[16/9]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={activeEntry.s}
          alt={alt}
          onError={() =>
            setBroken((prev) => new Set(prev).add(activeEntry.i))
          }
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      {/* Thumbnail strip (only when there is more than one photo) */}
      {visible.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {visible.map(({ s, i }) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View photo ${i + 1}`}
              aria-current={i === activeEntry.i}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-md border transition-all ${
                i === activeEntry.i
                  ? 'border-primary ring-2 ring-primary/30'
                  : 'border-border opacity-80 hover:opacity-100'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s}
                alt=""
                onError={() => setBroken((prev) => new Set(prev).add(i))}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
