'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function FundButton({ projectId, amount }: { projectId: string; amount: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onFund() {
    if (busy) return;
    const ok = window.confirm(`Fund this project with ${amount.toFixed(2)} AXG?`);
    if (!ok) return;

    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/projects/${projectId}/fund`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || 'Funding failed');

      setMsg('Funded ✓');
      try {
        router.refresh();
      } catch {
        window.location.reload();
      }
    } catch (e: any) {
      setMsg(e.message || 'Error');
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(null), 2500);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onFund}
        disabled={busy}
        className="px-3 py-1.5 rounded-lg border border-emerald-700 hover:border-emerald-500/70 text-sm disabled:opacity-60"
        title="Mint/transfer AXG and mark project as FUNDED"
      >
        {busy ? 'Funding…' : 'Fund'}
      </button>
      {msg && <span className="text-xs text-zinc-400">{msg}</span>}
    </div>
  );
}