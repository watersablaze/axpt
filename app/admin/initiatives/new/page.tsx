// app/admin/initiatives/new/page.tsx
import { requireElderServer } from '@/lib/auth/requireElderServer';

const STATUSES = ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED'] as const;
const CATEGORIES = ['ENERGY', 'FINTECH', 'DATA', 'SECURITY', 'OTHER'] as const;

export default async function NewInitiativePage() {
  await requireElderServer();

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-semibold">Create Initiative</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Define a new initiative (title, slug, category, status, and summary).
        </p>
        <Form />
      </div>
    </main>
  );
}

// Client island
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

function Form() {
  const router = useRouter();
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState<typeof CATEGORIES[number]>('ENERGY');
  const [status, setStatus] = useState<typeof STATUSES[number]>('ACTIVE');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      const r = await fetch('/api/admin/initiatives', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug, title, summary, category, status }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Failed');
      router.push(`/admin/initiatives/${slug}`);
    } catch (e: any) {
      setMsg(e.message || 'Error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-4">
      <div>
        <label className="block text-sm mb-1">Slug</label>
        <input value={slug} onChange={e=>setSlug(e.target.value)} required
          placeholder="protium"
          className="w-full rounded-lg bg-black/30 border border-zinc-800 px-3 py-2"/>
        <p className="text-xs text-zinc-500 mt-1">Lowercase URL id, e.g. <code>protium</code>.</p>
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
        <textarea value={summary} onChange={e=>setSummary(e.target.value)} required rows={8}
          className="w-full rounded-lg bg-black/30 border border-zinc-800 px-3 py-2"/>
      </div>

      <button disabled={busy}
        className="px-4 py-2 rounded-lg border border-zinc-700 hover:border-purple-500/60">
        {busy ? 'Saving…' : 'Create'}
      </button>
      {msg && <span className="ml-3 text-sm text-zinc-400">{msg}</span>}
    </form>
  );
}