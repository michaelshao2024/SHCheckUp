'use client';

import { useState, useEffect } from 'react';

export function GdprBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('gdpr-consent');
    if (!consent) setVisible(true);
  }, []);

  const acceptAll = () => {
    localStorage.setItem('gdpr-consent', 'all');
    setVisible(false);
  };

  const acceptEssential = () => {
    localStorage.setItem('gdpr-consent', 'essential');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-50">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          This site uses essential cookies for operation. We also use analytics cookies to improve your experience.
          <a href="/privacy" className="underline ml-1">Learn more</a>
        </p>
        <div className="flex gap-2">
          <button onClick={acceptEssential} className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted">
            Essential Only
          </button>
          <button onClick={acceptAll} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}