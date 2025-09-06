'use client';

import React, { useEffect, useMemo, useState } from 'react';

type Status = {
  ok: boolean;
  address: string;
  decimals: number;
  symbol: string;
  totalSupplyWei: string;
  requiredRedeemEthWei: string;
  excessCollateralWei: string;
  contractEthBalanceWei: string;
  collateralRatioBps: string;
  reserve: { ratioFloatApprox: number; healthy: boolean };
};

export default function AXGReserveBar({ className = '' }: { className?: string }) {
  const [st, setSt] = useState<Status | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    try {
      const r = await fetch('/api/axg/status', { cache: 'no-store' });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || `HTTP ${r.status}`);
      setSt(j);
    } catch (e: any) {
      setErr(e?.message || 'Error');
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 15_000);
    return () => clearInterval(t);
  }, []);

  const ratio = st?.reserve?.ratioFloatApprox ?? 0;
  const pct = Math.max(0, Math.min(100, Math.round(ratio * 100)));
  const color = ratio >= 1.1 ? 'bg-green-600' : ratio >= 1.0 ? 'bg-amber-500' : 'bg-red-600';

  return (
    <div className={`rounded-lg border border-zinc-800 p-3 ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <div className="text-zinc-400">AXG Reserve Coverage</div>
        <div className={`font-medium ${ratio >= 1 ? 'text-green-400' : 'text-red-400'}`}>{pct}%</div>
      </div>
      <div className="mt-2 h-2 w-full bg-zinc-800 rounded">
        <div className={`h-2 rounded ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2 text-[11px] text-zinc-500">
        {err ? <span className="text-red-400">Error: {err}</span> : (
          <>
            Collateral ratio target: {(Number(st?.collateralRatioBps || '15000')/100).toFixed(2)}% ·
            Required ETH for redemptions: {Number(st?.requiredRedeemEthWei || 0)/1e18} ·
            Contract ETH: {Number(st?.contractEthBalanceWei || 0)/1e18}
          </>
        )}
      </div>
    </div>
  );
}