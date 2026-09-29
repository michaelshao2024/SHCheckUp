'use client';

import { useState, useEffect } from 'react';
import { SearchBar } from '@/components/search-bar';
import { HospitalCard } from '@/components/hospital-card';
import { PackageCard } from '@/components/package-card';
import { TestimonialsMarquee } from '@/components/testimonials-marquee';
import { SignUpPrompt } from '@/components/sign-up-prompt';
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
      'My escort Lily picked me up at my hotel and handled everything — registration, directions, every queue. The IMCC physicians explained my report in English themselves. I could not have managed on my own.',
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
  {
    name: 'Emily Tanaka',
    country: 'Japan',
    context: 'Premium screening at Shanghai General Hospital IMCC, July 2026',
    rating: 5,
    quote:
      'The VIP package at IMCC was worth it — the escort handled all the logistics from my hotel, and the hospital’s own physician walked me through my report in English. Felt like private healthcare back home.',
  },
  {
    name: 'Michael Brown',
    country: 'Australia',
    context: 'Executive checkup at United Family Hospital, June 2026',
    rating: 5,
    quote:
      'Booked two days before my flight. The escort had my registration ready when I arrived and I was done by 11am. Report in English the same week.',
  },
  {
    name: 'Sophie Laurent',
    country: 'France',
    context: 'Comprehensive checkup at Jiahui Health, September 2026',
    rating: 5,
    quote:
      'As someone who speaks no Chinese, the escort service was essential. Every form, every queue, every doctor conversation — handled. Absolutely seamless.',
  },
  {
    name: 'Robert Kim',
    country: 'South Korea',
    context: 'Cardiovascular screening at Huashan Hospital, May 2026',
    rating: 4,
    quote:
      'The coronary CTA package was thorough and much cheaper than back home. The escort helped me understand each result. Only wish I had booked the hotel pickup too.',
  },
  {
    name: 'Maria Gonzalez',
    country: 'Spain',
    context: 'Allergy screening at Shanghai General Hospital IMCC, August 2026',
    rating: 5,
    quote:
      'I finally identified my food intolerances after years of guessing. The allergy specialist consultation in English was detailed and the avoidance plan is actually practical.',
  },
  {
    name: 'Thomas Weber',
    country: 'Germany',
    context: 'Inpatient checkup at Shanghai General Hospital IMCC, July 2026',
    rating: 5,
    quote:
      'The one-day inpatient package is a hidden gem — private room, all tests scheduled back to back, and a chief physician walked me through the report personally.',
  },
  {
    name: 'Priya Sharma',
    country: 'India',
    context: 'Executive screening at ParkwayHealth, June 2026',
    rating: 4,
    quote:
      'Efficient and professional. The clinic is used to international patients so nothing felt foreign. Escort met me at the entrance and I never touched a single form.',
  },
  {
    name: 'Lisa Anderson',
    country: 'Canada',
    context: 'Cancer screening at United Family Hospital, September 2026',
    rating: 5,
    quote:
      'The painless gastroscopy package gave me real peace of mind. Everything was explained before and after, and the follow-up email summary was in perfect English.',
  },
];

interface SearchResult {
  hospitals: Array<{ id: string; name: string; description?: string; address: string }>;
  packages: Array<{
    id: string; name: string; price?: number; duration?: string | null;
    hospitalName?: string; avgRating?: number; tags?: string[];
    englishReport?: boolean | null; englishService?: boolean | null;
  }>;
  authRequired?: boolean;
}

