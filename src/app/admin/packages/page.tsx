'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface CheckupPackage {
  id: string;
  name: string;
  hospitalId: string;
  price: number;
  currency: string;
  duration: string | null;
  items: string[] | null;
  description: string | null;
  tags: string[];
  includesTranslator: boolean;
  isActive: boolean;
  createdAt: string;
  hospital: {
    id: string;
    name: string;
    nameCn: string | null;
  };
}

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<CheckupPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchPackages();
  }, []);

  async function fetchPackages() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/packages');
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch packages');
      }
      const data = await res.json();
      setPackages(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load packages');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/packages/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete package');
      }
      setMessage(`Package "${name}" deleted successfully.`);
      fetchPackages();
    } catch (err: any) {
      setError(err.message || 'Failed to delete package');
    }
  }

  function formatPrice(price: number, currency: string) {
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'CNY' ? '¥' : currency + ' ';
    return `${symbol}${Number(price).toLocaleString()}`;
  }

  // Group packages by hospital
  const grouped = packages.reduce<Record<string, { hospital: CheckupPackage['hospital']; packages: CheckupPackage[] }>>((acc, pkg) => {
    const key = pkg.hospital.id;
    if (!acc[key]) {
      acc[key] = { hospital: pkg.hospital, packages: [] };
    }
    acc[key].packages.push(pkg);
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Manage Packages</h1>
          <p className="text-muted-foreground mt-1">View, edit, or remove checkup packages</p>
        </div>
        <Link
          href="/admin/packages/new"
          className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          + New Package
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}
      {message && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{message}</div>
      )}

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading packages...</div>
      ) : packages.length === 0 ? (
        <div className="bg-white rounded-lg border border-border p-12 text-center">
          <p className="text-muted-foreground mb-4">No packages found.</p>
          <Link href="/admin/packages/new" className="text-primary hover:underline font-medium">
            Create your first package →
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([hospitalId, group]) => (
            <div key={hospitalId} className="bg-white rounded-lg border border-border">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{group.hospital.name}</h2>
                  {group.hospital.nameCn && (
                    <p className="text-sm text-muted-foreground">{group.hospital.nameCn}</p>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">{group.packages.length} package{group.packages.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="divide-y divide-border">
                {group.packages.map((pkg) => (
                  <div key={pkg.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{pkg.name}</h3>
                        {!pkg.isActive && (
                          <span className="text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded-full">Inactive</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{formatPrice(pkg.price, pkg.currency)}</span>
                        {pkg.duration && <span>{pkg.duration}</span>}
                        <div className="flex gap-1">
                          {pkg.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="px-2 py-0.5 bg-muted rounded-full text-xs capitalize">{tag}</span>
                          ))}
                          {pkg.tags.length > 3 && <span className="text-xs">+{pkg.tags.length - 3}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <Link
                        href={`/admin/packages/new?id=${pkg.id}`}
                        className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-muted transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(pkg.id, pkg.name)}
                        className="px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-md hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6">
        <Link href="/admin" className="text-sm text-primary hover:underline">← Back to Dashboard</Link>
      </div>
    </div>
  );
}