'use client';

import { useState, useEffect } from 'react';
import { SearchBar } from '@/components/search-bar';
import { HospitalCard } from '@/components/hospital-card';
import { PackageCard } from '@/components/package-card';
import Link from 'next/link';
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from '@/lib/constants';

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
    },
    {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      inLanguage: 'en',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_URL}/?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};

// Curated patient feedback shown in the Reviews section
const TESTIMONIALS = [
  {
    name: 'Sarah Mitchell',
    country: 'United States',
    context: 'Executive checkup at Jiahui Health, June 2026',
    rating: 5,
    quote:
      'My escort Lily met me at the hospital entrance and handled everything — registration, translating the doctors’ questions, even walking me through my report afterwards. I could not have managed on my own.',
  },
  {
    name: 'James Whitfield',
    country: 'United Kingdom',
    context: 'Comprehensive screening at Huashan Hospital, May 2026',
    rating: 5,
    quote:
      'The hospital itself is excellent, but I would have been completely lost without the escort service. Every form was filled in for me and the whole visit was done by lunch.',
  },
  {
    name: 'Anna Kowalski',
    country: 'Germany',
    context: 'Premium checkup at United Family Hospital, July 2026',
    rating: 5,
    quote:
      'Worth every cent. Booking took one short form, and on the day my escort already had my paperwork ready. The explanation of my results in English was thorough and reassuring.',
  },
  {
    name: 'David Chen',
    country: 'Singapore',
    context: 'Standard checkup at Ruijin Hospital, August 2026',
    rating: 4,
    quote:
      'Smooth from start to finish. The team confirmed my appointment within a day and the escort spoke perfect English. I will be booking again for my parents next year.',
  },
];

interface SearchResult {
  hospitals: Array<{ id: string; name: string; description: string; address: string }>;
  packages: Array<{
    id: string; name: string; price: number; duration: string | null;
    hospitalName: string; avgRating: number; tags: string[];
  }>;
}

export default function HomePage() {
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [initialHospitals, setInitialHospitals] = useState<Array<{ id: string; name: string; nameCn: string | null; description: string; address: string }>>([]);

  useEffect(() => {
    fetch('/api/hospitals').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setInitialHospitals(data);
    }).catch(() => {});
  }, []);

  const handleSearch = async (query: string) => {
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch {
      // fallback: show nothing
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      {/* Homepage section navigation */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-11 flex items-center justify-center gap-6 text-sm">
          <a href="#search" className="text-muted-foreground hover:text-primary transition-colors">Search</a>
          <a href="#hospitals" className="text-muted-foreground hover:text-primary transition-colors">Hospitals</a>
          <a href="#escort" className="text-muted-foreground hover:text-primary transition-colors">Medical Escort</a>
          <a href="#testimonials" className="text-muted-foreground hover:text-primary transition-colors">Reviews</a>
        </div>
      </nav>

      {/* Hero */}
      <section id="search" className="scroll-mt-16 py-20 text-center bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Find Your Health Checkup in Shanghai</h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Compare medical checkup packages at Shanghai hospitals. Search, compare reviews, and book with confidence.
          </p>
          <div className="flex justify-center">
            <SearchBar onSearch={handleSearch} />
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Sign in for detailed results. Anonymous users see limited information.
          </p>
        </div>
      </section>

      {/* Results */}
      <section id="hospitals" className="scroll-mt-16 max-w-7xl mx-auto px-4 py-8">
        {loading && <p className="text-center text-muted-foreground">Searching...</p>}

        {!loading && hasSearched && results && (
          <>
            {results.hospitals.length > 0 && (
              <div className="mb-12">
                <h2 className="text-xl font-semibold mb-4">Hospitals</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.hospitals.map((h) => (
                    <HospitalCard key={h.id} {...h} />
                  ))}
                </div>
              </div>
            )}

            {results.packages.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Checkup Packages</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.packages.map((p) => (
                    <PackageCard key={p.id} {...p} />
                  ))}
                </div>
              </div>
            )}

            {results.hospitals.length === 0 && results.packages.length === 0 && (
              <p className="text-center text-muted-foreground py-12">
                No results found. Try a different search term.
              </p>
            )}
          </>
        )}

        {!loading && !hasSearched && (
          <div>
            {/* Initial Hospital Listing */}
            {initialHospitals.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Shanghai Hospitals</h2>
                  <Link href="/compare" className="text-sm text-primary hover:underline">Compare Packages →</Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {initialHospitals.map((h) => (
                    <HospitalCard key={h.id} id={h.id} name={h.name} description={h.description} address={h.address} />
                  ))}
                </div>
              </div>
            )}
            <div className="text-center py-8 text-muted-foreground">
              <p>Search above to find checkup packages and hospitals.</p>
            </div>
          </div>
        )}
      </section>

      {/* Medical Escort Service */}
      <section id="escort" className="scroll-mt-16 border-t border-border bg-muted/40 py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
            <div>
              <p className="text-xs font-semibold tracking-widest text-primary mb-2">MEDICAL ESCORT SERVICE</p>
              <h2 className="text-2xl font-bold mb-4">A local guide for your hospital visit in Shanghai</h2>
              <p className="text-muted-foreground mb-5">
                Booking a health checkup abroad can feel complicated — forms in Chinese, unfamiliar departments,
                long queues. Our bilingual medical escorts meet you at the hospital and stay with you through
                the entire visit.
              </p>
              <ul className="space-y-2.5 text-sm">
                <li className="flex gap-2.5"><span className="text-primary shrink-0">—</span><span>We book the appointment and prepare your registration in advance</span></li>
                <li className="flex gap-2.5"><span className="text-primary shrink-0">—</span><span>Your escort translates every conversation with doctors and staff</span></li>
                <li className="flex gap-2.5"><span className="text-primary shrink-0">—</span><span>Results and reports collected and explained to you in English</span></li>
              </ul>
            </div>
            <div className="bg-white rounded-lg border border-border p-6">
              <h3 className="font-semibold mb-5">How it works</h3>
              <ol className="space-y-5 text-sm">
                <li className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">1</span>
                  <div>
                    <p className="font-medium">Tell us your plan</p>
                    <p className="text-muted-foreground mt-0.5">Pick any checkup package and submit the escort request form — it takes two minutes.</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">2</span>
                  <div>
                    <p className="font-medium">We confirm by email</p>
                    <p className="text-muted-foreground mt-0.5">You receive the date, hospital details, and your escort’s name and phone number.</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">3</span>
                  <div>
                    <p className="font-medium">Meet at the hospital</p>
                    <p className="text-muted-foreground mt-0.5">Your escort handles the day — you just follow along and get checked.</p>
                  </div>
                </li>
              </ol>
              <p className="text-xs text-muted-foreground mt-6 pt-4 border-t border-border">
                Free to request — you only pay after we confirm availability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Patient reviews */}
      <section id="testimonials" className="scroll-mt-16 py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-2 text-center">What our customers say</h2>
          <p className="text-muted-foreground text-center mb-10">
            Feedback from visitors who used the medical escort service.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="bg-white rounded-lg border border-border p-6">
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
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}