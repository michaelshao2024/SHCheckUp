'use client';

import { Suspense, useState, useEffect, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { parseHospitalImages, serializeHospitalImages } from '@/lib/hospital-images';

interface HospitalFormData {
  name: string;
  nameCn: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  description: string;
  isActive: boolean;
  jciAccredited: boolean;
}

// Keep total serialized photo payload under ~1.6MB so it fits comfortably in the
// imageUrl text column and one request body.
const MAX_TOTAL_IMAGE_CHARS = 1_600_000;
const MAX_IMAGES = 8;

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
    isActive: true,
    jciAccredited: false,
  });
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
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
        isActive: hospital.isActive !== false,
        jciAccredited: hospital.jciAccredited === true,
      });
      setImages(parseHospitalImages(hospital.imageUrl));
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

  // Compress one file client-side: max 1200px wide, JPEG q0.8 -> small data URL
  function compressFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Could not read file'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Could not decode image'));
        img.onload = () => {
          const MAX_W = 1200;
          const scale = Math.min(1, MAX_W / img.width);
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Canvas not supported'));
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = String(reader.result);
      };
      reader.readAsDataURL(file);
    });
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    // allow re-selecting the same file(s) later
    e.target.value = '';
    if (files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      let next = [...images];
      for (const file of files) {
        if (next.length >= MAX_IMAGES) {
          setError(`You can upload up to ${MAX_IMAGES} photos.`);
          break;
        }
        const dataUrl = await compressFile(file);
        const projectedTotal =
          [...next, dataUrl].reduce((sum, s) => sum + s.length, 0);
        if (projectedTotal > MAX_TOTAL_IMAGE_CHARS) {
          setError(
            'Total photo size is too large after compression. Remove a photo or choose smaller images.'
          );
          break;
        }
        next = [...next, dataUrl];
      }
      setImages(next);
    } catch {
      setError('One of the images could not be processed. Please try another file.');
    } finally {
      setUploading(false);
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function moveImage(index: number, dir: -1 | 1) {
    setImages((prev) => {
      const target = index + dir;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
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
        body: JSON.stringify({ ...form, imageUrl: serializeHospitalImages(images) }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save hospital');
      }

      setSuccess(isEditing ? 'Hospital updated successfully!' : 'Hospital created successfully!');

      if (!isEditing) {
        setForm({ name: '', nameCn: '', address: '', phone: '', email: '', website: '', description: '', isActive: true, jciAccredited: false });
        setImages([]);
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

          {/* Photos */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Photos</label>
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                {images.map((src, i) => (
                  <div key={i} className="relative group rounded-lg border border-border overflow-hidden bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Photo ${i + 1}`} className="w-full aspect-[4/3] object-cover" />
                    {i === 0 && (
                      <span className="absolute top-1 left-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary text-primary-foreground">
                        Cover
                      </span>
                    )}
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/45 px-1.5 py-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <div className="flex gap-1">
                        <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0}
                          aria-label="Move left"
                          className="text-white text-xs px-1.5 py-0.5 rounded hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed">←</button>
                        <button type="button" onClick={() => moveImage(i, 1)} disabled={i === images.length - 1}
                          aria-label="Move right"
                          className="text-white text-xs px-1.5 py-0.5 rounded hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed">→</button>
                      </div>
                      <button type="button" onClick={() => removeImage(i)}
                        aria-label="Remove photo"
                        className="text-white text-xs px-1.5 py-0.5 rounded hover:bg-red-500/70">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {images.length < MAX_IMAGES && (
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} disabled={uploading}
                className="w-full text-sm text-muted-foreground file:mr-3 file:px-3 file:py-2 file:border file:border-border file:rounded-lg file:text-sm file:bg-muted file:hover:bg-muted/80 file:cursor-pointer disabled:opacity-50" />
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {uploading ? 'Processing image…' : `JPG/PNG, up to ${MAX_IMAGES} photos, compressed automatically. The first photo (Cover) leads the gallery on the public page.`}
            </p>
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

          {/* JCI accreditation */}
          <label className="flex items-center gap-3 py-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.jciAccredited}
              onChange={(e) => setForm(prev => ({ ...prev, jciAccredited: e.target.checked }))}
              className="w-4 h-4 accent-amber-500"
            />
            <span className="text-sm">
              <span className="font-medium">JCI Accredited</span>
              <span className="text-muted-foreground"> — show the JCI (Joint Commission International) badge on this hospital</span>
            </span>
          </label>

                    {/* Visibility */}
          <label className="flex items-center gap-3 py-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!form.isActive}
              onChange={(e) => setForm(prev => ({ ...prev, isActive: !e.target.checked }))}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-sm">
              <span className="font-medium">Hidden from public site</span>
              <span className="text-muted-foreground"> — hidden hospitals and their packages do not appear in search or on public pages</span>
            </span>
          </label>

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