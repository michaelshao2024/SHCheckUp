'use client';

import { Suspense, useState, useEffect, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface HospitalOption {
  id: string;
  name: string;
  nameCn: string | null;
}

interface PackageFormData {
  hospitalId: string;
  name: string;
  price: string;
  currency: string;
  duration: string;
  itemInput: string;
  items: string[];
  description: string;
  tagInput: string;
  tags: string[];
  includesTranslator: boolean;
}

function AdminPackageFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const isEditing = !!editId;

  const [hospitals, setHospitals] = useState<HospitalOption[]>([]);
  const [form, setForm] = useState<PackageFormData>({
    hospitalId: '',
    name: '',
    price: '',
    currency: 'USD',
    duration: '',
    itemInput: '',
    items: [],
    description: '',
    tagInput: '',
    tags: [],
    includesTranslator: false,
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadHospitals();
  }, []);

  async function loadHospitals() {
    setError(null);
    try {
      const res = await fetch('/api/admin/hospitals');
      if (!res.ok) throw new Error('Failed to load hospitals');
      const data = await res.json();
      setHospitals(data);
      if (data.length > 0 && !editId) {
        setForm(prev => ({ ...prev, hospitalId: data[0].id }));
      }
      if (editId && data.length > 0) {
        await loadPackage(editId);
      } else {
        setFetchLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load hospitals');
      setFetchLoading(false);
    }
  }

  async function loadPackage(id: string) {
    try {
      const res = await fetch('/api/admin/packages');
      if (!res.ok) throw new Error('Failed to load package');
      const packages = await res.json();
      const pkg = packages.find((p: any) => p.id === id);
      if (!pkg) throw new Error('Package not found');
      setForm({
        hospitalId: pkg.hospitalId || '',
        name: pkg.name || '',
        price: String(pkg.price) || '',
        currency: pkg.currency || 'USD',
        duration: pkg.duration || '',
        itemInput: '',
        items: Array.isArray(pkg.items) ? pkg.items : [],
        description: pkg.description || '',
        tagInput: '',
        tags: Array.isArray(pkg.tags) ? pkg.tags : [],
        includesTranslator: pkg.includesTranslator || false,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load package');
    } finally {
      setFetchLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setForm(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  }

  function addItem() {
    const trimmed = form.itemInput.trim();
    if (trimmed && !form.items.includes(trimmed)) {
      setForm(prev => ({ ...prev, items: [...prev.items, trimmed], itemInput: '' }));
    }
  }

  function removeItem(index: number) {
    setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  }

  function addTag() {
    const trimmed = form.tagInput.trim().toLowerCase();
    if (trimmed && !form.tags.includes(trimmed)) {
      setForm(prev => ({ ...prev, tags: [...prev.tags, trimmed], tagInput: '' }));
    }
  }

  function removeTag(index: number) {
    setForm(prev => ({ ...prev, tags: prev.tags.filter((_, i) => i !== index) }));
  }

  function handleItemKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); addItem(); }
  }

  function handleTagKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); addTag(); }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!form.hospitalId) {
      setError('Please select a hospital');
      setLoading(false);
      return;
    }

    try {
      const url = isEditing ? `/api/admin/packages/${editId}` : '/api/admin/packages';
      const method = isEditing ? 'PUT' : 'POST';

      const body: any = {
        hospitalId: form.hospitalId,
        name: form.name,
        price: parseFloat(form.price),
        currency: form.currency,
        duration: form.duration || null,
        items: form.items,
        description: form.description || null,
        tags: form.tags,
        includesTranslator: form.includesTranslator,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save package');
      }

      setSuccess(isEditing ? 'Package updated successfully!' : 'Package created successfully!');

      if (!isEditing) {
        setForm(prev => ({
          ...prev,
          name: '',
          price: '',
          currency: 'USD',
          duration: '',
          itemInput: '',
          items: [],
          description: '',
          tagInput: '',
          tags: [],
          includesTranslator: false,
        }));
      }

      setTimeout(() => {
        router.push('/admin/packages');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to save package');
    } finally {
      setLoading(false);
    }
  }

  if (fetchLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/admin/packages" className="text-sm text-primary hover:underline">
          ← Back to Packages
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-border p-6">
        <h1 className="text-2xl font-bold mb-6">{isEditing ? 'Edit Package' : 'New Package'}</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{success}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Hospital Select */}
          <div>
            <label htmlFor="hospitalId" className="block text-sm font-medium mb-1">
              Hospital <span className="text-red-500">*</span>
            </label>
            <select
              id="hospitalId"
              name="hospitalId"
              required
              value={form.hospitalId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
            >
              <option value="" disabled>Select a hospital</option>
              {hospitals.map(h => (
                <option key={h.id} value={h.id}>
                  {h.name}{h.nameCn ? ` (${h.nameCn})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Package Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={form.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="e.g. Executive Health Checkup - Premium"
            />
          </div>

          {/* Price / Currency / Duration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium mb-1">
                Price <span className="text-red-500">*</span>
              </label>
              <input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                required
                value={form.price}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="299.99"
              />
            </div>
            <div>
              <label htmlFor="currency" className="block text-sm font-medium mb-1">Currency</label>
              <select
                id="currency"
                name="currency"
                value={form.currency}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="CNY">CNY (¥)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
            <div>
              <label htmlFor="duration" className="block text-sm font-medium mb-1">Duration</label>
              <input
                id="duration"
                name="duration"
                type="text"
                value={form.duration}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="e.g. 3 hours, Full day"
              />
            </div>
          </div>

          {/* Items (tags input) */}
          <div>
            <label htmlFor="itemInput" className="block text-sm font-medium mb-1">Checkup Items</label>
            <div className="flex gap-2">
              <input
                id="itemInput"
                name="itemInput"
                type="text"
                value={form.itemInput}
                onChange={handleChange}
                onKeyDown={handleItemKeyDown}
                className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Type item and press Enter"
              />
              <button
                type="button"
                onClick={addItem}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors"
              >
                Add
              </button>
            </div>
            {form.items.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.items.map((item, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-muted rounded-full text-sm">
                    {item}
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="text-muted-foreground hover:text-red-500 ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={form.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-y"
              placeholder="Describe what this package includes..."
            />
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tagInput" className="block text-sm font-medium mb-1">Tags</label>
            <div className="flex gap-2">
              <input
                id="tagInput"
                name="tagInput"
                type="text"
                value={form.tagInput}
                onChange={handleChange}
                onKeyDown={handleTagKeyDown}
                className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Type tag and press Enter (e.g. premium)"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors"
              >
                Add
              </button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.tags.map((tag, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-accent rounded-full text-sm capitalize">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(i)}
                      className="text-muted-foreground hover:text-red-500 ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Includes Translator Toggle */}
          <div className="flex items-center gap-3">
            <label htmlFor="includesTranslator" className="text-sm font-medium cursor-pointer">
              Includes Translator Service
            </label>
            <button
              type="button"
              role="switch"
              id="includesTranslator"
              aria-checked={form.includesTranslator}
              onClick={() => setForm(prev => ({ ...prev, includesTranslator: !prev.includesTranslator }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                form.includesTranslator ? 'bg-primary' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  form.includesTranslator ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm text-muted-foreground">
              {form.includesTranslator ? 'Yes' : 'No'}
            </span>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : isEditing ? 'Update Package' : 'Create Package'}
            </button>
            <Link
              href="/admin/packages"
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

export default function PackageFormPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading form...</div>}>
      <AdminPackageFormPage />
    </Suspense>
  );
}