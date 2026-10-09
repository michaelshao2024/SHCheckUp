import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { GUIDES, getGuide } from '@/content/guides';
import { SITE_NAME, SITE_URL } from '@/lib/constants';

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const guide = getGuide(params.slug);
  if (!guide) return { title: 'Guide Not Found' };
  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: `/guides/${guide.slug}` },
    openGraph: { title: `${guide.title} | ${SITE_NAME}`, description: guide.description, type: 'article' },
  };
}

export default function GuidePage({ params }: Props) {
  const guide = getGuide(params.slug);
  if (!guide) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: guide.title,
        description: guide.description,
        dateModified: guide.updatedAt,
        datePublished: guide.updatedAt,
        inLanguage: 'en',
        author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
        publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
        mainEntityOfPage: `${SITE_URL}/guides/${guide.slug}`,
      },
      {
        '@type': 'FAQPage',
        mainEntity: guide.faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Guides', item: `${SITE_URL}/guides` },
          { '@type': 'ListItem', position: 3, name: guide.title, item: `${SITE_URL}/guides/${guide.slug}` },
        ],
      },
    ],
  };

  return (
    <div className="bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <nav className="text-sm text-muted-foreground mb-8">
          <Link href="/" className="text-primary hover:underline">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/guides" className="text-primary hover:underline">Guides</Link>
          <span className="mx-2">/</span>
          <span>{guide.title}</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-bold mb-3 leading-tight">{guide.title}</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: {guide.updatedAt}</p>

        {guide.sections.map((sec, i) => (
          <section key={i} className="mb-10">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">{sec.heading}</h2>
            {sec.paragraphs.map((p, j) => (
              <p key={j} className="text-muted-foreground leading-relaxed mb-4">{p}</p>
            ))}
            {sec.bullets && (
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">
                {sec.bullets.map((b, j) => (
                  <li key={j}>{b}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="text-xl sm:text-2xl font-semibold mb-6">Frequently asked questions</h2>
          <div className="space-y-3">
            {guide.faqs.map((f) => (
              <details key={f.q} className="group bg-white rounded-xl border border-border px-5 py-4 open:shadow-sm">
                <summary className="cursor-pointer font-medium list-none flex items-center justify-between gap-4">
                  {f.q}
                  <span className="text-primary transition-transform group-open:rotate-45 text-xl leading-none">+</span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="rounded-xl bg-white border border-border p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="font-semibold">Ready to compare checkup packages?</p>
            <p className="text-sm text-muted-foreground">Search 50+ packages across Shanghai hospitals — free account unlocks full prices.</p>
          </div>
          <Link href="/" className="shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
            Search packages →
          </Link>
        </div>
      </div>
    </div>
  );
}
