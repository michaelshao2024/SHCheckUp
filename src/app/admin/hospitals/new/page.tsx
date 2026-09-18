'use client';

import { Suspense, useState, useEffect, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface HospitalFormData {
  name: string;
  nameCn: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  description: string;
}

function AdminHospitalFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const isEditing = !!editId;

  const [form, setForm] = useState<HospitalFormData>({
    name: '',
    nameCn: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEditing);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (editId) {
      loadHospital(editId);
    }
  }, [editId]);

  async function loadHospital(id: string) {
    setFetchLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/hospitals');
      if (!res.ok) throw new Error('Failed to load hospital');
      const hospitals = await res.json();
      const hospital = hospitals.find((h: any) => h.id === id);
      if (!hospital) throw new Error('Hospital not found');
      setForm({
        name: hospital.name || '',
        nameCn: hospital.nameCn || '',
        address: hospital.address || '',
        phone: hospital.phone || '',
        email: hospital.email || '',
        website: hospital.website || '',
        description: hospital.description || '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load hospital');
    } finally {
      setFetchLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const url = isEditing ? `/api/admin/hospitals/${editId}` : '/api/admin/hospitals';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save hospital');
      }

      setSuccess(isEditing ? 'Hospital updated successfully!' : 'Hospital created successfully!');

      if (!isEditing) {
        setForm({ name: '', nameCn: '', address: '', phone: '', email: '', website: '', description: '' });
      }

      setTimeout(() => {
        router.push('/admin/hospitals');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to save hospital');
    } finally {
      setLoading(false);
    }
  }

  if (fetchLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center text-muted-foreground">
        Loading hospital data...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/admin/hospitals" className="text-sm text-primary hover:underline">
          ← Back to Hospitals
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-border p-6">
        <h1 className="text-2xl font-bold mb-6">{isEditing ? 'Edit Hospital' : 'New Hospital'}</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{success}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Hospital Name (English) <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={form.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="e.g. Huashan Hospital"
            />
          </div>

          <div>
            <label htmlFor="nameCn" className="block text-sm font-medium mb-1">
              Hospital Name (Chinese)
            </label>
            <input
              id="nameCn"
              name="nameCn"
              type="text"
              value={form.nameCn}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="e.g. 华山医院"
            />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium mb-1">
              Address <span className="text-red-500">*</span>
            </label>
            <input
              id="address"
              name="address"
              type="text"
              required
              value={form.address}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Full address"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-1">Phone</label>
              <input
                id="phone"
                name="phone"
                type="text"
                value={form.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="+86 21 1234 5678"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="contact@hospital.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="website" className="block text-sm font-medium mb-1">Website</label>
            <input
              id="website"
              name="website"
              type="url"
              value={form.website}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="https://www.hospital.com"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={4}
              value={form.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-y"
              placeholder="Describe the hospital, its specialties, location highlights..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : isEditing ? 'Update Hospital' : 'Create Hospital'}
            </button>
            <Link
              href="/admin/hospitals"
              className="px-6 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function HospitalFormPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading form...</div>}>
      <AdminHospitalFormPage />
    </Suspense>
  );
}