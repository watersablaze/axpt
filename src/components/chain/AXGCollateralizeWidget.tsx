// src/components/chain/AXGCollateralizeWidget.tsx
'use client';

import React from 'react';
import useSWR from 'swr';

const fetcher = (u: string) => fetch(u).then(r => r.json());

export default function AXGCollateralizeWidget({
  defaultEth = 0.1,
  defaultTo = process.env.NEXT_PUBLIC_TEST_ACCOUNT || '',
  className = '',
}: {
  defaultEth?: number;
  defaultTo?: string;
  className?: string;
}) {
  const [eth, setEth] = React.useState<string>(String(defaultEth));
  const [to, setTo] = React.useState<string>(defaultTo);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [txUrl, setTxUrl] = React.useState<string | null>(null);
  const [bypass, setBypass] = React.useState(false);

  const ethAmt = Number(eth);
  const addrOk = /^0x[a-fA-F0-9]{40}$/.test(to.trim());
  const amtOk = Number.isFinite(ethAmt) && ethAmt > 0;

  const { data, error, isLoading } = useSWR(
    amtOk ? `/api/axg/preview?eth=${encodeURIComponent(ethAmt)}&to=${encodeURIComponent(to)}` : null,
    fetcher,
    { refreshInterval: 20_000, revalidateOnFocus: false },
  );

  const axgOut = data?.axg?.out as number | undefined;
  const goldUsd = data?.prices?.goldUsd as number | undefined;
  const ethUsd  = data?.prices?.ethUsd as number | undefined;
  const sym = data?.axg?.symbol || 'AXG';

  async function onDevCollateralize() {
    setBusy(true); setMsg(null); setTxUrl(null);
    try {
      const headers: Record<string, string> = { 'content-type': 'application/json' };
      if (bypass && process.env.NODE_ENV !== 'production') headers['x-dev-bypass'] = '1';

      const r = await fetch('/api/admin/axg/collateralize', {
        method: 'POST',
        headers,
        body: JSON.stringify({ to: to.trim(), ethAmount: ethAmt }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j?.error || `Failed (${r.status})`);
      setMsg(`✅ Minted ~${j.axg?.out?.toFixed?.(6)} ${sym} for ${ethAmt} ETH`);
      setTxUrl(j.txUrl || null);
    } catch (e: any) {
      setMsg(`❌ ${e?.message || 'Error'}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`rounded-lg border border-zinc-800 p-4 ${className}`}>
      <div className="text-sm font-semibold mb-2">Collateralize (preview)</div>

      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <input
          value={to}
          onChange={(e) => setTo(e.target.value.trim())}
          placeholder="Recipient 0x…"
          className={`px-2 py-1.5 rounded-md bg-black/30 border text-sm ${to && !addrOk ? 'border-red-500/70' : 'border-zinc-800'}`}
        />
        <input
          value={eth}
          onChange={(e) => setEth(e.target.value)}
          inputMode="decimal"
          placeholder="ETH amount"
          className={`px-2 py-1.5 rounded-md bg-black/30 border text-sm text-right ${eth && !amtOk ? 'border-red-500/70' : 'border-zinc-800'}`}
        />
      </div>

      <div className="mt-3 text-xs text-zinc-400">
        {isLoading && 'Loading prices…'}
        {error && 'Feed error.'}
        {!isLoading && !error && amtOk && (
          <div className="space-y-0.5">
            <div>ETH/USD: ${typeof ethUsd === 'number' ? ethUsd.toFixed(2) : '—'}</div>
            <div>Gold/USD: ${typeof goldUsd === 'number' ? goldUsd.toFixed(2) : '—'}</div>
            <div>
              You’d receive ≈ <span className="text-zinc-200 font-medium">
                {typeof axgOut === 'number' ? axgOut.toFixed(6) : '—'} {sym}
              </span>
              {' '}for {ethAmt || 0} ETH.
            </div>
          </div>
        )}
      </div>

      {process.env.NODE_ENV !== 'production' && (
        <label className="mt-3 inline-flex items-center gap-2 text-xs text-zinc-400 select-none">
          <input
            type="checkbox"
            checked={bypass}
            onChange={(e) => setBypass(e.target.checked)}
            className="h-3.5 w-3.5 rounded border border-zinc-600 bg-black/40"
          />
          Send dev-bypass header (no auth cookie)
        </label>
      )}

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={onDevCollateralize}
          disabled={!addrOk || !amtOk || busy}
          className="px-3 py-1.5 rounded-md border border-zinc-700 hover:border-purple-500/60 text-sm disabled:opacity-50"
          title="Temporary DEV flow (owner mint)"
        >
          {busy ? 'Submitting…' : 'DEV: Collateralize → mint'}
        </button>
        {txUrl && (
          <a className="text-xs text-blue-400 underline" href={txUrl} target="_blank" rel="noreferrer">
            View tx
          </a>
        )}
      </div>

      {msg && <div className="mt-2 text-xs text-zinc-300">{msg}</div>}
    </div>
  );
}