export default function HomePage() {
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [initialHospitals, setInitialHospitals] = useState<Array<{ id: string; name: string; nameCn?: string | null; description?: string; address: string }>>([]);
  // Sort: key + direction; clicking a column header toggles direction
  const [sortKey, setSortKey] = useState<'default' | 'price' | 'duration' | 'rating'>('default');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  function toggleSort(key: 'price' | 'duration' | 'rating') {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'rating' ? 'desc' : 'asc'); // rating defaults to highest first
    }
  }

  // Duration strings like "3 hours" / "Half day" / "Full day" -> approximate hours
  function durationHours(d: string | null): number {
    if (!d) return Number.POSITIVE_INFINITY;
    const lower = d.toLowerCase();
    if (lower.includes('full day')) return 8;
    if (lower.includes('half day')) return 4;
    const m = lower.match(/(\d+(?:\.\d+)?)/);
    if (m) return lower.includes('day') ? parseFloat(m[1]) * 8 : parseFloat(m[1]);
    return Number.POSITIVE_INFINITY;
  }

  function sortedPackages(pkgs: SearchResult['packages']) {
    if (sortKey === 'default') return pkgs;
    const arr = [...pkgs];
    const dir = sortDir === 'asc' ? 1 : -1;
    const keyVal = (x: SearchResult['packages'][number]) =>
      sortKey === 'price' ? (x.price ?? 0) : sortKey === 'duration' ? durationHours(x.duration ?? null) : (x.avgRating ?? 0);
    return arr.sort((a, b) => (keyVal(a) - keyVal(b)) * dir);
  }

  function SortHeader({ label, k, className }: { label: string; k: 'price' | 'duration' | 'rating'; className?: string }) {
    const active = sortKey === k;
    return (
      <th className={`p-3 text-left font-medium ${className || ''}`}>
        <button
          type="button"
          onClick={() => toggleSort(k)}
          className={`inline-flex items-center gap-1 hover:text-primary ${active ? 'text-primary' : ''}`}
        >
          {label}
          <span className="text-xs">{active ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>
        </button>
      </th>
    );
  }

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setAuthed(!!d.user)).catch(() => setAuthed(false));
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
        <div className="max-w-7xl mx-auto px-4 h-11 flex items-center justify-start sm:justify-center gap-6 text-sm overflow-x-auto whitespace-nowrap">
          <a href="#search" className="text-muted-foreground hover:text-primary transition-colors">Search</a>
          <a href="#hospitals" className="text-muted-foreground hover:text-primary transition-colors">Hospitals</a>
          <a href="#escort" className="text-muted-foreground hover:text-primary transition-colors">Medical Escort</a>
          <a href="#testimonials" className="text-muted-foreground hover:text-primary transition-colors">Reviews</a>
          <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">About</Link>
        </div>
      </nav>

      {/* Hero */}
      <section id="search" className="scroll-mt-16 relative overflow-hidden">
        {/* Shanghai skyline backdrop */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero-shanghai.jpg"
          alt="Shanghai Lujiazui skyline at dusk"
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0F1B2A]/70 via-[#0F1B2A]/45 to-[#0F1B2A]/80" />

        <div className="relative max-w-4xl mx-auto px-4 py-20 sm:py-28 text-center">
          <p className="text-xs font-semibold tracking-[0.2em] text-amber-300/90 mb-4">
            SHANGHAI · ENGLISH-SPEAKING HEALTH CHECKUPS
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-5 leading-tight">
            Find Your Health Checkup in Shanghai
          </h1>
          <p className="text-base sm:text-lg text-white/80 mb-10 max-w-2xl mx-auto">
            Compare medical checkup packages at Shanghai hospitals. Search, compare reviews, and book with confidence.
          </p>
          <div className="flex justify-center">
            <div className="w-full max-w-2xl bg-white rounded-xl p-2 shadow-2xl shadow-black/30">
              <SearchBar onSearch={handleSearch} />
            </div>
          </div>
          <p className="text-xs text-white/60 mt-5">
            Sign in for detailed results. Anonymous users see limited information.
          </p>
        </div>
      </section>

      {/* Results */}
      <section id="hospitals" className="scroll-mt-16 max-w-7xl mx-auto px-4 py-8">
        {loading && <p className="text-center text-muted-foreground">Searching...</p>}

        {!loading && hasSearched && results && (
          <>
            {results.packages.length > 0 && (
              <div className="mb-12">
                {results.authRequired ? (
                  <>
                    <h2 className="text-xl font-semibold mb-4">Checkup Packages</h2>
                    <div className="bg-white rounded-lg border border-border divide-y divide-border mb-4">
                      {results.packages.map((p) => (
                        <div key={p.id} className="px-4 py-3 font-medium">{p.name}</div>
                      ))}
                    </div>
                    <SignUpPrompt message="Sign in or create a free account to see prices, hospitals, ratings, what's included and how to book these checkup packages." />
                  </>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                      <h2 className="text-xl font-semibold">Checkup Packages</h2>
                      <Link
                        href={`/compare?ids=${results.packages.map(p => p.id).join(',')}`}
                        className="text-sm text-primary hover:underline font-medium whitespace-nowrap"
                      >
                        Compare these {results.packages.length} packages →
                      </Link>
                    </div>
                    <div className="bg-white rounded-lg border border-border overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted">
                            <th className="p-3 text-left font-medium min-w-52">Package</th>
                            <th className="p-3 text-left font-medium min-w-40">Hospital</th>
                            <SortHeader label="Price" k="price" />
                            <SortHeader label="Duration" k="duration" />
                            <SortHeader label="Rating" k="rating" />
                            <th className="p-3 text-left font-medium">English</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedPackages(results.packages).map((p) => (
                            <tr key={p.id} className="border-t border-border hover:bg-muted/50 transition-colors">
                              <td className="p-3">
                                <Link href={`/packages/${p.id}`} className="font-medium hover:text-primary hover:underline">
                                  {p.name}
                                </Link>
                                <div className="flex gap-1 mt-1 flex-wrap">
                                  {(p.tags ?? []).slice(0, 3).map(t => (
                                    <span key={t} className="px-1.5 py-0.5 bg-muted rounded text-xs text-muted-foreground capitalize">{t}</span>
                                  ))}
                                </div>
                              </td>
                              <td className="p-3 text-muted-foreground">{p.hospitalName}</td>
                              <td className="p-3 whitespace-nowrap"><span className="font-bold text-primary">¥{(p.price ?? 0).toLocaleString()}</span></td>
                              <td className="p-3 whitespace-nowrap text-muted-foreground">{p.duration || '-'}</td>
                              <td className="p-3 whitespace-nowrap">
                                <span className="text-yellow-500">{'★'.repeat(Math.round(p.avgRating ?? 0))}</span>
                                <span className="text-xs text-muted-foreground ml-1">{(p.avgRating ?? 0).toFixed(1)}</span>
                              </td>
                              <td className="p-3 whitespace-nowrap text-xs">
                                {p.englishService === true && <span className="inline-block px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded mr-1">Full EN</span>}
                                {p.englishReport === true && <span className="inline-block px-1.5 py-0.5 bg-green-50 text-green-700 rounded">EN report</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}
            {results.hospitals.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Hospitals</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.hospitals.map((h) => (
                    <HospitalCard key={h.id} {...h} />
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
                  {authed && (
                    <Link href="/compare" className="text-sm text-primary hover:underline">Compare Packages →</Link>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {initialHospitals.map((h) => (
                    <HospitalCard key={h.id} id={h.id} name={h.name} description={h.description} address={h.address} />
                  ))}
                </div>
                {authed === false && (
                  <div className="mt-8">
                    <SignUpPrompt message="You're seeing hospital names and areas only. Create a free account to unlock full addresses, contacts, checkup packages and prices." />
                  </div>
                )}
              </div>
            )}
            <div className="text-center py-8 text-muted-foreground">
              <p>Search above to find checkup packages and hospitals.</p>
            </div>
          </div>
        )}
      </section>

      {/* Medical Escort Service */}
      <section id="escort" className="scroll-mt-16 relative overflow-hidden border-t border-border py-16 sm:py-20">
        {/* Shanghai Bund heritage waterfront backdrop (distinct from hero) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/escort-bund.jpg"
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0F1B2A]/80 via-[#0F1B2A]/68 to-[#0F1B2A]/88" />
        {/* Extra left-side darkening so the headline/intro over the bright sky stays legible */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F1B2A]/85 via-[#0F1B2A]/45 to-transparent" />
        <div className="relative max-w-5xl mx-auto px-4">
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-semibold tracking-widest text-amber-300 mb-2 drop-shadow-[0_1px_6px_rgba(0,0,0,0.6)]">MEDICAL ESCORT SERVICE</p>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 leading-tight text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.6)]">A local guide for your hospital visit</h2>
            <p className="text-white/90 leading-relaxed drop-shadow-[0_1px_6px_rgba(0,0,0,0.55)]">
              An English-speaking escort meets you at your hotel, guides you through the whole
              hospital visit, and takes you back — so you never navigate registration, forms or
              departments alone.
            </p>
          </div>

          {/* Three concise value points */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
            <div className="rounded-xl bg-white border border-border p-5">
              <div className="text-primary text-xl mb-2" aria-hidden="true">📍</div>
              <h3 className="font-semibold text-sm mb-1">Hotel pickup &amp; return</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Door to door, on time, with your appointment and paperwork arranged in advance.</p>
            </div>
            <div className="rounded-xl bg-white border border-border p-5">
              <div className="text-primary text-xl mb-2" aria-hidden="true">🧭</div>
              <h3 className="font-semibold text-sm mb-1">Guidance on the day</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Directions, scheduling, payments and logistics handled — you just focus on your health.</p>
            </div>
            <div className="rounded-xl bg-white border border-border p-5">
              <div className="text-primary text-xl mb-2" aria-hidden="true">🔒</div>
              <h3 className="font-semibold text-sm mb-1">Private &amp; professional</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">We handle logistics only — your consultations and reports stay with the hospital&apos;s physicians.</p>
            </div>
          </div>

          {/* Compact how-it-works + CTA row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl bg-white border border-border p-5">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 text-sm">
              <li className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">1</span> Tell us your plan</li>
              <li aria-hidden="true" className="text-muted-foreground">→</li>
              <li className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">2</span> We confirm by email</li>
              <li aria-hidden="true" className="text-muted-foreground">→</li>
              <li className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">3</span> Hotel pickup on the day</li>
            </ol>
            <Link href="/about" className="inline-flex items-center gap-1.5 shrink-0 text-sm font-semibold text-primary hover:gap-2.5 transition-all">
              Learn more
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Patient reviews */}
      <section id="testimonials" className="scroll-mt-16 py-16 overflow-hidden">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-2 text-center">What our customers say</h2>
          <p className="text-muted-foreground text-center mb-10">
            Feedback from visitors who used the medical escort service.
          </p>
        </div>
        {/* Full-width marquee with soft edge fades */}
        <div className="marquee-full relative">
          <TestimonialsMarquee items={TESTIMONIALS} />
        </div>
        <p className="text-xs text-muted-foreground text-center mt-4">Hover to pause · scrolls automatically</p>
      </section>
    </div>
  );
}