// app/onboard/investor/loading.tsx
'use client';

import OrbAnimation from '@/components/shared/OrbAnimation';

export default function InvestorLoading() {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-black">
      <OrbAnimation className="w-[160px] h-[160px] opacity-80" />
      <p className="text-purple-300 text-sm mt-4">Stabilizing dashboard interface...</p>
    </div>
  );
}