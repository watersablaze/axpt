'use client';

import { useState } from 'react';

type Req = { id: string; symbol: string; name: string; status: string; createdAt: string; approvedTokenId: string | null };

export default function IssuanceRow({ r }: { r: Req }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const approve = async () => {
    const proposalId = prompt('Proposal ID (optional; required if enforcing):') || undefined;
    try {
      setLoading(true);
      setMsg(null);
      const res = await fetch('/api/governance/issuance/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: r.id, proposalId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Approve failed');
      setMsg('Approved ✓ — token minted/linked.');
    } catch (e: any) {
      setMsg(e.message || 'Approve failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-800 px-3 py-2">
      <div className="flex items-center justify-between">
        <div className="font-medium">{r.symbol} — {r.name}</div>
        <span className="text-xs text-zinc-400">{r.status}</span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <button
          onClick={approve}
          disabled={loading}
          className="text-xs rounded-md border border-emerald-500/50 px-3 py-1 hover:bg-emerald-500/10 disabled:opacity-50"
        >
          {loading ? 'Approving…' : 'Approve'}
        </button>
        {msg && <span className="text-xs text-zinc-400">{msg}</span>}
      </div>
    </div>
  );
}