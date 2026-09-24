'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Inquiry {
  id: string;
  name: string;
  email: string;
  preferredDate: string | null;
  message: string;
  status: string;
  createdAt: string;
  hospital: { name: string } | null;
  package: { name: string } | null;
}

const STATUS_OPTIONS = ['pending', 'processing', 'done'];
const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
  done: 'bg-green-50 text-green-700 border-green-200',
};

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInquiries();
  }, []);

  async function fetchInquiries() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/inquiries');
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch inquiries');
      }
      setInquiries(await res.json());
    } catch (err: any) {
      setError(err.message || 'Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      const res = await fetch('/api/admin/inquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error('Update failed');
      setInquiries((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    } catch {
      alert('Failed to update status');
    }
  }

  const pendingCount = inquiries.filter((i) => i.status === 'pending').length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Inquiries</h1>
          <p className="text-muted-foreground mt-1">
            Medical escort service requests · {pendingCount} pending
          </p>
        </div>
        <Link href="/admin" className="text-sm text-primary hover:underline">← Back to Dashboard</Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading inquiries...</div>
      ) : inquiries.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-white rounded-lg border border-border">
          No inquiries yet.
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inq) => (
            <div key={inq.id} className="bg-white rounded-lg border border-border p-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 mb-3">
                <div>
                  <p className="font-medium">{inq.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {inq.email}
                    {inq.preferredDate && ` · Prefers ${new Date(inq.preferredDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`}
                  </p>
                </div>
                <select
                  value={inq.status}
                  onChange={(e) => updateStatus(inq.id, e.target.value)}
                  className={`text-xs px-2 py-1 rounded-full border capitalize ${STATUS_STYLES[inq.status] || 'bg-muted'}`}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              {(inq.package || inq.hospital) && (
                <p className="text-sm mb-2">
                  {inq.package && <span className="font-medium">{inq.package.name}</span>}
                  {inq.package && inq.hospital && ' · '}
                  {inq.hospital && <span className="text-muted-foreground">{inq.hospital.name}</span>}
                </p>
              )}
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{inq.message}</p>
              <p className="text-xs text-muted-foreground mt-3">
                Submitted {new Date(inq.createdAt).toLocaleString('en-US')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
