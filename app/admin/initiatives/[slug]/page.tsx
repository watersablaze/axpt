// app/admin/initiatives/[slug]/page.tsx
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireElderServer } from '@/lib/auth/requireElderServer';
import UpdateComposer from './update-composer';

const STATUSES = ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED'] as const;
const CATEGORIES = ['ENERGY', 'FINTECH', 'DATA', 'SECURITY', 'OTHER'] as const;

async function getFundingTotal(initiativeId: string) {
  const agg = await prisma.initiativeFunding.aggregate({
    where: { initiativeId },
    _sum: { amount: true },
  });
  return (agg._sum.amount as any)?.toNumber?.() ?? Number(agg._sum.amount) ?? 0;
}

export default async function AdminInitiativeEditPage({ params }: { params: { slug: string } }) {
  await requireElderServer();

  const initiative = await prisma.initiative.findUnique({
    where: { slug: params.slug },
    select: {
      id: true, slug: true, title: true, summary: true,
      status: true, category: true, createdAt: true, updatedAt: true,
      updates: { select: { id: true, content: true, createdAt: true }, orderBy: { createdAt: 'desc' } }
    },
  });

  if (!initiative) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="max-w-4xl mx-auto px-6 py-12">Not found.</div>
      </main>
    );
  }

  const pledged = await getFundingTotal(initiative.id);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Edit Initiative</h1>
          <Link href="/admin/initiatives" prefetch={false}
            className="text-xs px-3 py-1.5 rounded-md border border-zinc-700 hover:border-purple-500/60">
            ← Back
          </Link>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {/* Edit form */}
          <section className="rounded-xl border border-zinc-800 p-4">
            <h2 className="text-lg font-semibold">Details</h2>
            <EditForm initiative={initiative} />
            <div className="text-xs text-zinc-500 mt-3">
              Updated {new Date(initiative.updatedAt).toLocaleString()}
            </div>
          </section>

          {/* Funding + composer */}
          <section className="rounded-xl border border-zinc-800 p-4">
            <h2 className="text-lg font-semibold">Pledged</h2>
            <div className="text-2xl font-semibold mt-1">{pledged.toFixed(2)} AXG</div>
            <div className="mt-6">
              <h3 className="text-sm font-semibold mb-2">Post Update</h3>
              <UpdateComposer slug={initiative.slug} />
            </div>
          </section>
        </div>

        {/* Updates */}
        <section className="mt-8 rounded-xl border border-zinc-800 p-4">
          <h2 className="text-lg font-semibold">Updates</h2>
          <div className="mt-3 space-y-3">
            {initiative.updates.length === 0 && (
              <div className="text-sm text-zinc-500">No updates yet.</div>
            )}
            {initiative.updates.map(u => (
              <div key={u.id} className="rounded-lg border border-zinc-800 p-3">
                <div className="text-xs text-zinc-500">{new Date(u.createdAt).toLocaleString()}</div>
                <div className="text-sm mt-1 text-zinc-200 whitespace-pre-wrap">{u.content}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

// -------- client edit form -----------
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

function EditForm({
  initiative,
}: {
  initiative: {
    slug: string;
    title: string;
    summary: string;
    status: typeof STATUSES[number];
    category: typeof CATEGORIES[number];
  };
}) {
  const router = useRouter();
  const [slug, setSlug] = useState(initiative.slug);
  const [title, setTitle] = useState(initiative.title);
  const [summary, setSummary] = useState(initiative.summary);
  const [category, setCategory] = useState<typeof CATEGORIES[number]>(initiative.category);
  const [status, setStatus] = useState<typeof STATUSES[number]>(initiative.status);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      const r = await fetch(`/api/admin/initiatives/${initiative.slug}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug, title, summary, category, status }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Failed');
      if (slug !== initiative.slug) {
        router.push(`/admin/initiatives/${slug}`);
      } else {
        router.refresh();
      }
      setMsg('Saved.');
    } catch (e: any) {
      setMsg(e.message || 'Error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-4">
      <div>
        <label className="block text-sm mb-1">Slug</label>
        <input value={slug} onChange={e=>setSlug(e.target.value)} required
          className="w-full rounded-lg bg-black/30 border border-zinc-800 px-3 py-2"/>
      </div>
      <div>
        <label className="block text-sm mb-1">Title</label>
        <input value={title} onChange={e=>setTitle(e.target.value)} required
          className="w-full rounded-lg bg-black/30 border border-zinc-800 px-3 py-2"/>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1">Category</label>
          <select value={category} onChange={e=>setCategory(e.target.value as any)}
            className="w-full rounded-lg bg-black/30 border border-zinc-800 px-3 py-2">
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Status</label>
          <select value={status} onChange={e=>setStatus(e.target.value as any)}
            className="w-full rounded-lg bg-black/30 border border-zinc-800 px-3 py-2">
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm mb-1">Summary</label>
        <textarea value={summary} onChange={e=>setSummary(e.target.value)} rows={8}
          className="w-full rounded-lg bg-black/30 border border-zinc-800 px-3 py-2"/>
      </div>

      <button disabled={busy}
        className="px-4 py-2 rounded-lg border border-zinc-700 hover:border-purple-500/60">
        {busy ? 'Saving…' : 'Save'}
      </button>
      {msg && <span className="ml-3 text-sm text-zinc-400">{msg}</span>}
    </form>
  );
}