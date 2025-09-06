'use client';

import { useEffect, useMemo, useState } from 'react';

type RespUSD = {
  ok: true;
  source: 'env' | 'env-default';
  price: number;
  priceStr: string;
  value: number;
  valueStr: string;
};

type Resp = {
  ok: boolean;
  error?: string;
  address?: string;
  account?: string;
  decimals?: number;
  balance?: string;          // bigint as string
  balanceFormatted?: string; // human
  usd?: RespUSD;
};

function cn(...xs: (string | false | undefined)[]) {
  return xs.filter(Boolean).join(' ');
}

export default function PRTBalancePill({
  account,
  withUSD = false,
  refreshMs = 6000,
  className,
}: {
  account: string;
  withUSD?: boolean;
  refreshMs?: number;
  className?: string;
}) {
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(false);

  const isAddr = useMemo(() => /^0x[a-fA-F0-9]{40}$/.test((account || '').trim()), [account]);

  async function load() {
    if (!isAddr) return;
    setLoading(true);
    try {
      const qs = new URLSearchParams({ account, withUSD: withUSD ? '1' : '0' }).toString();
      const r = await fetch(`/api/protium/balance?${qs}`, { cache: 'no-store' });
      const j: Resp = await r.json();
      setData(j);
    } catch (e) {
      setData({ ok: false, error: 'Failed to load' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    if (!refreshMs) return;
    const t = setInterval(load, refreshMs);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, withUSD, refreshMs, isAddr]);

  const bal = data?.balanceFormatted ?? '0.0';
  const usd = data?.usd?.valueStr;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-black/40 px-3 py-1.5',
        className
      )}
      title={data?.address ? `PRT @ ${data.address}` : 'PRT'}
    >
      <span className="text-[10px] font-semibold tracking-wide text-zinc-400">PRT</span>
      <span className="text-sm font-semibold text-zinc-200 tabular-nums">
        {loading ? '…' : bal}
      </span>
      {withUSD && (
        <span className="text-[11px] text-zinc-500 tabular-nums">
          {loading ? '' : `$${usd ?? '0.00'}`}
        </span>
      )}
      {!isAddr && (
        <span className="ml-2 text-[10px] text-amber-400">set NEXT_PUBLIC_TEST_ACCOUNT</span>
      )}
    </div>
  );
}