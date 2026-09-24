'use client';

import { useEffect, useState } from 'react';

interface Props {
  phone: string | null;
  email: string | null;
  website: string | null;
}

/**
 * Renders provider contact details for signed-in users,
 * or a sign-in prompt for anonymous visitors.
 * Client-side so the package detail page stays ISR-cacheable.
 */
export function ProviderContact({ phone, email, website }: Props) {
  const [state, setState] = useState<'loading' | 'anon' | 'user'>('loading');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => setState(d.user ? 'user' : 'anon'))
      .catch(() => setState('anon'));
  }, []);

  if (state === 'loading') return null;

  if (state === 'user') {
    return (
      <div className="mt-4 pt-4 border-t border-border space-y-1 text-sm">
        {phone && <p>Phone: {phone}</p>}
        {email && <p>Email: {email}</p>}
        {website && (
          <p>
            Website:{' '}
            <a href={website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              {website}
            </a>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-border text-center">
      <p className="text-sm text-muted-foreground mb-2">
        Sign in to see provider contact details and submit inquiries.
      </p>
      <a href="/login" className="text-primary hover:underline font-medium text-sm">Sign In →</a>
    </div>
  );
}
