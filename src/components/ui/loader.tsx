// app/src/components/ui/loader.tsx
'use client';

import { Loader2 } from 'lucide-react';

export function Loader({ label = 'Loading...', size = 32 }: { label?: string; size?: number }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-gray-500 animate-pulse">
      <Loader2 className="animate-spin" width={size} height={size} />
      <span className="mt-3 text-sm">{label}</span>
    </div>
  );
}