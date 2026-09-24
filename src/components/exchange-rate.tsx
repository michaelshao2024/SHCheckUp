'use client';

import { useEffect, useState } from 'react';

interface RateState {
  usdPerCny: number;
  updated: string; // ISO date string
}

/**
 * Shows the latest CNY -> USD exchange rate (fetched client-side from a
 * free rate API). Renders nothing until the rate loads; hides on failure.
 */
export function ExchangeRate() {
  const [rate, setRate] = useState<RateState | null>(null);

  useEffect(() => {
    fetch('https://open.er-api.com/v6/latest/CNY')
      .then((r) => r.json())
      .then((d) => {
        const usd = d?.rates?.USD;
        if (typeof usd === 'number') {
          setRate({
            usdPerCny: usd,
            updated: d.time_last_update_utc ? new Date(d.time_last_update_utc).toISOString().slice(0, 10) : '',
          });
        }
      })
      .catch(() => {});
  }, []);

  if (!rate) return null;

  return (
    <p className="text-xs text-muted-foreground mt-2">
      Exchange rate: ¥1 CNY ≈ ${rate.usdPerCny.toFixed(4)} USD
      {rate.updated && <span> · updated {rate.updated}</span>}
    </p>
  );
}
