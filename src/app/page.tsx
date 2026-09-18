'use client';

import { useState } from 'react';
import { SearchBar } from '@/components/search-bar';
import { HospitalCard } from '@/components/hospital-card';
import { PackageCard } from '@/components/package-card';

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
          <div className="text-center py-12 text-muted-foreground">
            <p>Search above to find checkup packages and hospitals.</p>
          </div>
        )}
      </section>
    </div>
  );
}