'use client';

import React, { useEffect, useState } from 'react';

type Feed = {
  address: string;
  desc: string;
  value: number;
  updatedAt: string;
};

export default function AXGPricePill() {
  const [gold, setGold] = useState<Feed | null>(null);
  const [eth, setEth] = useState<Feed | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    try {
      const r = await fetch('/api/axg/price', { cache: 'no-store' });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || `HTTP ${r.status}`);
      setGold(j.gold);
      setEth(j.eth);
    } catch (e: any) {
      setErr(e?.message || 'Error');
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="rounded-lg border border-zinc-800 px-3 py-2 bg-black/30 text-xs">
      {err ? (
        <span className="text-red-400">❌ {err}</span>
      ) : (
        <div className="flex flex-col gap-1">
          {gold && (
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">{gold.desc}</span>
              <span className="text-zinc-200">${gold.value.toFixed(2)}</span>
            </div>
          )}
          {eth && (
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">{eth.desc}</span>
              <span className="text-zinc-200">${eth.value.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}