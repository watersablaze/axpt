// src/components/admin/MintAxgButton.tsx
'use client';

import React, { useMemo, useState } from 'react';

function isHexAddress(a: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(a.trim());
}

export default function MintAxgButton({
  defaultTo = '',
  defaultAmount = 100,
}: {
  defaultTo?: string;
  defaultAmount?: number;
}) {
  const [to, setTo] = useState(defaultTo);
  const [amount, setAmount] = useState<number | string>(defaultAmount);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const validAddr = useMemo(() => isHexAddress(to), [to]);
  const validAmt = useMemo(() => {
    const n = Number(amount);
    return Number.isFinite(n) && n > 0;
  }, [amount]);

  async function onMint() {
    setBusy(true);
    setMsg(null);
    setTxHash(null);
    try {
      const r = await fetch('/api/admin/axg/mint', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ to: to.trim(), amountTokens: Number(amount) }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || 'Mint failed');
      setTxHash(j.txHash);
      setMsg(`✅ Minted ${j.amountTokens} ${j.symbol} to ${j.to.slice(0,6)}…${j.to.slice(-4)}`);
    } catch (e: any) {
      setMsg(`❌ ${e?.message || 'Error'}`);
    } finally {
      setBusy(false);
    }
  }

  const etherscan = txHash ? `https://sepolia.etherscan.io/tx/${txHash}` : null;
  const isAddr = validAddr;
  const addrErr = to.length > 0 && !isAddr ? 'Address must be 0x + 40 hex chars.' : null;
  const amtErr  = String(amount).length > 0 && !validAmt ? 'Enter a positive number' : null;

  return (
    <div className="rounded-lg border border-zinc-800 p-4">
      <div className="text-sm font-semibold mb-2">Mint test AXG</div>

      <div className="grid gap-2 sm:grid-cols-[1fr_120px]">
        <div className="flex flex-col">
          <input
            value={to}
            onChange={(e) => setTo(e.target.value.trim())}
            placeholder="Recipient 0x…"
            className={`px-2 py-1.5 rounded-md bg-black/30 border text-sm
              ${addrErr ? 'border-red-500/70 focus:outline-red-500' : 'border-zinc-800'}`}
          />
          {addrErr && <div className="text-[11px] text-red-400 mt-1">{addrErr}</div>}
        </div>

        <div className="flex flex-col">
          <input
            type="number"
            step="1"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            className={`px-2 py-1.5 rounded-md bg-black/30 border text-sm text-right
              ${amtErr ? 'border-red-500/70 focus:outline-red-500' : 'border-zinc-800'}`}
          />
          {amtErr && <div className="text-[11px] text-red-400 mt-1">{amtErr}</div>}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={onMint}
          disabled={busy || !validAddr || !validAmt}
          className="px-3 py-1.5 rounded-md border border-zinc-700 hover:border-purple-500/60 text-sm disabled:opacity-50"
          title={!validAddr ? 'Enter a valid address' : !validAmt ? 'Enter a valid amount' : 'Mint AXG'}
        >
          {busy ? 'Minting…' : 'Mint AXG'}
        </button>

        {msg && <span className="text-xs text-zinc-400">{msg}</span>}
        {etherscan && (
          <a
            href={etherscan}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-400 underline"
          >
            View tx
          </a>
        )}
      </div>
    </div>
  );
}