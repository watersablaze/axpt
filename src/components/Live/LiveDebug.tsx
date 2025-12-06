'use client';

import { useLiveStatus } from '@/lib/live/useLiveStatus';

export default function LiveDebug() {
  const s = useLiveStatus();

  return (
    <pre className="text-xs text-green-400 opacity-60 fixed bottom-4 right-4 p-3 bg-black/40 rounded-md">
      {JSON.stringify(s, null, 2)}
    </pre>
  );
}