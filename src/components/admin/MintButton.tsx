'use client';

import { useMemo, useState } from 'react';

type Props = {
  defaultTo?: string;       // e.g. process.env.NEXT_PUBLIC_TEST_ACCOUNT
  defaultAmount?: number;   // whole tokens
  className?: string;
};

const isHexAddress = (a: string) => /^0x[a-fA-F0-9]{40}$/.test((a || '').trim());

function shortenHash(h?: string, n = 6) {
  if (!h || h.length < 2 * n + 2) return h || '';
  return `${h.slice(0, n + 2)}…${h.slice(-n)}`;
}

export default function MintButton({ defaultTo = '', defaultAmount = 1000, className = '' }: Props) {
  // safe default: only prefill if valid 0x…
  const safeDefault = useMemo(() => (isHexAddress(defaultTo) ? defaultTo : ''), [defaultTo]);

  const [to, setTo] = useState<string>(safeDefault);
  const [amountStr, setAmountStr] = useState<string>(String(defaultAmount));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txUrl, setTxUrl] = useState<string | null>(null);
  const [devBypass, setDevBypass] = useState(false);

  // validation
  const isAddr = useMemo(() => isHexAddress(to), [to]);
  const amountTokens = useMemo(() => {
    const n = Number(amountStr);
    return Number.isFinite(n) && n > 0 ? n : NaN;
  }, [amountStr]);
  const amountValid = Number.isFinite(amountTokens) && amountTokens > 0;

  const canSubmit = isAddr && amountValid && !busy;

  async function onMint() {
    setBusy(true);
    setMsg(null);
    setTxHash(null);
    setTxUrl(null);
    try {
      const headers: Record<string, string> = { 'content-type': 'application/json' };
      if (devBypass && process.env.NODE_ENV !== 'production') headers['x-dev-bypass'] = '1';

      const r = await fetch('/api/admin/protium/mint', {
        method: 'POST',
        headers,
        body: JSON.stringify({ to: to.trim(), amountTokens: Number(amountTokens) }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) throw new Error(j?.error || `Mint failed (${r.status})`);

      setTxHash(j.txHash || null);
      setTxUrl(j.txUrl || (j.txHash ? `https://sepolia.etherscan.io/tx/${j.txHash}` : null));
      setMsg(`✅ Minted ${j.amountTokens ?? amountTokens} ${j.symbol ?? 'PRT'} to ${to.slice(0, 10)}…`);
    } catch (e: any) {
      setMsg(`❌ ${e?.message || 'Error'}`);
    } finally {
      setBusy(false);
    }
  }

  const addrErr = to && !isAddr ? 'Address must be 0x + 40 hex chars.' : null;
  const amtErr = amountStr && !amountValid ? 'Enter a positive number.' : null;

  return (
    <div className={`inline-flex flex-col gap-2 ${className}`}>
      <div className="flex flex-col gap-2 rounded-lg border border-zinc-800 p-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-400">Recipient (0x…)</label>
          <input
            value={to}
            onChange={(e) => setTo(e.target.value.trim())}
            placeholder="0x0000… (wallet address)"
            spellCheck={false}
            className={`w-full rounded-md bg-black/30 px-3 py-2 text-sm outline-none transition-colors ${
              addrErr ? 'border border-red-600/60' : 'border border-zinc-800 focus:border-purple-500/60'
            }`}
          />
          {addrErr && <div className="text-xs text-red-400 mt-0.5">{addrErr}</div>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-400">Amount (whole tokens)</label>
          <input
            inputMode="decimal"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            className={`w-full rounded-md bg-black/30 px-3 py-2 text-sm outline-none transition-colors ${
              amtErr ? 'border border-red-600/60' : 'border border-zinc-800 focus:border-purple-500/60'
            }`}
          />
          {amtErr && <div className="text-xs text-red-400 mt-0.5">{amtErr}</div>}
        </div>

        {process.env.NODE_ENV !== 'production' && (
          <label className="inline-flex items-center gap-2 text-xs text-zinc-400 select-none">
            <input
              type="checkbox"
              checked={devBypass}
              onChange={(e) => setDevBypass(e.target.checked)}
              className="h-3.5 w-3.5 rounded border border-zinc-600 bg-black/40"
            />
            Send dev-bypass header (no auth cookie)
          </label>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={onMint}
            disabled={!canSubmit}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
              canSubmit
                ? 'border border-zinc-700 hover:border-purple-500/60'
                : 'border border-zinc-800 text-zinc-500 cursor-not-allowed'
            }`}
            title={!isAddr ? 'Enter a valid address' : !amountValid ? 'Enter a valid amount' : 'Mint PRT'}
          >
            {busy ? 'Minting…' : 'Mint'}
          </button>

          {txHash && (
            <span className="text-xs text-zinc-400">
              Tx:{' '}
              {txUrl ? (
                <a
                  href={txUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-dotted underline-offset-4 hover:text-zinc-200"
                >
                  {shortenHash(txHash)}
                </a>
              ) : (
                shortenHash(txHash)
              )}
            </span>
          )}
        </div>

        {msg && <div className="text-xs text-zinc-300">{msg}</div>}
      </div>
    </div>
  );
}