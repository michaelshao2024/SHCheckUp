import type { Metadata } from 'next';
import Link from 'next/link';
import { GUIDES } from '@/content/guides';

export const metadata: Metadata = {
  title: 'Guides — Health Checkups in Shanghai',
  description:
    'Practical guides for international visitors: Shanghai health checkup prices, best international hospitals for expats, and how to prepare for your hospital visit.',
  alternates: { canonical: '/guides' },
};

export default function GuidesIndexPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <Link href="/" className="inline-block text-sm text-primary hover:underline mb-6">
        ← Back to home
      </Link>
      <p className="text-xs font-semibold tracking-widest text-amber-600 mb-2">GUIDES</p>
      <h1 className="text-3xl sm:text-4xl font-bold mb-3">Health checkups in Shanghai — guides</h1>
      <p className="text-muted-foreground mb-10">
        Practical, data-backed guides for international visitors and expats arranging health checkups in Shanghai.
      </p>
      <div className="grid sm:grid-cols-2 gap-5">
        {GUIDES.map((g) => (
          <Link
            key={g.slug}
            href={`/guides/${g.slug}`}
            className="block rounded-xl bg-white border border-border p-6 hover:shadow-md hover:border-primary/40 transition-all"
          >
            <h2 className="font-semibold text-lg mb-2 leading-snug">{g.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">{g.excerpt}</p>
            <span className="text-sm text-primary font-medium">Read guide →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
