// app/portal/projects/submit/submit-form.tsx
'use client';
import { useState } from 'react';
import { ProjectCreateSchema } from '@/lib/validation/project';

export default function SubmitProjectForm() {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [requestedAxg, setRequestedAxg] = useState<number | ''>('');
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setOk(null); setErr(null);
    try {
      const parsed = ProjectCreateSchema.parse({ title, summary, requestedAxg });
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Failed');
      setOk('Project submitted!');
      setTitle(''); setSummary(''); setRequestedAxg('');
    } catch (e: any) {
      setErr(e?.message ?? 'Error');
    } finally { setBusy(false); }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm mb-1">Title</label>
        <input value={title} onChange={e=>setTitle(e.target.value)} required
          className="w-full rounded-lg bg-black/30 border border-zinc-800 px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm mb-1">Summary</label>
        <textarea value={summary} onChange={e=>setSummary(e.target.value)} required
          rows={6}
          className="w-full rounded-lg bg-black/30 border border-zinc-800 px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm mb-1">Requested AXG</label>
        <input type="number" step="0.01" min="0"
          value={requestedAxg}
          onChange={e=>setRequestedAxg(e.target.value ? Number(e.target.value) : '')}
          required
          className="w-full rounded-lg bg-black/30 border border-zinc-800 px-3 py-2" />
      </div>

      <button disabled={busy} className="px-4 py-2 rounded-lg border border-zinc-700 hover:border-purple-500/60">
        {busy ? 'Submitting…' : 'Submit'}
      </button>

      {ok && <p className="text-sm text-emerald-400">{ok}</p>}
      {err && <p className="text-sm text-red-400">{err}</p>}
    </form>
  );
}