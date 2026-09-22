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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <a href="/" className="text-xl font-bold text-primary">Shanghai HealthFinder</a>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {!loaded ? null : user ? (
            <>
              <span className="text-foreground">{user.name || user.email}</span>
              {user.role === 'admin' && (
                <a href="/admin" className="hover:text-foreground font-medium text-primary">Admin</a>
              )}
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
