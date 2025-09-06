'use client';

import React, { useEffect, useState } from 'react';

type Status = {
  ok: boolean;
  address: string;
  symbol: string;
  totalSupplyWei: string;
  contractEthBalanceWei: string;
  requiredRedeemEthWei: string;
  collateralRatioBps: string;
  reserve: { ratioFloatApprox: number; healthy: boolean };
};

export default function AXGStatusTile() {
  const [s, setS] = useState<Status | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    try {
      const r = await fetch('/api/axg/status', { cache: 'no-store' });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || `HTTP ${r.status}`);
      setS(j);
    } catch (e: any) {
      setErr(e?.message || 'Error');
    }
  }

  useEffect(() => { load(); const t = setInterval(load, 15_000); return () => clearInterval(t); }, []);

  const healthy = s?.reserve?.healthy;
  const pct = Math.round((s?.reserve?.ratioFloatApprox ?? 0) * 100);

  return (
    <div className={`rounded-lg border p-3 ${healthy ? 'border-zinc-800' : 'border-red-600/60'} bg-black/30`}>
      <div className="flex items-center justify-between text-sm">
        <div className="text-zinc-300">AXG Status</div>
        <div className={`${healthy ? 'text-green-400' : 'text-red-400'} text-xs`}>{pct}% reserve</div>
      </div>
      {err ? (
        <div className="mt-2 text-xs text-red-400">Error: {err}</div>
      ) : (
        <div className="mt-2 text-[11px] text-zinc-500 grid gap-1">
          <div>Address: {s?.address}</div>
          <div>Collateral target: {Number(s?.collateralRatioBps ?? '15000')/100}%</div>
          <div>Req. ETH for redemptions: {Number(s?.requiredRedeemEthWei ?? 0)/1e18}</div>
          <div>Contract ETH: {Number(s?.contractEthBalanceWei ?? 0)/1e18}</div>
        </div>
      )}
    </div>
  );
}