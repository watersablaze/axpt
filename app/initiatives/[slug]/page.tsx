// app/initiatives/[slug]/page.tsx
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

const axgFmt = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

async function getFundingTotal(initiativeId: string) {
  const agg = await prisma.initiativeFunding.aggregate({
    where: { initiativeId },
    _sum: { amount: true },
  });
  return (agg._sum.amount as any)?.toNumber?.() ?? Number(agg._sum.amount) ?? 0;
}

export default async function InitiativePublicDetailPage({
  params,
}: { params: { slug: string } }) {
  const initiative = await prisma.initiative.findUnique({
    where: { slug: params.slug },
    select: {
      id: true, slug: true, title: true, summary: true, status: true, category: true, createdAt: true,
      updates: {
        orderBy: { createdAt: 'desc' },
        select: { id: true, content: true, createdAt: true }
      }
    }
  });

  if (!initiative) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="max-w-3xl mx-auto px-6 py-12">Not found.</div>
      </main>
    );
  }

  const total = await getFundingTotal(initiative.id);
  const isActive = initiative.status === 'ACTIVE';

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-4">
          <Link href="/initiatives" className="text-xs text-zinc-400 hover:text-zinc-200 underline underline-offset-4">
            ← Back to initiatives
          </Link>
        </div>

        <h1 className="text-2xl font-semibold">{initiative.title}</h1>
        <div className="text-sm text-zinc-400 mt-1">
          {initiative.category} • {initiative.status} • Created {new Date(initiative.createdAt).toLocaleString()}
        </div>

        <p className="mt-4 text-sm text-zinc-200 whitespace-pre-wrap">{initiative.summary}</p>

        {/* Progress + Pledge */}
        <div className="mt-6 rounded-lg border border-zinc-800 p-4">
          <div className="text-sm text-zinc-400">Total pledged</div>
          <div className="text-xl font-semibold">{axgFmt.format(total)} AXG</div>
          <div className="mt-3">
            <PledgeForm slug={initiative.slug} disabled={!isActive} />
          </div>
          {!isActive && (
            <p className="text-xs text-amber-400 mt-2">
              This initiative is not active for pledges.
            </p>
          )}
          <p className="text-xs text-zinc-500 mt-2">
            You may need to be signed in as a resident to pledge; otherwise the API will return 401.
          </p>
        </div>

        {/* Updates */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Updates</h2>
          <div className="mt-3 space-y-3">
            {initiative.updates.length === 0 && (
              <div className="text-sm text-zinc-500">No updates yet.</div>
            )}
            {initiative.updates.map(u => (
              <div key={u.id} className="rounded-lg border border-zinc-800 p-3">
                <div className="text-xs text-zinc-500">
                  {new Date(u.createdAt).toLocaleString()}
                </div>
                <div className="text-sm mt-1 text-zinc-200 whitespace-pre-wrap">{u.content}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

// client island
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

function PledgeForm({ slug, disabled }: { slug: string; disabled?: boolean }) {
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
      const r = await fetch(`/api/initiatives/${slug}/fund`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ amount: numericAmount, note }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Failed');
      setMsg('Thank you! Pledge recorded.');
      setAmount(''); setNote('');
      router.refresh();
    } catch (e: any) {
      setMsg(e.message || 'Error submitting pledge');
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
        onChange={e => setAmount(e.target.value)}
        placeholder="Amount AXG"
        className="w-[140px] px-2 py-1 rounded-md bg-black/30 border border-zinc-800 text-sm"
        disabled={disabled || busy}
      />
      <input
        value={note}
        onChange={e => setNote(e.target.value)}
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