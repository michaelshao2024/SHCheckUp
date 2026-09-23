'use client';

import { useState } from 'react';

interface Props {
  packageId: string;
  packageName: string;
  hospitalName: string;
}

export function EscortServiceButton({ packageId, packageName, hospitalName }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId, name, email, phone, preferredDate, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      setDone(true);
    } catch (err: any) {
      setError(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90"
      >
        Interested? Book Medical Escort Service →
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {done ? (
              <div className="text-center py-6">
                <p className="text-4xl mb-3">✅</p>
                <h3 className="text-lg font-semibold mb-2">Request Submitted</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Thank you, {name}. Our team will contact you by email shortly to arrange your medical escort service.
                </p>
                <button onClick={() => setOpen(false)} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
                  Close
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-1">Medical Escort Service</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  {packageName} — {hospitalName}. Leave your details and we will arrange an English-speaking escort for your visit to Shanghai.
                </p>
                <form onSubmit={handleSubmit} className="space-y-3">
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
                  )}
                  <div>
                    <label className="block text-sm font-medium mb-1">Name *</label>
                    <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email *</label>
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone / WhatsApp</label>
                    <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Preferred Date</label>
                    <input type="date" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Message</label>
                    <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3}
                      placeholder="Anything we should know? (group size, language, special needs...)"
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setOpen(false)}
                      className="flex-1 px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted">
                      Cancel
                    </button>
                    <button type="submit" disabled={submitting}
                      className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                      {submitting ? 'Submitting...' : 'Confirm'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
