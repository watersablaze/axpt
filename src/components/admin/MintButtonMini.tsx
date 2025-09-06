'use client';

import React, { useMemo, useState } from 'react';

const isHexAddress = (a: string) => /^0x[a-fA-F0-9]{40}$/.test((a || '').trim());

export default function MintButtonMini({
  endpoint,                          // e.g. "/api/admin/protium/mint" or "/api/admin/axg/mint"
  defaultTo = process.env.NEXT_PUBLIC_TEST_ACCOUNT || '',
  defaultAmount = 100,
  label = 'Mint',
}: {
  endpoint: string;
  defaultTo?: string;
  defaultAmount?: number;
  label?: string;
}) {
  // safe default: only prefill if valid 0x…
  const safeDefault = useMemo(() => (isHexAddress(defaultTo) ? defaultTo : ''), [defaultTo]);

  const [to, setTo] = useState(safeDefault);
  const [amount, setAmount] = useState<number | string>(defaultAmount);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const addrOk = useMemo(() => isHexAddress(to), [to]);
  const amtOk = useMemo(() => {
    const n = Number(amount);
    return Number.isFinite(n) && n > 0;
  }, [amount]);

  async function mint() {
    setBusy(true);
    setMsg(null);
    setTxHash(null);
    try {
      const r = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ to: (to || '').trim(), amountTokens: Number(amount) }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j?.error || 'Mint failed');
      setTxHash(j.txHash || null);
      setMsg(`✅ ${j.amountTokens ?? Number(amount)} ${j.symbol ?? ''} → ${j.to.slice(0, 6)}…${j.to.slice(-4)}`);
    } catch (e: any) {
      setMsg(`❌ ${e?.message || 'Error'}`);
    } finally {
      setBusy(false);
    }
  }

  const etherscan = txHash ? `https://sepolia.etherscan.io/tx/${txHash}` : null;
  const showAddrErr = (to || '').length > 0 && !addrOk;
  const showAmtErr = String(amount).length > 0 && !amtOk;

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-col">
        <input
          value={to}
          onChange={(e) => setTo(e.target.value.trim())}
          placeholder="0x… recipient"
          spellCheck={false}
          className={`w-[280px] px-2 py-1.5 rounded-md border text-sm bg-black/30
            ${showAddrErr ? 'border-red-500/70 focus:outline-red-500' : 'border-zinc-700 focus:border-purple-500/60'}`}
        />
        {showAddrErr && (
          <span className="text-[11px] text-red-400 mt-1">Address must be 0x + 40 hex chars.</span>
        )}
      </div>

      <div className="flex flex-col">
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          type="number"
          min={1}
          step={1}
          className={`w-[100px] px-2 py-1.5 rounded-md border text-sm bg-black/30 text-right
            ${showAmtErr ? 'border-red-500/70 focus:outline-red-500' : 'border-zinc-700 focus:border-purple-500/60'}`}
        />
        {showAmtErr && <span className="text-[11px] text-red-400 mt-1">Enter a positive number.</span>}
      </div>

      <button
        onClick={mint}
        disabled={busy || !addrOk || !amtOk}
        className="px-3 py-1.5 rounded-md border border-zinc-700 hover:border-purple-500/60 text-sm disabled:opacity-50"
        title={!addrOk ? 'Enter a valid address' : !amtOk ? 'Enter a valid amount' : label}
      >
        {busy ? 'Minting…' : label}
      </button>

      {msg && <span className="text-xs text-zinc-400">{msg}</span>}
      {etherscan && (
        <a className="text-xs text-blue-400 underline" target="_blank" rel="noreferrer" href={etherscan}>
          View tx
        </a>
      )}
    </div>
  );
}