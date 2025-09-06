'use client';

import { useEffect, useMemo, useState } from 'react';

type AxgResp =
  | { ok: true; address: string; account: string; decimals: number; balance: string; balanceFormatted: string; usd?: { ok: true; price: number; priceStr: string; value: number; valueStr: string } }
  | { ok: false; error: string };

export default function AXGBalancePill({
  account = process.env.NEXT_PUBLIC_TEST_ACCOUNT || '',
  withUSD = true,
  refreshMs = 20000,
}: {
  account?: string;
  withUSD?: boolean;
  refreshMs?: number;
}) {
  const [data, setData] = useState<AxgResp | null>(null);
  const [loading, setLoading] = useState(true);

  const isAddr = useMemo(() => /^0x[a-fA-F0-9]{40}$/.test(account), [account]);

  useEffect(() => {
    if (!isAddr) { setData({ ok: false, error: 'No account set' }); setLoading(false); return; }

    let stop = false;
    async function load() {
      try {
        const r = await fetch(`/api/axg/balance?account=${account}&withUSD=${withUSD ? '1' : '0'}`, { cache: 'no-store' });
        const j: AxgResp = await r.json();
        if (!stop) setData(j);
      } catch (e: any) {
        if (!stop) setData({ ok: false, error: e?.message || 'Error' });
      } finally {
        if (!stop) setLoading(false);
      }
    }
    load();
    const id = setInterval(load, refreshMs);
    return () => { stop = true; clearInterval(id); };
  }, [account, withUSD, refreshMs, isAddr]);

  if (!isAddr) {
    return <span className="text-xs px-2 py-1 rounded-md border border-zinc-800 text-zinc-500">AXG: (no account)</span>;
  }
  if (loading) {
    return <span className="text-xs px-2 py-1 rounded-md border border-zinc-800 text-zinc-400">AXG: …</span>;
  }
  if (!data?.ok) {
    return <span className="text-xs px-2 py-1 rounded-md border border-zinc-800 text-red-400">AXG: {data?.error || 'error'}</span>;
  }

  const axg = data.balanceFormatted;
  const usd = data.usd?.valueStr;

  return (
    <span className="text-xs px-2 py-1 rounded-md border border-zinc-800 text-zinc-200">
      AXG: {axg}{withUSD && usd ? ` • $${usd}` : ''}
    </span>
  );
}