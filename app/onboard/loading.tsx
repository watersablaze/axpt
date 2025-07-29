// app/onboard/loading.tsx
'use client';

import OrbAnimation from '@/components/shared/OrbAnimation';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <OrbAnimation className="w-40 h-40" />
    </div>
  );
}