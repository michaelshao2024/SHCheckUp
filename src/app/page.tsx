'use client';

import { useState, useEffect } from 'react';
import { SearchBar } from '@/components/search-bar';
import { HospitalCard } from '@/components/hospital-card';
import { PackageCard } from '@/components/package-card';
import Link from 'next/link';

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
      {/* Hero */}
      <section className="py-20 text-center bg-gradient-to-b from-primary/5 to-background">
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

      {/* Medical Escort Service intro */}
      <section className="bg-muted/50 py-14">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-3">Medical Escort Service</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Coming to Shanghai for a health checkup? Our bilingual escorts accompany you through the whole visit —
            so language and hospital procedures are never a barrier.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="bg-white rounded-lg border border-border p-5">
              <p className="text-2xl mb-2">🗣️</p>
              <p className="font-medium mb-1">English-speaking escort</p>
              <p className="text-sm text-muted-foreground">A dedicated companion translates and communicates with medical staff on your behalf.</p>
            </div>
            <div className="bg-white rounded-lg border border-border p-5">
              <p className="text-2xl mb-2">📋</p>
              <p className="font-medium mb-1">Appointments handled</p>
              <p className="text-sm text-muted-foreground">We book your checkup, prepare paperwork, and guide you through registration on the day.</p>
            </div>
            <div className="bg-white rounded-lg border border-border p-5">
              <p className="text-2xl mb-2">🏥</p>
              <p className="font-medium mb-1">Door-to-door guidance</p>
              <p className="text-sm text-muted-foreground">Hospital navigation, queue handling, and post-checkup report collection explained in English.</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-8">
            Interested? Open any checkup package and click <span className="font-medium text-foreground">“Book Medical Escort Service”</span> — we will get in touch by email.
          </p>
        </div>
      </section>

      {/* Results */}
      <section className="max-w-7xl mx-auto px-4 py-8">
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
    </div>
  );
}