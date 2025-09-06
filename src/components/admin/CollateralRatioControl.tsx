'use client';

import React, { useMemo, useState } from 'react';

export default function CollateralRatioControl({
  currentBps,
}: { currentBps: number | null }) {
  const [val, setVal] = useState<string>(currentBps ? String(currentBps) : '15000');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [tx, setTx] = useState<string | null>(null);
  const bps = useMemo(() => Number(val), [val]);
  const ok = Number.isInteger(bps) && bps >= 10000 && bps <= 30000;

  async function submit() {
    setBusy(true); setMsg(null); setTx(null);
    try {
      const r = await fetch('/api/admin/axg/set-collateral-ratio', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(process.env.NODE_ENV !== 'production' ? { 'x-dev-bypass': '1' } : {}),
        },
        body: JSON.stringify({ bps }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || `HTTP ${r.status}`);
      setMsg(`✅ Updated to ${j.collateralRatioBps / 100}%`);
      setTx(j.txUrl || null);
    } catch (e: any) {
      setMsg(`❌ ${e?.message || 'Error'}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-zinc-800 p-3">
      <div className="text-sm font-medium text-zinc-200">Collateral Target</div>
      <div className="mt-2 flex items-center gap-2">
        <input
          value={val}
          onChange={(e)=>setVal(e.target.value)}
          className={`w-28 px-2 py-1.5 rounded-md bg-black/30 border text-sm ${
            ok ? 'border-zinc-800' : 'border-red-600/60'
          }`}
          placeholder="15000"
        />
        <span className="text-xs text-zinc-500">bps (10000 = 100%)</span>
        <button
          onClick={submit}
          disabled={!ok || busy}
          className="px-3 py-1.5 rounded-md border border-zinc-700 hover:border-purple-500/60 text-sm disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Update'}
        </button>
      </div>
      {msg && (
        <div className="mt-2 text-xs">
          {tx ? <a className="text-blue-400 underline" href={tx} target="_blank" rel="noreferrer">{msg}</a> : <span className="text-zinc-300">{msg}</span>}
        </div>
      )}
    </div>
  );
}