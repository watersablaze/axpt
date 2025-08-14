// app/admin/projects/review-action.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ReviewActions, type ReviewAction } from '@/lib/projects/constants';

export default function ReviewAction({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [action, setAction] = useState<ReviewAction>('APPROVE');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/projects/${projectId}/review`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action, note }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || 'Failed');

      setMsg('Saved');
      setNote('');
      try {
        router.refresh();
      } catch {
        window.location.reload();
      }
    } catch (e: any) {
      setMsg(e?.message || 'Error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select
        value={action}
        onChange={(e) => setAction(e.target.value as ReviewAction)}
        className="px-2 py-1 rounded-md bg-black/30 border border-zinc-800 text-sm"
        aria-label="Review action"
        disabled={busy}
      >
        {ReviewActions.map((opt) => (
          <option key={opt} value={opt}>
            {opt === 'APPROVE' ? 'Approve'
              : opt === 'DENY' ? 'Deny'
              : 'Request info'}
          </option>
        ))}
      </select>

      <input
        placeholder="Optional note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="flex-1 min-w-[220px] px-2 py-1 rounded-md bg-black/30 border border-zinc-800 text-sm"
        aria-label="Reviewer note (optional)"
        disabled={busy}
      />

      <button
        onClick={submit}
        disabled={busy}
        className="px-3 py-1.5 rounded-lg border border-zinc-700 hover:border-purple-500/60 text-sm disabled:opacity-60"
      >
        {busy ? 'Saving…' : 'Apply'}
      </button>

      {msg && (
        <span className="text-xs text-zinc-400" aria-live="polite" role="status">
          {msg}
        </span>
      )}
    </div>
  );
}