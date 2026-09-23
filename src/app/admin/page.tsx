'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Hospital {
  id: string;
  name: string;
  nameCn: string | null;
  address: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  description: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHospitals();
  }, []);

  async function fetchHospitals() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/hospitals');
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch hospitals');
      }
      const data = await res.json();
      setHospitals(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load hospitals');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage hospitals and checkup packages</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/inquiries"
            className="inline-flex items-center px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            Inquiries
          </Link>
          <Link
            href="/admin/hospitals/new"
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            + New Hospital
          </Link>
          <Link
            href="/admin/packages/new"
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            + New Package
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading hospitals...</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg border border-border p-6">
              <p className="text-sm text-muted-foreground">Total Hospitals</p>
              <p className="text-3xl font-bold mt-1">{hospitals.length}</p>
            </div>
            <div className="bg-white rounded-lg border border-border p-6">
              <p className="text-sm text-muted-foreground">Active Hospitals</p>
              <p className="text-3xl font-bold mt-1">{hospitals.filter(h => h.isActive).length}</p>
            </div>
            <Link href="/admin/packages" className="bg-white rounded-lg border border-border p-6 hover:border-primary transition-colors block">
              <p className="text-sm text-muted-foreground">Manage Packages</p>
              <p className="text-3xl font-bold mt-1 text-primary">View All →</p>
            </Link>
          </div>

          {/* Hospital List */}
          <div className="bg-white rounded-lg border border-border">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold">Hospitals</h2>
            </div>
            <div className="divide-y divide-border">
              {hospitals.length === 0 ? (
                <div className="px-6 py-12 text-center text-muted-foreground">
                  No hospitals yet. Create your first hospital to get started.
                </div>
              ) : (
                hospitals.map((hospital) => (
                  <div key={hospital.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium truncate">{hospital.name}</h3>
                        {hospital.nameCn && (
                          <span className="text-sm text-muted-foreground shrink-0">{hospital.nameCn}</span>
                        )}
                        {!hospital.isActive && (
                          <span className="text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded-full shrink-0">Inactive</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate mt-0.5">{hospital.address}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <Link
                        href={`/admin/hospitals/new?id=${hospital.id}`}
                        className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-muted transition-colors"
                      >
                        Edit
                      </Link>
                      <Link
                        href="/admin/packages"
                        className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                      >
                        Packages
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}