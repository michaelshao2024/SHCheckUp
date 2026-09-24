'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold mb-2">Forgot Password</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Enter your account email and we will send you a link to reset your password.
      </p>

      {sent ? (
        <div className="bg-white rounded-lg border border-border p-6 text-center">
          <p className="text-4xl mb-3">📧</p>
          <p className="text-sm mb-4">
            If an account exists for <strong>{email}</strong>, a reset link has been sent. Please check your inbox (and spam folder). The link expires in 1 hour.
          </p>
          <Link href="/login" className="text-primary hover:underline text-sm font-medium">
            Back to Sign In →
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-border p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="you@example.com"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
          <p className="text-center text-sm">
            <Link href="/login" className="text-muted-foreground hover:text-primary">
              ← Back to Sign In
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
