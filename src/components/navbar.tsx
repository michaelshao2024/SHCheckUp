'use client';

import { useEffect, useState } from 'react';

interface Me {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export function Navbar() {
  const [user, setUser] = useState<Me | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => setUser(d.user ?? null))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    window.location.href = '/';
  };

  return (
    <nav className="border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-16 py-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <a href="/" className="text-lg sm:text-xl font-bold text-primary shrink-0">Shanghai HealthFinder</a>
        <div className="flex items-center gap-3 sm:gap-4 text-sm text-muted-foreground flex-wrap justify-end">
          {!loaded ? null : user ? (
            <>
              {user.role === 'admin' && (
                <a href="/admin" className="hover:text-foreground font-medium text-primary">Admin Dashboard</a>
              )}
              <span className="text-foreground max-w-32 sm:max-w-none truncate">{user.name || user.email}</span>
              <button onClick={handleLogout} className="hover:text-foreground">Sign Out</button>
            </>
          ) : (
            <>
              <a href="/login" className="hover:text-foreground">Sign In</a>
              <a href="/register" className="hover:text-foreground">Register</a>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
