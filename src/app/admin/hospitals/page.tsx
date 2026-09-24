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

export default function AdminHospitalsPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/hospitals/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete hospital');
      }
      setMessage(`Hospital "${name}" deleted successfully.`);
      fetchHospitals();
    } catch (err: any) {
      setError(err.message || 'Failed to delete hospital');
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Manage Hospitals</h1>
          <p className="text-muted-foreground mt-1">View, edit, or remove hospitals</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            href="/api/admin/export?type=hospitals"
            download
            className="inline-flex items-center px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            Export Excel
          </a>
          <Link
            href="/admin/hospitals/new"
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            + New Hospital
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {message}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading hospitals...</div>
      ) : hospitals.length === 0 ? (
        <div className="bg-white rounded-lg border border-border p-12 text-center">
          <p className="text-muted-foreground mb-4">No hospitals found.</p>
          <Link
            href="/admin/hospitals/new"
            className="text-primary hover:underline font-medium"
          >
            Create your first hospital →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-border divide-y divide-border">
          {hospitals.map((hospital) => (
            <div key={hospital.id} className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium">{hospital.name}</h3>
                  {hospital.nameCn && (
                    <span className="text-sm text-muted-foreground">{hospital.nameCn}</span>
                  )}
                  {!hospital.isActive && (
                    <span className="text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded-full">Inactive</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate mt-0.5">{hospital.address}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0 sm:ml-4">
                <Link
                  href={`/admin/hospitals/new?id=${hospital.id}`}
                  className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-muted transition-colors"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(hospital.id, hospital.name)}
                  className="px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-md hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6">
        <Link href="/admin" className="text-sm text-primary hover:underline">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}