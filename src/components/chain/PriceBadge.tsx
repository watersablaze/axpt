'use client';

import { useEffect, useMemo, useState } from 'react';

type PriceResponse =
  | { ok: true; price: number; priceStr: string; updatedAt: number; description: string }
  | { ok: false; error: string };

function timeAgo(seconds: number) {
  const now = Math.floor(Date.now() / 1000);
  const diff = Math.max(0, now - seconds);
  if (diff < 60) return `${diff}s ago`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

export default function PriceBadge() {
  const [data, setData] = useState<PriceResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // simple polling (60s) – safe for a tiny badge
  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      try {
        const r = await fetch('/api/chain/price', { cache: 'no-store' });
        const j = (await r.json()) as PriceResponse;
        if (alive) setData(j);
      } catch (e: any) {
        if (alive) setData({ ok: false, error: e?.message || 'Network error' });
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    const t = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const content = useMemo(() => {
    if (loading && !data) return 'Loading price…';
    if (!data) return 'No data';
    if (!data.ok) return `Price error: ${data.error}`;
    const pretty = Number.isFinite(data.price) ? data.price.toFixed(2) : data.priceStr;
    return `ETH/USD: $${pretty} (updated ${timeAgo(data.updatedAt)})`;
  }, [data, loading]);

  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/40 px-2.5 py-1 text-xs text-zinc-300">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      {content}
    </span>
  );
}