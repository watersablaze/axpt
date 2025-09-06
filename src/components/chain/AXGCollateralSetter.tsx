'use client';

import React, { useMemo, useState } from 'react';

export default function AXGCollateralSetter() {
  const [bpsStr, setBpsStr] = useState('1500'); // 150% default
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txUrl, setTxUrl] = useState<string | null>(null);
  const [devBypass, setDevBypass] = useState(false);

  const bps = useMemo(() => {
    const n = Number(bpsStr);
    return Number.isInteger(n) ? n : NaN;
  }, [bpsStr]);

  const valid = Number.isInteger(bps) && bps >= 1000 && bps <= 5000;

  async function submit() {
    setBusy(true);
    setMsg(null);
    setTxHash(null);
    setTxUrl(null);
    try {
      const headers: Record<string,string> = { 'content-type': 'application/json' };
      if (devBypass && process.env.NODE_ENV !== 'production') headers['x-dev-bypass'] = '1';

      const r = await fetch('/api/admin/axg/set-collateral', {
        method: 'POST',
        headers,
        body: JSON.stringify({ bps }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setTxHash(j.txHash || null);
      setTxUrl(j.txUrl || null);
      setMsg(`✅ Target collateral set to ${bps} bps (${(bps/10).toFixed(1)}%).`);
    } catch (e: any) {
      setMsg(`❌ ${e?.message || 'Error'}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-zinc-800 p-4 bg-black/30">
      <div className="text-sm font-semibold mb-2">Set Target Collateral (bps)</div>
      <div className="flex items-center gap-2">
        <input
          value={bpsStr}
          onChange={(e) => setBpsStr(e.target.value.replace(/\D/g, ''))}
          inputMode="numeric"
          placeholder="1500"
          className={`w-[120px] px-2 py-1.5 rounded-md border text-sm bg-black/30 text-right ${
            !valid ? 'border-red-500/70 focus:outline-red-500' : 'border-zinc-700'
          }`}
        />
        <span className="text-xs text-zinc-400">{Number.isFinite(bps) ? `${(bps/10).toFixed(1)}%` : ''}</span>
        <button
          onClick={submit}
          disabled={busy || !valid}
          className="px-3 py-1.5 rounded-md border border-zinc-700 hover:border-purple-500/60 text-sm disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>

      {process.env.NODE_ENV !== 'production' && (
        <label className="inline-flex items-center gap-2 text-xs text-zinc-400 mt-2 select-none">
          <input
            type="checkbox"
            checked={devBypass}
            onChange={(e) => setDevBypass(e.target.checked)}
            className="h-3.5 w-3.5 rounded border border-zinc-600 bg-black/40"
          />
          Send dev-bypass header (for cURL / no-cookie)
        </label>
      )}

      <div className="mt-2 text-xs">
        {msg && <div className="text-zinc-300">{msg}</div>}
        {txUrl && (
          <a className="text-blue-400 underline" href={txUrl} target="_blank" rel="noreferrer">
            View tx
          </a>
        )}
      </div>
    </div>
  );
}