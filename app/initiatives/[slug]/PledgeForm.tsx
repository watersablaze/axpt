// app/initiatives/[slug]/PledgeForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PledgeForm({ slug, disabled }: { slug: string; disabled?: boolean }) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  const numericAmount = Number(amount);
  const validAmount = Number.isFinite(numericAmount) && numericAmount > 0;

  async function submit() {
    if (!validAmount || disabled) return;
    setBusy(true); setMsg(null);
    try {
      // ⚠️ Ensure this route exists: /api/initiatives/[slug]/fund
      // If your only route lives under /api/admin/..., change this path accordingly.
      const r = await fetch(`/api/initiatives/${slug}/fund`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ amount: numericAmount, note }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Failed to submit pledge');
      setMsg('Thank you! Pledge recorded.');
      setAmount(''); setNote('');
      router.refresh();
    } catch (e: any) {
      setMsg(e?.message || 'Error submitting pledge');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min="0.01"
        step="0.01"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount AXG"
        className="w-[140px] px-2 py-1 rounded-md bg-black/30 border border-zinc-800 text-sm"
        disabled={disabled || busy}
      />
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note (optional)"
        className="flex-1 min-w-[200px] px-2 py-1 rounded-md bg-black/30 border border-zinc-800 text-sm"
        disabled={disabled || busy}
      />
      <button
        type="button"
        onClick={submit}
        disabled={busy || !validAmount || disabled}
        className="px-3 py-1.5 rounded-md border border-zinc-700 hover:border-purple-500/60 text-sm disabled:opacity-60"
      >
        {busy ? 'Submitting…' : 'Pledge'}
      </button>
      {msg && <span className="text-xs text-zinc-400">{msg}</span>}
    </div>
  );
}