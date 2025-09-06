'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UpdateComposer({ slug }: { slug: string }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody]   = useState('');
  const [busy, setBusy]   = useState(false);
  const [msg, setMsg]     = useState<string | null>(null);

  async function postUpdate() {
    if (!body.trim()) { setMsg('Body is required'); return; }
    setBusy(true); setMsg(null);
    try {
      const r = await fetch(`/api/admin/initiatives/${slug}/updates`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || undefined,
          body: body.trim(),
        }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || 'Failed to post');
      setTitle(''); setBody('');
      setMsg('Posted.');
      router.refresh();
    } catch (e: any) {
      setMsg(e?.message || 'Error posting');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Title (optional)"
        className="w-full rounded-lg bg-black/30 border border-zinc-800 px-3 py-2 text-sm"
        disabled={busy}
      />
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        rows={5}
        placeholder="Body (required)"
        className="w-full rounded-lg bg-black/30 border border-zinc-800 px-3 py-2 text-sm"
        disabled={busy}
      />
      <div className="flex items-center gap-2">
        <button
          onClick={postUpdate}
          disabled={busy || !body.trim()}
          className="px-3 py-1.5 rounded-md border border-zinc-700 hover:border-purple-500/60 text-sm"
        >
          {busy ? 'Posting…' : 'Post Update'}
        </button>
        {msg && <span className="text-xs text-zinc-400">{msg}</span>}
      </div>
    </div>
  );
}