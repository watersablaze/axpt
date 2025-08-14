// app/dev/portal/StatusChip.tsx
'use client';

import { useState } from 'react';

const A = 'resident.a@example.com';
const B = 'resident.b@example.com';

export default function StatusChip({ currentEmail }: { currentEmail?: string | null }) {
  const [busy, setBusy] = useState(false);

  const go = async (href: string) => {
    try {
      setBusy(true);
      // Navigate by setting window.location so we hit the route and redirect.
      window.location.href = href;
    } finally {
      // no-op; page will navigate
    }
  };

  let label = 'None';
  if (currentEmail === A) label = 'A';
  else if (currentEmail === B) label = 'B';
  else if (currentEmail) label = currentEmail;

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-black/30 px-3 py-1">
        <span className="text-zinc-400">Impersonating:</span>
        <span className="font-medium text-zinc-200">{label}</span>
      </span>
      <button
        onClick={() => go(`/api/dev/impersonate?email=${encodeURIComponent(A)}`)}
        disabled={busy}
        className="rounded-full border border-purple-600/60 hover:border-purple-400 bg-purple-500/10 px-3 py-1"
      >
        Impersonate A
      </button>
      <button
        onClick={() => go(`/api/dev/impersonate?email=${encodeURIComponent(B)}`)}
        disabled={busy}
        className="rounded-full border border-purple-600/60 hover:border-purple-400 bg-purple-500/10 px-3 py-1"
      >
        Impersonate B
      </button>
      <button
        onClick={() => go('/api/dev/impersonate?clear=1')}
        disabled={busy}
        className="rounded-full border border-zinc-700 hover:border-zinc-500 bg-white/5 px-3 py-1"
      >
        Clear
      </button>
    </div>
  );
}