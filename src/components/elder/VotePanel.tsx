'use client';

import { useState } from 'react';

export default function VotePanel({ proposalId }: { proposalId: string }) {
  const [loading, setLoading] = useState<'yes' | 'no' | 'abstain' | null>(null);
  const send = async (choice: 'yes' | 'no' | 'abstain') => {
    try {
      setLoading(choice);
      const res = await fetch('/api/governance/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId, choice }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Vote failed');
      alert('Vote recorded.');
    } catch (e: any) {
      alert(e.message || 'Vote failed');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="mt-4 flex gap-2">
      {(['yes','no','abstain'] as const).map(c => (
        <button
          key={c}
          onClick={() => send(c)}
          disabled={loading !== null}
          className="text-xs rounded-md border border-purple-500/50 px-3 py-1 hover:bg-purple-500/10 disabled:opacity-50"
        >
          {loading === c ? 'Sending…' : c.toUpperCase()}
        </button>
      ))}
    </div>
  );
}