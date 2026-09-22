'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Hospital { id: string; name: string; }

interface Package {
  id: string; name: string; price: number; currency: string; duration: string | null;
  hospitalId: string; hospitalName: string; avgRating: number; tags: string[];
  items: string[]; description: string | null; includesTranslator: boolean;
}

export default function ComparePage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [compareList, setCompareList] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [hRes, pRes] = await Promise.all([
          fetch('/api/admin/hospitals').then(r => r.json()).catch(() => []),
          fetch('/api/admin/packages').then(r => r.json()).catch(() => []),
        ]);
        setHospitals(Array.isArray(hRes) ? hRes : []);
        // Admin API serializes Prisma Decimal fields (price, avgRating) as strings — normalize to numbers
        setPackages(
          Array.isArray(pRes)
            ? pRes.map((p: any) => ({ ...p, price: Number(p.price), avgRating: Number(p.avgRating) }))
            : []
        );
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const showComparison = () => {
    setCompareList(packages.filter(p => selected.includes(p.id)));
  };

  const allItems = compareList.flatMap(p => p.items || []);
  const uniqueItems = [...new Set(allItems)];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link href="/" className="text-sm text-primary hover:underline mb-4 inline-block">← Back to Home</Link>
      <h1 className="text-3xl font-bold mb-2">Compare Checkup Packages</h1>
      <p className="text-muted-foreground mb-8">Select packages to compare their features side by side.</p>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading packages...</div>
      ) : (
        <>
          {/* Select Packages */}
          <div className="bg-white rounded-lg border border-border p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">1. Select packages to compare (max 4)</h2>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {packages.map(p => (
                <label key={p.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selected.includes(p.id) ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'}`}>
                  <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleSelect(p.id)} disabled={!selected.includes(p.id) && selected.length >= 4} className="w-4 h-4 accent-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.hospitalName} — ${p.price} {p.currency}</p>
                  </div>
                </label>
              ))}
            </div>
            <button onClick={showComparison} disabled={selected.length < 2} className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
              Compare {selected.length} Packages
            </button>
          </div>

          {/* Comparison Table */}
          {compareList.length >= 2 && (
            <div className="bg-white rounded-lg border border-border p-6 overflow-x-auto">
              <h2 className="text-lg font-semibold mb-4">2. Comparison</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="p-3 text-left font-medium w-48">Feature</th>
                    {compareList.map(p => (
                      <th key={p.id} className="p-3 text-left font-medium min-w-48">
                        <p className="text-base">{p.name}</p>
                        <p className="text-xs text-muted-foreground font-normal mt-1">{p.hospitalName}</p>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border">
                    <td className="p-3 font-medium">Price</td>
                    {compareList.map(p => (
                      <td key={p.id} className="p-3"><span className="text-lg font-bold text-primary">${p.price.toLocaleString()}</span> {p.currency}</td>
                    ))}
                  </tr>
                  <tr className="border-t border-border">
                    <td className="p-3 font-medium">Duration</td>
                    {compareList.map(p => <td key={p.id} className="p-3">{p.duration || '-'}</td>)}
                  </tr>
                  <tr className="border-t border-border">
                    <td className="p-3 font-medium">Rating</td>
                    {compareList.map(p => <td key={p.id} className="p-3">{'★'.repeat(Math.round(p.avgRating))} {p.avgRating.toFixed(1)}</td>)}
                  </tr>
                  <tr className="border-t border-border">
                    <td className="p-3 font-medium">Translator</td>
                    {compareList.map(p => <td key={p.id} className="p-3">{p.includesTranslator ? '✅ Included' : '❌ Not included'}</td>)}
                  </tr>
                  <tr className="border-t border-border">
                    <td className="p-3 font-medium">Tags</td>
                    {compareList.map(p => <td key={p.id} className="p-3"><div className="flex gap-1 flex-wrap">{p.tags.map(t => <span key={t} className="px-2 py-0.5 bg-muted rounded text-xs">{t}</span>)}</div></td>)}
                  </tr>
                  {uniqueItems.map(item => (
                    <tr key={item} className="border-t border-border">
                      <td className="p-3 text-muted-foreground">{item}</td>
                      {compareList.map(p => (
                        <td key={p.id} className="p-3">{(p.items || []).includes(item) ? '✅' : '—'}</td>
                      ))}
                    </tr>
                  ))}
                  {compareList.map(p => p.description && (
                    <tr key={`desc-${p.id}`} className="border-t border-border">
                      <td className="p-3 text-muted-foreground">Description</td>
                      {compareList.map(p2 => <td key={p2.id} className="p-3 text-xs text-muted-foreground">{p2.description || '-'}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {compareList.length === 0 && packages.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No packages available. Add some packages first via the admin panel.</p>
              <Link href="/admin/packages/new" className="text-primary hover:underline mt-2 inline-block">Add Package →</Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}