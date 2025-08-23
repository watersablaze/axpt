'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type TokenResp =
  | { ok: true; symbol: string; name: string; decimals: number; totalSupply: string }
  | { ok: false; error: string };

type BalResp =
  | { ok: true; account: string; balance: string } // balance as decimal string
  | { ok: false; error: string };

function shorten(addr: string) {
  return addr.length > 10 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}

export default function PrtBalancePill({ account }: { account?: string }) {
  const [addr, setAddr] = useState<string | null>(account ?? null);
  const [symbol, setSymbol] = useState<string>('PRT');
  const [decimals, setDecimals] = useState<number>(18); // safe default
  const [human, setHuman] = useState<string>('0.00');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const hasEth = typeof window !== 'undefined' && (window as any).ethereum;

  // Load token metadata once
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch('/api/chain/token', { cache: 'no-store' });
        const j = (await r.json()) as TokenResp;
        if (!alive) return;
        if (j.ok) {
          setSymbol(j.symbol || 'PRT');
          setDecimals(j.decimals ?? 18);
        } else {
          setError(j.error || 'Token metadata error');
        }
      } catch (e: any) {
        if (alive) setError(e?.message || 'Token metadata error');
      }
    })();
    return () => { alive = false; };
  }, []);

  const loadBalance = useCallback(async (a: string) => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/chain/balance?account=${a}`, { cache: 'no-store' });
      const j = (await r.json()) as BalResp;
      if (!j.ok) throw new Error((j as any).error || 'Balance fetch failed');
      // Balance comes back as a decimal string (already shifted by decimals in our API design).
      const num = Number(j.balance);
      const pretty = Number.isFinite(num) ? num.toFixed(2) : j.balance;
      setHuman(pretty);
    } catch (e: any) {
      setError(e?.message || 'Balance error');
      setHuman('0.00');
    } finally {
      setLoading(false);
    }
  }, []);

  // If no prop account, try to read existing wallet selection (no popup)
  useEffect(() => {
    if (addr || !hasEth) return;
    (async () => {
      try {
        const accs = await (window as any).ethereum.request({ method: 'eth_accounts' });
        if (Array.isArray(accs) && accs[0]) {
          setAddr(accs[0]);
        }
      } catch { /* ignore */ }
    })();
  }, [addr, hasEth]);

  // Load balance whenever we have an address
  useEffect(() => {
    if (!addr) {
      setLoading(false);
      return;
    }
    loadBalance(addr);
  }, [addr, loadBalance]);

  const biddingLimit = useMemo(() => human, [human]); // 1:1 for now

  async function connect() {
    setError(null);
    try {
      const accs = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      if (Array.isArray(accs) && accs[0]) {
        setAddr(accs[0]);
      }
    } catch (e: any) {
      setError(e?.message || 'Wallet connection rejected');
    }
  }

  const rightContent = addr ? (
    <span className="text-zinc-400">{shorten(addr)}</span>
  ) : hasEth ? (
    <button
      onClick={connect}
      className="rounded border border-zinc-700 px-2 py-0.5 hover:border-purple-500/60"
    >
      Connect
    </button>
  ) : (
    <span className="text-zinc-500">No wallet</span>
  );

  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/40 px-2.5 py-1 text-xs text-zinc-300">
      <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
      {loading ? (
        <span>PRT: loading…</span>
      ) : error ? (
        <span className="text-rose-300">PRT error: {error}</span>
      ) : (
        <>
          <span>PRT: <span className="text-zinc-100">{human}</span></span>
          <span className="text-zinc-500">•</span>
          <span>Bidding limit: <span className="text-zinc-100">{biddingLimit}</span></span>
        </>
      )}
      <span className="text-zinc-500">•</span>
      {rightContent}
      {addr && (
        <>
          <span className="text-zinc-500">•</span>
          <button
            onClick={() => loadBalance(addr)}
            className="rounded border border-zinc-700 px-2 py-0.5 hover:border-purple-500/60"
          >
            Refresh
          </button>
        </>
      )}
    </div>
  );
}