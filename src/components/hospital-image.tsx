'use client';

import { useState } from 'react';

export function HospitalImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className="w-full h-48 object-cover rounded-lg mb-4"
    />
  );
}
