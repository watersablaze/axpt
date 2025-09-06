'use client';

import React, { useEffect, useState } from 'react';

export default function AXGDepositSimulator() {
  const [eth, setEth] = useState('0.05');
  const [out, setOut] = useState<{ expectedAxg: number; minOutAxg: number } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function preview() {
    setBusy(true); setMsg(null);
    try {
      const r = await fetch(`/api/axg/preview?eth=${encodeURIComponent(eth)}`, { cache: 'no-store' });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || `HTTP ${r.status}`);
      setOut({ expectedAxg: j.expectedAxg, minOutAxg: j.minOutAxg });
    } catch (e: any) {
      setMsg(e?.message || 'Error'); setOut(null);
    } finally { setBusy(false); }
  }

  useEffect(() => { preview(); /* auto on mount */ }, []);

  return (
    <div className="rounded-lg border border-zinc-800 p-3">
      <div className="text-sm font-medium text-zinc-200">AXG Deposit Simulator</div>
      <div className="mt-2 flex items-center gap-2">
        <input
          value={eth}
          onChange={(e)=>setEth(e.target.value)}
          className="w-28 px-2 py-1.5 rounded-md bg-black/30 border border-zinc-800 text-sm"
          placeholder="0.05"
        />
        <button
          onClick={preview}
          disabled={busy}
          className="px-3 py-1.5 rounded-md border border-zinc-700 hover:border-purple-500/60 text-sm disabled:opacity-50"
        >
          {busy ? 'Loading…' : 'Preview'}
        </button>
      </div>
      {msg && <div className="mt-2 text-xs text-red-400">{msg}</div>}
      {out && (
        <div className="mt-2 text-xs text-zinc-400">
          ~ Expected AXG: <span className="text-zinc-200">{out.expectedAxg.toFixed(6)}</span> ·
          Suggested minOut: <span className="text-zinc-200">{out.minOutAxg.toFixed(6)}</span>
        </div>
      )}
    </div>
  );
}