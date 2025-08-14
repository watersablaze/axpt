// app/admin/initiatives/[slug]/update-composer.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UpdateComposer({ slug }: { slug: string }) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function postUpdate() {
    setBusy(true); setMsg(null);
    try {
      const r = await fetch(`/api/admin/initiatives/${slug}/updates`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Failed');
      setContent('');
      setMsg('Posted.');
      router.refresh();
    } catch (e: any) {
      setMsg(e.message || 'Error posting');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={5}
        placeholder="Share a progress note…"
        className="w-full rounded-lg bg-black/30 border border-zinc-800 px-3 py-2 text-sm"
      />
      <div className="flex items-center gap-2">
        <button
          onClick={postUpdate}
          disabled={busy || !content.trim()}
          className="px-3 py-1.5 rounded-md border border-zinc-700 hover:border-purple-500/60 text-sm"
        >
          {busy ? 'Posting…' : 'Post Update'}
        </button>
        {msg && <span className="text-xs text-zinc-400">{msg}</span>}
      </div>
    </div>
  );
}