'use client';

import React, { useMemo, useState } from 'react';
import { ethers } from 'ethers';

// Minimal ABI for deposit
const AXG_ABI = [
  'function depositAndMint(address to, uint256 minAxgOut) payable returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
] as const;

declare global {
  interface Window { ethereum?: any; }
}

const isHexAddress = (a: string) => /^0x[a-fA-F0-9]{40}$/.test((a || '').trim());

export default function AXGDepositButton({
  defaultTo = '',
  defaultEth = '0.1', // ETH
  className = '',
}: {
  defaultTo?: string;
  defaultEth?: string;
  className?: string;
}) {
  const [to, setTo] = useState(defaultTo);
  const [ethStr, setEthStr] = useState(defaultEth);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const validAddr = useMemo(() => isHexAddress(to), [to]);
  const validEth  = useMemo(() => {
    try { return ethers.parseUnits(ethStr || '0', 18) > 0n; } catch { return false; }
  }, [ethStr]);

  async function onDeposit() {
    try {
      setBusy(true);
      setMsg(null);
      setTxHash(null);

      if (!window.ethereum) throw new Error('No wallet found');
      if (!validAddr || !validEth) throw new Error('Invalid input');

      // 1) Get preview & minOut from server
      const p = await fetch(`/api/axg/preview?eth=${encodeURIComponent(ethStr)}`).then(r => r.json());
      if (!p?.ok) throw new Error(p?.error || 'Preview failed');

      const axgAddr = process.env.NEXT_PUBLIC_AXG_ADDRESS || process.env.AXG_TOKEN_ADDRESS;
      if (!axgAddr || !isHexAddress(axgAddr)) throw new Error('AXG address missing/invalid');

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer   = await provider.getSigner();

      const c = new ethers.Contract(axgAddr, AXG_ABI, signer);

      const ethWei    = ethers.parseUnits(ethStr, 18);
      const minAxgOut = BigInt(p.recommended?.minAxgOutWei || '0');

      // 2) deposit tx
      const tx = await c.depositAndMint(to.trim(), minAxgOut, { value: ethWei });
      setTxHash(tx.hash);
      await tx.wait();

      setMsg(`✅ Deposited ${ethStr} ETH → minted AXG`);
    } catch (e: any) {
      setMsg(`❌ ${e?.message || 'Error'}`);
    } finally {
      setBusy(false);
    }
  }

  const canSubmit = validAddr && validEth && !busy;
  const etherscan = txHash ? `https://sepolia.etherscan.io/tx/${txHash}` : null;

  return (
    <div className={`rounded-lg border border-zinc-800 p-3 flex flex-col gap-2 ${className}`}>
      <div className="text-sm font-semibold">Deposit ETH → Mint AXG</div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="flex flex-col">
          <input
            value={to}
            onChange={e => setTo(e.target.value)}
            placeholder="Recipient 0x…"
            className={`px-2 py-1.5 rounded-md border text-sm bg-black/30 ${validAddr ? 'border-zinc-700' : 'border-red-500/70'}`}
          />
          {!validAddr && <span className="text-[11px] text-red-400 mt-1">Address must be 0x + 40 hex chars.</span>}
        </div>

        <div className="flex flex-col">
          <input
            value={ethStr}
            onChange={e => setEthStr(e.target.value)}
            placeholder="ETH (e.g. 0.1)"
            className={`px-2 py-1.5 rounded-md border text-sm bg-black/30 ${validEth ? 'border-zinc-700' : 'border-red-500/70'}`}
          />
          {!validEth && <span className="text-[11px] text-red-400 mt-1">Enter a positive amount.</span>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onDeposit}
          disabled={!canSubmit}
          className={`px-3 py-1.5 rounded-md text-sm ${canSubmit ? 'border border-zinc-700 hover:border-purple-500/60' : 'border border-zinc-800 text-zinc-500 cursor-not-allowed'}`}
        >
          {busy ? 'Depositing…' : 'Deposit & Mint'}
        </button>

        {txHash && (
          <a
            className="text-xs text-blue-400 underline"
            href={etherscan!}
            target="_blank"
            rel="noreferrer"
          >
            View tx
          </a>
        )}
      </div>

      {msg && <div className="text-xs text-zinc-300">{msg}</div>}
    </div>
  );
}