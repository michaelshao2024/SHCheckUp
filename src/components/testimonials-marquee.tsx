'use client';

interface Testimonial {
  name: string;
  country: string;
  context: string;
  rating: number;
  quote: string;
}

function Card({ t }: { t: Testimonial }) {
  return (
    <figure className="shrink-0 w-72 sm:w-80 bg-white rounded-lg border border-border p-6">
      <div className="text-yellow-500 text-sm mb-3" aria-label={`${t.rating} out of 5 stars`}>
        {'★'.repeat(t.rating)}<span className="text-muted-foreground">{'★'.repeat(5 - t.rating)}</span>
      </div>
      <blockquote className="text-sm text-muted-foreground mb-4 leading-relaxed">“{t.quote}”</blockquote>
      <figcaption className="text-sm">
        <span className="font-medium">{t.name}</span>
        <span className="text-muted-foreground"> · {t.country}</span>
        <p className="text-xs text-muted-foreground mt-0.5">{t.context}</p>
      </figcaption>
    </figure>
  );
}

/**
 * Infinite looping marquee of testimonial cards.
 * Best practices: pauses on hover/focus, scrollable via touch on mobile,
 * falls back to a static scrollable row when the user prefers reduced motion.
 */
export function TestimonialsMarquee({ items }: { items: Testimonial[] }) {
  // Two copies for a seamless loop
  const doubled = [...items, ...items];
  return (
    <div
      className="marquee overflow-x-auto sm:overflow-hidden"
      role="region"
      aria-label="Customer reviews"
    >
      <div className="marquee-track flex gap-4 w-max py-1">
        {doubled.map((t, i) => (
          <Card key={`${t.name}-${i}`} t={t} />
        ))}
      </div>
    </div>
  );
}
